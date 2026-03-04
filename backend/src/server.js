import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });
import express from 'express';
import cors from 'cors';
import { runMigrations } from './db/migrations.js';
import projectsRouter from './routes/projects.js';
import canvasRouter from './routes/canvas.js';
import aiRouter from './routes/ai.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/projects', projectsRouter);
app.use('/api/canvas', canvasRouter);
app.use('/api/ai', aiRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Initialize database and start server
runMigrations();

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
