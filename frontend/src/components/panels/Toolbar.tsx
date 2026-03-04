import { useMapStore } from '../../store/useMapStore';
import type { ToolMode, CardType, Priority } from '../../types';
import { PRIORITY_COLORS } from '../../types';

const tools: { mode: ToolMode; label: string; icon: string }[] = [
  { mode: 'select', label: 'Select', icon: '↖' },
  { mode: 'addCard', label: 'Add Card', icon: '＋' },
  { mode: 'line', label: 'Line', icon: '╱' },
  { mode: 'box', label: 'Box', icon: '▭' },
];

const priorityOptions: { priority: Priority; label: string }[] = [
  { priority: 'must-have', label: 'Must' },
  { priority: 'should-have', label: 'Should' },
  { priority: 'could-have', label: 'Could' },
  { priority: 'wont-have', label: "Won't" },
];

const cardTypeOptions: { type: CardType; label: string }[] = [
  { type: 'activity', label: 'Activity' },
  { type: 'step', label: 'Step' },
  { type: 'story', label: 'Story' },
  { type: 'annotation', label: 'Note' },
];

interface ToolbarProps {
  onImport: () => void;
  onExport: () => void;
}

export function Toolbar({ onImport, onExport }: ToolbarProps) {
  const toolMode = useMapStore((s) => s.toolMode);
  const setToolMode = useMapStore((s) => s.setToolMode);
  const cardTypeToAdd = useMapStore((s) => s.cardTypeToAdd);
  const setCardTypeToAdd = useMapStore((s) => s.setCardTypeToAdd);
  const isDirty = useMapStore((s) => s.isDirty);
  const canUndo = useMapStore((s) => s.canUndo);
  const canRedo = useMapStore((s) => s.canRedo);
  const undo = useMapStore((s) => s.undo);
  const redo = useMapStore((s) => s.redo);
  const isVersionPanelOpen = useMapStore((s) => s.isVersionPanelOpen);
  const setVersionPanelOpen = useMapStore((s) => s.setVersionPanelOpen);
  const hiddenPriorities = useMapStore((s) => s.hiddenPriorities);
  const togglePriority = useMapStore((s) => s.togglePriority);

  return (
    <div className="absolute top-3 left-3 z-50 flex items-center gap-2">
      {/* Tool buttons */}
      <div className="flex bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        {tools.map((tool) => (
          <button
            key={tool.mode}
            onClick={() => setToolMode(tool.mode)}
            className={`px-3 py-2 text-sm font-medium border-r border-gray-200 last:border-r-0 transition-colors ${
              toolMode === tool.mode
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
            title={tool.label}
          >
            <span className="mr-1">{tool.icon}</span>
            {tool.label}
          </button>
        ))}
      </div>

      {/* Card type selector (shown when addCard tool active) */}
      {toolMode === 'addCard' && (
        <div className="flex bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          {cardTypeOptions.map((opt) => (
            <button
              key={opt.type}
              onClick={() => setCardTypeToAdd(opt.type)}
              className={`px-3 py-2 text-sm font-medium border-r border-gray-200 last:border-r-0 transition-colors ${
                cardTypeToAdd === opt.type
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {/* Import/Export */}
      <div className="flex bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        <button
          onClick={onImport}
          className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 border-r border-gray-200"
        >
          Import
        </button>
        <button
          onClick={onExport}
          className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
        >
          Export
        </button>
      </div>

      {/* Undo/Redo */}
      <div className="flex bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        <button
          onClick={undo}
          disabled={!canUndo}
          className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 border-r border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
          title="Undo (Ctrl+Z)"
        >
          ↩
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          title="Redo (Ctrl+Shift+Z)"
        >
          ↪
        </button>
      </div>

      {/* Priority filters */}
      <div className="flex bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        {priorityOptions.map((opt) => {
          const isHidden = hiddenPriorities.has(opt.priority);
          return (
            <button
              key={opt.priority}
              onClick={() => togglePriority(opt.priority)}
              className={`px-3 py-2 text-sm font-medium border-r border-gray-200 last:border-r-0 transition-colors ${
                isHidden ? 'text-gray-400 bg-gray-50' : 'text-gray-700 hover:bg-gray-50'
              }`}
              title={`${isHidden ? 'Show' : 'Hide'} ${opt.label} Have stories`}
            >
              <span
                className="inline-block w-2.5 h-2.5 rounded-full mr-1.5 align-middle"
                style={{
                  backgroundColor: isHidden ? '#d1d5db' : PRIORITY_COLORS[opt.priority],
                }}
              />
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* History */}
      <button
        onClick={() => setVersionPanelOpen(!isVersionPanelOpen)}
        className={`px-3 py-2 text-sm font-medium bg-white rounded-lg shadow-md border border-gray-200 transition-colors ${
          isVersionPanelOpen ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
        }`}
        title="Version History"
      >
        History
      </button>

      {/* Save indicator */}
      {isDirty && (
        <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-200">
          Unsaved
        </span>
      )}
    </div>
  );
}
