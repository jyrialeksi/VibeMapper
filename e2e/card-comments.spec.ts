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

  test('comment badge appears on card and opens panel on click', async ({ page }) => {
    await seedNodes(projectId, [
      { id: 'story-1', type: 'storyCard', position: { x: 200, y: 400 }, data: { title: 'Badge Story', description: 'A test', acceptanceCriteria: ['AC1'], cardType: 'story', priority: 'must-have' } },
    ]);

    await page.goto(`/project/${projectId}`);
    await waitForCanvas(page);
    await page.waitForTimeout(500);

    // No badge initially
    const node = page.locator('.react-flow__node').first();
    await expect(node.locator('button.absolute')).not.toBeVisible();

    // Open comments and add one
    await node.click();
    await page.waitForTimeout(300);
    await page.getByTestId('rf__wrapper').getByRole('button', { name: 'Comments' }).click();
    await page.waitForTimeout(300);
    await page.locator('textarea[placeholder="Add a comment..."]').fill('Badge test comment');
    await page.locator('textarea[placeholder="Add a comment..."]').press('Enter');
    await page.waitForTimeout(500);

    // Close panel
    await page.locator('button').filter({ has: page.locator('svg.lucide-x') }).first().click();
    await page.waitForTimeout(300);
    // Deselect node
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // Badge should now show "1"
    const badge = node.locator('button.absolute');
    await expect(badge).toBeVisible({ timeout: 3000 });
    await expect(badge).toHaveText('1');

    // Click badge should open comments panel
    await badge.click();
    await page.waitForTimeout(500);
    await expect(page.locator('text=Badge test comment')).toBeVisible({ timeout: 3000 });
  });

  test('resolve comments hides badge and adds system message', async ({ page }) => {
    await seedNodes(projectId, [
      { id: 'story-1', type: 'storyCard', position: { x: 200, y: 400 }, data: { title: 'Resolve Story', description: 'A test', acceptanceCriteria: ['AC1'], cardType: 'story', priority: 'must-have' } },
    ]);

    await page.goto(`/project/${projectId}`);
    await waitForCanvas(page);
    await page.waitForTimeout(500);

    // Open comments and add two comments
    const node = page.locator('.react-flow__node').first();
    await node.click();
    await page.waitForTimeout(300);
    await page.getByTestId('rf__wrapper').getByRole('button', { name: 'Comments' }).click();
    await page.waitForTimeout(300);

    await page.locator('textarea[placeholder="Add a comment..."]').fill('First comment');
    await page.locator('textarea[placeholder="Add a comment..."]').press('Enter');
    await page.waitForTimeout(500);
    await page.locator('textarea[placeholder="Add a comment..."]').fill('Second comment');
    await page.locator('textarea[placeholder="Add a comment..."]').press('Enter');
    await page.waitForTimeout(500);

    // Resolve button should be visible
    const resolveBtn = page.getByRole('button', { name: 'Resolve' });
    await expect(resolveBtn).toBeVisible({ timeout: 3000 });

    // Click resolve
    await resolveBtn.click();
    await page.waitForTimeout(500);

    // System message should appear
    await expect(page.locator('text=Comments resolved by')).toBeVisible({ timeout: 3000 });

    // Resolve button should be hidden (no unresolved comments)
    await expect(resolveBtn).not.toBeVisible();

    // Close panel and check badge is gone
    await page.locator('button').filter({ has: page.locator('svg.lucide-x') }).first().click();
    await page.waitForTimeout(300);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    await expect(node.locator('button.absolute')).not.toBeVisible();
  });

  test('new comment after resolve shows badge again', async ({ page }) => {
    await seedNodes(projectId, [
      { id: 'story-1', type: 'storyCard', position: { x: 200, y: 400 }, data: { title: 'Re-badge Story', description: 'A test', acceptanceCriteria: ['AC1'], cardType: 'story', priority: 'must-have' } },
    ]);

    await page.goto(`/project/${projectId}`);
    await waitForCanvas(page);
    await page.waitForTimeout(500);

    const node = page.locator('.react-flow__node').first();

    // Add comment, resolve, then add another
    await node.click();
    await page.waitForTimeout(300);
    await page.getByTestId('rf__wrapper').getByRole('button', { name: 'Comments' }).click();
    await page.waitForTimeout(300);

    await page.locator('textarea[placeholder="Add a comment..."]').fill('Will be resolved');
    await page.locator('textarea[placeholder="Add a comment..."]').press('Enter');
    await page.waitForTimeout(500);

    await page.getByRole('button', { name: 'Resolve' }).click();
    await page.waitForTimeout(500);

    // Badge should be gone
    await page.locator('button').filter({ has: page.locator('svg.lucide-x') }).first().click();
    await page.waitForTimeout(300);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    await expect(node.locator('button.absolute')).not.toBeVisible();

    // Add a new comment
    await node.click();
    await page.waitForTimeout(300);
    await page.getByTestId('rf__wrapper').getByRole('button', { name: 'Comments' }).click();
    await page.waitForTimeout(300);
    await page.locator('textarea[placeholder="Add a comment..."]').fill('New unresolved');
    await page.locator('textarea[placeholder="Add a comment..."]').press('Enter');
    await page.waitForTimeout(500);

    // Close and check badge is back with count 1
    await page.locator('button').filter({ has: page.locator('svg.lucide-x') }).first().click();
    await page.waitForTimeout(300);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    const badge = node.locator('button.absolute');
    await expect(badge).toBeVisible({ timeout: 3000 });
    await expect(badge).toHaveText('1');
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
