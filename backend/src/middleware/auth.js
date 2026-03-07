import admin from 'firebase-admin';
import db from '../db/database.js';

const authEnabled = process.env.AUTH_ENABLED === 'true';

const DEV_USER = { id: 'local-dev', email: 'dev@local', name: 'Local Dev', picture: '' };

/**
 * Require authentication. If AUTH_ENABLED !== 'true', injects a synthetic dev user.
 */
export function requireAuth(req, res, next) {
  if (!authEnabled) {
    req.user = DEV_USER;
    return next();
  }

  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = header.slice(7);
  admin.auth().verifyIdToken(token)
    .then(decoded => {
      const user = upsertUser(decoded);
      req.user = user;
      next();
    })
    .catch(err => {
      console.error('Auth token verification failed:', err.message);
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
    if (!projectId) return res.status(400).json({ error: 'Project ID required' });

    const userId = req.user.id;

    // Check ownership
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    if (project.owner_id === userId || (!authEnabled && !project.owner_id)) {
      req.projectRole = 'owner';
      req.project = project;
      return next();
    }

    // Check shares
    const share = db.prepare(
      'SELECT role FROM project_shares WHERE project_id = ? AND user_id = ?'
    ).get(projectId, userId);

    if (!share) return res.status(403).json({ error: 'Access denied' });

    const userLevel = roleLevel[share.role] || 0;
    const requiredLevel = roleLevel[minRole] || 0;
    if (userLevel < requiredLevel) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    req.projectRole = share.role;
    req.project = project;
    next();
  };
}
