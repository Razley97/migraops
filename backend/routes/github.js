/**
 * GitHub Route — Proxies requests to GitHub API
 * Uses server-side token for higher rate limits
 * Supports: repos, branches, trees, commits, file contents
 */

import { Router } from 'express';
import fetch from 'node-fetch';

const router = Router();

const ghFetch = async (path, userToken) => {
  const token = userToken || process.env.GITHUB_TOKEN;
  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'MigraOps/5.0',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`https://api.github.com${path}`, { headers });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const err = new Error(error.message || `GitHub API ${response.status}`);
    err.status = response.status;
    throw err;
  }

  return response.json();
};

// GET /api/github/repos/:owner/:repo
router.get('/repos/:owner/:repo', async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const token = req.headers['x-github-token'];
    const data = await ghFetch(`/repos/${owner}/${repo}`, token);
    res.json(data);
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
});

// GET /api/github/repos/:owner/:repo/branches
router.get('/repos/:owner/:repo/branches', async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const token = req.headers['x-github-token'];
    const data = await ghFetch(`/repos/${owner}/${repo}/branches?per_page=30`, token);
    res.json(data);
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
});

// GET /api/github/repos/:owner/:repo/git/trees/:sha
router.get('/repos/:owner/:repo/git/trees/:sha', async (req, res) => {
  try {
    const { owner, repo, sha } = req.params;
    const token = req.headers['x-github-token'];
    const data = await ghFetch(`/repos/${owner}/${repo}/git/trees/${sha}?recursive=1`, token);
    res.json(data);
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
});

// GET /api/github/repos/:owner/:repo/commits
router.get('/repos/:owner/:repo/commits', async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const sha = req.query.sha || 'main';
    const token = req.headers['x-github-token'];
    const data = await ghFetch(`/repos/${owner}/${repo}/commits?sha=${sha}&per_page=10`, token);
    res.json(data);
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
});

// GET /api/github/repos/:owner/:repo/contents/:path
router.get('/repos/:owner/:repo/contents/*', async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const filePath = req.params[0];
    const ref = req.query.ref || 'main';
    const token = req.headers['x-github-token'];
    const data = await ghFetch(`/repos/${owner}/${repo}/contents/${filePath}?ref=${ref}`, token);
    res.json(data);
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
});

export default router;
