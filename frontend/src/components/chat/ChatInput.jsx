import React, { useState, useRef, useCallback, useEffect } from "react";

/**
 * ChatInput — Auto-expanding textarea with send button.
 *
 * Props: { onSend, disabled, T, dark, placeholder }
 *
 * - Textarea auto-expands from 1 to 5 lines
 * - Enter sends, Shift+Enter inserts newline
 * - Send button (arrow icon) to the right
 * - Disabled state during streaming
 * - Focus glow matching T.bl
 */

function ChatInput(props) {
  var onSend = props.onSend;
  var disabled = props.disabled;
  var T = props.T;
  var dark = props.dark;
  var placeholder = props.placeholder || "Escribe un mensaje...";

  var _value = useState("");
  var value = _value[0];
  var setValue = _value[1];

  var _focused = useState(false);
  var focused = _focused[0];
  var setFocused = _focused[1];

  var textareaRef = useRef(null);

  // ── Auto-resize ────────────────────────────────────────────
  var adjustHeight = useCallback(function () {
    var el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    var lineHeight = 20;
    var maxHeight = lineHeight * 5 + 16; // 5 lines + padding
    var newHeight = Math.min(el.scrollHeight, maxHeight);
    el.style.height = newHeight + "px";
  }, []);

  useEffect(function () {
    adjustHeight();
  }, [value, adjustHeight]);

  // ── Handlers ───────────────────────────────────────────────
  var handleSend = useCallback(function () {
    if (!value.trim() || disabled) return;
    onSend(value.trim());
    setValue("");
    // Reset height after clearing
    setTimeout(function () {
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }, 0);
  }, [value, disabled, onSend]);

  var handleKeyDown = useCallback(function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  var handleChange = useCallback(function (e) {
    setValue(e.target.value);
  }, []);

  // ── Styles ─────────────────────────────────────────────────
  var containerStyle = {
    display: "flex",
    alignItems: "flex-end",
    gap: 8,
    padding: "12px 16px",
    background: dark ? "rgba(255,255,255,.03)" : T.w,
    borderTop: "1px solid " + T.bdL,
  };

  var inputWrapStyle = {
    flex: 1,
    position: "relative",
    display: "flex",
    alignItems: "flex-end",
    background: T.inputBg,
    border: "1.5px solid " + (focused ? T.bl : T.bd),
    borderRadius: 12,
    transition: "all .2s ease",
    boxShadow: focused ? "0 0 0 3px " + T.bl + "18" : "none",
  };

  var textareaStyle = {
    flex: 1,
    resize: "none",
    border: "none",
    outline: "none",
    background: "transparent",
    color: T.tx,
    fontSize: 13,
    fontFamily: T.ui,
    lineHeight: "20px",
    padding: "10px 14px",
    minHeight: 20,
    maxHeight: 116, // 5 lines * 20px + padding
    overflowY: "auto",
    boxSizing: "border-box",
    width: "100%",
  };

  var canSend = value.trim().length > 0 && !disabled;

  var sendBtnStyle = {
    width: 36,
    height: 36,
    borderRadius: 10,
    border: "none",
    cursor: canSend ? "pointer" : "default",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    transition: "all .2s ease",
    background: canSend
      ? "linear-gradient(135deg, " + T.gradA + ", " + T.gradB + ")"
      : dark
        ? "rgba(255,255,255,.06)"
        : T.cBg,
    boxShadow: canSend ? "0 2px 8px " + T.gradA + "30" : "none",
    opacity: canSend ? 1 : 0.5,
  };

  var sendIconColor = canSend ? "#fff" : T.txD;

  // ── Render ─────────────────────────────────────────────────
  return React.createElement("div", { style: containerStyle },
    React.createElement("div", { style: inputWrapStyle },
      React.createElement("textarea", {
        ref: textareaRef,
        value: value,
        onChange: handleChange,
        onKeyDown: handleKeyDown,
        onFocus: function () { setFocused(true); },
        onBlur: function () { setFocused(false); },
        placeholder: placeholder,
        disabled: disabled,
        rows: 1,
        style: textareaStyle,
        "aria-label": "Chat message input",
      })
    ),
    React.createElement("button", {
      style: sendBtnStyle,
      onClick: handleSend,
      disabled: !canSend,
      "aria-label": "Send message",
      title: "Enviar (Enter)",
    },
      React.createElement("svg", {
        width: 18, height: 18, viewBox: "0 0 24 24", fill: "none",
        stroke: sendIconColor, strokeWidth: 2,
        strokeLinecap: "round", strokeLinejoin: "round",
      },
        React.createElement("line", { x1: 22, y1: 2, x2: 11, y2: 13 }),
        React.createElement("polygon", { points: "22 2 15 22 11 13 2 9 22 2" })
      )
    )
  );
}

export default ChatInput;
