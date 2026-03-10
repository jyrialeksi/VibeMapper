import crypto from 'crypto';
import admin from 'firebase-admin';
import db from '../db/database.js';

const authEnabled = process.env.AUTH_ENABLED === 'true';

const DEV_USER = { id: 'local-dev', email: 'dev@local', name: 'Local Dev', picture: '' };

/**
 * Verify a token and return the user object. Works in both auth-enabled and dev mode.
 * Returns the user or throws an error.
 */
export async function verifyTokenAndGetUser(token) {
  if (!authEnabled) {
    return DEV_USER;
  }

  if (!token) throw new Error('No token provided');

  const decoded = await admin.auth().verifyIdToken(token);
  return upsertUser(decoded);
}

/**
 * Require authentication. If AUTH_ENABLED !== 'true', injects a synthetic dev user.
 */
export function requireAuth(req, res, next) {
  if (!authEnabled) {
    req.user = DEV_USER;
    return next();
  }

  const header = req.headers.authorization;
  // Fall back to query param token for SSE (EventSource can't set headers)
  const queryToken = req.query?.token;
  if (!header?.startsWith('Bearer ') && !queryToken) {
    console.warn(`[AUTH] Missing/invalid Authorization header for ${req.method} ${req.originalUrl}`);
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = header ? header.slice(7) : queryToken;

  // MCP API token path
  if (token.startsWith('mcp_')) {
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    const user = db.prepare('SELECT * FROM users WHERE mcp_api_token = ?').get(hash);
    if (!user) {
      console.error(`[AUTH] Invalid MCP API token (hash prefix: ${hash.substring(0, 8)}...) for ${req.method} ${req.originalUrl}`);
      return res.status(401).json({ error: 'Invalid API token' });
    }
    console.log(`[AUTH] MCP token auth OK: user=${user.id} email=${user.email} for ${req.method} ${req.originalUrl}`);
    req.user = { id: user.id, email: user.email, name: user.name, picture: user.picture };
    return next();
  }

  // Firebase token path
  verifyTokenAndGetUser(token)
    .then(user => {
      console.log(`[AUTH] Firebase auth OK: user=${user.id} email=${user.email} for ${req.method} ${req.originalUrl}`);
      req.user = user;
      next();
    })
    .catch(err => {
      console.error(`[AUTH] Firebase token verification failed for ${req.method} ${req.originalUrl}:`, err.message);
      res.status(401).json({ error: 'Invalid or expired token' });
    });
}

function upsertUser(decoded) {
  const { uid, email, name, picture } = decoded;
  const displayName = name || decoded.displayName || email?.split('@')[0] || 'User';
  const pic = picture || decoded.photoURL || '';

  const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(uid);
  if (existing) {
    db.prepare("UPDATE users SET last_login = datetime('now'), name = ?, picture = ? WHERE id = ?")
      .run(displayName, pic, uid);
    return { id: uid, email, name: displayName, picture: pic };
  }

  // New user
  db.prepare('INSERT INTO users (id, email, name, picture) VALUES (?, ?, ?, ?)')
    .run(uid, email, displayName, pic);

  // First user claims all unclaimed projects
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount === 1) {
    db.prepare('UPDATE projects SET owner_id = ? WHERE owner_id IS NULL').run(uid);
  }

  // Link pending share invitations
  db.prepare('UPDATE project_shares SET user_id = ? WHERE invited_email = ? AND user_id IS NULL')
    .run(uid, email);

  return { id: uid, email, name: displayName, picture: pic };
}

/**
 * Middleware factory: check user has access to the project with at least `minRole`.
 * Roles hierarchy: owner > editor > viewer
 */
export function requireProjectAccess(minRole = 'viewer') {
  const roleLevel = { viewer: 0, editor: 1, owner: 2 };

  return (req, res, next) => {
    const projectId = req.params.projectId || req.params.id;
    if (!projectId) {
      console.warn(`[ACCESS] No project ID in request params for ${req.method} ${req.originalUrl}`);
      return res.status(400).json({ error: 'Project ID required' });
    }

    const userId = req.user.id;

    // Check ownership
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
    if (!project) {
      console.error(`[ACCESS] Project not found: projectId=${projectId}, userId=${userId}, minRole=${minRole}`);
      if (process.env.NODE_ENV !== 'production') {
        const allProjects = db.prepare('SELECT id, name, owner_id FROM projects').all();
        console.debug(`[ACCESS] Existing projects: ${JSON.stringify(allProjects.map(p => ({ id: p.id, name: p.name, owner: p.owner_id })))}`);
      }
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.owner_id === userId || (!authEnabled && !project.owner_id)) {
      console.log(`[ACCESS] Owner access granted: projectId=${projectId}, userId=${userId}`);
      req.projectRole = 'owner';
      req.project = project;
      return next();
    }

    // Check shares
    const share = db.prepare(
      'SELECT role FROM project_shares WHERE project_id = ? AND user_id = ?'
    ).get(projectId, userId);

    if (!share) {
      console.warn(`[ACCESS] Access denied: projectId=${projectId}, userId=${userId}, owner_id=${project.owner_id}, minRole=${minRole}, no share found`);
      return res.status(403).json({ error: 'Access denied' });
    }

    const userLevel = roleLevel[share.role] || 0;
    const requiredLevel = roleLevel[minRole] || 0;
    if (userLevel < requiredLevel) {
      console.warn(`[ACCESS] Insufficient permissions: projectId=${projectId}, userId=${userId}, shareRole=${share.role}, minRole=${minRole}`);
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    console.log(`[ACCESS] Share access granted: projectId=${projectId}, userId=${userId}, role=${share.role}`);
    req.projectRole = share.role;
    req.project = project;
    next();
  };
}
