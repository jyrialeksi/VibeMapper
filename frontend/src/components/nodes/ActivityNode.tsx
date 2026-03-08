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
      className={`px-3 py-2.5 rounded-lg shadow-md border-2 w-[260px] bg-[#f0e8ff] dark:bg-[#c9b3f0] ${
        selected ? 'border-[#7B2FFF] ring-2 ring-[#7B2FFF]/30' : 'border-[#7B2FFF]/60'
      } ${highlightClass} ${dimClass}`}
    >
      <div className="font-mono-brand text-[8px] font-bold uppercase tracking-wider text-[#7B2FFF] mb-1">
        Activity
      </div>
      <div className="font-semibold text-[11px] text-[#080810] leading-snug">{data.title}</div>
      {data.description && (
        <div className="text-[10px] text-[#080810]/60 mt-1 leading-snug">{data.description}</div>
      )}
      <Handle type="source" position={Position.Bottom} className="!bg-[#7B2FFF] !w-3 !h-3" />
    </div>
  );
}
