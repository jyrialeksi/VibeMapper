import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
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
import mcpRouter from './routes/mcp.js';

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

// Trust first proxy (Fly.io, nginx, etc.) so express-rate-limit reads X-Forwarded-For correctly
if (isProd) {
  app.set('trust proxy', 1);
}

// Firebase Auth reverse proxy — before helmet so Firebase responses pass through unmodified
if (process.env.FIREBASE_PROJECT_ID) {
  const firebaseHost = `${process.env.FIREBASE_PROJECT_ID}.firebaseapp.com`;

  // Serve init.json directly — Firebase Hosting isn't set up, so firebaseapp.com 404s this.
  // The auth handler page fetches it to get the Firebase config.
  app.get('/__/firebase/init.json', (req, res) => {
    res.json({
      apiKey: process.env.VITE_FIREBASE_API_KEY || '',
      authDomain: req.get('host') || '',
      projectId: process.env.FIREBASE_PROJECT_ID || '',
    });
  });

  app.all('/__/*', async (req, res) => {
    const targetUrl = `https://${firebaseHost}${req.originalUrl}`;
    try {
      const headers = { ...req.headers, host: firebaseHost };
      delete headers['accept-encoding'];

      const fetchOptions = { method: req.method, headers, redirect: 'manual' };

      if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
        const chunks = [];
        for await (const chunk of req) chunks.push(chunk);
        fetchOptions.body = Buffer.concat(chunks);
      }

      const upstream = await fetch(targetUrl, fetchOptions);
      res.status(upstream.status);

      for (const [key, value] of upstream.headers.entries()) {
        const lower = key.toLowerCase();
        if (['content-encoding', 'content-length', 'transfer-encoding'].includes(lower)) continue;
        res.setHeader(key, value);
      }

      const body = await upstream.arrayBuffer();
      res.end(Buffer.from(body));
    } catch (err) {
      console.error('[AUTH PROXY] Firebase proxy error:', err.message);
      res.status(502).send('Auth proxy error');
    }
  });
}

// Security headers
app.use(helmet({
  contentSecurityPolicy: isProd ? {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'sha256-+RyqG0IMFlxEWk7QyPIJnr0bKEACtZfGUm313wsRQ2g='", "https://apis.google.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://*.googleusercontent.com", "https://*.googleapis.com"],
      connectSrc: ["'self'", "https://identitytoolkit.googleapis.com", "https://securetoken.googleapis.com", "https://www.googleapis.com"],
      frameSrc: ["'self'", "https://accounts.google.com", "https://*.firebaseapp.com"],
    },
  } : false,
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: isProd ? false : 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '2mb' }));

// Rate limiters — disabled in dev mode to avoid issues with tests and HMR
const noopLimiter = (_req, _res, next) => next();
const authLimiter = isProd ? rateLimit({ windowMs: 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false }) : noopLimiter;
const aiLimiter = isProd ? rateLimit({ windowMs: 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false }) : noopLimiter;
const apiLimiter = isProd ? rateLimit({ windowMs: 60 * 1000, max: 100, standardHeaders: true, legacyHeaders: false }) : noopLimiter;

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

// All other API routes require auth + general rate limit
app.use('/api', requireAuth, apiLimiter);

// Routes
app.use('/api/projects', projectsRouter);
app.use('/api/canvas', canvasRouter);
app.use('/api/ai', aiLimiter, aiRouter);
app.use('/api/projects', sharesRouter);
app.use('/api/shares', sharesRouter);

// MCP endpoint (requires auth via Bearer token)
app.use('/mcp', requireAuth, apiLimiter, mcpRouter);

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
