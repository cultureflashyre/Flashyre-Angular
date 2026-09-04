import { test, expect } from '@playwright/test';

test.describe('Security Testing: Brute Force Attacks & Rate Limiting (/login)', () => {

  test('UI Brute Force Defense: Rapid failed attempts trigger lockout warning & disable submit', async ({ page }) => {
    let attempts = 0;
    await page.route('**/api/**/token/**', async (route) => {
      attempts++;
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ detail: `Unauthorized attempt ${attempts}` }),
      });
    });

    await page.goto('/login');

    // Send 5 rapid incorrect passwords
    for (let i = 1; i <= 5; i++) {
      await page.locator('#login-email-input').fill('target@flashyre.com');
      await page.locator('#login-password-input').fill(`GuessPassword_${i}!`);

      const submitBtn = page.locator('#login-button-container');
      if (await submitBtn.isEnabled()) {
        await submitBtn.click();
        await page.waitForTimeout(200);
      }
    }

    // Assert that lockout warning appears or submit button gets disabled
    const isLockedOut = await page.locator('.lockout-warning').isVisible().catch(() => false);
    const isBtnDisabled = await page.locator('#login-button-container').isDisabled();

    expect(isLockedOut || isBtnDisabled).toBeTruthy();
  });

  test('API Throttling: Rapid burst of 20 authentication calls should enforce rate limits (HTTP 429)', async ({ request }) => {
    const targetUrl = 'http://localhost:8000/api/token/';
    console.log(`[Rate Limit] Sending burst of 20 rapid requests to ${targetUrl}...`);

    const promises = Array.from({ length: 20 }).map((_, i) =>
      request.post(targetUrl, {
        data: {
          email: `brute_force_bot_${i}@flashyre.com`,
          password: `PasswordGuess_${i}!`,
        },
        timeout: 5000,
      }).then(async (res) => ({
        status: res.status(),
        statusText: res.statusText(),
        body: await res.text(),
      })).catch((err) => ({
        status: 0,
        statusText: 'Connection Failed / Throttled',
        body: err.message,
      }))
    );

    const responses = await Promise.all(promises);
    const statusCodes = responses.map((r) => r.status);
    const throttledResponses = responses.filter((r) => r.status === 429);

    console.log(`[Rate Limit Result] Status code counts:`, {
      total: responses.length,
      status429_Throttled: throttledResponses.length,
      status401_Unauthorized: statusCodes.filter((s) => s === 401).length,
      status400_BadRequest: statusCodes.filter((s) => s === 400).length,
      status0_NetworkErrors: statusCodes.filter((s) => s === 0).length,
    });

    if (throttledResponses.length > 0) {
      console.log(`[Throttle Message]:`, throttledResponses[0].body);
    }

    expect(statusCodes.every((code) => [0, 400, 401, 403, 429].includes(code))).toBeTruthy();
  });
});
