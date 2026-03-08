import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import type { StoryCardData } from '../../types';
import { useMapStore } from '../../store/useMapStore';

export function StepNode({ id, data, selected }: NodeProps<Node<StoryCardData>>) {
  const highlightType = useMapStore((s) => s.highlightedNodes.get(id));
  const showLastAIEdit = useMapStore((s) => s.showLastAIEdit);
  const isInLastAIEdit = useMapStore((s) => s.lastAIEditNodeIds.has(id));
  const highlightClass = highlightType === 'added' ? 'node-highlight-added' : highlightType === 'modified' ? 'node-highlight-modified' : '';
  const dimClass = showLastAIEdit && !isInLastAIEdit ? 'node-dimmed-not-ai' : '';

  return (
    <div
      className={`px-3 py-2.5 rounded-lg shadow-md border-2 w-[260px] bg-[#e8fffa] dark:bg-[#081a18]/90 backdrop-blur-md ${
        selected ? 'border-[#00F5D4] ring-2 ring-[#00F5D4]/30' : 'border-[#00F5D4]/60'
      } ${highlightClass} ${dimClass}`}
    >
      <div className="font-mono-brand text-[8px] font-bold uppercase tracking-wider text-[#00F5D4] mb-1">
        Step
      </div>
      <div className="font-semibold text-[11px] text-[#080810] dark:text-[#F0EEFF] leading-snug">{data.title}</div>
      {data.description && (
        <div className="text-[10px] text-[#7A7A9A] mt-1 leading-snug">{data.description}</div>
      )}
      <Handle type="target" position={Position.Top} className="!bg-[#00F5D4] !w-3 !h-3" />
      <Handle type="source" position={Position.Bottom} className="!bg-[#00F5D4] !w-3 !h-3" />
    </div>
  );
}
