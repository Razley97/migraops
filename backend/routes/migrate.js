/**
 * Migration Route — Proxies requests to Anthropic Claude API
 * Keeps the API key secure on the server side
 */

import { Router } from 'express';
import fetch from 'node-fetch';

const router = Router();

router.post('/', async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: 'ANTHROPIC_API_KEY not configured on server',
    });
  }

  try {
    const { model, max_tokens, system, messages } = req.body;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: model || 'claude-sonnet-4-20250514',
        max_tokens: max_tokens || 4096,
        system: system || '',
        messages: messages || [],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`[Anthropic Error] ${response.status}:`, data);
      return res.status(response.status).json(data);
    }

    res.json(data);
  } catch (error) {
    console.error('[Migration Error]', error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
