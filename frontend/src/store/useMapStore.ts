import { create } from 'zustand';
import {
  type Node,
  type Edge,
  type Viewport,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
} from '@xyflow/react';
import type { StoryCardData, ToolMode, CardType, Priority, EditOperation, HighlightType } from '../types';

interface Snapshot {
  nodes: Node<StoryCardData>[];
  edges: Edge[];
}

const MAX_HISTORY = 50;

export type PendingLayout = 'none' | 'correctOverlap' | 'fullArrange';
export type ActivePanel = 'none' | 'toolbar' | 'ai' | 'cardEditor';

interface MapState {
  // Canvas state
  nodes: Node<StoryCardData>[];
  edges: Edge[];
  viewport: Viewport;

  // UI state
  isDirty: boolean;
  selectedNodeId: string | null;
  toolMode: ToolMode;
  cardTypeToAdd: CardType;
  projectId: string | null;

  // Undo/redo state
  undoStack: Snapshot[];
  redoStack: Snapshot[];
  canUndo: boolean;
  canRedo: boolean;

  // Layout correction
  pendingLayout: PendingLayout;

  // Priority filter state
  hiddenPriorities: Set<Priority>;

  // Highlight state
  highlightedNodes: Map<string, HighlightType>;

  // AI editing state
  isAIEditing: boolean;
  cancelAIEdit: (() => void) | null;

  // Last AI edit tracking
  lastAIEditNodeIds: Set<string>;
  showLastAIEdit: boolean;

  // Card content visibility
  showDescriptions: boolean;
  showAcceptanceCriteria: boolean;

  // Version state
  pendingSaveLabel: string | null;
  isVersionPanelOpen: boolean;

  // Project role (for sharing permissions)
  projectRole: 'owner' | 'editor' | 'viewer';

  // Canvas loading state
  isCanvasLoading: boolean;
  canvasLoadError: string | null;

  // Auto-save error
  saveError: string | null;

  // Mobile state
  mobileEditingNodeId: string | null;
  activePanel: ActivePanel;
  aiPromptText: string;

  // Actions
  setNodes: (nodes: Node<StoryCardData>[]) => void;
  setEdges: (edges: Edge[]) => void;
  setViewport: (viewport: Viewport) => void;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  addNode: (node: Node<StoryCardData>) => void;
  updateNodeData: (id: string, data: Partial<StoryCardData>) => void;
  deleteNode: (id: string) => void;
  setSelectedNodeId: (id: string | null) => void;
  setToolMode: (mode: ToolMode) => void;
  setCardTypeToAdd: (type: CardType) => void;
  setProjectId: (id: string | null) => void;
  setDirty: (dirty: boolean) => void;
  startLoadingProject: (projectId: string) => void;
  setCanvasLoadError: (error: string | null) => void;
  setSaveError: (error: string | null) => void;
  loadCanvas: (nodes: Node<StoryCardData>[], edges: Edge[], viewport: Viewport, visibility?: { showDescriptions?: boolean; showAcceptanceCriteria?: boolean }) => void;
  mergeNodes: (newNodes: Node<StoryCardData>[], newEdges: Edge[]) => void;
  applyArrangement: (positions: { id: string; position: { x: number; y: number } }[]) => void;
  applyOperations: (operations: EditOperation[]) => void;
  arrangeLocal: () => void;

  // Undo/redo actions
  pushSnapshot: () => void;
  undo: () => void;
  redo: () => void;
  clearHistory: () => void;

  // Layout correction actions
  setPendingLayout: (action: PendingLayout) => void;

  // Priority filter actions
  togglePriority: (priority: Priority) => void;

  // Highlight actions
  clearHighlights: () => void;

  // AI editing actions
  setAIEditing: (editing: boolean) => void;
  setCancelAIEdit: (fn: (() => void) | null) => void;

  // Last AI edit actions
  toggleShowLastAIEdit: () => void;

  // Card content visibility actions
  toggleShowDescriptions: () => void;
  toggleShowAcceptanceCriteria: () => void;
  applyVisibility: (showDescriptions: boolean, showAcceptanceCriteria: boolean) => void;

  // Version actions
  setPendingSaveLabel: (label: string | null) => void;
  setVersionPanelOpen: (open: boolean) => void;

  // Project role actions
  setProjectRole: (role: 'owner' | 'editor' | 'viewer') => void;

  // Mobile actions
  setMobileEditingNodeId: (id: string | null) => void;
  setActivePanel: (panel: ActivePanel) => void;
  setAIPromptText: (text: string) => void;
}

export const useMapStore = create<MapState>((set, get) => ({
  nodes: [],
  edges: [],
  viewport: { x: 0, y: 0, zoom: 1 },
  isDirty: false,
  selectedNodeId: null,
  toolMode: 'select',
  cardTypeToAdd: 'story',
  projectId: null,

  // Undo/redo state
  undoStack: [],
  redoStack: [],
  canUndo: false,
  canRedo: false,

  // Layout correction
  pendingLayout: 'none',

  // Priority filter state
  hiddenPriorities: new Set<Priority>(),

  // Highlight state
  highlightedNodes: new Map(),

  // AI editing state
  isAIEditing: false,
  cancelAIEdit: null,

  // Last AI edit tracking
  lastAIEditNodeIds: new Set<string>(),
  showLastAIEdit: false,

  // Card content visibility
  showDescriptions: true,
  showAcceptanceCriteria: true,

  // Version state
  pendingSaveLabel: null,
  isVersionPanelOpen: false,

  // Project role
  projectRole: 'owner',

  // Canvas loading state
  isCanvasLoading: false,
  canvasLoadError: null,
  saveError: null,

  // Mobile state
  mobileEditingNodeId: null,
  activePanel: 'none',
  aiPromptText: '',

  setNodes: (nodes) => set({ nodes, isDirty: true }),
  setEdges: (edges) => set({ edges, isDirty: true }),
  setViewport: (viewport) => set({ viewport }),

  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes) as Node<StoryCardData>[],
      isDirty: true,
    });
  },

  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
      isDirty: true,
    });
  },

  onConnect: (connection) => {
    get().pushSnapshot();
    set({
      edges: addEdge({ ...connection, type: 'default' }, get().edges),
      isDirty: true,
    });
  },

  addNode: (node) => {
    get().pushSnapshot();
    set({ nodes: [...get().nodes, node], isDirty: true });
  },

  updateNodeData: (id, data) => {
    set({
      nodes: get().nodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, ...data } } : n
      ),
      isDirty: true,
    });
  },

  deleteNode: (id) => {
    get().pushSnapshot();
    set({
      nodes: get().nodes.filter((n) => n.id !== id),
      edges: get().edges.filter((e) => e.source !== id && e.target !== id),
      isDirty: true,
      selectedNodeId: get().selectedNodeId === id ? null : get().selectedNodeId,
    });
  },

  setSelectedNodeId: (id) => set({ selectedNodeId: id }),
  setToolMode: (mode) => set({ toolMode: mode }),
  setCardTypeToAdd: (type) => set({ cardTypeToAdd: type }),
  setProjectId: (id) => set({ projectId: id }),
  setDirty: (dirty) => set({ isDirty: dirty }),

  startLoadingProject: (projectId) => set({
    projectId,
    isCanvasLoading: true,
    canvasLoadError: null,
    nodes: [],
    edges: [],
    viewport: { x: 0, y: 0, zoom: 1 },
    isDirty: false,
    selectedNodeId: null,
    highlightedNodes: new Map(),
    lastAIEditNodeIds: new Set(),
    showLastAIEdit: false,
    pendingLayout: 'none' as PendingLayout,
    undoStack: [],
    redoStack: [],
    canUndo: false,
    canRedo: false,
    mobileEditingNodeId: null,
    activePanel: 'none' as ActivePanel,
  }),

  setCanvasLoadError: (error) => set({ canvasLoadError: error, isCanvasLoading: false }),
  setSaveError: (error) => set({ saveError: error }),

  loadCanvas: (nodes, edges, viewport, visibility) => {
    set({
      nodes, edges, viewport, isDirty: false,
      isCanvasLoading: false, canvasLoadError: null,
      highlightedNodes: new Map(), lastAIEditNodeIds: new Set(), showLastAIEdit: false,
      ...(visibility?.showDescriptions !== undefined && { showDescriptions: visibility.showDescriptions }),
      ...(visibility?.showAcceptanceCriteria !== undefined && { showAcceptanceCriteria: visibility.showAcceptanceCriteria }),
    });
    get().clearHistory();
  },

  mergeNodes: (newNodes, newEdges) => {
    get().pushSnapshot();
    const existing = get().nodes;
    const existingEdges = get().edges;

    // Offset new nodes if they would overlap
    const maxX = existing.length > 0
      ? Math.max(...existing.map((n) => n.position.x)) + 300
      : 0;

    const offsetNodes = newNodes.map((n) => ({
      ...n,
      position: {
        x: n.position.x + (existing.length > 0 ? maxX : 0),
        y: n.position.y,
      },
    }));

    const highlights = new Map<string, HighlightType>();
    for (const n of offsetNodes) {
      highlights.set(n.id, 'added');
    }

    set({
      nodes: [...existing, ...offsetNodes],
      edges: [...existingEdges, ...newEdges],
      isDirty: true,
      pendingLayout: 'correctOverlap',
      highlightedNodes: highlights,
      lastAIEditNodeIds: new Set(highlights.keys()),
      showLastAIEdit: false,
    });
  },

  applyArrangement: (positions) => {
    get().pushSnapshot();
    set({
      nodes: get().nodes.map((n) => {
        const pos = positions.find((p) => p.id === n.id);
        return pos ? { ...n, position: pos.position } : n;
      }),
      isDirty: true,
      pendingLayout: 'correctOverlap',
    });
  },

  applyOperations: (operations) => {
    get().pushSnapshot();
    let { nodes, edges } = get();
    const highlights = new Map<string, HighlightType>();

    for (const op of operations) {
      switch (op.type) {
        case 'add_node': {
          if (!op.node) break;
          if (nodes.some((n) => n.id === op.node!.id)) break;
          nodes = [...nodes, op.node as Node<StoryCardData>];
          highlights.set(op.node.id, 'added');
          break;
        }
        case 'remove_node': {
          if (!op.id) break;
          if (!nodes.some((n) => n.id === op.id)) break;
          nodes = nodes.filter((n) => n.id !== op.id);
          edges = edges.filter((e) => e.source !== op.id && e.target !== op.id);
          break;
        }
        case 'update_node': {
          if (!op.id || !op.changes) break;
          const idx = nodes.findIndex((n) => n.id === op.id);
          if (idx === -1) break;
          const existing = nodes[idx];
          const updated = {
            ...existing,
            data: op.changes.data ? { ...existing.data, ...op.changes.data } : existing.data,
            position: op.changes.position ?? existing.position,
          };
          nodes = nodes.map((n) => (n.id === op.id ? updated : n));
          highlights.set(op.id, 'modified');
          break;
        }
        case 'move_node': {
          if (!op.id || !op.position) break;
          if (!nodes.some((n) => n.id === op.id)) break;
          nodes = nodes.map((n) =>
            n.id === op.id ? { ...n, position: op.position! } : n
          );
          highlights.set(op.id, 'modified');
          break;
        }
        case 'add_edge': {
          if (!op.edge) break;
          if (edges.some((e) => e.id === op.edge!.id)) break;
          if (!nodes.some((n) => n.id === op.edge!.source) || !nodes.some((n) => n.id === op.edge!.target)) break;
          edges = [...edges, op.edge];
          break;
        }
        case 'remove_edge': {
          if (!op.id) break;
          edges = edges.filter((e) => e.id !== op.id);
          break;
        }
      }
    }

    const needsLayout = operations.some(
      (op) => op.type === 'add_node' || op.type === 'move_node'
    );
    set({
      nodes,
      edges,
      isDirty: true,
      highlightedNodes: highlights,
      lastAIEditNodeIds: new Set(highlights.keys()),
      showLastAIEdit: false,
      ...(needsLayout && { pendingLayout: 'correctOverlap' as PendingLayout }),
    });
  },

  arrangeLocal: () => {
    const { nodes, pendingLayout } = get();
    console.log('[arrangeLocal] called, nodes:', nodes.length, 'current pendingLayout:', pendingLayout);
    if (nodes.length === 0) return;
    get().pushSnapshot();
    set({ pendingLayout: 'fullArrange' });
    console.log('[arrangeLocal] set pendingLayout to fullArrange, new state:', get().pendingLayout);
  },

  // Undo/redo actions
  pushSnapshot: () => {
    const { nodes, edges, undoStack } = get();
    const snapshot: Snapshot = {
      nodes: structuredClone(nodes),
      edges: structuredClone(edges),
    };
    const newStack = [...undoStack, snapshot].slice(-MAX_HISTORY);
    set({ undoStack: newStack, redoStack: [], canUndo: true, canRedo: false });
  },

  undo: () => {
    const { undoStack, redoStack, nodes, edges } = get();
    if (undoStack.length === 0) return;
    const newUndo = [...undoStack];
    const snapshot = newUndo.pop()!;
    const currentSnapshot: Snapshot = {
      nodes: structuredClone(nodes),
      edges: structuredClone(edges),
    };
    const newRedo = [...redoStack, currentSnapshot];
    set({
      nodes: snapshot.nodes,
      edges: snapshot.edges,
      undoStack: newUndo,
      redoStack: newRedo,
      canUndo: newUndo.length > 0,
      canRedo: true,
      isDirty: true,
      highlightedNodes: new Map(),
      showLastAIEdit: false,
    });
  },

  redo: () => {
    const { undoStack, redoStack, nodes, edges } = get();
    if (redoStack.length === 0) return;
    const newRedo = [...redoStack];
    const snapshot = newRedo.pop()!;
    const currentSnapshot: Snapshot = {
      nodes: structuredClone(nodes),
      edges: structuredClone(edges),
    };
    const newUndo = [...undoStack, currentSnapshot];
    set({
      nodes: snapshot.nodes,
      edges: snapshot.edges,
      undoStack: newUndo,
      redoStack: newRedo,
      canUndo: true,
      canRedo: newRedo.length > 0,
      isDirty: true,
      highlightedNodes: new Map(),
      showLastAIEdit: false,
    });
  },

  clearHistory: () => {
    set({ undoStack: [], redoStack: [], canUndo: false, canRedo: false });
  },

  // Layout correction actions
  setPendingLayout: (action) => set({ pendingLayout: action }),

  // Priority filter actions
  togglePriority: (priority) => {
    const current = get().hiddenPriorities;
    const next = new Set(current);
    if (next.has(priority)) {
      next.delete(priority);
    } else {
      next.add(priority);
    }
    set({ hiddenPriorities: next });
  },

  // Highlight actions
  clearHighlights: () => set({ highlightedNodes: new Map() }),

  // AI editing actions
  setAIEditing: (editing) => {
    if (editing) {
      set({ isAIEditing: true, selectedNodeId: null, toolMode: 'select' });
    } else {
      set({ isAIEditing: false });
    }
  },
  setCancelAIEdit: (fn) => set({ cancelAIEdit: fn }),

  // Last AI edit actions
  toggleShowLastAIEdit: () => set((s) => ({ showLastAIEdit: !s.showLastAIEdit })),

  // Card content visibility actions
  toggleShowDescriptions: () => set((s) => ({ showDescriptions: !s.showDescriptions })),
  toggleShowAcceptanceCriteria: () => set((s) => ({ showAcceptanceCriteria: !s.showAcceptanceCriteria })),
  applyVisibility: (showDescriptions, showAcceptanceCriteria) => set({ showDescriptions, showAcceptanceCriteria }),

  // Version actions
  setPendingSaveLabel: (label) => set({ pendingSaveLabel: label }),
  setVersionPanelOpen: (open) => set({ isVersionPanelOpen: open }),

  // Project role actions
  setProjectRole: (role) => set({ projectRole: role }),

  // Mobile actions
  setMobileEditingNodeId: (id) => {
    if (id !== null) {
      set({ mobileEditingNodeId: id, selectedNodeId: id });
    } else {
      set({ mobileEditingNodeId: null });
    }
  },
  setActivePanel: (panel) => set({
    activePanel: panel,
    ...(panel !== 'cardEditor' && { mobileEditingNodeId: null }),
  }),
  setAIPromptText: (text) => set({ aiPromptText: text }),
}));
