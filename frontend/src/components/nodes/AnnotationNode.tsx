import { NodeResizer, type NodeProps, type Node } from '@xyflow/react';
import type { StoryCardData } from '../../types';
import { useMapStore } from '../../store/useMapStore';

export function AnnotationNode({ id, data, selected }: NodeProps<Node<StoryCardData>>) {
  const highlightType = useMapStore((s) => s.highlightedNodes.get(id));
  const showLastAIEdit = useMapStore((s) => s.showLastAIEdit);
  const isInLastAIEdit = useMapStore((s) => s.lastAIEditNodeIds.has(id));
  const highlightClass = highlightType === 'added' ? 'node-highlight-added' : highlightType === 'modified' ? 'node-highlight-modified' : '';
  const dimClass = showLastAIEdit && !isInLastAIEdit ? 'node-dimmed-not-ai' : '';

  return (
    <>
      <NodeResizer
        minWidth={100}
        minHeight={60}
        isVisible={selected}
        lineClassName="!border-[#C6FF4D]"
        handleClassName="!w-2.5 !h-2.5 !bg-[#C6FF4D] !border-[#C6FF4D]"
      />
      <div
        className={`w-full h-full rounded-lg border-2 border-dashed p-3 ${
          selected ? 'border-[#C6FF4D]/60 bg-[#f8ffe8]' : 'border-[#C6FF4D]/40 bg-[#f8ffe8]/90'
        } ${highlightClass} ${dimClass}`}
        style={{ minWidth: data.width || 200, minHeight: data.height || 100 }}
      >
        <div className="font-mono-brand text-[10px] font-bold uppercase tracking-wider text-[#4a6600] mb-1">
          Note
        </div>
        <div className="font-medium text-sm text-[#080810]">{data.title}</div>
        {data.description && (
          <div className="text-xs text-[#080810]/60 mt-1">{data.description}</div>
        )}
      </div>
    </>
  );
}
