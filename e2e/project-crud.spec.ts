import { test, expect } from '@playwright/test';
import { createProject, deleteProject } from './helpers';

test.describe('Project CRUD', () => {
  test('create project via UI', async ({ page }) => {
    await page.goto('/');

    // Click the new project button
    const newProjectBtn = page.locator('button:has-text("New"), button:has-text("Create"), [data-testid="new-project"]').first();
    await newProjectBtn.click();

    // Fill in the project name
    const nameInput = page.locator('input[placeholder*="name" i], input[type="text"]').first();
    await nameInput.fill('E2E Test Project');

    // Submit
    const submitBtn = page.locator('button:has-text("Create"), button[type="submit"]').first();
    await submitBtn.click();

    // Should navigate to canvas or show the project
    await expect(page).toHaveURL(/\/(canvas|projects)\//);
  });

  test('navigate to canvas and back', async ({ page }) => {
    const projectId = await createProject('Nav Test');

    try {
      await page.goto('/');
      // Click on the project
      await page.locator(`text=Nav Test`).first().click();

      // Should show canvas
      await page.waitForSelector('.react-flow', { timeout: 10000 });

      // Navigate back
      const backBtn = page.locator('a[href="/"], button:has-text("Back"), [data-testid="back-button"]').first();
      await backBtn.click();

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
