import { useEffect } from 'react';
import { useMapStore } from '../store/useMapStore';

export function useKeyboardShortcuts() {
  const undo = useMapStore((s) => s.undo);
  const redo = useMapStore((s) => s.redo);
  const isAIEditing = useMapStore((s) => s.isAIEditing);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (isAIEditing) return;

      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT'
      ) {
        return;
      }

      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((mod && e.key === 'z' && e.shiftKey) || (mod && e.key === 'y')) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo, isAIEditing]);
}
