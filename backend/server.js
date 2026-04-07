/**
 * MigraOps Backend Server
 * 
 * Handles:
 * - AI API proxy (Anthropic Claude) — protects API key server-side
 * - GitHub API proxy — higher rate limits with server token
 * - Static file serving in production
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import migrateRouter from './routes/migrate.js';
import githubRouter from './routes/github.js';
import healthRouter from './routes/health.js';
import conversationRouter from './routes/conversation.js';
import playwrightRouter from './routes/playwright.js';
import { rateLimiter } from './middleware/rateLimit.js';
import { requestId } from './middleware/requestId.js';
import logger from './services/logger.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// ═══ Middleware ═══
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", "https://api.anthropic.com", "https://api.github.com", "https://api.deepseek.com", "https://generativelanguage.googleapis.com", "https://api.groq.com"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(requestId);

// Playwright router BEFORE global body limit — screenshots exceed 2mb
app.use('/api/playwright', playwrightRouter);

app.use(express.json({ limit: '2mb' }));
app.use(rateLimiter);

// ═══ API Routes ═══
app.use('/api/migrate', migrateRouter);
app.use('/api/github', githubRouter);
app.use('/api/health', healthRouter);
app.use('/api/conversation', conversationRouter);

// ═══ Production: Serve frontend static files ═══
if (process.env.NODE_ENV === 'production') {
  const frontendDist = join(__dirname, '..', 'frontend', 'dist');
  app.use(express.static(frontendDist));
  app.get('*', (req, res) => {
    res.sendFile(join(frontendDist, 'index.html'));
  });
}

// ═══ Error handler ═══
app.use((err, req, res, next) => {
  logger.error(err.message, { requestId: req.requestId, status: err.status || 500 });
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// ═══ Start ═══
app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════╗
  ║   MigraOps Backend v5.0             ║
  ║   Port: ${PORT}                          ║
  ║   Env:  ${process.env.NODE_ENV || 'development'}                ║
  ║   API:  ${process.env.ANTHROPIC_API_KEY ? '✅ Configured' : '❌ Missing ANTHROPIC_API_KEY'}        ║
  ╚══════════════════════════════════════╝
  `);
  logger.info('MigraOps Backend started', { port: PORT, env: process.env.NODE_ENV || 'development' });
});

export default app;
