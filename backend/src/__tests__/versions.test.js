import { describe, it, expect, beforeEach, vi } from 'vitest';
import Database from 'better-sqlite3';

function createTestDb() {
  const db = new Database(':memory:');
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

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
  `);

  db.prepare("INSERT INTO projects (id, name) VALUES ('proj-1', 'Test Project')").run();
  db.prepare("INSERT INTO canvas_states (id, project_id) VALUES ('cs-1', 'proj-1')").run();

  return db;
}

describe('Version helpers', () => {
  let db;
  let createVersion, listVersions, getVersion;

  beforeEach(async () => {
    db = createTestDb();

    // Reset all modules so versions.js re-imports database.js
    vi.resetModules();
    vi.doMock('../db/database.js', () => ({ default: db }));

    const mod = await import('../db/versions.js');
    createVersion = mod.createVersion;
    listVersions = mod.listVersions;
    getVersion = mod.getVersion;
  });

  it('createVersion increments version_number per project', () => {
    const v1 = createVersion('proj-1', [{ id: 'n1' }], [], { x: 0, y: 0, zoom: 1 });
    expect(v1.version_number).toBe(1);
    expect(v1.label).toBe('Auto-save');

    const v2 = createVersion('proj-1', [{ id: 'n2' }], [], { x: 0, y: 0, zoom: 1 });
    expect(v2.version_number).toBe(2);
  });

  it('createVersion with custom label', () => {
    const v = createVersion('proj-1', [], [], { x: 0, y: 0, zoom: 1 }, 'My Snapshot');
    expect(v.label).toBe('My Snapshot');
  });

  it('listVersions returns DESC order', () => {
    createVersion('proj-1', [], [], { x: 0, y: 0, zoom: 1 }, 'v1');
    createVersion('proj-1', [], [], { x: 0, y: 0, zoom: 1 }, 'v2');
    createVersion('proj-1', [], [], { x: 0, y: 0, zoom: 1 }, 'v3');

    const versions = listVersions('proj-1');
    expect(versions).toHaveLength(3);
    expect(versions[0].version_number).toBe(3);
    expect(versions[1].version_number).toBe(2);
    expect(versions[2].version_number).toBe(1);
  });

  it('listVersions supports limit and offset', () => {
    for (let i = 0; i < 5; i++) {
      createVersion('proj-1', [], [], { x: 0, y: 0, zoom: 1 });
    }

    const page1 = listVersions('proj-1', 2, 0);
    expect(page1).toHaveLength(2);
    expect(page1[0].version_number).toBe(5);

    const page2 = listVersions('proj-1', 2, 2);
    expect(page2).toHaveLength(2);
    expect(page2[0].version_number).toBe(3);
  });

  it('getVersion returns full data', () => {
    const nodes = [{ id: 'n1', type: 'storyCard' }];
    const edges = [{ id: 'e1', source: 'n1', target: 'n2' }];
    const viewport = { x: 10, y: 20, zoom: 1.5 };

    const created = createVersion('proj-1', nodes, edges, viewport, 'Test');
    const version = getVersion('proj-1', created.id);

    expect(version).toBeDefined();
    expect(version.version_number).toBe(1);
    expect(version.label).toBe('Test');
    expect(JSON.parse(version.nodes)).toEqual(nodes);
    expect(JSON.parse(version.edges)).toEqual(edges);
    expect(JSON.parse(version.viewport)).toEqual(viewport);
    expect(version.created_at).toBeDefined();
  });

  it('getVersion returns undefined for nonexistent version', () => {
    const version = getVersion('proj-1', 'nonexistent');
    expect(version).toBeUndefined();
  });

  it('prunes versions beyond 100 limit', () => {
    for (let i = 0; i < 102; i++) {
      createVersion('proj-1', [{ id: `n${i}` }], [], { x: 0, y: 0, zoom: 1 });
    }

    const versions = listVersions('proj-1', 200);
    expect(versions.length).toBeLessThanOrEqual(100);
  });

  it('cascade: deleting project removes its versions', () => {
    createVersion('proj-1', [], [], { x: 0, y: 0, zoom: 1 });
    createVersion('proj-1', [], [], { x: 0, y: 0, zoom: 1 });

    db.prepare("DELETE FROM projects WHERE id = 'proj-1'").run();

    const versions = listVersions('proj-1');
    expect(versions).toHaveLength(0);
  });
});
