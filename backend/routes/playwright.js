/**
 * MigraOps — Playwright API Routes
 *
 * POST /capture  — Capture visual baseline from source files
 * POST /compare  — Compare pre vs post baselines
 * GET  /health   — Check if Playwright is available
 */

import { Router } from 'express';
import express from 'express';
import rateLimit from 'express-rate-limit';
import { captureBaseline, compareBaselines, isRenderable } from '../services/playwrightCapture.js';

var router = Router();

// Rate limit: Playwright operations are CPU-heavy (browser launches)
var pwLimiter = rateLimit({ windowMs: 60000, max: 10, message: { error: 'Too many Playwright requests, please wait' } });
router.use(pwLimiter);

// Body limit for screenshots (base64 images are large, but cap at 15mb)
router.use(express.json({ limit: '15mb' }));

// ── Health check ──
router.get('/health', async function(req, res) {
  try {
    // Try to import playwright-core to verify it's installed
    var pw = await import('playwright-core');
    var browsers = pw.chromium ? 'chromium' : 'none';
    res.json({ ok: true, browsers: browsers, message: 'Playwright available' });
  } catch (e) {
    res.json({ ok: false, message: 'Playwright not installed: ' + e.message });
  }
});

// ── Capture baseline ──
// Body: { files: [{ name, path, content }], lang: string, options: {} }
router.post('/capture', async function(req, res) {
  var startMs = Date.now();
  try {
    var files = req.body.files;
    var lang = req.body.lang || '';
    var options = req.body.options || {};

    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ ok: false, error: 'No files provided' });
    }

    // Check if language is renderable
    if (!isRenderable(lang)) {
      return res.json({
        ok: false,
        skipped: true,
        reason: 'Language "' + lang + '" is not visually renderable',
        durationMs: Date.now() - startMs
      });
    }

    var result = await captureBaseline(files, options);
    result.ok = true;
    result.durationMs = Date.now() - startMs;
    res.json(result);

  } catch (e) {
    console.error('[PW] Capture error:', e);
    res.status(500).json({
      ok: false,
      error: e.message,
      durationMs: Date.now() - startMs
    });
  }
});

// ── Compare baselines ──
// Body: { pre: <baseline>, post: <baseline> }
router.post('/compare', async function(req, res) {
  var startMs = Date.now();
  try {
    var pre = req.body.pre;
    var post = req.body.post;

    if (!pre || !post) {
      return res.status(400).json({ ok: false, error: 'Both pre and post baselines required' });
    }

    var result = await compareBaselines(pre, post);
    result.ok = true;
    result.durationMs = Date.now() - startMs;
    res.json(result);

  } catch (e) {
    console.error('[PW] Compare error:', e);
    res.status(500).json({
      ok: false,
      error: e.message,
      durationMs: Date.now() - startMs
    });
  }
});

export default router;
