// ═══ Visual QA Report — Professional QA documentation for visual baselines ═══
// Generates, persists, and exports Visual QA reports per migration.

import { saveScreenshot, getMultipleScreenshots } from "../lib/visualQAStore.js";

// ── Verdict thresholds ──
var THRESHOLDS = {
  visual:       80,
  dom:          70,
  functional:   90,
  performance:  60,
  accessibility: 70,
  composite:    75
};

function verdict(required, actual) {
  return { required: required, actual: actual, pass: actual >= required };
}

function overallVerdict(thresholds) {
  var keys = Object.keys(thresholds);
  var failCount = 0;
  var warnCount = 0;
  for (var i = 0; i < keys.length; i++) {
    var t = thresholds[keys[i]];
    if (!t.pass) failCount++;
    else if (t.actual < t.required + 10) warnCount++;
  }
  if (failCount > 0) return "FAIL";
  if (warnCount >= 2) return "WARN";
  return "PASS";
}

// ── Build the Visual QA Report ──
export async function buildVisualQAReport(migrationId, preBaseline, postBaseline, comparison, config) {
  var ts = Date.now();
  var prefix = "vqa-" + ts;

  // Store pre screenshots in IndexedDB
  var preRefs = [];
  if (preBaseline && preBaseline.screenshots) {
    for (var i = 0; i < preBaseline.screenshots.length; i++) {
      var key = prefix + "-pre-" + i;
      await saveScreenshot(key, preBaseline.screenshots[i].png);
      preRefs.push(key);
    }
  }

  // Store post screenshots
  var postRefs = [];
  if (postBaseline && postBaseline.screenshots) {
    for (var j = 0; j < postBaseline.screenshots.length; j++) {
      var key2 = prefix + "-post-" + j;
      await saveScreenshot(key2, postBaseline.screenshots[j].png);
      postRefs.push(key2);
    }
  }

  // Store diff images
  var routeResults = [];
  if (comparison && comparison.details && comparison.details.diffImages) {
    for (var k = 0; k < comparison.details.diffImages.length; k++) {
      var di = comparison.details.diffImages[k];
      var diffKey = prefix + "-diff-" + k;
      if (di.diff) await saveScreenshot(diffKey, di.diff);
      routeResults.push({
        route: di.route,
        matchPct: di.matchPct,
        mismatchPixels: di.mismatchPixels,
        totalPixels: di.totalPixels || 0,
        diffRef: diffKey,
        verdict: di.matchPct >= 80 ? "PASS" : di.matchPct >= 60 ? "WARN" : "FAIL"
      });
    }
  }

  // Build pre metadata
  var preMeta = null;
  if (preBaseline && preBaseline.ok) {
    preMeta = {
      capturedAt: preBaseline.timestamp || new Date(ts).toISOString(),
      durationMs: preBaseline.durationMs || 0,
      routeCount: preBaseline.routes ? preBaseline.routes.length : 0,
      routes: preBaseline.routes || ["/"],
      screenshotRefs: preRefs,
      domSummary: summarizeDOM(preBaseline.domTree),
      metrics: preBaseline.metrics || null,
      a11y: preBaseline.a11y ? { nodeCount: countA11yNodes(preBaseline.a11y), snapshot: preBaseline.a11y } : null,
      jsErrors: preBaseline.jsErrors || []
    };
  }

  // Build post metadata
  var postMeta = null;
  if (postBaseline && postBaseline.ok) {
    postMeta = {
      capturedAt: postBaseline.timestamp || new Date().toISOString(),
      durationMs: postBaseline.durationMs || 0,
      routeCount: postBaseline.routes ? postBaseline.routes.length : 0,
      routes: postBaseline.routes || ["/"],
      screenshotRefs: postRefs,
      domSummary: summarizeDOM(postBaseline.domTree),
      metrics: postBaseline.metrics || null,
      a11y: postBaseline.a11y ? { nodeCount: countA11yNodes(postBaseline.a11y), snapshot: postBaseline.a11y } : null,
      jsErrors: postBaseline.jsErrors || []
    };
  }

  // Compute verdict
  var comp = comparison || {};
  var thresholdResults = {
    visual: verdict(THRESHOLDS.visual, comp.visualScore || 0),
    dom: verdict(THRESHOLDS.dom, comp.domSimilarity || 0),
    functional: verdict(THRESHOLDS.functional, comp.functionalScore || 0),
    performance: verdict(THRESHOLDS.performance, comp.perfDelta ? comp.perfDelta.score || 0 : 0),
    accessibility: verdict(THRESHOLDS.accessibility, comp.a11yDelta ? comp.a11yDelta.score || 0 : 0),
    composite: verdict(THRESHOLDS.composite, comp.compositeScore || 0)
  };

  var regressionAreas = [];
  Object.keys(thresholdResults).forEach(function(k) {
    if (!thresholdResults[k].pass) {
      regressionAreas.push(k + " (" + thresholdResults[k].actual + "/" + thresholdResults[k].required + ")");
    }
  });

  var ov = overallVerdict(thresholdResults);

  return {
    id: "VQA-" + ts,
    migrationId: migrationId || "MIG-" + ts,
    createdAt: new Date(ts).toISOString(),
    version: "1.0",
    config: {
      sourceLanguage: config.sourceLanguage || "",
      targetLanguage: config.targetLanguage || "",
      fileCount: config.fileCount || 0,
      fileNames: config.fileNames || [],
      viewport: config.viewport || { width: 1280, height: 720 }
    },
    pre: preMeta,
    post: postMeta,
    comparison: {
      visualScore: comp.visualScore || 0,
      domSimilarity: comp.domSimilarity || 0,
      functionalScore: comp.functionalScore || 0,
      compositeScore: comp.compositeScore || 0,
      perfDelta: comp.perfDelta || null,
      a11yDelta: comp.a11yDelta || null,
      routeResults: routeResults
    },
    verdict: {
      overall: ov,
      thresholds: thresholdResults,
      regressionAreas: regressionAreas,
      notes: ov === "PASS" ? "Migration passed all visual QA checks"
        : ov === "WARN" ? "Migration passed with warnings — review recommended"
        : "Migration failed visual QA — " + regressionAreas.join(", ")
    },
    _storePrefix: prefix
  };
}

// ── Resolve screenshots from IndexedDB ──
export async function resolveScreenshots(report) {
  if (!report) return null;
  var allKeys = [];
  if (report.pre && report.pre.screenshotRefs) allKeys = allKeys.concat(report.pre.screenshotRefs);
  if (report.post && report.post.screenshotRefs) allKeys = allKeys.concat(report.post.screenshotRefs);
  if (report.comparison && report.comparison.routeResults) {
    report.comparison.routeResults.forEach(function(rr) {
      if (rr.diffRef) allKeys.push(rr.diffRef);
    });
  }
  if (allKeys.length === 0) return report;
  var images = await getMultipleScreenshots(allKeys);
  return Object.assign({}, report, { _resolvedImages: images });
}

// ── Generate HTML QA Document ──
export function generateVisualQAHTML(report, resolvedImages) {
  var img = resolvedImages || {};
  var r = report;
  var v = r.verdict || {};
  var c = r.comparison || {};
  var pre = r.pre || {};
  var post = r.post || {};

  var verdictColor = v.overall === "PASS" ? "#059669" : v.overall === "WARN" ? "#D97706" : "#DC2626";
  var verdictBg = v.overall === "PASS" ? "#F0FDF4" : v.overall === "WARN" ? "#FFFBEB" : "#FEF2F2";

  var html = '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">';
  html += '<title>Visual QA Report — ' + r.migrationId + '</title>';
  html += '<style>';
  html += '*{margin:0;padding:0;box-sizing:border-box}';
  html += 'body{font-family:system-ui,-apple-system,sans-serif;background:#f8fafc;color:#0f172a;padding:32px;font-size:13px;line-height:1.6}';
  html += '.container{max-width:1000px;margin:0 auto}';
  html += '.header{background:linear-gradient(135deg,#7C3AED,#8B5CF6);color:#fff;padding:32px;border-radius:16px;margin-bottom:24px;display:flex;justify-content:space-between;align-items:flex-start}';
  html += '.header h1{font-size:22px;margin-bottom:4px}.header p{opacity:.8;font-size:12px}';
  html += '.verdict-badge{padding:12px 24px;border-radius:12px;font-size:18px;font-weight:900;text-align:center;min-width:100px}';
  html += '.section{background:#fff;border:1px solid #e2e8f0;border-radius:12px;margin-bottom:16px;overflow:hidden;break-inside:avoid}';
  html += '.section-head{padding:14px 20px;border-bottom:1px solid #e2e8f0;font-size:14px;font-weight:700;display:flex;justify-content:space-between;align-items:center}';
  html += '.section-body{padding:16px 20px}';
  html += '.grid{display:grid;gap:12px}.grid-2{grid-template-columns:1fr 1fr}.grid-3{grid-template-columns:1fr 1fr 1fr}.grid-5{grid-template-columns:repeat(5,1fr)}';
  html += '.metric{padding:14px;border-radius:10px;background:#f8fafc;border:1px solid #e2e8f0;text-align:center}';
  html += '.metric-label{font-size:9px;font-weight:700;text-transform:uppercase;color:#64748b;letter-spacing:.05em}';
  html += '.metric-value{font-size:24px;font-weight:900;font-family:monospace;margin:4px 0}';
  html += '.metric-sub{font-size:9px;color:#94a3b8}';
  html += '.badge{display:inline-block;padding:2px 8px;border-radius:6px;font-size:10px;font-weight:700}';
  html += '.pass{background:#F0FDF4;color:#059669}.warn{background:#FFFBEB;color:#D97706}.fail{background:#FEF2F2;color:#DC2626}';
  html += '.screenshot{border-radius:8px;border:1px solid #e2e8f0;max-width:100%;display:block;margin:0 auto}';
  html += '.compare-row{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px}';
  html += '.compare-col{text-align:center}.compare-col img{max-width:100%;border-radius:8px;border:1px solid #e2e8f0}';
  html += '.compare-label{font-size:10px;font-weight:700;text-transform:uppercase;color:#64748b;margin-bottom:6px}';
  html += 'table{width:100%;border-collapse:collapse}th{background:#f8fafc;text-align:left;padding:8px 12px;font-size:11px;font-weight:700;border-bottom:2px solid #e2e8f0}';
  html += 'td{padding:8px 12px;border-bottom:1px solid #f1f5f9;font-size:12px}';
  html += '.bar{height:6px;border-radius:3px;background:#e2e8f0;overflow:hidden}.bar-fill{height:100%;border-radius:3px}';
  html += '.footer{text-align:center;margin-top:32px;padding:16px;font-size:10px;color:#94a3b8;border-top:1px solid #e2e8f0}';
  html += '@media print{body{padding:16px;font-size:11px}.header{padding:20px;margin-bottom:16px}.section{break-inside:avoid}}';
  html += '</style></head><body><div class="container">';

  // ── Header ──
  html += '<div class="header"><div>';
  html += '<h1>Visual QA Report</h1>';
  html += '<p>' + escHTML(r.config.sourceLanguage) + ' → ' + escHTML(r.config.targetLanguage) + ' | ' + r.config.fileCount + ' files | ' + escHTML(r.config.fileNames.join(', ')) + '</p>';
  html += '<p style="margin-top:4px">Migration: ' + escHTML(r.migrationId) + ' | Report: ' + escHTML(r.id) + ' | ' + new Date(r.createdAt).toLocaleString() + '</p>';
  html += '</div>';
  html += '<div class="verdict-badge" style="background:' + verdictBg + ';color:' + verdictColor + '">' + v.overall + '</div>';
  html += '</div>';

  // ── Executive Summary ──
  html += '<div class="section"><div class="section-head">Executive Summary</div><div class="section-body">';
  html += '<div style="padding:12px 16px;border-radius:10px;background:' + verdictBg + ';border:1px solid ' + verdictColor + '22;margin-bottom:16px">';
  html += '<div style="font-weight:800;color:' + verdictColor + '">' + v.overall + ' — ' + v.notes + '</div></div>';
  html += '<div class="grid grid-5" style="margin-top:12px">';
  var dims = [
    { l: "Visual", v: c.visualScore, w: "40%" },
    { l: "DOM", v: c.domSimilarity, w: "25%" },
    { l: "Functional", v: c.functionalScore, w: "20%" },
    { l: "Performance", v: c.perfDelta ? c.perfDelta.score : 0, w: "10%" },
    { l: "Accessibility", v: c.a11yDelta ? c.a11yDelta.score : 0, w: "5%" }
  ];
  dims.forEach(function(d) {
    var vc = d.v >= 80 ? "#059669" : d.v >= 60 ? "#D97706" : "#DC2626";
    html += '<div class="metric"><div class="metric-label">' + d.l + '</div>';
    html += '<div class="metric-value" style="color:' + vc + '">' + (d.v || 0) + '</div>';
    html += '<div class="metric-sub">weight: ' + d.w + '</div>';
    html += '<div class="bar" style="margin-top:6px"><div class="bar-fill" style="width:' + (d.v || 0) + '%;background:' + vc + '"></div></div>';
    html += '</div>';
  });
  html += '</div>';
  html += '<div class="metric" style="margin-top:12px"><div class="metric-label">Composite Score</div>';
  html += '<div class="metric-value" style="font-size:32px;color:' + verdictColor + '">' + (c.compositeScore || 0) + '/100</div></div>';
  html += '</div></div>';

  // ── Threshold Check ──
  if (v.thresholds) {
    html += '<div class="section"><div class="section-head">Pass/Fail Criteria</div><div class="section-body">';
    html += '<table><tr><th>Dimension</th><th>Required</th><th>Actual</th><th>Status</th></tr>';
    Object.keys(v.thresholds).forEach(function(k) {
      var t = v.thresholds[k];
      var cls = t.pass ? "pass" : "fail";
      html += '<tr><td style="font-weight:600;text-transform:capitalize">' + k + '</td>';
      html += '<td style="font-family:monospace">≥ ' + t.required + '</td>';
      html += '<td style="font-family:monospace;font-weight:700">' + t.actual + '</td>';
      html += '<td><span class="badge ' + cls + '">' + (t.pass ? "PASS" : "FAIL") + '</span></td></tr>';
    });
    html += '</table></div></div>';
  }

  // ── Pre-Migration Baseline ──
  if (pre) {
    html += '<div class="section"><div class="section-head">Pre-Migration Baseline<span class="badge" style="background:#EDE9FE;color:#7C3AED">SOURCE</span></div><div class="section-body">';
    html += '<div class="grid grid-3" style="margin-bottom:16px">';
    html += '<div class="metric"><div class="metric-label">Routes</div><div class="metric-value">' + (pre.routeCount || 0) + '</div></div>';
    html += '<div class="metric"><div class="metric-label">Capture Time</div><div class="metric-value" style="font-size:16px">' + (pre.durationMs || 0) + 'ms</div></div>';
    html += '<div class="metric"><div class="metric-label">JS Errors</div><div class="metric-value" style="color:' + ((pre.jsErrors || []).length > 0 ? "#DC2626" : "#059669") + '">' + (pre.jsErrors || []).length + '</div></div>';
    html += '</div>';
    if (pre.metrics) {
      html += '<div class="grid grid-2" style="margin-bottom:16px">';
      html += '<div class="metric"><div class="metric-label">Load Time</div><div class="metric-value" style="font-size:16px">' + (pre.metrics.loadTime || 0) + 'ms</div></div>';
      html += '<div class="metric"><div class="metric-label">DOM Content Loaded</div><div class="metric-value" style="font-size:16px">' + (pre.metrics.domContentLoaded || 0) + 'ms</div></div>';
      html += '</div>';
    }
    if (pre.domSummary) {
      html += '<div style="font-size:11px;color:#64748b;margin-bottom:12px">DOM: ' + pre.domSummary.nodeCount + ' nodes, ' + pre.domSummary.uniqueTags + ' unique tags' + (pre.domSummary.depth ? ', depth ' + pre.domSummary.depth : '') + '</div>';
    }
    // Pre screenshots
    if (pre.screenshotRefs && pre.screenshotRefs.length > 0) {
      pre.screenshotRefs.forEach(function(ref, idx) {
        var b64 = img[ref];
        if (b64) {
          html += '<div style="margin-bottom:12px"><div class="compare-label">Route: ' + escHTML(pre.routes && pre.routes[idx] ? pre.routes[idx] : "/") + '</div>';
          html += '<img src="data:image/png;base64,' + b64 + '" class="screenshot" alt="Pre-migration ' + idx + '"/></div>';
        }
      });
    }
    if (pre.jsErrors && pre.jsErrors.length > 0) {
      html += '<div style="margin-top:12px"><div style="font-size:11px;font-weight:700;color:#DC2626;margin-bottom:4px">JS Errors Detected:</div>';
      pre.jsErrors.forEach(function(err) {
        html += '<div style="font-size:10px;color:#DC2626;padding:4px 8px;background:#FEF2F2;border-radius:4px;margin-bottom:2px;font-family:monospace">' + escHTML(err) + '</div>';
      });
      html += '</div>';
    }
    html += '</div></div>';
  }

  // ── Post-Migration Baseline ──
  if (post) {
    html += '<div class="section"><div class="section-head">Post-Migration Baseline<span class="badge" style="background:#DBEAFE;color:#2563EB">TARGET</span></div><div class="section-body">';
    html += '<div class="grid grid-3" style="margin-bottom:16px">';
    html += '<div class="metric"><div class="metric-label">Routes</div><div class="metric-value">' + (post.routeCount || 0) + '</div></div>';
    html += '<div class="metric"><div class="metric-label">Capture Time</div><div class="metric-value" style="font-size:16px">' + (post.durationMs || 0) + 'ms</div></div>';
    html += '<div class="metric"><div class="metric-label">JS Errors</div><div class="metric-value" style="color:' + ((post.jsErrors || []).length > 0 ? "#DC2626" : "#059669") + '">' + (post.jsErrors || []).length + '</div></div>';
    html += '</div>';
    if (post.metrics) {
      html += '<div class="grid grid-2" style="margin-bottom:16px">';
      html += '<div class="metric"><div class="metric-label">Load Time</div><div class="metric-value" style="font-size:16px">' + (post.metrics.loadTime || 0) + 'ms</div></div>';
      html += '<div class="metric"><div class="metric-label">DOM Content Loaded</div><div class="metric-value" style="font-size:16px">' + (post.metrics.domContentLoaded || 0) + 'ms</div></div>';
      html += '</div>';
    }
    if (post.screenshotRefs && post.screenshotRefs.length > 0) {
      post.screenshotRefs.forEach(function(ref, idx) {
        var b64 = img[ref];
        if (b64) {
          html += '<div style="margin-bottom:12px"><div class="compare-label">Route: ' + escHTML(post.routes && post.routes[idx] ? post.routes[idx] : "/") + '</div>';
          html += '<img src="data:image/png;base64,' + b64 + '" class="screenshot" alt="Post-migration ' + idx + '"/></div>';
        }
      });
    }
    if (post.jsErrors && post.jsErrors.length > 0) {
      html += '<div style="margin-top:12px"><div style="font-size:11px;font-weight:700;color:#DC2626;margin-bottom:4px">JS Errors Detected:</div>';
      post.jsErrors.forEach(function(err) {
        html += '<div style="font-size:10px;color:#DC2626;padding:4px 8px;background:#FEF2F2;border-radius:4px;margin-bottom:2px;font-family:monospace">' + escHTML(err) + '</div>';
      });
      html += '</div>';
    }
    html += '</div></div>';
  }

  // ── Side-by-Side Comparison ──
  if (pre && post && pre.screenshotRefs && post.screenshotRefs) {
    var maxRoutes = Math.max(pre.screenshotRefs.length, post.screenshotRefs.length);
    if (maxRoutes > 0) {
      html += '<div class="section"><div class="section-head">Side-by-Side Comparison</div><div class="section-body">';
      for (var si = 0; si < maxRoutes; si++) {
        var routeName = (pre.routes && pre.routes[si]) || (post.routes && post.routes[si]) || "/";
        var rr = c.routeResults && c.routeResults[si];
        html += '<div style="margin-bottom:20px;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden">';
        html += '<div style="padding:8px 12px;background:#f8fafc;border-bottom:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center">';
        html += '<span style="font-weight:700;font-size:12px">Route: ' + escHTML(routeName) + '</span>';
        if (rr) html += '<span class="badge ' + (rr.verdict === "PASS" ? "pass" : rr.verdict === "WARN" ? "warn" : "fail") + '">' + rr.matchPct + '% match — ' + rr.verdict + '</span>';
        html += '</div>';
        html += '<div class="compare-row" style="padding:12px">';
        var preB64 = pre.screenshotRefs[si] ? img[pre.screenshotRefs[si]] : null;
        var postB64 = post.screenshotRefs[si] ? img[post.screenshotRefs[si]] : null;
        html += '<div class="compare-col"><div class="compare-label">PRE (Source)</div>';
        if (preB64) html += '<img src="data:image/png;base64,' + preB64 + '" alt="Pre"/>';
        else html += '<div style="padding:40px;background:#f8fafc;border-radius:8px;color:#94a3b8">No screenshot</div>';
        html += '</div>';
        html += '<div class="compare-col"><div class="compare-label">POST (Migrated)</div>';
        if (postB64) html += '<img src="data:image/png;base64,' + postB64 + '" alt="Post"/>';
        else html += '<div style="padding:40px;background:#f8fafc;border-radius:8px;color:#94a3b8">No screenshot</div>';
        html += '</div></div>';
        // Diff image
        if (rr && rr.diffRef && img[rr.diffRef]) {
          html += '<div style="padding:0 12px 12px;text-align:center"><div class="compare-label">DIFF OVERLAY</div>';
          html += '<img src="data:image/png;base64,' + img[rr.diffRef] + '" class="screenshot" alt="Diff" style="max-width:60%"/>';
          html += '<div style="font-size:10px;color:#94a3b8;margin-top:4px">' + (rr.mismatchPixels || 0).toLocaleString() + ' mismatched pixels</div>';
          html += '</div>';
        }
        html += '</div>';
      }
      html += '</div></div>';
    }
  }

  // ── Performance Delta ──
  if (c.perfDelta) {
    html += '<div class="section"><div class="section-head">Performance Analysis</div><div class="section-body">';
    html += '<div class="grid grid-3">';
    html += '<div class="metric"><div class="metric-label">Load (Pre)</div><div class="metric-value" style="font-size:16px">' + (c.perfDelta.loadTimePre || 0) + 'ms</div></div>';
    html += '<div class="metric"><div class="metric-label">Load (Post)</div><div class="metric-value" style="font-size:16px">' + (c.perfDelta.loadTimePost || 0) + 'ms</div></div>';
    var dPct = c.perfDelta.deltaPercent || 0;
    var dColor = dPct <= 0 ? "#059669" : dPct <= 20 ? "#D97706" : "#DC2626";
    html += '<div class="metric"><div class="metric-label">Delta</div><div class="metric-value" style="font-size:16px;color:' + dColor + '">' + (dPct > 0 ? "+" : "") + dPct + '%</div></div>';
    html += '</div></div></div>';
  }

  // ── Footer ──
  html += '<div class="footer">';
  html += 'MigraOps v5.0 — Visual QA Report | Generated: ' + new Date().toISOString();
  html += '<br/>Report ID: ' + r.id + ' | Migration ID: ' + r.migrationId;
  html += '</div>';

  html += '</div></body></html>';
  return html;
}

// ── Helpers ──
function summarizeDOM(domTree) {
  if (!domTree) return null;
  var nodeCount = 0;
  var tags = {};
  var maxDepth = 0;
  function walk(node, depth) {
    nodeCount++;
    if (depth > maxDepth) maxDepth = depth;
    if (node.tag) tags[node.tag] = (tags[node.tag] || 0) + 1;
    if (node.children) node.children.forEach(function(c) { walk(c, depth + 1); });
  }
  walk(domTree, 0);
  return { nodeCount: nodeCount, uniqueTags: Object.keys(tags).length, depth: maxDepth, tagCounts: tags };
}

function countA11yNodes(a11y) {
  if (!a11y) return 0;
  var count = 0;
  function walk(node) {
    count++;
    if (node.children) node.children.forEach(walk);
  }
  if (Array.isArray(a11y)) a11y.forEach(walk);
  else walk(a11y);
  return count;
}

function escHTML(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
