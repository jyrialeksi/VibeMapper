import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../api/client';
import { useMapStore } from '../store/useMapStore';
import type { AIModel, StoryCardData } from '../types';
import type { Node, Edge } from '@xyflow/react';

// Cache models at module level — they don't change during a session
let cachedModels: AIModel[] | null = null;
let modelsFetchPromise: Promise<AIModel[]> | null = null;

function fetchModelsOnce(): Promise<AIModel[]> {
  if (cachedModels) return Promise.resolve(cachedModels);
  if (!modelsFetchPromise) {
    modelsFetchPromise = api.getModels().then((m) => {
      cachedModels = m;
      return m;
    }).catch((err) => {
      modelsFetchPromise = null; // Allow retry on failure
      throw err;
    });
  }
  return modelsFetchPromise;
}

// Cache preferred model fetch
let preferredModelPromise: Promise<string | null> | null = null;
let preferredModelLoaded = false;

function fetchPreferredModelOnce(): Promise<string | null> {
  if (preferredModelLoaded) return Promise.resolve(null);
  if (!preferredModelPromise) {
    preferredModelPromise = api.getPreferredModel().then((r) => {
      preferredModelLoaded = true;
      return r.preferredModel;
    }).catch(() => {
      preferredModelPromise = null;
      return null;
    });
  }
  return preferredModelPromise;
}

// Cache enabled models fetch
let enabledModelsPromise: Promise<string[] | null> | null = null;
let enabledModelsLoaded = false;
let cachedEnabledModels: string[] | null = null;

function fetchEnabledModelsOnce(): Promise<string[] | null> {
  if (enabledModelsLoaded) return Promise.resolve(cachedEnabledModels);
  if (!enabledModelsPromise) {
    enabledModelsPromise = api.getEnabledModels().then((r) => {
      enabledModelsLoaded = true;
      cachedEnabledModels = r.enabledModels;
      return r.enabledModels;
    }).catch(() => {
      enabledModelsPromise = null;
      return null;
    });
  }
  return enabledModelsPromise;
}

export function invalidateEnabledModelsCache() {
  enabledModelsPromise = null;
  enabledModelsLoaded = false;
  cachedEnabledModels = null;
}

export function useAI() {
  const [models, setModels] = useState<AIModel[]>(cachedModels ?? []);
  const [selectedModel, setSelectedModel] = useState(cachedModels?.[0]?.id ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const projectId = useMapStore((s) => s.projectId);
  const nodes = useMapStore((s) => s.nodes);
  const edges = useMapStore((s) => s.edges);
  const mergeNodes = useMapStore((s) => s.mergeNodes);
  const applyArrangement = useMapStore((s) => s.applyArrangement);
  const applyOperations = useMapStore((s) => s.applyOperations);
  const setPendingSaveLabel = useMapStore((s) => s.setPendingSaveLabel);
  const setAIEditing = useMapStore((s) => s.setAIEditing);
  const setCancelAIEdit = useMapStore((s) => s.setCancelAIEdit);

  useEffect(() => {
    let cancelled = false;

    Promise.all([fetchModelsOnce(), fetchPreferredModelOnce(), fetchEnabledModelsOnce()]).then(([fetchedModels, preferred, enabledIds]) => {
      if (cancelled) return;

      // Filter to only enabled models (null = all enabled)
      const visibleModels = enabledIds
        ? fetchedModels.filter(m => enabledIds.includes(m.id))
        : fetchedModels;

      setModels(visibleModels);

      // Use preferred model if it exists in the visible list, otherwise fall back to first
      if (preferred && visibleModels.some(m => m.id === preferred)) {
        setSelectedModel(preferred);
      } else if (visibleModels.length > 0) {
        setSelectedModel(visibleModels[0].id);
      }
    }).catch(console.error);

    return () => { cancelled = true; };
  }, []);

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const generate = async (prompt: string, selectedNodeId?: string | null) => {
    if (!selectedModel || !prompt.trim()) return;
    setLoading(true);
    setError(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;
    setAIEditing(true);
    setCancelAIEdit(cancel);

    try {
      // Read fresh state to avoid stale closures
      const currentNodes = useMapStore.getState().nodes;
      const currentEdges = useMapStore.getState().edges;
      const isEditMode = currentNodes.length > 0;

      const result = await api.generateStories(
        prompt,
        selectedModel,
        projectId || undefined,
        isEditMode ? currentNodes : undefined,
        isEditMode ? currentEdges : undefined,
        controller.signal,
        selectedNodeId,
      );

      if (result.mode === 'edit') {
        applyOperations(result.operations);
        setPendingSaveLabel('AI Edit');
      } else {
        const newNodes = (result.nodes || []) as Node<StoryCardData>[];
        const newEdges = (result.edges || []) as Edge[];
        mergeNodes(newNodes, newEdges);
        setPendingSaveLabel('AI Generation');
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        // User cancelled — no error needed
      } else {
        setError(err instanceof Error ? err.message : 'AI generation failed');
      }
    } finally {
      setLoading(false);
      setAIEditing(false);
      setCancelAIEdit(null);
      abortControllerRef.current = null;
    }
  };

  const arrange = async () => {
    if (!selectedModel || nodes.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const result = await api.arrangeNodes(nodes, edges, selectedModel);
      applyArrangement(result.nodes || []);
      setPendingSaveLabel('AI Arrangement');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI arrangement failed');
    } finally {
      setLoading(false);
    }
  };

  return { models, selectedModel, setSelectedModel, loading, error, generate, arrange, cancel };
}
