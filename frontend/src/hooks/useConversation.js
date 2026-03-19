import { useState, useRef, useCallback } from "react";

/**
 * useConversation — Hook for managing conversational migration chat with SSE streaming.
 *
 * State: messages[], isStreaming, sessionId, error, streamingContent
 *
 * Uses fetch() with ReadableStream reader for SSE (POST-based, not EventSource).
 *
 * Message format:
 *   { role: "user"|"assistant", content: string, timestamp: number,
 *     proposals?: [{ file, code, changes, confidence, risks }] }
 */
export function useConversation() {
  var _messages = useState([]);
  var messages = _messages[0];
  var setMessages = _messages[1];

  var _isStreaming = useState(false);
  var isStreaming = _isStreaming[0];
  var setIsStreaming = _isStreaming[1];

  var _sessionId = useState(null);
  var sessionId = _sessionId[0];
  var setSessionId = _sessionId[1];

  var _error = useState(null);
  var error = _error[0];
  var setError = _error[1];

  var _streamingContent = useState("");
  var streamingContent = _streamingContent[0];
  var setStreamingContent = _streamingContent[1];

  var abortRef = useRef(null);

  // ── createSession ──────────────────────────────────────────────
  var createSession = useCallback(function (metadata) {
    setError(null);
    var controller = new AbortController();
    abortRef.current = controller;

    return fetch("/api/conversation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(metadata || {}),
      signal: controller.signal,
    })
      .then(function (r) {
        if (!r.ok) throw new Error("Failed to create session (" + r.status + ")");
        return r.json();
      })
      .then(function (data) {
        var id = data.sessionId || data.id || data.session_id;
        setSessionId(id);
        return id;
      })
      .catch(function (err) {
        if (err.name !== "AbortError") {
          setError(err.message || "Error creating session");
        }
        return null;
      });
  }, []);

  // ── sendMessage ────────────────────────────────────────────────
  var sendMessage = useCallback(
    function (content) {
      if (!sessionId || !content || !content.trim()) return;

      setError(null);

      // Add user message immediately
      var userMsg = {
        role: "user",
        content: content.trim(),
        timestamp: Date.now(),
      };
      setMessages(function (prev) {
        return prev.concat([userMsg]);
      });

      setIsStreaming(true);
      setStreamingContent("");

      var controller = new AbortController();
      abortRef.current = controller;

      var accumulated = "";
      var proposals = [];

      fetch("/api/conversation/" + sessionId + "/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim() }),
        signal: controller.signal,
      })
        .then(function (response) {
          if (!response.ok)
            throw new Error("Error sending message (" + response.status + ")");

          var reader = response.body.getReader();
          var decoder = new TextDecoder();
          var buffer = "";

          function read() {
            return reader.read().then(function (result) {
              if (result.done) {
                // Stream finished — finalize assistant message
                var assistantMsg = {
                  role: "assistant",
                  content: accumulated,
                  timestamp: Date.now(),
                };
                if (proposals.length > 0) {
                  assistantMsg.proposals = proposals;
                }
                setMessages(function (prev) {
                  return prev.concat([assistantMsg]);
                });
                setStreamingContent("");
                setIsStreaming(false);
                return;
              }

              buffer += decoder.decode(result.value, { stream: true });
              var lines = buffer.split("\n");
              buffer = lines.pop() || "";

              for (var i = 0; i < lines.length; i++) {
                var line = lines[i].trim();
                if (!line || !line.startsWith("data:")) continue;
                var payload = line.slice(5).trim();
                if (payload === "[DONE]") continue;

                try {
                  var parsed = JSON.parse(payload);

                  if (parsed.type === "token" || parsed.type === "text") {
                    accumulated += parsed.content || parsed.text || "";
                    setStreamingContent(accumulated);
                  } else if (parsed.type === "proposal") {
                    proposals.push(parsed.data || parsed.proposal || parsed);
                  } else if (parsed.type === "done") {
                    // Server signals completion
                    if (parsed.content) accumulated = parsed.content;
                    var finalMsg = {
                      role: "assistant",
                      content: accumulated,
                      timestamp: Date.now(),
                    };
                    if (proposals.length > 0) {
                      finalMsg.proposals = proposals;
                    }
                    setMessages(function (prev) {
                      return prev.concat([finalMsg]);
                    });
                    setStreamingContent("");
                    setIsStreaming(false);
                    return;
                  } else if (parsed.type === "error") {
                    setError(parsed.message || "Streaming error");
                    setIsStreaming(false);
                    return;
                  }
                } catch (_e) {
                  // Not JSON — treat as raw token
                  accumulated += payload;
                  setStreamingContent(accumulated);
                }
              }

              return read();
            });
          }

          return read();
        })
        .catch(function (err) {
          if (err.name === "AbortError") {
            // User cancelled — save partial content if any
            if (accumulated) {
              setMessages(function (prev) {
                return prev.concat([
                  {
                    role: "assistant",
                    content: accumulated + "\n\n_(cancelled)_",
                    timestamp: Date.now(),
                  },
                ]);
              });
            }
          } else {
            setError(err.message || "Connection error");
          }
          setStreamingContent("");
          setIsStreaming(false);
        });
    },
    [sessionId]
  );

  // ── cancelStream ───────────────────────────────────────────────
  var cancelStream = useCallback(function () {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  }, []);

  // ── clearMessages ──────────────────────────────────────────────
  var clearMessages = useCallback(function () {
    setMessages([]);
    setStreamingContent("");
    setError(null);
  }, []);

  return {
    messages: messages,
    isStreaming: isStreaming,
    streamingContent: streamingContent,
    sessionId: sessionId,
    error: error,
    sendMessage: sendMessage,
    createSession: createSession,
    cancelStream: cancelStream,
    clearMessages: clearMessages,
  };
}
