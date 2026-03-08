import { useState, useRef, useEffect } from 'react';
import { useMapStore } from '../../store/useMapStore';
import { api } from '../../api/client';
import type { ToolMode, CardType, Priority } from '../../types';
import { PRIORITY_COLORS } from '../../types';
import {
  Menu,
  X,
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

const tools: { mode: ToolMode; label: string; icon: typeof MousePointer2 }[] = [
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

interface MobileToolbarProps {
  onImport: () => void;
  onExport: () => void;
  onExportMarkdown: () => void;
}

export function MobileToolbar({ onImport, onExport, onExportMarkdown }: MobileToolbarProps) {
  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

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
  const showDescriptions = useMapStore((s) => s.showDescriptions);
  const toggleShowDescriptions = useMapStore((s) => s.toggleShowDescriptions);
  const showAcceptanceCriteria = useMapStore((s) => s.showAcceptanceCriteria);
  const toggleShowAcceptanceCriteria = useMapStore((s) => s.toggleShowAcceptanceCriteria);
  const isAIEditing = useMapStore((s) => s.isAIEditing);
  const showLastAIEdit = useMapStore((s) => s.showLastAIEdit);
  const toggleShowLastAIEdit = useMapStore((s) => s.toggleShowLastAIEdit);
  const lastAIEditNodeIds = useMapStore((s) => s.lastAIEditNodeIds);
  const projectRole = useMapStore((s) => s.projectRole);
  const projectId = useMapStore((s) => s.projectId);
  const arrangeLocal = useMapStore((s) => s.arrangeLocal);
  const hasNodes = useMapStore((s) => s.nodes.length > 0);
  const isViewer = projectRole === 'viewer';

  // Close popover on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as HTMLElement)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleToggleDescriptions = () => {
    toggleShowDescriptions();
    if (!isViewer && projectId) {
      const next = !showDescriptions;
      api.saveVisibility(projectId, next, showAcceptanceCriteria).catch(console.error);
    }
  };

  const handleToggleAC = () => {
    toggleShowAcceptanceCriteria();
    if (!isViewer && projectId) {
      const next = !showAcceptanceCriteria;
      api.saveVisibility(projectId, showDescriptions, next).catch(console.error);
    }
  };

  // Helper: close popover for mode-changing actions
  const withClose = (fn: () => void) => () => { fn(); setOpen(false); };

  const btnBase = 'min-h-[44px] px-3 py-2 text-sm font-medium transition-colors duration-150 flex items-center gap-2 rounded-lg w-full';
  const btnInactive = 'text-gray-700 dark:text-gray-200 hover:bg-gray-100/80 dark:hover:bg-gray-800/80';
  const btnActive = 'bg-blue-50/80 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300';
  const btnDisabled = 'opacity-40 cursor-not-allowed';

  return (
    <div ref={popoverRef} className={`absolute top-3 left-3 z-50 ${isAIEditing ? 'opacity-50 pointer-events-none' : ''}`}>
      {/* Toggle button */}
      <button
        onClick={() => setOpen(!open)}
        className="w-11 h-11 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 text-gray-700 dark:text-gray-200"
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Unsaved dot indicator */}
      {!isViewer && isDirty && !open && (
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full border-2 border-white dark:border-gray-900" />
      )}

      {/* Popover */}
      {open && (
        <div className="absolute top-13 left-0 w-64 max-h-[70vh] overflow-y-auto bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-2 space-y-1">

          {/* Tools section */}
          {!isViewer && (
            <>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 px-3 pt-1">Tools</p>
              {tools.map((tool) => {
                const Icon = tool.icon;
                return (
                  <button
                    key={tool.mode}
                    onClick={withClose(() => setToolMode(tool.mode))}
                    className={`${btnBase} ${toolMode === tool.mode ? btnActive : btnInactive}`}
                  >
                    <Icon size={18} />
                    {tool.label}
                  </button>
                );
              })}

              {/* Card type sub-options when addCard is active */}
              {toolMode === 'addCard' && (
                <div className="grid grid-cols-2 gap-1 pl-8 pr-1">
                  {cardTypeOptions.map((opt) => (
                    <button
                      key={opt.type}
                      onClick={withClose(() => setCardTypeToAdd(opt.type))}
                      className={`min-h-[40px] px-2 py-1.5 text-xs font-medium rounded-lg transition-colors duration-150 ${
                        cardTypeToAdd === opt.type
                          ? 'bg-emerald-50/80 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-gray-800/80'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Priority Filters */}
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 px-3 pt-2">Priority Filters</p>
          <div className="grid grid-cols-2 gap-1 px-1">
            {priorityOptions.map((opt) => {
              const isHidden = hiddenPriorities.has(opt.priority);
              return (
                <button
                  key={opt.priority}
                  onClick={() => togglePriority(opt.priority)}
                  className={`min-h-[44px] px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-150 flex items-center gap-2 ${
                    isHidden ? 'text-gray-400 dark:text-gray-500 bg-gray-50/50 dark:bg-gray-800/50' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100/80 dark:hover:bg-gray-800/80'
                  }`}
                >
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: isHidden ? '#d1d5db' : PRIORITY_COLORS[opt.priority] }}
                  />
                  {opt.label}
                </button>
              );
            })}
          </div>

          {/* Visibility */}
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 px-3 pt-2">Visibility</p>
          <button onClick={handleToggleDescriptions} className={`${btnBase} ${showDescriptions ? btnInactive : 'text-gray-400 dark:text-gray-500'}`}>
            <AlignLeft size={18} />
            Descriptions {showDescriptions ? 'On' : 'Off'}
          </button>
          <button onClick={handleToggleAC} className={`${btnBase} ${showAcceptanceCriteria ? btnInactive : 'text-gray-400 dark:text-gray-500'}`}>
            <ListChecks size={18} />
            Criteria {showAcceptanceCriteria ? 'On' : 'Off'}
          </button>

          {/* Actions */}
          {!isViewer && (
            <>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 px-3 pt-2">Actions</p>
              <div className="grid grid-cols-2 gap-1 px-1">
                <button onClick={() => { undo(); }} disabled={!canUndo} className={`min-h-[44px] px-3 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors duration-150 ${!canUndo ? btnDisabled : btnInactive}`}>
                  <Undo2 size={18} /> Undo
                </button>
                <button onClick={() => { redo(); }} disabled={!canRedo} className={`min-h-[44px] px-3 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors duration-150 ${!canRedo ? btnDisabled : btnInactive}`}>
                  <Redo2 size={18} /> Redo
                </button>
              </div>
              <button onClick={withClose(() => arrangeLocal())} disabled={!hasNodes} className={`${btnBase} ${!hasNodes ? btnDisabled : btnInactive}`}>
                <LayoutGrid size={18} /> Arrange
              </button>
              <button
                onClick={withClose(() => setVersionPanelOpen(!isVersionPanelOpen))}
                className={`${btnBase} ${isVersionPanelOpen ? btnActive : btnInactive}`}
              >
                <History size={18} /> History
              </button>
              <button
                onClick={() => toggleShowLastAIEdit()}
                disabled={lastAIEditNodeIds.size === 0}
                className={`${btnBase} ${lastAIEditNodeIds.size === 0 ? btnDisabled : showLastAIEdit ? 'bg-purple-50/80 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' : btnInactive}`}
              >
                <Sparkles size={18} /> AI Diff
              </button>
            </>
          )}

          {/* File */}
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 px-3 pt-2">File</p>
          <button onClick={withClose(onImport)} className={`${btnBase} ${btnInactive}`}>
            <Upload size={18} /> Import
          </button>
          <button onClick={withClose(onExport)} className={`${btnBase} ${btnInactive}`}>
            <Download size={18} /> Export
          </button>
          <button onClick={withClose(onExportMarkdown)} className={`${btnBase} ${btnInactive}`}>
            <FileText size={18} /> Export MD
          </button>
        </div>
      )}
    </div>
  );
}
