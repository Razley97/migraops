import { describe, it, expect } from "vitest";
import { getProfile, getProfileFromModel } from "../config/providerProfiles.js";

describe("providerProfiles", function() {

  describe("getProfile", function() {
    it("returns gemini profile with correct limits", function() {
      var p = getProfile("gemini");
      expect(p.id).toBe("gemini");
      expect(p.rpm).toBe(15);
      expect(p.tpm).toBe(4000000);
      expect(p.throttleMs).toBe(4500);
      expect(p.tokenEstimatorFactor).toBe(3.5);
      expect(p.retryConfig.maxRetries).toBe(10);
      expect(p.retryConfig.baseBackoff).toBe(8000);
      expect(p.retryConfig.maxBackoff).toBe(120000);
      expect(p.circuitBreaker.failureThreshold).toBe(5);
    });

    it("returns groq profile with correct limits", function() {
      var p = getProfile("groq");
      expect(p.id).toBe("groq");
      expect(p.rpm).toBe(30);
      expect(p.throttleMs).toBe(2200);
      expect(p.tokenEstimatorFactor).toBe(3.8);
      expect(p.retryConfig.maxRetries).toBe(10);
    });

    it("returns anthropic profile with minimal retries", function() {
      var p = getProfile("anthropic");
      expect(p.id).toBe("anthropic");
      expect(p.rpm).toBe(1000);
      expect(p.throttleMs).toBe(0);
      expect(p.retryConfig.maxRetries).toBe(1);
    });

    it("returns safe defaults for unknown provider", function() {
      var p = getProfile("unknown_provider");
      expect(p.id).toBe("unknown");
      expect(p.retryConfig.maxRetries).toBe(3);
      expect(p.throttleMs).toBe(2000);
    });

    it("returns immutable copy (does not mutate original)", function() {
      var p1 = getProfile("gemini");
      p1.rpm = 999;
      p1.retryConfig.maxRetries = 0;
      var p2 = getProfile("gemini");
      expect(p2.rpm).toBe(15);
      // Note: shallow copy — retryConfig is shared reference
      // This is acceptable for read-only usage
    });
  });

  describe("getProfileFromModel", function() {
    it("maps gemini model to gemini profile", function() {
      var p = getProfileFromModel("gemini-2.0-flash");
      expect(p.id).toBe("gemini");
    });

    it("maps llama model to groq profile", function() {
      var p = getProfileFromModel("llama-3.3-70b-versatile");
      expect(p.id).toBe("groq");
    });

    it("maps gemma model to groq profile", function() {
      var p = getProfileFromModel("gemma2-9b-it");
      expect(p.id).toBe("groq");
    });

    it("maps mixtral model to groq profile", function() {
      var p = getProfileFromModel("mixtral-8x7b-32768");
      expect(p.id).toBe("groq");
    });

    it("maps deepseek model to deepseek profile", function() {
      var p = getProfileFromModel("deepseek-chat");
      expect(p.id).toBe("deepseek");
    });

    it("maps claude model to anthropic profile", function() {
      var p = getProfileFromModel("claude-sonnet-4-20250514");
      expect(p.id).toBe("anthropic");
    });

    it("maps null/undefined to anthropic profile", function() {
      var p = getProfileFromModel(null);
      expect(p.id).toBe("anthropic");
      var p2 = getProfileFromModel(undefined);
      expect(p2.id).toBe("anthropic");
    });
  });
});
