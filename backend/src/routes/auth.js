import { Router } from 'express';
import db from '../db/database.js';
import { requireAuth } from '../middleware/auth.js';

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

export default router;
