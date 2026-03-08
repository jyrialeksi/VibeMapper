export interface ApiClient {
  get: (path: string) => Promise<unknown>;
  post: (path: string, body?: unknown) => Promise<unknown>;
  put: (path: string, body?: unknown) => Promise<unknown>;
  delete: (path: string) => Promise<unknown>;
}

export function createApiClient(baseUrl: string, token: string): ApiClient {
  async function request(method: string, path: string, body?: unknown): Promise<unknown> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`API error ${res.status}: ${text}`);
    }

    if (res.status === 204) return null;
    return res.json();
  }

  return {
    get: (path: string) => request('GET', path),
    post: (path: string, body?: unknown) => request('POST', path, body),
    put: (path: string, body?: unknown) => request('PUT', path, body),
    delete: (path: string) => request('DELETE', path),
  };
}

// Default singleton for stdio mode (reads env vars)
export const api = createApiClient(
  process.env.USM_BACKEND_URL || 'http://localhost:3001',
  process.env.USM_API_TOKEN || ''
);
