import { describe, it, expect } from 'vitest';
import { buildLayout } from '../utils/layout.js';
import type { ActivityInput } from '../utils/schemas.js';

describe('buildLayout', () => {
  it('single activity produces correct node and no edges', () => {
    const input: ActivityInput[] = [{ title: 'Browse Products' }];
    const { nodes, edges } = buildLayout(input);

    expect(nodes).toHaveLength(1);
    expect(nodes[0].id).toBe('activity-1');
    expect(nodes[0].type).toBe('activity');
    expect(nodes[0].position.y).toBe(0);
    expect(nodes[0].data.title).toBe('Browse Products');
    expect(edges).toHaveLength(0);
  });

  it('activity with steps creates edges and correct positions', () => {
    const input: ActivityInput[] = [{
      title: 'Shopping',
      steps: [
        { title: 'Search' },
        { title: 'Filter' },
      ],
    }];
    const { nodes, edges } = buildLayout(input);

    // 1 activity + 2 steps = 3 nodes
    expect(nodes).toHaveLength(3);

    // Steps at y=200
    const steps = nodes.filter(n => n.type === 'step');
    expect(steps).toHaveLength(2);
    steps.forEach(s => expect(s.position.y).toBe(200));

    // 2 edges: activity→step1, activity→step2
    expect(edges).toHaveLength(2);
    expect(edges[0].source).toBe('activity-1');
    expect(edges[0].target).toBe('step-1-1');
  });

  it('activity centered over its steps', () => {
    const input: ActivityInput[] = [{
      title: 'Activity',
      steps: [{ title: 'Step 1' }, { title: 'Step 2' }, { title: 'Step 3' }],
    }];
    const { nodes } = buildLayout(input);

    const activity = nodes.find(n => n.id === 'activity-1')!;
    const steps = nodes.filter(n => n.type === 'step');

    // Activity should be at center x of its steps
    const stepXs = steps.map(s => s.position.x);
    const centerX = (Math.min(...stepXs) + Math.max(...stepXs)) / 2;
    expect(activity.position.x).toBe(centerX);
  });

  it('story Y positions match priority map', () => {
    const input: ActivityInput[] = [{
      title: 'Act',
      steps: [{
        title: 'Step',
        stories: [
          { title: 'Must', priority: 'must-have' },
          { title: 'Should', priority: 'should-have' },
          { title: 'Could', priority: 'could-have' },
          { title: 'Wont', priority: 'wont-have' },
        ],
      }],
    }];
    const { nodes } = buildLayout(input);

    const stories = nodes.filter(n => n.type === 'storyCard');
    expect(stories.find(s => s.data.title === 'Must')!.position.y).toBe(400);
    expect(stories.find(s => s.data.title === 'Should')!.position.y).toBe(600);
    expect(stories.find(s => s.data.title === 'Could')!.position.y).toBe(800);
    expect(stories.find(s => s.data.title === 'Wont')!.position.y).toBe(1000);
  });

  it('multiple stories same priority get offset X', () => {
    const input: ActivityInput[] = [{
      title: 'Act',
      steps: [{
        title: 'Step',
        stories: [
          { title: 'Story 1', priority: 'must-have' },
          { title: 'Story 2', priority: 'must-have' },
        ],
      }],
    }];
    const { nodes } = buildLayout(input);

    const stories = nodes.filter(n => n.type === 'storyCard');
    expect(stories).toHaveLength(2);
    // Second story should be offset by H_SPACING (300)
    expect(stories[1].position.x - stories[0].position.x).toBe(300);
  });

  it('empty input returns empty output', () => {
    const { nodes, edges } = buildLayout([]);
    expect(nodes).toHaveLength(0);
    expect(edges).toHaveLength(0);
  });

  it('edge IDs follow convention', () => {
    const input: ActivityInput[] = [{
      title: 'Act',
      steps: [{ title: 'Step', stories: [{ title: 'Story' }] }],
    }];
    const { edges } = buildLayout(input);

    expect(edges[0].id).toBe('edge-activity-1-step-1-1');
    expect(edges[1].id).toBe('edge-step-1-1-story-1-1-1');
  });

  it('stories include estimate and status when provided', () => {
    const input: ActivityInput[] = [{
      title: 'Act',
      steps: [{
        title: 'Step',
        stories: [{ title: 'Story', estimate: '5 pts', status: 'in-progress' }],
      }],
    }];
    const { nodes } = buildLayout(input);

    const story = nodes.find(n => n.type === 'storyCard')!;
    expect(story.data.estimate).toBe('5 pts');
    expect(story.data.status).toBe('in-progress');
  });
});
