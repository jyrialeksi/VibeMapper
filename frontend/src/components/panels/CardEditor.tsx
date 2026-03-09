import { useEffect, useRef } from 'react';
import { useMapStore } from '../../store/useMapStore';
import type { Priority, CardType } from '../../types';
import { STATUS_COLORS, STATUS_LABELS } from '../../types';
import { X, Plus, Trash2 } from 'lucide-react';
import { AutoExpandTextarea } from '../ui/AutoExpandTextarea';
import { SIDEBAR_PANEL, INPUT_BASE, FORM_LABEL, GLASS_BORDER, BTN_INACTIVE } from '../../styles/shared';
import { CARD_STATUSES, PRIORITIES, ESTIMATES, CARD_TYPES } from '../../constants/cardOptions';

export function CardEditor() {
  const selectedNodeId = useMapStore((s) => s.selectedNodeId);
  const nodes = useMapStore((s) => s.nodes);
  const updateNodeData = useMapStore((s) => s.updateNodeData);
  const deleteNode = useMapStore((s) => s.deleteNode);
  const setSelectedNodeId = useMapStore((s) => s.setSelectedNodeId);
  const setActivePanel = useMapStore((s) => s.setActivePanel);
  const pushSnapshot = useMapStore((s) => s.pushSnapshot);
  const prevSelectedRef = useRef<string | null>(null);

  useEffect(() => {
    if (selectedNodeId && selectedNodeId !== prevSelectedRef.current) {
      pushSnapshot();
    }
    prevSelectedRef.current = selectedNodeId;
  }, [selectedNodeId, pushSnapshot]);

  const node = nodes.find((n) => n.id === selectedNodeId);
  if (!node) return null;

  const { data } = node;

  return (
    <div className={`${SIDEBAR_PANEL} overflow-y-auto`}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[#080810] dark:text-[#F0EEFF]">Edit Card</h3>
          <button
            onClick={() => { setSelectedNodeId(null); setActivePanel('none'); }}
            className="p-1 hover:bg-[#7B2FFF]/10 dark:hover:bg-[#7B2FFF]/20 rounded-md text-[#7A7A9A] hover:text-[#7B2FFF] transition-colors duration-150"
          >
            <X size={16} />
          </button>
        </div>

        {/* Card Type */}
        <label className={FORM_LABEL}>Card Type</label>
        <select
          value={data.cardType}
          onChange={(e) => updateNodeData(node.id, { cardType: e.target.value as CardType })}
          className={`${INPUT_BASE} w-full mb-3`}
        >
          {CARD_TYPES.map((ct) => (
            <option key={ct} value={ct}>{ct}</option>
          ))}
        </select>

        {/* Title */}
        <label className={FORM_LABEL}>Title</label>
        <AutoExpandTextarea
          minRows={1}
          maxRows={4}
          value={data.title}
          onChange={(e) => updateNodeData(node.id, { title: e.target.value })}
          className={`${INPUT_BASE} w-full mb-3 placeholder:text-[#7A7A9A]`}
        />

        {/* Description */}
        <label className={FORM_LABEL}>Description</label>
        <textarea
          value={data.description}
          onChange={(e) => updateNodeData(node.id, { description: e.target.value })}
          className={`${INPUT_BASE} w-full mb-3 resize-y placeholder:text-[#7A7A9A]`}
          rows={3}
        />

        {/* Priority */}
        {data.cardType !== 'annotation' && (
          <>
            <label className={FORM_LABEL}>Priority</label>
            <select
              value={data.priority}
              onChange={(e) => updateNodeData(node.id, { priority: e.target.value as Priority })}
              className={`${INPUT_BASE} w-full mb-3`}
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </>
        )}

        {/* Estimate (stories only) */}
        {data.cardType === 'story' && (
          <>
            <label className={FORM_LABEL}>Estimate</label>
            <div className="flex gap-1 mb-3">
              {ESTIMATES.map((est) => (
                <button
                  key={est}
                  onClick={() => updateNodeData(node.id, { estimate: est })}
                  className={`px-2 py-1 text-xs rounded-lg border transition-colors duration-150 ${
                    data.estimate === est
                      ? 'bg-[#C6FF4D]/20 border-[#C6FF4D]/40 text-[#080810] dark:text-[#C6FF4D]'
                      : `bg-white/50 dark:bg-[#16162A]/50 ${GLASS_BORDER} ${BTN_INACTIVE}`
                  }`}
                >
                  {est}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Status (stories only) */}
        {data.cardType === 'story' && (
          <>
            <label className={FORM_LABEL}>Status</label>
            <div className="flex flex-wrap gap-1 mb-3">
              <button
                onClick={() => updateNodeData(node.id, { status: undefined })}
                className={`px-2 py-1 text-xs rounded-lg border transition-colors duration-150 ${
                  !data.status
                    ? 'bg-[#7A7A9A]/20 border-[#7A7A9A]/40 text-[#080810] dark:text-[#F0EEFF]'
                    : `bg-white/50 dark:bg-[#16162A]/50 ${GLASS_BORDER} ${BTN_INACTIVE}`
                }`}
              >
                None
              </button>
              {CARD_STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => updateNodeData(node.id, { status: s })}
                  className={`px-2 py-1 text-xs rounded-lg border transition-colors duration-150 ${
                    data.status === s
                      ? 'border-current'
                      : `bg-white/50 dark:bg-[#16162A]/50 ${GLASS_BORDER} ${BTN_INACTIVE}`
                  }`}
                  style={data.status === s ? { backgroundColor: STATUS_COLORS[s] + '20', color: STATUS_COLORS[s], borderColor: STATUS_COLORS[s] } : undefined}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Acceptance Criteria */}
        {data.cardType === 'story' && (
          <>
            <label className={FORM_LABEL}>
              Acceptance Criteria
            </label>
            {(data.acceptanceCriteria || []).map((ac, i) => (
              <div key={i} className="flex gap-1 mb-1">
                <AutoExpandTextarea
                  minRows={1}
                  maxRows={4}
                  value={ac}
                  onChange={(e) => {
                    const updated = [...(data.acceptanceCriteria || [])];
                    updated[i] = e.target.value;
                    updateNodeData(node.id, { acceptanceCriteria: updated });
                  }}
                  className={`flex-1 ${INPUT_BASE} px-2 py-1 text-xs placeholder:text-[#7A7A9A]`}
                />
                <button
                  onClick={() => {
                    const updated = (data.acceptanceCriteria || []).filter((_, j) => j !== i);
                    updateNodeData(node.id, { acceptanceCriteria: updated });
                  }}
                  className="p-1 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md text-red-400 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-150 self-start"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            <button
              onClick={() =>
                updateNodeData(node.id, {
                  acceptanceCriteria: [...(data.acceptanceCriteria || []), ''],
                })
              }
              className="flex items-center gap-1 text-xs text-[#C6FF4D] hover:text-[#d4ff70] mt-1 mb-3 transition-colors duration-150"
            >
              <Plus size={14} />
              Add criterion
            </button>
          </>
        )}

        {/* Delete */}
        <button
          onClick={() => {
            deleteNode(node.id);
          }}
          className="w-full flex items-center justify-center gap-2 bg-red-50/80 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200/50 dark:border-red-700/50 rounded-lg px-3 py-2 text-sm hover:bg-red-100/80 dark:hover:bg-red-900/50 transition-colors duration-150"
        >
          <Trash2 size={15} />
          Delete Card
        </button>
      </div>
    </div>
  );
}
