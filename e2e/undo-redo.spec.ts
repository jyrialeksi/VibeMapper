import { test, expect } from '@playwright/test';
import { createProject, deleteProject, waitForCanvas, seedNodes } from './helpers';

test.describe('Undo/Redo', () => {
  let projectId: string;

  test.beforeEach(async () => {
    projectId = await createProject('Undo Redo Test');
  });

  test.afterEach(async () => {
    await deleteProject(projectId);
  });

  test('undo button reverts adding a card', async ({ page }) => {
    await page.goto(`/project/${projectId}`);
    await waitForCanvas(page);

    // Switch to Add Card mode
    await page.locator('button:has-text("Add Card")').click();
    // Place a card on canvas
    await page.locator('.react-flow__pane').click({ position: { x: 400, y: 200 } });
    await page.waitForTimeout(300);

    const nodesAfterAdd = await page.locator('.react-flow__node').count();
    expect(nodesAfterAdd).toBe(1);

    // Click undo button (title="Undo (Ctrl+Z)")
    await page.locator('button[title="Undo (Ctrl+Z)"]').click();
    await page.waitForTimeout(300);

    const nodesAfterUndo = await page.locator('.react-flow__node').count();
    expect(nodesAfterUndo).toBe(0);
  });

  test('redo button restores undone action', async ({ page }) => {
    await page.goto(`/project/${projectId}`);
    await waitForCanvas(page);

    // Add a card
    await page.locator('button:has-text("Add Card")').click();
    await page.locator('.react-flow__pane').click({ position: { x: 400, y: 200 } });
    await page.waitForTimeout(300);
    expect(await page.locator('.react-flow__node').count()).toBe(1);

    // Undo
    await page.locator('button[title="Undo (Ctrl+Z)"]').click();
    await page.waitForTimeout(300);
    expect(await page.locator('.react-flow__node').count()).toBe(0);

    // Redo (title="Redo (Ctrl+Shift+Z)")
    await page.locator('button[title="Redo (Ctrl+Shift+Z)"]').click();
    await page.waitForTimeout(300);
    expect(await page.locator('.react-flow__node').count()).toBe(1);
  });

  test('Ctrl+Z keyboard shortcut triggers undo', async ({ page }) => {
    await page.goto(`/project/${projectId}`);
    await waitForCanvas(page);

    // Add a card
    await page.locator('button:has-text("Add Card")').click();
    await page.locator('.react-flow__pane').click({ position: { x: 400, y: 200 } });
    await page.waitForTimeout(300);
    expect(await page.locator('.react-flow__node').count()).toBe(1);

    // Switch back to select mode first so pane click doesn't add another card
    await page.locator('button:has-text("Select")').click();

    // Click the canvas pane to ensure focus is on canvas (not on an input)
    await page.locator('.react-flow__pane').click({ position: { x: 100, y: 100 } });
    await page.waitForTimeout(100);

    // Ctrl+Z (Meta+Z on macOS)
    const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';
    await page.keyboard.press(`${modifier}+z`);
    await page.waitForTimeout(300);
    expect(await page.locator('.react-flow__node').count()).toBe(0);
  });

  test('Ctrl+Shift+Z keyboard shortcut triggers redo', async ({ page }) => {
    await page.goto(`/project/${projectId}`);
    await waitForCanvas(page);

    // Add a card
    await page.locator('button:has-text("Add Card")').click();
    await page.locator('.react-flow__pane').click({ position: { x: 400, y: 200 } });
    await page.waitForTimeout(300);

    // Switch to select
    await page.locator('button:has-text("Select")').click();

    // Undo via keyboard (Meta on macOS)
    const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';
    await page.keyboard.press(`${modifier}+z`);
    await page.waitForTimeout(300);
    expect(await page.locator('.react-flow__node').count()).toBe(0);

    // Redo via keyboard
    await page.keyboard.press(`${modifier}+Shift+z`);
    await page.waitForTimeout(300);
    expect(await page.locator('.react-flow__node').count()).toBe(1);
  });

  test('undo/redo buttons are disabled when stack is empty', async ({ page }) => {
    await page.goto(`/project/${projectId}`);
    await waitForCanvas(page);

    // Initially both should be disabled
    await expect(page.locator('button[title="Undo (Ctrl+Z)"]')).toBeDisabled();
    await expect(page.locator('button[title="Redo (Ctrl+Shift+Z)"]')).toBeDisabled();

    // Add a card
    await page.locator('button:has-text("Add Card")').click();
    await page.locator('.react-flow__pane').click({ position: { x: 400, y: 200 } });
    await page.waitForTimeout(300);

    // Undo should now be enabled, redo still disabled
    await expect(page.locator('button[title="Undo (Ctrl+Z)"]')).toBeEnabled();
    await expect(page.locator('button[title="Redo (Ctrl+Shift+Z)"]')).toBeDisabled();
  });
});
