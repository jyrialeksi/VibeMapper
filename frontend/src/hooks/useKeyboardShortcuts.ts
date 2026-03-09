import { useEffect } from 'react';
import { useMapStore } from '../store/useMapStore';

export function useKeyboardShortcuts() {
  const undo = useMapStore((s) => s.undo);
  const redo = useMapStore((s) => s.redo);
  const isAIEditing = useMapStore((s) => s.isAIEditing);
  const selectedNodeId = useMapStore((s) => s.selectedNodeId);
  const setSelectedNodeId = useMapStore((s) => s.setSelectedNodeId);
  const setActivePanel = useMapStore((s) => s.setActivePanel);
  const setMobileEditingNodeId = useMapStore((s) => s.setMobileEditingNodeId);
  const deleteNode = useMapStore((s) => s.deleteNode);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (isAIEditing) return;

      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT';

      // Escape works even when focused on inputs
      if (e.key === 'Escape') {
        e.preventDefault();
        setSelectedNodeId(null);
        setActivePanel('none');
        setMobileEditingNodeId(null);
        return;
      }

      if (isInput) return;

      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((mod && e.key === 'z' && e.shiftKey) || (mod && e.key === 'y')) {
        e.preventDefault();
        redo();
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNodeId) {
        e.preventDefault();
        deleteNode(selectedNodeId);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo, isAIEditing, selectedNodeId, setSelectedNodeId, setActivePanel, setMobileEditingNodeId, deleteNode]);
}
