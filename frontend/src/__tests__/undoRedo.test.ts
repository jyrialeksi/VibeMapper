import { describe, it, expect, beforeEach } from 'vitest';
import { useMapStore } from '../store/useMapStore';
import type { Node } from '@xyflow/react';
import type { StoryCardData } from '../types';

function makeNode(id: string, x = 0, y = 0): Node<StoryCardData> {
  return {
    id,
    type: 'storyCard',
    position: { x, y },
    data: {
      title: `Node ${id}`,
      description: '',
      acceptanceCriteria: [],
      cardType: 'story',
      priority: 'must-have',
    },
  };
}

describe('Undo/Redo in useMapStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    useMapStore.setState({
      nodes: [],
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1 },
      isDirty: false,
      undoStack: [],
      redoStack: [],
      canUndo: false,
      canRedo: false,
      selectedNodeId: null,
      toolMode: 'select',
      cardTypeToAdd: 'story',
      projectId: null,
      pendingSaveLabel: null,
      isVersionPanelOpen: false,
    });
  });

  it('initial state: canUndo=false, canRedo=false', () => {
    const state = useMapStore.getState();
    expect(state.canUndo).toBe(false);
    expect(state.canRedo).toBe(false);
    expect(state.undoStack).toHaveLength(0);
    expect(state.redoStack).toHaveLength(0);
  });

  it('pushSnapshot + mutation → undo restores previous', () => {
    const store = useMapStore.getState();

    // Set initial nodes
    useMapStore.setState({ nodes: [makeNode('n1')] });

    // Push snapshot (saves current state), then mutate
    store.pushSnapshot();
    useMapStore.setState({ nodes: [makeNode('n1'), makeNode('n2')] });

    // Undo should restore to just n1
    useMapStore.getState().undo();
    expect(useMapStore.getState().nodes).toHaveLength(1);
    expect(useMapStore.getState().nodes[0].id).toBe('n1');
  });

  it('undo then redo restores mutation', () => {
    useMapStore.setState({ nodes: [makeNode('n1')] });
    useMapStore.getState().pushSnapshot();
    useMapStore.setState({ nodes: [makeNode('n1'), makeNode('n2')] });

    useMapStore.getState().undo();
    expect(useMapStore.getState().nodes).toHaveLength(1);

    useMapStore.getState().redo();
    expect(useMapStore.getState().nodes).toHaveLength(2);
    expect(useMapStore.getState().nodes[1].id).toBe('n2');
  });

  it('new snapshot after undo clears redo stack', () => {
    useMapStore.setState({ nodes: [makeNode('n1')] });
    useMapStore.getState().pushSnapshot();
    useMapStore.setState({ nodes: [makeNode('n1'), makeNode('n2')] });

    useMapStore.getState().undo();
    expect(useMapStore.getState().canRedo).toBe(true);

    // Push new snapshot (like a new action) — should clear redo
    useMapStore.getState().pushSnapshot();
    expect(useMapStore.getState().canRedo).toBe(false);
    expect(useMapStore.getState().redoStack).toHaveLength(0);
  });

  it('stack capped at 50', () => {
    for (let i = 0; i < 60; i++) {
      useMapStore.getState().pushSnapshot();
      useMapStore.setState({ nodes: [makeNode(`n${i}`)] });
    }

    expect(useMapStore.getState().undoStack.length).toBeLessThanOrEqual(50);
  });

  it('clearHistory empties both stacks', () => {
    useMapStore.getState().pushSnapshot();
    useMapStore.setState({ nodes: [makeNode('n1')] });
    useMapStore.getState().pushSnapshot();
    useMapStore.setState({ nodes: [] });

    useMapStore.getState().undo();
    expect(useMapStore.getState().canUndo).toBe(true);
    expect(useMapStore.getState().canRedo).toBe(true);

    useMapStore.getState().clearHistory();
    expect(useMapStore.getState().canUndo).toBe(false);
    expect(useMapStore.getState().canRedo).toBe(false);
    expect(useMapStore.getState().undoStack).toHaveLength(0);
    expect(useMapStore.getState().redoStack).toHaveLength(0);
  });

  it('addNode auto-pushes snapshot', () => {
    const node = makeNode('n1');
    useMapStore.getState().addNode(node);

    expect(useMapStore.getState().nodes).toHaveLength(1);
    expect(useMapStore.getState().canUndo).toBe(true);

    useMapStore.getState().undo();
    expect(useMapStore.getState().nodes).toHaveLength(0);
  });

  it('deleteNode auto-pushes snapshot', () => {
    // Add a node directly (no snapshot)
    useMapStore.setState({ nodes: [makeNode('n1')], edges: [] });

    useMapStore.getState().deleteNode('n1');

    expect(useMapStore.getState().nodes).toHaveLength(0);
    expect(useMapStore.getState().canUndo).toBe(true);

    useMapStore.getState().undo();
    expect(useMapStore.getState().nodes).toHaveLength(1);
  });

  it('mergeNodes is single undoable action', () => {
    useMapStore.setState({ nodes: [makeNode('n1', 0, 0)], edges: [] });

    useMapStore.getState().mergeNodes(
      [makeNode('n2', 100, 200)],
      [{ id: 'e1', source: 'n1', target: 'n2' }]
    );

    expect(useMapStore.getState().nodes).toHaveLength(2);
    expect(useMapStore.getState().edges).toHaveLength(1);
    expect(useMapStore.getState().canUndo).toBe(true);

    // Single undo restores everything
    useMapStore.getState().undo();
    expect(useMapStore.getState().nodes).toHaveLength(1);
    expect(useMapStore.getState().edges).toHaveLength(0);
  });

  it('applyArrangement is single undoable action', () => {
    useMapStore.setState({
      nodes: [makeNode('n1', 0, 0), makeNode('n2', 100, 100)],
      edges: [],
    });

    useMapStore.getState().applyArrangement([
      { id: 'n1', position: { x: 50, y: 50 } },
      { id: 'n2', position: { x: 200, y: 200 } },
    ]);

    expect(useMapStore.getState().nodes[0].position).toEqual({ x: 50, y: 50 });
    expect(useMapStore.getState().canUndo).toBe(true);

    useMapStore.getState().undo();
    expect(useMapStore.getState().nodes[0].position).toEqual({ x: 0, y: 0 });
    expect(useMapStore.getState().nodes[1].position).toEqual({ x: 100, y: 100 });
  });

  it('loadCanvas clears history', () => {
    // Build up some history
    useMapStore.getState().addNode(makeNode('n1'));
    useMapStore.getState().addNode(makeNode('n2'));
    expect(useMapStore.getState().canUndo).toBe(true);

    // loadCanvas should reset history
    useMapStore.getState().loadCanvas(
      [makeNode('loaded')],
      [],
      { x: 0, y: 0, zoom: 1 }
    );

    expect(useMapStore.getState().nodes).toHaveLength(1);
    expect(useMapStore.getState().nodes[0].id).toBe('loaded');
    expect(useMapStore.getState().canUndo).toBe(false);
    expect(useMapStore.getState().canRedo).toBe(false);
    expect(useMapStore.getState().isDirty).toBe(false);
  });

  it('undo sets isDirty=true', () => {
    useMapStore.setState({ isDirty: false });
    useMapStore.getState().addNode(makeNode('n1'));
    useMapStore.setState({ isDirty: false });

    useMapStore.getState().undo();
    expect(useMapStore.getState().isDirty).toBe(true);
  });
});
