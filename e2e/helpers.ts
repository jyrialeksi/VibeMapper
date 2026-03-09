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
 */
export async function waitForCanvas(page: Page): Promise<void> {
  await page.waitForSelector('.react-flow', { timeout: 10000 });
}

/**
 * Get all project names from the project list page.
 */
export async function getProjectNames(page: Page): Promise<string[]> {
  await page.waitForSelector('[data-testid="project-card"], [class*="project"]', { timeout: 5000 }).catch(() => {});
  return page.locator('[data-testid="project-card"] h3, [data-testid="project-name"]').allTextContents();
}
