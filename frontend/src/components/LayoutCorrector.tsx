import { useEffect, useRef } from 'react';
import { useStore, type ReactFlowState, type InternalNode } from '@xyflow/react';
import { useMapStore } from '../store/useMapStore';
import type { StoryCardData, Priority } from '../types';
import type { Node, Edge } from '@xyflow/react';

const HORIZONTAL_SPACING = 300;
const ROW_GAP = 40;
const STORY_GAP = 20;
const PRIORITY_GROUP_GAP = 35;

const PRIORITY_ORDER: Priority[] = ['must-have', 'should-have', 'could-have', 'wont-have'];

const nodeLookupSelector = (s: ReactFlowState) => s.nodeLookup;

function estimateHeight(data: StoryCardData): number {
  const { showDescriptions, showAcceptanceCriteria } = useMapStore.getState();
  let h = 50;
  if (showDescriptions && data.description) {
    h += Math.ceil(data.description.length / 35) * 14;
  }
  if (showAcceptanceCriteria && data.acceptanceCriteria?.length) {
    h += 18 + data.acceptanceCriteria.length * 14;
  }
  return Math.max(h, 60);
}

function getMeasuredHeight(
  nodeId: string,
  nodes: Node<StoryCardData>[],
  lookup: Map<string, InternalNode>,
): number {
  const entry = lookup.get(nodeId);
  if (entry?.measured?.height) return entry.measured.height;
  const node = nodes.find((n) => n.id === nodeId);
  if (node) return estimateHeight(node.data as StoryCardData);
  return 80;
}

/** Fix only story card y-overlap after AI generation (keeps x positions) */
function correctOverlap(
  nodes: Node<StoryCardData>[],
  lookup: Map<string, InternalNode>,
) {
  const storyNodes = nodes.filter(
    (n) => n.type === 'storyCard' && (n.data as StoryCardData).cardType === 'story',
  );
  if (storyNodes.length === 0) return;

  // Group stories by column (x-position)
  const columnMap = new Map<number, typeof storyNodes>();
  for (const node of storyNodes) {
    const colKey = Math.round(node.position.x / 10) * 10;
    if (!columnMap.has(colKey)) columnMap.set(colKey, []);
    columnMap.get(colKey)!.push(node);
  }

  const corrections = new Map<string, number>();
  let previousBandBottom = 0;
  const PRIORITY_BASE_Y: Record<Priority, number> = {
    'must-have': 400,
    'should-have': 600,
    'could-have': 800,
    'wont-have': 1000,
  };

  for (const priority of PRIORITY_ORDER) {
    const baseY = PRIORITY_BASE_Y[priority];
    const bandStartY = Math.max(baseY, previousBandBottom + PRIORITY_GROUP_GAP);
    let bandBottom = bandStartY;

    for (const [, columnNodes] of columnMap) {
      const priorityNodes = columnNodes.filter(
        (n) => (n.data as StoryCardData).priority === priority,
      );
      if (priorityNodes.length === 0) continue;
      priorityNodes.sort((a, b) => a.position.y - b.position.y);

      let currentY = bandStartY;
      for (const node of priorityNodes) {
        corrections.set(node.id, currentY);
        currentY += getMeasuredHeight(node.id, nodes, lookup) + STORY_GAP;
      }
      bandBottom = Math.max(bandBottom, currentY - STORY_GAP);
    }
    previousBandBottom = bandBottom;
  }

  let hasChanges = false;
  for (const [id, newY] of corrections) {
    const node = storyNodes.find((n) => n.id === id);
    if (node && Math.abs(node.position.y - newY) > 1) {
      hasChanges = true;
      break;
    }
  }
  if (!hasChanges) return;

  const updatedNodes = nodes.map((n) => {
    const newY = corrections.get(n.id);
    if (newY !== undefined) {
      return { ...n, position: { ...n.position, y: newY } };
    }
    return n;
  });
  useMapStore.setState({ nodes: updatedNodes, isDirty: true });
}

/** Full grid layout: rebuild all positions using measured heights */
function fullArrange(
  nodes: Node<StoryCardData>[],
  edges: Edge[],
  lookup: Map<string, InternalNode>,
) {
  console.log('[fullArrange] start, nodes:', nodes.length, 'edges:', edges.length);
  if (nodes.length === 0) return;

  const getH = (id: string) => getMeasuredHeight(id, nodes, lookup);

  // Build parent→children map from edges
  const childrenOf = new Map<string, string[]>();
  for (const edge of edges) {
    if (!childrenOf.has(edge.source)) childrenOf.set(edge.source, []);
    childrenOf.get(edge.source)!.push(edge.target);
  }

  const activities = nodes.filter((n) => n.type === 'activity');
  const steps = nodes.filter((n) => n.type === 'step');
  const stories = nodes.filter((n) => n.type === 'storyCard');

  console.log('[fullArrange] activities:', activities.length, 'steps:', steps.length, 'stories:', stories.length);
  console.log('[fullArrange] childrenOf:', Object.fromEntries(childrenOf));

  activities.sort((a, b) => a.position.x - b.position.x);

  // Each step becomes a column. Track column data for story placement.
  interface Column {
    x: number;
    stories: Node<StoryCardData>[];
  }
  const columns: Column[] = [];
  const positions = new Map<string, { x: number; y: number }>();
  const assignedSteps = new Set<string>();
  const assignedStories = new Set<string>();

  for (const activity of activities) {
    const actStepIds = (childrenOf.get(activity.id) || []).filter((id) =>
      steps.some((s) => s.id === id),
    );
    const actSteps = actStepIds
      .map((id) => steps.find((s) => s.id === id)!)
      .sort((a, b) => a.position.x - b.position.x);

    if (actSteps.length === 0) {
      const x = columns.length * HORIZONTAL_SPACING;
      positions.set(activity.id, { x, y: 0 });
      columns.push({ x, stories: [] });
    } else {
      const startIdx = columns.length;
      for (const step of actSteps) {
        assignedSteps.add(step.id);
        const x = columns.length * HORIZONTAL_SPACING;
        positions.set(step.id, { x, y: 0 }); // y placeholder

        const stepStoryIds = (childrenOf.get(step.id) || []).filter((id) =>
          stories.some((s) => s.id === id),
        );
        const colStories = stepStoryIds.map((id) => {
          const s = stories.find((st) => st.id === id)!;
          assignedStories.add(s.id);
          return s;
        });
        columns.push({ x, stories: colStories });
      }
      const endIdx = columns.length - 1;
      const centerX = (columns[startIdx].x + columns[endIdx].x) / 2;
      positions.set(activity.id, { x: centerX, y: 0 });
    }
  }

  // Orphan steps
  for (const step of steps) {
    if (assignedSteps.has(step.id)) continue;
    const x = columns.length * HORIZONTAL_SPACING;
    positions.set(step.id, { x, y: 0 });
    const stepStoryIds = (childrenOf.get(step.id) || []).filter((id) =>
      stories.some((s) => s.id === id),
    );
    const colStories = stepStoryIds.map((id) => {
      const s = stories.find((st) => st.id === id)!;
      assignedStories.add(s.id);
      return s;
    });
    columns.push({ x, stories: colStories });
  }

  // Orphan stories
  for (const story of stories) {
    if (assignedStories.has(story.id)) continue;
    const x = columns.length * HORIZONTAL_SPACING;
    columns.push({ x, stories: [story] });
  }

  // --- Compute y positions row by row using measured heights ---

  // Row 0: Activities
  const activityY = 0;
  let maxActivityBottom = 0;
  for (const act of activities) {
    const pos = positions.get(act.id)!;
    positions.set(act.id, { x: pos.x, y: activityY });
    maxActivityBottom = Math.max(maxActivityBottom, activityY + getH(act.id));
  }

  // Row 1: Steps
  const stepY = activities.length > 0 ? maxActivityBottom + ROW_GAP : 0;
  let maxStepBottom = stepY;
  for (const step of steps) {
    const pos = positions.get(step.id);
    if (pos) {
      positions.set(step.id, { x: pos.x, y: stepY });
      maxStepBottom = Math.max(maxStepBottom, stepY + getH(step.id));
    }
  }

  // Row 2+: Stories, stacked per column sorted by priority
  const storyStartY = steps.length > 0
    ? maxStepBottom + ROW_GAP
    : activities.length > 0
      ? maxActivityBottom + ROW_GAP
      : 0;

  // Process priority bands across all columns simultaneously so bands stay aligned
  let bandTopY = storyStartY;

  for (const priority of PRIORITY_ORDER) {
    let bandHasStories = false;
    let bandBottomY = bandTopY;

    for (const col of columns) {
      const prioStories = col.stories.filter(
        (s) => (s.data as StoryCardData).priority === priority,
      );
      if (prioStories.length === 0) continue;
      bandHasStories = true;

      // Sort by original y to keep relative order
      prioStories.sort((a, b) => a.position.y - b.position.y);

      let y = bandTopY;
      for (const story of prioStories) {
        positions.set(story.id, { x: col.x, y });
        y += getH(story.id) + STORY_GAP;
      }
      bandBottomY = Math.max(bandBottomY, y - STORY_GAP);
    }

    if (bandHasStories) {
      bandTopY = bandBottomY + PRIORITY_GROUP_GAP;
    }
  }

  console.log('[fullArrange] computed positions:');
  for (const [id, pos] of positions) {
    console.log(`  ${id} -> x:${pos.x} y:${pos.y}`);
  }

  // Apply all positions (annotations untouched)
  const updatedNodes = nodes.map((n) => {
    const pos = positions.get(n.id);
    return pos ? { ...n, position: pos } : n;
  });
  console.log('[fullArrange] applying', positions.size, 'position updates');
  useMapStore.setState({ nodes: updatedNodes, isDirty: true });
}

/**
 * Invisible component mounted inside <ReactFlow> that handles layout
 * corrections using measured DOM heights from React Flow's nodeLookup.
 */
export function LayoutCorrector() {
  const pendingLayout = useMapStore((s) => s.pendingLayout);
  const setPendingLayout = useMapStore((s) => s.setPendingLayout);
  const nodeLookup = useStore(nodeLookupSelector);
  const nodeLookupRef = useRef(nodeLookup);
  nodeLookupRef.current = nodeLookup;
  const actionRef = useRef<string | null>(null);

  // Capture the action in a ref, then clear the store flag
  if (pendingLayout !== 'none' && actionRef.current === null) {
    actionRef.current = pendingLayout;
    console.log('[LayoutCorrector] captured action:', pendingLayout);
    setPendingLayout('none');
  }

  useEffect(() => {
    const action = actionRef.current;
    if (!action) return;
    actionRef.current = null;

    console.log('[LayoutCorrector] scheduling', action, 'with 80ms timeout');

    const timer = setTimeout(() => {
      const lookup = nodeLookupRef.current;
      const { nodes, edges } = useMapStore.getState();
      console.log('[LayoutCorrector] timeout fired for', action, '- nodes:', nodes.length, 'edges:', edges.length, 'lookup size:', lookup.size);

      for (const node of nodes) {
        const entry = lookup.get(node.id);
        console.log(`  [node] ${node.id} (${node.type}) measured:`, entry?.measured?.width, 'x', entry?.measured?.height, 'pos:', node.position.x, node.position.y);
      }

      if (action === 'fullArrange') {
        fullArrange(nodes, edges, lookup);
      } else {
        correctOverlap(nodes, lookup);
      }
    }, 80);

    return () => clearTimeout(timer);
  });

  return null;
}
