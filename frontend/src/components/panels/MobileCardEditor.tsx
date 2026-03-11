import { useEffect, useRef, useCallback } from 'react';
import { useMapStore } from '../../store/useMapStore';
import type { Priority, CardType } from '../../types';
import { STATUS_COLORS, STATUS_LABELS } from '../../types';
import { X, Plus, Trash2, GripHorizontal } from 'lucide-react';
import { GLASS_BORDER, INPUT_BASE, FORM_LABEL, BTN_INACTIVE } from '../../styles/shared';
import { CARD_STATUSES, PRIORITIES, ESTIMATES, CARD_TYPES } from '../../constants/cardOptions';

export function MobileCardEditor() {
  const mobileEditingNodeId = useMapStore((s) => s.mobileEditingNodeId);
  const nodes = useMapStore((s) => s.nodes);
  const updateNodeData = useMapStore((s) => s.updateNodeData);
  const deleteNode = useMapStore((s) => s.deleteNode);
  const setMobileEditingNodeId = useMapStore((s) => s.setMobileEditingNodeId);
  const pushSnapshot = useMapStore((s) => s.pushSnapshot);
  const prevSelectedRef = useRef<string | null>(null);

  // Swipe-to-dismiss state
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef<number | null>(null);
  const dragOffset = useRef(0);

  useEffect(() => {
    if (mobileEditingNodeId && mobileEditingNodeId !== prevSelectedRef.current) {
      pushSnapshot();
    }
    prevSelectedRef.current = mobileEditingNodeId;
  }, [mobileEditingNodeId, pushSnapshot]);

  const dismiss = useCallback(() => {
    setMobileEditingNodeId(null);
  }, [setMobileEditingNodeId]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
    dragOffset.current = 0;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (dragStartY.current === null) return;
    const dy = e.touches[0].clientY - dragStartY.current;
    dragOffset.current = Math.max(0, dy); // only allow downward
    if (sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${dragOffset.current}px)`;
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (dragOffset.current > 100) {
      dismiss();
    } else if (sheetRef.current) {
      sheetRef.current.style.transform = 'translateY(0)';
    }
    dragStartY.current = null;
    dragOffset.current = 0;
  }, [dismiss]);

  const node = nodes.find((n) => n.id === mobileEditingNodeId);
  if (!node || !mobileEditingNodeId) return null;

  const { data } = node;

  return (
    <div className="absolute bottom-0 left-0 right-0 z-50 animate-slide-up flex justify-center" style={{ height: '60vh' }}>
      <div
        ref={sheetRef}
        className={`h-full w-full max-w-3xl bg-white/95 dark:bg-[#0F0F1E]/95 backdrop-blur-xl rounded-t-2xl shadow-lg border-t border-x ${GLASS_BORDER} flex flex-col`}
        style={{ willChange: 'transform' }}
      >
        {/* Handle area - swipe zone */}
        <div
          className="flex-shrink-0 pt-2 pb-1 px-4 cursor-grab"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="w-10 h-1 bg-[#7A7A9A]/30 rounded-full mx-auto mb-2" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GripHorizontal size={16} className="text-[#7A7A9A]" />
              <h3 className="font-semibold text-[#080810] dark:text-[#F0EEFF] text-sm">Edit Card</h3>
            </div>
            <button
              onClick={dismiss}
              className="p-2 hover:bg-[#7B2FFF]/10 dark:hover:bg-[#7B2FFF]/20 rounded-lg text-[#7A7A9A] hover:text-[#7B2FFF] transition-colors duration-150"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-4 pb-4" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
          {/* Card Type */}
          <label className={`${FORM_LABEL} mt-2`}>Card Type</label>
          <select
            value={data.cardType}
            onChange={(e) => updateNodeData(node.id, { cardType: e.target.value as CardType })}
            className={`w-full ${INPUT_BASE} px-3 py-2.5 mb-3`}
          >
            {CARD_TYPES.map((ct) => (
              <option key={ct} value={ct}>{ct}</option>
            ))}
          </select>

          {/* Title */}
          <label className={FORM_LABEL}>Title</label>
          <textarea
            value={data.title}
            onChange={(e) => updateNodeData(node.id, { title: e.target.value })}
            className={`w-full ${INPUT_BASE} px-3 py-2.5 mb-3 placeholder:text-[#7A7A9A] resize-none`}
            rows={2}
          />

          {/* Description */}
          <label className={FORM_LABEL}>Description</label>
          <textarea
            value={data.description}
            onChange={(e) => updateNodeData(node.id, { description: e.target.value })}
            className={`w-full ${INPUT_BASE} px-3 py-2.5 mb-3 resize-y placeholder:text-[#7A7A9A]`}
            rows={3}
          />

          {/* Priority */}
          {data.cardType === 'story' && (
            <>
              <label className={FORM_LABEL}>Priority</label>
              <select
                value={data.priority}
                onChange={(e) => updateNodeData(node.id, { priority: e.target.value as Priority })}
                className={`w-full ${INPUT_BASE} px-3 py-2.5 mb-3`}
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
              <div className="flex gap-1.5 mb-3">
                {ESTIMATES.map((est) => (
                  <button
                    key={est}
                    onClick={() => updateNodeData(node.id, { estimate: est })}
                    className={`flex-1 min-h-[44px] text-sm rounded-lg border transition-colors duration-150 ${
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
              <div className="flex flex-wrap gap-1.5 mb-3">
                <button
                  onClick={() => updateNodeData(node.id, { status: undefined })}
                  className={`min-h-[44px] px-3 text-sm rounded-lg border transition-colors duration-150 ${
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
                    className={`min-h-[44px] px-3 text-sm rounded-lg border transition-colors duration-150 ${
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
                <div key={i} className="flex gap-1.5 mb-1.5">
                  <textarea
                    value={ac}
                    onChange={(e) => {
                      const updated = [...(data.acceptanceCriteria || [])];
                      updated[i] = e.target.value;
                      updateNodeData(node.id, { acceptanceCriteria: updated });
                    }}
                    className={`flex-1 ${INPUT_BASE} px-3 py-2 placeholder:text-[#7A7A9A] resize-none`}
                    rows={2}
                  />
                  <button
                    onClick={() => {
                      const updated = (data.acceptanceCriteria || []).filter((_, j) => j !== i);
                      updateNodeData(node.id, { acceptanceCriteria: updated });
                    }}
                    className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg text-red-400 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-150 self-start"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
              <button
                onClick={() =>
                  updateNodeData(node.id, {
                    acceptanceCriteria: [...(data.acceptanceCriteria || []), ''],
                  })
                }
                className="flex items-center gap-1 text-sm text-[#C6FF4D] hover:text-[#d4ff70] mt-1 mb-3 transition-colors duration-150 min-h-[44px]"
              >
                <Plus size={16} />
                Add criterion
              </button>
            </>
          )}

          {/* Delete */}
          <button
            onClick={() => {
              deleteNode(node.id);
              dismiss();
            }}
            className="w-full flex items-center justify-center gap-2 bg-red-50/80 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200/50 dark:border-red-700/50 rounded-lg px-3 py-3 text-sm hover:bg-red-100/80 dark:hover:bg-red-900/50 transition-colors duration-150 min-h-[44px]"
          >
            <Trash2 size={16} />
            Delete Card
          </button>
        </div>
      </div>
    </div>
  );
}
