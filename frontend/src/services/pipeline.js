import { LANGS } from "../config/languages.js";
import { MODELS } from "../config/models.js";
import { mkDiff, mkRisks } from "./utils.js";
import { runVirtualQA, compareVirtualQA } from "./qaHelpers.js";
import { calcCapacity, resetTks, _tks, _activeController, setCancelled as setClaudeCancelled, setActiveController as setClaudeController } from "./claudeClient.js";
import { doCodebaseAnalysis, doFilePlan, doMigrate, doDependencyAudit, doConsolidation, doIntegrationCheck, doIntegrationFix, mapTargetFile } from "./migrationPhases.js";

// ══════════════════════════════════════════════════════════════
// MigraOps Pipeline — Extensible migration engine
// ══════════════════════════════════════════════════════════════
// Extracted from App.jsx to enable:
//  1. Clean separation of pipeline logic from UI
//  2. Extensible phase system (e.g., Phase 0 Playwright capture)
//  3. Testable pipeline without React dependency
// ══════════════════════════════════════════════════════════════

// ── Phase registry for extensibility ──
var registeredPhases = [];

export function registerPhase(position, id, name, handler) {
  registeredPhases.push({ position: position, id: id, name: name, handler: handler });
  registeredPhases.sort(function(a, b) { return a.position - b.position; });
}

export function getRegisteredPhases() {
  return registeredPhases.slice();
}

// ── Audit trail helpers ──
function phaseStart(audit, id, name, meta) {
  var entry = { id: id, name: name, startedAt: new Date().toISOString(), startMs: Date.now(), completedAt: null, durationMs: 0, status: "running" };
  if (meta) Object.keys(meta).forEach(function(k) { entry[k] = meta[k]; });
  audit.phases.push(entry);
  return entry;
}

function phaseEnd(entry, status, meta) {
  entry.completedAt = new Date().toISOString();
  entry.durationMs = Date.now() - entry.startMs;
  entry.status = status || "done";
  if (meta) Object.keys(meta).forEach(function(k) { entry[k] = meta[k]; });
}

// ══════════════════════════════════════════════════════════════
// runMigration — Main pipeline execution
// ══════════════════════════════════════════════════════════════
// config: { files, sL, sV, tL, tV, mod, uiL, pr (DPROMPTS) }
// emit:   { setVw, setProg, setRes, setLogs, setRsk, setIntR, setCbA,
//           setMigPhase, setAuditTrail, setActiveAgent, setHist,
//           setMigGate, setMigGateLog, setTOut, setAiR, setDeepR, setFixR,
//           addToast, setMigStartTs, cancelRef, globalTimerRef, gateResolveRef,
//           setCancelled, setActiveController, waitForGate, APP }
// ══════════════════════════════════════════════════════════════
export async function runMigration(config, emit) {
  var files = config.files;
  var sL = config.sL;
  var sV = config.sV;
  var tL = config.tL;
  var tV = config.tV;
  var mod = config.mod;
  var uiL = config.uiL;
  var pr = config.pr;

  if (!files.length || !tL || !tV) return;

  // ── Initial state reset ──
  emit.setVw("migrating");
  emit.setProg(0);
  emit.setRes([]);
  emit.setLogs([]);
  emit.setTOut(null);
  emit.setAiR(null);
  emit.setDeepR(null);
  emit.setFixR(null);
  emit.setIntR(null);
  emit.setCbA(null);
  emit.setMigPhase("analysis");
  emit.setAuditTrail(null);
  emit.setMigGate(null);
  emit.setMigGateLog([]);
  emit.gateResolveRef.current = null;
  emit.addToast(files.length + " archivo(s)", "success");
  emit.setMigStartTs(Date.now());
  emit.cancelRef.current = false;
  resetTks();
  emit.setCancelled(false);
  emit.setActiveController(null);

  // ── Global timeout ──
  var GLOBAL_TIMEOUT = Math.max(10 * 60 * 1000, (2 * 60 * 1000) + (files.length * 90 * 1000) + (3 * 60 * 1000));
  if (emit.globalTimerRef.current) clearTimeout(emit.globalTimerRef.current);
  emit.globalTimerRef.current = setTimeout(function() {
    if (emit.cancelRef.current) return;
    setClaudeCancelled(true);
    emit.cancelRef.current = true;
    if (_activeController) try { _activeController.abort(); } catch(e) {}
    emit.setLogs(function(p) { return p.concat([{ type: "phase", phase: "global_timeout", st: "done", ts: Date.now(), detail: "Auto-cancelled: exceeded time limit" }]); });
    emit.setActiveAgent(null);
    emit.setMigPhase("done");
    setTimeout(function() { if (config.files.length) emit.setVw("results"); else emit.setVw("upload"); }, 1000);
  }, GLOBAL_TIMEOUT);

  // ── Audit trail (initialized early so pre-phases can use it) ──
  var ml = MODELS.find(function(m) { return m.id === mod; });
  var migStart = Date.now();
  var audit = {
    id: "MIG-" + migStart,
    startedAt: new Date(migStart).toISOString(),
    completedAt: null,
    totalDurationMs: 0,
    config: {
      source: (LANGS[sL] || {}).n + " " + sV,
      target: (LANGS[tL] || {}).n + " " + tV,
      model: ml ? ml.n : mod,
      modelId: mod,
      fileCount: files.length,
      fileNames: files.map(function(f) { return f.name; }),
      uiLanguage: uiL
    },
    phases: [],
    apiCalls: 0
  };

  // ── Pre-migration phases (registered extensions like Playwright Phase 0) ──
  var prePhases = registeredPhases.filter(function(p) { return p.position < 0; });
  for (var pi = 0; pi < prePhases.length; pi++) {
    if (emit.cancelRef.current) return;
    var prePh = prePhases[pi];
    try {
      await prePh.handler({
        config: config,
        emit: emit,
        phaseStart: function(id, name, meta) { return phaseStart(audit, id, name, meta); },
        phaseEnd: phaseEnd
      });
    } catch (preErr) {
      console.warn("[Pipeline] Pre-phase " + prePh.id + " failed:", preErr.message);
      emit.setLogs(function(p) {
        return p.concat([{
          type: "phase", phase: prePh.id, st: "error", ts: Date.now(),
          detail: "Pre-phase error: " + preErr.message
        }]);
      });
    }
  }

  try {
    var rr = mkRisks(sL, tL);
    emit.setRsk(rr);
    var W = { a: 8, b: 30, b2: 12, c: 35, d: 15 };

    // ═══ PHASE A: Codebase Analysis (0-8%) ═══
    emit.setActiveAgent("architect");
    emit.setMigPhase("analysis");
    emit.setLogs([{ type: "phase", phase: "analysis", st: "run", ts: Date.now() }]);
    emit.setProg(2);
    var phA = phaseStart(audit, "A", "Codebase Analysis");
    audit.apiCalls++;
    var cbCtx = await doCodebaseAnalysis(files, sL, sV, tL, tV, mod, { useChain: true, onAgentChange: function(agentId) { emit.setActiveAgent(agentId); } });
    phaseEnd(phA, cbCtx.ok ? "done" : "error", { detail: cbCtx.ok ? (cbCtx.analysis.purpose || "OK") : "Error", ok: cbCtx.ok });
    emit.setCbA(cbCtx);
    emit.setLogs(function(p) { return p.map(function(l) { return l.phase === "analysis" ? Object.assign({}, l, { st: "done", detail: cbCtx.ok ? (cbCtx.analysis.purpose || "") : "Error", durationMs: Date.now() - l.ts }) : l; }); });
    emit.setProg(W.a);

    // ═══ GATE: Post-Analysis ═══
    if (!emit.cancelRef.current) {
      var analysisSum = cbCtx.ok ? (cbCtx.analysis.purpose || "Análisis completado") : "Error en análisis: " + (cbCtx.error || "desconocido");
      var fileOrder = (cbCtx.ok && cbCtx.analysis.migrationOrder) ? cbCtx.analysis.migrationOrder : files.map(function(f) { return f.name; });
      var gateA = await emit.waitForGate("analysis", "Análisis completado",
        analysisSum + "\n\nSe encontraron " + files.length + " archivo(s). Orden de migración propuesto:\n" + fileOrder.map(function(f, i) { return (i + 1) + ". " + f; }).join("\n"),
        { analysis: cbCtx, fileOrder: fileOrder },
        { approveLabel: "Continuar migración", rejectLabel: "Cancelar" }
      );
      if (!gateA.approved) { emit.cancelRef.current = true; emit.setMigPhase("done"); return; }
    }

    // ═══ PHASE B: Migrate files in dependency order ═══
    emit.setActiveAgent("developer");
    emit.setMigPhase("migration");
    var phB = phaseStart(audit, "B", "File Migration", { fileCount: files.length, files: [] });
    var rs = [];
    var fc = files.length;
    var isCross = sL !== tL;

    var orderedFiles = files.slice();
    if (cbCtx && cbCtx.ok && cbCtx.analysis.migrationOrder) {
      var order = cbCtx.analysis.migrationOrder;
      orderedFiles.sort(function(a, b) {
        var ai = order.findIndex(function(o) { return a.name.indexOf(o) >= 0 || o.indexOf(a.name) >= 0; });
        var bi = order.findIndex(function(o) { return b.name.indexOf(o) >= 0 || o.indexOf(b.name) >= 0; });
        if (ai < 0) ai = 999; if (bi < 0) bi = 999;
        return ai - bi;
      });
    }

    // Cross-language file mapping
    var fileMap = [];
    if (isCross) {
      var aiMapping = (cbCtx && cbCtx.ok && cbCtx.analysis.fileMapping) || [];
      orderedFiles.forEach(function(f) {
        var aiMap = aiMapping.find(function(m) { return m.source === f.name || (f.path && m.source === f.path); });
        if (aiMap) {
          fileMap.push({ source: f.name, sourcePath: f.path || f.name, target: aiMap.target, targetPath: aiMap.targetPath || aiMap.target });
        } else {
          var mapped = mapTargetFile(f.name, f.path, sL, tL);
          fileMap.push({ source: f.name, sourcePath: f.path || f.name, target: mapped.name, targetPath: mapped.path || mapped.name });
        }
      });
    }

    // Per-file migration
    var migrateOneFile = async function(fileIdx) {
      var f = orderedFiles[fileIdx];
      var thisName = f.name;
      var mapping = isCross ? fileMap.find(function(m) { return m.source === f.name; }) : null;
      var targetFN = mapping ? mapping.target : f.name;
      var targetPath = mapping ? mapping.targetPath : (f.path || f.name);
      var lineCount = f.content.split("\n").length;

      // Adaptive capacity
      var fileComplexity = "moderate", estChanges = 0, procHints = null;
      if (cbCtx && cbCtx.ok && cbCtx.analysis.files) {
        var fi = cbCtx.analysis.files.find(function(af) { return thisName.indexOf(af.name) >= 0; });
        if (fi) { fileComplexity = fi.complexity || "moderate"; estChanges = fi.estimatedChanges || 0; procHints = fi.processingHints || null; }
      }
      var cap = calcCapacity(fileComplexity, lineCount, isCross, estChanges, procHints);

      var fileEntry = { name: thisName, targetName: targetFN, startedAt: new Date().toISOString(), startMs: Date.now(), completedAt: null, durationMs: 0, status: "running", changes: 0, capacity: cap.label };
      phB.files.push(fileEntry);

      // Step 1: Plan
      emit.setLogs(function(p) { return p.concat([{ type: "file", file: thisName, targetFile: targetFN, st: "planning", ts: Date.now(), capacity: cap }]); });
      audit.apiCalls++;
      var filePlan = { ok: false };
      try {
        filePlan = await doFilePlan(f.content, thisName, sL, sV, tL, tV, mod, cbCtx, rs, targetFN, cap);
      } catch(planErr) {
        filePlan = { ok: false, error: planErr.message };
      }
      var planChanges = filePlan.ok && filePlan.plan ? filePlan.plan.totalChanges || 0 : 0;
      var planComplexity = filePlan.ok && filePlan.plan ? filePlan.plan.complexity || fileComplexity : fileComplexity;

      if (planComplexity !== fileComplexity) {
        cap = calcCapacity(planComplexity, lineCount, isCross, planChanges || estChanges, procHints);
      }

      emit.setLogs(function(p) { return p.map(function(l) {
        if (l.file !== thisName || l.type !== "file") return l;
        return Object.assign({}, l, { st: "migrating", planChanges: planChanges, planComplexity: planComplexity, planOk: filePlan.ok, capacity: cap });
      }); });

      // Step 2: Migrate
      audit.apiCalls++;
      var successfulSiblings = rs.filter(function(s) { return !s.failed; });
      var r = await doMigrate(f.content, thisName, sL, sV, tL, tV, mod, pr, cbCtx, successfulSiblings, targetFN, isCross ? fileMap : null, filePlan, cap);
      var d = mkDiff(f.content, r.migrated);
      rs.push(Object.assign({}, f, r, { diff: d, targetName: targetFN, targetPath: targetPath, isCross: isCross }));
      var thisChanges = r.changes.length;
      fileEntry.completedAt = new Date().toISOString();
      fileEntry.durationMs = Date.now() - fileEntry.startMs;
      fileEntry.status = r.engine === "fallback" ? "error" : "done";
      fileEntry.changes = thisChanges;
      fileEntry.engine = r.engine;
      emit.setLogs(function(p) { return p.map(function(l) {
        if (l.file !== thisName || l.type !== "file") return l;
        var preview = r.changes.slice(0, 3);
        var linesOrig = f.content.split("\n").length;
        var linesMig = r.migrated.split("\n").length;
        return Object.assign({}, l, { st: "done", ch: thisChanges, durationMs: Date.now() - l.ts, preview: preview, linesOrig: linesOrig, linesMig: linesMig, tkI: _tks.last.i, tkO: _tks.last.o, capacity: cap });
      }); });
      emit.setProg(Math.round(W.a + W.b * ((fileIdx + 1) / fc)));
      emit.setRes(rs.slice());

      // ═══ GATE: Post-File ═══
      if (!emit.cancelRef.current && emit.gateResolveRef.current !== "skip") {
        var changesList = r.changes.length > 0 ? r.changes.slice(0, 5).map(function(c) { return "\u2022 " + c; }).join("\n") : "Sin cambios detectados";
        var gateF = await emit.waitForGate("file", "Archivo migrado: " + (targetFN || thisName),
          "Archivo: " + thisName + " \u2192 " + (targetFN || thisName) + "\nCambios: " + r.changes.length + "\n" + changesList +
          "\n\nL\u00edneas: " + f.content.split("\n").length + " \u2192 " + r.migrated.split("\n").length,
          { fileIdx: fileIdx, fileName: thisName, targetName: targetFN, changes: r.changes, migrated: r.migrated, original: f.content },
          { approveLabel: "Aprobar " + (fileIdx + 1) + "/" + fc, rejectLabel: "Rechazar y re-migrar", skipLabel: fc > 1 ? "Aprobar todos restantes" : null }
        );
        if (gateF.feedback === "skip_all") { emit.gateResolveRef.current = "skip"; }
        if (!gateF.approved && gateF.feedback) {
          audit.apiCalls++;
          var rr2 = await doMigrate(f.content, thisName, sL, sV, tL, tV, mod, pr, cbCtx, rs.slice(0, -1), targetFN, isCross ? fileMap : null,
            Object.assign({}, filePlan, { userFeedback: gateF.feedback }), cap);
          var d2 = mkDiff(f.content, rr2.migrated);
          rs[rs.length - 1] = Object.assign({}, f, rr2, { diff: d2, targetName: targetFN, targetPath: targetPath, isCross: isCross });
          emit.setRes(rs.slice());
        }
      }
    };

    for (var i = 0; i < fc; i++) { if (emit.cancelRef.current) break; await migrateOneFile(i); }
    emit.setLogs(function(p) { return p.map(function(l) { return l.type === "file" && l.st !== "done" ? Object.assign({}, l, { st: "done", ch: l.ch || 0 }) : l; }); });
    phaseEnd(phB, "done", { fileCount: fc });

    // ═══ PHASE B2: Consolidation ═══
    if (fc > 1 && !emit.cancelRef.current) {
      emit.setActiveAgent("developer");
      emit.setMigPhase("consolidation");

      // B2a: Dependency Audit
      var phB2a = phaseStart(audit, "B2a", "Dependency Audit", { fileCount: fc });
      emit.setLogs(function(p) { return p.concat([{ type: "phase", phase: "consolidation", subPhase: "audit", st: "run", ts: Date.now(), label: "Auditing cross-file dependencies..." }]); });
      emit.setProg(W.a + W.b + 1);
      audit.apiCalls++;
      var depAudit = await doDependencyAudit(orderedFiles, rs, sL, sV, tL, tV, mod);
      var auditIssues = depAudit.ok && depAudit.audit ? (depAudit.audit.issues || []).length : 0;
      var auditConns = depAudit.ok && depAudit.audit ? (depAudit.audit.connections || []).length : 0;
      var auditBroken = depAudit.ok && depAudit.audit ? (depAudit.audit.connections || []).filter(function(c) { return !c.compatible; }).length : 0;
      phaseEnd(phB2a, "done", { issues: auditIssues, connections: auditConns, broken: auditBroken });
      emit.setLogs(function(p) { return p.map(function(l) { return l.subPhase === "audit" && l.type === "phase" ? Object.assign({}, l, { st: "done", issues: auditIssues, connections: auditConns, broken: auditBroken, durationMs: Date.now() - l.ts }) : l; }); });

      // B2b: Consolidation Fix
      var phB2b = phaseStart(audit, "B2b", "Consolidation Fix", { fileCount: fc, auditIssues: auditIssues });
      emit.setLogs(function(p) { return p.concat([{ type: "phase", phase: "consolidation", subPhase: "fix", st: "run", ts: Date.now(), label: "Fixing " + auditIssues + " issues across " + fc + " files..." }]); });
      emit.setProg(W.a + W.b + 3);
      audit.apiCalls++;
      var consResult = await doConsolidation(orderedFiles, rs, sL, sV, tL, tV, mod, depAudit);
      if (consResult.ok && consResult.files) {
        var consFixed = 0;
        rs = rs.map(function(r) {
          var consolidated = consResult.files[r.targetName || r.name] || consResult.files[r.name];
          if (consolidated && consolidated !== r.migrated) {
            consFixed++;
            return Object.assign({}, r, { migrated: consolidated, diff: mkDiff(r.content, consolidated), changes: r.changes.concat(["Cross-file consolidation"]) });
          }
          return r;
        });
        emit.setRes(rs.slice());
        phaseEnd(phB2b, "done", { fixedFiles: consFixed, totalFixes: (consResult.fixes || []).length });
        emit.setLogs(function(p) { return p.map(function(l) { return l.subPhase === "fix" && l.type === "phase" ? Object.assign({}, l, { st: "done", fixed: consFixed, fixes: (consResult.fixes || []).length, durationMs: Date.now() - l.ts }) : l; }); });
      } else {
        phaseEnd(phB2b, "error", { error: consResult.error || "parse error" });
        emit.setLogs(function(p) { return p.map(function(l) { return l.subPhase === "fix" && l.type === "phase" ? Object.assign({}, l, { st: "error" }) : l; }); });
      }
      emit.setProg(W.a + W.b + W.b2);

      // ═══ GATE: Post-Consolidation ═══
      if (!emit.cancelRef.current && consResult.ok) {
        var consMsg = "Consolidaci\u00f3n completada.\nConexiones: " + auditConns + ", Rotas: " + auditBroken + ", Issues: " + auditIssues;
        if (consResult.ok && consFixed > 0) consMsg += "\nArchivos corregidos: " + consFixed;
        var gateB2 = await emit.waitForGate("consolidation", "Consolidaci\u00f3n cross-file", consMsg,
          { connections: auditConns, broken: auditBroken, issues: auditIssues, fixed: consFixed },
          { approveLabel: "Continuar a validaci\u00f3n", rejectLabel: "Cancelar" }
        );
        if (!gateB2.approved) { emit.cancelRef.current = true; emit.setMigPhase("done"); return; }
      }
    }

    // ═══ PHASE C+D LOOP: Integration Check → Fix → Re-check ═══
    var INT_PASS = 90, INT_MAX = 2;
    emit.setActiveAgent("qa");
    emit.setMigPhase("integration");
    var intCheck = null, intIter = 0, prevCtx = null, prevIssues = null, lastScore = -1;
    var bestScore = -1, bestRs = null;

    for (var ii = 0; ii < INT_MAX; ii++) {
      if (emit.cancelRef.current) break;
      intIter = ii + 1;

      // C: Validate integration
      var phC = phaseStart(audit, "C" + intIter, "Integration Check #" + intIter, { iteration: intIter });
      emit.setLogs(function(p) {
        var existing = p.filter(function(l) { return !(l.phase === "integration" && l.type === "phase" && l.st === "run"); });
        return existing.concat([{ type: "phase", phase: "integration", st: "run", iter: intIter, ts: Date.now() }]);
      });
      var progC = W.a + W.b + W.b2 + Math.round((W.c + W.d) * (ii / (INT_MAX))) + 2;
      emit.setProg(progC);
      audit.apiCalls++;
      intCheck = await doIntegrationCheck(files, rs, sL, sV, tL, tV, mod, uiL, prevCtx, { useChain: true, onAgentChange: function(agentId) { emit.setActiveAgent(agentId); } });
      var intScore = intCheck.ok ? (intCheck.result.score || 0) : 0;
      var intIssues = intCheck.ok ? (intCheck.result.issues || []) : [];
      var intAllIssues = intIssues.length;
      var critCount = intIssues.filter(function(x) { return x.severity === "critical"; }).length;
      var majorCount = intIssues.filter(function(x) { return x.severity === "major"; }).length;
      var modCount = intIssues.filter(function(x) { return x.severity === "moderate"; }).length;
      phaseEnd(phC, intCheck.ok ? "done" : "error", { score: intScore, issueCount: intAllIssues, criticalCount: critCount, majorCount: majorCount, moderateCount: modCount });

      emit.setLogs(function(p) { return p.map(function(l) { return l.phase === "integration" && l.type === "phase" && l.st === "run" ? Object.assign({}, l, { st: "checked", score: intScore, issues: intAllIssues, iter: intIter, durationMs: Date.now() - l.ts }) : l; }); });

      // Regression guard
      if (ii > 0 && bestScore > 0 && intScore < bestScore - 2) {
        rs = bestRs.map(function(r) { return Object.assign({}, r); });
        emit.setRes(rs.slice());
        phC.rolledBack = true;
        phC.rolledBackScore = intScore;
        phC.score = bestScore;
        emit.setLogs(function(p) {
          var updated = p.map(function(l) {
            if (l.phase === "integration" && l.type === "phase" && l.iter === intIter && l.st === "checked")
              return Object.assign({}, l, { st: "rolled_back", rolledBackScore: intScore });
            return l;
          });
          return updated.concat([{ type: "phase", phase: "rollback", st: "done", iter: intIter, score: bestScore, prevScore: intScore, ts: Date.now(), detail: "Score dropped " + bestScore + " \u2192 " + intScore + ", rolled back to best" }]);
        });
        intCheck = Object.assign({}, intCheck, { result: Object.assign({}, intCheck.result, { score: bestScore }) });
        intScore = bestScore;
        break;
      }

      if (intScore > bestScore) {
        bestScore = intScore;
        bestRs = rs.map(function(r) { return Object.assign({}, r); });
      }

      var blockingIssues = intIssues.filter(function(is) { return is.severity === "critical" || is.severity === "major"; });
      if (intScore >= INT_PASS && blockingIssues.length === 0) {
        emit.setLogs(function(p) { return p.map(function(l) { return l.phase === "integration" && l.type === "phase" ? Object.assign({}, l, { st: "done", score: intScore, issues: intAllIssues, iter: intIter, pass: true, durationMs: Date.now() - (l.ts || Date.now()) }) : l; }); });
        break;
      }

      // Stall detection
      if (ii > 0 && lastScore >= 0 && intScore <= lastScore + 2) {
        emit.setLogs(function(p) { return p.concat([{ type: "phase", phase: "stall", st: "done", iter: intIter, score: intScore, prevScore: lastScore, ts: Date.now() }]); });
        break;
      }
      lastScore = intScore;

      // ═══ GATE: Post-Integration-Check ═══
      if (!emit.cancelRef.current) {
        var issuesSummary = critCount > 0 ? critCount + " cr\u00edticos, " : "";
        issuesSummary += majorCount > 0 ? majorCount + " mayores, " : "";
        issuesSummary += modCount > 0 ? modCount + " moderados" : "sin issues graves";
        var gateC = await emit.waitForGate("integration", "Validaci\u00f3n: " + intScore + "/100",
          "Score de integraci\u00f3n: " + intScore + "/100 (m\u00ednimo: " + INT_PASS + ")\nIssues: " + issuesSummary +
          "\n\n\u00bfAplicar correcciones autom\u00e1ticas?",
          { score: intScore, issues: intAllIssues, critical: critCount, major: majorCount },
          { approveLabel: "Corregir issues (" + intAllIssues + ")", rejectLabel: "Aceptar tal cual", skipLabel: "Finalizar migraci\u00f3n" }
        );
        if (!gateC.approved) { break; }
      }

      // D: Fix
      var fixableIssues = intIter <= 2 ? intIssues : intIssues.filter(function(is) { return is.severity === "critical" || is.severity === "major" || is.severity === "moderate"; });
      if (fixableIssues.length === 0) fixableIssues = intIssues;
      var phD = phaseStart(audit, "D" + intIter, "Integration Fix #" + intIter, { iteration: intIter, issueCount: fixableIssues.length });
      emit.setMigPhase("qa");
      emit.setLogs(function(p) { return p.concat([{ type: "phase", phase: "qa", st: "run", iter: intIter, issues: fixableIssues.length, ts: Date.now() }]); });
      emit.setProg(progC + Math.round((W.c + W.d) / (INT_MAX * 2)));
      audit.apiCalls++;
      var fixResult = await doIntegrationFix(files, rs, fixableIssues, sL, sV, tL, tV, mod, intIter, prevIssues);
      var fixedFileCount = 0;
      if (fixResult.ok && fixResult.files) {
        rs = rs.map(function(r) {
          var fixedCode = fixResult.files[r.targetName || r.name] || fixResult.files[r.name];
          if (fixedCode && fixedCode !== r.migrated) {
            fixedFileCount++;
            return Object.assign({}, r, { migrated: fixedCode, diff: mkDiff(r.content, fixedCode), changes: r.changes.concat(["Integration fix #" + intIter]), intFixed: true });
          }
          return r;
        });
        emit.setRes(rs.slice());
      }
      phaseEnd(phD, fixResult.ok ? "done" : "error", { fixedFiles: fixedFileCount, ok: fixResult.ok });
      emit.setLogs(function(p) { return p.map(function(l) { return l.phase === "qa" && l.type === "phase" && l.st === "run" ? Object.assign({}, l, { st: "done", fixed: fixResult.ok, fixedFiles: fixedFileCount, iter: intIter, durationMs: Date.now() - l.ts }) : l; }); });

      prevIssues = intIssues;
      prevCtx = {
        verified: (intCheck.ok ? (intCheck.result.verified || []) : []),
        fixedIssues: intIssues || [],
        modifiedFiles: Object.keys(fixResult.files || {}),
        untouchedFiles: rs.filter(function(r) { return !(fixResult.files || {})[r.targetName || r.name] && !(fixResult.files || {})[r.name]; }).map(function(r) { return r.targetName || r.name; })
      };
    }

    // ═══ PHASE E: QA Testing — Virtual execution & comparison ═══
    if (!emit.cancelRef.current) {
      emit.setActiveAgent("qa");
      emit.setMigPhase("qa-testing");
      var phE = phaseStart(audit, "E", "QA Testing");
      emit.setLogs(function(p) { return p.concat([{ type: "phase", phase: "qa-testing", st: "run", ts: Date.now(), label: "Running virtual QA tests..." }]); });

      try {
        // E1: Virtual QA on source code
        var sourceFiles = files.map(function(f) { return { name: f.name, content: f.content }; });
        var preVQA = await runVirtualQA(sourceFiles, sL, sV, mod, "pre");

        // E2: Virtual QA on migrated code
        var migratedFiles = rs.map(function(r) { return { name: r.targetName || r.name, content: r.migrated }; });
        var postVQA = await runVirtualQA(migratedFiles, tL, tV, mod, "post");

        // E3: Compare pre vs post
        var vqaComparison = null;
        if (preVQA.ok && postVQA.ok) {
          vqaComparison = compareVirtualQA(preVQA.virtual, postVQA.virtual);
        }

        audit.apiCalls += 2;

        // Emit results to state
        emit.setQaVPreR(preVQA.ok ? preVQA.virtual : null);
        emit.setQaVPostR(postVQA.ok ? postVQA.virtual : null);

        var qaTestData = {
          pre: preVQA,
          post: postVQA,
          comparison: vqaComparison,
          timestamp: new Date().toISOString()
        };
        emit.setQaTests(qaTestData);

        var totalTests = (preVQA.ok ? preVQA.virtual.summary.totalTests : 0) + (postVQA.ok ? postVQA.virtual.summary.totalTests : 0);
        var bugsFound = (preVQA.ok ? preVQA.virtual.summary.bugsFound : 0) + (postVQA.ok ? postVQA.virtual.summary.bugsFound : 0);
        var preservationRate = vqaComparison ? vqaComparison.preservationRate : null;

        phaseEnd(phE, "done", { totalTests: totalTests, bugsFound: bugsFound, preservationRate: preservationRate });
        emit.setLogs(function(p) { return p.map(function(l) { return l.phase === "qa-testing" && l.type === "phase" ? Object.assign({}, l, { st: "done", totalTests: totalTests, bugsFound: bugsFound, preservationRate: preservationRate, durationMs: Date.now() - l.ts }) : l; }); });
      } catch (qaErr) {
        phaseEnd(phE, "error", { error: qaErr.message });
        emit.setLogs(function(p) { return p.map(function(l) { return l.phase === "qa-testing" && l.type === "phase" ? Object.assign({}, l, { st: "error", detail: qaErr.message, durationMs: Date.now() - l.ts }) : l; }); });
      }
    }

    // ── Set initial finalScore before post-phases so they can read/blend it ──
    audit.finalScore = intCheck && intCheck.ok ? intCheck.result.score : null;
    audit.finalPass = intCheck && intCheck.ok ? intCheck.result.pass : false;

    // ── Post-migration phases (registered extensions) ──
    var postPhases = registeredPhases.filter(function(p) { return p.position > 100; });
    for (var ppi = 0; ppi < postPhases.length; ppi++) {
      if (emit.cancelRef.current) break;
      var postPh = postPhases[ppi];
      try {
        await postPh.handler({
          config: config,
          emit: emit,
          results: rs,
          audit: audit,
          intCheck: intCheck,
          phaseStart: function(id, name, meta) { return phaseStart(audit, id, name, meta); },
          phaseEnd: phaseEnd
        });
      } catch (postErr) {
        console.warn("[Pipeline] Post-phase " + postPh.id + " failed:", postErr.message);
        emit.setLogs(function(p) {
          return p.concat([{
            type: "phase", phase: postPh.id, st: "error", ts: Date.now(),
            detail: "Post-phase error: " + postErr.message
          }]);
        });
      }
    }

    // ── Completion ──
    emit.setProg(100);
    if (emit.globalTimerRef.current) { clearTimeout(emit.globalTimerRef.current); emit.globalTimerRef.current = null; }
    emit.setCancelled(false);
    emit.setActiveController(null);
    emit.setMigPhase("done");
    emit.setIntR(intCheck);
    audit.completedAt = new Date().toISOString();
    audit.totalDurationMs = Date.now() - migStart;
    if (audit.finalScore == null) {
      audit.finalScore = intCheck && intCheck.ok ? intCheck.result.score : null;
    }
    if (audit.finalPass == null) {
      audit.finalPass = intCheck && intCheck.ok ? intCheck.result.pass : false;
    }
    audit.phases.forEach(function(ph) { delete ph.startMs; if (ph.files) ph.files.forEach(function(f) { delete f.startMs; }); });
    emit.setAuditTrail(audit);
    emit.setHist(function(p) { return [{ id: Date.now(), date: new Date().toLocaleString(), from: (LANGS[sL] || {}).n + " " + sV, to: (LANGS[tL] || {}).n + " " + tV, ml: ml ? ml.n : "", fc: files.length, results: rs, risks: rr, integration: intCheck, codebaseAnalysis: cbCtx, audit: audit }].concat(p); });
    if (document.hidden) { document.title = emit.APP.n; setTimeout(function() { document.title = emit.APP.n; }, 10000); }

  } catch(pipeErr) {
    if (emit.globalTimerRef.current) { clearTimeout(emit.globalTimerRef.current); emit.globalTimerRef.current = null; }
    emit.setCancelled(false);
    emit.setActiveController(null);
    var audit2 = audit || { phases: [], apiCalls: 0 };
    audit2.completedAt = new Date().toISOString();
    audit2.totalDurationMs = Date.now() - (migStart || Date.now());
    audit2.finalScore = (function() { var bs = null; audit2.phases.forEach(function(ph) { if (ph.score !== undefined && ph.score !== null && (bs === null || ph.score > bs)) bs = ph.score; }); return bs; })();
    audit2.phases.forEach(function(ph) { delete ph.startMs; if (ph.files) ph.files.forEach(function(f) { delete f.startMs; }); });
    emit.setAuditTrail(audit2);
    emit.setMigPhase("done");
    // Access current results via callback to avoid stale closure
    emit.onError(function(currentRes, currentRsk, currentIntR) {
      if (currentRes.length > 0) {
        emit.setHist(function(p) { return [{ id: Date.now(), date: new Date().toLocaleString(), from: (LANGS[sL] || {}).n + " " + sV, to: (LANGS[tL] || {}).n + " " + tV, ml: (MODELS.find(function(m) { return m.id === mod; }) || {}).n || "", fc: files.length, results: currentRes, risks: currentRsk }].concat(p); });
        setTimeout(function() { emit.setVw("results"); }, 1500);
      }
    });
  }
}

// ══════════════════════════════════════════════════════════════
// resetMigration — Clear all state for fresh start
// ══════════════════════════════════════════════════════════════
export function resetMigration(s) {
  s.setVw("upload");
  s.setFiles([]);
  s.setSL("");
  s.setSV("");
  s.setTL("");
  s.setTV("");
  s.setRes([]);
  s.setRsk([]);
  s.setShR(false);
  s.setSelF(null);
  s.setLogs([]);
  s.setDet(null);
  s.setMan(false);
  s.setTOut(null);
  s.setDeepR(null);
  s.setDeepLd(false);
  s.setAiR(null);
  s.setFixR(null);
  s.setFixLd(false);
  s.setIntR(null);
  s.setCbA(null);
  s.setMigPhase("");
  s.setAuditTrail(null);
  s.setAudTab("pipeline");
  s.setAudExpand({});
  s.setAndReport(null);
  s.setAndReportLd(false);
  s.setShAndReport(false);
  s.setQaTests(null);
  s.setQaTestsLd(false);
  s.setQaPreR(null);
  s.setQaPostR(null);
  s.setShQaPanel(false);
  s.setQaVPreR(null);
  s.setQaVPostR(null);
  s.setQaTab("sandbox");
  if (s.setPwPre) s.setPwPre(null);
  if (s.setPwPost) s.setPwPost(null);
  if (s.setPwComparison) s.setPwComparison(null);
  if (s.setVisualQA) s.setVisualQA(null);
}

// ══════════════════════════════════════════════════════════════
// generatePDF — Open print dialog with migration report
// ══════════════════════════════════════════════════════════════
export function generatePDF(config, setPdfLd) {
  var sL = config.sL;
  var tL = config.tL;
  var sV = config.sV;
  var tV = config.tV;
  var mod = config.mod;
  var files = config.files;
  var auditTrail = config.auditTrail;
  var res = config.res;
  var rsk = config.rsk;
  var APP = config.APP;

  setPdfLd(true);
  try {
    var sl2 = LANGS[sL] || {};
    var tl2 = LANGS[tL] || {};
    var ml2 = MODELS.find(function(m) { return m.id === mod; }) || {};
    var h = "<!DOCTYPE html><html><head><meta charset=\"utf-8\"><title>MigraOps Report</title>";
    h += "<style>body{font-family:Segoe UI,sans-serif;max-width:800px;margin:0 auto;padding:20px;color:#1e293b}";
    h += "h1{font-size:22px;border-bottom:2px solid #2563eb;padding-bottom:8px}";
    h += "h2{font-size:16px;margin-top:20px;color:#2563eb}table{width:100%;border-collapse:collapse;margin:10px 0}";
    h += "th,td{padding:6px 10px;border:1px solid #e2e8f0;text-align:left;font-size:12px}th{background:#f1f5f9;font-weight:700}";
    h += "pre{background:#f8fafc;border:1px solid #e2e8f0;padding:10px;border-radius:6px;font-size:10px;overflow-x:auto;white-space:pre-wrap}";
    h += ".badge{display:inline-block;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700}";
    h += "@media print{body{padding:0}}</style></head><body>";
    h += "<h1>MigraOps v" + APP.v + " \u2014 Migration Report</h1>";
    h += "<p><strong>Date:</strong> " + new Date().toLocaleString() + "</p>";
    h += "<p><strong>Source:</strong> " + sl2.i + " " + sl2.n + " " + sV + " &rarr; <strong>Target:</strong> " + tl2.i + " " + tl2.n + " " + tV + "</p>";
    h += "<p><strong>Model:</strong> " + (ml2.n || "") + " &middot; <strong>Files:</strong> " + files.length + "</p>";
    if (auditTrail && auditTrail.finalScore !== null) {
      h += "<p><strong>Score:</strong> <span class=\"badge\" style=\"background:" + (auditTrail.finalScore >= 90 ? "#dcfce7;color:#059669" : "#fef9c3;color:#d97706") + "\">" + auditTrail.finalScore + "/100</span></p>";
    }
    h += "<h2>Files Migrated (" + res.length + ")</h2><table><tr><th>Source</th><th>Target</th><th>Lines</th></tr>";
    res.forEach(function(r) {
      var lines2 = r.migrated ? r.migrated.split("\n").length : 0;
      h += "<tr><td>" + r.name + "</td><td>" + (r.targetName || r.name) + "</td><td>" + lines2 + "</td></tr>";
    });
    h += "</table>";
    res.forEach(function(r, i) {
      h += "<h2>" + (i + 1) + ". " + (r.targetName || r.name) + "</h2>";
      if (r.migrated) { h += "<pre>" + r.migrated.replace(/</g, "&lt;").replace(/>/g, "&gt;").slice(0, 3000) + "</pre>"; }
    });
    if (rsk && rsk.length > 0) {
      h += "<h2>Risks (" + rsk.length + ")</h2><table><tr><th>File</th><th>Risk</th><th>Level</th></tr>";
      rsk.forEach(function(r) { h += "<tr><td>" + (r.file || "") + "</td><td>" + (r.msg || r.risk || "") + "</td><td>" + (r.level || "") + "</td></tr>"; });
      h += "</table>";
    }
    h += "<hr><p style=\"font-size:10px;color:#94a3b8\">Generated by MigraOps v" + APP.v + " \u2014 " + APP.co + "</p></body></html>";
    var win = window.open("", "_blank");
    if (win) { win.document.write(h); win.document.close(); win.focus(); setTimeout(function() { win.print(); }, 500); }
  } catch(e) { console.error("PDF error:", e); }
  setPdfLd(false);
}
