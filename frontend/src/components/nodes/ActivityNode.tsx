import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import type { StoryCardData } from '../../types';
import { useMapStore } from '../../store/useMapStore';
import { useNodeHighlight } from '../../hooks/useNodeHighlight';

export function ActivityNode({ id, data, selected }: NodeProps<Node<StoryCardData>>) {
  const { highlightClass, dimClass } = useNodeHighlight(id);
  const commentCount = useMapStore((s) => s.commentCounts.get(id) || 0);
  const setSelectedNodeId = useMapStore((s) => s.setSelectedNodeId);
  const setActivePanel = useMapStore((s) => s.setActivePanel);

  return (
    <div
      className={`relative px-3 py-2.5 rounded-lg shadow-md border-2 w-[260px] bg-[#f0e8ff] dark:bg-[#c9b3f0] ${
        selected ? 'border-[#7B2FFF] ring-2 ring-[#7B2FFF]/30' : 'border-[#7B2FFF]/60'
      } ${highlightClass} ${dimClass}`}
      style={{ overflow: 'visible' }}
    >
      {commentCount > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); setSelectedNodeId(id); setActivePanel('comments'); }}
          className="absolute -top-3 -right-3 flex items-center justify-center min-w-[24px] h-[24px] px-1 text-[11px] font-bold text-white bg-[#FF3B30] rounded-full shadow-sm border-2 border-white dark:border-[#1a1a2e] z-10 cursor-pointer hover:scale-110 transition-transform"
        >
          {commentCount}
        </button>
      )}
      <div className="flex items-center justify-between mb-1">
        <span className="font-mono-brand text-[8px] font-bold uppercase tracking-wider text-[#7B2FFF]">
          Activity
        </span>
      </div>
      <div className="font-semibold text-[11px] text-[#080810] leading-snug">{data.title}</div>
      {data.description && (
        <div className="text-[10px] text-[#080810]/60 mt-1 leading-snug">{data.description}</div>
      )}
      <Handle type="source" position={Position.Bottom} className="!bg-[#7B2FFF] !w-3 !h-3" />
    </div>
  );
}
