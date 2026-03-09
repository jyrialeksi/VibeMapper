import { useEffect, useRef } from 'react';
import { useMapStore } from '../store/useMapStore';
import { api } from '../api/client';

export function useAutoSave() {
  const isDirty = useMapStore((s) => s.isDirty);
  const nodes = useMapStore((s) => s.nodes);
  const edges = useMapStore((s) => s.edges);
  const viewport = useMapStore((s) => s.viewport);
  const projectId = useMapStore((s) => s.projectId);
  const projectRole = useMapStore((s) => s.projectRole);
  const isCanvasLoading = useMapStore((s) => s.isCanvasLoading);
  const setDirty = useMapStore((s) => s.setDirty);
  const setPendingSaveLabel = useMapStore((s) => s.setPendingSaveLabel);
  const setSaveError = useMapStore((s) => s.setSaveError);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isDirty || !projectId || projectRole === 'viewer' || isCanvasLoading) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      try {
        const label = useMapStore.getState().pendingSaveLabel;
        await api.saveCanvas(projectId, { nodes, edges, viewport, label: label || undefined });
        setDirty(false);
        setSaveError(null);
        if (label) setPendingSaveLabel(null);
      } catch (err) {
        console.error('Auto-save failed:', err);
        setSaveError(err instanceof Error ? err.message : 'Failed to save');
      }
    }, 2000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isDirty, nodes, edges, viewport, projectId, projectRole, isCanvasLoading, setDirty, setPendingSaveLabel, setSaveError]);
}
