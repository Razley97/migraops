/**
 * Structured logger — JSON output with timestamp, level, requestId.
 * Drop-in replacement for console.log/error/warn in route handlers.
 */

const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
const MIN_LEVEL = LEVELS[process.env.LOG_LEVEL || 'info'];

function formatLog(level, msg, meta) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    msg,
  };
  if (meta) Object.assign(entry, meta);
  return JSON.stringify(entry);
}

const logger = {
  debug(msg, meta) { if (LEVELS.debug >= MIN_LEVEL) console.log(formatLog('debug', msg, meta)); },
  info(msg, meta)  { if (LEVELS.info  >= MIN_LEVEL) console.log(formatLog('info',  msg, meta)); },
  warn(msg, meta)  { if (LEVELS.warn  >= MIN_LEVEL) console.warn(formatLog('warn',  msg, meta)); },
  error(msg, meta) { if (LEVELS.error >= MIN_LEVEL) console.error(formatLog('error', msg, meta)); },
};

export default logger;
