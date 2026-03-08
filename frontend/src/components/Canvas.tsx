import { useCallback, useRef, useEffect, useMemo } from 'react';
import {
  ReactFlow,
  Background,

  type ReactFlowInstance,
  type Node,
  BackgroundVariant,
} from '@xyflow/react';
import { Loader2, X } from 'lucide-react';
import { useMapStore } from '../store/useMapStore';
import { useAutoSave } from '../hooks/useAutoSave';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import { api } from '../api/client';
import { nodeTypes } from './nodes';
import { edgeTypes } from './edges';
import { MobileToolbar } from './panels/MobileToolbar';
import { MobileCardEditor } from './panels/MobileCardEditor';
import { MobileAIButton } from './panels/MobileAIButton';
import { VersionHistoryPanel } from './panels/VersionHistoryPanel';
import { LayoutCorrector } from './LayoutCorrector';
import { HighlightClearer } from './HighlightClearer';
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
  };
}

interface CanvasProps {
  projectId: string;
  onDeleteProject?: () => Promise<void>;
}

export function Canvas({ projectId, onDeleteProject }: CanvasProps) {
  const rfRef = useRef<ReactFlowInstance<Node<StoryCardData>> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const nodes = useMapStore((s) => s.nodes);
  const edges = useMapStore((s) => s.edges);
  const onNodesChange = useMapStore((s) => s.onNodesChange);
  const onEdgesChange = useMapStore((s) => s.onEdgesChange);
  const onConnect = useMapStore((s) => s.onConnect);
  const addNode = useMapStore((s) => s.addNode);
  const setSelectedNodeId = useMapStore((s) => s.setSelectedNodeId);
  const toolMode = useMapStore((s) => s.toolMode);
  const cardTypeToAdd = useMapStore((s) => s.cardTypeToAdd);
  const setToolMode = useMapStore((s) => s.setToolMode);
  const loadCanvas = useMapStore((s) => s.loadCanvas);
  const setProjectId = useMapStore((s) => s.setProjectId);
  const pushSnapshot = useMapStore((s) => s.pushSnapshot);
  const isVersionPanelOpen = useMapStore((s) => s.isVersionPanelOpen);
  const hiddenPriorities = useMapStore((s) => s.hiddenPriorities);
  const isAIEditing = useMapStore((s) => s.isAIEditing);
  const cancelAIEdit = useMapStore((s) => s.cancelAIEdit);
  const showLastAIEdit = useMapStore((s) => s.showLastAIEdit);
  const lastAIEditNodeIds = useMapStore((s) => s.lastAIEditNodeIds);
  const projectRole = useMapStore((s) => s.projectRole);
  const setProjectRole = useMapStore((s) => s.setProjectRole);
  const mobileEditingNodeId = useMapStore((s) => s.mobileEditingNodeId);
  const setMobileEditingNodeId = useMapStore((s) => s.setMobileEditingNodeId);
  const setActivePanel = useMapStore((s) => s.setActivePanel);
  const isReadOnly = projectRole === 'viewer' || isAIEditing;

  const visibleNodes = useMemo(() => {
    let filtered = nodes;
    if (hiddenPriorities.size > 0) {
      filtered = filtered.filter((n) => {
        if (n.data.cardType !== 'story') return true;
        return !hiddenPriorities.has(n.data.priority);
      });
    }
    // Per-node draggable: only the node being edited is draggable
    if (mobileEditingNodeId) {
      return filtered.map((n) =>
        n.id === mobileEditingNodeId ? { ...n, draggable: true } : n
      );
    }
    return filtered;
  }, [nodes, hiddenPriorities, mobileEditingNodeId]);

  const visibleNodeIds = useMemo(() => {
    if (hiddenPriorities.size === 0) return null;
    return new Set(visibleNodes.map((n) => n.id));
  }, [visibleNodes, hiddenPriorities]);

  const visibleEdges = useMemo(() => {
    let filtered = edges;
    if (visibleNodeIds) {
      filtered = filtered.filter((e) => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target));
    }
    if (showLastAIEdit && lastAIEditNodeIds.size > 0) {
      filtered = filtered.map((e) => {
        const connected = lastAIEditNodeIds.has(e.source) || lastAIEditNodeIds.has(e.target);
        return connected ? e : { ...e, className: 'edge-dimmed-not-ai' };
      });
    }
    return filtered;
  }, [edges, visibleNodeIds, showLastAIEdit, lastAIEditNodeIds]);

  const { theme } = useTheme();

  useAutoSave();
  useKeyboardShortcuts();

  const { getToken } = useAuth();
  const applyVisibility = useMapStore((s) => s.applyVisibility);

  // Load canvas state on mount
  useEffect(() => {
    setProjectId(projectId);
    api.loadCanvas(projectId).then((state) => {
      loadCanvas(state.nodes, state.edges, state.viewport, {
        showDescriptions: state.showDescriptions,
        showAcceptanceCriteria: state.showAcceptanceCriteria,
      });
      if (state.role) setProjectRole(state.role);
    }).catch(console.error);
  }, [projectId, loadCanvas, setProjectId, setProjectRole]);

  // SSE subscription for live visibility sync
  useEffect(() => {
    if (!projectId) return;

    let es: EventSource | null = null;

    const connect = async () => {
      const token = await getToken();
      const url = `/api/canvas/${projectId}/events${token ? `?token=${encodeURIComponent(token)}` : ''}`;
      es = new EventSource(url);

      es.addEventListener('visibility', (e) => {
        try {
          const data = JSON.parse(e.data);
          applyVisibility(data.showDescriptions, data.showAcceptanceCriteria);
        } catch { /* ignore parse errors */ }
      });

      es.onerror = () => {
        // EventSource auto-reconnects; no action needed
      };
    };

    connect();

    return () => {
      es?.close();
    };
  }, [projectId, getToken, applyVisibility]);

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
        setMobileEditingNodeId(null);
        setActivePanel('none');
      }
    },
    [toolMode, cardTypeToAdd, addNode, setSelectedNodeId, setMobileEditingNodeId, setActivePanel]
  );

  const handleNodeDoubleClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setMobileEditingNodeId(node.id);
      setToolMode('select');
    },
    [setMobileEditingNodeId, setToolMode]
  );

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      // Single click opens bottom sheet editor
      setMobileEditingNodeId(node.id);
      setToolMode('select');
    },
    [setMobileEditingNodeId, setToolMode]
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
      <MobileToolbar onImport={handleImport} onExport={handleExport} onExportMarkdown={handleExportMarkdown} onDeleteProject={onDeleteProject} />
      <ReactFlow
        nodes={visibleNodes}
        edges={visibleEdges}
        onNodesChange={isReadOnly ? undefined : onNodesChange}
        onEdgesChange={isReadOnly ? undefined : onEdgesChange}
        onConnect={isReadOnly ? undefined : onConnect}
        onInit={(instance) => { rfRef.current = instance; }}
        onPaneClick={isReadOnly ? undefined : handlePaneClick}
        onNodeDoubleClick={isReadOnly ? undefined : handleNodeDoubleClick}
        onNodeClick={isReadOnly ? undefined : handleNodeClick}
        onNodeDragStart={isReadOnly ? undefined : handleNodeDragStart}
        nodesDraggable={false}
        nodesConnectable={!isReadOnly}
        proOptions={{ hideAttribution: true }}
        elementsSelectable={!isReadOnly}
        deleteKeyCode={isReadOnly ? null : 'Delete'}
        selectionKeyCode={isReadOnly ? null : 'Shift'}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        minZoom={0.2}
        connectionMode={toolMode === 'line' ? undefined : undefined}
        className="bg-[#F0EEFF] dark:bg-[#080810] touch-manipulation"
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color={theme === 'dark' ? '#7A7A9A' : '#7B2FFF33'} />
        <LayoutCorrector />
        <HighlightClearer />
      </ReactFlow>
      {isAIEditing && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/20 dark:bg-[#080810]/60 backdrop-blur-[2px]">
          <div className="bg-white/90 dark:bg-[#0F0F1E]/90 backdrop-blur-xl rounded-2xl shadow-lg border border-[rgba(123,47,255,0.12)] dark:border-[rgba(198,255,77,0.12)] px-8 py-6 flex flex-col items-center gap-4">
            <Loader2 size={32} className="animate-spin text-[#7B2FFF]" />
            <p className="text-sm font-medium text-[#080810] dark:text-[#F0EEFF]">AI is editing the map...</p>
            {cancelAIEdit && (
              <button
                onClick={cancelAIEdit}
                className="px-4 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg border border-red-200 dark:border-red-800 transition-colors duration-150 flex items-center gap-1.5"
              >
                <X size={14} />
                Cancel
              </button>
            )}
          </div>
        </div>
      )}
      {mobileEditingNodeId && !isVersionPanelOpen && !isAIEditing && projectRole !== 'viewer' && <MobileCardEditor />}
      <VersionHistoryPanel />
      {projectRole !== 'viewer' && <MobileAIButton />}
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
