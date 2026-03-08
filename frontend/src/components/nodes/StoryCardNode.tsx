import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import type { StoryCardData, Priority } from '../../types';
import { useMapStore } from '../../store/useMapStore';

const PRIORITY_BG: Record<Priority, string> = {
  'must-have': 'bg-red-200 border-red-500',
  'should-have': 'bg-amber-200 border-amber-500',
  'could-have': 'bg-sky-200 border-sky-500',
  'wont-have': 'bg-gray-200 border-gray-500',
};

const PRIORITY_BAR_COLOR: Record<Priority, string> = {
  'must-have': '#ef4444',
  'should-have': '#f59e0b',
  'could-have': '#0ea5e9',
  'wont-have': '#6b7280',
};

const PRIORITY_LABEL_STYLE: Record<Priority, string> = {
  'must-have': 'bg-red-300 text-red-800',
  'should-have': 'bg-amber-300 text-amber-800',
  'could-have': 'bg-sky-300 text-sky-800',
  'wont-have': 'bg-gray-300 text-gray-700',
};

export function StoryCardNode({ id, data, selected }: NodeProps<Node<StoryCardData>>) {
  const highlightType = useMapStore((s) => s.highlightedNodes.get(id));
  const showDescriptions = useMapStore((s) => s.showDescriptions);
  const showAcceptanceCriteria = useMapStore((s) => s.showAcceptanceCriteria);
  const showLastAIEdit = useMapStore((s) => s.showLastAIEdit);
  const isInLastAIEdit = useMapStore((s) => s.lastAIEditNodeIds.has(id));
  const highlightClass = highlightType === 'added' ? 'node-highlight-added' : highlightType === 'modified' ? 'node-highlight-modified' : '';
  const dimClass = showLastAIEdit && !isInLastAIEdit ? 'node-dimmed-not-ai' : '';
  const priorityBg = PRIORITY_BG[data.priority] || PRIORITY_BG['must-have'];
  const barColor = selected ? '#059669' : (PRIORITY_BAR_COLOR[data.priority] || '#ef4444');

  return (
    <div
      className={`px-3 pl-5 py-2.5 rounded-lg shadow-md border-2 w-[260px] ${priorityBg} ${
        selected ? 'ring-2 ring-green-400' : ''
      } ${highlightClass} ${dimClass}`}
      style={{ '--tw-inset-shadow': `inset 6px 0 0 0 ${barColor}`, ...(selected ? { borderColor: '#059669' } : {}) } as React.CSSProperties}
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
        <div className={`card-section-collapsible ${showDescriptions ? 'card-section-open' : ''}`}>
          <div>
            <div className="text-[10px] text-gray-600 mt-1 leading-snug">{data.description}</div>
          </div>
        </div>
      )}
      {data.acceptanceCriteria && data.acceptanceCriteria.length > 0 && (
        <div className={`card-section-collapsible ${showAcceptanceCriteria ? 'card-section-open' : ''}`}>
          <div>
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
          </div>
        </div>
      )}
      <Handle type="target" position={Position.Top} className="!bg-emerald-500 !w-3 !h-3" />
      <Handle type="source" position={Position.Bottom} className="!bg-emerald-500 !w-3 !h-3" />
    </div>
  );
}
