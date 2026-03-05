import { useEffect, useRef } from 'react';
import { useMapStore } from '../store/useMapStore';

export function HighlightClearer() {
  const highlightedNodes = useMapStore((s) => s.highlightedNodes);
  const clearHighlights = useMapStore((s) => s.clearHighlights);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (highlightedNodes.size > 0) {
      timerRef.current = setTimeout(() => {
        clearHighlights();
        timerRef.current = null;
      }, 5000);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [highlightedNodes, clearHighlights]);

  return null;
}
