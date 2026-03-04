import type { Node, Edge } from '@xyflow/react';
import type { StoryCardData, Priority } from '../types';

/**
 * Export visible canvas nodes to a structured Markdown document.
 * Respects the hiddenPriorities filter — hidden story cards are excluded.
 */
export function exportToMarkdown(
  nodes: Node<StoryCardData>[],
  edges: Edge[],
  hiddenPriorities: Set<Priority>,
  projectName?: string
): string {
  // Filter out hidden story cards
  const visibleNodes = nodes.filter((n) => {
    if (n.data.cardType !== 'story') return true;
    return !hiddenPriorities.has(n.data.priority);
  });
  const visibleIds = new Set(visibleNodes.map((n) => n.id));
  const visibleEdges = edges.filter(
    (e) => visibleIds.has(e.source) && visibleIds.has(e.target)
  );

  // Index nodes by type
  const activities = visibleNodes.filter((n) => n.data.cardType === 'activity');
  const steps = visibleNodes.filter((n) => n.data.cardType === 'step');
  const stories = visibleNodes.filter((n) => n.data.cardType === 'story');
  const annotations = visibleNodes.filter((n) => n.data.cardType === 'annotation');

  // Build parent→children maps from edges
  const childrenOf = new Map<string, string[]>();
  for (const edge of visibleEdges) {
    const list = childrenOf.get(edge.source) ?? [];
    list.push(edge.target);
    childrenOf.set(edge.source, list);
  }

  // Track which nodes are placed in the tree
  const placed = new Set<string>();

  const lines: string[] = [];

  // Header
  if (projectName) {
    lines.push(`# ${projectName}`);
  } else {
    lines.push('# User Story Map');
  }
  lines.push('');

  // Show which priorities are included
  const visiblePriorities = (['must-have', 'should-have', 'could-have', 'wont-have'] as Priority[])
    .filter((p) => !hiddenPriorities.has(p));
  if (hiddenPriorities.size > 0) {
    lines.push(`> Showing priorities: ${visiblePriorities.join(', ')}`);
    lines.push('');
  }

  // Sort activities by x position (left to right)
  activities.sort((a, b) => a.position.x - b.position.x);

  for (const activity of activities) {
    placed.add(activity.id);
    lines.push(`## ${activity.data.title}`);
    if (activity.data.description) {
      lines.push('');
      lines.push(activity.data.description);
    }
    lines.push('');

    // Get steps under this activity
    const stepIds = childrenOf.get(activity.id) ?? [];
    const activitySteps = stepIds
      .map((id) => steps.find((s) => s.id === id))
      .filter(Boolean) as Node<StoryCardData>[];
    activitySteps.sort((a, b) => a.position.x - b.position.x);

    for (const step of activitySteps) {
      placed.add(step.id);
      lines.push(`### ${step.data.title}`);
      if (step.data.description) {
        lines.push('');
        lines.push(step.data.description);
      }
      lines.push('');

      // Get stories under this step
      const storyIds = childrenOf.get(step.id) ?? [];
      const stepStories = storyIds
        .map((id) => stories.find((s) => s.id === id))
        .filter(Boolean) as Node<StoryCardData>[];
      // Sort by priority order, then by x position
      const priorityOrder: Record<Priority, number> = {
        'must-have': 0,
        'should-have': 1,
        'could-have': 2,
        'wont-have': 3,
      };
      stepStories.sort(
        (a, b) =>
          priorityOrder[a.data.priority] - priorityOrder[b.data.priority] ||
          a.position.x - b.position.x
      );

      for (const story of stepStories) {
        placed.add(story.id);
        renderStory(lines, story);
      }
    }
  }

  // Orphaned steps (not connected to any activity)
  const orphanedSteps = steps.filter((s) => !placed.has(s.id));
  if (orphanedSteps.length > 0) {
    lines.push('## Unlinked Steps');
    lines.push('');
    for (const step of orphanedSteps) {
      placed.add(step.id);
      lines.push(`### ${step.data.title}`);
      if (step.data.description) {
        lines.push('');
        lines.push(step.data.description);
      }
      lines.push('');

      const storyIds = childrenOf.get(step.id) ?? [];
      const stepStories = storyIds
        .map((id) => stories.find((s) => s.id === id))
        .filter(Boolean) as Node<StoryCardData>[];
      for (const story of stepStories) {
        placed.add(story.id);
        renderStory(lines, story);
      }
    }
  }

  // Orphaned stories (not connected to any step)
  const orphanedStories = stories.filter((s) => !placed.has(s.id));
  if (orphanedStories.length > 0) {
    lines.push('## Unlinked Stories');
    lines.push('');
    for (const story of orphanedStories) {
      renderStory(lines, story);
    }
  }

  // Annotations
  if (annotations.length > 0) {
    lines.push('---');
    lines.push('');
    lines.push('## Notes');
    lines.push('');
    for (const ann of annotations) {
      lines.push(`- **${ann.data.title}**${ann.data.description ? ': ' + ann.data.description : ''}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

function renderStory(lines: string[], story: Node<StoryCardData>) {
  const meta: string[] = [];
  meta.push(story.data.priority);
  if (story.data.estimate) meta.push(story.data.estimate);

  lines.push(`#### ${story.data.title} [${meta.join(' | ')}]`);

  if (story.data.description) {
    lines.push('');
    lines.push(story.data.description);
  }

  if (story.data.acceptanceCriteria && story.data.acceptanceCriteria.length > 0) {
    lines.push('');
    lines.push('**Acceptance Criteria:**');
    for (const ac of story.data.acceptanceCriteria) {
      lines.push(`- ${ac}`);
    }
  }

  if (story.data.tags && story.data.tags.length > 0) {
    lines.push('');
    lines.push(`*Tags: ${story.data.tags.join(', ')}*`);
  }

  lines.push('');
}
