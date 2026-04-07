import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock visualQAStore before importing the module under test
vi.mock('../lib/visualQAStore.js', function() {
  return {
    saveScreenshot: vi.fn(function() { return Promise.resolve(); }),
    getMultipleScreenshots: vi.fn(function(keys) {
      var result = {};
      keys.forEach(function(k) { result[k] = 'base64-data-for-' + k; });
      return Promise.resolve(result);
    })
  };
});

import { buildVisualQAReport, resolveScreenshots, generateVisualQAHTML } from '../services/visualQAReport.js';
import { saveScreenshot, getMultipleScreenshots } from '../lib/visualQAStore.js';

beforeEach(function() {
  vi.clearAllMocks();
});

// ── Helpers for building test fixtures ──

function mkConfig(overrides) {
  return Object.assign({
    sourceLanguage: 'Java',
    targetLanguage: 'Kotlin',
    fileCount: 2,
    fileNames: ['Main.java', 'Utils.java'],
    viewport: { width: 1280, height: 720 }
  }, overrides || {});
}

function mkComparison(overrides) {
  return Object.assign({
    visualScore: 95,
    domSimilarity: 88,
    functionalScore: 92,
    compositeScore: 90,
    perfDelta: { score: 75, loadTimePre: 200, loadTimePost: 220, deltaPercent: 10 },
    a11yDelta: { score: 80 },
    details: {
      diffImages: [
        { route: '/', matchPct: 95, mismatchPixels: 120, totalPixels: 100000, diff: 'diffpng1' },
        { route: '/about', matchPct: 70, mismatchPixels: 5000, totalPixels: 100000, diff: 'diffpng2' }
      ]
    }
  }, overrides || {});
}

function mkBaseline(overrides) {
  return Object.assign({
    ok: true,
    timestamp: '2026-01-15T10:00:00.000Z',
    durationMs: 1500,
    routes: ['/', '/about'],
    screenshots: [{ png: 'screenshotA' }, { png: 'screenshotB' }],
    domTree: { tag: 'html', children: [{ tag: 'body', children: [{ tag: 'div' }] }] },
    metrics: { loadTime: 200, domContentLoaded: 150 },
    a11y: { role: 'document', children: [{ role: 'main' }] },
    jsErrors: []
  }, overrides || {});
}

// ═══════════════════════════════════════════════════
// buildVisualQAReport
// ═══════════════════════════════════════════════════

describe('buildVisualQAReport', function() {

  it('report ID has format VQA-{timestamp}', async function() {
    var report = await buildVisualQAReport('MIG-001', null, null, null, mkConfig());
    expect(report.id).toMatch(/^VQA-\d+$/);
  });

  it('migrationId falls back to MIG-{timestamp} when not provided', async function() {
    var report = await buildVisualQAReport(null, null, null, null, mkConfig());
    expect(report.migrationId).toMatch(/^MIG-\d+$/);
  });

  it('preserves config snapshot', async function() {
    var cfg = mkConfig({ sourceLanguage: 'Python', targetLanguage: 'Go', fileCount: 5 });
    var report = await buildVisualQAReport('MIG-002', null, null, null, cfg);
    expect(report.config.sourceLanguage).toBe('Python');
    expect(report.config.targetLanguage).toBe('Go');
    expect(report.config.fileCount).toBe(5);
    expect(report.config.viewport).toEqual({ width: 1280, height: 720 });
  });

  it('verdict is PASS when all scores exceed thresholds', async function() {
    var comp = mkComparison({
      visualScore: 95,
      domSimilarity: 95,
      functionalScore: 95,
      compositeScore: 95,
      perfDelta: { score: 95 },
      a11yDelta: { score: 95 }
    });
    var report = await buildVisualQAReport('MIG-003', null, null, comp, mkConfig());
    expect(report.verdict.overall).toBe('PASS');
    expect(report.verdict.regressionAreas).toEqual([]);
    expect(report.verdict.notes).toContain('passed all visual QA checks');
  });

  it('verdict is WARN when two or more scores are borderline (pass but within +10)', async function() {
    // visual threshold 80, actual 85 => pass but borderline (85 < 80+10=90)
    // dom threshold 70, actual 75 => pass but borderline (75 < 70+10=80)
    // functional 90, actual 99 => pass, not borderline (99 >= 90+10=100 is false, so borderline!)
    // We need exactly 2 borderline to get WARN, and 0 fails
    var comp = mkComparison({
      visualScore: 85,    // borderline (85 < 90)
      domSimilarity: 75,  // borderline (75 < 80)
      functionalScore: 100, // not borderline (100 >= 100)
      compositeScore: 85,   // borderline (85 < 85) — yes borderline
      perfDelta: { score: 100 },  // not borderline
      a11yDelta: { score: 100 }   // not borderline
    });
    var report = await buildVisualQAReport('MIG-004', null, null, comp, mkConfig());
    expect(report.verdict.overall).toBe('WARN');
    expect(report.verdict.notes).toContain('warnings');
  });

  it('verdict is FAIL when any score is below its threshold', async function() {
    var comp = mkComparison({
      visualScore: 50,
      domSimilarity: 40,
      functionalScore: 30,
      compositeScore: 20,
      perfDelta: { score: 10 },
      a11yDelta: { score: 5 }
    });
    var report = await buildVisualQAReport('MIG-005', null, null, comp, mkConfig());
    expect(report.verdict.overall).toBe('FAIL');
    expect(report.verdict.regressionAreas.length).toBeGreaterThan(0);
    expect(report.verdict.notes).toContain('failed visual QA');
  });

  it('regression areas list all failing dimensions', async function() {
    var comp = mkComparison({
      visualScore: 50,       // FAIL (< 80)
      domSimilarity: 95,     // PASS
      functionalScore: 80,   // FAIL (< 90)
      compositeScore: 95,    // PASS
      perfDelta: { score: 95 },
      a11yDelta: { score: 95 }
    });
    var report = await buildVisualQAReport('MIG-006', null, null, comp, mkConfig());
    expect(report.verdict.regressionAreas).toEqual(
      expect.arrayContaining([
        expect.stringContaining('visual'),
        expect.stringContaining('functional')
      ])
    );
    // The format is "dimension (actual/required)"
    expect(report.verdict.regressionAreas[0]).toMatch(/\(\d+\/\d+\)/);
  });

  it('saves pre screenshots and generates refs', async function() {
    var pre = mkBaseline();
    var report = await buildVisualQAReport('MIG-007', pre, null, null, mkConfig());
    expect(saveScreenshot).toHaveBeenCalledTimes(2);
    expect(report.pre.screenshotRefs.length).toBe(2);
    report.pre.screenshotRefs.forEach(function(ref) {
      expect(ref).toMatch(/^vqa-\d+-pre-\d+$/);
    });
  });

  it('saves post screenshots and diff images', async function() {
    var post = mkBaseline();
    var comp = mkComparison();
    var report = await buildVisualQAReport('MIG-008', null, post, comp, mkConfig());
    // 2 post screenshots + 2 diff images = 4 saves
    expect(saveScreenshot).toHaveBeenCalledTimes(4);
    expect(report.post.screenshotRefs.length).toBe(2);
    expect(report.comparison.routeResults.length).toBe(2);
    report.comparison.routeResults.forEach(function(rr) {
      expect(rr.diffRef).toMatch(/^vqa-\d+-diff-\d+$/);
    });
  });

  it('route results have correct verdict per matchPct', async function() {
    var comp = mkComparison({
      details: {
        diffImages: [
          { route: '/', matchPct: 95, mismatchPixels: 10, diff: 'x' },
          { route: '/low', matchPct: 65, mismatchPixels: 500, diff: 'y' },
          { route: '/fail', matchPct: 50, mismatchPixels: 1000, diff: 'z' }
        ]
      }
    });
    var report = await buildVisualQAReport('MIG-009', null, null, comp, mkConfig());
    expect(report.comparison.routeResults[0].verdict).toBe('PASS');
    expect(report.comparison.routeResults[1].verdict).toBe('WARN');
    expect(report.comparison.routeResults[2].verdict).toBe('FAIL');
  });

  it('handles null baselines gracefully', async function() {
    var report = await buildVisualQAReport('MIG-010', null, null, null, mkConfig());
    expect(report.pre).toBeNull();
    expect(report.post).toBeNull();
    expect(report.comparison.routeResults).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════
// resolveScreenshots
// ═══════════════════════════════════════════════════

describe('resolveScreenshots', function() {

  it('returns null for null report', async function() {
    var result = await resolveScreenshots(null);
    expect(result).toBeNull();
  });

  it('returns report unchanged when no screenshot refs exist', async function() {
    var report = { pre: null, post: null, comparison: { routeResults: [] } };
    var result = await resolveScreenshots(report);
    expect(result).toEqual(report);
    expect(getMultipleScreenshots).not.toHaveBeenCalled();
  });

  it('collects all refs from pre, post, and diff', async function() {
    var report = {
      pre: { screenshotRefs: ['pre-0', 'pre-1'] },
      post: { screenshotRefs: ['post-0'] },
      comparison: { routeResults: [{ diffRef: 'diff-0' }, { diffRef: 'diff-1' }] }
    };
    var result = await resolveScreenshots(report);
    expect(getMultipleScreenshots).toHaveBeenCalledWith(['pre-0', 'pre-1', 'post-0', 'diff-0', 'diff-1']);
    expect(result._resolvedImages).toBeDefined();
    expect(result._resolvedImages['pre-0']).toBe('base64-data-for-pre-0');
  });

  it('skips routeResults with no diffRef', async function() {
    var report = {
      pre: { screenshotRefs: ['pre-0'] },
      post: null,
      comparison: { routeResults: [{ diffRef: null }, { diffRef: 'diff-1' }] }
    };
    var result = await resolveScreenshots(report);
    expect(getMultipleScreenshots).toHaveBeenCalledWith(['pre-0', 'diff-1']);
  });
});

// ═══════════════════════════════════════════════════
// generateVisualQAHTML — structure & escaping
// ═══════════════════════════════════════════════════

describe('generateVisualQAHTML', function() {

  function mkMinimalReport(overrides) {
    return Object.assign({
      id: 'VQA-123',
      migrationId: 'MIG-456',
      createdAt: '2026-01-15T10:00:00.000Z',
      config: { sourceLanguage: 'Java', targetLanguage: 'Kotlin', fileCount: 1, fileNames: ['App.java'], viewport: { width: 1280, height: 720 } },
      pre: null,
      post: null,
      comparison: { visualScore: 90, domSimilarity: 85, functionalScore: 95, compositeScore: 88, perfDelta: null, a11yDelta: null, routeResults: [] },
      verdict: { overall: 'PASS', thresholds: { visual: { required: 80, actual: 90, pass: true } }, regressionAreas: [], notes: 'All checks passed' }
    }, overrides || {});
  }

  it('output is a complete HTML document', function() {
    var html = generateVisualQAHTML(mkMinimalReport(), {});
    expect(html).toMatch(/^<!DOCTYPE html>/);
    expect(html).toContain('</html>');
  });

  it('contains header section with report title', function() {
    var html = generateVisualQAHTML(mkMinimalReport(), {});
    expect(html).toContain('Visual QA Report');
    expect(html).toContain('class="header"');
  });

  it('contains executive summary section', function() {
    var html = generateVisualQAHTML(mkMinimalReport(), {});
    expect(html).toContain('Executive Summary');
  });

  it('contains thresholds table', function() {
    var html = generateVisualQAHTML(mkMinimalReport(), {});
    expect(html).toContain('Pass/Fail Criteria');
    expect(html).toContain('<th>Dimension</th>');
    expect(html).toContain('<th>Required</th>');
    expect(html).toContain('<th>Actual</th>');
    expect(html).toContain('<th>Status</th>');
  });

  it('contains footer with MigraOps branding', function() {
    var html = generateVisualQAHTML(mkMinimalReport(), {});
    expect(html).toContain('class="footer"');
    expect(html).toContain('MigraOps v5.0');
    expect(html).toContain('Report ID: VQA-123');
    expect(html).toContain('Migration ID: MIG-456');
  });

  it('escapes HTML metacharacters in migrationId within header body', function() {
    var report = mkMinimalReport({ migrationId: '<b>MIG&1</b>' });
    var html = generateVisualQAHTML(report, {});
    // The header <p> section uses escHTML on migrationId
    expect(html).toContain('Migration: &lt;b&gt;MIG&amp;1&lt;/b&gt;');
  });

  it('escapes HTML metacharacters in fileNames', function() {
    var report = mkMinimalReport();
    report.config.fileNames = ['<img src=x onerror=alert(1)>', 'normal.java'];
    var html = generateVisualQAHTML(report, {});
    expect(html).not.toContain('<img src=x');
    expect(html).toContain('&lt;img src=x');
  });

  it('escapes HTML metacharacters in route names', function() {
    var report = mkMinimalReport();
    report.pre = {
      routeCount: 1,
      durationMs: 100,
      routes: ['/<script>evil</script>'],
      screenshotRefs: ['ref-0'],
      domSummary: null,
      metrics: null,
      a11y: null,
      jsErrors: []
    };
    var html = generateVisualQAHTML(report, { 'ref-0': 'base64png' });
    expect(html).not.toContain('<script>evil</script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('shows PASS verdict badge with green styling', function() {
    var html = generateVisualQAHTML(mkMinimalReport({ verdict: { overall: 'PASS', thresholds: {}, regressionAreas: [], notes: 'ok' } }), {});
    expect(html).toContain('class="verdict-badge"');
    expect(html).toContain('#059669');
    expect(html).toContain('>PASS<');
  });

  it('shows FAIL verdict badge with red styling', function() {
    var report = mkMinimalReport({ verdict: { overall: 'FAIL', thresholds: {}, regressionAreas: ['visual'], notes: 'failed' } });
    var html = generateVisualQAHTML(report, {});
    expect(html).toContain('#DC2626');
    expect(html).toContain('>FAIL<');
  });

  it('renders performance delta section when perfDelta is present', function() {
    var report = mkMinimalReport();
    report.comparison.perfDelta = { score: 75, loadTimePre: 200, loadTimePost: 250, deltaPercent: 25 };
    var html = generateVisualQAHTML(report, {});
    expect(html).toContain('Performance Analysis');
    expect(html).toContain('200');
    expect(html).toContain('250');
  });

  it('escapes ampersands and quotes in source language', function() {
    var report = mkMinimalReport();
    report.config.sourceLanguage = 'C++ & "legacy"';
    var html = generateVisualQAHTML(report, {});
    expect(html).toContain('C++ &amp; &quot;legacy&quot;');
  });
});
