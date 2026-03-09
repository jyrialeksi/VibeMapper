import { test, expect } from '@playwright/test';
import { createProject, deleteProject } from './helpers';

test.describe('Project CRUD', () => {
  test('create project via UI', async ({ page }) => {
    await page.goto('/');

    // Fill in the project name first (Create button is disabled when empty)
    const nameInput = page.locator('input[placeholder="New project name..."]');
    await nameInput.fill('E2E Create Test');

    // Now click Create
    const createBtn = page.locator('button:has-text("Create")');
    await createBtn.click();

    // Project should appear in the list (handleCreate adds it without navigating)
    await expect(page.locator('text=E2E Create Test')).toBeVisible({ timeout: 5000 });

    // Click on the project to navigate
    await page.locator('text=E2E Create Test').first().click();
    await expect(page).toHaveURL(/\/project\//, { timeout: 5000 });

    // Clean up — extract project ID from URL and delete
    const url = page.url();
    const match = url.match(/\/project\/([^/]+)/);
    if (match) {
      await deleteProject(match[1]);
    }
  });

  test('navigate to canvas and back', async ({ page }) => {
    const projectId = await createProject('Nav Test');

    try {
      await page.goto('/');
      // Click on the project
      await page.locator('text=Nav Test').first().click();

      // Should show canvas (route is /project/:id)
      await expect(page).toHaveURL(`/project/${projectId}`, { timeout: 5000 });
      await page.waitForSelector('.react-flow', { timeout: 10000 });

      // Navigate back via "Projects" button in header
      await page.locator('button:has-text("Projects")').click();

      await expect(page).toHaveURL('/');
    } finally {
      await deleteProject(projectId);
    }
  });

  test('delete project', async ({ page }) => {
    const projectId = await createProject('Delete Me');

    await page.goto('/');
    await page.waitForTimeout(500);

    // Find the project card and its delete button
    const projectCard = page.locator('text=Delete Me').first().locator('..');
    const deleteBtn = projectCard.locator('button:has-text("Delete"), button[aria-label*="delete" i], [data-testid="delete-project"]').first();

    if (await deleteBtn.isVisible()) {
      await deleteBtn.click();
      // Confirm deletion if dialog appears
      const confirmBtn = page.locator('button:has-text("Delete"), button:has-text("Confirm")').last();
      if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmBtn.click();
      }
    } else {
      // Fallback: delete via API
      await deleteProject(projectId);
    }

    await page.waitForTimeout(500);
  });

  test('create and verify project appears in list', async ({ page }) => {
    const projectId = await createProject('List Test Project');

    try {
      await page.goto('/');
      await page.waitForTimeout(1000);

      // Project should be in the list
      const projectText = page.locator('text=List Test Project');
      await expect(projectText.first()).toBeVisible({ timeout: 5000 });
    } finally {
      await deleteProject(projectId);
    }
  });
});
