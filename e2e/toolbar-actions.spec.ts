import { test, expect } from '@playwright/test';
import { createProject, deleteProject, waitForCanvas, seedNodes } from './helpers';

test.describe('Toolbar actions', () => {
  let projectId: string;

  test.beforeEach(async () => {
    projectId = await createProject('Toolbar Test');
  });

  test.afterEach(async () => {
    await deleteProject(projectId);
  });

  test('Arrange button rearranges nodes', async ({ page }) => {
    // Seed nodes at overlapping positions
    await seedNodes(projectId, [
      { id: 'a1', type: 'activity', position: { x: 500, y: 500 }, data: { title: 'Activity', description: '', acceptanceCriteria: [], cardType: 'activity', priority: 'must-have' } },
      { id: 's1', type: 'step', position: { x: 500, y: 500 }, data: { title: 'Step', description: '', acceptanceCriteria: [], cardType: 'step', priority: 'must-have' } },
    ], [
      { id: 'e-a1-s1', source: 'a1', target: 's1' },
    ]);

    await page.goto(`/project/${projectId}`);
    await waitForCanvas(page);
    await page.waitForTimeout(500);

    // Click Arrange button
    const arrangeBtn = page.locator('button:has-text("Arrange")');
    await expect(arrangeBtn).toBeEnabled();
    await arrangeBtn.click();
    await page.waitForTimeout(1000);

    // After arrange, nodes should still be there
    expect(await page.locator('.react-flow__node').count()).toBe(2);

    // Undo should be available (arrange pushes a snapshot)
    await expect(page.locator('button[title="Undo (Ctrl+Z)"]')).toBeEnabled();
  });

  test('Arrange button disabled when canvas is empty', async ({ page }) => {
    await page.goto(`/project/${projectId}`);
    await waitForCanvas(page);

    await expect(page.locator('button:has-text("Arrange")')).toBeDisabled();
  });

  test('MD export triggers download', async ({ page }) => {
    await seedNodes(projectId, [
      { id: 'a1', type: 'activity', position: { x: 0, y: 0 }, data: { title: 'Test Activity', description: '', acceptanceCriteria: [], cardType: 'activity', priority: 'must-have' } },
    ]);

    await page.goto(`/project/${projectId}`);
    await waitForCanvas(page);
    await page.waitForTimeout(500);

    // Listen for download
    const downloadPromise = page.waitForEvent('download');
    await page.locator('button:has-text("MD")').click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toBe('story_map.md');
  });

  test('JSON export triggers download', async ({ page }) => {
    await seedNodes(projectId, [
      { id: 'a1', type: 'activity', position: { x: 0, y: 0 }, data: { title: 'Export Activity', description: '', acceptanceCriteria: [], cardType: 'activity', priority: 'must-have' } },
    ]);

    await page.goto(`/project/${projectId}`);
    await waitForCanvas(page);
    await page.waitForTimeout(500);

    const downloadPromise = page.waitForEvent('download');
    await page.locator('button:has-text("Export")').click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toBe('story_map.json');
  });

  test('priority filter hides/shows stories', async ({ page }) => {
    await seedNodes(projectId, [
      { id: 'a1', type: 'activity', position: { x: 0, y: 0 }, data: { title: 'Activity', description: '', acceptanceCriteria: [], cardType: 'activity', priority: 'must-have' } },
      { id: 's1', type: 'step', position: { x: 0, y: 200 }, data: { title: 'Step', description: '', acceptanceCriteria: [], cardType: 'step', priority: 'must-have' } },
      { id: 'st1', type: 'storyCard', position: { x: 0, y: 400 }, data: { title: 'Must Story', description: '', acceptanceCriteria: [], cardType: 'story', priority: 'must-have' } },
      { id: 'st2', type: 'storyCard', position: { x: 300, y: 800 }, data: { title: 'Could Story', description: '', acceptanceCriteria: [], cardType: 'story', priority: 'could-have' } },
    ], [
      { id: 'e1', source: 'a1', target: 's1' },
      { id: 'e2', source: 's1', target: 'st1' },
      { id: 'e3', source: 's1', target: 'st2' },
    ]);

    await page.goto(`/project/${projectId}`);
    await waitForCanvas(page);
    await page.waitForTimeout(500);

    // All 4 nodes visible
    expect(await page.locator('.react-flow__node').count()).toBe(4);

    // Click "Could" filter to hide could-have stories
    await page.locator('button:has-text("Could")').click();
    await page.waitForTimeout(300);

    // Could story should be hidden (3 visible)
    expect(await page.locator('.react-flow__node').count()).toBe(3);

    // Click again to show
    await page.locator('button:has-text("Could")').click();
    await page.waitForTimeout(300);
    expect(await page.locator('.react-flow__node').count()).toBe(4);
  });

  test('Desc toggle collapses descriptions on story cards', async ({ page }) => {
    await seedNodes(projectId, [
      { id: 'st1', type: 'storyCard', position: { x: 0, y: 400 }, data: { title: 'Story', description: 'Visible desc text', acceptanceCriteria: [], cardType: 'story', priority: 'must-have' } },
    ]);

    await page.goto(`/project/${projectId}`);
    await waitForCanvas(page);
    await page.waitForTimeout(500);

    // Description section should have the open class initially
    const section = page.locator('.card-section-collapsible').first();
    await expect(section).toHaveClass(/card-section-open/);

    // Click Desc to hide
    await page.locator('button:has-text("Desc")').click();
    await page.waitForTimeout(500);

    // Section should lose the open class (collapsed to 0fr)
    await expect(section).not.toHaveClass(/card-section-open/);

    // Click again to show
    await page.locator('button:has-text("Desc")').click();
    await page.waitForTimeout(500);
    await expect(section).toHaveClass(/card-section-open/);
  });

  test('AC toggle collapses acceptance criteria on story cards', async ({ page }) => {
    await seedNodes(projectId, [
      { id: 'st1', type: 'storyCard', position: { x: 0, y: 400 }, data: { title: 'Story', description: '', acceptanceCriteria: ['Given a user', 'When they login'], cardType: 'story', priority: 'must-have' } },
    ]);

    await page.goto(`/project/${projectId}`);
    await waitForCanvas(page);
    await page.waitForTimeout(500);

    // AC sections should have the open class (there are two collapsible sections per card — desc and AC)
    // AC section is the last .card-section-collapsible
    const acSection = page.locator('.card-section-collapsible').last();
    await expect(acSection).toHaveClass(/card-section-open/);

    // Click AC to hide
    await page.locator('button:has-text("AC")').click();
    await page.waitForTimeout(500);

    await expect(acSection).not.toHaveClass(/card-section-open/);

    // Toggle back
    await page.locator('button:has-text("AC")').click();
    await page.waitForTimeout(500);
    await expect(acSection).toHaveClass(/card-section-open/);
  });

  test('History button toggles version panel', async ({ page }) => {
    await page.goto(`/project/${projectId}`);
    await waitForCanvas(page);

    // Click History
    await page.locator('button:has-text("History")').click();
    await page.waitForTimeout(300);

    // Version panel should appear
    await expect(page.locator('text=Version History')).toBeVisible({ timeout: 3000 });

    // Close via X button inside the version panel (History button is covered by the panel)
    const versionPanel = page.locator('text=Version History').locator('..');
    await versionPanel.locator('button').first().click();
    await page.waitForTimeout(300);
    await expect(page.locator('text=Version History')).toBeHidden({ timeout: 3000 });
  });
});
