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

vi.mock('../config/languages.js', function() {
  return {
    LANGS: {
      typescript: { n: "TypeScript" },
      javascript: { n: "JavaScript" }
    }
  };
});

import { doSecurityAudit } from '../services/securityAuditPhase.js';
import { callAgentById } from '../services/agentClient.js';

beforeEach(function() {
  vi.clearAllMocks();
});

describe('doSecurityAudit', function() {
  var origFiles = [
    { name: "app.js", content: "var x = 1;" },
    { name: "utils.js", content: "function add(a,b){return a+b;}" }
  ];
  var migratedResults = [
    { name: "app.js", targetName: "app.ts", migrated: "let x: number = 1;" },
    { name: "utils.js", targetName: "utils.ts", migrated: "function add(a: number, b: number): number { return a + b; }" }
  ];

  it('returns findings when security issues detected', async function() {
    callAgentById.mockResolvedValue(JSON.stringify({
      findings: [
        { file: "app.ts", severity: "high", category: "injection", detail: "SQL injection risk", fix: "Use parameterized queries" }
      ],
      summary: "1 high issue found"
    }));

    var result = await doSecurityAudit(origFiles, migratedResults, "javascript", "ES6", "typescript", "5.0", "claude-sonnet-4-6");
    expect(result.ok).toBe(true);
    expect(result.findings).toHaveLength(1);
    expect(result.findings[0].severity).toBe("high");
    expect(result.findings[0].category).toBe("injection");
  });

  it('returns empty findings when no issues', async function() {
    callAgentById.mockResolvedValue(JSON.stringify({
      findings: [],
      summary: "No issues found"
    }));

    var result = await doSecurityAudit(origFiles, migratedResults, "javascript", "ES6", "typescript", "5.0", "claude-sonnet-4-6");
    expect(result.ok).toBe(true);
    expect(result.findings).toHaveLength(0);
  });

  it('returns ok:true with empty findings on invalid JSON', async function() {
    callAgentById.mockResolvedValue("Not valid JSON response");

    var result = await doSecurityAudit(origFiles, migratedResults, "javascript", "ES6", "typescript", "5.0", "claude-sonnet-4-6");
    expect(result.ok).toBe(true);
    expect(result.findings).toHaveLength(0);
  });

  it('returns ok:false on API error', async function() {
    callAgentById.mockRejectedValue(new Error("Network timeout"));

    var result = await doSecurityAudit(origFiles, migratedResults, "javascript", "ES6", "typescript", "5.0", "claude-sonnet-4-6");
    expect(result.ok).toBe(false);
    expect(result.findings).toHaveLength(0);
    expect(result.error).toContain("Network timeout");
  });

  it('calls callAgentById with security agent', async function() {
    callAgentById.mockResolvedValue(JSON.stringify({ findings: [], summary: "OK" }));

    await doSecurityAudit(origFiles, migratedResults, "javascript", "ES6", "typescript", "5.0", "claude-sonnet-4-6");

    expect(callAgentById).toHaveBeenCalledTimes(1);
    expect(callAgentById.mock.calls[0][0]).toBe("security");
  });

  it('truncates files longer than 1500 chars', async function() {
    var longFile = { name: "big.js", targetName: "big.ts", migrated: "x".repeat(3000) };
    callAgentById.mockResolvedValue(JSON.stringify({ findings: [], summary: "OK" }));

    await doSecurityAudit(origFiles, [longFile], "javascript", "ES6", "typescript", "5.0", "claude-sonnet-4-6");

    var usrArg = callAgentById.mock.calls[0][2];
    expect(usrArg).toContain("// ... truncated");
    expect(usrArg).not.toContain("x".repeat(2000));
  });

  it('caps at 8 files maximum', async function() {
    var manyFiles = [];
    for (var i = 0; i < 12; i++) {
      manyFiles.push({ name: "file" + i + ".js", targetName: "file" + i + ".ts", migrated: "var x" + i + " = " + i + ";" });
    }
    callAgentById.mockResolvedValue(JSON.stringify({ findings: [], summary: "OK" }));

    await doSecurityAudit(origFiles, manyFiles, "javascript", "ES6", "typescript", "5.0", "claude-sonnet-4-6");

    var usrArg = callAgentById.mock.calls[0][2];
    expect(usrArg).toContain("file0.ts");
    expect(usrArg).toContain("file7.ts");
    expect(usrArg).not.toContain("file8.ts");
    expect(usrArg).toContain("+4 additional files not shown");
  });
});
