import rateLimit from 'express-rate-limit';

const PROVIDER_LIMITS = {
  gemini:    parseInt(process.env.RATE_LIMIT_GEMINI)    || 12,
  groq:      parseInt(process.env.RATE_LIMIT_GROQ)      || 25,
  deepseek:  parseInt(process.env.RATE_LIMIT_DEEPSEEK)  || 50,
  anthropic: parseInt(process.env.RATE_LIMIT_ANTHROPIC) || 100
};

function getProviderFromModel(model) {
  if (!model) return 'anthropic';
  if (model.startsWith('deepseek')) return 'deepseek';
  if (model.startsWith('gemini')) return 'gemini';
  if (model.startsWith('llama') || model.startsWith('gemma') || model.startsWith('mixtral')) return 'groq';
  return 'anthropic';
}

const limiters = new Map();

for (const [provider, max] of Object.entries(PROVIDER_LIMITS)) {
  if (max <= 0) continue;
  limiters.set(provider, rateLimit({
    windowMs: 60000,
    max,
    keyGenerator: () => provider,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      const retryAfter = Math.ceil(60 - (Date.now() % 60000) / 1000);
      res.status(429).json({
        error: `Rate limit exceeded for provider ${provider}. Retry after ${retryAfter} seconds.`,
        provider,
        retryAfter
      });
    }
  }));
}

export function providerRateLimit(req, res, next) {
  const provider = req.body?.provider || getProviderFromModel(req.body?.model);
  const limiter = limiters.get(provider);
  if (!limiter) return next();
  limiter(req, res, next);
}
