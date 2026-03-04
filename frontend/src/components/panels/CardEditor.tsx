import { useEffect, useRef } from 'react';
import { useMapStore } from '../../store/useMapStore';
import type { Priority, CardType } from '../../types';

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
    <div className="absolute right-0 top-0 h-full w-80 bg-white border-l border-gray-200 shadow-lg z-50 overflow-y-auto">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Edit Card</h3>
          <button
            onClick={() => setSelectedNodeId(null)}
            className="text-gray-400 hover:text-gray-600 text-lg leading-none"
          >
            &times;
          </button>
        </div>

        {/* Card Type */}
        <label className="block text-xs font-medium text-gray-500 mb-1">Card Type</label>
        <select
          value={data.cardType}
          onChange={(e) => updateNodeData(node.id, { cardType: e.target.value as CardType })}
          className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm mb-3"
        >
          {cardTypes.map((ct) => (
            <option key={ct} value={ct}>{ct}</option>
          ))}
        </select>

        {/* Title */}
        <label className="block text-xs font-medium text-gray-500 mb-1">Title</label>
        <input
          type="text"
          value={data.title}
          onChange={(e) => updateNodeData(node.id, { title: e.target.value })}
          className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm mb-3"
        />

        {/* Description */}
        <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
        <textarea
          value={data.description}
          onChange={(e) => updateNodeData(node.id, { description: e.target.value })}
          className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm mb-3 resize-y"
          rows={3}
        />

        {/* Priority */}
        {data.cardType !== 'annotation' && (
          <>
            <label className="block text-xs font-medium text-gray-500 mb-1">Priority</label>
            <select
              value={data.priority}
              onChange={(e) => updateNodeData(node.id, { priority: e.target.value as Priority })}
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm mb-3"
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
            <label className="block text-xs font-medium text-gray-500 mb-1">Estimate</label>
            <div className="flex gap-1 mb-3">
              {estimates.map((est) => (
                <button
                  key={est}
                  onClick={() => updateNodeData(node.id, { estimate: est })}
                  className={`px-2 py-1 text-xs rounded border ${
                    data.estimate === est
                      ? 'bg-emerald-100 border-emerald-400 text-emerald-700'
                      : 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {est}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Acceptance Criteria */}
        {data.cardType === 'story' && (
          <>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Acceptance Criteria
            </label>
            {(data.acceptanceCriteria || []).map((ac, i) => (
              <div key={i} className="flex gap-1 mb-1">
                <input
                  type="text"
                  value={ac}
                  onChange={(e) => {
                    const updated = [...(data.acceptanceCriteria || [])];
                    updated[i] = e.target.value;
                    updateNodeData(node.id, { acceptanceCriteria: updated });
                  }}
                  className="flex-1 border border-gray-300 rounded px-2 py-1 text-xs"
                />
                <button
                  onClick={() => {
                    const updated = (data.acceptanceCriteria || []).filter((_, j) => j !== i);
                    updateNodeData(node.id, { acceptanceCriteria: updated });
                  }}
                  className="text-red-400 hover:text-red-600 text-xs px-1"
                >
                  &times;
                </button>
              </div>
            ))}
            <button
              onClick={() =>
                updateNodeData(node.id, {
                  acceptanceCriteria: [...(data.acceptanceCriteria || []), ''],
                })
              }
              className="text-xs text-blue-600 hover:text-blue-800 mt-1 mb-3"
            >
              + Add criterion
            </button>
          </>
        )}

        {/* Tags */}
        <label className="block text-xs font-medium text-gray-500 mb-1 mt-2">
          Tags (comma-separated)
        </label>
        <input
          type="text"
          value={(data.tags || []).join(', ')}
          onChange={(e) =>
            updateNodeData(node.id, {
              tags: e.target.value
                .split(',')
                .map((t) => t.trim())
                .filter(Boolean),
            })
          }
          className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm mb-4"
        />

        {/* Delete */}
        <button
          onClick={() => {
            deleteNode(node.id);
          }}
          className="w-full bg-red-50 text-red-600 border border-red-200 rounded px-3 py-2 text-sm hover:bg-red-100"
        >
          Delete Card
        </button>
      </div>
    </div>
  );
}
