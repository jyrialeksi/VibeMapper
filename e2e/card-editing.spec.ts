import { test, expect } from '@playwright/test';
import { createProject, deleteProject, waitForCanvas, seedNodes } from './helpers';

test.describe('Card editing', () => {
  let projectId: string;

  test.beforeEach(async () => {
    projectId = await createProject('Card Edit Test');
  });

  test.afterEach(async () => {
    await deleteProject(projectId);
  });

  test('double-click opens card editor sidebar', async ({ page }) => {
    await seedNodes(projectId, [
      { id: 'a1', type: 'activity', position: { x: 200, y: 0 }, data: { title: 'My Activity', description: '', acceptanceCriteria: [], cardType: 'activity', priority: 'must-have' } },
    ]);

    await page.goto(`/project/${projectId}`);
    await waitForCanvas(page);
    await page.waitForTimeout(500);

    // Double-click the node
    await page.locator('.react-flow__node').first().dblclick();
    await page.waitForTimeout(300);

    // Card editor sidebar should appear with "Edit Card" heading
    await expect(page.locator('h3:has-text("Edit Card")')).toBeVisible({ timeout: 3000 });
  });

  test('edit card title via sidebar', async ({ page }) => {
    await seedNodes(projectId, [
      { id: 'a1', type: 'activity', position: { x: 200, y: 0 }, data: { title: 'Original Title', description: '', acceptanceCriteria: [], cardType: 'activity', priority: 'must-have' } },
    ]);

    await page.goto(`/project/${projectId}`);
    await waitForCanvas(page);
    await page.waitForTimeout(500);

    // Double-click to open editor
    await page.locator('.react-flow__node').first().dblclick();
    await page.waitForTimeout(300);

    // The title field is an AutoExpandTextarea (textarea), find it after the "Title" label
    const titleTextarea = page.locator('label:has-text("Title") + textarea');
    await titleTextarea.clear();
    await titleTextarea.fill('Updated Title');
    await page.waitForTimeout(300);

    // The node on canvas should reflect the change
    await expect(page.locator('.react-flow__node').first().locator('text=Updated Title')).toBeVisible();
  });

  test('Escape deselects node and closes editor', async ({ page }) => {
    await seedNodes(projectId, [
      { id: 'a1', type: 'activity', position: { x: 200, y: 0 }, data: { title: 'Test Node', description: '', acceptanceCriteria: [], cardType: 'activity', priority: 'must-have' } },
    ]);

    await page.goto(`/project/${projectId}`);
    await waitForCanvas(page);
    await page.waitForTimeout(500);

    // Double-click to open editor
    await page.locator('.react-flow__node').first().dblclick();
    await page.waitForTimeout(300);

    // Verify editor is open
    await expect(page.locator('h3:has-text("Edit Card")')).toBeVisible({ timeout: 3000 });

    // Click the canvas pane to move focus out of the editor, then press Escape
    await page.locator('.react-flow__pane').click({ position: { x: 10, y: 10 } });
    await page.waitForTimeout(200);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // Editor should close
    await expect(page.locator('h3:has-text("Edit Card")')).toBeHidden({ timeout: 3000 });
  });

  test('Delete key removes selected node', async ({ page }) => {
    await seedNodes(projectId, [
      { id: 'a1', type: 'activity', position: { x: 200, y: 0 }, data: { title: 'Delete Me', description: '', acceptanceCriteria: [], cardType: 'activity', priority: 'must-have' } },
    ]);

    await page.goto(`/project/${projectId}`);
    await waitForCanvas(page);
    await page.waitForTimeout(500);

    expect(await page.locator('.react-flow__node').count()).toBe(1);

    // Click node to select it
    await page.locator('.react-flow__node').first().click();
    await page.waitForTimeout(200);

    // Press Delete
    await page.keyboard.press('Delete');
    await page.waitForTimeout(300);

    expect(await page.locator('.react-flow__node').count()).toBe(0);
  });

  test('add multiple card types via toolbar', async ({ page }) => {
    await page.goto(`/project/${projectId}`);
    await waitForCanvas(page);

    // Add Activity
    await page.locator('button:has-text("Add Card")').click();
    await page.waitForTimeout(100);
    await page.locator('button:text-is("Activity")').click();
    await page.locator('.react-flow__pane').click({ position: { x: 200, y: 100 } });
    await page.waitForTimeout(500);
    expect(await page.locator('.react-flow__node').count()).toBe(1);

    // Add Step — click on a different spot far from the first node
    await page.locator('button:text-is("Step")').click();
    await page.locator('.react-flow__pane').click({ position: { x: 800, y: 100 } });
    await page.waitForTimeout(500);
    expect(await page.locator('.react-flow__node').count()).toBe(2);

    // Add Story — use exact text match to avoid matching "Version History"
    await page.locator('button:text-is("Story")').click();
    await page.locator('.react-flow__pane').click({ position: { x: 400, y: 500 } });
    await page.waitForTimeout(500);
    expect(await page.locator('.react-flow__node').count()).toBe(3);
  });
});
