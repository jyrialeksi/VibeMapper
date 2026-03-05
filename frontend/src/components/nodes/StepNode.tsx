import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import type { StoryCardData } from '../../types';
import { useMapStore } from '../../store/useMapStore';

export function StepNode({ id, data, selected }: NodeProps<Node<StoryCardData>>) {
  const highlightType = useMapStore((s) => s.highlightedNodes.get(id));
  const highlightClass = highlightType === 'added' ? 'node-highlight-added' : highlightType === 'modified' ? 'node-highlight-modified' : '';

  return (
    <div
      className={`px-3 py-2.5 rounded-lg shadow-md border-2 w-[260px] bg-blue-50 dark:bg-blue-950 ${
        selected ? 'border-blue-600 dark:border-blue-400 ring-2 ring-blue-300 dark:ring-blue-700' : 'border-blue-400 dark:border-blue-500'
      } ${highlightClass}`}
    >
      <div className="text-[8px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">
        Step
      </div>
      <div className="font-semibold text-[11px] text-gray-900 dark:text-gray-100 leading-snug">{data.title}</div>
      {data.description && (
        <div className="text-[10px] text-gray-600 dark:text-gray-400 mt-1 leading-snug">{data.description}</div>
      )}
      <Handle type="target" position={Position.Top} className="!bg-blue-500 !w-3 !h-3" />
      <Handle type="source" position={Position.Bottom} className="!bg-blue-500 !w-3 !h-3" />
    </div>
  );
}
