import { describe, it, expect, beforeEach } from 'vitest';
import { useMapStore } from '../store/useMapStore';
import type { Node, Edge } from '@xyflow/react';
import type { StoryCardData, Priority } from '../types';

function makeNode(id: string, x = 0, y = 0, cardType: StoryCardData['cardType'] = 'story'): Node<StoryCardData> {
  return {
    id,
    type: cardType === 'activity' ? 'activity' : cardType === 'step' ? 'step' : 'storyCard',
    position: { x, y },
    data: {
      title: `Node ${id}`,
      description: 'A description',
      acceptanceCriteria: ['AC 1'],
      cardType,
      priority: 'must-have' as Priority,
    },
  };
}

function makeEdge(id: string, source: string, target: string): Edge {
  return { id, source, target };
}

describe('Store actions', () => {
  beforeEach(() => {
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
      highlightedNodes: new Map(),
      hiddenPriorities: new Set(),
      showDescriptions: true,
      showAcceptanceCriteria: true,
      lastAIEditNodeIds: new Set(),
      showLastAIEdit: false,
    });
  });

  it('updateNodeData merges data correctly', () => {
    useMapStore.setState({ nodes: [makeNode('n1')] });
    useMapStore.getState().updateNodeData('n1', { title: 'Updated Title' });

    const node = useMapStore.getState().nodes.find(n => n.id === 'n1');
    expect(node?.data.title).toBe('Updated Title');
    expect(node?.data.description).toBe('A description'); // unchanged
  });

  it('updateNodeData sets isDirty', () => {
    useMapStore.setState({ nodes: [makeNode('n1')], isDirty: false });
    useMapStore.getState().updateNodeData('n1', { title: 'New' });
    expect(useMapStore.getState().isDirty).toBe(true);
  });

  it('deleteNode removes node and connected edges', () => {
    useMapStore.setState({
      nodes: [makeNode('n1'), makeNode('n2')],
      edges: [makeEdge('e1', 'n1', 'n2'), makeEdge('e2', 'n2', 'n1')],
    });
    useMapStore.getState().deleteNode('n1');

    expect(useMapStore.getState().nodes).toHaveLength(1);
    expect(useMapStore.getState().nodes[0].id).toBe('n2');
    expect(useMapStore.getState().edges).toHaveLength(0);
  });

  it('deleteNode clears selection if deleted node was selected', () => {
    useMapStore.setState({
      nodes: [makeNode('n1')],
      edges: [],
      selectedNodeId: 'n1',
    });
    useMapStore.getState().deleteNode('n1');
    expect(useMapStore.getState().selectedNodeId).toBeNull();
  });

  it('togglePriority adds to hiddenPriorities', () => {
    useMapStore.getState().togglePriority('could-have');
    expect(useMapStore.getState().hiddenPriorities.has('could-have')).toBe(true);
  });

  it('togglePriority removes from hiddenPriorities', () => {
    useMapStore.setState({ hiddenPriorities: new Set(['could-have'] as Priority[]) });
    useMapStore.getState().togglePriority('could-have');
    expect(useMapStore.getState().hiddenPriorities.has('could-have')).toBe(false);
  });

  it('toggleShowDescriptions toggles flag', () => {
    expect(useMapStore.getState().showDescriptions).toBe(true);
    useMapStore.getState().toggleShowDescriptions();
    expect(useMapStore.getState().showDescriptions).toBe(false);
    useMapStore.getState().toggleShowDescriptions();
    expect(useMapStore.getState().showDescriptions).toBe(true);
  });

  it('toggleShowAcceptanceCriteria toggles flag', () => {
    expect(useMapStore.getState().showAcceptanceCriteria).toBe(true);
    useMapStore.getState().toggleShowAcceptanceCriteria();
    expect(useMapStore.getState().showAcceptanceCriteria).toBe(false);
  });

  it('applyVisibility sets both flags', () => {
    useMapStore.getState().applyVisibility(false, false);
    expect(useMapStore.getState().showDescriptions).toBe(false);
    expect(useMapStore.getState().showAcceptanceCriteria).toBe(false);
  });

  it('loadCanvas sets data and clears history', () => {
    // Build some history first
    useMapStore.getState().addNode(makeNode('old'));
    expect(useMapStore.getState().canUndo).toBe(true);

    useMapStore.getState().loadCanvas(
      [makeNode('loaded')],
      [makeEdge('e1', 'loaded', 'other')],
      { x: 10, y: 20, zoom: 1.5 }
    );

    expect(useMapStore.getState().nodes).toHaveLength(1);
    expect(useMapStore.getState().nodes[0].id).toBe('loaded');
    expect(useMapStore.getState().edges).toHaveLength(1);
    expect(useMapStore.getState().viewport).toEqual({ x: 10, y: 20, zoom: 1.5 });
    expect(useMapStore.getState().canUndo).toBe(false);
    expect(useMapStore.getState().canRedo).toBe(false);
    expect(useMapStore.getState().isDirty).toBe(false);
  });

  it('loadCanvas applies visibility settings', () => {
    useMapStore.getState().loadCanvas(
      [], [], { x: 0, y: 0, zoom: 1 },
      { showDescriptions: false, showAcceptanceCriteria: false }
    );
    expect(useMapStore.getState().showDescriptions).toBe(false);
    expect(useMapStore.getState().showAcceptanceCriteria).toBe(false);
  });

  it('onConnect adds edge with snapshot', () => {
    useMapStore.setState({ nodes: [makeNode('n1'), makeNode('n2')] });

    useMapStore.getState().onConnect({
      source: 'n1',
      target: 'n2',
      sourceHandle: null,
      targetHandle: null,
    });

    expect(useMapStore.getState().edges).toHaveLength(1);
    expect(useMapStore.getState().canUndo).toBe(true);
  });

  it('arrangeLocal sets pendingLayout, increments layoutTrigger, and pushes snapshot', () => {
    useMapStore.setState({
      nodes: [makeNode('a1', 0, 0, 'activity'), makeNode('s1', 0, 200, 'step')],
      edges: [makeEdge('e1', 'a1', 's1')],
    });

    const triggerBefore = useMapStore.getState().layoutTrigger;
    useMapStore.getState().arrangeLocal();
    expect(useMapStore.getState().pendingLayout).toBe('fullArrange');
    expect(useMapStore.getState().layoutTrigger).toBe(triggerBefore + 1);
    expect(useMapStore.getState().canUndo).toBe(true);
  });

  it('updateNodeData changes node type when cardType changes', () => {
    useMapStore.setState({ nodes: [makeNode('n1', 0, 0, 'story')] });
    expect(useMapStore.getState().nodes[0].type).toBe('storyCard');

    useMapStore.getState().updateNodeData('n1', { cardType: 'activity' });
    const updated = useMapStore.getState().nodes.find(n => n.id === 'n1');
    expect(updated?.type).toBe('activity');
    expect(updated?.data.cardType).toBe('activity');
  });

  it('updateNodeData changes node type for all card types', () => {
    useMapStore.setState({ nodes: [makeNode('n1', 0, 0, 'activity')] });
    expect(useMapStore.getState().nodes[0].type).toBe('activity');

    // activity -> step
    useMapStore.getState().updateNodeData('n1', { cardType: 'step' });
    expect(useMapStore.getState().nodes[0].type).toBe('step');

    // step -> story
    useMapStore.getState().updateNodeData('n1', { cardType: 'story' });
    expect(useMapStore.getState().nodes[0].type).toBe('storyCard');

    // story -> annotation
    useMapStore.getState().updateNodeData('n1', { cardType: 'annotation' });
    expect(useMapStore.getState().nodes[0].type).toBe('annotation');
  });

  it('updateNodeData does not change node type when cardType is not in update', () => {
    useMapStore.setState({ nodes: [makeNode('n1', 0, 0, 'story')] });
    useMapStore.getState().updateNodeData('n1', { title: 'New Title' });
    expect(useMapStore.getState().nodes[0].type).toBe('storyCard');
  });

  it('setSelectedNodeId updates selection', () => {
    useMapStore.setState({ nodes: [makeNode('n1')] });
    useMapStore.getState().setSelectedNodeId('n1');
    expect(useMapStore.getState().selectedNodeId).toBe('n1');

    useMapStore.getState().setSelectedNodeId(null);
    expect(useMapStore.getState().selectedNodeId).toBeNull();
  });
});
