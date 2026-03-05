import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import type { StoryCardData, Priority } from '../../types';
import { PRIORITY_COLORS } from '../../types';

const PRIORITY_BG: Record<Priority, string> = {
  'must-have': 'bg-red-50 border-red-400',
  'should-have': 'bg-amber-50 border-amber-400',
  'could-have': 'bg-blue-50 border-blue-400',
  'wont-have': 'bg-gray-50 border-gray-400',
};

const PRIORITY_LABEL_STYLE: Record<Priority, string> = {
  'must-have': 'bg-red-100 text-red-700',
  'should-have': 'bg-amber-100 text-amber-700',
  'could-have': 'bg-blue-100 text-blue-700',
  'wont-have': 'bg-gray-100 text-gray-700',
};

export function StoryCardNode({ data, selected }: NodeProps<Node<StoryCardData>>) {
  const priorityBg = PRIORITY_BG[data.priority] || PRIORITY_BG['must-have'];
  const priorityColor = PRIORITY_COLORS[data.priority] || PRIORITY_COLORS['must-have'];

  return (
    <div
      className={`px-3 py-2.5 rounded-lg shadow-md border-2 w-[260px] ${priorityBg} ${
        selected ? 'ring-2 ring-green-400' : ''
      }`}
      style={selected ? { borderColor: '#059669' } : undefined}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-[8px] font-bold uppercase tracking-wider text-emerald-600">
          Story
        </span>
        <div className="flex items-center gap-1">
          {data.estimate && (
            <span className="text-[8px] bg-gray-200 text-gray-700 px-1 py-0.5 rounded font-medium">
              {data.estimate}
            </span>
          )}
          <span
            className={`text-[8px] px-1 py-0.5 rounded font-medium ${PRIORITY_LABEL_STYLE[data.priority] || ''}`}
          >
            {data.priority}
          </span>
        </div>
      </div>
      <div className="font-semibold text-[11px] text-gray-900 leading-snug">{data.title}</div>
      {data.description && (
        <div className="text-[10px] text-gray-600 mt-1 leading-snug">{data.description}</div>
      )}
      {data.acceptanceCriteria && data.acceptanceCriteria.length > 0 && (
        <div className="mt-1.5 pt-1.5 border-t border-gray-200/60">
          <div className="text-[8px] font-semibold uppercase tracking-wider text-gray-400 mb-0.5">
            Acceptance Criteria
          </div>
          <ul className="space-y-0.5">
            {data.acceptanceCriteria.map((ac, i) => (
              <li key={i} className="text-[9px] text-gray-500 leading-snug flex gap-1">
                <span className="text-gray-400 shrink-0">•</span>
                <span>{ac}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div
        className="absolute top-0 left-0 w-1 h-full rounded-l-lg"
        style={{ backgroundColor: priorityColor }}
      />
      <Handle type="target" position={Position.Top} className="!bg-emerald-500 !w-3 !h-3" />
      <Handle type="source" position={Position.Bottom} className="!bg-emerald-500 !w-3 !h-3" />
    </div>
  );
}
