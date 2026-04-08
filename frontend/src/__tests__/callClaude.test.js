import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock circuitBreaker
vi.mock("../services/circuitBreaker.js", () => ({
  canCall: vi.fn(() => true),
  recordSuccess: vi.fn(),
  recordFailure: vi.fn(),
  getState: vi.fn(() => ({ state: "CLOSED", remainingMs: 0 }))
}));

// Mock providerProfiles
vi.mock("../config/providerProfiles.js", () => ({
  getProfileFromModel: vi.fn(() => ({
    id: "gemini", throttleMs: 0,
    retryConfig: { maxRetries: 2, baseBackoff: 100, maxBackoff: 500 },
    circuitBreaker: { failureThreshold: 5, openDuration: 120000 }
  })),
  getProviderFromModel: vi.fn(() => "gemini")
}));

import { callClaude, setCancelled, resetTks, _tks } from "../services/claudeClient.js";
import { canCall, recordSuccess, recordFailure, getState } from "../services/circuitBreaker.js";

function mockFetchResponse(status, body, headers) {
  return vi.fn(() => Promise.resolve({
    status: status,
    ok: status >= 200 && status < 300,
    json: () => Promise.resolve(body),
    headers: { get: (h) => (headers || {})[h] || null }
  }));
}

describe("callClaude", function() {
  beforeEach(function() {
    vi.restoreAllMocks();
    setCancelled(false);
    resetTks();
    canCall.mockReturnValue(true);
    // Reset fetch
    global.fetch = mockFetchResponse(200, {
      content: [{ type: "text", text: "migrated code" }],
      usage: { input_tokens: 100, output_tokens: 50 }
    });
  });

  it("returns text from successful response", async function() {
    var result = await callClaude("sys", "usr", "gemini-2.0-flash", 4000);
    expect(result).toBe("migrated code");
  });

  it("tracks token usage", async function() {
    await callClaude("sys", "usr", "gemini-2.0-flash", 4000);
    expect(_tks.i).toBe(100);
    expect(_tks.o).toBe(50);
    expect(_tks.calls).toBe(1);
  });

  it("retries on 429", async function() {
    var callCount = 0;
    global.fetch = vi.fn(function() {
      callCount++;
      if (callCount <= 2) {
        return Promise.resolve({ status: 429, ok: false, headers: { get: function() { return null; } } });
      }
      return Promise.resolve({
        status: 200, ok: true,
        json: function() { return Promise.resolve({ content: [{ type: "text", text: "ok" }], usage: { input_tokens: 10, output_tokens: 5 } }); },
        headers: { get: function() { return null; } }
      });
    });
    var result = await callClaude("sys", "usr", "gemini-2.0-flash", 4000);
    expect(result).toBe("ok");
    expect(callCount).toBe(3);
  });

  it("throws after max retries exceeded on 429", async function() {
    global.fetch = mockFetchResponse(429, null, {});
    await expect(callClaude("sys", "usr", "gemini-2.0-flash", 4000)).rejects.toThrow("overloaded");
  });

  it("throws Migration cancelled when cancelled", async function() {
    setCancelled(true);
    await expect(callClaude("sys", "usr", "gemini-2.0-flash", 4000)).rejects.toThrow("Migration cancelled");
  });

  it("throws circuit open when provider is blocked", async function() {
    canCall.mockReturnValue(false);
    getState.mockReturnValue({ state: "OPEN", remainingMs: 60000 });
    await expect(callClaude("sys", "usr", "gemini-2.0-flash", 4000)).rejects.toThrow("circuit open");
  });

  it("calls recordSuccess on successful response", async function() {
    await callClaude("sys", "usr", "gemini-2.0-flash", 4000);
    expect(recordSuccess).toHaveBeenCalledWith("gemini");
  });

  it("calls recordFailure on error status", async function() {
    global.fetch = mockFetchResponse(503, null, {});
    try { await callClaude("sys", "usr", "gemini-2.0-flash", 4000); } catch(e) {}
    expect(recordFailure).toHaveBeenCalled();
  });

  it("invokes onRetry callback on retryable error", async function() {
    var retryArgs = [];
    var callCount = 0;
    global.fetch = vi.fn(function() {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve({ status: 429, ok: false, headers: { get: function() { return null; } } });
      }
      return Promise.resolve({
        status: 200, ok: true,
        json: function() { return Promise.resolve({ content: [{ type: "text", text: "ok" }], usage: { input_tokens: 10, output_tokens: 5 } }); },
        headers: { get: function() { return null; } }
      });
    });
    await callClaude("sys", "usr", "gemini-2.0-flash", 4000, {
      onRetry: function(info) { retryArgs.push(info); }
    });
    expect(retryArgs.length).toBe(1);
    expect(retryArgs[0].attempt).toBe(1);
    expect(retryArgs[0].provider).toBe("gemini");
  });

  it("respects retry-after header", async function() {
    var callCount = 0;
    global.fetch = vi.fn(function() {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve({ status: 429, ok: false, headers: { get: function(h) { return h === "retry-after" ? "2" : null; } } });
      }
      return Promise.resolve({
        status: 200, ok: true,
        json: function() { return Promise.resolve({ content: [{ type: "text", text: "ok" }], usage: { input_tokens: 10, output_tokens: 5 } }); },
        headers: { get: function() { return null; } }
      });
    });
    var result = await callClaude("sys", "usr", "gemini-2.0-flash", 4000);
    expect(result).toBe("ok");
  });

  it("concatenates multiple text blocks", async function() {
    global.fetch = mockFetchResponse(200, {
      content: [{ type: "text", text: "part1" }, { type: "text", text: "part2" }, { type: "image", text: "" }],
      usage: { input_tokens: 10, output_tokens: 5 }
    });
    var result = await callClaude("sys", "usr", "gemini-2.0-flash", 4000);
    expect(result).toBe("part1\npart2");
  });
});
