import { test, expect } from '@playwright/test';
import { createProject, deleteProject, waitForCanvas, seedNodes } from './helpers';

test.describe('AI Edit Card', () => {
  let projectId: string;

  test.beforeEach(async () => {
    projectId = await createProject('AI Edit Card Test');
  });

  test.afterEach(async () => {
    await deleteProject(projectId);
  });

  test('shows "Edit Card" when card is selected', async ({ page }) => {
    await seedNodes(projectId, [
      { id: 'a1', type: 'activity', position: { x: 200, y: 0 }, data: { title: 'My Activity', description: '', acceptanceCriteria: [], cardType: 'activity', priority: 'must-have' } },
    ]);
    await page.goto(`/project/${projectId}`);
    await waitForCanvas(page);
    await page.waitForTimeout(500);

    // Click node to select — use dispatchEvent for reliability
    const node = page.locator('.react-flow__node').first();
    await node.click();
    await page.waitForTimeout(500);

    // Verify React Flow selection happened
    await expect(page.locator('.react-flow__node.selected')).toBeVisible({ timeout: 3000 });

    // Log the actual button text for debugging
    const buttonText = await page.locator('.btn-primary').last().textContent();
    console.log('Button text after selection:', buttonText);

    // Check placeholder text
    const placeholder = await page.locator('textarea').getAttribute('placeholder');
    console.log('Placeholder after selection:', placeholder);

    // Should show "Edit Card" in AI prompt box
    await expect(page.locator('button:has-text("Edit Card")')).toBeVisible({ timeout: 5000 });
  });

  test('shows "Edit Map" when no card selected', async ({ page }) => {
    await seedNodes(projectId, [
      { id: 'a1', type: 'activity', position: { x: 200, y: 0 }, data: { title: 'My Activity', description: '', acceptanceCriteria: [], cardType: 'activity', priority: 'must-have' } },
    ]);
    await page.goto(`/project/${projectId}`);
    await waitForCanvas(page);
    await page.waitForTimeout(500);

    // No selection - should show "Edit Map"
    await expect(page.locator('button:has-text("Edit Map")')).toBeVisible({ timeout: 3000 });
  });

  test('shows "Generate" on empty canvas', async ({ page }) => {
    await page.goto(`/project/${projectId}`);
    await waitForCanvas(page);
    await page.waitForTimeout(500);

    await expect(page.locator('button:has-text("Generate")')).toBeVisible({ timeout: 3000 });
  });
});
