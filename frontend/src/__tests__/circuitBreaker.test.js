import { describe, it, expect, beforeEach, vi } from "vitest";
import { canCall, recordSuccess, recordFailure, getState, reset } from "../services/circuitBreaker.js";

describe("circuitBreaker", function() {

  beforeEach(function() {
    reset(); // clear all breakers between tests
  });

  it("CLOSED allows calls", function() {
    expect(canCall("gemini")).toBe(true);
    expect(getState("gemini").state).toBe("CLOSED");
  });

  it("5 consecutive 503 failures open the circuit", function() {
    for (var i = 0; i < 5; i++) {
      recordFailure("gemini", 503);
    }
    expect(getState("gemini").state).toBe("OPEN");
    expect(canCall("gemini")).toBe(false);
  });

  it("429 does NOT open the circuit", function() {
    for (var i = 0; i < 20; i++) {
      recordFailure("gemini", 429);
    }
    expect(getState("gemini").state).toBe("CLOSED");
    expect(canCall("gemini")).toBe(true);
  });

  it("OPEN transitions to HALF_OPEN after timeout", function() {
    // Open the circuit
    for (var i = 0; i < 5; i++) recordFailure("gemini", 500);
    expect(getState("gemini").state).toBe("OPEN");

    // Advance time past openDuration (120s)
    vi.useFakeTimers();
    vi.advanceTimersByTime(120001);
    expect(canCall("gemini")).toBe(true); // transitions to HALF_OPEN
    expect(getState("gemini").state).toBe("HALF_OPEN");
    vi.useRealTimers();
  });

  it("success in HALF_OPEN closes the circuit", function() {
    for (var i = 0; i < 5; i++) recordFailure("gemini", 503);
    vi.useFakeTimers();
    vi.advanceTimersByTime(120001);
    canCall("gemini"); // trigger HALF_OPEN
    recordSuccess("gemini");
    expect(getState("gemini").state).toBe("CLOSED");
    expect(getState("gemini").failCount).toBe(0);
    expect(getState("gemini").cycle).toBe(0);
    vi.useRealTimers();
  });

  it("failure in HALF_OPEN reopens with higher cycle", function() {
    for (var i = 0; i < 5; i++) recordFailure("gemini", 503);
    vi.useFakeTimers();
    vi.advanceTimersByTime(120001);
    canCall("gemini"); // trigger HALF_OPEN
    recordFailure("gemini", 503);
    expect(getState("gemini").state).toBe("OPEN");
    expect(getState("gemini").cycle).toBe(2); // cycle incremented
    vi.useRealTimers();
  });

  it("openDuration grows with cycles (max 600s)", function() {
    // Cycle 1: 120s
    for (var i = 0; i < 5; i++) recordFailure("gemini", 500);
    expect(getState("gemini").state).toBe("OPEN");

    vi.useFakeTimers();
    // After 120s → HALF_OPEN → fail → OPEN cycle 2
    vi.advanceTimersByTime(120001);
    canCall("gemini");
    recordFailure("gemini", 500);
    expect(getState("gemini").cycle).toBe(2);

    // Cycle 2 openDuration = 240s, so 120s is not enough
    vi.advanceTimersByTime(120000);
    expect(canCall("gemini")).toBe(false); // still OPEN
    vi.advanceTimersByTime(120001); // total 240s+
    expect(canCall("gemini")).toBe(true); // now HALF_OPEN
    vi.useRealTimers();
  });

  it("providers are independent", function() {
    for (var i = 0; i < 5; i++) recordFailure("gemini", 503);
    expect(canCall("gemini")).toBe(false);
    expect(canCall("groq")).toBe(true);
    expect(canCall("anthropic")).toBe(true);
  });

  it("reset clears specific provider", function() {
    for (var i = 0; i < 5; i++) recordFailure("gemini", 503);
    expect(canCall("gemini")).toBe(false);
    reset("gemini");
    expect(canCall("gemini")).toBe(true);
  });

  it("recordSuccess in CLOSED resets failCount", function() {
    recordFailure("groq", 500);
    recordFailure("groq", 500);
    expect(getState("groq").failCount).toBe(2);
    recordSuccess("groq");
    expect(getState("groq").failCount).toBe(0);
  });
});
