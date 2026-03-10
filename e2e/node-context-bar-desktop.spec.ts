import { test, expect } from '@playwright/test';
import { createProject, deleteProject, waitForCanvas, seedNodes } from './helpers';

test.describe('NodeContextBar on desktop', () => {
  let projectId: string;

  test.beforeEach(async () => {
    projectId = await createProject('Context Bar Test');
  });

  test.afterEach(async () => {
    await deleteProject(projectId);
  });

  test('click card shows context bar with Edit/Delete/Comments', async ({ page }) => {
    await seedNodes(projectId, [
      { id: 'a1', type: 'activity', position: { x: 200, y: 0 }, data: { title: 'Test Activity', description: '', acceptanceCriteria: [], cardType: 'activity', priority: 'must-have' } },
    ]);

    await page.goto(`/project/${projectId}`);
    await waitForCanvas(page);
    await page.waitForTimeout(500);

    // Click node
    await page.locator('.react-flow__node').first().click();
    await page.waitForTimeout(300);

    // Context bar should appear with all three buttons
    // Use the React Flow wrapper to scope to the context bar (avoids AI prompt buttons)
    const rfWrapper = page.getByTestId('rf__wrapper');
    await expect(rfWrapper.getByRole('button', { name: 'Edit' })).toBeVisible({ timeout: 3000 });
    await expect(rfWrapper.getByRole('button', { name: 'Delete' })).toBeVisible();
    await expect(rfWrapper.getByRole('button', { name: 'Comments' })).toBeVisible();
  });

  test('click Edit opens CardEditor sidebar', async ({ page }) => {
    await seedNodes(projectId, [
      { id: 'a1', type: 'activity', position: { x: 200, y: 0 }, data: { title: 'Test Activity', description: '', acceptanceCriteria: [], cardType: 'activity', priority: 'must-have' } },
    ]);

    await page.goto(`/project/${projectId}`);
    await waitForCanvas(page);
    await page.waitForTimeout(500);

    // Click then Edit
    await page.locator('.react-flow__node').first().click();
    await page.waitForTimeout(300);
    await page.getByTestId('rf__wrapper').getByRole('button', { name: 'Edit' }).click();
    await page.waitForTimeout(300);

    // CardEditor sidebar should appear (use h3 heading to avoid matching AI button)
    await expect(page.locator('h3:has-text("Edit Card")')).toBeVisible({ timeout: 3000 });
  });

  test('clicking empty area hides context bar', async ({ page }) => {
    await seedNodes(projectId, [
      { id: 'a1', type: 'activity', position: { x: 200, y: 0 }, data: { title: 'Test Activity', description: '', acceptanceCriteria: [], cardType: 'activity', priority: 'must-have' } },
    ]);

    await page.goto(`/project/${projectId}`);
    await waitForCanvas(page);
    await page.waitForTimeout(500);

    // Click node
    await page.locator('.react-flow__node').first().click();
    await page.waitForTimeout(300);
    const rfWrapper = page.getByTestId('rf__wrapper');
    await expect(rfWrapper.getByRole('button', { name: 'Comments' })).toBeVisible({ timeout: 3000 });

    // Click empty area
    await page.locator('.react-flow__pane').click({ position: { x: 600, y: 400 } });
    await page.waitForTimeout(300);

    // Context bar should disappear
    await expect(rfWrapper.getByRole('button', { name: 'Comments' })).toBeHidden({ timeout: 3000 });
  });
});
