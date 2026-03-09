import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import type { StoryCardData } from '../../types';
import { useNodeHighlight } from '../../hooks/useNodeHighlight';

export function StepNode({ id, data, selected }: NodeProps<Node<StoryCardData>>) {
  const { highlightClass, dimClass } = useNodeHighlight(id);

  return (
    <div
      className={`px-3 py-2.5 rounded-lg shadow-md border-2 w-[260px] bg-[#e8fffa] dark:bg-[#a3f0e0] ${
        selected ? 'border-[#00F5D4] ring-2 ring-[#00F5D4]/30' : 'border-[#00F5D4]/60'
      } ${highlightClass} ${dimClass}`}
    >
      <div className="font-mono-brand text-[8px] font-bold uppercase tracking-wider text-[#007a6a] mb-1">
        Step
      </div>
      <div className="font-semibold text-[11px] text-[#080810] leading-snug">{data.title}</div>
      {data.description && (
        <div className="text-[10px] text-[#080810]/60 mt-1 leading-snug">{data.description}</div>
      )}
      <Handle type="target" position={Position.Top} className="!bg-[#00F5D4] !w-3 !h-3" />
      <Handle type="source" position={Position.Bottom} className="!bg-[#00F5D4] !w-3 !h-3" />
    </div>
  );
}
