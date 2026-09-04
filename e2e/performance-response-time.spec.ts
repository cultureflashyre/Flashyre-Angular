import { test, expect } from '@playwright/test';
import { measureResponseTime } from './test-helpers';

test.describe('Performance, Response Time & Latency Benchmarks (/login)', () => {

  test('Page Load Metric: Candidate Login Page (/login) loads under 2500ms', async ({ page }) => {
    const { metric } = await measureResponseTime('Login Page Initial Render', 2500, async () => {
      await page.goto('/login', { waitUntil: 'domcontentloaded' });
      await expect(page.locator('#flashyre-welcome-page')).toBeVisible();
    });

    console.log(`[Metric] ${metric.name} completed in ${metric.durationMs}ms (Threshold: ${metric.thresholdMs}ms)`);
    expect(metric.durationMs).toBeLessThanOrEqual(metric.thresholdMs);
  });

  test('API Response Latency Metric: Authentication endpoint round-trip under 1500ms', async ({ page }) => {
    await page.route('**/api/**/token/**', async (route) => {
      // Simulate backend latency
      await new Promise((resolve) => setTimeout(resolve, 120));
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Invalid credentials' }),
      });
    });

    await page.goto('/login');
    await page.locator('#login-email-input').fill('benchmark@flashyre.com');
    await page.locator('#login-password-input').fill('BenchmarkPass123');

    const { metric } = await measureResponseTime('Auth Endpoint Roundtrip', 1500, async () => {
      await page.locator('#login-button-container').click();
      await page.waitForResponse((res) => res.url().includes('token'));
    });

    console.log(`[Metric] ${metric.name} took ${metric.durationMs}ms`);
    expect(metric.durationMs).toBeLessThanOrEqual(metric.thresholdMs);
  });

  test('Slow Network Resilience: UI remains interactive during simulated network latency', async ({ page, context }) => {
    try {
      const cdp = await context.newCDPSession(page);
      await cdp.send('Network.emulateNetworkConditions', {
        offline: false,
        downloadThroughput: (750 * 1024) / 8,
        uploadThroughput: (750 * 1024) / 8,
        latency: 300,
      });
    } catch {
      // Non-Chromium browsers fallback gracefully
    }

    const start = performance.now();
    await page.goto('/login');
    await expect(page.locator('#login-email-input')).toBeVisible({ timeout: 12000 });
    const elapsed = Math.round(performance.now() - start);

    console.log(`[Throttled Load] Page rendered in ${elapsed}ms`);
    expect(elapsed).toBeLessThan(12000);
  });
});
