import { describe, it, expect } from 'vitest';
import { exportToMarkdown } from '../utils/exportToMarkdown';
import type { Node, Edge } from '@xyflow/react';
import type { StoryCardData, Priority } from '../types';

function makeNode(
  id: string,
  cardType: StoryCardData['cardType'],
  title: string,
  x = 0,
  y = 0,
  extra: Partial<StoryCardData> = {}
): Node<StoryCardData> {
  return {
    id,
    type: cardType === 'activity' ? 'activity' : cardType === 'step' ? 'step' : cardType === 'annotation' ? 'annotation' : 'storyCard',
    position: { x, y },
    data: {
      title,
      description: '',
      acceptanceCriteria: [],
      cardType,
      priority: 'must-have' as Priority,
      ...extra,
    },
  };
}

function makeEdge(source: string, target: string): Edge {
  return { id: `edge-${source}-${target}`, source, target };
}

describe('exportToMarkdown', () => {
  it('produces hierarchical output', () => {
    const nodes = [
      makeNode('a1', 'activity', 'User Login', 0, 0),
      makeNode('s1', 'step', 'Enter Credentials', 0, 200),
      makeNode('st1', 'story', 'Login Form', 0, 400),
    ];
    const edges = [makeEdge('a1', 's1'), makeEdge('s1', 'st1')];

    const md = exportToMarkdown(nodes, edges, new Set());
    expect(md).toContain('## User Login');
    expect(md).toContain('### Enter Credentials');
    expect(md).toContain('#### Login Form');
  });

  it('uses project name as header', () => {
    const md = exportToMarkdown([], [], new Set(), 'My Project');
    expect(md).toContain('# My Project');
  });

  it('defaults to User Story Map header', () => {
    const md = exportToMarkdown([], [], new Set());
    expect(md).toContain('# User Story Map');
  });

  it('filters hidden priorities', () => {
    const nodes = [
      makeNode('a1', 'activity', 'Activity', 0, 0),
      makeNode('s1', 'step', 'Step', 0, 200),
      makeNode('st1', 'story', 'Must Have', 0, 400, { priority: 'must-have' }),
      makeNode('st2', 'story', 'Could Have', 0, 800, { priority: 'could-have' }),
    ];
    const edges = [makeEdge('a1', 's1'), makeEdge('s1', 'st1'), makeEdge('s1', 'st2')];

    const md = exportToMarkdown(nodes, edges, new Set(['could-have'] as Priority[]));
    expect(md).toContain('Must Have');
    expect(md).not.toContain('Could Have');
    expect(md).toContain('Showing priorities');
  });

  it('includes story metadata', () => {
    const nodes = [
      makeNode('st1', 'story', 'A Story', 0, 400, {
        priority: 'should-have',
        estimate: '5 pts',
      }),
    ];
    const md = exportToMarkdown(nodes, [], new Set());
    expect(md).toContain('[should-have | 5 pts]');
  });

  it('renders acceptance criteria as bullet list', () => {
    const nodes = [
      makeNode('st1', 'story', 'Story', 0, 400, {
        acceptanceCriteria: ['Given X', 'When Y', 'Then Z'],
      }),
    ];
    const md = exportToMarkdown(nodes, [], new Set());
    expect(md).toContain('**Acceptance Criteria:**');
    expect(md).toContain('- Given X');
    expect(md).toContain('- When Y');
  });

  it('renders annotations under Notes section', () => {
    const nodes = [
      makeNode('ann1', 'annotation', 'Important Note', 0, 0, { description: 'Details here' }),
    ];
    const md = exportToMarkdown(nodes, [], new Set());
    expect(md).toContain('## Notes');
    expect(md).toContain('**Important Note**');
    expect(md).toContain('Details here');
  });

  it('renders orphaned steps under Unlinked Steps', () => {
    const nodes = [
      makeNode('s1', 'step', 'Orphan Step', 0, 200),
    ];
    const md = exportToMarkdown(nodes, [], new Set());
    expect(md).toContain('## Unlinked Steps');
    expect(md).toContain('### Orphan Step');
  });

  it('renders unresolved non-system comments under stories', () => {
    const nodes = [
      makeNode('st1', 'story', 'Login Form', 0, 400),
    ];
    const comments = {
      'st1': [
        {
          id: 'c1', project_id: 'p1', node_id: 'st1', user_id: 'u1',
          content: 'Should we add remember-me?',
          is_system_message: false, resolved_at: null,
          created_at: '2024-01-15T10:00:00Z',
          user_name: 'Alice', user_picture: '',
        },
        {
          id: 'c2', project_id: 'p1', node_id: 'st1', user_id: 'u2',
          content: 'Yes, adding to AC',
          is_system_message: false, resolved_at: null,
          created_at: '2024-01-15T11:00:00Z',
          user_name: 'Bob', user_picture: '',
        },
      ],
    };

    const md = exportToMarkdown(nodes, [], new Set(), undefined, comments);
    expect(md).toContain('**Comments:**');
    expect(md).toContain('**Alice** (2024-01-15): Should we add remember-me?');
    expect(md).toContain('**Bob** (2024-01-15): Yes, adding to AC');
  });

  it('excludes system messages and resolved comments from markdown', () => {
    const nodes = [
      makeNode('st1', 'story', 'Story', 0, 400),
    ];
    const comments = {
      'st1': [
        {
          id: 'c1', project_id: 'p1', node_id: 'st1', user_id: 'u1',
          content: 'System message',
          is_system_message: true, resolved_at: null,
          created_at: '2024-01-15T10:00:00Z',
          user_name: 'System', user_picture: '',
        },
        {
          id: 'c2', project_id: 'p1', node_id: 'st1', user_id: 'u1',
          content: 'Resolved comment',
          is_system_message: false, resolved_at: '2024-01-16T10:00:00Z',
          created_at: '2024-01-15T10:00:00Z',
          user_name: 'Alice', user_picture: '',
        },
      ],
    };

    const md = exportToMarkdown(nodes, [], new Set(), undefined, comments);
    expect(md).not.toContain('**Comments:**');
    expect(md).not.toContain('System message');
    expect(md).not.toContain('Resolved comment');
  });

  it('no comments parameter still works (backward compat)', () => {
    const nodes = [
      makeNode('st1', 'story', 'Story', 0, 400),
    ];
    const md = exportToMarkdown(nodes, [], new Set());
    expect(md).toContain('#### Story');
    expect(md).not.toContain('**Comments:**');
  });

  it('empty comments map produces no Comments sections', () => {
    const nodes = [
      makeNode('st1', 'story', 'Story', 0, 400),
    ];
    const md = exportToMarkdown(nodes, [], new Set(), undefined, {});
    expect(md).not.toContain('**Comments:**');
  });

  it('renders comments on activities and steps', () => {
    const nodes = [
      makeNode('a1', 'activity', 'Login', 0, 0),
      makeNode('s1', 'step', 'Auth Flow', 0, 200),
      makeNode('st1', 'story', 'Login Form', 0, 400),
    ];
    const edges = [makeEdge('a1', 's1'), makeEdge('s1', 'st1')];
    const comments = {
      'a1': [
        {
          id: 'c1', project_id: 'p1', node_id: 'a1', user_id: 'u1',
          content: 'Activity comment',
          is_system_message: false, resolved_at: null,
          created_at: '2024-01-15 10:00:00',
          user_name: 'Alice', user_picture: '',
        },
      ],
      's1': [
        {
          id: 'c2', project_id: 'p1', node_id: 's1', user_id: 'u1',
          content: 'Step comment',
          is_system_message: false, resolved_at: null,
          created_at: '2024-01-15 11:00:00',
          user_name: 'Bob', user_picture: '',
        },
      ],
    };

    const md = exportToMarkdown(nodes, edges, new Set(), undefined, comments);
    expect(md).toContain('**Alice** (2024-01-15): Activity comment');
    expect(md).toContain('**Bob** (2024-01-15): Step comment');
  });

  it('handles SQLite date format without T separator', () => {
    const nodes = [
      makeNode('st1', 'story', 'Story', 0, 400),
    ];
    const comments = {
      'st1': [
        {
          id: 'c1', project_id: 'p1', node_id: 'st1', user_id: 'u1',
          content: 'Test',
          is_system_message: false, resolved_at: null,
          created_at: '2024-01-15 10:00:00',
          user_name: 'Alice', user_picture: '',
        },
      ],
    };

    const md = exportToMarkdown(nodes, [], new Set(), undefined, comments);
    expect(md).toContain('**Alice** (2024-01-15): Test');
  });
});
