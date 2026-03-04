import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useMapStore } from '../store/useMapStore';
import type { AIModel, StoryCardData } from '../types';
import type { Node, Edge } from '@xyflow/react';

export function useAI() {
  const [models, setModels] = useState<AIModel[]>([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const projectId = useMapStore((s) => s.projectId);
  const nodes = useMapStore((s) => s.nodes);
  const edges = useMapStore((s) => s.edges);
  const mergeNodes = useMapStore((s) => s.mergeNodes);
  const applyArrangement = useMapStore((s) => s.applyArrangement);
  const setPendingSaveLabel = useMapStore((s) => s.setPendingSaveLabel);

  useEffect(() => {
    api.getModels().then((m) => {
      setModels(m);
      if (m.length > 0) setSelectedModel(m[0].id);
    }).catch(console.error);
  }, []);

  const generate = async (prompt: string) => {
    if (!selectedModel || !prompt.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await api.generateStories(prompt, selectedModel, projectId || undefined);
      const newNodes = (result.nodes || []) as Node<StoryCardData>[];
      const newEdges = (result.edges || []) as Edge[];
      mergeNodes(newNodes, newEdges);
      setPendingSaveLabel('AI Generation');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI generation failed');
    } finally {
      setLoading(false);
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

  return { models, selectedModel, setSelectedModel, loading, error, generate, arrange };
}
