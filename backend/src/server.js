import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import admin from 'firebase-admin';
import db from './db/database.js';
import { runMigrations } from './db/migrations.js';
import { requireAuth } from './middleware/auth.js';
import authRouter from './routes/auth.js';
import projectsRouter from './routes/projects.js';
import canvasRouter from './routes/canvas.js';
import aiRouter from './routes/ai.js';
import sharesRouter from './routes/shares.js';

// Initialize Firebase Admin if auth is enabled
if (process.env.AUTH_ENABLED === 'true') {
  const firebaseConfig = {
    projectId: process.env.FIREBASE_PROJECT_ID,
  };
  if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    firebaseConfig.credential = admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    });
  }
  admin.initializeApp(firebaseConfig);
}

const app = express();
const PORT = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === 'production';

app.use(cors({
  origin: isProd ? false : 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Rate limiters
const authLimiter = rateLimit({ windowMs: 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false });
const aiLimiter = rateLimit({ windowMs: 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false });

// Health check (public) with DB connectivity check
app.get('/api/health', (req, res) => {
  try {
    db.prepare('SELECT 1').get();
    res.json({ status: 'ok', db: 'connected' });
  } catch {
    res.status(503).json({ status: 'error', db: 'disconnected' });
  }
});

// Auth routes (public — config endpoint must be accessible without token)
app.use('/api/auth', authLimiter, authRouter);

// All other API routes require auth
app.use('/api', requireAuth);

// Routes
app.use('/api/projects', projectsRouter);
app.use('/api/canvas', canvasRouter);
app.use('/api/ai', aiLimiter, aiRouter);
app.use('/api/projects', sharesRouter);
app.use('/api/shares', sharesRouter);

// Serve frontend static files in production
const frontendDist = path.join(__dirname, '..', '..', 'frontend', 'dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  // SPA catch-all: non-/api routes → index.html
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// Initialize database and start server
runMigrations();

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
