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
});
