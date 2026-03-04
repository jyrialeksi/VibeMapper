import { useEffect, useRef } from 'react';
import { useStore, useNodesInitialized, type ReactFlowState } from '@xyflow/react';
import { useMapStore } from '../store/useMapStore';
import type { StoryCardData, Priority } from '../types';

const VERTICAL_GAP = 30;
const WITHIN_PRIORITY_GAP = 15;

const PRIORITY_ORDER: Priority[] = ['must-have', 'should-have', 'could-have', 'wont-have'];
const PRIORITY_BASE_Y: Record<Priority, number> = {
  'must-have': 400,
  'should-have': 600,
  'could-have': 800,
  'wont-have': 1000,
};

const nodeLookupSelector = (s: ReactFlowState) => s.nodeLookup;

function estimateHeight(data: StoryCardData): number {
  // Base: padding + header + title
  let h = 50;
  // Description
  if (data.description) {
    const lines = Math.ceil(data.description.length / 35);
    h += lines * 14;
  }
  // Acceptance criteria
  if (data.acceptanceCriteria?.length) {
    h += 18; // header
    h += data.acceptanceCriteria.length * 14;
  }
  // Tags
  if (data.tags?.length) {
    h += 20;
  }
  return Math.max(h, 60);
}

/**
 * Invisible component mounted inside <ReactFlow> that fixes overlapping
 * story cards after AI generation by reading measured DOM heights.
 */
export function LayoutCorrector() {
  const needsLayoutCorrection = useMapStore((s) => s.needsLayoutCorrection);
  const setNeedsLayoutCorrection = useMapStore((s) => s.setNeedsLayoutCorrection);
  const nodesInitialized = useNodesInitialized();
  const nodeLookup = useStore(nodeLookupSelector);
  const correctionPending = useRef(false);

  // Two-phase: first mark pending when flag is set, then correct after nodes are measured
  useEffect(() => {
    if (needsLayoutCorrection) {
      correctionPending.current = true;
      // Clear the flag immediately to prevent re-triggers
      setNeedsLayoutCorrection(false);
    }
  }, [needsLayoutCorrection, setNeedsLayoutCorrection]);

  useEffect(() => {
    if (!correctionPending.current || !nodesInitialized) return;
    correctionPending.current = false;

    // Small delay to ensure React Flow has measured all nodes
    const timer = setTimeout(() => {
      const nodes = useMapStore.getState().nodes;

      // Separate story nodes from non-story nodes
      const storyNodes = nodes.filter(
        (n) => n.type === 'storyCard' && (n.data as StoryCardData).cardType === 'story'
      );
      if (storyNodes.length === 0) return;

      // Get measured heights from React Flow's nodeLookup
      const getHeight = (nodeId: string): number => {
        const entry = nodeLookup.get(nodeId);
        if (entry?.measured?.height) return entry.measured.height;
        // Fallback to estimation
        const node = nodes.find((n) => n.id === nodeId);
        if (node) return estimateHeight(node.data as StoryCardData);
        return 80;
      };

      // Group stories by column (x-position) — use rounded x to handle minor offsets
      const columnMap = new Map<number, typeof storyNodes>();
      for (const node of storyNodes) {
        const colKey = Math.round(node.position.x / 10) * 10;
        if (!columnMap.has(colKey)) columnMap.set(colKey, []);
        columnMap.get(colKey)!.push(node);
      }

      // For each priority band, compute dynamic start y based on previous band
      const corrections = new Map<string, number>(); // nodeId -> new y
      let previousBandBottom = 0;

      for (const priority of PRIORITY_ORDER) {
        const baseY = PRIORITY_BASE_Y[priority];
        const bandStartY = Math.max(baseY, previousBandBottom + VERTICAL_GAP);
        let bandBottom = bandStartY;

        for (const [, columnNodes] of columnMap) {
          // Get stories in this priority for this column
          const priorityNodes = columnNodes.filter(
            (n) => (n.data as StoryCardData).priority === priority
          );
          if (priorityNodes.length === 0) continue;

          // Sort by current y position to maintain relative order
          priorityNodes.sort((a, b) => a.position.y - b.position.y);

          let currentY = bandStartY;
          for (const node of priorityNodes) {
            corrections.set(node.id, currentY);
            const h = getHeight(node.id);
            currentY += h + WITHIN_PRIORITY_GAP;
          }

          // Track the bottom of the tallest column in this band
          bandBottom = Math.max(bandBottom, currentY - WITHIN_PRIORITY_GAP);
        }

        previousBandBottom = bandBottom;
      }

      // Check if any positions actually changed
      let hasChanges = false;
      for (const [id, newY] of corrections) {
        const node = storyNodes.find((n) => n.id === id);
        if (node && Math.abs(node.position.y - newY) > 1) {
          hasChanges = true;
          break;
        }
      }

      if (!hasChanges) return;

      // Apply corrections
      const updatedNodes = nodes.map((n) => {
        const newY = corrections.get(n.id);
        if (newY !== undefined) {
          return { ...n, position: { ...n.position, y: newY } };
        }
        return n;
      });

      useMapStore.setState({ nodes: updatedNodes, isDirty: true });
    }, 50);

    return () => clearTimeout(timer);
  }, [nodesInitialized, nodeLookup]);

  return null;
}
