import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

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

test('scrubs configured email, phone, and nested token identifiers from JSON export', async ({ page }) => {
  await page.goto('/');
  const event = '{"timestamp":"2026-01-01T00:00:00Z","request_id":"req_42","email":"alice@example.com","phone":"+1 (415) 555-0199","nested":{"accessToken":"tok_live_secret_123"}}';
  await page.locator('#source-content-0').fill(event);
  await page.locator('#source-content-0').blur();
  await page.locator('#source-content-1').fill(event.replace('00:00:00', '00:00:01'));
  await page.locator('#source-content-1').blur();
  await page.locator('#rule-fields-0').fill('request_id, email, phone, nested.accessToken');
  await page.locator('#rule-fields-0').blur();
  await page.getByRole('button', { name: 'Stitch the timeline' }).click();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export scrubbed bundle' }).click();
  const download = await downloadPromise;
  const path = await download.path();
  expect(path).not.toBeNull();
  const bundle = JSON.parse(await readFile(path as string, 'utf8')) as { timeline: Array<{ identifiers: Record<string, string[]> }> };
  const serialized = JSON.stringify(bundle);

  expect(serialized).not.toContain('alice@example.com');
  expect(serialized).not.toContain('+1 (415) 555-0199');
  expect(serialized).not.toContain('tok_live_secret_123');
  expect(Object.values(bundle.timeline[0].identifiers).flat()).toEqual(expect.arrayContaining(['[REDACTED]']));
});

test('skip link places keyboard focus at the main landmark', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.locator('.skip-link')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
});

test('header and form controls meet the 44px target-size contract', async ({ page }) => {
  await page.goto('/');
  for (const selector of ['.site-nav a', '#case-title', '#rule-fields-0', '#rule-enabled-0']) {
    const boxes = await page.locator(selector).evaluateAll((elements) => elements.map((element) => {
      const rect = element.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    }));
    expect(boxes.length).toBeGreaterThan(0);
    for (const box of boxes) {
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
  }
});

test('legal routes each retain one clear page heading', async ({ page }) => {
  for (const path of ['/privacy', '/terms']) {
    await page.goto(path);
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('h1')).toHaveCount(1);
  }
});
