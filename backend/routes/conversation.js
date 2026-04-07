/**
 * Conversation Route — Multi-turn chat with streaming SSE
 *
 * POST   /api/conversation              — create session
 * POST   /api/conversation/:id/message  — send message (SSE stream response)
 * GET    /api/conversation/:id          — get session history
 * GET    /api/conversation              — list sessions
 * DELETE /api/conversation/:id          — delete session
 */

import { Router } from 'express';
import { z } from 'zod';
import sessionStore from '../services/sessionStore.js';
import { streamChat, parseAnthropicStream } from '../services/claudeStream.js';
import { validateBody } from '../middleware/validate.js';

const router = Router();

// ═══ Input validation ═══
const createSessionSchema = z.object({
  sourceLanguage: z.string().max(50).optional(),
  sourceVersion: z.string().max(50).optional(),
  targetLanguage: z.string().max(50).optional(),
  targetVersion: z.string().max(50).optional(),
  model: z.string().max(100).optional(),
  files: z.array(z.object({
    name: z.string().max(255),
    content: z.string().max(500000),
  })).max(50).optional(),
}).passthrough();

const messageSchema = z.object({
  content: z.string().min(1).max(100000),
});

// ═══ Helpers ═══

/**
 * Write a single SSE event to the response
 */
function sseWrite(res, data) {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

/**
 * Parse accumulated text looking for ---MIGRATION_PROPOSAL--- blocks.
 * Returns { proposals: Array, remainingText: string }
 */
function extractProposals(text) {
  const proposals = [];
  const regex = /---MIGRATION_PROPOSAL---\s*\n([\s\S]*?)---END_PROPOSAL---/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const block = match[1];
    const proposal = {};

    const fileMatch = block.match(/^FILE:\s*(.+)$/m);
    if (fileMatch) proposal.file = fileMatch[1].trim();

    const confMatch = block.match(/^CONFIDENCE:\s*(\d+)/m);
    if (confMatch) proposal.confidence = parseInt(confMatch[1], 10);

    const changesMatch = block.match(/CHANGES:\n((?:- .+\n?)*)/m);
    if (changesMatch) {
      proposal.changes = changesMatch[1]
        .split('\n')
        .filter((l) => l.startsWith('- '))
        .map((l) => l.slice(2).trim());
    } else {
      proposal.changes = [];
    }

    const risksMatch = block.match(/RISKS:\n((?:- .+\n?)*)/m);
    if (risksMatch) {
      proposal.risks = risksMatch[1]
        .split('\n')
        .filter((l) => l.startsWith('- '))
        .map((l) => l.slice(2).trim());
    } else {
      proposal.risks = [];
    }

    const codeMatch = block.match(/CODE:\s*\n```[\w]*\n([\s\S]*?)```/m);
    if (codeMatch) proposal.code = codeMatch[1].trimEnd();

    proposals.push(proposal);
  }

  return proposals;
}

// ═══ POST /api/conversation — Create session ═══

router.post('/', validateBody(createSessionSchema), (req, res) => {
  try {
    const { sourceLanguage, sourceVersion, targetLanguage, targetVersion, model, files } = req.body || {};
    const session = sessionStore.create({ sourceLanguage, sourceVersion, targetLanguage, targetVersion, model, files });
    res.status(201).json({
      sessionId: session.id,
      createdAt: session.createdAt,
    });
  } catch (error) {
    console.error('[Conversation] Create error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ═══ POST /api/conversation/:id/message — Send message with SSE streaming ═══

router.post('/:id/message', validateBody(messageSchema), async (req, res) => {
  const { id } = req.params;
  const { content } = req.body || {};

  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return res.status(400).json({ error: 'Message content is required' });
  }

  const session = sessionStore.get(id);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  // Add user message to session
  sessionStore.addMessage(id, 'user', content.trim());

  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no', // disable nginx buffering if present
  });
  res.flushHeaders();

  // AbortController for cancellation
  const abortController = new AbortController();
  let aborted = false;

  req.on('close', () => {
    aborted = true;
    abortController.abort();
  });

  let fullAssistantText = '';
  let usage = null;

  try {
    const { stream } = await streamChat(session, {
      model: session.metadata.model || undefined,
      signal: abortController.signal,
    });

    await parseAnthropicStream(stream, (event) => {
      if (aborted) return;

      switch (event.type) {
        case 'message_start': {
          // Extract usage info if available
          if (event.data?.message?.usage) {
            usage = { input_tokens: event.data.message.usage.input_tokens };
          }
          break;
        }

        case 'content_block_start': {
          // For tool_use blocks, emit the tool info
          if (event.data?.content_block?.type === 'tool_use') {
            sseWrite(res, {
              type: 'tool_use_start',
              toolName: event.data.content_block.name,
              toolId: event.data.content_block.id,
            });
          }
          break;
        }

        case 'content_block_delta': {
          const delta = event.data?.delta;
          if (!delta) break;

          if (delta.type === 'text_delta' && delta.text) {
            fullAssistantText += delta.text;
            sseWrite(res, {
              type: 'text',
              content: delta.text,
            });
          } else if (delta.type === 'input_json_delta' && delta.partial_json) {
            sseWrite(res, {
              type: 'tool_input_delta',
              content: delta.partial_json,
            });
          }
          break;
        }

        case 'content_block_stop': {
          // Check if we have complete proposals in the accumulated text
          const proposals = extractProposals(fullAssistantText);
          for (const proposal of proposals) {
            sseWrite(res, {
              type: 'proposal',
              file: proposal.file || '',
              code: proposal.code || '',
              changes: proposal.changes || [],
              risks: proposal.risks || [],
              confidence: proposal.confidence || 0,
            });
          }
          break;
        }

        case 'message_delta': {
          // Final usage info
          if (event.data?.usage) {
            usage = {
              ...usage,
              output_tokens: event.data.usage.output_tokens,
            };
          }
          break;
        }

        case 'message_stop': {
          // Stream complete
          break;
        }

        case 'error': {
          console.error('[Conversation] Stream error event:', event.data);
          sseWrite(res, {
            type: 'error',
            message: event.data?.error?.message || 'Stream error from Anthropic',
          });
          break;
        }

        default:
          break;
      }
    }, abortController.signal);

    // Save the complete assistant message to the session
    if (fullAssistantText.length > 0) {
      sessionStore.addMessage(id, 'assistant', fullAssistantText);
    }

    // Emit done event
    if (!aborted) {
      sseWrite(res, {
        type: 'done',
        usage: usage || {},
      });
    }
  } catch (error) {
    if (aborted || error.name === 'AbortError') {
      // Client disconnected — silently end
      console.log(`[Conversation] Client disconnected from session ${id}`);
    } else {
      console.error('[Conversation] Stream error:', error.message);
      if (!res.writableEnded) {
        sseWrite(res, {
          type: 'error',
          message: error.message || 'Internal server error',
        });
      }
    }
  } finally {
    if (!res.writableEnded) {
      res.end();
    }
  }
});

// ═══ GET /api/conversation/:id — Get session history ═══

router.get('/:id', (req, res) => {
  const session = sessionStore.get(req.params.id);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  res.json({
    id: session.id,
    messages: session.messages,
    metadata: session.metadata,
    createdAt: session.createdAt,
  });
});

// ═══ GET /api/conversation — List sessions ═══

router.get('/', (req, res) => {
  res.json(sessionStore.list());
});

// ═══ DELETE /api/conversation/:id — Delete session ═══

router.delete('/:id', (req, res) => {
  const deleted = sessionStore.remove(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Session not found' });
  }
  res.json({ success: true });
});

export default router;
