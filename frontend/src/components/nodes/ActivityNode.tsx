import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import type { StoryCardData } from '../../types';

export function ActivityNode({ data, selected }: NodeProps<Node<StoryCardData>>) {
  return (
    <div
      className={`px-3 py-2.5 rounded-lg shadow-md border-2 w-[260px] bg-purple-50 ${
        selected ? 'border-purple-600 ring-2 ring-purple-300' : 'border-purple-400'
      }`}
    >
      <div className="text-[8px] font-bold uppercase tracking-wider text-purple-600 mb-1">
        Activity
      </div>
      <div className="font-semibold text-[11px] text-gray-900 leading-snug">{data.title}</div>
      {data.description && (
        <div className="text-[10px] text-gray-600 mt-1 leading-snug">{data.description}</div>
      )}
      {data.tags && data.tags.length > 0 && (
        <div className="flex flex-wrap gap-0.5 mt-1.5">
          {data.tags.map((tag) => (
            <span key={tag} className="text-[8px] bg-purple-100 text-purple-700 px-1 py-0.5 rounded">
              {tag}
            </span>
          ))}
        </div>
      )}
      <Handle type="source" position={Position.Bottom} className="!bg-purple-500 !w-3 !h-3" />
    </div>
  );
}
