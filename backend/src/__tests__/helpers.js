import Database from 'better-sqlite3';

export function createTestDb() {
  const db = new Database(':memory:');
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      owner_id TEXT DEFAULT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS canvas_states (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL UNIQUE,
      nodes TEXT DEFAULT '[]',
      edges TEXT DEFAULT '[]',
      viewport TEXT DEFAULT '{"x":0,"y":0,"zoom":1}',
      show_descriptions INTEGER DEFAULT 1,
      show_acceptance_criteria INTEGER DEFAULT 1,
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
      openrouter_api_key TEXT DEFAULT NULL,
      mcp_api_token TEXT DEFAULT NULL,
      preferred_model TEXT DEFAULT NULL,
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
      expires_at TEXT DEFAULT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_project_shares_project ON project_shares(project_id);
    CREATE INDEX IF NOT EXISTS idx_project_shares_user ON project_shares(user_id);
    CREATE TABLE IF NOT EXISTS card_comments (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      node_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      content TEXT NOT NULL,
      is_system_message INTEGER DEFAULT 0,
      resolved_at TEXT DEFAULT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_card_comments_project_node
      ON card_comments(project_id, node_id, created_at ASC);
  `);
  return db;
}

export function fakeAuth(userId = 'test-user', email = 'test@test.com') {
  return (req, _res, next) => {
    req.user = { id: userId, email, name: 'Test User' };
    next();
  };
}

export function seedProject(db, id = 'proj-1', name = 'Test Project', ownerId = 'test-user') {
  db.prepare("INSERT INTO projects (id, name, description, owner_id) VALUES (?, ?, '', ?)").run(id, name, ownerId);
  db.prepare("INSERT INTO canvas_states (id, project_id) VALUES (?, ?)").run(`cs-${id}`, id);
}

export function seedUser(db, id = 'test-user', email = 'test@test.com', name = 'Test User') {
  db.prepare("INSERT OR IGNORE INTO users (id, email, name, picture) VALUES (?, ?, ?, '')").run(id, email, name);
}

export function seedComment(db, projectId, nodeId, userId, content, id = `comment-${Date.now()}`) {
  db.prepare("INSERT INTO card_comments (id, project_id, node_id, user_id, content) VALUES (?, ?, ?, ?, ?)").run(id, projectId, nodeId, userId, content);
  return id;
}
