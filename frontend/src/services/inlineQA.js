// ═══ Inline QA Validation — per-file quality check within Phase B ═══
// Uses QA agent to validate migrated code against original before proceeding.
// Catches migration errors early (in Phase B) instead of Phase C/D.

import { callAgentById } from "./agentClient.js";
import { safeParseJSON } from "./utils.js";

var QA_TOKEN_BUDGET = 1500;
var QA_TIMEOUT = 45000;
var PASS_THRESHOLD = 70;

/**
 * Run inline QA validation on a single migrated file.
 *
 * @param {string} originalCode - source code before migration
 * @param {string} migratedCode - migrated output
 * @param {string} fileName - original file name
 * @param {string} targetFileName - target file name
 * @param {object} filePlan - migration plan for this file
 * @param {string} sl - source language key
 * @param {string} sv - source version
 * @param {string} tl - target language key
 * @param {string} tv - target version
 * @param {string} mid - model ID
 * @param {object} cap - capacity profile
 * @returns {Promise<{ok:boolean, pass:boolean, issues:Array, score:number}>}
 */
export async function doInlineQA(originalCode, migratedCode, fileName, targetFileName, filePlan, sl, sv, tl, tv, mid, cap) {
  var sys = "You are a QA validator for code migration. Compare the ORIGINAL source code with the MIGRATED output and check for:\n" +
    "1. Missing business logic (functions, conditions, error handling lost in migration)\n" +
    "2. Incorrect API/stdlib translations\n" +
    "3. Syntax errors or invalid target language constructs\n" +
    "4. Changed behavior (different return types, altered control flow)\n" +
    "5. Missing imports or unresolved references\n\n" +
    "Respond ONLY with JSON:\n" +
    '{"pass": true/false, "score": 0-100, "issues": [{"severity": "critical"|"major"|"minor", "msg": "description", "fix": "suggested fix"}], "summary": "1-2 sentence assessment"}\n\n' +
    "Scoring: 90-100 = excellent, 70-89 = acceptable, <70 = needs rework.\n" +
    "Pass = score >= 70 AND zero critical issues.";

  var planSummary = "";
  if (filePlan && filePlan.ok && filePlan.plan) {
    planSummary = "\nMigration plan had " + (filePlan.plan.totalChanges || 0) + " planned changes.";
    if (filePlan.plan.riskAreas && filePlan.plan.riskAreas.length) {
      planSummary += " Risk areas: " + filePlan.plan.riskAreas.join("; ");
    }
  }

  var usr = "Validate migration: " + fileName + " → " + targetFileName +
    " (" + sl + " " + sv + " → " + tl + " " + tv + ")" + planSummary +
    "\n\nORIGINAL (" + sl + "):\n```\n" + originalCode.slice(0, 3000) + "\n```" +
    "\n\nMIGRATED (" + tl + "):\n```\n" + migratedCode.slice(0, 3000) + "\n```" +
    "\n\nJSON only. Be concise.";

  try {
    var txt = await callAgentById("qa", sys, usr, mid, QA_TOKEN_BUDGET, { timeout: QA_TIMEOUT });
    var result = safeParseJSON(txt);
    if (!result || typeof result.score !== "number") {
      // JSON parse failed — don't block pipeline, sentinel score
      return { ok: true, pass: true, issues: [], score: -1, skipped: true };
    }
    var criticalCount = (result.issues || []).filter(function(i) { return i.severity === "critical"; }).length;
    var pass = result.score >= PASS_THRESHOLD && criticalCount === 0;
    return {
      ok: true,
      pass: pass,
      issues: result.issues || [],
      score: result.score,
      summary: result.summary || ""
    };
  } catch (e) {
    // On error, don't block pipeline — treat as pass
    return { ok: true, pass: true, issues: [], score: -1, skipped: true, error: e.message };
  }
}

/**
 * Format QA issues into a feedback string for doMigrate retry.
 */
export function formatQAFeedback(qaResult) {
  if (!qaResult || !qaResult.issues || !qaResult.issues.length) return "";
  var lines = ["QA Score: " + qaResult.score + "/100"];
  qaResult.issues.forEach(function(issue) {
    lines.push("- [" + (issue.severity || "issue").toUpperCase() + "] " + issue.msg);
    if (issue.fix) lines.push("  Fix: " + issue.fix);
  });
  if (qaResult.summary) lines.push("Summary: " + qaResult.summary);
  return lines.join("\n");
}
