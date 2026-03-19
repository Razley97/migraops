// ═══ Agent Client — Middleware that enriches callClaude with agent personas ═══
// Drop-in wrapper: same positional signature as callClaude + phase as first arg.

import { callClaude } from './claudeClient.js';
import { getAgentForPhase, getAgentById } from '../data/agents.js';

var QUALITY_RULES = "\n\nQUALITY RULES:\n- Generate COMPLETE code \u2014 never truncate or use \"// rest of code\" placeholders\n- Preserve ALL business logic \u2014 functional equivalence is mandatory\n- Use IDIOMATIC patterns for the target language\n- Map standard library calls correctly (see paradigm maps)\n- Handle edge cases: null/None/nil, error handling, async patterns";

/**
 * Call Claude with agent persona prepended to system prompt.
 * Signature: callAgent(phase, sys, usr, mid, mt, opts)
 *   phase — pipeline phase name (matches agent.phases[]) or null
 *   remaining args — identical to callClaude(sys, usr, mid, mt, opts)
 */
export function callAgent(phase, sys, usr, mid, mt, opts) {
  var agent = phase ? getAgentForPhase(phase) : null;
  var enrichedSys = sys;
  if (agent) {
    enrichedSys = agent.systemPrefix + "\n\n---\n\n" + sys;
  }
  enrichedSys += QUALITY_RULES;
  return callClaude(enrichedSys, usr, mid, mt, opts);
}

/**
 * Call Claude with a specific agent by ID (for chain steps).
 * Signature: callAgentById(agentId, sys, usr, mid, mt, opts)
 */
export function callAgentById(agentId, sys, usr, mid, mt, opts) {
  var agent = agentId ? getAgentById(agentId) : null;
  var enrichedSys = sys;
  if (agent) {
    enrichedSys = agent.systemPrefix + "\n\n---\n\n" + sys;
  }
  enrichedSys += QUALITY_RULES;
  return callClaude(enrichedSys, usr, mid, mt, opts);
}

/**
 * Execute a chain of agents sequentially.
 * Each agent receives the previous agent's output as additional context.
 *
 * @param {Array<{agentId, sys, usr, mid, mt, opts}>} steps
 * @param {Function} onAgentChange - callback(agentId, stepIndex, totalSteps)
 * @returns {Promise<string>} final agent's text output
 */
export async function callAgentChain(steps, onAgentChange) {
  var previousOutput = null;

  for (var i = 0; i < steps.length; i++) {
    var step = steps[i];
    if (onAgentChange) onAgentChange(step.agentId, i, steps.length);

    var sys = step.sys;
    if (previousOutput) {
      sys += "\n\n---\nPREVIOUS AGENT OUTPUT (for your review and enrichment):\n" + previousOutput;
    }

    previousOutput = await callAgentById(step.agentId, sys, step.usr, step.mid, step.mt, step.opts);
  }

  return previousOutput;
}
