import { Page } from '@playwright/test';

const API_BASE = 'http://localhost:3001/api';

/**
 * Create a project via API and return its ID.
 */
export async function createProject(name: string): Promise<string> {
  const res = await fetch(`${API_BASE}/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  const data = await res.json();
  return data.id;
}

/**
 * Delete a project via API.
 */
export async function deleteProject(id: string): Promise<void> {
  await fetch(`${API_BASE}/projects/${id}`, { method: 'DELETE' });
}

/**
 * Wait for the canvas to be loaded (React Flow renders).
 * If the onboarding view appears (empty project), skip it first.
 */
export async function waitForCanvas(page: Page): Promise<void> {
  // Wait for either the canvas or the onboarding skip button
  const result = await Promise.race([
    page.waitForSelector('.react-flow', { timeout: 10000 }).then(() => 'canvas' as const),
    page.waitForSelector('button:has-text("Skip and start with an empty canvas")', { timeout: 10000 }).then(() => 'onboarding' as const),
  ]);

  if (result === 'onboarding') {
    await page.click('button:has-text("Skip and start with an empty canvas")');
    await page.waitForSelector('.react-flow', { timeout: 10000 });
  }
}

/**
 * Seed nodes and edges into a project's canvas via API.
 */
export async function seedNodes(
  projectId: string,
  nodes: Record<string, unknown>[],
  edges: Record<string, unknown>[] = [],
): Promise<void> {
  const res = await fetch(`${API_BASE}/canvas/${projectId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nodes,
      edges,
      viewport: { x: 0, y: 0, zoom: 1 },
    }),
  });
  if (!res.ok) {
    throw new Error(`seedNodes failed: ${res.status} ${await res.text()}`);
  }
}

/**
 * Get all project names from the project list page.
 */
export async function getProjectNames(page: Page): Promise<string[]> {
  await page.waitForSelector('[data-testid="project-card"], [class*="project"]', { timeout: 5000 }).catch(() => {});
  return page.locator('[data-testid="project-card"] h3, [data-testid="project-name"]').allTextContents();
}
