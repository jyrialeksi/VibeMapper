import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../api/client';
import { useMapStore } from '../store/useMapStore';
import type { AIModel, StoryCardData } from '../types';
import type { Node, Edge } from '@xyflow/react';

export function useAI() {
  const [models, setModels] = useState<AIModel[]>([]);
  const [selectedModel, setSelectedModel] = useState('');
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
    api.getModels().then((m) => {
      setModels(m);
      if (m.length > 0) setSelectedModel(m[0].id);
    }).catch(console.error);
  }, []);

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const generate = async (prompt: string) => {
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
