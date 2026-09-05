import { createHash } from 'node:crypto';
import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

async function changeField(page: Page, selector: string, value: string): Promise<void> {
  await page.locator(selector).fill(value);
  await page.locator(selector).blur();
}

async function buildTwoEventTimeline(page: Page): Promise<void> {
  await changeField(page, '#source-content-0', '{"timestamp":"2026-08-26T14:05:00Z","message":"Checkout queued","request_id":"req_review"}');
  await changeField(page, '#source-content-1', '{"timestamp":"2026-08-26T14:01:00Z","message":"Worker received request","request_id":"req_review"}');
  await page.getByRole('button', { name: 'Stitch the timeline' }).click();
  await expect(page.getByRole('heading', { name: 'Reviewable timeline' })).toBeVisible();
}

async function unlockPro(page: Page): Promise<void> {
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
}

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
  await page.getByRole('button', { name: 'Export CSV timeline' }).click();
  const csvPath = await (await csvDownload).path();
  expect(csvPath).not.toBeNull();
  const csv = await readFile(csvPath as string, 'utf8');
  expect(csv.split('\n')).toHaveLength(7);
  expect(csv.split('\n')[0]).toBe('"timestamp","source","event","confidence","score","group","evidence"');
  expect(csv).not.toContain('customer@example.com');
  expect(csv).not.toContain('tok_demo_secret');

  const jsonDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export JSON bundle' }).click();
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

test('@claim:timeline-ordering renders matched events in parsed timestamp order', async ({ page }) => {
  await page.goto('/demo');
  await buildTwoEventTimeline(page);
  await expect(page.locator('ol[aria-label="Matched timeline"] .event h3')).toHaveText([
    'Worker received request',
    'Checkout queued',
  ]);
});

test('@claim:proximity-does-not-match keeps nearby events without a shared identifier unmatched', async ({ page }) => {
  await page.goto('/demo');
  await changeField(page, '#source-content-0', '{"timestamp":"2026-08-26T14:01:00Z","message":"App event","request_id":"req_app"}');
  await changeField(page, '#source-content-1', '{"timestamp":"2026-08-26T14:01:05Z","message":"Queue event","request_id":"req_queue"}');
  await changeField(page, '#source-content-2', '');
  await page.getByRole('button', { name: 'Stitch the timeline' }).click();
  await expect(page.locator('ol[aria-label="Matched timeline"] .event')).toHaveCount(0);
  await expect(page.getByText('2 explicitly unmatched')).toBeVisible();
  await expect(page.locator('ol[aria-label="Unmatched evidence"] .event')).toHaveCount(2);
});

test('@claim:local-import-boundary imports locally and labels results as proposed', async ({ page }) => {
  const requests: Array<{ origin: string; method: string; body: string | null }> = [];
  page.on('request', (request) => requests.push({ origin: new URL(request.url()).origin, method: request.method(), body: request.postData() }));
  await page.goto('/demo');
  await buildTwoEventTimeline(page);
  await expect(page.getByText('Proposed, not proven')).toBeVisible();
  expect(requests).not.toHaveLength(0);
  expect(requests.every((request) => request.origin === 'http://127.0.0.1:4173')).toBe(true);
  expect(requests.every((request) => request.method === 'GET' && request.body === null)).toBe(true);
});

test('@claim:markdown-export downloads review notes for a restored license', async ({ page }) => {
  await unlockPro(page);
  await buildTwoEventTimeline(page);
  const markdownDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export Markdown notes' }).click();
  const markdownPath = await (await markdownDownload).path();
  expect(markdownPath).not.toBeNull();
  const markdown = await readFile(markdownPath as string, 'utf8');
  expect(markdown).toContain('# Untitled incident');
  expect(markdown).toContain('Worker received request');
  expect(markdown).toContain('Checkout queued');
  expect(markdown).toContain('Proposed matching');
});

test('@claim:rule-preset-roundtrip restores saved matching rules', async ({ page }) => {
  await unlockPro(page);
  await changeField(page, '#rule-name-0', 'Shipment identifier');
  await changeField(page, '#rule-fields-0', 'shipment_id');
  const presetDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Save rule preset' }).click();
  const presetPath = await (await presetDownload).path();
  expect(presetPath).not.toBeNull();
  const preset = await readFile(presetPath as string);
  await changeField(page, '#rule-name-0', 'Changed rule');
  await changeField(page, '#rule-fields-0', 'changed_field');
  await page.locator('#import-rules').setInputFiles({ name: 'saved-rules.json', mimeType: 'application/json', buffer: preset });
  await expect(page.locator('#rule-name-0')).toHaveValue('Shipment identifier');
  await expect(page.locator('#rule-fields-0')).toHaveValue('shipment_id');
});

test('@claim:service-worker-update-notice offers an update when a new worker waits', async ({ page }) => {
  await page.goto('/demo');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise<void>((resolve) => navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), { once: true }));
    }
  });
  await page.reload();
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  await page.route('**/sw.js?claim-update=1', (route) => route.fulfill({
    contentType: 'application/javascript',
    body: "self.addEventListener('install', () => {}); self.addEventListener('activate', () => {}); self.addEventListener('message', (event) => { if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting(); });",
  }));
  await page.evaluate(() => navigator.serviceWorker.register('/sw.js?claim-update=1'));
  await expect(page.getByText('A new offline version is ready.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Update now' })).toBeVisible();
});

test('@claim:purchase-paused shows restoration without a new-purchase action', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Restore Pro investigator tools' })).toBeVisible();
  await expect(page.getByText('This app does not sell new licenses.')).toBeVisible();
  await expect(page.locator('a[href*="/checkout"]')).toHaveCount(0);
});

test('@claim:original-hero-asset displays disclosed product-specific art with recorded provenance', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('img', { name: 'A paper-cut application, queue, and webhook connected by teal thread into one evidence timeline' })).toBeVisible();
  await expect(page.getByText('The hero image was generated for this product.')).toBeVisible();
  const record = JSON.parse(await readFile('assets/src/hero-paper-trace.json', 'utf8')) as { hashes: Record<string, string> };
  const files = {
    source: 'assets/src/hero-paper-trace.png',
    large: 'public/assets/hero-paper-trace.webp',
    small: 'public/assets/hero-paper-trace-small.webp',
    social: 'public/assets/async-trace-stitcher-social.webp',
  };
  for (const [key, file] of Object.entries(files)) {
    const hash = createHash('sha256').update(await readFile(file)).digest('hex');
    expect(hash).toBe(record.hashes[key]);
  }
});
