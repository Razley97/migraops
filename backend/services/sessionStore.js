/**
 * Session Store — In-memory conversation storage for multi-turn chat
 *
 * Map<sessionId, { id, messages[], createdAt, metadata }>
 * Auto-cleanup: sessions older than 2 hours
 */

import { randomUUID } from 'crypto';

const SESSION_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000; // run cleanup every 10 minutes

const sessions = new Map();

// ═══ Auto-cleanup ═══

const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [id, session] of sessions) {
    if (now - session.createdAt > SESSION_TTL_MS) {
      sessions.delete(id);
      console.log(`[SessionStore] Expired session ${id}`);
    }
  }
}, CLEANUP_INTERVAL_MS);

// Allow Node to exit even if the timer is still running
cleanupTimer.unref();

// ═══ Public API ═══

/**
 * Create a new conversation session
 * @param {Object} metadata — { sourceLanguage?, targetLanguage?, files?: [{name, content}] }
 * @returns {Object} session
 */
export function create(metadata = {}) {
  const id = randomUUID();
  const session = {
    id,
    messages: [],
    createdAt: Date.now(),
    metadata: {
      sourceLanguage: metadata.sourceLanguage || null,
      sourceVersion: metadata.sourceVersion || null,
      targetLanguage: metadata.targetLanguage || null,
      targetVersion: metadata.targetVersion || null,
      model: metadata.model || null,
      files: metadata.files || [],
    },
  };
  sessions.set(id, session);
  console.log(`[SessionStore] Created session ${id}`);
  return session;
}

/**
 * Get a session by ID
 * @param {string} id
 * @returns {Object|null} session or null if not found
 */
export function get(id) {
  return sessions.get(id) || null;
}

/**
 * Add a message to a session
 * @param {string} id — session ID
 * @param {string} role — 'user' or 'assistant'
 * @param {string} content — message text
 * @returns {Object|null} updated session or null if session not found
 */
export function addMessage(id, role, content) {
  const session = sessions.get(id);
  if (!session) return null;

  session.messages.push({
    role,
    content,
    timestamp: Date.now(),
  });

  return session;
}

/**
 * Delete a session
 * @param {string} id
 * @returns {boolean} true if deleted, false if not found
 */
export function remove(id) {
  const existed = sessions.has(id);
  sessions.delete(id);
  if (existed) {
    console.log(`[SessionStore] Deleted session ${id}`);
  }
  return existed;
}

/**
 * List all active sessions (summary only, no full message content)
 * @returns {Array} sessions summary
 */
export function list() {
  const result = [];
  for (const [, session] of sessions) {
    result.push({
      id: session.id,
      createdAt: session.createdAt,
      metadata: session.metadata,
      messageCount: session.messages.length,
    });
  }
  return result;
}

export default { create, get, addMessage, remove, list };
