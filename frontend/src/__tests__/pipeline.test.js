import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock all transitive dependencies so pipeline.js loads cleanly
vi.mock('../config/languages.js', function() {
  return { LANGS: {} };
});

vi.mock('../config/models.js', function() {
  return { MODELS: [] };
});

vi.mock('../services/utils.js', function() {
  return {
    mkDiff: vi.fn(),
    mkRisks: vi.fn(function() { return []; })
  };
});

vi.mock('../services/claudeClient.js', function() {
  return {
    calcCapacity: vi.fn(),
    resetTks: vi.fn(),
    _tks: { last: { i: 0, o: 0 } },
    _activeController: null,
    setCancelled: vi.fn(),
    setActiveController: vi.fn()
  };
});

vi.mock('../services/migrationPhases.js', function() {
  return {
    doCodebaseAnalysis: vi.fn(),
    doFilePlan: vi.fn(),
    doMigrate: vi.fn(),
    doDependencyAudit: vi.fn(),
    doConsolidation: vi.fn(),
    doIntegrationCheck: vi.fn(),
    doIntegrationFix: vi.fn(),
    mapTargetFile: vi.fn()
  };
});

import { registerPhase, getRegisteredPhases, resetMigration } from '../services/pipeline.js';

// ══════════════════════════════════════════════════════════════
// Helpers
// ══════════════════════════════════════════════════════════════

// The module-level registeredPhases array persists across tests.
// We need to clear it before each test by accessing it indirectly.
// Since we cannot clear the internal array directly, we track initial state.
var initialPhases;

beforeEach(function() {
  // Snapshot whatever phases exist from prior tests — we test relative behavior
  initialPhases = getRegisteredPhases().length;
});

function mkSetter() {
  return vi.fn();
}

function mkSetters() {
  return {
    setVw: mkSetter(),
    setFiles: mkSetter(),
    setSL: mkSetter(),
    setSV: mkSetter(),
    setTL: mkSetter(),
    setTV: mkSetter(),
    setRes: mkSetter(),
    setRsk: mkSetter(),
    setShR: mkSetter(),
    setSelF: mkSetter(),
    setLogs: mkSetter(),
    setDet: mkSetter(),
    setMan: mkSetter(),
    setTOut: mkSetter(),
    setDeepR: mkSetter(),
    setDeepLd: mkSetter(),
    setAiR: mkSetter(),
    setFixR: mkSetter(),
    setFixLd: mkSetter(),
    setIntR: mkSetter(),
    setCbA: mkSetter(),
    setMigPhase: mkSetter(),
    setAuditTrail: mkSetter(),
    setAudTab: mkSetter(),
    setAudExpand: mkSetter(),
    setAndReport: mkSetter(),
    setAndReportLd: mkSetter(),
    setShAndReport: mkSetter(),
    setQaTests: mkSetter(),
    setQaTestsLd: mkSetter(),
    setQaPreR: mkSetter(),
    setQaPostR: mkSetter(),
    setShQaPanel: mkSetter(),
    setQaVPreR: mkSetter(),
    setQaVPostR: mkSetter(),
    setQaTab: mkSetter()
  };
}

// ══════════════════════════════════════════════════════════════
// registerPhase
// ══════════════════════════════════════════════════════════════
describe('registerPhase', function() {

  it('registers a phase with correct position, id, name, handler', function() {
    var handler = vi.fn();
    registerPhase(50, 'test_phase_50', 'Test Phase', handler);

    var phases = getRegisteredPhases();
    var found = phases.find(function(p) { return p.id === 'test_phase_50'; });
    expect(found).toBeDefined();
    expect(found.position).toBe(50);
    expect(found.id).toBe('test_phase_50');
    expect(found.name).toBe('Test Phase');
    expect(found.handler).toBe(handler);
  });

  it('allows registering multiple phases with different ids', function() {
    var h1 = vi.fn();
    var h2 = vi.fn();
    registerPhase(60, 'multi_a', 'Phase A', h1);
    registerPhase(70, 'multi_b', 'Phase B', h2);

    var phases = getRegisteredPhases();
    var foundA = phases.find(function(p) { return p.id === 'multi_a'; });
    var foundB = phases.find(function(p) { return p.id === 'multi_b'; });
    expect(foundA).toBeDefined();
    expect(foundB).toBeDefined();
    expect(foundA.handler).toBe(h1);
    expect(foundB.handler).toBe(h2);
  });

  it('negative positions come before positive positions', function() {
    registerPhase(-20, 'neg_phase', 'Negative Phase', vi.fn());
    registerPhase(200, 'high_phase', 'High Phase', vi.fn());

    var phases = getRegisteredPhases();
    var negIdx = phases.findIndex(function(p) { return p.id === 'neg_phase'; });
    var highIdx = phases.findIndex(function(p) { return p.id === 'high_phase'; });
    expect(negIdx).toBeLessThan(highIdx);
  });

  it('keeps phases sorted by position after each registration', function() {
    registerPhase(300, 'sort_last', 'Last', vi.fn());
    registerPhase(-100, 'sort_first', 'First', vi.fn());
    registerPhase(5, 'sort_mid', 'Middle', vi.fn());

    var phases = getRegisteredPhases();
    for (var i = 1; i < phases.length; i++) {
      expect(phases[i].position).toBeGreaterThanOrEqual(phases[i - 1].position);
    }
  });
});

// ══════════════════════════════════════════════════════════════
// getRegisteredPhases
// ══════════════════════════════════════════════════════════════
describe('getRegisteredPhases', function() {

  it('returns an array', function() {
    var phases = getRegisteredPhases();
    expect(Array.isArray(phases)).toBe(true);
  });

  it('returns a copy — mutating the result does not affect internal state', function() {
    var phases1 = getRegisteredPhases();
    var len1 = phases1.length;
    phases1.push({ position: 999, id: 'injected', name: 'Injected', handler: vi.fn() });

    var phases2 = getRegisteredPhases();
    expect(phases2.length).toBe(len1);
  });

  it('returns all registered phases sorted by position', function() {
    registerPhase(400, 'gp_high', 'High', vi.fn());
    registerPhase(-50, 'gp_low', 'Low', vi.fn());

    var phases = getRegisteredPhases();
    var lowIdx = phases.findIndex(function(p) { return p.id === 'gp_low'; });
    var highIdx = phases.findIndex(function(p) { return p.id === 'gp_high'; });
    expect(lowIdx).toBeGreaterThanOrEqual(0);
    expect(highIdx).toBeGreaterThanOrEqual(0);
    expect(lowIdx).toBeLessThan(highIdx);
  });
});

// ══════════════════════════════════════════════════════════════
// resetMigration
// ══════════════════════════════════════════════════════════════
describe('resetMigration', function() {

  it('resets view to "upload"', function() {
    var s = mkSetters();
    resetMigration(s);
    expect(s.setVw).toHaveBeenCalledWith('upload');
  });

  it('resets files to empty array', function() {
    var s = mkSetters();
    resetMigration(s);
    expect(s.setFiles).toHaveBeenCalledWith([]);
  });

  it('resets all core setter functions with expected default values', function() {
    var s = mkSetters();
    resetMigration(s);

    expect(s.setSL).toHaveBeenCalledWith('');
    expect(s.setSV).toHaveBeenCalledWith('');
    expect(s.setTL).toHaveBeenCalledWith('');
    expect(s.setTV).toHaveBeenCalledWith('');
    expect(s.setRes).toHaveBeenCalledWith([]);
    expect(s.setRsk).toHaveBeenCalledWith([]);
    expect(s.setShR).toHaveBeenCalledWith(false);
    expect(s.setSelF).toHaveBeenCalledWith(null);
    expect(s.setLogs).toHaveBeenCalledWith([]);
    expect(s.setDet).toHaveBeenCalledWith(null);
    expect(s.setMan).toHaveBeenCalledWith(false);
    expect(s.setTOut).toHaveBeenCalledWith(null);
    expect(s.setDeepR).toHaveBeenCalledWith(null);
    expect(s.setDeepLd).toHaveBeenCalledWith(false);
    expect(s.setAiR).toHaveBeenCalledWith(null);
    expect(s.setFixR).toHaveBeenCalledWith(null);
    expect(s.setFixLd).toHaveBeenCalledWith(false);
    expect(s.setIntR).toHaveBeenCalledWith(null);
    expect(s.setCbA).toHaveBeenCalledWith(null);
    expect(s.setMigPhase).toHaveBeenCalledWith('');
    expect(s.setAuditTrail).toHaveBeenCalledWith(null);
    expect(s.setAudTab).toHaveBeenCalledWith('pipeline');
    expect(s.setAudExpand).toHaveBeenCalledWith({});
    expect(s.setAndReport).toHaveBeenCalledWith(null);
    expect(s.setAndReportLd).toHaveBeenCalledWith(false);
    expect(s.setShAndReport).toHaveBeenCalledWith(false);
    expect(s.setQaTests).toHaveBeenCalledWith(null);
    expect(s.setQaTestsLd).toHaveBeenCalledWith(false);
    expect(s.setQaPreR).toHaveBeenCalledWith(null);
    expect(s.setQaPostR).toHaveBeenCalledWith(null);
    expect(s.setShQaPanel).toHaveBeenCalledWith(false);
    expect(s.setQaVPreR).toHaveBeenCalledWith(null);
    expect(s.setQaVPostR).toHaveBeenCalledWith(null);
    expect(s.setQaTab).toHaveBeenCalledWith('sandbox');
  });

  it('handles optional setPwPre gracefully when it does not exist', function() {
    var s = mkSetters();
    // No setPwPre, setPwPost, setPwComparison, setVisualQA
    expect(function() { resetMigration(s); }).not.toThrow();
  });

  it('calls optional setPwPre, setPwPost, setPwComparison, setVisualQA when present', function() {
    var s = mkSetters();
    s.setPwPre = mkSetter();
    s.setPwPost = mkSetter();
    s.setPwComparison = mkSetter();
    s.setVisualQA = mkSetter();

    resetMigration(s);

    expect(s.setPwPre).toHaveBeenCalledWith(null);
    expect(s.setPwPost).toHaveBeenCalledWith(null);
    expect(s.setPwComparison).toHaveBeenCalledWith(null);
    expect(s.setVisualQA).toHaveBeenCalledWith(null);
  });

  it('does not call optional setters when they are falsy', function() {
    var s = mkSetters();
    s.setPwPre = undefined;
    s.setPwPost = null;
    s.setPwComparison = false;
    s.setVisualQA = 0;

    expect(function() { resetMigration(s); }).not.toThrow();
  });

  it('calls each setter exactly once', function() {
    var s = mkSetters();
    s.setPwPre = mkSetter();
    s.setPwPost = mkSetter();
    s.setPwComparison = mkSetter();
    s.setVisualQA = mkSetter();

    resetMigration(s);

    // Verify every setter was called exactly once
    Object.keys(s).forEach(function(key) {
      expect(s[key]).toHaveBeenCalledTimes(1);
    });
  });
});
