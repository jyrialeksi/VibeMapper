import { useMapStore } from '../../store/useMapStore';
import type { ToolMode, CardType, Priority } from '../../types';
import { PRIORITY_COLORS } from '../../types';
import {
  MousePointer2,
  Plus,
  Undo2,
  Redo2,
  Upload,
  Download,
  FileText,
  History,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const tools: { mode: ToolMode; label: string; icon: LucideIcon }[] = [
  { mode: 'select', label: 'Select', icon: MousePointer2 },
  { mode: 'addCard', label: 'Add Card', icon: Plus },
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
  onExportMarkdown: () => void;
}

export function Toolbar({ onImport, onExport, onExportMarkdown }: ToolbarProps) {
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
    <div className="absolute top-3 left-3 z-50 flex items-center gap-2 flex-wrap max-w-[calc(100vw-24px)]">
      {/* Tool buttons */}
      <div className="flex bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <button
              key={tool.mode}
              onClick={() => setToolMode(tool.mode)}
              className={`px-3 py-2 text-sm font-medium border-r border-gray-200/30 dark:border-gray-700/30 last:border-r-0 transition-colors duration-150 flex items-center gap-1.5 ${
                toolMode === tool.mode
                  ? 'bg-blue-50/80 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50/80 dark:hover:bg-gray-800/80'
              }`}
              title={tool.label}
            >
              <Icon size={16} />
              {tool.label}
            </button>
          );
        })}
      </div>

      {/* Card type selector (shown when addCard tool active) */}
      {toolMode === 'addCard' && (
        <div className="flex bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
          {cardTypeOptions.map((opt) => (
            <button
              key={opt.type}
              onClick={() => setCardTypeToAdd(opt.type)}
              className={`px-3 py-2 text-sm font-medium border-r border-gray-200/30 dark:border-gray-700/30 last:border-r-0 transition-colors duration-150 ${
                cardTypeToAdd === opt.type
                  ? 'bg-emerald-50/80 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50/80 dark:hover:bg-gray-800/80'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {/* Import/Export */}
      <div className="flex bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
        <button
          onClick={onImport}
          className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50/80 dark:hover:bg-gray-800/80 border-r border-gray-200/30 dark:border-gray-700/30 transition-colors duration-150 flex items-center gap-1.5"
          title="Import"
        >
          <Upload size={15} />
          Import
        </button>
        <button
          onClick={onExport}
          className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50/80 dark:hover:bg-gray-800/80 border-r border-gray-200/30 dark:border-gray-700/30 transition-colors duration-150 flex items-center gap-1.5"
          title="Export"
        >
          <Download size={15} />
          Export
        </button>
        <button
          onClick={onExportMarkdown}
          className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50/80 dark:hover:bg-gray-800/80 transition-colors duration-150 flex items-center gap-1.5"
          title="Export visible map as Markdown"
        >
          <FileText size={15} />
          MD
        </button>
      </div>

      {/* Undo/Redo */}
      <div className="flex bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
        <button
          onClick={undo}
          disabled={!canUndo}
          className="px-3 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-50/80 dark:hover:bg-gray-800/80 border-r border-gray-200/30 dark:border-gray-700/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 size={16} />
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          className="px-3 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-50/80 dark:hover:bg-gray-800/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
          title="Redo (Ctrl+Shift+Z)"
        >
          <Redo2 size={16} />
        </button>
      </div>

      {/* Priority filters */}
      <div className="flex bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
        {priorityOptions.map((opt) => {
          const isHidden = hiddenPriorities.has(opt.priority);
          return (
            <button
              key={opt.priority}
              onClick={() => togglePriority(opt.priority)}
              className={`px-3 py-2 text-sm font-medium border-r border-gray-200/30 dark:border-gray-700/30 last:border-r-0 transition-colors duration-150 ${
                isHidden ? 'text-gray-400 dark:text-gray-500 bg-gray-50/50 dark:bg-gray-800/50' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50/80 dark:hover:bg-gray-800/80'
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
        className={`px-3 py-2 text-sm font-medium bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 transition-colors duration-150 flex items-center gap-1.5 ${
          isVersionPanelOpen ? 'bg-blue-50/80 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50/80 dark:hover:bg-gray-800/80'
        }`}
        title="Version History"
      >
        <History size={15} />
        History
      </button>

      {/* Save indicator */}
      {isDirty && (
        <span className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50/80 dark:bg-amber-900/40 backdrop-blur-xl px-2 py-1 rounded-lg border border-amber-200/50 dark:border-amber-700/50">
          Unsaved
        </span>
      )}
    </div>
  );
}
