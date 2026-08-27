import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('stitches the worked example and exposes unmatched evidence', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  await page.goto('/');
  await expect(page).toHaveTitle(/Async Trace Stitcher/);
  await expect(page.locator('h1')).toHaveCount(1);
  await page.getByRole('button', { name: 'Try the example' }).click();
  await page.getByRole('button', { name: 'Stitch the timeline' }).click();
  await expect(page.getByRole('heading', { name: 'Reviewable timeline' })).toBeVisible();
  await expect(page.getByText('5 identifier matched')).toBeVisible();
  await expect(page.getByText('1 explicitly unmatched')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Unmatched evidence' })).toBeVisible();
  await expect(page.getByText('No enabled rule matched this event to another source.')).toBeVisible();
  expect(consoleErrors).toEqual([]);
});

test('has no serious accessibility violations on the primary workflow', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Try the example' }).click();
  await page.getByRole('button', { name: 'Stitch the timeline' }).click();
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
});

test('restores the app shell and saved case offline', async ({ page, context }) => {
  await page.goto('/');
  await page.locator('#case-title').fill('Offline refund incident');
  await page.locator('#case-title').blur();
  await page.waitForTimeout(400);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise<void>((resolve) => navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), { once: true }));
    }
  });
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Find the thread through async failure.' })).toBeVisible();
  await expect(page.locator('#case-title')).toHaveValue('Offline refund incident');
  await expect(page.getByText('Offline ready')).toBeAttached();
});

test('legal routes each retain one clear page heading', async ({ page }) => {
  for (const path of ['/privacy', '/terms']) {
    await page.goto(path);
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('h1')).toHaveCount(1);
  }
});
