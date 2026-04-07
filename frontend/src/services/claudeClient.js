// ═══ Claude API Client — extracted from App.jsx ═══
// Token tracking state + API call logic

// Global mutable token tracker — callClaude writes here, UI reads via tick re-render
export var _tks = {i:0,o:0,calls:0,last:{i:0,o:0}};
export var _activeController = null; // current fetch AbortController — cancel button aborts this
export var _cancelled = false; // global cancel flag — checked before each API call

// Setter functions for primitive/reassigned state (needed for cross-module mutation)
export function setCancelled(v) { _cancelled = v; }
export function setActiveController(v) { _activeController = v; }
export function resetTks() { _tks = {i:0,o:0,calls:0,last:{i:0,o:0}}; }

export async function callClaude(sys,usr,mid,mt,opts) {
  var o=opts||{};
  if (_cancelled) throw new Error("Migration cancelled");
  var maxRetries=o.retries!==undefined?o.retries:1;
  var timeout=o.timeout||(mid&&mid.startsWith("deepseek")?120000:60000);
  for (var attempt=0;attempt<=maxRetries;attempt++) {
    if (_cancelled) throw new Error("Migration cancelled");
    var defaultMt=mid&&mid.startsWith("deepseek")?8000:4000;
    var controller=new AbortController();
    _activeController=controller; // expose so cancel button can abort
    var timer=setTimeout(function(){controller.abort()},timeout);
    try {
      var r = await fetch("/api/migrate",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:mid||"claude-sonnet-4-20250514",max_tokens:mt||defaultMt,system:sys,messages:[{role:"user",content:usr}],provider:mid&&mid.startsWith("deepseek")?"deepseek":"anthropic"}),
        signal:controller.signal
      });
      clearTimeout(timer);
      _activeController=null;
      if (_cancelled) throw new Error("Migration cancelled");
      if (r.status===429||r.status===529||r.status===503) { if(attempt<maxRetries){var backoff=r.status===429?Math.min(15000,3000*Math.pow(2,attempt)):2000;await new Promise(function(ok){setTimeout(ok,backoff)});continue;} throw new Error("API overloaded ("+r.status+")"); }
      if (!r.ok) throw new Error("API "+r.status);
      var d = await r.json();
      if (d.usage) { _tks.i+=(d.usage.input_tokens||0); _tks.o+=(d.usage.output_tokens||0); _tks.calls++; _tks.last={i:d.usage.input_tokens||0,o:d.usage.output_tokens||0}; }
      if (d.stop_reason==="max_tokens"&&attempt<maxRetries) { mt=Math.min(16000,Math.round((mt||4000)*1.5)); continue; }
      return d.content.map(function(b){return b.type==="text"?b.text:""}).filter(Boolean).join("\n");
    } catch(e) {
      clearTimeout(timer);
      _activeController=null;
      if (_cancelled) throw new Error("Migration cancelled");
      if (e.name==="AbortError") {
        if (attempt<maxRetries) continue;
        throw new Error("Timeout after "+Math.round(timeout/1000)+"s");
      }
      if (attempt<maxRetries) continue;
      throw e;
    }
  }
  throw new Error("Max retries exceeded");
}

export function calcCapacity(complexity, lineCount, isCross, estimatedChanges, hints) {
  // hints = { deprecatedAPIs:N, asyncChanges:N, importChanges:N, structuralChanges:N,
  //           typeChanges:N, errorHandling:N, totalSignals:N }
  var h = hints || {};
  var tier = complexity === "complex" ? 3 : complexity === "moderate" ? 2 : 1;
  var crossMult = isCross ? 1.3 : 1.0;

  // Signal density: how many actual transformations per line of code
  var signalCount = h.totalSignals || estimatedChanges || 0;
  var signalDensity = signalCount ? Math.min(2.0, 1.0 + (signalCount / Math.max(1, lineCount))) : 1.0;

  // Async complexity: files migrating async models need significantly more processing
  var asyncMult = h.asyncChanges > 3 ? 1.35 : h.asyncChanges > 0 ? 1.15 : 1.0;

  // Structural complexity: class hierarchies, interfaces, inheritance changes
  var structMult = h.structuralChanges > 4 ? 1.25 : h.structuralChanges > 1 ? 1.1 : 1.0;

  // Deprecated API density: many API replacements = more output tokens
  var apiMult = h.deprecatedAPIs > 8 ? 1.3 : h.deprecatedAPIs > 3 ? 1.15 : 1.0;

  // Combined multiplier (capped)
  var combined = Math.min(2.5, crossMult * signalDensity * asyncMult * structMult * apiMult);

  // Plan capacity — scaled by tier and combined complexity
  var basePlanTk = [1200, 2200, 3200][tier - 1];
  var planTokens = Math.min(4500, Math.round(basePlanTk * combined));
  var planTimeout = [25000, 35000, 50000][tier - 1];

  // Migration capacity — the core budget, scales with everything
  var baseMigTk = [3000, 5500, 7500][tier - 1];
  var lineBonus = Math.min(3000, Math.floor(Math.max(0, lineCount - 15) / 8) * 200);
  var migTokens = Math.min(12000, Math.round((baseMigTk + lineBonus) * combined));
  var migTimeout = [40000, 55000, 75000][tier - 1];

  // Paradigm map depth: how many mappings to inject (more for complex files)
  var paradigmSlice = tier >= 3 ? 25 : tier >= 2 ? 18 : 10;
  if (h.deprecatedAPIs > 5) paradigmSlice = Math.min(30, paradigmSlice + 5);

  // Auto-promote tier if signals justify it (e.g. analysis said "simple" but 10+ API changes)
  var effectiveTier = tier;
  if (tier === 1 && signalCount > 8) effectiveTier = 2;
  if (tier === 2 && signalCount > 15 && (h.asyncChanges > 2 || h.structuralChanges > 3)) effectiveTier = 3;
  if (effectiveTier !== tier) {
    // Recalculate with promoted tier
    basePlanTk = [1200, 2200, 3200][effectiveTier - 1];
    planTokens = Math.min(4500, Math.round(basePlanTk * combined));
    planTimeout = [25000, 35000, 50000][effectiveTier - 1];
    baseMigTk = [3000, 5500, 7500][effectiveTier - 1];
    migTokens = Math.min(12000, Math.round((baseMigTk + lineBonus) * combined));
    migTimeout = [40000, 55000, 75000][effectiveTier - 1];
  }

  return {
    tier: effectiveTier,
    originalTier: tier,
    promoted: effectiveTier !== tier,
    planTokens: planTokens,
    planTimeout: planTimeout,
    migTokens: migTokens,
    migTimeout: migTimeout,
    paradigmSlice: paradigmSlice,
    label: ["simple", "moderate", "complex"][effectiveTier - 1],
    multipliers: { cross: crossMult, signal: signalDensity, async: asyncMult, struct: structMult, api: apiMult, combined: combined },
    signals: h
  };
}
