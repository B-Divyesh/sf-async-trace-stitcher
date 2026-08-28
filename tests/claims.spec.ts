import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('@claim:sample-timeline builds the six-event sample timeline immediately', async ({ page }) => {
  await page.goto('/demo');
  await expect(page.getByRole('heading', { name: 'Reviewable timeline' })).toBeVisible();
  await expect(page.locator('.event')).toHaveCount(6);
  await expect(page.getByText('5 identifier matched')).toBeVisible();
  await expect(page.getByText('1 explicitly unmatched')).toBeVisible();
  await expect(page.getByText('1 parse issue')).toBeVisible();
});

test('@claim:visible-evidence names match evidence and keeps gaps visible', async ({ page }) => {
  await page.goto('/demo');
  const matchedEvents = page.locator('ol[aria-label="Matched timeline"] .event');
  await expect(matchedEvents).toHaveCount(5);
  for (let index = 0; index < 5; index += 1) {
    await expect(matchedEvents.nth(index).locator('.evidence-list')).toContainText('matched');
    await expect(matchedEvents.nth(index).locator('.evidence-list')).toContainText('=');
  }
  await expect(page.getByRole('heading', { name: 'Unmatched evidence' })).toBeVisible();
  await expect(page.getByText('No enabled rule matched this event to another source.')).toBeVisible();
  await expect(page.getByText('Some input could not be parsed.')).toBeVisible();
});

test('@claim:local-private keeps demo and real cases isolated with same-origin requests', async ({ page }) => {
  const requestOrigins: string[] = [];
  page.on('request', (request) => requestOrigins.push(new URL(request.url()).origin));
  await page.goto('/');
  await page.locator('#case-title').fill('Real customer case');
  await page.locator('#case-title').blur();
  await page.waitForTimeout(350);
  await page.getByRole('link', { name: 'Demo', exact: true }).click();
  await page.locator('#case-title').fill('Demo-only change');
  await page.locator('#case-title').blur();
  await page.waitForTimeout(350);

  const storage = await page.evaluate(async () => {
    const read = (databaseName: string) => new Promise<string | null>((resolve, reject) => {
      const open = indexedDB.open(databaseName, 1);
      open.onerror = () => reject(open.error);
      open.onsuccess = () => {
        const request = open.result.transaction('cases').objectStore('cases').get('active-draft');
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve((request.result as { title?: string } | undefined)?.title ?? null);
      };
    });
    return {
      databases: (await indexedDB.databases()).map((database) => database.name),
      realTitle: await read('async-trace-stitcher'),
      demoTitle: await read('demo:async-trace-stitcher'),
      licenseKeys: Object.keys(localStorage).filter((key) => key.startsWith('sb_license:')),
    };
  });

  expect(storage.databases).toEqual(expect.arrayContaining(['async-trace-stitcher', 'demo:async-trace-stitcher']));
  expect(storage.realTitle).toBe('Real customer case');
  expect(storage.demoTitle).toBe('Demo-only change');
  expect(storage.licenseKeys).toEqual([]);
  expect([...new Set(requestOrigins)]).toEqual(['http://127.0.0.1:4173']);
});

test('@claim:offline-reload restores the sample timeline without a network', async ({ page, context }) => {
  await page.goto('/demo');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise<void>((resolve) => navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), { once: true }));
    }
  });
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  await expect(page.locator('.event')).toHaveCount(6);
  await expect(page.getByText('Offline ready')).toBeAttached();
});

test('@claim:export-safety exports six CSV rows and a scrubbed JSON bundle for free', async ({ page }) => {
  await page.goto('/demo');
  expect(await page.evaluate(() => Object.keys(localStorage).filter((key) => key.startsWith('sb_license:')))).toEqual([]);

  const csvDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export CSV' }).click();
  const csvPath = await (await csvDownload).path();
  expect(csvPath).not.toBeNull();
  const csv = await readFile(csvPath as string, 'utf8');
  expect(csv.split('\n')).toHaveLength(7);
  expect(csv.split('\n')[0]).toBe('"timestamp","source","event","confidence","score","group","evidence"');
  expect(csv).not.toContain('customer@example.com');
  expect(csv).not.toContain('tok_demo_secret');

  const jsonDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export scrubbed bundle' }).click();
  const jsonPath = await (await jsonDownload).path();
  expect(jsonPath).not.toBeNull();
  const bundle = await readFile(jsonPath as string, 'utf8');
  expect(JSON.parse(bundle).summary.events).toBe(6);
  expect(bundle).not.toContain('customer@example.com');
  expect(bundle).not.toContain('tok_demo_secret');
  expect(bundle).toContain('[REDACTED]');
});

test('@claim:license-restore verifies an existing Pro license token', async ({ page }) => {
  await page.route('https://api.sociobot.in/api/v1/products/async-trace-stitcher/verify?license=*', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ valid: true, reason: 'ok' }),
  }));
  await page.goto('/demo');
  await page.getByRole('link', { name: 'Start for real' }).click();
  await page.getByLabel('License token').fill('verified_test_token');
  await page.getByRole('button', { name: 'Restore license' }).click();
  await expect(page.getByRole('heading', { name: 'Pro investigator tools are unlocked' })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('sb_license:async-trace-stitcher'))).toBe('verified_test_token');
});
