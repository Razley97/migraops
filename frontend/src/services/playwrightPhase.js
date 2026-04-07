/**
 * MigraOps — Playwright Phase 0 + Phase 110 Registration
 *
 * Phase -10 (pre-migration):  Capture visual baseline of source code
 * Phase 110 (post-migration): Capture migrated code + compare with baseline
 *
 * Importing this file registers both phases via registerPhase().
 * Gracefully skips if Playwright is not available.
 */

import { registerPhase } from './pipeline.js';
import { isPlaywrightAvailable, captureBaseline, compareBaselines } from './playwrightClient.js';
import { buildVisualQAReport } from './visualQAReport.js';

// ══════════════════════════════════════════════════════════════
// Phase -10: Pre-migration visual baseline capture
// ══════════════════════════════════════════════════════════════
registerPhase(-10, "pw_pre", "Visual Baseline Capture", function(ctx) {
  return (async function() {
    var emit = ctx.emit;
    var config = ctx.config;

    // Check availability — skip gracefully if not installed
    var available = await isPlaywrightAvailable();
    if (!available) {
      emit.setLogs(function(p) {
        return p.concat([{
          type: "phase", phase: "visual_baseline", st: "skipped", ts: Date.now(),
          detail: "Playwright not available — skipping visual baseline"
        }]);
      });
      if (emit.addToast) emit.addToast("Visual baseline skipped (Playwright no disponible)", "info");
      return;
    }

    // Check if source language is renderable (frontend code)
    var lang = config.sL || '';
    var entry = ctx.phaseStart("pw_pre", "Visual Baseline Capture", { lang: lang });
    emit.setMigPhase("visual_baseline");
    emit.setLogs(function(p) {
      return p.concat([{
        type: "phase", phase: "visual_baseline", st: "run", ts: Date.now(),
        detail: "Capturing screenshots of source code..."
      }]);
    });

    // Build files payload
    var filesPayload = config.files.map(function(f) {
      return { name: f.name, path: f.path || f.name, content: f.content };
    });

    var result = await captureBaseline(filesPayload, lang, {});

    if (result.ok) {
      // Store baseline for Phase 110 to retrieve
      emit.setPwPre(result);
      ctx.phaseEnd(entry, "done", {
        screenshots: result.screenshots ? result.screenshots.length : 0,
        routes: result.routes ? result.routes.length : 0,
        jsErrors: result.jsErrors ? result.jsErrors.length : 0,
        durationMs: result.durationMs || 0
      });
      emit.setLogs(function(p) {
        return p.map(function(l) {
          if (l.phase === "visual_baseline" && l.st === "run") {
            return Object.assign({}, l, {
              st: "done",
              detail: (result.screenshots ? result.screenshots.length : 0) + " screenshots, " + (result.routes ? result.routes.length : 0) + " routes",
              durationMs: Date.now() - l.ts
            });
          }
          return l;
        });
      });
      if (emit.addToast) emit.addToast("Baseline visual capturado", "success");
    } else if (result.skipped) {
      ctx.phaseEnd(entry, "skipped", { reason: result.reason });
      emit.setLogs(function(p) {
        return p.map(function(l) {
          if (l.phase === "visual_baseline" && l.st === "run") {
            return Object.assign({}, l, { st: "skipped", detail: result.reason, durationMs: Date.now() - l.ts });
          }
          return l;
        });
      });
    } else {
      ctx.phaseEnd(entry, "error", { error: result.error });
      emit.setLogs(function(p) {
        return p.map(function(l) {
          if (l.phase === "visual_baseline" && l.st === "run") {
            return Object.assign({}, l, { st: "error", detail: result.error || "Unknown error", durationMs: Date.now() - l.ts });
          }
          return l;
        });
      });
    }
  })();
});

// ══════════════════════════════════════════════════════════════
// Phase 110: Post-migration visual fidelity check
// ══════════════════════════════════════════════════════════════
registerPhase(110, "pw_post", "Visual Fidelity Check", function(ctx) {
  return (async function() {
    var emit = ctx.emit;
    var config = ctx.config;

    // Retrieve pre-migration baseline
    var preBaseline = emit.getPwPre ? emit.getPwPre() : null;
    if (!preBaseline) {
      emit.setLogs(function(p) {
        return p.concat([{
          type: "phase", phase: "visual_compare", st: "skipped", ts: Date.now(),
          detail: "No pre-migration baseline — skipping visual comparison"
        }]);
      });
      return;
    }

    var entry = ctx.phaseStart("pw_post", "Visual Fidelity Check");
    emit.setMigPhase("visual_compare");
    emit.setLogs(function(p) {
      return p.concat([{
        type: "phase", phase: "visual_compare", st: "run", ts: Date.now(),
        detail: "Capturing migrated code and comparing..."
      }]);
    });

    // Build migrated files from results
    var results = ctx.results || [];
    var migratedFiles = results.map(function(r) {
      return {
        name: r.targetName || r.name,
        path: r.targetPath || r.targetName || r.name,
        content: r.migrated
      };
    });

    // Capture post-migration baseline
    var lang = config.tL || '';
    var postBaseline = await captureBaseline(migratedFiles, lang, {});

    if (!postBaseline.ok) {
      ctx.phaseEnd(entry, "error", { error: postBaseline.error || "Post capture failed" });
      emit.setLogs(function(p) {
        return p.map(function(l) {
          if (l.phase === "visual_compare" && l.st === "run") {
            return Object.assign({}, l, { st: "error", detail: postBaseline.error || "Post capture failed", durationMs: Date.now() - l.ts });
          }
          return l;
        });
      });
      return;
    }

    // Compare pre vs post
    var comparison = await compareBaselines(preBaseline, postBaseline);

    if (comparison.ok) {
      emit.setPwComparison(comparison);

      // Build and store Visual QA Report
      try {
        var migId = ctx.audit ? ctx.audit.id : "MIG-" + Date.now();
        var vqaReport = await buildVisualQAReport(migId, preBaseline, postBaseline, comparison, {
          sourceLanguage: config.sL || "",
          targetLanguage: config.tL || "",
          fileCount: config.files ? config.files.length : 0,
          fileNames: config.files ? config.files.map(function(f) { return f.name; }) : [],
          viewport: { width: 1280, height: 720 }
        });
        if (emit.setVisualQA) emit.setVisualQA(vqaReport);
      } catch (vqaErr) {
        console.error("[VQA Report]", vqaErr.message);
      }

      // Integrate visual score into audit
      if (ctx.audit && comparison.compositeScore != null) {
        ctx.audit.visualFidelityScore = comparison.compositeScore;
        if (ctx.audit.finalScore != null) {
          ctx.audit.originalIntegrationScore = ctx.audit.finalScore;
          ctx.audit.finalScore = Math.round(ctx.audit.finalScore * 0.7 + comparison.compositeScore * 0.3);
        }
      }

      ctx.phaseEnd(entry, "done", {
        visualScore: comparison.visualScore,
        domSimilarity: comparison.domSimilarity,
        functionalScore: comparison.functionalScore,
        compositeScore: comparison.compositeScore,
        durationMs: comparison.durationMs || 0
      });
      emit.setLogs(function(p) {
        return p.map(function(l) {
          if (l.phase === "visual_compare" && l.st === "run") {
            return Object.assign({}, l, {
              st: "done",
              detail: "Visual: " + comparison.visualScore + "% | DOM: " + comparison.domSimilarity + "% | Composite: " + comparison.compositeScore + "%",
              score: comparison.compositeScore,
              durationMs: Date.now() - l.ts
            });
          }
          return l;
        });
      });
      if (emit.addToast) emit.addToast("Visual fidelity: " + comparison.compositeScore + "/100", comparison.compositeScore >= 80 ? "success" : "warning");
    } else {
      ctx.phaseEnd(entry, "error", { error: comparison.error });
      emit.setLogs(function(p) {
        return p.map(function(l) {
          if (l.phase === "visual_compare" && l.st === "run") {
            return Object.assign({}, l, { st: "error", detail: comparison.error, durationMs: Date.now() - l.ts });
          }
          return l;
        });
      });
    }
  })();
});
