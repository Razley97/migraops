import { describe, it, expect } from 'vitest';
import { getBudgetTier, shouldRunInlineQA, shouldRunSecurityAudit, isFreeProvider } from '../services/budgetTier.js';

describe('getBudgetTier', function() {

  it('returns "full" for Claude models', function() {
    expect(getBudgetTier("claude-sonnet-4-6")).toBe("full");
    expect(getBudgetTier("claude-opus-4-6")).toBe("full");
    expect(getBudgetTier("claude-haiku-4-5")).toBe("full");
    expect(getBudgetTier("claude-3-5-sonnet")).toBe("full");
  });

  it('returns "standard" for DeepSeek models', function() {
    expect(getBudgetTier("deepseek-chat")).toBe("standard");
    expect(getBudgetTier("deepseek-coder")).toBe("standard");
  });

  it('returns "free" for Gemini models', function() {
    expect(getBudgetTier("gemini-2.5-flash")).toBe("free");
    expect(getBudgetTier("gemini-pro")).toBe("free");
  });

  it('returns "free" for Groq/open models', function() {
    expect(getBudgetTier("llama-3.3-70b")).toBe("free");
    expect(getBudgetTier("gemma-2-9b")).toBe("free");
    expect(getBudgetTier("mixtral-8x7b")).toBe("free");
  });

  it('returns "free" for null/undefined', function() {
    expect(getBudgetTier(null)).toBe("free");
    expect(getBudgetTier(undefined)).toBe("free");
    expect(getBudgetTier("")).toBe("free");
  });

  it('returns "standard" for unknown providers', function() {
    expect(getBudgetTier("unknown-model")).toBe("standard");
    expect(getBudgetTier("gpt-4o")).toBe("standard");
  });
});

describe('shouldRunInlineQA', function() {

  it('returns true only for full tier (Claude)', function() {
    expect(shouldRunInlineQA("claude-sonnet-4-6")).toBe(true);
    expect(shouldRunInlineQA("claude-opus-4-6")).toBe(true);
  });

  it('returns false for standard and free tiers', function() {
    expect(shouldRunInlineQA("deepseek-chat")).toBe(false);
    expect(shouldRunInlineQA("gemini-2.5-flash")).toBe(false);
    expect(shouldRunInlineQA("llama-3.3-70b")).toBe(false);
    expect(shouldRunInlineQA(null)).toBe(false);
  });
});

describe('shouldRunSecurityAudit', function() {

  it('returns true only for full tier (Claude)', function() {
    expect(shouldRunSecurityAudit("claude-sonnet-4-6")).toBe(true);
  });

  it('returns false for standard and free tiers', function() {
    expect(shouldRunSecurityAudit("deepseek-chat")).toBe(false);
    expect(shouldRunSecurityAudit("gemini-2.5-flash")).toBe(false);
    expect(shouldRunSecurityAudit(null)).toBe(false);
  });
});

describe('isFreeProvider', function() {

  it('returns true for free-tier models', function() {
    expect(isFreeProvider("gemini-2.5-flash")).toBe(true);
    expect(isFreeProvider("llama-3.3-70b")).toBe(true);
    expect(isFreeProvider("gemma-2-9b")).toBe(true);
    expect(isFreeProvider("mixtral-8x7b")).toBe(true);
  });

  it('returns false for non-free models', function() {
    expect(isFreeProvider("claude-sonnet-4-6")).toBe(false);
    expect(isFreeProvider("deepseek-chat")).toBe(false);
  });
});
