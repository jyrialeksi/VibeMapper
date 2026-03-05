import { useState, useEffect, useCallback } from 'react';
import { useMapStore } from '../../store/useMapStore';
import { api } from '../../api/client';
import type { VersionSummary } from '../../types';
import { X, Save, RotateCcw } from 'lucide-react';

function getLabelColor(label: string): string {
  const lower = label.toLowerCase();
  if (lower.startsWith('ai')) return 'bg-purple-100 text-purple-700';
  if (lower === 'import') return 'bg-amber-100 text-amber-700';
  if (lower.startsWith('auto')) return 'bg-gray-100 text-gray-600';
  if (lower === 'restored') return 'bg-green-100 text-green-700';
  return 'bg-blue-100 text-blue-700';
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
    <div className="absolute right-0 top-0 h-full w-80 bg-white/80 backdrop-blur-xl border-l border-gray-200/50 shadow-lg z-50 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200/30">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Version History</h3>
          <button
            onClick={() => setOpen(false)}
            className="p-1 hover:bg-gray-100 rounded-md text-gray-400 hover:text-gray-600 transition-colors duration-150"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Create snapshot */}
      <div className="p-4 border-b border-gray-200/30">
        <div className="flex gap-2">
          <input
            type="text"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Snapshot name..."
            className="flex-1 rounded-lg bg-white/50 border border-gray-200/50 px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-colors duration-150 placeholder:text-gray-400"
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
          <button
            onClick={handleCreate}
            disabled={!newLabel.trim()}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 flex items-center gap-1.5"
          >
            <Save size={14} />
            Save
          </button>
        </div>
      </div>

      {/* Version list */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="p-4 text-center text-gray-400 text-sm">Loading...</div>
        )}
        {!loading && versions.length === 0 && (
          <div className="p-4 text-center text-gray-400 text-sm">No versions yet</div>
        )}
        {versions.map((v) => (
          <div key={v.id} className="p-3 border-b border-gray-100/50 hover:bg-gray-50/50 transition-colors duration-150">
            <div className="flex items-center justify-between mb-1">
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${getLabelColor(v.label)}`}
              >
                {v.label}
              </span>
              <span className="text-xs text-gray-400">v{v.version_number}</span>
            </div>
            <div className="text-xs text-gray-500 mb-2">
              {new Date(v.created_at).toLocaleString()}
            </div>
            {confirmRestore === v.id ? (
              <div className="flex gap-2">
                <button
                  onClick={() => handleRestore(v.id)}
                  className="text-xs px-2 py-1 bg-red-50/80 text-red-600 border border-red-200/50 rounded-lg hover:bg-red-100/80 transition-colors duration-150"
                >
                  Confirm Restore
                </button>
                <button
                  onClick={() => setConfirmRestore(null)}
                  className="text-xs px-2 py-1 text-gray-500 hover:text-gray-700 transition-colors duration-150"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmRestore(v.id)}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors duration-150"
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
