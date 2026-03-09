import { useMapStore } from '../../store/useMapStore';
import type { ToolMode, CardType, Priority } from '../../types';
import { PRIORITY_COLORS } from '../../types';
import { GLASS_PANEL, GLASS_BORDER_SUBTLE, BTN_ACTIVE, BTN_INACTIVE } from '../../styles/shared';
import { useVisibilityToggle } from '../../hooks/useVisibilityToggle';
import {
  MousePointer2,
  Plus,
  Undo2,
  Redo2,
  Upload,
  Download,
  FileText,
  History,
  AlignLeft,
  ListChecks,
  Sparkles,
  LayoutGrid,
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

const glass = GLASS_PANEL;
const glassInner = GLASS_BORDER_SUBTLE;

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
  const { showDescriptions, showAcceptanceCriteria, handleToggleDescriptions, handleToggleAC } = useVisibilityToggle();
  const isAIEditing = useMapStore((s) => s.isAIEditing);
  const showLastAIEdit = useMapStore((s) => s.showLastAIEdit);
  const toggleShowLastAIEdit = useMapStore((s) => s.toggleShowLastAIEdit);
  const lastAIEditNodeIds = useMapStore((s) => s.lastAIEditNodeIds);
  const projectRole = useMapStore((s) => s.projectRole);
  const arrangeLocal = useMapStore((s) => s.arrangeLocal);
  const hasNodes = useMapStore((s) => s.nodes.length > 0);
  const isViewer = projectRole === 'viewer';

  return (
    <div className={`absolute top-3 left-3 z-50 flex items-center gap-2 flex-wrap max-w-[calc(100vw-24px)] ${isAIEditing ? 'opacity-50 pointer-events-none' : ''}`}>
      {/* Tool buttons (hidden for viewers) */}
      {!isViewer && (
        <div className={`flex rounded-xl shadow-sm overflow-hidden ${glass}`}>
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.mode}
                onClick={() => setToolMode(tool.mode)}
                className={`font-mono-brand px-3 py-2 text-sm font-medium border-r ${glassInner} last:border-r-0 transition-colors duration-150 flex items-center gap-1.5 ${
                  toolMode === tool.mode
                    ? BTN_ACTIVE
                    : BTN_INACTIVE
                }`}
                title={tool.label}
              >
                <Icon size={16} />
                {tool.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Card type selector (shown when addCard tool active, hidden for viewers) */}
      {!isViewer && toolMode === 'addCard' && (
        <div className={`flex rounded-xl shadow-sm overflow-hidden ${glass}`}>
          {cardTypeOptions.map((opt) => (
            <button
              key={opt.type}
              onClick={() => setCardTypeToAdd(opt.type)}
              className={`font-mono-brand px-3 py-2 text-sm font-medium border-r ${glassInner} last:border-r-0 transition-colors duration-150 ${
                cardTypeToAdd === opt.type
                  ? 'bg-[#7B2FFF]/10 text-[#7B2FFF] dark:bg-[#7B2FFF]/20 dark:text-[#C6FF4D]'
                  : 'text-[#080810]/70 dark:text-[#F0EEFF]/70 hover:bg-[#7B2FFF]/5 dark:hover:bg-[#7B2FFF]/10'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {/* Import/Export */}
      <div className={`flex rounded-xl shadow-sm overflow-hidden ${glass}`}>
        <button
          onClick={onImport}
          className={`px-3 py-2 text-sm text-[#080810]/70 dark:text-[#F0EEFF]/70 hover:bg-[#7B2FFF]/5 dark:hover:bg-[#7B2FFF]/10 border-r ${glassInner} transition-colors duration-150 flex items-center gap-1.5`}
          title="Import"
        >
          <Upload size={15} />
          Import
        </button>
        <button
          onClick={onExport}
          className={`px-3 py-2 text-sm text-[#080810]/70 dark:text-[#F0EEFF]/70 hover:bg-[#7B2FFF]/5 dark:hover:bg-[#7B2FFF]/10 border-r ${glassInner} transition-colors duration-150 flex items-center gap-1.5`}
          title="Export"
        >
          <Download size={15} />
          Export
        </button>
        <button
          onClick={onExportMarkdown}
          className="px-3 py-2 text-sm text-[#080810]/70 dark:text-[#F0EEFF]/70 hover:bg-[#7B2FFF]/5 dark:hover:bg-[#7B2FFF]/10 transition-colors duration-150 flex items-center gap-1.5"
          title="Export visible map as Markdown"
        >
          <FileText size={15} />
          MD
        </button>
      </div>

      {/* Undo/Redo (hidden for viewers) */}
      {!isViewer && (
        <div className={`flex rounded-xl shadow-sm overflow-hidden ${glass}`}>
          <button
            onClick={undo}
            disabled={!canUndo}
            className={`px-3 py-2 text-[#080810]/70 dark:text-[#F0EEFF]/70 hover:bg-[#7B2FFF]/5 dark:hover:bg-[#7B2FFF]/10 border-r ${glassInner} disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150`}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 size={16} />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className="px-3 py-2 text-[#080810]/70 dark:text-[#F0EEFF]/70 hover:bg-[#7B2FFF]/5 dark:hover:bg-[#7B2FFF]/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
            title="Redo (Ctrl+Shift+Z)"
          >
            <Redo2 size={16} />
          </button>
        </div>
      )}

      {/* Priority filters */}
      <div className={`flex rounded-xl shadow-sm overflow-hidden ${glass}`}>
        {priorityOptions.map((opt) => {
          const isHidden = hiddenPriorities.has(opt.priority);
          return (
            <button
              key={opt.priority}
              onClick={() => togglePriority(opt.priority)}
              className={`px-3 py-2 text-sm font-medium border-r ${glassInner} last:border-r-0 transition-colors duration-150 ${
                isHidden ? 'text-[#7A7A9A]/50 bg-[#7A7A9A]/5' : 'text-[#080810]/80 dark:text-[#F0EEFF]/80 hover:bg-[#7B2FFF]/5 dark:hover:bg-[#7B2FFF]/10'
              }`}
              title={`${isHidden ? 'Show' : 'Hide'} ${opt.label} Have stories`}
            >
              <span
                className="inline-block w-2.5 h-2.5 rounded-full mr-1.5 align-middle"
                style={{
                  backgroundColor: isHidden ? '#7A7A9A' : PRIORITY_COLORS[opt.priority],
                }}
              />
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Card content visibility */}
      <div className={`flex rounded-xl shadow-sm overflow-hidden ${glass}`}>
        <button
          onClick={handleToggleDescriptions}
          className={`px-3 py-2 text-sm font-medium border-r ${glassInner} transition-colors duration-150 flex items-center gap-1.5 ${
            showDescriptions
              ? 'text-[#080810]/80 dark:text-[#F0EEFF]/80 hover:bg-[#7B2FFF]/5 dark:hover:bg-[#7B2FFF]/10'
              : 'text-[#7A7A9A]/50'
          }`}
          title={`${showDescriptions ? 'Hide' : 'Show'} descriptions`}
        >
          <AlignLeft size={15} />
          Desc
        </button>
        <button
          onClick={handleToggleAC}
          className={`px-3 py-2 text-sm font-medium transition-colors duration-150 flex items-center gap-1.5 ${
            showAcceptanceCriteria
              ? 'text-[#080810]/80 dark:text-[#F0EEFF]/80 hover:bg-[#7B2FFF]/5 dark:hover:bg-[#7B2FFF]/10'
              : 'text-[#7A7A9A]/50'
          }`}
          title={`${showAcceptanceCriteria ? 'Hide' : 'Show'} acceptance criteria`}
        >
          <ListChecks size={15} />
          AC
        </button>
      </div>

      {/* Auto-arrange (hidden for viewers) */}
      {!isViewer && (
        <button
          onClick={() => arrangeLocal()}
          disabled={!hasNodes}
          className={`px-3 py-2 text-sm font-medium rounded-xl shadow-sm transition-colors duration-150 flex items-center gap-1.5 text-[#080810]/70 dark:text-[#F0EEFF]/70 hover:bg-[#7B2FFF]/5 dark:hover:bg-[#7B2FFF]/10 disabled:opacity-40 disabled:cursor-not-allowed ${glass}`}
          title="Auto-arrange nodes"
        >
          <LayoutGrid size={15} />
          Arrange
        </button>
      )}

      {/* History (hidden for viewers) */}
      {!isViewer && (
        <button
          onClick={() => setVersionPanelOpen(!isVersionPanelOpen)}
          className={`px-3 py-2 text-sm font-medium rounded-xl shadow-sm transition-colors duration-150 flex items-center gap-1.5 ${glass} ${
            isVersionPanelOpen ? BTN_ACTIVE : BTN_INACTIVE
          }`}
          title="Version History"
        >
          <History size={15} />
          History
        </button>
      )}

      {/* AI Diff toggle (hidden for viewers) */}
      {!isViewer && (
        <button
          onClick={toggleShowLastAIEdit}
          disabled={lastAIEditNodeIds.size === 0}
          className={`px-3 py-2 text-sm font-medium rounded-xl shadow-sm transition-colors duration-150 flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed ${glass} ${
            showLastAIEdit ? BTN_ACTIVE : BTN_INACTIVE
          }`}
          title="Highlight nodes from last AI edit"
        >
          <Sparkles size={15} />
          AI Diff
        </button>
      )}

      {/* Save indicator (hidden for viewers) */}
      {!isViewer && isDirty && (
        <span className="text-xs text-[#C6FF4D] bg-[#C6FF4D]/10 dark:bg-[#C6FF4D]/15 backdrop-blur-xl px-2 py-1 rounded-lg border border-[#C6FF4D]/20">
          Unsaved
        </span>
      )}
    </div>
  );
}
