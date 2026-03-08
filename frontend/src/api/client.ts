import type { Project, CanvasState, AIModel, VersionSummary, VersionDetail, AIGenerateResult, Share } from '../types';

const BASE = '/api';

// Token provider — set by AuthProvider so all requests include auth header
let tokenProvider: (() => Promise<string | null>) | null = null;
let onUnauthorized: (() => void) | null = null;

export function setTokenProvider(fn: () => Promise<string | null>) {
  tokenProvider = fn;
}

export function setOnUnauthorized(fn: () => void) {
  onUnauthorized = fn;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (tokenProvider) {
    const token = await tokenProvider();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const res = await fetch(`${BASE}${path}`, {
    headers,
    ...options,
    // Preserve signal and other options but override headers
    ...(options?.headers ? {} : {}),
  });

  if (res.status === 401) {
    onUnauthorized?.();
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// Projects
export const api = {
  listProjects: () => request<Project[]>('/projects'),
  createProject: (name: string, description = '') =>
    request<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    }),
  getProject: (id: string) => request<Project>(`/projects/${id}`),
  updateProject: (id: string, data: Partial<Pick<Project, 'name' | 'description'>>) =>
    request<Project>(`/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteProject: (id: string) =>
    request<void>(`/projects/${id}`, { method: 'DELETE' }),

  // Canvas
  loadCanvas: (projectId: string) => request<CanvasState>(`/canvas/${projectId}`),
  saveCanvas: (projectId: string, state: Omit<CanvasState, 'updated_at'> & { label?: string }) =>
    request<{ success: boolean }>(`/canvas/${projectId}`, {
      method: 'PUT',
      body: JSON.stringify(state),
    }),
  importCanvas: (projectId: string, data: Partial<CanvasState>) =>
    request<{ success: boolean }>(`/canvas/${projectId}/import`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  exportCanvas: (projectId: string) => request<unknown>(`/canvas/${projectId}/export`),

  // Versions
  listVersions: (projectId: string, limit = 50, offset = 0) =>
    request<VersionSummary[]>(`/canvas/${projectId}/versions?limit=${limit}&offset=${offset}`),
  getVersion: (projectId: string, versionId: string) =>
    request<VersionDetail>(`/canvas/${projectId}/versions/${versionId}`),
  restoreVersion: (projectId: string, versionId: string) =>
    request<{ success: boolean }>(`/canvas/${projectId}/versions/${versionId}/restore`, {
      method: 'POST',
    }),
  createNamedVersion: (projectId: string, label: string) =>
    request<VersionSummary>(`/canvas/${projectId}/versions`, {
      method: 'POST',
      body: JSON.stringify({ label }),
    }),

  // AI
  getModels: () => request<AIModel[]>('/ai/models'),
  generateStories: (prompt: string, model: string, projectId?: string, existingNodes?: unknown[], existingEdges?: unknown[], signal?: AbortSignal) =>
    request<AIGenerateResult>('/ai/generate', {
      method: 'POST',
      body: JSON.stringify({ prompt, model, projectId, existingNodes, existingEdges }),
      signal,
    }),
  arrangeNodes: (nodes: unknown[], edges: unknown[], model: string) =>
    request<{ nodes: { id: string; position: { x: number; y: number } }[] }>('/ai/arrange', {
      method: 'POST',
      body: JSON.stringify({ nodes, edges, model }),
    }),
  getAIHistory: (projectId: string) => request<unknown[]>(`/ai/history/${projectId}`),

  // Visibility
  saveVisibility: (projectId: string, showDescriptions: boolean, showAcceptanceCriteria: boolean) =>
    request<{ success: boolean }>(`/canvas/${projectId}/visibility`, {
      method: 'PUT',
      body: JSON.stringify({ showDescriptions, showAcceptanceCriteria }),
    }),

  // Shares
  listShares: (projectId: string) =>
    request<Share[]>(`/projects/${projectId}/shares`),
  addShare: (projectId: string, email: string, role: 'viewer' | 'editor') =>
    request<Share>(`/projects/${projectId}/shares`, {
      method: 'POST',
      body: JSON.stringify({ email, role }),
    }),
  updateShare: (projectId: string, shareId: string, role: 'viewer' | 'editor') =>
    request<Share>(`/projects/${projectId}/shares/${shareId}`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    }),
  removeShare: (projectId: string, shareId: string) =>
    request<void>(`/projects/${projectId}/shares/${shareId}`, { method: 'DELETE' }),
  createShareLink: (projectId: string, role: 'viewer' | 'editor' = 'viewer') =>
    request<{ token: string; url: string }>(`/projects/${projectId}/shares/link`, {
      method: 'POST',
      body: JSON.stringify({ role }),
    }),
  acceptShareLink: (token: string) =>
    request<{ projectId: string }>(`/shares/accept/${token}`, { method: 'POST' }),
};
