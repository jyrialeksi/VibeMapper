import { useState, useEffect, useCallback } from 'react';
import { useMapStore } from '../../store/useMapStore';
import { api } from '../../api/client';
import type { VersionSummary } from '../../types';
import { X, Save, RotateCcw } from 'lucide-react';

function getLabelColor(label: string): string {
  const lower = label.toLowerCase();
  if (lower.startsWith('ai')) return 'bg-[#7B2FFF]/15 text-[#7B2FFF] dark:bg-[#7B2FFF]/25 dark:text-[#C6FF4D]';
  if (lower === 'import') return 'bg-[#C6FF4D]/15 text-[#080810] dark:bg-[#C6FF4D]/20 dark:text-[#C6FF4D]';
  if (lower.startsWith('auto')) return 'bg-[#7A7A9A]/15 text-[#7A7A9A]';
  if (lower === 'restored') return 'bg-[#00F5D4]/15 text-[#00F5D4]';
  return 'bg-[#7B2FFF]/10 text-[#7B2FFF] dark:bg-[#7B2FFF]/20 dark:text-[#C6FF4D]';
}

export function VersionHistoryPanel() {
  const projectId = useMapStore((s) => s.projectId);
  const isOpen = useMapStore((s) => s.isVersionPanelOpen);
  const setOpen = useMapStore((s) => s.setVersionPanelOpen);
  const loadCanvas = useMapStore((s) => s.loadCanvas);

  const [versions, setVersions] = useState<VersionSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [confirmRestore, setConfirmRestore] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const data = await api.listVersions(projectId);
      setVersions(data);
    } catch (err) {
      console.error('Failed to load versions:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (isOpen) refresh();
  }, [isOpen, refresh]);

  const handleCreate = async () => {
    if (!projectId || !newLabel.trim()) return;
    try {
      await api.createNamedVersion(projectId, newLabel.trim());
      setNewLabel('');
      refresh();
    } catch (err) {
      console.error('Failed to create version:', err);
    }
  };

  const handleRestore = async (versionId: string) => {
    if (!projectId) return;
    try {
      await api.restoreVersion(projectId, versionId);
      const state = await api.loadCanvas(projectId);
      loadCanvas(state.nodes, state.edges, state.viewport);
      setConfirmRestore(null);
      refresh();
    } catch (err) {
      console.error('Failed to restore version:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute right-0 top-0 h-full w-80 bg-white/85 dark:bg-[#0F0F1E]/85 backdrop-blur-xl border-l border-[rgba(123,47,255,0.12)] dark:border-[rgba(198,255,77,0.12)] shadow-lg z-50 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-[rgba(123,47,255,0.08)] dark:border-[rgba(198,255,77,0.08)]">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-[#080810] dark:text-[#F0EEFF]">Version History</h3>
          <button
            onClick={() => setOpen(false)}
            className="p-1 hover:bg-[#7B2FFF]/10 dark:hover:bg-[#7B2FFF]/20 rounded-md text-[#7A7A9A] hover:text-[#7B2FFF] transition-colors duration-150"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Create snapshot */}
      <div className="p-4 border-b border-[rgba(123,47,255,0.08)] dark:border-[rgba(198,255,77,0.08)]">
        <div className="flex gap-2">
          <input
            type="text"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Snapshot name..."
            className="flex-1 rounded-lg bg-white/50 dark:bg-[#16162A]/50 border border-[rgba(123,47,255,0.12)] dark:border-[rgba(198,255,77,0.12)] px-2 py-1.5 text-sm dark:text-[#F0EEFF] focus:ring-2 focus:ring-[#7B2FFF]/20 focus:border-[#7B2FFF]/40 transition-colors duration-150 placeholder:text-[#7A7A9A]"
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
          <button
            onClick={handleCreate}
            disabled={!newLabel.trim()}
            className="px-3 py-1.5 text-sm btn-primary rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 flex items-center gap-1.5"
          >
            <Save size={14} />
            Save
          </button>
        </div>
      </div>

      {/* Version list */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="p-4 text-center text-[#7A7A9A] text-sm">Loading...</div>
        )}
        {!loading && versions.length === 0 && (
          <div className="p-4 text-center text-[#7A7A9A] text-sm">No versions yet</div>
        )}
        {versions.map((v) => (
          <div key={v.id} className="p-3 border-b border-[rgba(123,47,255,0.05)] dark:border-[rgba(198,255,77,0.05)] hover:bg-[#7B2FFF]/5 dark:hover:bg-[#7B2FFF]/10 transition-colors duration-150">
            <div className="flex items-center justify-between mb-1">
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${getLabelColor(v.label)}`}
              >
                {v.label}
              </span>
              <span className="text-xs text-[#7A7A9A]">v{v.version_number}</span>
            </div>
            <div className="text-xs text-[#7A7A9A] mb-2">
              {new Date(v.created_at).toLocaleString()}
            </div>
            {confirmRestore === v.id ? (
              <div className="flex gap-2">
                <button
                  onClick={() => handleRestore(v.id)}
                  className="text-xs px-2 py-1 bg-red-50/80 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200/50 dark:border-red-700/50 rounded-lg hover:bg-red-100/80 dark:hover:bg-red-900/50 transition-colors duration-150"
                >
                  Confirm Restore
                </button>
                <button
                  onClick={() => setConfirmRestore(null)}
                  className="text-xs px-2 py-1 text-[#7A7A9A] hover:text-[#F0EEFF] transition-colors duration-150"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmRestore(v.id)}
                className="flex items-center gap-1 text-xs text-[#7B2FFF] dark:text-[#C6FF4D] hover:text-[#7B2FFF]/80 dark:hover:text-[#C6FF4D]/80 transition-colors duration-150"
              >
                <RotateCcw size={12} />
                Restore
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
