import { randomUUID } from 'crypto';

/**
 * Attaches a unique requestId to each request.
 * Downstream handlers access via req.requestId.
 */
export function requestId(req, res, next) {
  req.requestId = req.headers['x-request-id'] || randomUUID().slice(0, 8);
  res.setHeader('X-Request-Id', req.requestId);
  next();
}
