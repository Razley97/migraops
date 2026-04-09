import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// Mock all transitive dependencies so pipeline.js loads cleanly
vi.mock("../config/languages.js", function() {
  return { LANGS: {} };
});

vi.mock("../config/models.js", function() {
  return { MODELS: [] };
});

vi.mock("../services/utils.js", function() {
  return {
    mkDiff: vi.fn(),
    mkRisks: vi.fn(function() { return []; })
  };
});

vi.mock("../services/claudeClient.js", function() {
  return {
    calcCapacity: vi.fn(),
    resetTks: vi.fn(),
    _tks: { last: { i: 0, o: 0 } },
    _activeController: null,
    setCancelled: vi.fn(),
    setActiveController: vi.fn()
  };
});

vi.mock("../services/migrationPhases.js", function() {
  return {
    doCodebaseAnalysis: vi.fn(),
    doFilePlan: vi.fn(),
    doMigrate: vi.fn(),
    doDependencyAudit: vi.fn(),
    doConsolidation: vi.fn(),
    doIntegrationCheck: vi.fn(),
    doIntegrationFix: vi.fn(),
    mapTargetFile: vi.fn()
  };
});

vi.mock("../services/qaHelpers.js", function() {
  return {
    runVirtualQA: vi.fn(),
    compareVirtualQA: vi.fn()
  };
});

vi.mock("../services/budgetTier.js", function() {
  return {
    shouldRunInlineQA: vi.fn(function() { return false; }),
    shouldRunSecurityAudit: vi.fn(function() { return false; }),
    shouldRunLiteQA: vi.fn(function() { return false; }),
    isFreeProvider: vi.fn(function() { return false; })
  };
});

vi.mock("../services/inlineQA.js", function() {
  return {
    doInlineQA: vi.fn(),
    formatQAFeedback: vi.fn()
  };
});

vi.mock("../services/securityAuditPhase.js", function() {
  return {
    doSecurityAudit: vi.fn()
  };
});

vi.mock("../services/liteValidator.js", function() {
  return {
    validateLite: vi.fn()
  };
});

import { _wrapPhase as wrapPhase } from "../services/pipeline.js";

// Mock emit object
function mockEmit() {
  return {
    setLogs: vi.fn(),
    cancelRef: { current: false }
  };
}

describe("wrapPhase", function() {

  afterEach(function() {
    vi.useRealTimers();
  });

  it("returns fn result on success", async function() {
    var result = await wrapPhase(function() { return Promise.resolve({ ok: true }); }, "test", mockEmit(), false);
    expect(result).toEqual({ ok: true });
  });

  it("propagates non-rate-limit errors immediately", async function() {
    await expect(wrapPhase(function() { return Promise.reject(new Error("Syntax error")); }, "test", mockEmit(), true))
      .rejects.toThrow("Syntax error");
  });

  it("propagates rate-limit errors for non-free providers", async function() {
    await expect(wrapPhase(function() { return Promise.reject(new Error("API overloaded (429)")); }, "test", mockEmit(), false))
      .rejects.toThrow("429");
  });

  it("propagates circuit-open errors even for free providers", async function() {
    await expect(wrapPhase(function() { return Promise.reject(new Error("circuit open")); }, "test", mockEmit(), true))
      .rejects.toThrow("circuit open");
  });

  it("retries rate-limit errors for free providers", async function() {
    vi.useFakeTimers();
    var callCount = 0;
    var fn = function() {
      callCount++;
      if (callCount < 3) return Promise.reject(new Error("API overloaded (429)"));
      return Promise.resolve({ ok: true });
    };
    var promise = wrapPhase(fn, "test", mockEmit(), true);
    // Advance timers for cooldowns
    await vi.advanceTimersByTimeAsync(30000); // first cooldown
    await vi.advanceTimersByTimeAsync(45000); // second cooldown
    var result = await promise;
    expect(result).toEqual({ ok: true });
    expect(callCount).toBe(3);
    vi.useRealTimers();
  });

  it("throws after max attempts exceeded", async function() {
    var callCount = 0;
    var fn = function() {
      callCount++;
      return Promise.reject(new Error("API overloaded (429)"));
    };
    // maxAttempts is 5, so it will do 6 calls (0..5) then throw
    // Use real timers — wrapPhase does setTimeout cooldowns (30s, 45s, 60s...)
    // We mock setTimeout to resolve instantly
    var origSetTimeout = globalThis.setTimeout;
    globalThis.setTimeout = function(cb, _ms) { return origSetTimeout(cb, 0); };
    try {
      await expect(wrapPhase(fn, "test", mockEmit(), true)).rejects.toThrow("429");
      expect(callCount).toBe(6);
    } finally {
      globalThis.setTimeout = origSetTimeout;
    }
  });

  it("checks cancelRef after cooldown", async function() {
    var emit = mockEmit();
    var callCount = 0;
    var fn = function() {
      callCount++;
      return Promise.reject(new Error("API overloaded (429)"));
    };
    // Mock setTimeout to resolve instantly and set cancel after first call
    var origSetTimeout = globalThis.setTimeout;
    globalThis.setTimeout = function(cb, _ms) {
      // After first fn call, set cancel before cooldown resolves
      if (callCount >= 1) emit.cancelRef.current = true;
      return origSetTimeout(cb, 0);
    };
    try {
      await expect(wrapPhase(fn, "test", emit, true)).rejects.toThrow("cancelled");
    } finally {
      globalThis.setTimeout = origSetTimeout;
    }
  });
});
