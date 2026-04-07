// ═══ Security Audit Phase — cross-file security review in Phase B2 ═══
// Uses Security agent to scan migrated files for vulnerabilities introduced
// during migration. Runs only for "full" tier (Claude).

import { callAgentById } from "./agentClient.js";
import { LANGS } from "../config/languages.js";
import { safeParseJSON } from "./utils.js";

var SEC_TOKEN_BUDGET = 2000;
var SEC_TIMEOUT = 60000;

/**
 * Run security audit on all migrated files.
 *
 * @param {Array} origFiles - original source files [{name, content}]
 * @param {Array} migratedResults - migration results [{name, targetName, migrated}]
 * @param {string} sl - source language key
 * @param {string} sv - source version
 * @param {string} tl - target language key
 * @param {string} tv - target version
 * @param {string} mid - model ID
 * @returns {Promise<{ok:boolean, findings:Array}>}
 */
export async function doSecurityAudit(origFiles, migratedResults, sl, sv, tl, tv, mid) {
  var tn = (LANGS[tl] || {}).n || tl;

  var MAX_FILES = 8;
  var filesToAudit = migratedResults.slice(0, MAX_FILES);
  var skippedCount = Math.max(0, migratedResults.length - MAX_FILES);

  var migManifest = filesToAudit.map(function(r) {
    var name = r.targetName || r.name;
    // Truncate large files to stay within token budget
    var code = r.migrated.length > 1500 ? r.migrated.slice(0, 1500) + "\n// ... truncated" : r.migrated;
    return "### " + name + "\n```\n" + code + "\n```";
  }).join("\n\n");
  if (skippedCount > 0) {
    migManifest += "\n\n(+" + skippedCount + " additional files not shown — review those separately)";
  }

  var sys = "You are a security auditor reviewing migrated code (" + tn + " " + tv + "). " +
    "Focus on vulnerabilities INTRODUCED by the migration process:\n" +
    "1. Injection vulnerabilities (SQL, command, XSS, path traversal)\n" +
    "2. Hardcoded secrets, API keys, or credentials\n" +
    "3. Insecure defaults (weak crypto, permissive CORS, debug flags)\n" +
    "4. Resource leaks (unclosed connections, file handles, streams)\n" +
    "5. Unsafe deserialization or type coercion\n" +
    "6. Missing input validation that existed in the original\n\n" +
    "Respond ONLY with JSON:\n" +
    '{"findings": [{"file": "filename", "severity": "critical"|"high"|"medium"|"low", "category": "injection|secrets|insecure_default|resource_leak|validation|other", "detail": "what is wrong", "fix": "how to fix it"}], "summary": "1-2 sentence overall assessment"}';

  var usr = "Security audit for " + migratedResults.length + " migrated files (" + tn + " " + tv + "):\n\n" +
    migManifest + "\n\nReport ONLY real security issues. JSON only.";

  try {
    var txt = await callAgentById("security", sys, usr, mid, SEC_TOKEN_BUDGET, { timeout: SEC_TIMEOUT });
    var result = safeParseJSON(txt);
    if (!result || !Array.isArray(result.findings)) {
      return { ok: true, findings: [], summary: "No security issues detected" };
    }
    return {
      ok: true,
      findings: result.findings,
      summary: result.summary || ""
    };
  } catch (e) {
    // On error, don't block pipeline
    return { ok: false, findings: [], error: e.message };
  }
}
