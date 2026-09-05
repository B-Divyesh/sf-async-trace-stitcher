import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('home explains the job and offers one-click sample data', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Build a timeline for one failed transaction');
  await expect(page.getByText('For engineers debugging a customer failure across logs, queues, and webhooks.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Try it with sample data' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Import redacted exports' })).toBeVisible();
});

test('demo opens stitched, resets, and leaves for an empty real case', async ({ page }) => {
  await page.goto('/demo');
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  await expect(page.locator('.event')).toHaveCount(6);
  await page.locator('#case-title').fill('Changed only in demo');
  await page.locator('#case-title').blur();
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(page.locator('#case-title')).toHaveValue('Payment retry failed after vendor timeout');
  await page.goto('/?demo=1');
  await expect(page.locator('.event')).toHaveCount(6);
  await page.getByRole('link', { name: 'Start for real' }).click();
  await expect(page).toHaveURL('/');
  await expect(page.locator('#case-title')).toHaveValue('Untitled incident');
  await expect(page.getByText('Demo — sample data, nothing is saved')).toHaveCount(0);
  expect(await page.evaluate(() => new Promise((resolve, reject) => {
    const open = indexedDB.open('demo:async-trace-stitcher', 1);
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const request = open.result.transaction('cases').objectStore('cases').get('active-draft');
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result ?? null);
    };
  }))).toBeNull();
});

test('malformed, invalid, and oversized imports explain the problem and recover with sample data', async ({ page }) => {
  await page.goto('/');
  await page.locator('#source-content-0').fill('{"timestamp":"2026-08-26T14:03:11Z","message":"App received request","request_id":"req_recovery"}');
  await page.locator('#source-content-0').blur();
  await page.locator('#source-content-1').fill('{"timestamp":"2026-08-26T14:03:12Z","message":"Worker received request","request_id":"req_recovery"}\nnot valid JSON');
  await page.locator('#source-content-1').blur();
  await page.getByRole('button', { name: 'Stitch the timeline' }).click();
  await expect(page.getByText('Some input could not be parsed.')).toBeVisible();
  await expect(page.getByText(/Queue \/ webhook export: Line 2:/)).toBeVisible();

  await page.locator('#import-case').setInputFiles({
    name: 'not-a-case.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"not":"a case"}'),
  });
  await expect(page.getByText('not-a-case.json is not a valid Async Trace Stitcher JSON bundle.')).toBeVisible();

  await page.locator('[data-file-source]').first().setInputFiles({
    name: 'too-large.json',
    mimeType: 'application/json',
    buffer: Buffer.alloc(10_000_001, 32),
  });
  await expect(page.getByText('too-large.json is over the 10 MB browser safety limit.')).toBeVisible();

  await page.getByRole('link', { name: 'Demo', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Reviewable timeline' })).toBeVisible();
  await expect(page.locator('.event')).toHaveCount(6);
});

test('real routes set titles, canonical URLs, and one h1', async ({ page }) => {
  const routes = [
    ['/', 'Async Trace Stitcher — incident timelines', 'https://async-trace-stitcher.sociobot.in/'],
    ['/demo', 'Demo — Async Trace Stitcher', 'https://async-trace-stitcher.sociobot.in/demo'],
    ['/privacy', 'Privacy — Async Trace Stitcher', 'https://async-trace-stitcher.sociobot.in/privacy'],
    ['/terms', 'Terms — Async Trace Stitcher', 'https://async-trace-stitcher.sociobot.in/terms'],
  ] as const;
  for (const [path, title, canonical] of routes) {
    await page.goto(path);
    await expect(page).toHaveTitle(title);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', canonical);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /async-trace-stitcher-social\.webp$/);
    await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute('href', '/apple-touch-icon.png');
  }
});

test('all internal page links resolve', async ({ page, request }) => {
  const paths = new Set<string>();
  for (const route of ['/', '/demo', '/privacy', '/terms', '/missing']) {
    await page.goto(route);
    const hrefs = await page.locator('a[href]').evaluateAll((links) => links.map((link) => (link as HTMLAnchorElement).href));
    for (const href of hrefs) {
      const url = new URL(href);
      if (url.origin === 'http://127.0.0.1:4173') paths.add(`${url.pathname}${url.search}`);
    }
  }
  for (const path of paths) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
  }
});

test('unknown routes render the designed 404 state', async ({ page }) => {
  await page.goto('/no-such-page');
  await expect(page).toHaveTitle('Page not found — Async Trace Stitcher');
  await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Return home' })).toBeVisible();
});

test('the direct static 404 uses the shared shell and route metadata', async ({ page }) => {
  await page.goto('/404.html');
  await expect(page).toHaveTitle('Page not found — Async Trace Stitcher');
  await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible();
  await expect(page.locator('main')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Primary navigation' }).getByRole('link', { name: 'Home' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Primary navigation' }).getByRole('link', { name: 'Demo' })).toBeVisible();
  await expect(page.getByRole('contentinfo').getByRole('link', { name: 'Privacy' })).toBeVisible();
  await expect(page.getByRole('contentinfo').getByRole('link', { name: 'Terms' })).toBeVisible();
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /Return to Async Trace Stitcher/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://async-trace-stitcher.sociobot.in/404.html');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /async-trace-stitcher-social\.webp$/);
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute('href', '/apple-touch-icon.png');
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
});

test('history navigation restores the route and focuses its h1', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Demo', exact: true }).click();
  await expect(page).toHaveURL('/demo');
  await expect(page.locator('main h1')).toBeFocused();
  await page.goBack();
  await expect(page).toHaveURL('/');
  await expect(page.locator('main h1')).toBeFocused();
  await expect(page.locator('#route-status')).toContainText('Async Trace Stitcher');
});

test('skip link places keyboard focus at the main landmark', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.locator('.skip-link')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
});

test('interactive targets meet the 44px contract', async ({ page }) => {
  await page.goto('/demo');
  for (const selector of ['.site-nav a', '.demo-actions > *', '#case-title', '#rule-fields-0', '#rule-enabled-0']) {
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

test('home, demo, legal, and 404 states have no serious accessibility violations', async ({ page }) => {
  for (const path of ['/', '/demo', '/privacy', '/terms', '/missing']) {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? '')), path).toEqual([]);
  }
});

test('mobile layout has no horizontal overflow and shows demo results first', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'mobile-only layout assertion');
  await page.goto('/demo');
  const widths = await page.locator('body').evaluate((body) => ({ scroll: body.scrollWidth, client: body.clientWidth }));
  expect(widths.scroll).toBeLessThanOrEqual(widths.client);
  await expect(page.getByRole('heading', { name: 'Reviewable timeline' })).toBeInViewport();
  await expect(page.getByText('5 identifier matched')).toBeInViewport();
});

test('the page emits no console or page errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/demo');
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await page.getByRole('navigation', { name: 'Primary navigation' }).getByRole('link', { name: 'Privacy' }).click();
  expect(errors).toEqual([]);
});
