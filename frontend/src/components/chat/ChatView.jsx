import React, { useEffect, useRef, useState, useCallback } from "react";
import { useConversation } from "../../hooks/useConversation.js";
import ChatMessage from "./ChatMessage.jsx";
import ChatInput from "./ChatInput.jsx";

/**
 * ChatView — Main conversational migration panel.
 *
 * Props: { T, dark, t (translations), files, sL, sV, tL, tV, mod, onFilesMigrated, userName }
 *
 * - Composes useConversation hook + ChatMessage + ChatInput
 * - Layout: header + scrollable messages + input
 * - Auto-scroll to latest message
 * - Streaming indicator with animated dots
 * - Creates session on mount with file metadata
 * - Auto-sends initial greeting
 * - Handles proposal approve/reject flows
 */

function ChatView(props) {
  var T = props.T;
  var dark = props.dark;
  var t = props.t || {};
  var files = props.files || [];
  var sL = props.sL || "";
  var sV = props.sV || "";
  var tL = props.tL || "";
  var tV = props.tV || "";
  var mod = props.mod || "";
  var onFilesMigrated = props.onFilesMigrated;
  var userName = props.userName || "User";

  var conv = useConversation();
  var messages = conv.messages;
  var isStreaming = conv.isStreaming;
  var streamingContent = conv.streamingContent;
  var sessionId = conv.sessionId;
  var error = conv.error;
  var sendMessage = conv.sendMessage;
  var createSession = conv.createSession;
  var cancelStream = conv.cancelStream;
  var clearMessages = conv.clearMessages;

  var messagesEndRef = useRef(null);
  var containerRef = useRef(null);
  var initializedRef = useRef(false);

  var _rejectTarget = useState(null);
  var rejectTarget = _rejectTarget[0];
  var setRejectTarget = _rejectTarget[1];

  // ── Initialize session on mount ────────────────────────────
  useEffect(function () {
    if (initializedRef.current) return;
    initializedRef.current = true;

    // Send full file objects (name + content) so the AI can actually read the code
    var fileData = files.map(function (f) {
      return { name: f.name || f.n || "file", content: f.content || "" };
    });

    createSession({
      sourceLanguage: sL,
      sourceVersion: sV,
      targetLanguage: tL,
      targetVersion: tV,
      model: mod,
      files: fileData,
    }).then(function (id) {
      if (id) {
        // Build a greeting that lists the files
        var fileList = fileData.map(function (f) { return f.name; }).join(", ");
        var greeting =
          "Hola! Tengo " +
          files.length +
          " archivo" +
          (files.length !== 1 ? "s" : "") +
          " en " +
          sL +
          (sV ? " " + sV : "") +
          " que necesito migrar a " +
          tL +
          (tV ? " " + tV : "") +
          ": " + fileList +
          ". Por favor analiza el código y proponme la migración archivo por archivo.";
        sendMessage(greeting);
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-scroll ────────────────────────────────────────────
  useEffect(function () {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, streamingContent]);

  // ── Proposal handlers ─────────────────────────────────────
  var handleApproveProposal = useCallback(
    function (proposal) {
      var fileName = proposal.file || "archivo";
      sendMessage(
        "Aprobado: " + fileName + ". Continua con el siguiente."
      );
    },
    [sendMessage]
  );

  var handleRejectProposal = useCallback(function (proposal) {
    setRejectTarget(proposal);
  }, []);

  var handleRejectSubmit = useCallback(
    function (reason) {
      if (rejectTarget) {
        var fileName = rejectTarget.file || "archivo";
        sendMessage(
          "Rechazado: " +
            fileName +
            ". Razon: " +
            reason +
            ". Por favor, genera una nueva propuesta."
        );
        setRejectTarget(null);
      }
    },
    [rejectTarget, sendMessage]
  );

  // ── New conversation ───────────────────────────────────────
  var handleNewConversation = useCallback(function () {
    clearMessages();
    initializedRef.current = false;
  }, [clearMessages]);

  // ── Styles ─────────────────────────────────────────────────
  var panelStyle = {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    background: T.bg,
    borderRadius: 12,
    overflow: "hidden",
    border: "1px solid " + T.bdL,
    boxShadow: T.shadowSm,
  };

  var headerStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 20px",
    background: dark ? "rgba(255,255,255,.03)" : T.w,
    borderBottom: "1px solid " + T.bdL,
    flexShrink: 0,
  };

  var headerTitleStyle = {
    display: "flex",
    alignItems: "center",
    gap: 10,
  };

  var titleTextStyle = {
    fontSize: 14,
    fontWeight: 700,
    color: T.tx,
    fontFamily: T.ui,
  };

  var modelBadgeStyle = {
    padding: "2px 8px",
    borderRadius: 6,
    fontSize: 9,
    fontWeight: 600,
    fontFamily: T.ui,
    background: "linear-gradient(135deg, #6C5CE7, #A29BFE)",
    color: "#fff",
    letterSpacing: ".02em",
  };

  var newChatBtnStyle = {
    padding: "6px 14px",
    borderRadius: 8,
    border: "1px solid " + T.bd,
    background: "transparent",
    color: T.txM,
    fontSize: 11,
    fontWeight: 600,
    fontFamily: T.ui,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    transition: "all .2s ease",
  };

  var messagesAreaStyle = {
    flex: 1,
    overflowY: "auto",
    padding: "20px 20px 8px",
    display: "flex",
    flexDirection: "column",
  };

  var typingStyle = {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "8px 0",
    marginLeft: 42,
    fontSize: 12,
    color: T.txM,
    fontFamily: T.ui,
    fontStyle: "italic",
  };

  var dotStyle = function (delay) {
    return {
      width: 5,
      height: 5,
      borderRadius: "50%",
      background: T.bl,
      animation: "pulse 1.2s ease-in-out " + delay + "s infinite",
    };
  };

  var errorStyle = {
    margin: "8px 20px",
    padding: "10px 14px",
    background: T.errBg,
    border: "1px solid " + T.errBd,
    borderRadius: 8,
    color: T.r,
    fontSize: 12,
    fontFamily: T.ui,
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    gap: 8,
  };

  var emptyStateStyle = {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    color: T.txD,
    fontFamily: T.ui,
    textAlign: "center",
    padding: 40,
  };

  // ── Reject modal ───────────────────────────────────────────
  var rejectModalOverlay = {
    position: "fixed",
    inset: 0,
    zIndex: 1000,
    background: T.modalBg,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    animation: "fadeIn .2s ease",
  };

  var rejectModalCard = {
    background: T.w,
    borderRadius: 14,
    padding: 24,
    width: 420,
    maxWidth: "90vw",
    boxShadow: T.shadowLg,
    border: "1px solid " + T.bdL,
  };

  // ── Render ─────────────────────────────────────────────────
  return React.createElement("div", { style: panelStyle },
    // Injected keyframes
    React.createElement("style", {
      dangerouslySetInnerHTML: {
        __html:
          "@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}" +
          "@keyframes pulse{0%,100%{opacity:.3}50%{opacity:.9}}" +
          "@keyframes cursorBlink{0%,100%{opacity:1}50%{opacity:0}}",
      },
    }),

    // ── Header ───────────────────────────────────────────────
    React.createElement("div", { style: headerStyle },
      React.createElement("div", { style: headerTitleStyle },
        React.createElement("svg", {
          width: 20, height: 20, viewBox: "0 0 24 24", fill: "none",
          stroke: T.bl, strokeWidth: 2,
          strokeLinecap: "round", strokeLinejoin: "round",
        },
          React.createElement("path", {
            d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
          })
        ),
        React.createElement("span", { style: titleTextStyle },
          "Migraci\u00f3n conversacional"
        ),
        mod && React.createElement("span", { style: modelBadgeStyle }, mod)
      ),
      React.createElement("div", {
        style: { display: "flex", alignItems: "center", gap: 8 },
      },
        isStreaming &&
          React.createElement("button", {
            style: Object.assign({}, newChatBtnStyle, {
              color: T.r,
              borderColor: T.r + "60",
            }),
            onClick: cancelStream,
          },
            React.createElement("svg", {
              width: 12, height: 12, viewBox: "0 0 24 24", fill: T.r,
              stroke: "none",
            },
              React.createElement("rect", { x: 4, y: 4, width: 16, height: 16, rx: 2 })
            ),
            "Detener"
          ),
        React.createElement("button", {
          style: newChatBtnStyle,
          onClick: handleNewConversation,
        },
          React.createElement("svg", {
            width: 12, height: 12, viewBox: "0 0 24 24", fill: "none",
            stroke: "currentColor", strokeWidth: 2,
          },
            React.createElement("line", { x1: 12, y1: 5, x2: 12, y2: 19 }),
            React.createElement("line", { x1: 5, y1: 12, x2: 19, y2: 12 })
          ),
          "Nueva conversaci\u00f3n"
        )
      )
    ),

    // ── Error banner ─────────────────────────────────────────
    error &&
      React.createElement("div", { style: errorStyle },
        React.createElement("svg", {
          width: 14, height: 14, viewBox: "0 0 24 24", fill: "none",
          stroke: T.r, strokeWidth: 2,
        },
          React.createElement("circle", { cx: 12, cy: 12, r: 10 }),
          React.createElement("line", { x1: 15, y1: 9, x2: 9, y2: 15 }),
          React.createElement("line", { x1: 9, y1: 9, x2: 15, y2: 15 })
        ),
        error
      ),

    // ── Messages area ────────────────────────────────────────
    React.createElement("div", {
      ref: containerRef,
      style: messagesAreaStyle,
    },
      messages.length === 0 && !isStreaming
        ? React.createElement("div", { style: emptyStateStyle },
            React.createElement("svg", {
              width: 48, height: 48, viewBox: "0 0 24 24", fill: "none",
              stroke: T.txD, strokeWidth: 1, strokeLinecap: "round",
            },
              React.createElement("path", {
                d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
              })
            ),
            React.createElement("div", {
              style: { fontSize: 14, fontWeight: 600, color: T.txM },
            }, "Iniciando sesi\u00f3n de chat..."),
            React.createElement("div", {
              style: { fontSize: 12, color: T.txD, maxWidth: 300 },
            },
              "La IA te guiar\u00e1 paso a paso en la migraci\u00f3n de tus archivos."
            )
          )
        : messages.map(function (msg, idx) {
            return React.createElement(ChatMessage, {
              key: "msg-" + idx,
              message: msg,
              T: T,
              dark: dark,
              userName: userName,
              onApproveProposal: handleApproveProposal,
              onRejectProposal: handleRejectProposal,
            });
          }),

      // ── Streaming partial message ──────────────────────────
      isStreaming && streamingContent &&
        React.createElement(ChatMessage, {
          message: { role: "assistant", content: streamingContent },
          T: T,
          dark: dark,
          isPartial: true,
        }),

      // ── Typing indicator ───────────────────────────────────
      isStreaming && !streamingContent &&
        React.createElement("div", { style: typingStyle },
          React.createElement("div", {
            style: {
              width: 32,
              height: 32,
              borderRadius: 10,
              background: "linear-gradient(135deg, #6C5CE7, #A29BFE)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            },
          },
            React.createElement("svg", {
              width: 14, height: 14, viewBox: "0 0 24 24", fill: "none",
              stroke: "#fff", strokeWidth: 2,
            },
              React.createElement("path", {
                d: "M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z",
              }),
              React.createElement("path", {
                d: "M16 14H8a4 4 0 0 0-4 4v2h16v-2a4 4 0 0 0-4-4z",
              })
            )
          ),
          "IA escribiendo",
          React.createElement("div", {
            style: { display: "flex", gap: 3, marginLeft: 2 },
          },
            React.createElement("span", { style: dotStyle(0) }),
            React.createElement("span", { style: dotStyle(0.2) }),
            React.createElement("span", { style: dotStyle(0.4) })
          )
        ),

      // Scroll anchor
      React.createElement("div", { ref: messagesEndRef })
    ),

    // ── Chat input ───────────────────────────────────────────
    rejectTarget
      ? React.createElement(React.Fragment, null,
          React.createElement("div", {
            style: {
              padding: "8px 16px",
              background: T.warnBg,
              borderTop: "1px solid " + T.warnBd,
              fontSize: 11,
              color: T.warnTx || T.y,
              fontFamily: T.ui,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 6,
            },
          },
            "\u26A0 Explica qu\u00e9 cambios deseas para: ",
            React.createElement("strong", null, rejectTarget.file || "archivo"),
            React.createElement("button", {
              style: {
                marginLeft: "auto",
                background: "none",
                border: "none",
                color: T.txM,
                cursor: "pointer",
                fontSize: 11,
                fontFamily: T.ui,
                textDecoration: "underline",
              },
              onClick: function () { setRejectTarget(null); },
            }, "Cancelar")
          ),
          React.createElement(ChatInput, {
            onSend: handleRejectSubmit,
            disabled: isStreaming,
            T: T,
            dark: dark,
            placeholder: "Describe qu\u00e9 quieres diferente...",
          })
        )
      : React.createElement(ChatInput, {
          onSend: sendMessage,
          disabled: isStreaming,
          T: T,
          dark: dark,
          placeholder: "Escribe un mensaje...",
        })
  );
}

export default ChatView;
