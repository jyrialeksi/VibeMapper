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
  res.json({
    authEnabled: true,
    firebaseConfig: {
      apiKey: process.env.VITE_FIREBASE_API_KEY || '',
      authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || '',
      projectId: process.env.FIREBASE_PROJECT_ID || '',
    },
  });
});

// Protected: return current user info
router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
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

export default router;
