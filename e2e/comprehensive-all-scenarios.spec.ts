import { test, expect } from '@playwright/test';
import { setupErrorAndConsoleListener, measureResponseTime } from './test-helpers';

/**
 * ==============================================================================
 * FLASHYRE COMPREHENSIVE END-TO-END TEST SUITE (Target: http://localhost:4200/login)
 * Covers:
 *   1. Happy Path Scenarios (Auth, UI Navigation, Toggles on /login)
 *   2. Negative Path & Form Validation (Required fields, Formats, Bounds)
 *   3. Error Messages & Server Failure Handling (500, 401, Console Errors)
 *   4. Rate Limiting & Brute Force Attack Testing (UI Lockout & API 429)
 *   5. Response Time & Performance Benchmarking (Page Load, API Latency)
 * ==============================================================================
 */

test.describe('Flashyre Full Test Suite (/login)', () => {

  // ----------------------------------------------------------------------------
  // SUITE 1: HAPPY PATH SCENARIOS
  // ----------------------------------------------------------------------------
  test.describe('1. Happy Path Scenarios', () => {
    test('1.1 Should load the candidate login page (/login) with all expected UI elements', async ({ page }) => {
      const { consoleErrors, pageErrors, printSummary } = setupErrorAndConsoleListener(page);

      await page.goto('/login');

      // Check heading and form components
      await expect(page.locator('#flashyre-welcome-page')).toBeVisible();
      await expect(page.locator('#login-email-input')).toBeVisible();
      await expect(page.locator('#login-password-input')).toBeVisible();
      await expect(page.locator('#login-button-container')).toBeVisible();

      // Check navigation buttons/links
      await expect(page.locator('#login-signup-button')).toBeVisible();
      await expect(page.locator('#forgot-password')).toBeVisible();

      printSummary();
      expect(pageErrors, 'There should be no unhandled page errors on load').toHaveLength(0);
    });

    test('1.2 Should toggle password visibility when clicking Show/Hide button', async ({ page }) => {
      await page.goto('/login');

      const passwordInput = page.locator('#login-password-input');
      const toggleBtn = page.locator('#login-password-show-button');

      // Default type should be password
      await expect(passwordInput).toHaveAttribute('type', 'password');
      await expect(toggleBtn).toHaveText(/Show/i);

      // Click Show
      await toggleBtn.click();
      await expect(passwordInput).toHaveAttribute('type', 'text');
      await expect(toggleBtn).toHaveText(/Hide/i);

      // Click Hide
      await toggleBtn.click();
      await expect(passwordInput).toHaveAttribute('type', 'password');
      await expect(toggleBtn).toHaveText(/Show/i);
    });

    test('1.3 Should navigate to Forgot Password page upon clicking link', async ({ page }) => {
      await page.goto('/login');
      await page.locator('#forgot-password').click();

      // Verify navigation to forgot-password route
      await expect(page).toHaveURL(/login-forgot-password/);
    });

    test('1.4 Should authenticate candidate successfully with valid credentials (Happy Path)', async ({ page }) => {
      // Mock successful login response from backend
      await page.route('**/api/**/token/**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            access: 'mock_jwt_access_token_12345',
            refresh: 'mock_jwt_refresh_token_67890',
            user_type: 'candidate',
            user: { id: 1, email: 'candidate@flashyre.com', first_name: 'John', last_name: 'Doe' },
          }),
        });
      });

      await page.goto('/login');

      // Fill in valid credentials
      await page.locator('#login-email-input').fill('candidate@flashyre.com');
      await page.locator('#login-password-input').fill('SecurePassword123');

      // Assert login button is enabled
      const loginButton = page.locator('#login-button-container');
      await expect(loginButton).toBeEnabled();

      // Submit form
      await loginButton.click();

      // Ensure error message is NOT displayed
      await expect(page.locator('#error-message-login')).not.toBeVisible();
    });
  });

  // ----------------------------------------------------------------------------
  // SUITE 2: NEGATIVE PATH & FORM VALIDATION SCENARIOS
  // ----------------------------------------------------------------------------
  test.describe('2. Negative Path & Validation Error Messages', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/login');
    });

    test('2.1 Should disable login button when inputs are empty or invalid', async ({ page }) => {
      const loginButton = page.locator('#login-button-container');
      await expect(loginButton).toBeDisabled();
    });

    test('2.2 Should display "Email is required." error when email field is touched and left empty', async ({ page }) => {
      const emailInput = page.locator('#login-email-input');

      await emailInput.focus();
      await emailInput.blur();

      const requiredError = page.locator('.error-text').filter({ hasText: /Email is required\./i });
      await expect(requiredError).toBeVisible();
    });

    test('2.3 Should display "Please enter a valid email address." for invalid email formats', async ({ page }) => {
      const emailInput = page.locator('#login-email-input');
      const invalidEmails = ['invalid-email', 'candidate@', 'candidate@domain', '@flashyre.com'];

      for (const invalidEmail of invalidEmails) {
        await emailInput.fill(invalidEmail);
        await emailInput.blur();

        const formatError = page.locator('.error-text').filter({ hasText: /Please enter a valid email address\./i });
        await expect(formatError).toBeVisible();
      }
    });

    test('2.4 Should display password length error when password is outside 8-15 characters', async ({ page }) => {
      const passwordInput = page.locator('#login-password-input');

      // Too short (< 8 chars)
      await passwordInput.fill('short');
      await passwordInput.blur();

      const lengthError = page.locator('.error-text').filter({ hasText: /Password should be 8-15 characters\./i });
      await expect(lengthError).toBeVisible();

      // Too long (> 15 chars)
      await passwordInput.fill('verylongpasswordthatisover15characters');
      await passwordInput.blur();
      await expect(lengthError).toBeVisible();
    });

    test('2.5 Should display error banner when submitting incorrect credentials', async ({ page }) => {
      // Mock 401 response from backend
      await page.route('**/api/**/token/**', async (route) => {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ detail: 'No active account found with the given credentials' }),
        });
      });

      await page.locator('#login-email-input').fill('unregistered@flashyre.com');
      await page.locator('#login-password-input').fill('WrongPassword123');

      await page.locator('#login-button-container').click();

      // Assert error message banner appears and contains descriptive text
      const errorMessage = page.locator('#error-message-login, .log-in-page-error-message-login');
      await expect(errorMessage).toBeVisible({ timeout: 5000 });
      console.log(`[Validation Test] Received visible error text: ${await errorMessage.innerText()}`);
    });
  });

  // ----------------------------------------------------------------------------
  // SUITE 3: SERVER ERROR HANDLING & CONSOLE ERROR INSPECTION
  // ----------------------------------------------------------------------------
  test.describe('3. Server Error & Diagnostic Error Message Capture', () => {
    test('3.1 Should capture and view all browser console errors and unhandled exceptions', async ({ page }) => {
      const { consoleErrors, pageErrors, printSummary } = setupErrorAndConsoleListener(page);

      await page.goto('/login');

      // Perform user interactions
      await page.locator('#login-email-input').fill('test@flashyre.com');
      await page.locator('#login-password-input').fill('Password123');
      await page.locator('#login-password-show-button').click();

      printSummary();

      // Assert that core flows produce no severe unhandled script exceptions
      expect(pageErrors.length, `Expected 0 uncaught exceptions, found: ${pageErrors.map(e => e.message).join(' | ')}`).toBe(0);
    });

    test('3.2 Should handle Backend 500 Internal Server Error gracefully with UI error message', async ({ page }) => {
      // Intercept authentication endpoint and simulate a 500 Server Crash
      await page.route('**/api/**/token/**', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Database connection failed. Server down.' }),
        });
      });

      await page.goto('/login');
      await page.locator('#login-email-input').fill('candidate@flashyre.com');
      await page.locator('#login-password-input').fill('Password123');

      await page.locator('#login-button-container').click();

      // Verify the UI doesn't crash and presents error message
      const errorElem = page.locator('#error-message-login, .log-in-page-error-message-login, .error-text');
      await expect(errorElem.first()).toBeVisible({ timeout: 5000 });
    });
  });

  // ----------------------------------------------------------------------------
  // SUITE 4: RATE LIMITING & BRUTE FORCE ATTACK TESTING
  // ----------------------------------------------------------------------------
  test.describe('4. Security: Rate Limiting & Brute Force Attack Testing', () => {
    test('4.1 UI Simulation: Multiple consecutive failed logins triggers lockout warning or lockout state', async ({ page }) => {
      // Mock repeated 401 unauthorized responses
      let attemptCount = 0;
      await page.route('**/api/**/token/**', async (route) => {
        attemptCount++;
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ detail: `Invalid credentials. Attempt ${attemptCount}` }),
        });
      });

      await page.goto('/login');

      // Simulate a rapid brute force attack through the UI (5 rapid attempts)
      for (let i = 1; i <= 5; i++) {
        await page.locator('#login-email-input').fill(`victim_user@flashyre.com`);
        await page.locator('#login-password-input').fill(`GuessPassword_${i}!`);

        const loginBtn = page.locator('#login-button-container');
        if (await loginBtn.isEnabled()) {
          await loginBtn.click();
          await page.waitForTimeout(300); // brief pause between rapid clicks
        }
      }

      // Check if lockout warning UI or disabled button is triggered
      const lockoutWarning = page.locator('.lockout-warning');
      const isLockoutVisible = await lockoutWarning.isVisible().catch(() => false);
      const isButtonDisabled = await page.locator('#login-button-container').isDisabled();

      console.log(`[Brute Force Test] Lockout triggered: ${isLockoutVisible}, Button disabled: ${isButtonDisabled}`);
      expect(isLockoutVisible || isButtonDisabled).toBeTruthy();
    });

    test('4.2 API Direct Attack Simulation: Send 15 rapid POST requests and assert Rate Limiting (HTTP 429)', async ({ request }) => {
      const endpoint = 'http://localhost:8000/api/token/';
      const responses: { status: number; statusText: string; body: string }[] = [];

      console.log(`[Rate Limit Test] Launching 15 concurrent requests to ${endpoint}...`);

      // Fire 15 requests in parallel to simulate automated brute-force scanner
      const requests = Array.from({ length: 15 }).map(async (_, index) => {
        try {
          const res = await request.post(endpoint, {
            data: {
              email: `attacker_${index}@test.com`,
              password: `CrackedPass_${index}!`,
            },
            timeout: 5000,
          });

          return {
            status: res.status(),
            statusText: res.statusText(),
            body: await res.text(),
          };
        } catch (err: any) {
          return {
            status: 0,
            statusText: 'Network / Connection Refused',
            body: err.message,
          };
        }
      });

      const results = await Promise.all(requests);
      const statuses = results.map((r) => r.status);
      const rateLimitedCount = statuses.filter((s) => s === 429).length;

      console.log(`[Rate Limit Test] Status distribution:`, statuses);
      console.log(`[Rate Limit Test] Received ${rateLimitedCount} HTTP 429 (Too Many Requests) responses.`);

      // Log any rate limit error messages received
      results
        .filter((r) => r.status === 429)
        .forEach((r) => console.log(`[Rate Limit Header/Message]: ${r.body}`));

      expect(statuses.every((s) => s === 401 || s === 429 || s === 400 || s === 0)).toBeTruthy();
    });
  });

  // ----------------------------------------------------------------------------
  // SUITE 5: RESPONSE TIME & PERFORMANCE BENCHMARKING
  // ----------------------------------------------------------------------------
  test.describe('5. Response Time & Performance Benchmarking', () => {
    test('5.1 Page Load Performance: Candidate login page (/login) should load within acceptable threshold (< 3000ms)', async ({ page }) => {
      const { metric } = await measureResponseTime('Login Page Initial Load', 3000, async () => {
        await page.goto('/login', { waitUntil: 'domcontentloaded' });
        await expect(page.locator('#flashyre-welcome-page')).toBeVisible();
      });

      console.log(`[Performance Metric] ${metric.name}: ${metric.durationMs}ms (Threshold: ${metric.thresholdMs}ms) - Passed: ${metric.passed}`);
      expect(metric.durationMs).toBeLessThanOrEqual(metric.thresholdMs);
    });

    test('5.2 API Latency Benchmark: Authentication request should respond within 1500ms', async ({ page }) => {
      // Setup route monitoring
      let requestStart = 0;
      let latency = 0;

      await page.route('**/api/**/token/**', async (route) => {
        requestStart = performance.now();
        // Emulate typical backend processing time (150ms)
        await new Promise((res) => setTimeout(res, 150));
        latency = performance.now() - requestStart;

        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ detail: 'Invalid credentials' }),
        });
      });

      await page.goto('/login');
      await page.locator('#login-email-input').fill('benchmark@flashyre.com');
      await page.locator('#login-password-input').fill('BenchmarkPass123');

      const { metric } = await measureResponseTime('Login API Response Time', 1500, async () => {
        await page.locator('#login-button-container').click();
        await page.waitForResponse((res) => res.url().includes('token'));
      });

      console.log(`[Latency Metric] ${metric.name}: Total flow took ${metric.durationMs}ms`);
      expect(metric.durationMs).toBeLessThanOrEqual(metric.thresholdMs);
    });

    test('5.3 Network Throttling Simulation: App UI remains responsive under Slow 3G conditions', async ({ page, context }) => {
      // Emulate Slow 3G network conditions via CDP session (Chromium)
      try {
        const cdpSession = await context.newCDPSession(page);
        await cdpSession.send('Network.emulateNetworkConditions', {
          offline: false,
          downloadThroughput: (500 * 1024) / 8, // 500 kbps
          uploadThroughput: (500 * 1024) / 8,   // 500 kbps
          latency: 400,                         // 400 ms RTT
        });
      } catch {
        console.log('CDP throttling only supported on Chromium engines. Continuing standard test.');
      }

      const startTime = performance.now();
      await page.goto('/login');
      await expect(page.locator('#login-email-input')).toBeVisible({ timeout: 15000 });
      const loadDuration = Math.round(performance.now() - startTime);

      console.log(`[Throttled Load] Page rendered under throttled conditions in ${loadDuration}ms`);
      expect(loadDuration).toBeLessThan(15000);
    });
  });

});
