const BASE_URL = process.env.USM_BACKEND_URL || 'http://localhost:3001';
const API_TOKEN = process.env.USM_API_TOKEN || '';
async function request(method, path, body) {
    const headers = { 'Content-Type': 'application/json' };
    if (API_TOKEN) {
        headers['Authorization'] = `Bearer ${API_TOKEN}`;
    }
    const res = await fetch(`${BASE_URL}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`API error ${res.status}: ${text}`);
    }
    if (res.status === 204)
        return null;
    return res.json();
}
export const api = {
    get: (path) => request('GET', path),
    post: (path, body) => request('POST', path, body),
    put: (path, body) => request('PUT', path, body),
    delete: (path) => request('DELETE', path),
};
//# sourceMappingURL=api-client.js.map