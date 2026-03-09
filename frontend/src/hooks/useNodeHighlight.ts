import { useMapStore } from '../store/useMapStore';

/**
 * Returns highlight and dim CSS classes for a node based on AI edit state.
 */
export function useNodeHighlight(nodeId: string) {
  const highlightType = useMapStore((s) => s.highlightedNodes.get(nodeId));
  const showLastAIEdit = useMapStore((s) => s.showLastAIEdit);
  const isInLastAIEdit = useMapStore((s) => s.lastAIEditNodeIds.has(nodeId));

  const highlightClass =
    highlightType === 'added'
      ? 'node-highlight-added'
      : highlightType === 'modified'
        ? 'node-highlight-modified'
        : '';

  const dimClass = showLastAIEdit && !isInLastAIEdit ? 'node-dimmed-not-ai' : '';

  return { highlightClass, dimClass };
}
