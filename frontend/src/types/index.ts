export type CardType = 'activity' | 'step' | 'story' | 'annotation';
export type Priority = 'must-have' | 'should-have' | 'could-have' | 'wont-have';
export type ToolMode = 'select' | 'addCard' | 'line' | 'box';

export interface StoryCardData {
  title: string;
  description: string;
  acceptanceCriteria: string[];
  cardType: CardType;
  priority: Priority;
  estimate?: string;
  color?: string;
  tags?: string[];
  width?: number;
  height?: number;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface CanvasState {
  nodes: import('@xyflow/react').Node<StoryCardData>[];
  edges: import('@xyflow/react').Edge[];
  viewport: { x: number; y: number; zoom: number };
  updated_at?: string;
}

export interface AIModel {
  id: string;
  name: string;
  provider: string;
}

export const PRIORITY_COLORS: Record<Priority, string> = {
  'must-have': '#ef4444',
  'should-have': '#f59e0b',
  'could-have': '#3b82f6',
  'wont-have': '#6b7280',
};

export interface VersionSummary {
  id: string;
  version_number: number;
  label: string;
  created_at: string;
}

export interface VersionDetail extends VersionSummary {
  nodes: import('@xyflow/react').Node<StoryCardData>[];
  edges: import('@xyflow/react').Edge[];
  viewport: { x: number; y: number; zoom: number };
}

export const CARD_TYPE_COLORS: Record<CardType, string> = {
  activity: '#7c3aed',
  step: '#2563eb',
  story: '#059669',
  annotation: '#d97706',
};
