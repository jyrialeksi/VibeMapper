import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import type { StoryCardData } from '../../types';
import { useMapStore } from '../../store/useMapStore';

export function ActivityNode({ id, data, selected }: NodeProps<Node<StoryCardData>>) {
  const highlightType = useMapStore((s) => s.highlightedNodes.get(id));
  const showLastAIEdit = useMapStore((s) => s.showLastAIEdit);
  const isInLastAIEdit = useMapStore((s) => s.lastAIEditNodeIds.has(id));
  const highlightClass = highlightType === 'added' ? 'node-highlight-added' : highlightType === 'modified' ? 'node-highlight-modified' : '';
  const dimClass = showLastAIEdit && !isInLastAIEdit ? 'node-dimmed-not-ai' : '';

  return (
    <div
      className={`px-3 py-2.5 rounded-lg shadow-md border-2 w-[260px] bg-purple-200 ${
        selected ? 'border-purple-600 ring-2 ring-purple-300' : 'border-purple-500'
      } ${highlightClass} ${dimClass}`}
    >
      <div className="text-[8px] font-bold uppercase tracking-wider text-purple-600 mb-1">
        Activity
      </div>
      <div className="font-semibold text-[11px] text-gray-900 leading-snug">{data.title}</div>
      {data.description && (
        <div className="text-[10px] text-gray-600 mt-1 leading-snug">{data.description}</div>
      )}
      <Handle type="source" position={Position.Bottom} className="!bg-purple-500 !w-3 !h-3" />
    </div>
  );
}
