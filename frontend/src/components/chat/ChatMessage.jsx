import React from "react";
import MigrationProposal from "./MigrationProposal.jsx";

/**
 * ChatMessage — Renders a single chat bubble.
 *
 * Props: { message, T (theme), dark, onApproveProposal, onRejectProposal }
 *
 * - user messages align right, assistant messages align left
 * - Simple markdown: ```code```, **bold**, *italic*, - lists
 * - Renders MigrationProposal cards if message.proposals exists
 * - Avatar: user initial, assistant AI icon
 * - Timestamp HH:mm
 */

function formatTime(ts) {
  if (!ts) return "";
  var d = new Date(ts);
  var h = d.getHours();
  var m = d.getMinutes();
  return (h < 10 ? "0" : "") + h + ":" + (m < 10 ? "0" : "") + m;
}

/**
 * Simple markdown renderer — returns array of React elements.
 * Handles: code blocks, inline code, bold, italic, list items.
 */
function renderMarkdown(text, T) {
  if (!text) return null;

  var parts = text.split(/(```[\s\S]*?```)/g);
  var elements = [];

  for (var pi = 0; pi < parts.length; pi++) {
    var part = parts[pi];

    // Fenced code block
    if (part.startsWith("```") && part.endsWith("```")) {
      var codeContent = part.slice(3, -3);
      // Remove optional language label from first line
      var firstNewline = codeContent.indexOf("\n");
      if (firstNewline !== -1 && firstNewline < 30 && !/\s/.test(codeContent.slice(0, firstNewline))) {
        codeContent = codeContent.slice(firstNewline + 1);
      }
      elements.push(
        React.createElement("pre", {
          key: "code-" + pi,
          style: {
            background: T.cBg,
            borderRadius: 8,
            padding: "12px 14px",
            overflowX: "auto",
            margin: "8px 0",
            fontSize: 12,
            lineHeight: 1.6,
            fontFamily: T.f,
            border: "1px solid " + T.bdL,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          },
        }, codeContent)
      );
      continue;
    }

    // Inline rendering — split by lines for list support
    var lines = part.split("\n");
    for (var li = 0; li < lines.length; li++) {
      var line = lines[li];
      if (!line && li < lines.length - 1) {
        elements.push(React.createElement("br", { key: "br-" + pi + "-" + li }));
        continue;
      }

      // List item
      var isList = /^[\s]*[-*]\s+/.test(line);
      var lineContent = isList ? line.replace(/^[\s]*[-*]\s+/, "") : line;

      // Process inline formatting
      var inlineElements = renderInline(lineContent, T, pi + "-" + li);

      if (isList) {
        elements.push(
          React.createElement("div", {
            key: "li-" + pi + "-" + li,
            style: {
              display: "flex",
              gap: 8,
              paddingLeft: 4,
              margin: "2px 0",
              lineHeight: 1.6,
            },
          },
            React.createElement("span", {
              style: { color: T.bl, fontWeight: 700, flexShrink: 0 },
            }, "\u2022"),
            React.createElement("span", null, inlineElements)
          )
        );
      } else if (line) {
        elements.push(
          React.createElement("span", { key: "ln-" + pi + "-" + li }, inlineElements)
        );
        if (li < lines.length - 1) {
          elements.push(React.createElement("br", { key: "lbr-" + pi + "-" + li }));
        }
      }
    }
  }

  return elements;
}

function renderInline(text, T, keyPrefix) {
  // Split by **bold**, *italic*, `inline code`
  var tokens = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  var result = [];
  for (var i = 0; i < tokens.length; i++) {
    var tok = tokens[i];
    if (!tok) continue;

    if (tok.startsWith("**") && tok.endsWith("**")) {
      result.push(
        React.createElement("strong", {
          key: keyPrefix + "-b-" + i,
          style: { fontWeight: 700 },
        }, tok.slice(2, -2))
      );
    } else if (tok.startsWith("*") && tok.endsWith("*")) {
      result.push(
        React.createElement("em", {
          key: keyPrefix + "-i-" + i,
        }, tok.slice(1, -1))
      );
    } else if (tok.startsWith("`") && tok.endsWith("`")) {
      result.push(
        React.createElement("code", {
          key: keyPrefix + "-c-" + i,
          style: {
            background: T.cBg,
            padding: "1px 6px",
            borderRadius: 4,
            fontFamily: T.f,
            fontSize: "0.9em",
            border: "1px solid " + T.bdL,
          },
        }, tok.slice(1, -1))
      );
    } else {
      result.push(tok);
    }
  }
  return result;
}

function ChatMessage(props) {
  var message = props.message;
  var T = props.T;
  var dark = props.dark;
  var onApproveProposal = props.onApproveProposal;
  var onRejectProposal = props.onRejectProposal;

  var isUser = message.role === "user";
  var isPartial = props.isPartial; // streaming in progress

  // ── Styles ──────────────────────────────────────────────────
  var rowStyle = {
    display: "flex",
    flexDirection: isUser ? "row-reverse" : "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 16,
    animation: "fadeIn .3s ease",
  };

  var avatarStyle = {
    width: 32,
    height: 32,
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    fontSize: 13,
    fontWeight: 800,
    fontFamily: T.ui,
    color: "#fff",
    background: isUser
      ? "linear-gradient(135deg, " + T.gradA + ", " + T.gradB + ")"
      : dark
        ? "linear-gradient(135deg, #6C5CE7, #A29BFE)"
        : "linear-gradient(135deg, #4338CA, #6366F1)",
    boxShadow: "0 2px 8px rgba(0,0,0,.15)",
  };

  var bubbleStyle = {
    maxWidth: "75%",
    padding: "12px 16px",
    borderRadius: 14,
    fontSize: 13,
    lineHeight: 1.65,
    fontFamily: T.ui,
    color: isUser ? "#fff" : T.tx,
    background: isUser
      ? "linear-gradient(135deg, " + T.gradA + ", " + T.gradB + ")"
      : dark
        ? "rgba(255,255,255,.06)"
        : T.w,
    border: isUser
      ? "none"
      : "1px solid " + T.bdL,
    boxShadow: isUser
      ? "0 4px 16px " + T.gradA + "30"
      : T.shadowSm,
    position: "relative",
  };

  if (isPartial) {
    bubbleStyle.borderColor = T.bl;
    bubbleStyle.borderWidth = 1;
    bubbleStyle.borderStyle = "solid";
  }

  var timeStyle = {
    fontSize: 9,
    color: T.txD,
    marginTop: 4,
    textAlign: isUser ? "right" : "left",
    fontFamily: T.ui,
    fontWeight: 500,
    letterSpacing: ".02em",
  };

  // ── Avatar content ─────────────────────────────────────────
  var avatarContent = isUser
    ? (props.userName ? props.userName[0].toUpperCase() : "U")
    : React.createElement("svg", {
        width: 16, height: 16, viewBox: "0 0 24 24", fill: "none",
        stroke: "#fff", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round",
      },
        React.createElement("path", { d: "M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z" }),
        React.createElement("path", { d: "M16 14H8a4 4 0 0 0-4 4v2h16v-2a4 4 0 0 0-4-4z" })
      );

  // ── Render ─────────────────────────────────────────────────
  return React.createElement("div", null,
    React.createElement("div", { style: rowStyle },
      React.createElement("div", { style: avatarStyle }, avatarContent),
      React.createElement("div", { style: { maxWidth: "75%" } },
        React.createElement("div", { style: bubbleStyle },
          renderMarkdown(message.content, T),
          isPartial && React.createElement("span", {
            style: {
              display: "inline-block",
              width: 6,
              height: 14,
              background: T.bl,
              borderRadius: 1,
              marginLeft: 2,
              verticalAlign: "text-bottom",
              animation: "pulse 1s ease-in-out infinite",
            },
          })
        ),
        !isPartial && message.timestamp && React.createElement("div", { style: timeStyle },
          formatTime(message.timestamp)
        )
      )
    ),
    // ── Proposals ────────────────────────────────────────────
    message.proposals && message.proposals.length > 0 &&
      React.createElement("div", {
        style: {
          marginLeft: 42,
          marginBottom: 16,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        },
      },
        message.proposals.map(function (proposal, idx) {
          return React.createElement(MigrationProposal, {
            key: "proposal-" + idx,
            proposal: proposal,
            T: T,
            dark: dark,
            onApprove: function () {
              if (onApproveProposal) onApproveProposal(proposal);
            },
            onReject: function () {
              if (onRejectProposal) onRejectProposal(proposal);
            },
          });
        })
      )
  );
}

export default ChatMessage;
