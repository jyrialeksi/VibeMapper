export type CardType = 'activity' | 'step' | 'story' | 'annotation';
export type Priority = 'must-have' | 'should-have' | 'could-have' | 'wont-have';
export type CardStatus = 'not-started' | 'in-progress' | 'blocked' | 'testing' | 'done';
export type ToolMode = 'select' | 'addCard' | 'line' | 'box';
export type HighlightType = 'added' | 'modified';

export interface StoryCardData {
  [key: string]: unknown;
  title: string;
  description: string;
  acceptanceCriteria: string[];
  cardType: CardType;
  priority: Priority;
  estimate?: string;
  status?: CardStatus;
  color?: string;
  width?: number;
  height?: number;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  owner_id?: string;
  role?: 'owner' | 'editor' | 'viewer';
  owner_name?: string;
}

export interface Share {
  id: string;
  project_id: string;
  user_id: string | null;
  invited_email: string;
  role: 'viewer' | 'editor';
  share_token: string | null;
  created_at: string;
  expires_at: string | null;
  user_name?: string;
}

export interface Comment {
  id: string;
  project_id: string;
  node_id: string;
  user_id: string;
  content: string;
  is_system_message: boolean;
  created_at: string;
  user_name: string;
  user_picture: string;
}

export interface CanvasState {
  nodes: import('@xyflow/react').Node<StoryCardData>[];
  edges: import('@xyflow/react').Edge[];
  viewport: { x: number; y: number; zoom: number };
  updated_at?: string;
  role?: 'owner' | 'editor' | 'viewer';
  showDescriptions?: boolean;
  showAcceptanceCriteria?: boolean;
}

export interface AIModel {
  id: string;
  name: string;
  provider: string;
}

export const PRIORITY_COLORS: Record<Priority, string> = {
  'must-have': '#FF3CAC',
  'should-have': '#C6FF4D',
  'could-have': '#00F5D4',
  'wont-have': '#7A7A9A',
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

export interface EditOperation {
  type: 'add_node' | 'remove_node' | 'update_node' | 'move_node' | 'add_edge' | 'remove_edge';
  id?: string;
  node?: import('@xyflow/react').Node<StoryCardData>;
  edge?: import('@xyflow/react').Edge;
  changes?: { data?: Partial<StoryCardData>; position?: { x: number; y: number } };
  position?: { x: number; y: number };
}

export interface GenerateResponse {
  mode: 'generate';
  nodes: unknown[];
  edges: unknown[];
}

export interface EditResponse {
  mode: 'edit';
  operations: EditOperation[];
}

export type AIGenerateResult = GenerateResponse | EditResponse;

export const CARD_TYPE_COLORS: Record<CardType, string> = {
  activity: '#7B2FFF',
  step: '#00F5D4',
  story: '#C6FF4D',
  annotation: '#C6FF4D',
};

export const STATUS_COLORS: Record<CardStatus, string> = {
  'not-started': '#9ca3af',
  'in-progress': '#3b82f6',
  'blocked': '#ef4444',
  'testing': '#f59e0b',
  'done': '#22c55e',
};

export const STATUS_LABELS: Record<CardStatus, string> = {
  'not-started': 'Not Started',
  'in-progress': 'In Progress',
  'blocked': 'Blocked',
  'testing': 'Testing',
  'done': 'Done',
};
