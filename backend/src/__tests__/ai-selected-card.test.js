import { describe, it, expect, beforeEach, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import { createTestDb, fakeAuth, seedProject, seedUser } from './helpers.js';

describe('AI Selected Card', () => {
  let app;
  let db;
  let mockChatCompletion;

  const sampleNodes = [
    { id: 'activity-1', type: 'activity', position: { x: 0, y: 0 }, data: { title: 'User Onboarding', priority: 'must-have' } },
    { id: 'step-1-1', type: 'step', position: { x: 0, y: 200 }, data: { title: 'Sign Up', priority: 'must-have' } },
    { id: 'story-1-1-1', type: 'storyCard', position: { x: 0, y: 400 }, data: { title: 'Email Registration', priority: 'must-have' } },
    { id: 'story-1-1-2', type: 'storyCard', position: { x: 300, y: 400 }, data: { title: 'Social Login', priority: 'should-have' } },
  ];

  const sampleEdges = [
    { id: 'edge-activity-1-step-1-1', source: 'activity-1', target: 'step-1-1', type: 'default' },
    { id: 'edge-step-1-1-story-1-1-1', source: 'step-1-1', target: 'story-1-1-1', type: 'default' },
    { id: 'edge-step-1-1-story-1-1-2', source: 'step-1-1', target: 'story-1-1-2', type: 'default' },
  ];

  beforeEach(async () => {
    db = createTestDb();
    seedUser(db);
    seedProject(db);
    // Set up a fake API key for the user
    db.prepare("UPDATE users SET openrouter_api_key = 'encrypted-key' WHERE id = 'test-user'").run();

    vi.resetModules();
    vi.doMock('../db/database.js', () => ({ default: db }));

    mockChatCompletion = vi.fn().mockResolvedValue({
      operations: [{ type: 'update_node', id: 'story-1-1-1', changes: { data: { title: 'Updated' } } }]
    });
    vi.doMock('../ai/client.js', () => ({ chatCompletion: mockChatCompletion }));
    vi.doMock('../utils/encryption.js', () => ({ decrypt: (v) => v, encrypt: (v) => v }));

    const aiModule = await import('../routes/ai.js');
    app = express();
    app.use(express.json());
    app.use(fakeAuth());
    app.use('/api/ai', aiModule.default);
  });

  it('includes FOCUS block when selectedNodeId is provided', async () => {
    const res = await request(app)
      .post('/api/ai/generate')
      .send({
        prompt: 'Add acceptance criteria',
        model: 'anthropic/claude-4.6-sonnet-20260217',
        projectId: 'proj-1',
        existingNodes: sampleNodes,
        existingEdges: sampleEdges,
        selectedNodeId: 'story-1-1-1',
      });

    expect(res.status).toBe(200);
    expect(mockChatCompletion).toHaveBeenCalledTimes(1);

    const messages = mockChatCompletion.mock.calls[0][2];
    const userMessage = messages.find(m => m.role === 'user').content;
    expect(userMessage).toContain('FOCUS: The user has selected node "story-1-1-1"');
    expect(userMessage).toContain('(storyCard: "Email Registration")');
    expect(userMessage).toContain('Parent: [step-1-1]');
    expect(userMessage).not.toContain('USER REQUEST: Add acceptance criteria\n\nFOCUS');
  });

  it('includes children in FOCUS block', async () => {
    const res = await request(app)
      .post('/api/ai/generate')
      .send({
        prompt: 'Rename this step',
        model: 'anthropic/claude-4.6-sonnet-20260217',
        projectId: 'proj-1',
        existingNodes: sampleNodes,
        existingEdges: sampleEdges,
        selectedNodeId: 'step-1-1',
      });

    expect(res.status).toBe(200);

    const messages = mockChatCompletion.mock.calls[0][2];
    const userMessage = messages.find(m => m.role === 'user').content;
    expect(userMessage).toContain('FOCUS: The user has selected node "step-1-1"');
    expect(userMessage).toContain('Direct children: [story-1-1-1, story-1-1-2]');
    expect(userMessage).toContain('Parent: [activity-1]');
  });

  it('does not include FOCUS block when selectedNodeId is null', async () => {
    const res = await request(app)
      .post('/api/ai/generate')
      .send({
        prompt: 'Add a new activity',
        model: 'anthropic/claude-4.6-sonnet-20260217',
        projectId: 'proj-1',
        existingNodes: sampleNodes,
        existingEdges: sampleEdges,
        selectedNodeId: null,
      });

    expect(res.status).toBe(200);

    const messages = mockChatCompletion.mock.calls[0][2];
    const userMessage = messages.find(m => m.role === 'user').content;
    expect(userMessage).not.toContain('FOCUS:');
    expect(userMessage).toContain('USER REQUEST: Add a new activity');
  });

  it('does not include FOCUS block when selectedNodeId is undefined', async () => {
    const res = await request(app)
      .post('/api/ai/generate')
      .send({
        prompt: 'Add a new activity',
        model: 'anthropic/claude-4.6-sonnet-20260217',
        projectId: 'proj-1',
        existingNodes: sampleNodes,
        existingEdges: sampleEdges,
      });

    expect(res.status).toBe(200);

    const messages = mockChatCompletion.mock.calls[0][2];
    const userMessage = messages.find(m => m.role === 'user').content;
    expect(userMessage).not.toContain('FOCUS:');
    expect(userMessage).toContain('USER REQUEST: Add a new activity');
  });

  it('falls back to normal edit when selectedNodeId not found in nodes', async () => {
    const res = await request(app)
      .post('/api/ai/generate')
      .send({
        prompt: 'Do something',
        model: 'anthropic/claude-4.6-sonnet-20260217',
        projectId: 'proj-1',
        existingNodes: sampleNodes,
        existingEdges: sampleEdges,
        selectedNodeId: 'nonexistent-node',
      });

    expect(res.status).toBe(200);

    const messages = mockChatCompletion.mock.calls[0][2];
    const userMessage = messages.find(m => m.role === 'user').content;
    expect(userMessage).not.toContain('FOCUS:');
    expect(userMessage).toContain('USER REQUEST: Do something');
  });

  it('shows parent as none for root activity node', async () => {
    const res = await request(app)
      .post('/api/ai/generate')
      .send({
        prompt: 'Edit this activity',
        model: 'anthropic/claude-4.6-sonnet-20260217',
        projectId: 'proj-1',
        existingNodes: sampleNodes,
        existingEdges: sampleEdges,
        selectedNodeId: 'activity-1',
      });

    expect(res.status).toBe(200);

    const messages = mockChatCompletion.mock.calls[0][2];
    const userMessage = messages.find(m => m.role === 'user').content;
    expect(userMessage).toContain('Parent: [none]');
    expect(userMessage).toContain('Direct children: [step-1-1]');
  });
});
