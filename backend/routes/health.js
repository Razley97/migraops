import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'MigraOps Backend',
    version: '5.0.0',
    timestamp: new Date().toISOString(),
    config: {
      anthropic: !!process.env.ANTHROPIC_API_KEY,
      github: !!process.env.GITHUB_TOKEN,
    },
  });
});

export default router;
