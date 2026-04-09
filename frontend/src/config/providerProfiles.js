// ═══ Provider Profiles Registry — single source of truth for provider limits ═══
// Centralizes RPM, TPM, token estimation, throttling, retry and circuit breaker
// config that was previously scattered across claudeClient.js and budgetTier.js.

var PROFILES = {
  gemini: {
    id: "gemini",
    rpm: 15,
    tpm: 4000000,
    maxInputTokens: 1048576,
    maxOutputTokens: 8192,
    tokenEstimatorFactor: 3.5,
    throttleMs: 4500,
    retryConfig: { maxRetries: 10, baseBackoff: 8000, maxBackoff: 120000 },
    circuitBreaker: { failureThreshold: 5, openDuration: 120000 }
  },
  groq: {
    id: "groq",
    rpm: 30,
    tpm: 15000,
    maxInputTokens: 32768,
    maxOutputTokens: 8192,
    tokenEstimatorFactor: 3.8,
    throttleMs: 2200,
    retryConfig: { maxRetries: 10, baseBackoff: 8000, maxBackoff: 120000 },
    circuitBreaker: { failureThreshold: 5, openDuration: 120000 }
  },
  deepseek: {
    id: "deepseek",
    rpm: 60,
    tpm: 0,
    maxInputTokens: 65536,
    maxOutputTokens: 8192,
    tokenEstimatorFactor: 4.0,
    throttleMs: 500,
    retryConfig: { maxRetries: 5, baseBackoff: 3000, maxBackoff: 15000 },
    circuitBreaker: { failureThreshold: 5, openDuration: 120000 }
  },
  anthropic: {
    id: "anthropic",
    rpm: 1000,
    tpm: 0,
    maxInputTokens: 200000,
    maxOutputTokens: 8192,
    tokenEstimatorFactor: 4.0,
    throttleMs: 0,
    retryConfig: { maxRetries: 1, baseBackoff: 3000, maxBackoff: 15000 },
    circuitBreaker: { failureThreshold: 3, openDuration: 120000 }
  }
};

var DEFAULT_PROFILE = {
  id: "unknown",
  rpm: 30,
  tpm: 0,
  maxInputTokens: 32768,
  maxOutputTokens: 4096,
  tokenEstimatorFactor: 4.0,
  throttleMs: 2000,
  retryConfig: { maxRetries: 3, baseBackoff: 5000, maxBackoff: 30000 },
  circuitBreaker: { failureThreshold: 5, openDuration: 120000 }
};

export function getProviderFromModel(mid) {
  if (!mid) return "anthropic";
  if (mid.startsWith("deepseek")) return "deepseek";
  if (mid.startsWith("gemini")) return "gemini";
  if (mid.startsWith("llama") || mid.startsWith("gemma") || mid.startsWith("mixtral")) return "groq";
  return "anthropic";
}

export function getProfile(provider) {
  var p = PROFILES[provider];
  if (!p) return Object.assign({}, DEFAULT_PROFILE);
  return Object.assign({}, p);
}

export function getProfileFromModel(mid) {
  return getProfile(getProviderFromModel(mid));
}
