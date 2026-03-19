/**
 * Claude Stream — Wrapper for Anthropic streaming API
 *
 * Sends messages to Claude with stream:true and returns a ReadableStream
 * that emits parsed SSE events from the Anthropic response.
 */

import fetch from 'node-fetch';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';
const DEFAULT_MODEL = 'claude-sonnet-4-20250514';
const DEFAULT_MAX_TOKENS = 4000;

const BASE_SYSTEM_PROMPT = `Eres un arquitecto de migración senior de MigraOps. Guías al usuario paso a paso en la migración de su código.

REGLAS:
- Analiza el código antes de proponer cambios
- Propón migraciones archivo por archivo
- Explica cada cambio importante
- Espera aprobación del usuario antes de continuar
- Si el usuario pide cambios, ajusta tu propuesta
- Responde en el idioma del usuario
- Muestra el código migrado completo, nunca truncado
- Usa markdown para formatear código

Cuando propongas una migración de archivo, usa EXACTAMENTE este formato:
---MIGRATION_PROPOSAL---
FILE: nombre_archivo
CONFIDENCE: 0-100
CHANGES:
- cambio 1
- cambio 2
RISKS:
- riesgo 1 (si hay)
CODE:
\`\`\`lenguaje
código migrado completo
\`\`\`
---END_PROPOSAL---`;

/**
 * Build dynamic system prompt with session context (languages, file contents).
 */
function buildSystemPrompt(session) {
  const meta = session.metadata || {};
  let prompt = BASE_SYSTEM_PROMPT;
  if (meta.sourceLanguage || meta.targetLanguage) {
    prompt += "\n\nCONTEXTO DE MIGRACIÓN:";
    if (meta.sourceLanguage) prompt += "\n- Lenguaje origen: " + meta.sourceLanguage + (meta.sourceVersion ? " " + meta.sourceVersion : "");
    if (meta.targetLanguage) prompt += "\n- Lenguaje destino: " + meta.targetLanguage + (meta.targetVersion ? " " + meta.targetVersion : "");
  }
  if (meta.files && meta.files.length > 0) {
    const hasContent = meta.files.some(f => f && typeof f === "object" && f.content);
    if (hasContent) {
      prompt += "\n\nARCHIVOS DEL USUARIO (código fuente a migrar):";
      for (const file of meta.files) {
        if (file && typeof file === "object" && file.content) {
          prompt += "\n\n### " + (file.name || "archivo") + "\n" + "```" + "\n" + file.content + "\n" + "```";
        }
      }
      prompt += "\n\nAnaliza estos archivos y propón la migración uno por uno. Empieza por el archivo más simple o independiente.";
    }
  }
  return prompt;
}


/**
 * Stream a chat completion from the Anthropic API.
 *
 * @param {Object} session — session object from sessionStore (must contain .messages)
 * @param {Object} options
 * @param {string}  [options.model]      — Claude model ID
 * @param {number}  [options.maxTokens]  — max tokens for the response
 * @param {string}  [options.system]     — override system prompt
 * @param {Array}   [options.tools]      — tool definitions for tool_use
 * @param {AbortSignal} [options.signal] — AbortController signal for cancellation
 * @returns {Object} { stream: ReadableStream, response: fetch Response }
 */
export async function streamChat(session, options = {}) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured on server');
  }

  // Build messages array — strip timestamps, keep only role + content for Anthropic
  const messages = session.messages.map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));

  const body = {
    model: options.model || DEFAULT_MODEL,
    max_tokens: options.maxTokens || DEFAULT_MAX_TOKENS,
    system: options.system || buildSystemPrompt(session),
    messages,
    stream: true,
  };

  if (options.tools && options.tools.length > 0) {
    body.tools = options.tools;
  }

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': ANTHROPIC_VERSION,
    },
    body: JSON.stringify(body),
    signal: options.signal || undefined,
  });

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = { error: `Anthropic API returned ${response.status}` };
    }
    const err = new Error(errorData.error?.message || errorData.error || `API error ${response.status}`);
    err.status = response.status;
    err.data = errorData;
    throw err;
  }

  return {
    stream: response.body,
    response,
  };
}

/**
 * Parse an SSE line buffer from the Anthropic stream.
 * Yields parsed event objects one at a time.
 *
 * @param {ReadableStream|NodeJS.ReadableStream} stream — the response body stream
 * @param {Function} onEvent — callback(event) called for each parsed SSE event
 * @param {AbortSignal} [signal] — optional abort signal
 * @returns {Promise<void>} resolves when stream is done
 */
export async function parseAnthropicStream(stream, onEvent, signal) {
  let buffer = '';

  for await (const chunk of stream) {
    if (signal?.aborted) break;

    buffer += chunk.toString('utf-8');

    // SSE events are separated by double newlines
    const parts = buffer.split('\n\n');
    // Last part may be incomplete — keep it in buffer
    buffer = parts.pop() || '';

    for (const part of parts) {
      if (signal?.aborted) break;

      const lines = part.split('\n');
      let eventType = null;
      let eventData = null;

      for (const line of lines) {
        if (line.startsWith('event: ')) {
          eventType = line.slice(7).trim();
        } else if (line.startsWith('data: ')) {
          const raw = line.slice(6);
          try {
            eventData = JSON.parse(raw);
          } catch {
            eventData = raw;
          }
        }
      }

      if (eventType && eventData) {
        onEvent({ type: eventType, data: eventData });
      }
    }
  }

  // Process any remaining data in the buffer
  if (buffer.trim() && !signal?.aborted) {
    const lines = buffer.split('\n');
    let eventType = null;
    let eventData = null;

    for (const line of lines) {
      if (line.startsWith('event: ')) {
        eventType = line.slice(7).trim();
      } else if (line.startsWith('data: ')) {
        const raw = line.slice(6);
        try {
          eventData = JSON.parse(raw);
        } catch {
          eventData = raw;
        }
      }
    }

    if (eventType && eventData) {
      onEvent({ type: eventType, data: eventData });
    }
  }
}

export default { streamChat, parseAnthropicStream };
