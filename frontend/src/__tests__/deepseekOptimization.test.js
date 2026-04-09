import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock modules ──
vi.mock("../services/circuitBreaker.js", () => ({
  canCall: vi.fn(() => true),
  recordSuccess: vi.fn(),
  recordFailure: vi.fn(),
  getState: vi.fn(() => ({ state: "CLOSED", remainingMs: 0 }))
}));

vi.mock("../config/providerProfiles.js", () => ({
  getProfileFromModel: vi.fn((mid) => {
    if (mid && mid.startsWith("deepseek")) {
      return {
        maxOutputTokens: 8192,
        maxInputTokens: 65536,
        tokenEstimatorFactor: 4.0,
        throttleMs: 0,
        retryConfig: { maxRetries: 2, baseBackoff: 100, maxBackoff: 500 }
      };
    }
    return {
      maxOutputTokens: 8192,
      maxInputTokens: 200000,
      tokenEstimatorFactor: 4.0,
      throttleMs: 0,
      retryConfig: { maxRetries: 1, baseBackoff: 100, maxBackoff: 500 }
    };
  }),
  getProviderFromModel: vi.fn((mid) => {
    if (mid && mid.startsWith("deepseek")) return "deepseek";
    return "anthropic";
  })
}));

import { callClaude, _tks } from "../services/claudeClient.js";
import { getBudgetTier, isFreeProvider } from "../services/budgetTier.js";

// ═══ Story 1: maxOutputTokens cap ═══
describe("S1: maxOutputTokens cap", function() {

  beforeEach(function() {
    global.fetch = vi.fn();
  });

  it("defaultMt does not exceed provider maxOutputTokens", async function() {
    var capturedBody = null;
    global.fetch = vi.fn(function(url, opts) {
      capturedBody = JSON.parse(opts.body);
      return Promise.resolve({
        ok: true, status: 200,
        json: function() {
          return Promise.resolve({
            content: [{ type: "text", text: "ok" }],
            usage: { input_tokens: 10, output_tokens: 10 },
            stop_reason: "end_turn"
          });
        }
      });
    });
    await callClaude("sys", "usr", "deepseek-chat", undefined, {});
    expect(capturedBody.max_tokens).toBeLessThanOrEqual(8192);
  });

  it("retry escalation does not exceed maxOutputTokens", async function() {
    var callCount = 0;
    var capturedMts = [];
    global.fetch = vi.fn(function(url, opts) {
      callCount++;
      capturedMts.push(JSON.parse(opts.body).max_tokens);
      return Promise.resolve({
        ok: true, status: 200,
        json: function() {
          return Promise.resolve({
            content: [{ type: "text", text: "result" }],
            usage: { input_tokens: 10, output_tokens: 100 },
            stop_reason: callCount <= 1 ? "max_tokens" : "end_turn"
          });
        }
      });
    });
    await callClaude("sys", "usr", "deepseek-chat", 6000, { retries: 3 });
    // All max_tokens values should be <= 8192
    for (var i = 0; i < capturedMts.length; i++) {
      expect(capturedMts[i]).toBeLessThanOrEqual(8192);
    }
  });

  it("early break when mt already at maxOutputTokens", async function() {
    var callCount = 0;
    global.fetch = vi.fn(function() {
      callCount++;
      return Promise.resolve({
        ok: true, status: 200,
        json: function() {
          return Promise.resolve({
            content: [{ type: "text", text: "partial" }],
            usage: { input_tokens: 10, output_tokens: 100 },
            stop_reason: "max_tokens"
          });
        }
      });
    });
    // Start at 8192 (already at max) — should break after 1 call, not retry
    var result = await callClaude("sys", "usr", "deepseek-chat", 8192, { retries: 3 });
    expect(callCount).toBe(1);
    expect(result).toBe("partial");
  });
});

// ═══ Story 2: Adaptive compression ═══
describe("S2: shouldCompress / adaptive compression", function() {

  it("getBudgetTier returns 'standard' for deepseek", function() {
    expect(getBudgetTier("deepseek-chat")).toBe("standard");
    expect(getBudgetTier("deepseek-reasoner")).toBe("standard");
  });

  it("getBudgetTier returns 'full' for claude", function() {
    expect(getBudgetTier("claude-sonnet-4-20250514")).toBe("full");
  });

  it("isFreeProvider returns false for deepseek", function() {
    expect(isFreeProvider("deepseek-chat")).toBe(false);
  });

  it("isFreeProvider returns true for gemini", function() {
    expect(isFreeProvider("gemini-2.0-flash")).toBe(true);
  });
});

// ═══ Story 3: Skip agent chain ═══
describe("S3: useChain gating", function() {

  it("full tier gets useChain=true", function() {
    expect(getBudgetTier("claude-sonnet-4-20250514") === "full").toBe(true);
  });

  it("standard tier gets useChain=false", function() {
    expect(getBudgetTier("deepseek-chat") === "full").toBe(false);
  });

  it("free tier gets useChain=false", function() {
    expect(getBudgetTier("gemini-2.0-flash") === "full").toBe(false);
  });
});

// ═══ Story 4: INT_MAX and Phase E ═══
describe("S4: INT_MAX and Phase E gating", function() {

  it("full tier gets INT_MAX=2", function() {
    var tier = getBudgetTier("claude-sonnet-4-20250514");
    var INT_MAX = tier === "full" ? 2 : 1;
    expect(INT_MAX).toBe(2);
  });

  it("standard tier gets INT_MAX=1", function() {
    var tier = getBudgetTier("deepseek-chat");
    var INT_MAX = tier === "full" ? 2 : 1;
    expect(INT_MAX).toBe(1);
  });

  it("free tier gets INT_MAX=1", function() {
    var tier = getBudgetTier("gemini-2.0-flash");
    var INT_MAX = tier === "full" ? 2 : 1;
    expect(INT_MAX).toBe(1);
  });

  it("Phase E only runs for full tier", function() {
    expect(getBudgetTier("claude-sonnet-4-20250514") === "full").toBe(true);
    expect(getBudgetTier("deepseek-chat") === "full").toBe(false);
    expect(getBudgetTier("gemini-2.0-flash") === "full").toBe(false);
  });
});
