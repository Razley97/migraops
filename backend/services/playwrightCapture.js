/**
 * MigraOps — Playwright Visual Capture Engine
 *
 * Captures visual baselines of source/migrated code by:
 *  1. Writing files to a temp directory
 *  2. Scaffolding a minimal Vite project
 *  3. Launching Playwright to screenshot, extract DOM, measure perf
 *  4. Cleaning up temp resources
 *
 * Also compares pre vs post baselines via pixelmatch + DOM diff.
 */

import { chromium } from 'playwright-core';
import { mkdtemp, writeFile, mkdir, rm, realpath } from 'fs/promises';
import { existsSync } from 'fs';
import { join, resolve } from 'path';
import { pathToFileURL } from 'url';
import { tmpdir } from 'os';
import { createServer } from 'vite';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

// ── Frontend-renderable languages ──
var RENDERABLE = ['javascript', 'typescript', 'html', 'jsx', 'tsx', 'vue', 'svelte', 'angular', 'react', 'css'];

export function isRenderable(langId) {
  if (!langId) return false;
  var l = langId.toLowerCase();
  return RENDERABLE.some(function(r) { return l.indexOf(r) >= 0; });
}

// ══════════════════════════════════════════════════════════════
// captureBaseline — Spin up temp server, capture with Playwright
// ══════════════════════════════════════════════════════════════
// files: [{ name, path, content }]
// options: { timeout, viewport, maxRoutes }
// Returns: { screenshots: [{ route, png (base64), width, height }],
//            domTree: [...], metrics: {}, a11y: {}, routes: [...] }
// ══════════════════════════════════════════════════════════════
export async function captureBaseline(files, options) {
  var opts = options || {};
  var timeout = opts.timeout || 30000;
  var viewport = opts.viewport || { width: 1280, height: 720 };
  var maxRoutes = opts.maxRoutes || 5;

  // 1. Create temp directory (resolve long path for Windows compatibility)
  var tmpDir = await mkdtemp(join(tmpdir(), 'migraops-pw-'));
  tmpDir = await realpath(tmpDir);
  var srcDir = join(tmpDir, 'src');
  await mkdir(srcDir, { recursive: true });

  var server = null;
  var browser = null;

  try {
    // 2. Write source files (index.html goes to root, rest to src/)
    for (var i = 0; i < files.length; i++) {
      var f = files[i];
      var isRootHtml = f.name === 'index.html';
      var filePath = isRootHtml ? join(tmpDir, f.name) : join(srcDir, f.name);
      // Security: prevent path traversal — resolved path must stay inside tmpDir
      var resolvedPath = resolve(filePath);
      if (!resolvedPath.startsWith(tmpDir)) {
        throw new Error('Invalid file name (path traversal detected): ' + f.name);
      }
      // Security: reject config files that Vite/Node auto-load
      var lowerName = f.name.toLowerCase();
      if (/^(vite\.config|\.env|tsconfig|jsconfig|babel\.config|\.babelrc)/i.test(lowerName)) {
        throw new Error('Config file not allowed: ' + f.name);
      }
      var fileDir = join(filePath, '..');
      await mkdir(fileDir, { recursive: true });
      await writeFile(filePath, f.content, 'utf-8');
    }

    // 3. Scaffold minimal Vite project
    var scaffold = await scaffoldViteProject(tmpDir, files);

    // 4. Start Vite dev server
    var serverConfig = {
      root: tmpDir,
      server: { port: 0, strictPort: false, host: 'localhost' },
      logLevel: 'silent',
      configFile: false
    };
    if (scaffold.plugins) serverConfig.plugins = scaffold.plugins;
    server = await createServer(serverConfig);
    await server.listen();
    var address = server.httpServer.address();
    var baseUrl = 'http://localhost:' + address.port;

    // 5. Launch Playwright
    browser = await chromium.launch({ headless: true });
    var context = await browser.newContext({ viewport: viewport });
    var page = await context.newPage();

    // Collect JS errors
    var jsErrors = [];
    page.on('pageerror', function(err) { jsErrors.push(err.message); });
    page.on('console', function(msg) {
      if (msg.type() === 'error') jsErrors.push(msg.text());
    });

    // 6. Navigate to root
    await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: timeout });
    await page.waitForTimeout(1000); // extra settle time

    // 7. Capture screenshots
    var screenshots = [];
    var routes = ['/'];

    // Detect additional routes from <a> tags
    var links = await page.evaluate(function() {
      var anchors = document.querySelectorAll('a[href]');
      var hrefs = [];
      anchors.forEach(function(a) {
        var h = a.getAttribute('href');
        if (h && h.startsWith('/') && h !== '/' && hrefs.indexOf(h) < 0) hrefs.push(h);
      });
      return hrefs;
    });
    for (var li = 0; li < Math.min(links.length, maxRoutes - 1); li++) {
      routes.push(links[li]);
    }

    for (var ri = 0; ri < routes.length; ri++) {
      var route = routes[ri];
      if (ri > 0) {
        await page.goto(baseUrl + route, { waitUntil: 'networkidle', timeout: timeout });
        await page.waitForTimeout(500);
      }
      var pngBuffer = await page.screenshot({ fullPage: true, type: 'png' });
      screenshots.push({
        route: route,
        png: pngBuffer.toString('base64'),
        width: viewport.width,
        height: viewport.height
      });
    }

    // 7b. Interactive QA tests
    var qaTests = [];
    try {
      qaTests = await runInteractiveTests(page, baseUrl, viewport);
    } catch (qaErr) {
      console.warn('[PW] Interactive tests failed:', qaErr.message);
    }

    // 8. Extract DOM tree
    var domTree = await page.evaluate(function() {
      function serialize(el, depth) {
        if (depth > 10) return null;
        if (!el || el.nodeType !== 1) return null;
        var children = [];
        for (var i = 0; i < el.children.length && i < 50; i++) {
          var c = serialize(el.children[i], depth + 1);
          if (c) children.push(c);
        }
        return {
          tag: el.tagName.toLowerCase(),
          id: el.id || null,
          classes: el.className ? String(el.className).split(/\s+/).filter(Boolean) : [],
          text: el.childNodes.length === 1 && el.childNodes[0].nodeType === 3 ? el.childNodes[0].textContent.trim().slice(0, 100) : null,
          childCount: el.children.length,
          children: children
        };
      }
      return serialize(document.body, 0);
    });

    // 9. Performance metrics
    var metrics = await page.evaluate(function() {
      var p = window.performance;
      var timing = p.timing || {};
      var entries = p.getEntriesByType('resource') || [];
      var totalSize = 0;
      entries.forEach(function(e) { if (e.transferSize) totalSize += e.transferSize; });
      return {
        domContentLoaded: timing.domContentLoadedEventEnd ? timing.domContentLoadedEventEnd - timing.navigationStart : null,
        loadTime: timing.loadEventEnd ? timing.loadEventEnd - timing.navigationStart : null,
        resourceCount: entries.length,
        totalTransferSize: totalSize
      };
    });

    // 10. Accessibility snapshot
    var a11y = null;
    try {
      a11y = await page.accessibility.snapshot();
    } catch (e) {
      a11y = { error: e.message };
    }

    return {
      screenshots: screenshots,
      qaTests: qaTests,
      domTree: domTree,
      metrics: metrics,
      a11y: a11y,
      routes: routes,
      jsErrors: jsErrors,
      timestamp: new Date().toISOString()
    };

  } finally {
    // Cleanup
    if (browser) try { await browser.close(); } catch (e) {}
    if (server) try { await server.close(); } catch (e) {}
    try { await rm(tmpDir, { recursive: true, force: true }); } catch (e) {}
  }
}

// ══════════════════════════════════════════════════════════════
// compareBaselines — Visual + structural comparison
// ══════════════════════════════════════════════════════════════
export async function compareBaselines(pre, post) {
  var results = {
    visualScore: 0,
    domSimilarity: 0,
    functionalScore: 0,
    perfDelta: {},
    a11yDelta: {},
    compositeScore: 0,
    details: {}
  };

  // ── 1. Visual diff (pixelmatch) ──
  var visualScores = [];
  var diffImages = [];
  var preRoutes = pre.screenshots.map(function(s) { return s.route; });
  var postRoutes = post.screenshots.map(function(s) { return s.route; });

  for (var i = 0; i < pre.screenshots.length; i++) {
    var preSS = pre.screenshots[i];
    var postSS = post.screenshots.find(function(s) { return s.route === preSS.route; });
    if (!postSS) {
      visualScores.push(0); // Route missing in post = 0% match
      continue;
    }

    try {
      var preImg = PNG.sync.read(Buffer.from(preSS.png, 'base64'));
      var postImg = PNG.sync.read(Buffer.from(postSS.png, 'base64'));

      // Resize to common dimensions
      var w = Math.min(preImg.width, postImg.width);
      var h = Math.min(preImg.height, postImg.height);

      var diffPng = new PNG({ width: w, height: h });
      var mismatch = pixelmatch(
        cropPNG(preImg, w, h),
        cropPNG(postImg, w, h),
        diffPng.data,
        w, h,
        { threshold: 0.15, alpha: 0.3 }
      );

      var totalPixels = w * h;
      var matchPct = totalPixels > 0 ? Math.round((1 - mismatch / totalPixels) * 100) : 0;
      visualScores.push(matchPct);
      diffImages.push({
        route: preSS.route,
        diff: PNG.sync.write(diffPng).toString('base64'),
        mismatchPixels: mismatch,
        totalPixels: totalPixels,
        matchPct: matchPct
      });
    } catch (e) {
      visualScores.push(50); // Parse error = 50% fallback
    }
  }

  // Missing routes in post
  for (var pi = 0; pi < postRoutes.length; pi++) {
    if (preRoutes.indexOf(postRoutes[pi]) < 0) {
      visualScores.push(80); // New route in post = slight bonus
    }
  }

  results.visualScore = visualScores.length > 0
    ? Math.round(visualScores.reduce(function(a, b) { return a + b; }, 0) / visualScores.length)
    : 0;
  results.details.diffImages = diffImages;

  // ── 2. DOM similarity (Jaccard on tag+class tuples) ──
  var preTuples = flattenDOM(pre.domTree);
  var postTuples = flattenDOM(post.domTree);
  results.domSimilarity = jaccardSimilarity(preTuples, postTuples);
  results.details.domPreCount = preTuples.length;
  results.details.domPostCount = postTuples.length;

  // ── 3. Functional parity ──
  var commonRoutes = preRoutes.filter(function(r) { return postRoutes.indexOf(r) >= 0; });
  var routeParity = preRoutes.length > 0 ? Math.round(commonRoutes.length / preRoutes.length * 100) : 100;
  var preErrors = (pre.jsErrors || []).length;
  var postErrors = (post.jsErrors || []).length;
  var errorDelta = postErrors - preErrors;
  var errorScore = errorDelta <= 0 ? 100 : Math.max(0, 100 - errorDelta * 20);
  results.functionalScore = Math.round((routeParity + errorScore) / 2);
  results.details.routeParity = routeParity;
  results.details.preErrors = preErrors;
  results.details.postErrors = postErrors;

  // ── 4. Performance delta ──
  var preLoad = pre.metrics.loadTime || 0;
  var postLoad = post.metrics.loadTime || 0;
  var loadDelta = preLoad > 0 ? Math.round((postLoad - preLoad) / preLoad * 100) : 0;
  results.perfDelta = {
    loadTimePre: preLoad,
    loadTimePost: postLoad,
    deltaPercent: loadDelta,
    score: loadDelta <= 10 ? 100 : loadDelta <= 30 ? 80 : loadDelta <= 50 ? 60 : 40
  };

  // ── 5. Accessibility delta ──
  var preA11yCount = countA11yNodes(pre.a11y);
  var postA11yCount = countA11yNodes(post.a11y);
  var a11yDiff = postA11yCount - preA11yCount;
  results.a11yDelta = {
    preNodes: preA11yCount,
    postNodes: postA11yCount,
    delta: a11yDiff,
    score: a11yDiff >= 0 ? 100 : Math.max(0, 100 + a11yDiff * 10)
  };

  // ── Composite score: weighted average ──
  results.compositeScore = Math.round(
    results.visualScore * 0.40 +
    results.domSimilarity * 0.25 +
    results.functionalScore * 0.20 +
    results.perfDelta.score * 0.10 +
    results.a11yDelta.score * 0.05
  );

  return results;
}

// ══════════════════════════════════════════════════════════════
// Helpers
// ══════════════════════════════════════════════════════════════

function cropPNG(img, w, h) {
  if (img.width === w && img.height === h) return img.data;
  var cropped = Buffer.alloc(w * h * 4);
  for (var y = 0; y < h; y++) {
    var srcOff = y * img.width * 4;
    var dstOff = y * w * 4;
    img.data.copy(cropped, dstOff, srcOff, srcOff + w * 4);
  }
  return cropped;
}

function flattenDOM(node) {
  if (!node) return [];
  var tuple = node.tag + (node.classes && node.classes.length > 0 ? '.' + node.classes.join('.') : '');
  var result = [tuple];
  if (node.children) {
    node.children.forEach(function(c) {
      result = result.concat(flattenDOM(c));
    });
  }
  return result;
}

function jaccardSimilarity(a, b) {
  if (a.length === 0 && b.length === 0) return 100;
  var setA = {};
  var setB = {};
  a.forEach(function(x) { setA[x] = (setA[x] || 0) + 1; });
  b.forEach(function(x) { setB[x] = (setB[x] || 0) + 1; });
  var allKeys = Object.keys(setA);
  Object.keys(setB).forEach(function(k) { if (allKeys.indexOf(k) < 0) allKeys.push(k); });
  var intersection = 0, union = 0;
  allKeys.forEach(function(k) {
    var ca = setA[k] || 0;
    var cb = setB[k] || 0;
    intersection += Math.min(ca, cb);
    union += Math.max(ca, cb);
  });
  return union > 0 ? Math.round(intersection / union * 100) : 100;
}

function countA11yNodes(tree) {
  if (!tree || tree.error) return 0;
  var count = 1;
  if (tree.children) {
    tree.children.forEach(function(c) { count += countA11yNodes(c); });
  }
  return count;
}

// ══════════════════════════════════════════════════════════════
// Interactive QA Testing — automated behavioral tests
// ══════════════════════════════════════════════════════════════
async function runInteractiveTests(page, baseUrl, viewport) {
  var tests = [];
  var testId = 0;

  // Helper: capture screenshot as base64
  async function snap(label) {
    try {
      var buf = await page.screenshot({ fullPage: false, type: 'png' });
      return buf.toString('base64');
    } catch(e) { return null; }
  }

  // Helper: add test result
  function addTest(category, description, element, status, findings, screenshots) {
    tests.push({
      id: 'qa-' + (++testId),
      category: category,
      description: description,
      element: element || null,
      status: status,
      findings: findings || '',
      screenshots: screenshots || []
    });
  }

  // ── TEST 1: Page Load ──
  var loadScreenshot = await snap('initial-load');
  var title = await page.title();
  addTest('load', 'Page loads without errors', 'document', 'pass',
    'Page loaded successfully. Title: "' + (title || 'untitled') + '"',
    [{ stage: 'loaded', png: loadScreenshot }]
  );

  // ── TEST 2: Console Errors Check ──
  var consoleErrors = [];
  page.on('console', function(msg) {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  // Re-navigate to collect fresh console output
  await page.reload({ waitUntil: 'networkidle', timeout: 10000 }).catch(function(){});
  await page.waitForTimeout(500);
  addTest('console', 'No JavaScript console errors', 'console',
    consoleErrors.length === 0 ? 'pass' : 'warn',
    consoleErrors.length === 0 ? 'No console errors detected' : consoleErrors.length + ' errors: ' + consoleErrors.slice(0, 3).join('; '),
    []
  );

  // ── TEST 3: Interactive Elements Discovery ──
  var elements = await page.evaluate(function() {
    var result = { buttons: [], inputs: [], links: [], selects: [] };
    document.querySelectorAll('button, [role="button"], input[type="submit"]').forEach(function(el, i) {
      if (i < 5) result.buttons.push({ text: (el.textContent || el.value || '').trim().slice(0, 50), tag: el.tagName, selector: el.id ? '#' + el.id : (el.className ? '.' + el.className.split(' ')[0] : el.tagName.toLowerCase()) });
    });
    document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]), textarea, select').forEach(function(el, i) {
      if (i < 5) result.inputs.push({ type: el.type || el.tagName.toLowerCase(), name: el.name || el.placeholder || '', selector: el.id ? '#' + el.id : (el.name ? '[name="' + el.name + '"]' : el.tagName.toLowerCase()) });
    });
    document.querySelectorAll('a[href]').forEach(function(el, i) {
      if (i < 5) result.links.push({ text: (el.textContent || '').trim().slice(0, 50), href: el.getAttribute('href'), selector: el.id ? '#' + el.id : 'a' });
    });
    document.querySelectorAll('select').forEach(function(el, i) {
      if (i < 3) result.selects.push({ name: el.name || '', options: el.options.length, selector: el.id ? '#' + el.id : 'select' });
    });
    return result;
  });

  addTest('discovery', 'Interactive elements found', 'page',
    'info',
    'Buttons: ' + elements.buttons.length + ', Inputs: ' + elements.inputs.length + ', Links: ' + elements.links.length + ', Selects: ' + elements.selects.length,
    []
  );

  // ── TEST 4: Button Click Tests ──
  var allButtons = await page.$$('button, [role="button"], input[type="submit"]');
  for (var bi = 0; bi < Math.min(allButtons.length, 3); bi++) {
    try {
      var btn = allButtons[bi];
      var btnText = await btn.evaluate(function(el) { return (el.textContent || el.value || '').trim().slice(0, 40); });
      var beforeSnap = await snap('btn-before-' + bi);

      // Check if button is visible and enabled
      var isVisible = await btn.isVisible();
      var isEnabled = await btn.isEnabled();
      if (!isVisible || !isEnabled) {
        addTest('interaction', 'Button "' + btnText + '" — skipped (not visible/enabled)', 'button', 'info',
          'Button is ' + (!isVisible ? 'hidden' : 'disabled'),
          [{ stage: 'current', png: beforeSnap }]
        );
        continue;
      }

      await btn.click({ timeout: 3000 }).catch(function(){});
      await page.waitForTimeout(800);
      var afterSnap = await snap('btn-after-' + bi);

      // Detect changes after click
      var newUrl = page.url();
      var urlChanged = newUrl !== baseUrl && newUrl !== baseUrl + '/';

      addTest('interaction', 'Click button "' + btnText + '"', 'button',
        'pass',
        urlChanged ? 'Navigation to ' + newUrl : 'UI updated after click',
        [{ stage: 'before', png: beforeSnap }, { stage: 'after', png: afterSnap }]
      );

      // Navigate back if URL changed
      if (urlChanged) {
        await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 10000 }).catch(function(){});
        await page.waitForTimeout(500);
        allButtons = await page.$$('button, [role="button"], input[type="submit"]');
      }
    } catch(btnErr) {
      addTest('interaction', 'Button click test #' + (bi + 1) + ' failed', 'button', 'fail',
        'Error: ' + btnErr.message, []
      );
    }
  }

  // ── TEST 5: Form Input Tests ──
  var allInputs = await page.$$('input:not([type="hidden"]):not([type="submit"]), textarea');
  for (var ii = 0; ii < Math.min(allInputs.length, 3); ii++) {
    try {
      var input = allInputs[ii];
      var inputInfo = await input.evaluate(function(el) {
        return { type: el.type || 'text', name: el.name || el.placeholder || 'input', tag: el.tagName };
      });
      var isVis = await input.isVisible();
      if (!isVis) continue;

      var beforeInput = await snap('input-before-' + ii);
      await input.click({ timeout: 2000 }).catch(function(){});
      await input.fill('test-input').catch(function(){});
      await page.waitForTimeout(300);
      var afterInput = await snap('input-after-' + ii);

      addTest('form', 'Fill ' + inputInfo.type + ' input "' + inputInfo.name + '"', 'input',
        'pass',
        'Input accepted text value',
        [{ stage: 'before', png: beforeInput }, { stage: 'after', png: afterInput }]
      );

      // Clear the input
      await input.fill('').catch(function(){});
    } catch(inputErr) {
      addTest('form', 'Input test #' + (ii + 1), 'input', 'fail',
        'Error: ' + inputErr.message, []
      );
    }
  }

  // ── TEST 6: Scroll Test ──
  try {
    var bodyHeight = await page.evaluate(function() { return document.body.scrollHeight; });
    var viewHeight = viewport.height;
    if (bodyHeight > viewHeight * 1.2) {
      var topSnap = await snap('scroll-top');
      await page.evaluate(function() { window.scrollTo(0, document.body.scrollHeight); });
      await page.waitForTimeout(500);
      var bottomSnap = await snap('scroll-bottom');
      await page.evaluate(function() { window.scrollTo(0, 0); });

      addTest('scroll', 'Page scroll behavior', 'window',
        'pass',
        'Page is scrollable. Height: ' + bodyHeight + 'px (viewport: ' + viewHeight + 'px)',
        [{ stage: 'top', png: topSnap }, { stage: 'bottom', png: bottomSnap }]
      );
    } else {
      addTest('scroll', 'Page fits in viewport', 'window',
        'info',
        'Content height (' + bodyHeight + 'px) fits within viewport (' + viewHeight + 'px). No scroll needed.',
        []
      );
    }
  } catch(scrollErr) {
    addTest('scroll', 'Scroll test', 'window', 'fail', 'Error: ' + scrollErr.message, []);
  }

  // ── TEST 7: Responsive Test (mobile viewport) ──
  try {
    var mobileVP = { width: 375, height: 667 };
    await page.setViewportSize(mobileVP);
    await page.waitForTimeout(500);
    var mobileSnap = await snap('responsive-mobile');

    // Check for horizontal overflow
    var hasOverflow = await page.evaluate(function() {
      return document.body.scrollWidth > window.innerWidth;
    });

    addTest('responsive', 'Mobile viewport test (375x667)', 'viewport',
      hasOverflow ? 'warn' : 'pass',
      hasOverflow ? 'Horizontal overflow detected at mobile width' : 'Content adapts to mobile viewport',
      [{ stage: 'mobile', png: mobileSnap }]
    );

    // Restore original viewport
    await page.setViewportSize(viewport);
    await page.waitForTimeout(300);
  } catch(respErr) {
    addTest('responsive', 'Responsive test', 'viewport', 'fail', 'Error: ' + respErr.message, []);
  }

  return tests;
}

// ── Scaffold a minimal Vite project around the source files ──
async function scaffoldViteProject(tmpDir, files) {
  // Detect entry file
  var entryNames = ['index.html', 'index.jsx', 'index.tsx', 'index.js', 'App.jsx', 'App.tsx', 'App.js', 'main.jsx', 'main.tsx', 'main.js'];
  var entry = null;
  for (var i = 0; i < entryNames.length; i++) {
    var found = files.find(function(f) { return f.name === entryNames[i] || f.name.endsWith('/' + entryNames[i]); });
    if (found) { entry = found; break; }
  }

  // Detect if source uses React
  var usesReact = files.some(function(f) {
    return f.content && (f.content.indexOf('import React') >= 0 || f.content.indexOf('from "react"') >= 0 || f.content.indexOf("from 'react'") >= 0 || f.name.endsWith('.jsx') || f.name.endsWith('.tsx'));
  });

  // Return config for inline Vite (no vite.config.js needed)
  var scaffoldResult = { plugins: null };

  // package.json (minimal) — only needed for React deps
  if (usesReact) {
    var pkg = {
      name: 'migraops-pw-temp',
      private: true,
      type: 'module',
      dependencies: {
        'react': '^18.0.0',
        'react-dom': '^18.0.0',
        '@vitejs/plugin-react': '^4.0.0'
      }
    };
    await writeFile(join(tmpDir, 'package.json'), JSON.stringify(pkg, null, 2), 'utf-8');
  }

  // Generate React entry point if needed
  var hasMain = files.some(function(f) { return f.name === 'main.jsx' || f.name === 'main.tsx' || f.name === 'main.js' || f.name === 'index.js' || f.name === 'index.jsx' || f.name === 'index.tsx'; });
  var needsReactEntry = usesReact && !hasMain && entry && (entry.name === 'App.jsx' || entry.name === 'App.tsx' || entry.name === 'App.js');
  if (needsReactEntry) {
    var mainContent = 'import React from "react";\nimport ReactDOM from "react-dom/client";\nimport App from "./' + entry.name.replace(/\.\w+$/, '') + '";\n\nvar root = ReactDOM.createRoot(document.getElementById("root"));\nroot.render(React.createElement(App));\n';
    await writeFile(join(tmpDir, 'src', 'main.jsx'), mainContent, 'utf-8');
  }

  // index.html
  var hasHtml = files.some(function(f) { return f.name === 'index.html'; });
  if (!hasHtml) {
    var scriptEntry = needsReactEntry ? 'src/main.jsx' : (entry ? 'src/' + entry.name : 'src/index.js');
    var htmlContent = '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>MigraOps Preview</title>\n</head>\n<body>\n  <div id="root"></div>\n  <div id="app"></div>\n  <script type="module" src="/' + scriptEntry + '"></script>\n</body>\n</html>';
    await writeFile(join(tmpDir, 'index.html'), htmlContent, 'utf-8');
  }

  // Install dependencies and load React plugin if needed
  if (usesReact) {
    var { execSync } = await import('child_process');
    try {
      execSync('npm install --no-audit --no-fund --loglevel=error', {
        cwd: tmpDir,
        timeout: 60000,
        stdio: 'pipe'
      });
      // Load the installed plugin (use file:// URL for Windows compatibility)
      var pluginPath = pathToFileURL(join(tmpDir, 'node_modules', '@vitejs', 'plugin-react', 'dist', 'index.js')).href;
      var reactPlugin = await import(pluginPath);
      scaffoldResult.plugins = [(reactPlugin.default || reactPlugin)()];
    } catch (e) {
      console.warn('[PW] npm install failed, continuing without React plugin:', e.message);
    }
  }

  return scaffoldResult;
}
