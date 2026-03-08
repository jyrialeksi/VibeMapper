import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import type { StoryCardData, Priority } from '../../types';
import { STATUS_COLORS, STATUS_LABELS } from '../../types';
import type { CardStatus } from '../../types';
import { useMapStore } from '../../store/useMapStore';

const PRIORITY_BG: Record<Priority, string> = {
  'must-have': 'bg-[#fff0f8] border-[#FF3CAC]/50 dark:bg-[#1a0a18]/90 dark:border-[#FF3CAC]/40 backdrop-blur-md',
  'should-have': 'bg-[#f8ffe8] border-[#C6FF4D]/50 dark:bg-[#121a08]/90 dark:border-[#C6FF4D]/40 backdrop-blur-md',
  'could-have': 'bg-[#e8fffa] border-[#00F5D4]/50 dark:bg-[#081a18]/90 dark:border-[#00F5D4]/40 backdrop-blur-md',
  'wont-have': 'bg-[#f0f0f4] border-[#7A7A9A]/50 dark:bg-[#121218]/90 dark:border-[#7A7A9A]/40 backdrop-blur-md',
};

const PRIORITY_BAR_COLOR: Record<Priority, string> = {
  'must-have': '#FF3CAC',
  'should-have': '#C6FF4D',
  'could-have': '#00F5D4',
  'wont-have': '#7A7A9A',
};

const PRIORITY_LABEL_STYLE: Record<Priority, string> = {
  'must-have': 'bg-[#FF3CAC]/20 text-[#FF3CAC]',
  'should-have': 'bg-[#C6FF4D]/20 text-[#080810] dark:text-[#C6FF4D]',
  'could-have': 'bg-[#00F5D4]/20 text-[#00F5D4]',
  'wont-have': 'bg-[#7A7A9A]/20 text-[#7A7A9A]',
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
  const barColor = selected ? '#C6FF4D' : (PRIORITY_BAR_COLOR[data.priority] || '#FF3CAC');

  return (
    <div
      className={`px-3 pl-5 py-2.5 rounded-lg shadow-md border-2 w-[260px] ${priorityBg} ${
        selected ? 'ring-2 ring-[#C6FF4D]/40' : ''
      } ${highlightClass} ${dimClass}`}
      style={{ '--tw-inset-shadow': `inset 6px 0 0 0 ${barColor}`, ...(selected ? { borderColor: '#C6FF4D' } : {}) } as React.CSSProperties}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1">
          <span className="font-mono-brand text-[8px] font-bold uppercase tracking-wider text-[#C6FF4D] dark:text-[#C6FF4D]">
            Story
          </span>
          {data.status && (
            <span
              className="text-[8px] px-1 py-0.5 rounded font-medium"
              style={{ backgroundColor: STATUS_COLORS[data.status as CardStatus] + '30', color: STATUS_COLORS[data.status as CardStatus] }}
            >
              {STATUS_LABELS[data.status as CardStatus]}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {data.estimate && (
            <span className="text-[8px] bg-[#7A7A9A]/20 text-[#7A7A9A] px-1 py-0.5 rounded font-medium">
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
      <div className="font-semibold text-[11px] text-[#080810] dark:text-[#F0EEFF] leading-snug">{data.title}</div>
      {data.description && (
        <div className={`card-section-collapsible ${showDescriptions ? 'card-section-open' : ''}`}>
          <div>
            <div className="text-[10px] text-[#7A7A9A] mt-1 leading-snug">{data.description}</div>
          </div>
        </div>
      )}
      {data.acceptanceCriteria && data.acceptanceCriteria.length > 0 && (
        <div className={`card-section-collapsible ${showAcceptanceCriteria ? 'card-section-open' : ''}`}>
          <div>
            <div className="mt-1.5 pt-1.5 border-t border-[#7A7A9A]/20">
              <div className="text-[8px] font-semibold uppercase tracking-wider text-[#7A7A9A] mb-0.5">
                Acceptance Criteria
              </div>
              <ul className="space-y-0.5">
                {data.acceptanceCriteria.map((ac, i) => (
                  <li key={i} className="text-[9px] text-[#7A7A9A] leading-snug flex gap-1">
                    <span className="text-[#7A7A9A]/60 shrink-0">•</span>
                    <span>{ac}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
      <Handle type="target" position={Position.Top} className="!bg-[#C6FF4D] !w-3 !h-3" />
      <Handle type="source" position={Position.Bottom} className="!bg-[#C6FF4D] !w-3 !h-3" />
    </div>
  );
}
