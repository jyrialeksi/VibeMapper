import { useState, useEffect, useCallback } from 'react';
import { useMapStore } from '../store/useMapStore';
import type { CardType } from '../types';

interface CardStyle {
  width: number;
  height: number;
  borderColor: string;
  bgColor: string;
  borderStyle: 'solid' | 'dashed';
  label: string;
  barColor?: string;
}

const CARD_STYLES: Record<CardType, CardStyle> = {
  activity: {
    width: 260,
    height: 44,
    borderColor: '#7B2FFF',
    bgColor: 'rgba(123, 47, 255, 0.08)',
    borderStyle: 'solid',
    label: 'Activity',
  },
  step: {
    width: 260,
    height: 44,
    borderColor: '#00F5D4',
    bgColor: 'rgba(0, 245, 212, 0.08)',
    borderStyle: 'solid',
    label: 'Step',
  },
  story: {
    width: 260,
    height: 56,
    borderColor: '#FF3CAC',
    bgColor: 'rgba(255, 60, 172, 0.08)',
    borderStyle: 'solid',
    label: 'Story Card',
    barColor: '#FF3CAC',
  },
  annotation: {
    width: 200,
    height: 100,
    borderColor: '#C6FF4D',
    bgColor: 'rgba(198, 255, 77, 0.06)',
    borderStyle: 'dashed',
    label: 'Note',
  },
};

export function CardCursorOutline() {
  const toolMode = useMapStore((s) => s.toolMode);
  const cardTypeToAdd = useMapStore((s) => s.cardTypeToAdd);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const rfContainer = (e.currentTarget as HTMLElement).closest('.react-flow') as HTMLElement | null;
    if (!rfContainer) return;
    const rect = rfContainer.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setMousePos(null);
  }, []);

  useEffect(() => {
    if (toolMode !== 'addCard') {
      setMousePos(null);
      return;
    }

    const pane = document.querySelector('.react-flow__pane') as HTMLElement | null;
    if (!pane) return;

    pane.addEventListener('mousemove', handleMouseMove);
    pane.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      pane.removeEventListener('mousemove', handleMouseMove);
      pane.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [toolMode, handleMouseMove, handleMouseLeave]);

  if (toolMode !== 'addCard' || !mousePos) return null;

  const style = CARD_STYLES[cardTypeToAdd] || CARD_STYLES.story;

  return (
    <div
      style={{
        position: 'absolute',
        left: mousePos.x,
        top: mousePos.y,
        width: style.width,
        height: style.height,
        border: `2px ${style.borderStyle} ${style.borderColor}`,
        borderRadius: 8,
        backgroundColor: style.bgColor,
        opacity: 0.7,
        pointerEvents: 'none',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: style.barColor
          ? `inset 6px 0 0 0 ${style.barColor}`
          : undefined,
      }}
    >
      <span
        style={{
          fontSize: 12,
          fontWeight: 500,
          color: style.borderColor,
          opacity: 0.9,
          userSelect: 'none',
        }}
      >
        {style.label}
      </span>
    </div>
  );
}
