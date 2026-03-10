import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import { MessageCircle } from 'lucide-react';
import type { StoryCardData } from '../../types';
import { useMapStore } from '../../store/useMapStore';
import { useNodeHighlight } from '../../hooks/useNodeHighlight';

export function StepNode({ id, data, selected }: NodeProps<Node<StoryCardData>>) {
  const { highlightClass, dimClass } = useNodeHighlight(id);
  const commentCount = useMapStore((s) => s.commentCounts.get(id) || 0);

  return (
    <div
      className={`px-3 py-2.5 rounded-lg shadow-md border-2 w-[260px] bg-[#e8fffa] dark:bg-[#a3f0e0] ${
        selected ? 'border-[#00F5D4] ring-2 ring-[#00F5D4]/30' : 'border-[#00F5D4]/60'
      } ${highlightClass} ${dimClass}`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="font-mono-brand text-[8px] font-bold uppercase tracking-wider text-[#007a6a]">
          Step
        </span>
        {commentCount > 0 && (
          <span className="flex items-center gap-0.5 text-[8px] text-[#7A7A9A]">
            <MessageCircle size={8} />
            {commentCount}
          </span>
        )}
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
