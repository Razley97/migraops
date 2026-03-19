import React, { useState } from "react";

/**
 * MigrationProposal — Card showing a migration proposal with diff, confidence, risks.
 *
 * Props: { proposal, T, dark, onApprove, onReject }
 * proposal: { file, code, changes, confidence, risks }
 *
 * Confidence badge: green >80, yellow 60-80, red <60
 * Code block: scrollable, max-height 300px
 * Approve/Reject buttons with hover effects
 * Subtle entrance animation
 */

function MigrationProposal(props) {
  var proposal = props.proposal;
  var T = props.T;
  var dark = props.dark;
  var onApprove = props.onApprove;
  var onReject = props.onReject;

  var _decided = useState(null); // "approved" | "rejected" | null
  var decided = _decided[0];
  var setDecided = _decided[1];

  var _expanded = useState(true);
  var expanded = _expanded[0];
  var setExpanded = _expanded[1];

  var confidence = proposal.confidence || 0;

  // ── Confidence colors ──────────────────────────────────────
  var confColor, confBg, confLabel;
  if (confidence >= 80) {
    confColor = T.g;
    confBg = T.okBg;
    confLabel = "Alta";
  } else if (confidence >= 60) {
    confColor = T.y;
    confBg = T.warnBg;
    confLabel = "Media";
  } else {
    confColor = T.r;
    confBg = T.errBg;
    confLabel = "Baja";
  }

  // ── Card container ─────────────────────────────────────────
  var cardStyle = {
    background: dark ? "rgba(255,255,255,.04)" : T.w,
    border: "1px solid " + (decided === "approved" ? T.g : decided === "rejected" ? T.r : T.bd),
    borderRadius: 12,
    overflow: "hidden",
    boxShadow: T.shadowSm,
    transition: "all .25s ease",
    animation: "fadeIn .4s ease",
  };

  // ── Header ─────────────────────────────────────────────────
  var headerStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 16px",
    background: dark ? "rgba(255,255,255,.03)" : T.blM,
    borderBottom: "1px solid " + T.bdL,
    cursor: "pointer",
  };

  var fileNameStyle = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 13,
    fontWeight: 700,
    fontFamily: T.f,
    color: T.tx,
  };

  var confidenceBadgeStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    padding: "3px 10px",
    borderRadius: 16,
    fontSize: 10,
    fontWeight: 700,
    fontFamily: T.ui,
    background: confBg,
    color: confColor,
    border: "1px solid " + confColor + "30",
  };

  // ── Changes section ────────────────────────────────────────
  var changes = proposal.changes || [];
  var changesSection = changes.length > 0 ? React.createElement("div", {
    style: {
      padding: "10px 16px",
      borderBottom: "1px solid " + T.bdL,
    },
  },
    React.createElement("div", {
      style: {
        fontSize: 10,
        fontWeight: 700,
        color: T.txM,
        textTransform: "uppercase",
        letterSpacing: ".05em",
        marginBottom: 6,
        fontFamily: T.ui,
      },
    }, "Cambios"),
    changes.map(function (change, ci) {
      return React.createElement("div", {
        key: "ch-" + ci,
        style: {
          display: "flex",
          alignItems: "flex-start",
          gap: 8,
          padding: "3px 0",
          fontSize: 12,
          fontFamily: T.f,
          color: T.tx,
          lineHeight: 1.5,
        },
      },
        React.createElement("span", {
          style: { color: T.bl, flexShrink: 0, fontWeight: 700 },
        }, "\u2192"),
        React.createElement("span", null, typeof change === "string" ? change : (change.description || change.from + " \u2192 " + change.to))
      );
    })
  ) : null;

  // ── Code section ───────────────────────────────────────────
  var codeSection = proposal.code ? React.createElement("div", {
    style: {
      padding: "10px 16px",
      borderBottom: "1px solid " + T.bdL,
    },
  },
    React.createElement("div", {
      style: {
        fontSize: 10,
        fontWeight: 700,
        color: T.txM,
        textTransform: "uppercase",
        letterSpacing: ".05em",
        marginBottom: 6,
        fontFamily: T.ui,
      },
    }, "C\u00f3digo migrado"),
    React.createElement("pre", {
      style: {
        background: T.cBg,
        border: "1px solid " + T.bdL,
        borderRadius: 8,
        padding: "12px 14px",
        margin: 0,
        fontSize: 11,
        lineHeight: 1.6,
        fontFamily: T.f,
        color: T.tx,
        overflowX: "auto",
        overflowY: "auto",
        maxHeight: 300,
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
      },
    }, proposal.code)
  ) : null;

  // ── Risks section ──────────────────────────────────────────
  var risks = proposal.risks || [];
  var risksSection = risks.length > 0 ? React.createElement("div", {
    style: {
      padding: "10px 16px",
      borderBottom: "1px solid " + T.bdL,
      background: dark ? "rgba(229,72,77,.06)" : T.errBg,
    },
  },
    React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 6,
        fontSize: 10,
        fontWeight: 700,
        color: T.r,
        textTransform: "uppercase",
        letterSpacing: ".05em",
        marginBottom: 6,
        fontFamily: T.ui,
      },
    },
      React.createElement("svg", {
        width: 12, height: 12, viewBox: "0 0 24 24", fill: "none",
        stroke: T.r, strokeWidth: 2,
      },
        React.createElement("path", {
          d: "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z",
        }),
        React.createElement("line", { x1: 12, y1: 9, x2: 12, y2: 13 }),
        React.createElement("line", { x1: 12, y1: 17, x2: 12.01, y2: 17 })
      ),
      "Riesgos"
    ),
    risks.map(function (risk, ri) {
      return React.createElement("div", {
        key: "risk-" + ri,
        style: {
          fontSize: 11,
          color: dark ? T.r : "#991B1B",
          lineHeight: 1.5,
          padding: "2px 0",
          fontFamily: T.ui,
        },
      }, "\u26A0 " + (typeof risk === "string" ? risk : risk.description || risk.message));
    })
  ) : null;

  // ── Action buttons ─────────────────────────────────────────
  var btnBase = {
    padding: "8px 20px",
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 700,
    fontFamily: T.ui,
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    transition: "all .2s ease",
    letterSpacing: "-.01em",
  };

  var approveBtn = Object.assign({}, btnBase, {
    background: decided === "approved" ? T.g : T.okBg,
    color: decided === "approved" ? "#fff" : T.g,
    border: "1px solid " + T.g + (decided === "approved" ? "" : "40"),
    boxShadow: decided === "approved" ? "0 2px 8px " + T.g + "30" : "none",
  });

  var rejectBtn = Object.assign({}, btnBase, {
    background: decided === "rejected" ? T.r : T.errBg,
    color: decided === "rejected" ? "#fff" : T.r,
    border: "1px solid " + T.r + (decided === "rejected" ? "" : "40"),
    boxShadow: decided === "rejected" ? "0 2px 8px " + T.r + "30" : "none",
  });

  var actionsSection = React.createElement("div", {
    style: {
      padding: "10px 16px",
      display: "flex",
      alignItems: "center",
      gap: 10,
      justifyContent: "flex-end",
    },
  },
    decided
      ? React.createElement("span", {
          style: {
            fontSize: 12,
            fontWeight: 600,
            color: decided === "approved" ? T.g : T.r,
            fontFamily: T.ui,
          },
        }, decided === "approved" ? "\u2705 Aprobado" : "\u274C Rechazado")
      : React.createElement(React.Fragment, null,
          React.createElement("button", {
            style: approveBtn,
            onClick: function () {
              setDecided("approved");
              if (onApprove) onApprove();
            },
          }, "\u2705", " Aprobar"),
          React.createElement("button", {
            style: rejectBtn,
            onClick: function () {
              setDecided("rejected");
              if (onReject) onReject();
            },
          }, "\u274C", " Rechazar")
        )
  );

  // ── Render ─────────────────────────────────────────────────
  return React.createElement("div", { style: cardStyle },
    React.createElement("div", {
      style: headerStyle,
      onClick: function () { setExpanded(!expanded); },
    },
      React.createElement("div", { style: fileNameStyle },
        React.createElement("svg", {
          width: 14, height: 14, viewBox: "0 0 24 24", fill: "none",
          stroke: T.bl, strokeWidth: 2,
        },
          React.createElement("path", { d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" }),
          React.createElement("polyline", { points: "14 2 14 8 20 8" })
        ),
        proposal.file || "archivo"
      ),
      React.createElement("div", {
        style: { display: "flex", alignItems: "center", gap: 8 },
      },
        React.createElement("span", { style: confidenceBadgeStyle },
          confidence + "%", " ", confLabel
        ),
        React.createElement("svg", {
          width: 14, height: 14, viewBox: "0 0 24 24", fill: "none",
          stroke: T.txD, strokeWidth: 2,
          style: {
            transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform .2s ease",
          },
        },
          React.createElement("polyline", { points: "6 9 12 15 18 9" })
        )
      )
    ),
    expanded && changesSection,
    expanded && codeSection,
    expanded && risksSection,
    expanded && actionsSection
  );
}

export default MigrationProposal;
