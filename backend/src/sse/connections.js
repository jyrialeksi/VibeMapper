// SSE connection manager: tracks connected clients per project

/** @type {Map<string, Set<{res: import('express').Response, userId: string}>>} */
const clients = new Map();

/**
 * Register an SSE client for a project. Automatically removes on connection close.
 */
export function addClient(projectId, userId, res) {
  if (!clients.has(projectId)) {
    clients.set(projectId, new Set());
  }
  const client = { res, userId };
  clients.get(projectId).add(client);

  res.on('close', () => {
    const set = clients.get(projectId);
    if (set) {
      set.delete(client);
      if (set.size === 0) clients.delete(projectId);
    }
  });
}

/**
 * Broadcast an SSE event to all clients for a project, optionally excluding a user.
 */
export function broadcast(projectId, event, data, excludeUserId) {
  const set = clients.get(projectId);
  if (!set) return;

  const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of set) {
    if (excludeUserId && client.userId === excludeUserId) continue;
    client.res.write(message);
  }
}
