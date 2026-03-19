import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock callClaude before importing agentClient
vi.mock('../services/claudeClient.js', function() {
  return {
    callClaude: vi.fn(function(sys) {
      return Promise.resolve('mocked response for: ' + sys.substring(0, 50));
    })
  };
});

import { callAgent, callAgentById, callAgentChain } from '../services/agentClient.js';
import { callClaude } from '../services/claudeClient.js';

beforeEach(function() {
  vi.clearAllMocks();
});

describe('callAgent', function() {

  it('prepends agent persona for known phase', async function() {
    await callAgent('codebaseAnalysis', 'Analyze this code', 'user msg', 'model', 4000);

    expect(callClaude).toHaveBeenCalledTimes(1);
    var calledSys = callClaude.mock.calls[0][0];
    expect(calledSys).toContain('ARCHITECT agent');
    expect(calledSys).toContain('Analyze this code');
    expect(calledSys).toContain('QUALITY RULES');
  });

  it('passes system unchanged for unknown phase', async function() {
    await callAgent('unknownPhase', 'Original system', 'user msg', 'model', 4000);

    var calledSys = callClaude.mock.calls[0][0];
    expect(calledSys).toContain('Original system');
    expect(calledSys).toContain('QUALITY RULES');
    expect(calledSys).not.toContain('ARCHITECT');
  });

  it('passes null phase without error', async function() {
    await callAgent(null, 'System prompt', 'user msg', 'model', 4000);

    var calledSys = callClaude.mock.calls[0][0];
    expect(calledSys).toContain('System prompt');
  });

  it('passes all remaining args to callClaude', async function() {
    var opts = { timeout: 60000 };
    await callAgent('migrate', 'sys', 'usr', 'my-model', 8000, opts);

    expect(callClaude).toHaveBeenCalledWith(
      expect.stringContaining('DEVELOPER agent'),
      'usr',
      'my-model',
      8000,
      opts
    );
  });
});

describe('callAgentById', function() {

  it('prepends security agent persona by ID', async function() {
    await callAgentById('security', 'Review code', 'user msg', 'model', 3000);

    var calledSys = callClaude.mock.calls[0][0];
    expect(calledSys).toContain('SECURITY agent');
    expect(calledSys).toContain('Review code');
  });

  it('handles null agentId gracefully', async function() {
    await callAgentById(null, 'System', 'user', 'model', 3000);

    var calledSys = callClaude.mock.calls[0][0];
    expect(calledSys).not.toContain('agent of MigraOps');
  });
});

describe('callAgentChain', function() {

  it('executes steps sequentially', async function() {
    var callOrder = [];
    callClaude.mockImplementation(function(sys) {
      callOrder.push(sys.includes('ARCHITECT') ? 'architect' : sys.includes('SECURITY') ? 'security' : 'unknown');
      return Promise.resolve('step output');
    });

    await callAgentChain([
      { agentId: 'architect', sys: 'Analyze', usr: 'code', mid: 'm', mt: 4000 },
      { agentId: 'security', sys: 'Review', usr: 'review', mid: 'm', mt: 3000 }
    ]);

    expect(callOrder).toEqual(['architect', 'security']);
    expect(callClaude).toHaveBeenCalledTimes(2);
  });

  it('passes previous output to next step', async function() {
    callClaude
      .mockResolvedValueOnce('architect analysis result')
      .mockResolvedValueOnce('security review result');

    await callAgentChain([
      { agentId: 'architect', sys: 'Analyze', usr: 'code', mid: 'm', mt: 4000 },
      { agentId: 'security', sys: 'Review', usr: 'review', mid: 'm', mt: 3000 }
    ]);

    var secondCallSys = callClaude.mock.calls[1][0];
    expect(secondCallSys).toContain('PREVIOUS AGENT OUTPUT');
    expect(secondCallSys).toContain('architect analysis result');
  });

  it('calls onAgentChange callback', async function() {
    var changes = [];
    callClaude.mockResolvedValue('output');

    await callAgentChain([
      { agentId: 'architect', sys: 'S', usr: 'U', mid: 'm', mt: 4000 },
      { agentId: 'security', sys: 'S', usr: 'U', mid: 'm', mt: 3000 }
    ], function(agentId, step, total) {
      changes.push({ agentId: agentId, step: step, total: total });
    });

    expect(changes).toEqual([
      { agentId: 'architect', step: 0, total: 2 },
      { agentId: 'security', step: 1, total: 2 }
    ]);
  });

  it('returns final step output', async function() {
    callClaude
      .mockResolvedValueOnce('first')
      .mockResolvedValueOnce('final result');

    var result = await callAgentChain([
      { agentId: 'architect', sys: 'S', usr: 'U', mid: 'm', mt: 4000 },
      { agentId: 'security', sys: 'S', usr: 'U', mid: 'm', mt: 3000 }
    ]);

    expect(result).toBe('final result');
  });
});
