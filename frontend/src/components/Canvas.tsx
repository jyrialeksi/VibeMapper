import { useCallback, useRef, useEffect, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type ReactFlowInstance,
  type Node,
  BackgroundVariant,
} from '@xyflow/react';
import { useMapStore } from '../store/useMapStore';
import { useAutoSave } from '../hooks/useAutoSave';
import { api } from '../api/client';
import { nodeTypes } from './nodes';
import { edgeTypes } from './edges';
import { Toolbar } from './panels/Toolbar';
import { CardEditor } from './panels/CardEditor';
import { AIPromptBox } from './panels/AIPromptBox';
import { VersionHistoryPanel } from './panels/VersionHistoryPanel';
import { LayoutCorrector } from './LayoutCorrector';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import type { StoryCardData, CardType } from '../types';
import { exportToMarkdown } from '../utils/exportToMarkdown';

function getNodeTypeForCard(cardType: CardType): string {
  switch (cardType) {
    case 'activity': return 'activity';
    case 'step': return 'step';
    case 'annotation': return 'annotation';
    default: return 'storyCard';
  }
}

function createDefaultData(cardType: CardType): StoryCardData {
  return {
    title: `New ${cardType}`,
    description: '',
    acceptanceCriteria: [],
    cardType,
    priority: 'must-have',
    tags: [],
  };
}

interface CanvasProps {
  projectId: string;
}

export function Canvas({ projectId }: CanvasProps) {
  const rfRef = useRef<ReactFlowInstance<Node<StoryCardData>> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const nodes = useMapStore((s) => s.nodes);
  const edges = useMapStore((s) => s.edges);
  const onNodesChange = useMapStore((s) => s.onNodesChange);
  const onEdgesChange = useMapStore((s) => s.onEdgesChange);
  const onConnect = useMapStore((s) => s.onConnect);
  const addNode = useMapStore((s) => s.addNode);
  const setSelectedNodeId = useMapStore((s) => s.setSelectedNodeId);
  const selectedNodeId = useMapStore((s) => s.selectedNodeId);
  const toolMode = useMapStore((s) => s.toolMode);
  const cardTypeToAdd = useMapStore((s) => s.cardTypeToAdd);
  const setToolMode = useMapStore((s) => s.setToolMode);
  const loadCanvas = useMapStore((s) => s.loadCanvas);
  const setProjectId = useMapStore((s) => s.setProjectId);
  const pushSnapshot = useMapStore((s) => s.pushSnapshot);
  const isVersionPanelOpen = useMapStore((s) => s.isVersionPanelOpen);
  const hiddenPriorities = useMapStore((s) => s.hiddenPriorities);

  const visibleNodes = useMemo(() => {
    if (hiddenPriorities.size === 0) return nodes;
    return nodes.filter((n) => {
      if (n.data.cardType !== 'story') return true;
      return !hiddenPriorities.has(n.data.priority);
    });
  }, [nodes, hiddenPriorities]);

  const visibleNodeIds = useMemo(() => {
    if (hiddenPriorities.size === 0) return null;
    return new Set(visibleNodes.map((n) => n.id));
  }, [visibleNodes, hiddenPriorities]);

  const visibleEdges = useMemo(() => {
    if (!visibleNodeIds) return edges;
    return edges.filter((e) => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target));
  }, [edges, visibleNodeIds]);

  useAutoSave();
  useKeyboardShortcuts();

  // Load canvas state on mount
  useEffect(() => {
    setProjectId(projectId);
    api.loadCanvas(projectId).then((state) => {
      loadCanvas(state.nodes, state.edges, state.viewport);
    }).catch(console.error);
  }, [projectId, loadCanvas, setProjectId]);

  const handlePaneClick = useCallback(
    (event: React.MouseEvent) => {
      if (toolMode === 'addCard' && rfRef.current) {
        const position = rfRef.current.screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });

        const newNode: Node<StoryCardData> = {
          id: `${cardTypeToAdd}-${Date.now()}`,
          type: getNodeTypeForCard(cardTypeToAdd),
          position,
          data: createDefaultData(cardTypeToAdd),
        };

        addNode(newNode);
      } else if (toolMode === 'box' && rfRef.current) {
        const position = rfRef.current.screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });

        const newNode: Node<StoryCardData> = {
          id: `annotation-${Date.now()}`,
          type: 'annotation',
          position,
          data: {
            ...createDefaultData('annotation'),
            title: 'Note',
            width: 200,
            height: 100,
          },
          style: { width: 200, height: 100 },
        };

        addNode(newNode);
      } else {
        setSelectedNodeId(null);
      }
    },
    [toolMode, cardTypeToAdd, addNode, setSelectedNodeId]
  );

  const handleNodeDoubleClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelectedNodeId(node.id);
      setToolMode('select');
    },
    [setSelectedNodeId, setToolMode]
  );

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (toolMode === 'select') {
        setSelectedNodeId(node.id);
      }
    },
    [toolMode, setSelectedNodeId]
  );

  const handleNodeDragStart = useCallback(() => {
    pushSnapshot();
  }, [pushSnapshot]);

  const handleExport = useCallback(async () => {
    try {
      const data = await api.exportCanvas(projectId);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'story_map.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
  }, [projectId]);

  const handleExportMarkdown = useCallback(() => {
    const md = exportToMarkdown(nodes, edges, hiddenPriorities);
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'story_map.md';
    a.click();
    URL.revokeObjectURL(url);
  }, [nodes, edges, hiddenPriorities]);

  const handleImport = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        const canvasData = data.canvas || data;
        await api.importCanvas(projectId, {
          nodes: canvasData.nodes || [],
          edges: canvasData.edges || [],
          viewport: canvasData.viewport || { x: 0, y: 0, zoom: 1 },
        });
        const state = await api.loadCanvas(projectId);
        loadCanvas(state.nodes, state.edges, state.viewport);
      } catch (err) {
        console.error('Import failed:', err);
      }
      e.target.value = '';
    },
    [projectId, loadCanvas]
  );

  return (
    <div className="w-full h-full relative">
      <Toolbar onImport={handleImport} onExport={handleExport} onExportMarkdown={handleExportMarkdown} />
      <ReactFlow
        nodes={visibleNodes}
        edges={visibleEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={(instance) => { rfRef.current = instance; }}
        onPaneClick={handlePaneClick}
        onNodeDoubleClick={handleNodeDoubleClick}
        onNodeClick={handleNodeClick}
        onNodeDragStart={handleNodeDragStart}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        connectionMode={toolMode === 'line' ? undefined : undefined}
        className="bg-gray-50"
        deleteKeyCode="Delete"
        selectionKeyCode="Shift"
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#d1d5db" />
        <Controls />
        <MiniMap
          nodeStrokeWidth={3}
          className="!bg-white !border-gray-200"
        />
        <LayoutCorrector />
      </ReactFlow>
      {selectedNodeId && !isVersionPanelOpen && <CardEditor />}
      <VersionHistoryPanel />
      <AIPromptBox />
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
