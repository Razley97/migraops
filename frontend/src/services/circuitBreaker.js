// ═══ Circuit Breaker — per-provider fault protection ═══
// Prevents infinite retry loops against down providers.
// Only 5xx errors open the circuit; 429 (rate limit) does NOT.
// States: CLOSED (normal) → OPEN (blocked) → HALF_OPEN (probe) → CLOSED

import { getProfile } from "../config/providerProfiles.js";

var CLOSED = "CLOSED";
var OPEN = "OPEN";
var HALF_OPEN = "HALF_OPEN";

// Per-provider state: { state, failCount, lastFailAt, openedAt, cycle }
var breakers = {};

function getBreaker(provider) {
  if (!breakers[provider]) {
    breakers[provider] = { state: CLOSED, failCount: 0, lastFailAt: 0, openedAt: 0, cycle: 0 };
  }
  return breakers[provider];
}

function getOpenDuration(provider, cycle) {
  var profile = getProfile(provider);
  var base = profile.circuitBreaker.openDuration || 120000;
  // Exponential backoff per cycle: 120s → 240s → 480s, max 600s
  return Math.min(600000, base * Math.pow(2, Math.max(0, cycle - 1)));
}

export function canCall(provider) {
  var b = getBreaker(provider);
  if (b.state === CLOSED) return true;
  if (b.state === OPEN) {
    var duration = getOpenDuration(provider, b.cycle);
    if (Date.now() - b.openedAt >= duration) {
      b.state = HALF_OPEN;
      return true;
    }
    return false;
  }
  // HALF_OPEN: allow one probe request
  return true;
}

export function recordSuccess(provider) {
  var b = getBreaker(provider);
  if (b.state === HALF_OPEN || b.state === OPEN) {
    b.state = CLOSED;
    b.failCount = 0;
    b.cycle = 0;
    b.openedAt = 0;
  } else if (b.state === CLOSED) {
    b.failCount = 0;
  }
}

export function recordFailure(provider, statusCode) {
  // Only 5xx and timeouts open the circuit — 429 is expected rate limiting
  if (statusCode === 429) return;
  var b = getBreaker(provider);
  var profile = getProfile(provider);
  var threshold = profile.circuitBreaker.failureThreshold || 5;
  b.failCount++;
  b.lastFailAt = Date.now();
  if (b.state === HALF_OPEN) {
    // Probe failed — reopen with higher cycle
    b.cycle++;
    b.state = OPEN;
    b.openedAt = Date.now();
  } else if (b.state === CLOSED && b.failCount >= threshold) {
    b.cycle = Math.max(1, b.cycle + 1);
    b.state = OPEN;
    b.openedAt = Date.now();
  }
}

export function getState(provider) {
  var b = getBreaker(provider);
  var duration = getOpenDuration(provider, b.cycle);
  var nextRetryAt = b.state === OPEN ? b.openedAt + duration : 0;
  var remainingMs = b.state === OPEN ? Math.max(0, nextRetryAt - Date.now()) : 0;
  return {
    state: b.state,
    failCount: b.failCount,
    cycle: b.cycle,
    nextRetryAt: nextRetryAt,
    remainingMs: remainingMs
  };
}

export function reset(provider) {
  if (provider) {
    delete breakers[provider];
  } else {
    breakers = {};
  }
}
