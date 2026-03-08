import { useEffect, useRef } from 'react';
import { useMapStore } from '../../store/useMapStore';
import type { Priority, CardType, CardStatus } from '../../types';
import { STATUS_COLORS, STATUS_LABELS } from '../../types';
import { X, Plus, Trash2 } from 'lucide-react';

const statuses: CardStatus[] = ['not-started', 'in-progress', 'blocked', 'testing', 'done'];
import { AutoExpandTextarea } from '../ui/AutoExpandTextarea';

const priorities: Priority[] = ['must-have', 'should-have', 'could-have', 'wont-have'];
const estimates = ['XS', 'S', 'M', 'L', 'XL'];
const cardTypes: CardType[] = ['activity', 'step', 'story', 'annotation'];

export function CardEditor() {
  const selectedNodeId = useMapStore((s) => s.selectedNodeId);
  const nodes = useMapStore((s) => s.nodes);
  const updateNodeData = useMapStore((s) => s.updateNodeData);
  const deleteNode = useMapStore((s) => s.deleteNode);
  const setSelectedNodeId = useMapStore((s) => s.setSelectedNodeId);
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
    <div className="absolute right-0 top-0 h-full w-80 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-l border-gray-200/50 dark:border-gray-700/50 shadow-lg z-50 overflow-y-auto">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Edit Card</h3>
          <button
            onClick={() => setSelectedNodeId(null)}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-150"
          >
            <X size={16} />
          </button>
        </div>

        {/* Card Type */}
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Card Type</label>
        <select
          value={data.cardType}
          onChange={(e) => updateNodeData(node.id, { cardType: e.target.value as CardType })}
          className="w-full rounded-lg bg-white/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 px-2 py-1.5 text-sm mb-3 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-colors duration-150"
        >
          {cardTypes.map((ct) => (
            <option key={ct} value={ct}>{ct}</option>
          ))}
        </select>

        {/* Title */}
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Title</label>
        <AutoExpandTextarea
          minRows={1}
          maxRows={4}
          value={data.title}
          onChange={(e) => updateNodeData(node.id, { title: e.target.value })}
          className="w-full rounded-lg bg-white/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 px-2 py-1.5 text-sm mb-3 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-colors duration-150 placeholder:text-gray-400"
        />

        {/* Description */}
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Description</label>
        <textarea
          value={data.description}
          onChange={(e) => updateNodeData(node.id, { description: e.target.value })}
          className="w-full rounded-lg bg-white/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 px-2 py-1.5 text-sm mb-3 dark:text-gray-100 resize-y focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-colors duration-150 placeholder:text-gray-400"
          rows={3}
        />

        {/* Priority */}
        {data.cardType !== 'annotation' && (
          <>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Priority</label>
            <select
              value={data.priority}
              onChange={(e) => updateNodeData(node.id, { priority: e.target.value as Priority })}
              className="w-full rounded-lg bg-white/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 px-2 py-1.5 text-sm mb-3 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-colors duration-150"
            >
              {priorities.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </>
        )}

        {/* Estimate (stories only) */}
        {data.cardType === 'story' && (
          <>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Estimate</label>
            <div className="flex gap-1 mb-3">
              {estimates.map((est) => (
                <button
                  key={est}
                  onClick={() => updateNodeData(node.id, { estimate: est })}
                  className={`px-2 py-1 text-xs rounded-lg border transition-colors duration-150 ${
                    data.estimate === est
                      ? 'bg-emerald-100 border-emerald-400 text-emerald-700 dark:bg-emerald-900/40 dark:border-emerald-600 dark:text-emerald-300'
                      : 'bg-white/50 dark:bg-gray-800/50 border-gray-200/50 dark:border-gray-700/50 text-gray-600 dark:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-gray-700/50'
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
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Status</label>
            <div className="flex flex-wrap gap-1 mb-3">
              <button
                onClick={() => updateNodeData(node.id, { status: undefined })}
                className={`px-2 py-1 text-xs rounded-lg border transition-colors duration-150 ${
                  !data.status
                    ? 'bg-gray-100 border-gray-400 text-gray-700 dark:bg-gray-800 dark:border-gray-500 dark:text-gray-300'
                    : 'bg-white/50 dark:bg-gray-800/50 border-gray-200/50 dark:border-gray-700/50 text-gray-600 dark:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-gray-700/50'
                }`}
              >
                None
              </button>
              {statuses.map((s) => (
                <button
                  key={s}
                  onClick={() => updateNodeData(node.id, { status: s })}
                  className={`px-2 py-1 text-xs rounded-lg border transition-colors duration-150 ${
                    data.status === s
                      ? 'border-current'
                      : 'bg-white/50 dark:bg-gray-800/50 border-gray-200/50 dark:border-gray-700/50 hover:bg-gray-100/50 dark:hover:bg-gray-700/50'
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
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
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
                  className="flex-1 rounded-lg bg-white/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 px-2 py-1 text-xs dark:text-gray-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-colors duration-150 placeholder:text-gray-400"
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
              className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mt-1 mb-3 transition-colors duration-150"
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
