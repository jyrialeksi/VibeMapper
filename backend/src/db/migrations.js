import db from './database.js';

export function runMigrations() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS canvas_states (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL UNIQUE,
      nodes TEXT DEFAULT '[]',
      edges TEXT DEFAULT '[]',
      viewport TEXT DEFAULT '{"x":0,"y":0,"zoom":1}',
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS ai_history (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      prompt TEXT NOT NULL,
      response TEXT DEFAULT '{}',
      model TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS canvas_versions (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      version_number INTEGER NOT NULL,
      label TEXT DEFAULT 'Auto-save',
      nodes TEXT NOT NULL DEFAULT '[]',
      edges TEXT NOT NULL DEFAULT '[]',
      viewport TEXT NOT NULL DEFAULT '{"x":0,"y":0,"zoom":1}',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_canvas_versions_project
      ON canvas_versions(project_id, version_number DESC);

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      name TEXT NOT NULL,
      picture TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      last_login TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS project_shares (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      user_id TEXT,
      invited_email TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'viewer',
      share_token TEXT UNIQUE,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_project_shares_project
      ON project_shares(project_id);
    CREATE INDEX IF NOT EXISTS idx_project_shares_user
      ON project_shares(user_id);
    CREATE INDEX IF NOT EXISTS idx_project_shares_email
      ON project_shares(invited_email);
    CREATE INDEX IF NOT EXISTS idx_project_shares_token
      ON project_shares(share_token);
  `);

  // Add owner_id to projects if not present (SQLite lacks ADD COLUMN IF NOT EXISTS)
  const columns = db.prepare("PRAGMA table_info(projects)").all();
  if (!columns.some(c => c.name === 'owner_id')) {
    db.exec(`ALTER TABLE projects ADD COLUMN owner_id TEXT DEFAULT NULL`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner_id)`);
  }

  // Add visibility columns to canvas_states if not present
  const canvasCols = db.prepare("PRAGMA table_info(canvas_states)").all();
  if (!canvasCols.some(c => c.name === 'show_descriptions')) {
    db.exec(`ALTER TABLE canvas_states ADD COLUMN show_descriptions INTEGER DEFAULT 1`);
  }
  if (!canvasCols.some(c => c.name === 'show_acceptance_criteria')) {
    db.exec(`ALTER TABLE canvas_states ADD COLUMN show_acceptance_criteria INTEGER DEFAULT 1`);
  }

  // Add openrouter_api_key column to users
  const userCols = db.prepare("PRAGMA table_info(users)").all();
  if (!userCols.some(c => c.name === 'openrouter_api_key')) {
    db.exec(`ALTER TABLE users ADD COLUMN openrouter_api_key TEXT DEFAULT NULL`);
  }
  if (!userCols.some(c => c.name === 'mcp_api_token')) {
    db.exec(`ALTER TABLE users ADD COLUMN mcp_api_token TEXT DEFAULT NULL`);
  }
  if (!userCols.some(c => c.name === 'preferred_model')) {
    db.exec(`ALTER TABLE users ADD COLUMN preferred_model TEXT DEFAULT NULL`);
  }

  // Add expires_at column to project_shares for link expiration
  const shareCols = db.prepare("PRAGMA table_info(project_shares)").all();
  if (!shareCols.some(c => c.name === 'expires_at')) {
    db.exec(`ALTER TABLE project_shares ADD COLUMN expires_at TEXT DEFAULT NULL`);
  }

  // Add card_comments table
  db.exec(`
    CREATE TABLE IF NOT EXISTS card_comments (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      node_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      content TEXT NOT NULL,
      is_system_message INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_card_comments_project_node
      ON card_comments(project_id, node_id, created_at ASC);
  `);

  // Add resolved_at column to card_comments for resolve feature
  const commentCols = db.prepare("PRAGMA table_info(card_comments)").all();
  if (!commentCols.some(c => c.name === 'resolved_at')) {
    db.exec(`ALTER TABLE card_comments ADD COLUMN resolved_at TEXT DEFAULT NULL`);
  }

  // Ensure local-dev user exists for non-auth mode
  db.prepare(`INSERT OR IGNORE INTO users (id, email, name, picture) VALUES (?, ?, ?, ?)`)
    .run('local-dev', 'dev@local', 'Local Dev', '');
}
