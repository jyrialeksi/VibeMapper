import { useCallback, useRef, useEffect, useLayoutEffect, useMemo } from 'react';
import {
  ReactFlow,
  Background,

  type ReactFlowInstance,
  type Node,
  BackgroundVariant,
} from '@xyflow/react';
import { Loader2, X, AlertTriangle, ArrowLeft, RotateCcw } from 'lucide-react';
import { useMapStore } from '../store/useMapStore';
import { useAutoSave } from '../hooks/useAutoSave';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import { useIsMobile } from '../hooks/useIsMobile';
import { api } from '../api/client';
import { nodeTypes } from './nodes';
import { edgeTypes } from './edges';
import { Toolbar } from './panels/Toolbar';
import { CardEditor } from './panels/CardEditor';
import { AIPromptBox } from './panels/AIPromptBox';
import { MobileToolbar } from './panels/MobileToolbar';
import { MobileCardEditor } from './panels/MobileCardEditor';
import { MobileAIButton } from './panels/MobileAIButton';
import { NodeContextBar } from './panels/NodeContextBar';
import { CommentsPanel } from './panels/CommentsPanel';
import { MobileCommentsPanel } from './panels/MobileCommentsPanel';
import { VersionHistoryPanel } from './panels/VersionHistoryPanel';
import { LayoutCorrector } from './LayoutCorrector';
import { HighlightClearer } from './HighlightClearer';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useNavigate } from 'react-router-dom';
import type { StoryCardData, CardType } from '../types';
import { exportToMarkdown } from '../utils/exportToMarkdown';
import { MODAL_OVERLAY, MODAL_CONTENT } from '../styles/shared';

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
  const startLoadingProject = useMapStore((s) => s.startLoadingProject);
  const setCanvasLoadError = useMapStore((s) => s.setCanvasLoadError);
  const isCanvasLoading = useMapStore((s) => s.isCanvasLoading);
  const canvasLoadError = useMapStore((s) => s.canvasLoadError);
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
  const activePanel = useMapStore((s) => s.activePanel);
  const setActivePanel = useMapStore((s) => s.setActivePanel);
  const selectedNodeId = useMapStore((s) => s.selectedNodeId);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const isReadOnly = projectRole === 'viewer' || isAIEditing;

  const visibleNodes = useMemo(() => {
    let filtered = nodes;
    if (hiddenPriorities.size > 0) {
      filtered = filtered.filter((n) => {
        if (n.data.cardType !== 'story') return true;
        return !hiddenPriorities.has(n.data.priority);
      });
    }
    // Per-node draggable: only the selected node is draggable
    if (selectedNodeId) {
      return filtered.map((n) =>
        n.id === selectedNodeId ? { ...n, draggable: true } : n
      );
    }
    return filtered;
  }, [nodes, hiddenPriorities, selectedNodeId]);

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
  const setCommentCounts = useMapStore((s) => s.setCommentCounts);
  const incrementCommentCount = useMapStore((s) => s.incrementCommentCount);
  const decrementCommentCount = useMapStore((s) => s.decrementCommentCount);
  const setCommentCount = useMapStore((s) => s.setCommentCount);

  // Clear canvas synchronously (before paint) then fetch new data.
  // Combined in one useLayoutEffect so the clear + fetch always pair together,
  // preventing Strict Mode from clearing without fetching.
  useLayoutEffect(() => {
    let cancelled = false;
    startLoadingProject(projectId);

    api.loadCanvas(projectId).then((state) => {
      if (cancelled) return;
      loadCanvas(state.nodes, state.edges, state.viewport, {
        showDescriptions: state.showDescriptions,
        showAcceptanceCriteria: state.showAcceptanceCriteria,
      });
      if (state.role) setProjectRole(state.role);
    }).catch((err) => {
      if (cancelled) return;
      console.error('Failed to load canvas:', err);
      setCanvasLoadError(err instanceof Error ? err.message : 'Failed to load project');
    });

    // Load comment counts
    api.getCommentCounts(projectId).then((counts) => {
      if (cancelled) return;
      const countMap = new Map(Object.entries(counts).map(([k, v]) => [k, v]));
      setCommentCounts(countMap);
    }).catch(console.error);

    return () => { cancelled = true; };
  }, [projectId, startLoadingProject, loadCanvas, setProjectRole, setCanvasLoadError, setCommentCounts]);

  // SSE subscription for live visibility sync
  useEffect(() => {
    if (!projectId) return;

    let es: EventSource | null = null;
    let cancelled = false;

    const connect = async () => {
      const token = await getToken();
      // If cleanup ran while we were awaiting the token, don't create the EventSource
      if (cancelled) return;

      const url = `/api/canvas/${projectId}/events${token ? `?token=${encodeURIComponent(token)}` : ''}`;
      es = new EventSource(url);

      es.addEventListener('visibility', (e) => {
        try {
          const data = JSON.parse(e.data);
          applyVisibility(data.showDescriptions, data.showAcceptanceCriteria);
        } catch { /* ignore parse errors */ }
      });

      es.addEventListener('comment_add', (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.nodeId) incrementCommentCount(data.nodeId);
        } catch { /* ignore */ }
      });

      es.addEventListener('comment_delete', (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.nodeId) decrementCommentCount(data.nodeId);
        } catch { /* ignore */ }
      });

      es.addEventListener('comments_resolve', (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.nodeId) setCommentCount(data.nodeId, 0);
        } catch { /* ignore */ }
      });

      es.onerror = () => {
        // EventSource auto-reconnects; no action needed
      };
    };

    connect();

    return () => {
      cancelled = true;
      es?.close();
    };
  }, [projectId, getToken, applyVisibility, incrementCommentCount, decrementCommentCount, setCommentCount]);

  const handlePaneClick = useCallback(
    (event: React.MouseEvent) => {
      if (projectRole !== 'viewer' && toolMode === 'addCard' && rfRef.current) {
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
      } else if (projectRole !== 'viewer' && toolMode === 'box' && rfRef.current) {
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
    [toolMode, cardTypeToAdd, addNode, setSelectedNodeId, setMobileEditingNodeId, setActivePanel, projectRole]
  );

  const handleNodeDoubleClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (isMobile) {
        setMobileEditingNodeId(node.id);
      } else {
        setSelectedNodeId(node.id);
        setActivePanel('cardEditor');
      }
      setToolMode('select');
    },
    [isMobile, setMobileEditingNodeId, setSelectedNodeId, setActivePanel, setToolMode]
  );

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      // Single click only selects — does NOT open editor
      setSelectedNodeId(node.id);
      setToolMode('select');
    },
    [setSelectedNodeId, setToolMode]
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
      {isMobile ? (
        <MobileToolbar onImport={handleImport} onExport={handleExport} onExportMarkdown={handleExportMarkdown} onDeleteProject={onDeleteProject} />
      ) : (
        <Toolbar onImport={handleImport} onExport={handleExport} onExportMarkdown={handleExportMarkdown} />
      )}
      <ReactFlow
        nodes={visibleNodes}
        edges={visibleEdges}
        onNodesChange={isReadOnly ? undefined : onNodesChange}
        onEdgesChange={isReadOnly ? undefined : onEdgesChange}
        onConnect={isReadOnly ? undefined : onConnect}
        onInit={(instance) => { rfRef.current = instance; }}
        onPaneClick={isAIEditing ? undefined : handlePaneClick}
        onNodeDoubleClick={isReadOnly ? undefined : handleNodeDoubleClick}
        onNodeClick={isAIEditing ? undefined : handleNodeClick}
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
        {/* NodeContextBar must be inside ReactFlow for useReactFlow() */}
        {!isMobile && selectedNodeId && !isVersionPanelOpen && !isAIEditing && activePanel !== 'cardEditor' && activePanel !== 'comments' && <NodeContextBar />}
        {isMobile && selectedNodeId && !mobileEditingNodeId && !isVersionPanelOpen && !isAIEditing && activePanel !== 'comments' && <NodeContextBar />}
      </ReactFlow>
      {isAIEditing && (
        <div className={MODAL_OVERLAY}>
          <div className={MODAL_CONTENT}>
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
      {isCanvasLoading && (
        <div className={MODAL_OVERLAY}>
          <div className={MODAL_CONTENT}>
            <Loader2 size={32} className="animate-spin text-[#7B2FFF]" />
            <p className="text-sm font-medium text-[#080810] dark:text-[#F0EEFF]">Loading project...</p>
          </div>
        </div>
      )}
      {canvasLoadError && (
        <div className={MODAL_OVERLAY}>
          <div className={`${MODAL_CONTENT} max-w-sm`}>
            <AlertTriangle size={32} className="text-amber-500" />
            <p className="text-sm font-medium text-[#080810] dark:text-[#F0EEFF]">Failed to load project</p>
            <p className="text-xs text-[#080810]/60 dark:text-[#F0EEFF]/60 text-center">{canvasLoadError}</p>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/')}
                className="px-4 py-1.5 text-sm font-medium text-[#080810]/70 dark:text-[#F0EEFF]/70 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors duration-150 flex items-center gap-1.5"
              >
                <ArrowLeft size={14} />
                Back
              </button>
              <button
                onClick={() => {
                  startLoadingProject(projectId);
                  api.loadCanvas(projectId).then((state) => {
                    loadCanvas(state.nodes, state.edges, state.viewport, {
                      showDescriptions: state.showDescriptions,
                      showAcceptanceCriteria: state.showAcceptanceCriteria,
                    });
                    if (state.role) setProjectRole(state.role);
                  }).catch((err) => {
                    setCanvasLoadError(err instanceof Error ? err.message : 'Failed to load project');
                  });
                }}
                className="px-4 py-1.5 text-sm font-medium text-[#7B2FFF] dark:text-[#C6FF4D] bg-[#7B2FFF]/10 dark:bg-[#C6FF4D]/10 hover:bg-[#7B2FFF]/20 dark:hover:bg-[#C6FF4D]/20 rounded-lg border border-[#7B2FFF]/20 dark:border-[#C6FF4D]/20 transition-colors duration-150 flex items-center gap-1.5"
              >
                <RotateCcw size={14} />
                Retry
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Desktop: sidebar CardEditor */}
      {!isMobile && activePanel === 'cardEditor' && selectedNodeId && !isVersionPanelOpen && !isAIEditing && projectRole !== 'viewer' && <CardEditor />}
      {/* Mobile: bottom sheet editor */}
      {isMobile && mobileEditingNodeId && !isVersionPanelOpen && !isAIEditing && projectRole !== 'viewer' && <MobileCardEditor />}
      {/* Desktop: comments sidebar */}
      {!isMobile && activePanel === 'comments' && selectedNodeId && !isVersionPanelOpen && !isAIEditing && <CommentsPanel />}
      {/* Mobile: comments bottom sheet */}
      {isMobile && activePanel === 'comments' && selectedNodeId && !mobileEditingNodeId && !isVersionPanelOpen && !isAIEditing && <MobileCommentsPanel />}
      <VersionHistoryPanel />
      {/* AI prompt: desktop bottom bar vs mobile FAB */}
      {projectRole !== 'viewer' && (isMobile
        ? (activePanel !== 'comments' && <MobileAIButton />)
        : <AIPromptBox />
      )}
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
