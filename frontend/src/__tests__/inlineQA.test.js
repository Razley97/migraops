import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../services/agentClient.js', function() {
  return {
    callAgentById: vi.fn()
  };
});

vi.mock('../services/utils.js', function() {
  return {
    safeParseJSON: vi.fn(function(txt) {
      try { return JSON.parse(txt); }
      catch(e) { return null; }
    })
  };
});

import { doInlineQA, formatQAFeedback } from '../services/inlineQA.js';
import { callAgentById } from '../services/agentClient.js';

beforeEach(function() {
  vi.clearAllMocks();
});

describe('doInlineQA', function() {
  var baseArgs = ["var x = 1;", "let x: number = 1;", "test.js", "test.ts", null, "javascript", "ES5", "typescript", "5.0", "claude-sonnet-4-6", null];

  it('returns pass:true when score >= 70 and no critical issues', async function() {
    callAgentById.mockResolvedValue(JSON.stringify({
      pass: true, score: 85, issues: [
        { severity: "minor", msg: "Could use const", fix: "Use const instead of let" }
      ], summary: "Good migration"
    }));

    var result = await doInlineQA.apply(null, baseArgs);
    expect(result.ok).toBe(true);
    expect(result.pass).toBe(true);
    expect(result.score).toBe(85);
    expect(result.issues).toHaveLength(1);
  });

  it('returns pass:false when score < 70', async function() {
    callAgentById.mockResolvedValue(JSON.stringify({
      pass: false, score: 55, issues: [
        { severity: "major", msg: "Missing function", fix: "Add function" }
      ], summary: "Needs rework"
    }));

    var result = await doInlineQA.apply(null, baseArgs);
    expect(result.ok).toBe(true);
    expect(result.pass).toBe(false);
    expect(result.score).toBe(55);
  });

  it('returns pass:false when critical issues exist even with high score', async function() {
    callAgentById.mockResolvedValue(JSON.stringify({
      pass: true, score: 80, issues: [
        { severity: "critical", msg: "SQL injection introduced", fix: "Parameterize" }
      ], summary: "Critical issue"
    }));

    var result = await doInlineQA.apply(null, baseArgs);
    expect(result.ok).toBe(true);
    expect(result.pass).toBe(false);
    expect(result.score).toBe(80);
  });

  it('returns pass:true at exactly threshold score 70', async function() {
    callAgentById.mockResolvedValue(JSON.stringify({
      pass: true, score: 70, issues: [], summary: "Acceptable"
    }));

    var result = await doInlineQA.apply(null, baseArgs);
    expect(result.pass).toBe(true);
    expect(result.score).toBe(70);
  });

  it('returns sentinel score -1 on JSON parse failure', async function() {
    callAgentById.mockResolvedValue("This is not valid JSON at all");

    var result = await doInlineQA.apply(null, baseArgs);
    expect(result.ok).toBe(true);
    expect(result.pass).toBe(true);
    expect(result.score).toBe(-1);
    expect(result.skipped).toBe(true);
  });

  it('returns sentinel score -1 on API error', async function() {
    callAgentById.mockRejectedValue(new Error("429 Too Many Requests"));

    var result = await doInlineQA.apply(null, baseArgs);
    expect(result.ok).toBe(true);
    expect(result.pass).toBe(true);
    expect(result.score).toBe(-1);
    expect(result.skipped).toBe(true);
    expect(result.error).toContain("429");
  });

  it('includes filePlan summary in prompt when available', async function() {
    callAgentById.mockResolvedValue(JSON.stringify({ pass: true, score: 90, issues: [], summary: "OK" }));

    var argsWithPlan = baseArgs.slice();
    argsWithPlan[4] = { ok: true, plan: { totalChanges: 5, riskAreas: ["async handling"] } };

    await doInlineQA.apply(null, argsWithPlan);

    var usrArg = callAgentById.mock.calls[0][2];
    expect(usrArg).toContain("5 planned changes");
    expect(usrArg).toContain("async handling");
  });

  it('calls callAgentById with qa agent', async function() {
    callAgentById.mockResolvedValue(JSON.stringify({ pass: true, score: 90, issues: [], summary: "OK" }));

    await doInlineQA.apply(null, baseArgs);

    expect(callAgentById).toHaveBeenCalledTimes(1);
    expect(callAgentById.mock.calls[0][0]).toBe("qa");
  });
});

describe('formatQAFeedback', function() {

  it('formats issues into readable string', function() {
    var qaResult = {
      score: 55,
      issues: [
        { severity: "critical", msg: "Missing null check", fix: "Add if(x!=null)" },
        { severity: "major", msg: "Wrong return type" }
      ],
      summary: "Needs fixes"
    };

    var result = formatQAFeedback(qaResult);
    expect(result).toContain("QA Score: 55/100");
    expect(result).toContain("[CRITICAL] Missing null check");
    expect(result).toContain("Fix: Add if(x!=null)");
    expect(result).toContain("[MAJOR] Wrong return type");
    expect(result).toContain("Summary: Needs fixes");
  });

  it('returns empty string for null input', function() {
    expect(formatQAFeedback(null)).toBe("");
    expect(formatQAFeedback(undefined)).toBe("");
  });

  it('returns empty string for empty issues array', function() {
    expect(formatQAFeedback({ score: 90, issues: [] })).toBe("");
  });
});
