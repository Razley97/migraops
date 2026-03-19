import { describe, it, expect } from 'vitest';
import { AGENTS, getAgentForPhase, getAgentById } from '../data/agents.js';

describe('Agent Registry', function() {

  it('should have at least 4 core agents', function() {
    var ids = Object.keys(AGENTS);
    expect(ids.length).toBeGreaterThanOrEqual(4);
    expect(ids).toContain('architect');
    expect(ids).toContain('developer');
    expect(ids).toContain('qa');
    expect(ids).toContain('security');
  });

  it('each agent should have required properties', function() {
    Object.values(AGENTS).forEach(function(agent) {
      expect(agent.id).toBeTruthy();
      expect(agent.name).toBeTruthy();
      expect(agent.icon).toBeTruthy();
      expect(agent.color).toMatch(/^#/);
      expect(agent.systemPrefix).toBeTruthy();
      expect(agent.systemPrefix.length).toBeGreaterThan(50);
      expect(Array.isArray(agent.phases)).toBe(true);
      expect(agent.phases.length).toBeGreaterThan(0);
    });
  });

  it('getAgentForPhase returns architect for codebaseAnalysis', function() {
    var agent = getAgentForPhase('codebaseAnalysis');
    expect(agent).not.toBeNull();
    expect(agent.id).toBe('architect');
  });

  it('getAgentForPhase returns developer for migrate', function() {
    var agent = getAgentForPhase('migrate');
    expect(agent).not.toBeNull();
    expect(agent.id).toBe('developer');
  });

  it('getAgentForPhase returns qa for integrationCheck', function() {
    var agent = getAgentForPhase('integrationCheck');
    expect(agent).not.toBeNull();
    expect(agent.id).toBe('qa');
  });

  it('getAgentForPhase returns null for unknown phase', function() {
    var agent = getAgentForPhase('unknownPhase');
    expect(agent).toBeNull();
  });

  it('getAgentById returns correct agent', function() {
    var agent = getAgentById('security');
    expect(agent).not.toBeNull();
    expect(agent.id).toBe('security');
    expect(agent.name).toBe('Security Agent');
  });

  it('getAgentById returns null for unknown id', function() {
    var agent = getAgentById('nonexistent');
    expect(agent).toBeNull();
  });

  it('no two agents share the same phase', function() {
    var allPhases = [];
    Object.values(AGENTS).forEach(function(agent) {
      agent.phases.forEach(function(phase) {
        expect(allPhases).not.toContain(phase);
        allPhases.push(phase);
      });
    });
  });
});
