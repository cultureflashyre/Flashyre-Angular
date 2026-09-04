import { test, expect } from '@playwright/test';
import { setupErrorAndConsoleListener } from './test-helpers';

test.describe('Authentication & Form Validation (/login)', () => {

  test.describe('Happy Path Flows', () => {
    test('Successful login with valid candidate credentials', async ({ page }) => {
      await page.route('**/api/**/token/**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            access: 'fake-jwt-access-token',
            refresh: 'fake-jwt-refresh-token',
            user_type: 'candidate',
          }),
        });
      });

      await page.goto('/login');
      await page.locator('#login-email-input').fill('admin@chcs.com');
      await page.locator('#login-password-input').fill('pass@123');

      const submitButton = page.locator('#login-button-container');
      await expect(submitButton).toBeEnabled();
      await submitButton.click();

      // No error banner should be present
      await expect(page.locator('#error-message-login')).not.toBeVisible();
    });

    test('Password visibility toggle operates as expected', async ({ page }) => {
      await page.goto('/login');
      const passwordField = page.locator('#login-password-input');
      const toggle = page.locator('#login-password-show-button');

      await expect(passwordField).toHaveAttribute('type', 'password');
      await toggle.click();
      await expect(passwordField).toHaveAttribute('type', 'text');
      await toggle.click();
      await expect(passwordField).toHaveAttribute('type', 'password');
    });
  });

  test.describe('Negative Path & Error Message Verifications', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/login');
    });

    test('Shows required field error when blurring empty email field', async ({ page }) => {
      const emailField = page.locator('#login-email-input');
      await emailField.focus();
      await emailField.blur();

      const errorMsg = page.locator('.error-text').filter({ hasText: 'Email is required.' });
      await expect(errorMsg).toBeVisible();
    });

    test('Shows invalid format error when entering malformed email', async ({ page }) => {
      const emailField = page.locator('#login-email-input');
      await emailField.fill('bad-email-address');
      await emailField.blur();

      const errorMsg = page.locator('.error-text').filter({ hasText: 'Please enter a valid email address.' });
      await expect(errorMsg).toBeVisible();
    });

    test('Shows password length boundary error', async ({ page }) => {
      const passField = page.locator('#login-password-input');
      await passField.fill('123');
      await passField.blur();

      const errorMsg = page.locator('.error-text').filter({ hasText: 'Password should be 8-15 characters.' });
      await expect(errorMsg).toBeVisible();
    });

    test('Displays backend rejection error banner for invalid credentials', async ({ page }) => {
      await page.route('**/api/**/token/**', async (route) => {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ detail: 'Invalid email or password' }),
        });
      });

      await page.locator('#login-email-input').fill('unknown@flashyre.com');
      await page.locator('#login-password-input').fill('WrongPassword123');
      await page.locator('#login-button-container').click();

      const errorBanner = page.locator('#error-message-login, .log-in-page-error-message-login');
      await expect(errorBanner).toBeVisible();
    });
  });
});
