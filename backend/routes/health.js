import { Router } from 'express';
import { sessionStore } from '../services/sessionStore.js';

const router = Router();
const startedAt = Date.now();

function formatBytes(bytes) {
  const mb = bytes / 1024 / 1024;
  return `${mb.toFixed(1)}MB`;
}

router.get('/', (req, res) => {
  const mem = process.memoryUsage();
  res.json({
    status: 'ok',
    service: 'MigraOps Backend',
    version: '5.0.0',
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - startedAt) / 1000),
    node: process.version,
    memory: {
      rss: formatBytes(mem.rss),
      heapUsed: formatBytes(mem.heapUsed),
      heapTotal: formatBytes(mem.heapTotal),
    },
    sessions: {
      active: sessionStore.list().length,
    },
    config: {
      anthropic: !!process.env.ANTHROPIC_API_KEY,
      github: !!process.env.GITHUB_TOKEN,
    },
  });
});

export default router;
