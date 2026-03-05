import { NodeResizer, type NodeProps, type Node } from '@xyflow/react';
import type { StoryCardData } from '../../types';
import { useMapStore } from '../../store/useMapStore';

export function AnnotationNode({ id, data, selected }: NodeProps<Node<StoryCardData>>) {
  const highlightType = useMapStore((s) => s.highlightedNodes.get(id));
  const highlightClass = highlightType === 'added' ? 'node-highlight-added' : highlightType === 'modified' ? 'node-highlight-modified' : '';

  return (
    <>
      <NodeResizer
        minWidth={100}
        minHeight={60}
        isVisible={selected}
        lineClassName="!border-amber-400"
        handleClassName="!w-2.5 !h-2.5 !bg-amber-500 !border-amber-600"
      />
      <div
        className={`w-full h-full rounded-lg border-2 border-dashed p-3 ${
          selected ? 'border-amber-500 bg-amber-200/90' : 'border-amber-400 bg-amber-200/70'
        } ${highlightClass}`}
        style={{ minWidth: data.width || 200, minHeight: data.height || 100 }}
      >
        <div className="text-[10px] font-bold uppercase tracking-wider text-amber-600 mb-1">
          Note
        </div>
        <div className="font-medium text-sm text-gray-800">{data.title}</div>
        {data.description && (
          <div className="text-xs text-gray-600 mt-1">{data.description}</div>
        )}
      </div>
    </>
  );
}
