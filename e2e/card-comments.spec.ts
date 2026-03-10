import { test, expect } from '@playwright/test';
import { createProject, deleteProject, waitForCanvas, seedNodes } from './helpers';

test.describe('Card comments', () => {
  let projectId: string;

  test.beforeEach(async () => {
    projectId = await createProject('Comments Test');
  });

  test.afterEach(async () => {
    await deleteProject(projectId);
  });

  test('open comments panel via context bar', async ({ page }) => {
    await seedNodes(projectId, [
      { id: 'story-1', type: 'storyCard', position: { x: 200, y: 400 }, data: { title: 'Test Story', description: 'A test', acceptanceCriteria: ['AC1'], cardType: 'story', priority: 'must-have' } },
    ]);

    await page.goto(`/project/${projectId}`);
    await waitForCanvas(page);
    await page.waitForTimeout(500);

    // Click card then Comments
    await page.locator('.react-flow__node').first().click();
    await page.waitForTimeout(300);
    await page.getByTestId('rf__wrapper').getByRole('button', { name: 'Comments' }).click();
    await page.waitForTimeout(300);

    // Comments panel should open with empty state
    await expect(page.locator('text=No comments yet')).toBeVisible({ timeout: 3000 });
  });

  test('add comment and see it in thread', async ({ page }) => {
    await seedNodes(projectId, [
      { id: 'story-1', type: 'storyCard', position: { x: 200, y: 400 }, data: { title: 'Test Story', description: 'A test', acceptanceCriteria: ['AC1'], cardType: 'story', priority: 'must-have' } },
    ]);

    await page.goto(`/project/${projectId}`);
    await waitForCanvas(page);
    await page.waitForTimeout(500);

    // Open comments
    await page.locator('.react-flow__node').first().click();
    await page.waitForTimeout(300);
    await page.getByTestId('rf__wrapper').getByRole('button', { name: 'Comments' }).click();
    await page.waitForTimeout(300);

    // Type and send comment
    await page.locator('textarea[placeholder="Add a comment..."]').fill('This card needs more detail');
    await page.locator('textarea[placeholder="Add a comment..."]').press('Enter');
    await page.waitForTimeout(500);

    // Comment should appear
    await expect(page.locator('text=This card needs more detail')).toBeVisible({ timeout: 3000 });
  });

  test('close panel and reopen shows persisted comments', async ({ page }) => {
    await seedNodes(projectId, [
      { id: 'story-1', type: 'storyCard', position: { x: 200, y: 400 }, data: { title: 'Test Story', description: 'A test', acceptanceCriteria: ['AC1'], cardType: 'story', priority: 'must-have' } },
    ]);

    await page.goto(`/project/${projectId}`);
    await waitForCanvas(page);
    await page.waitForTimeout(500);

    // Open comments and add one
    await page.locator('.react-flow__node').first().click();
    await page.waitForTimeout(300);
    await page.getByTestId('rf__wrapper').getByRole('button', { name: 'Comments' }).click();
    await page.waitForTimeout(300);
    await page.locator('textarea[placeholder="Add a comment..."]').fill('Persisted comment');
    await page.locator('textarea[placeholder="Add a comment..."]').press('Enter');
    await page.waitForTimeout(500);

    // Close panel by clicking the X
    await page.locator('button').filter({ has: page.locator('svg.lucide-x') }).first().click();
    await page.waitForTimeout(300);

    // Reopen comments
    await page.locator('.react-flow__node').first().click();
    await page.waitForTimeout(300);
    await page.getByTestId('rf__wrapper').getByRole('button', { name: 'Comments' }).click();
    await page.waitForTimeout(500);

    // Previous comment should still be there
    await expect(page.locator('text=Persisted comment')).toBeVisible({ timeout: 3000 });
  });
});
