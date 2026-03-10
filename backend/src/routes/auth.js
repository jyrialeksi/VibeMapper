import crypto from 'crypto';
import { Router } from 'express';
import db from '../db/database.js';
import { requireAuth } from '../middleware/auth.js';
import { encrypt } from '../utils/encryption.js';

const router = Router();

const authEnabled = process.env.AUTH_ENABLED === 'true';

// Public: return auth config so frontend knows whether to show login
router.get('/config', (req, res) => {
  if (!authEnabled) {
    return res.json({ authEnabled: false });
  }
  // Use the app's own domain as authDomain so signInWithRedirect goes through
  // our /__/auth/ reverse proxy instead of directly to firebaseapp.com (which 404s).
  const authDomain = process.env.FIREBASE_AUTH_DOMAIN || req.get('host') || '';
  res.json({
    authEnabled: true,
    firebaseConfig: {
      apiKey: process.env.VITE_FIREBASE_API_KEY || '',
      authDomain,
      projectId: process.env.FIREBASE_PROJECT_ID || '',
    },
  });
});

// Protected: return current user info
router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare(`
    SELECT id, email, name, picture, created_at, last_login, preferred_model,
      CASE WHEN openrouter_api_key IS NOT NULL THEN 1 ELSE 0 END AS has_api_key,
      CASE WHEN mcp_api_token IS NOT NULL THEN 1 ELSE 0 END AS has_mcp_token
    FROM users WHERE id = ?
  `).get(req.user.id);
  if (!user && !authEnabled) {
    return res.json(req.user);
  }
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// No-op logout (Firebase handles it client-side, but route exists for future use)
router.post('/logout', (req, res) => {
  res.json({ success: true });
});

// API key status — never reveals the actual key
router.get('/api-key/status', requireAuth, (req, res) => {
  const row = db.prepare('SELECT openrouter_api_key FROM users WHERE id = ?').get(req.user.id);
  res.json({ hasKey: !!(row?.openrouter_api_key) });
});

// Save API key (encrypted)
router.put('/api-key', requireAuth, (req, res) => {
  const { apiKey } = req.body;
  if (!apiKey || typeof apiKey !== 'string' || !apiKey.trim()) {
    return res.status(400).json({ error: 'API key is required' });
  }
  const encrypted = encrypt(apiKey.trim());
  db.prepare('UPDATE users SET openrouter_api_key = ? WHERE id = ?').run(encrypted, req.user.id);
  res.json({ success: true, hasKey: true });
});

// Remove API key
router.delete('/api-key', requireAuth, (req, res) => {
  db.prepare('UPDATE users SET openrouter_api_key = NULL WHERE id = ?').run(req.user.id);
  res.json({ success: true, hasKey: false });
});

// Get preferred model
router.get('/preferred-model', requireAuth, (req, res) => {
  const row = db.prepare('SELECT preferred_model FROM users WHERE id = ?').get(req.user.id);
  res.json({ preferredModel: row?.preferred_model || null });
});

// Set preferred model
router.put('/preferred-model', requireAuth, (req, res) => {
  const { model } = req.body;
  if (model !== null && (typeof model !== 'string' || model.length > 200)) {
    return res.status(400).json({ error: 'Invalid model' });
  }
  db.prepare('UPDATE users SET preferred_model = ? WHERE id = ?').run(model || null, req.user.id);
  res.json({ success: true, preferredModel: model || null });
});

// Generate MCP API token
router.post('/mcp-token', requireAuth, (req, res) => {
  const raw = 'mcp_' + crypto.randomBytes(32).toString('hex');
  const hash = crypto.createHash('sha256').update(raw).digest('hex');
  db.prepare('UPDATE users SET mcp_api_token = ? WHERE id = ?').run(hash, req.user.id);
  res.json({ token: raw });
});

// Revoke MCP API token
router.delete('/mcp-token', requireAuth, (req, res) => {
  db.prepare('UPDATE users SET mcp_api_token = NULL WHERE id = ?').run(req.user.id);
  res.json({ success: true });
});

// Check MCP API token status
router.get('/mcp-token/status', requireAuth, (req, res) => {
  const row = db.prepare('SELECT mcp_api_token FROM users WHERE id = ?').get(req.user.id);
  res.json({ hasToken: !!(row?.mcp_api_token) });
});

export default router;
