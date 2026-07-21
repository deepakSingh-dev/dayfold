import { expect, test } from '@playwright/test';

/**
 * End-to-end smoke test covering the critical path:
 *   signup → create project → create task → edit description →
 *   turn into task (from a note) → complete from the note.
 *
 * Requires the stack running (docker compose up -d && npm run dev) with
 * DEV_AUTH_BYPASS=false so the real auth flow is exercised.
 */
test('critical path: signup → project → task → description → turn-into → complete', async ({
  page,
}) => {
  const email = `smoke-${Date.now()}@example.com`;

  // 1. Signup → lands in a bootstrapped workspace
  await page.goto('/signup');
  await page.fill('#name', 'Smoke Tester');
  await page.fill('#email', email);
  await page.fill('#password', 'smoketest123');
  await page.click('button[type=submit]');
  await page.waitForURL('**/home');
  await expect(page.getByText('Product Launch').first()).toBeVisible();

  // 2. Create a project via the sidebar "+"
  await page.click('[aria-label="New project"]');
  await page.fill('#project-name', 'Smoke Project');
  await page.click('button:has-text("Create project")');
  await page.waitForURL('**/projects/**');
  await expect(page.getByRole('heading', { name: 'Smoke Project' })).toBeVisible();

  // 3. Create a task via the inline add row
  await page.getByText('Add task').first().click();
  await page.keyboard.type('Ship the smoke test');
  await page.keyboard.press('Enter');
  await expect(page.getByText('Ship the smoke test')).toBeVisible();

  // 4. Open the task and edit its description
  await page.click('text=Ship the smoke test');
  await page.waitForSelector('.df-prose');
  await page.locator('.df-prose').click();
  await page.keyboard.type('A rich description.');
  await expect(page.locator('.df-prose')).toContainText('A rich description.');
  await page.keyboard.press('Escape');

  // 5. In the Welcome note, turn a line into a task
  await page.getByText('Welcome to Dayfold').first().click();
  await page.waitForSelector('.df-prose');
  await page.locator('.df-prose').click();
  await page.keyboard.press('Control+A');
  await page.keyboard.press('Delete');
  await page.keyboard.type('Bake the launch cake');
  await page.getByText('Bake the launch cake').first().click({ clickCount: 3 });
  await page.waitForSelector('.df-bubble');
  await page.click('.df-bm-turn-trigger');
  await page.click('.df-bm-menu >> text=Task');
  await page.waitForSelector('text=Turn into task');
  await page.click('button:has-text("Create task")');
  await page.waitForSelector('.df-task-block');

  // 6. Complete the task from the note's checkbox
  await page.locator('.df-task-block-check').first().check();
  await expect(page.locator('.df-task-block.is-completed')).toBeVisible();
});
