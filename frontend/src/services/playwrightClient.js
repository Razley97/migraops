/**
 * MigraOps — Playwright API Client (frontend)
 *
 * Calls the backend Playwright endpoints to capture/compare visual baselines.
 * Degrades gracefully if the backend or Playwright is unavailable.
 */

var API_BASE = '/api/playwright';

export function isPlaywrightAvailable() {
  return fetch(API_BASE + '/health', { method: 'GET' })
    .then(function(res) { return res.json(); })
    .then(function(data) { return data.ok === true; })
    .catch(function() { return false; });
}

export function captureBaseline(files, lang, options) {
  return fetch(API_BASE + '/capture', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ files: files, lang: lang, options: options || {} })
  })
    .then(function(res) { return res.json(); })
    .catch(function(err) { return { ok: false, error: err.message }; });
}

export function compareBaselines(pre, post) {
  return fetch(API_BASE + '/compare', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pre: pre, post: post })
  })
    .then(function(res) { return res.json(); })
    .catch(function(err) { return { ok: false, error: err.message }; });
}
