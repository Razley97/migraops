// ═══ Budget Tier Detection — controls multi-agent feature availability ═══
// Shared helper: determines what inline QA/security features are affordable
// based on the selected model's API tier.

/**
 * Determine budget tier for a given model ID.
 * @param {string} mid - model identifier
 * @returns {"full"|"standard"|"free"}
 */
export function getBudgetTier(mid) {
  if (!mid) return "free";
  if (mid.startsWith("claude")) return "full";
  if (mid.startsWith("deepseek")) return "standard";
  // Free providers: gemini, llama, gemma, mixtral
  if (mid.startsWith("gemini") || mid.startsWith("llama") || mid.startsWith("gemma") || mid.startsWith("mixtral")) return "free";
  // Unknown providers default to standard (conservative)
  return "standard";
}

/**
 * Whether to run inline QA validation after each file migration.
 * Only enabled for "full" tier (Claude) — adds 1-2 API calls per file.
 */
export function shouldRunInlineQA(mid) {
  return getBudgetTier(mid) === "full";
}

/**
 * Whether to run security audit in Phase B2.
 * Only enabled for "full" tier (Claude) — adds 1 API call.
 */
export function shouldRunSecurityAudit(mid) {
  return getBudgetTier(mid) === "full";
}

/**
 * Whether to run Lite QA validation (heuristic, no API call).
 * Enabled for ALL tiers as a first-pass quality filter.
 */
export function shouldRunLiteQA(mid) {
  return true;
}

/**
 * Check if a model is a free-tier provider (mirrors isFreeProvider from pipeline.js).
 */
export function isFreeProvider(mid) {
  return getBudgetTier(mid) === "free";
}
