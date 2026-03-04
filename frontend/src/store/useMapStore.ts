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
import type { StoryCardData, ToolMode, CardType, EditOperation, Priority } from '../types';

interface Snapshot {
  nodes: Node<StoryCardData>[];
  edges: Edge[];
}

const MAX_HISTORY = 50;
const HORIZONTAL_SPACING = 300;
const ACTIVITY_Y = 0;
const STEP_Y = 200;
const PRIORITY_BASE_Y: Record<Priority, number> = {
  'must-have': 400,
  'should-have': 600,
  'could-have': 800,
  'wont-have': 1000,
};

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
  needsLayoutCorrection: boolean;

  // Version state
  pendingSaveLabel: string | null;
  isVersionPanelOpen: boolean;

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
  loadCanvas: (nodes: Node<StoryCardData>[], edges: Edge[], viewport: Viewport) => void;
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
  setNeedsLayoutCorrection: (flag: boolean) => void;

  // Version actions
  setPendingSaveLabel: (label: string | null) => void;
  setVersionPanelOpen: (open: boolean) => void;
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
  needsLayoutCorrection: false,

  // Version state
  pendingSaveLabel: null,
  isVersionPanelOpen: false,

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

  loadCanvas: (nodes, edges, viewport) => {
    set({ nodes, edges, viewport, isDirty: false });
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

    set({
      nodes: [...existing, ...offsetNodes],
      edges: [...existingEdges, ...newEdges],
      isDirty: true,
      needsLayoutCorrection: true,
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
      needsLayoutCorrection: true,
    });
  },

  applyOperations: (operations) => {
    get().pushSnapshot();
    let { nodes, edges } = get();

    for (const op of operations) {
      switch (op.type) {
        case 'add_node': {
          if (!op.node) break;
          if (nodes.some((n) => n.id === op.node!.id)) break;
          nodes = [...nodes, op.node as Node<StoryCardData>];
          break;
        }
        case 'remove_node': {
          if (!op.id) break;
          if (!nodes.some((n) => n.id === op.id)) break;
          nodes = nodes.filter((n) => n.id !== op.id);
          // Safety net: remove dangling edges
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
          break;
        }
        case 'move_node': {
          if (!op.id || !op.position) break;
          if (!nodes.some((n) => n.id === op.id)) break;
          nodes = nodes.map((n) =>
            n.id === op.id ? { ...n, position: op.position! } : n
          );
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
    set({ nodes, edges, isDirty: true, ...(needsLayout && { needsLayoutCorrection: true }) });
  },

  arrangeLocal: () => {
    const { nodes, edges } = get();
    if (nodes.length === 0) return;
    get().pushSnapshot();

    // Build parent->children map from edges
    const childrenOf = new Map<string, string[]>();
    const hasParent = new Set<string>();
    for (const edge of edges) {
      if (!childrenOf.has(edge.source)) childrenOf.set(edge.source, []);
      childrenOf.get(edge.source)!.push(edge.target);
      hasParent.add(edge.target);
    }

    // Categorize nodes
    const activities = nodes.filter((n) => n.type === 'activity');
    const steps = nodes.filter((n) => n.type === 'step');
    const stories = nodes.filter((n) => n.type === 'storyCard');

    // Sort activities by current x to preserve user's order
    activities.sort((a, b) => a.position.x - b.position.x);

    const positions = new Map<string, { x: number; y: number }>();
    const assignedSteps = new Set<string>();
    const assignedStories = new Set<string>();
    let currentColumn = 0;

    for (const activity of activities) {
      const actStepIds = (childrenOf.get(activity.id) || []).filter((id) =>
        steps.some((s) => s.id === id)
      );
      const actSteps = actStepIds
        .map((id) => steps.find((s) => s.id === id)!)
        .sort((a, b) => a.position.x - b.position.x);

      if (actSteps.length === 0) {
        // Activity with no steps — give it one column
        positions.set(activity.id, { x: currentColumn * HORIZONTAL_SPACING, y: ACTIVITY_Y });
        currentColumn++;
      } else {
        const startCol = currentColumn;
        for (const step of actSteps) {
          assignedSteps.add(step.id);
          positions.set(step.id, { x: currentColumn * HORIZONTAL_SPACING, y: STEP_Y });

          // Place stories under this step at priority base y
          const stepStoryIds = (childrenOf.get(step.id) || []).filter((id) =>
            stories.some((s) => s.id === id)
          );
          for (const storyId of stepStoryIds) {
            const story = stories.find((s) => s.id === storyId)!;
            assignedStories.add(story.id);
            const baseY = PRIORITY_BASE_Y[(story.data as StoryCardData).priority] ?? 400;
            positions.set(story.id, { x: currentColumn * HORIZONTAL_SPACING, y: baseY });
          }
          currentColumn++;
        }
        // Center activity over its steps
        const centerX = ((startCol + currentColumn - 1) / 2) * HORIZONTAL_SPACING;
        positions.set(activity.id, { x: centerX, y: ACTIVITY_Y });
      }
    }

    // Orphan steps (no parent activity)
    for (const step of steps) {
      if (assignedSteps.has(step.id)) continue;
      positions.set(step.id, { x: currentColumn * HORIZONTAL_SPACING, y: STEP_Y });
      const stepStoryIds = (childrenOf.get(step.id) || []).filter((id) =>
        stories.some((s) => s.id === id)
      );
      for (const storyId of stepStoryIds) {
        const story = stories.find((s) => s.id === storyId)!;
        assignedStories.add(story.id);
        const baseY = PRIORITY_BASE_Y[(story.data as StoryCardData).priority] ?? 400;
        positions.set(story.id, { x: currentColumn * HORIZONTAL_SPACING, y: baseY });
      }
      currentColumn++;
    }

    // Orphan stories (no parent step)
    for (const story of stories) {
      if (assignedStories.has(story.id)) continue;
      const baseY = PRIORITY_BASE_Y[(story.data as StoryCardData).priority] ?? 400;
      positions.set(story.id, { x: currentColumn * HORIZONTAL_SPACING, y: baseY });
      currentColumn++;
    }

    // Apply positions (annotations stay where they are)
    const updatedNodes = nodes.map((n) => {
      const pos = positions.get(n.id);
      return pos ? { ...n, position: pos } : n;
    });

    set({ nodes: updatedNodes, isDirty: true, needsLayoutCorrection: true });
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
    });
  },

  clearHistory: () => {
    set({ undoStack: [], redoStack: [], canUndo: false, canRedo: false });
  },

  // Layout correction actions
  setNeedsLayoutCorrection: (flag) => set({ needsLayoutCorrection: flag }),

  // Version actions
  setPendingSaveLabel: (label) => set({ pendingSaveLabel: label }),
  setVersionPanelOpen: (open) => set({ isVersionPanelOpen: open }),
}));
