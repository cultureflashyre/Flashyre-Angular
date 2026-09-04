import { test, expect } from '@playwright/test';
import { MOCK_ADMIN_JWT, MOCK_RECRUITER_JWT } from './recruiter-workflow-bulk-import/test-fixtures';

test.describe('Persistent Notification Alerts & Idle Heartbeat Workflow', () => {
  const mockPendingRequestId = 'req-test-uuid-001';
  const mockNewPendingRequestId = 'req-test-uuid-002';

  test.beforeEach(async ({ page, context }) => {
    // Seed authenticated Super Admin state in localStorage with valid JWT for authGuard
    await context.addInitScript((jwt) => {
      localStorage.setItem('auth_token', jwt);
      localStorage.setItem('jwtToken', jwt);
      localStorage.setItem('token', jwt);
      localStorage.setItem('refreshToken', 'mock-valid-refresh-token');
      localStorage.setItem('isSuperUser', 'true');
      localStorage.setItem('userType', 'admin');
      localStorage.setItem('user_type', 'admin');
      localStorage.setItem('user_role', 'admin');
      localStorage.setItem('userId', '1');
      localStorage.setItem('user_id', '1');
      localStorage.setItem('firstName', 'Super');
      localStorage.setItem('lastName', 'Admin');
    }, MOCK_ADMIN_JWT);

    // Mock candidates API endpoint so page loads cleanly without 401/500
    await page.route('**/api/candidates/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          count: 0,
          next: null,
          previous: null,
          results: []
        }),
      });
    });

    // Mock initial pending requests API responses
    await page.route('**/api/bulk-import/report/approval-requests/pending-count/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ count: 1 }),
      });
    });

    await page.route('**/api/bulk-import/report/approval-requests/?status=PENDING*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          count: 1,
          next: null,
          previous: null,
          results: [
            {
              id: mockPendingRequestId,
              requested_by_name: 'Alice Recruiter',
              candidate_count: 75,
              status: 'PENDING',
              created_at: new Date().toISOString(),
            },
          ],
        }),
      });
    });
  });

  test('Scenario 1: Idle user receives persistent toast and top banner without page interaction', async ({ page }) => {
    await page.goto('/recruiter-workflow-candidate');

    // Wait without interacting; verify the persistent toast alert renders
    const toastAlert = page.locator('app-toast-notification .toast-card');
    await expect(toastAlert).toBeVisible({ timeout: 10000 });
    await expect(toastAlert).toContainText('New Report Approval Request');

    // Verify top global notification bar is visible
    const superAdminBar = page.locator('app-global-notification-bar .superadmin-bar');
    await expect(superAdminBar).toBeVisible();
    await expect(superAdminBar).toContainText('Super Admin Action Required');

    // Verify Notification Bell badge displays count 1
    const bellBadge = page.locator('app-notification-bell .bell-badge-count');
    await expect(bellBadge).toBeVisible();
    await expect(bellBadge).toHaveText('1');

    // Wait 7 seconds to verify toast does NOT auto-dismiss (autoDismiss: false)
    await page.waitForTimeout(7000);
    await expect(toastAlert).toBeVisible();
    await expect(superAdminBar).toBeVisible();
  });

  test('Scenario 2: Clicking Notification Bell dismisses toast and top bar and saves to localStorage', async ({ page }) => {
    await page.goto('/recruiter-workflow-candidate');

    const toastAlert = page.locator('app-toast-notification .toast-card');
    const superAdminBar = page.locator('app-global-notification-bar .superadmin-bar');
    await expect(toastAlert).toBeVisible({ timeout: 10000 });
    await expect(superAdminBar).toBeVisible();

    // Click Notification Bell button to acknowledge
    const bellButton = page.locator('app-notification-bell button.bell-btn');
    await bellButton.click();

    // Both the toast and the top alert bar should immediately disappear
    await expect(toastAlert).not.toBeVisible();
    await expect(superAdminBar).not.toBeVisible();

    // Verify localStorage has recorded the acknowledged request ID
    const storedAcknowledgedId = await page.evaluate(() => {
      return localStorage.getItem('flashyre_last_acknowledged_pending_request_id');
    });
    expect(storedAcknowledgedId).toBe(mockPendingRequestId);
  });

  test('Scenario 3: Reloading page keeps alerts suppressed but maintains badge counter', async ({ page }) => {
    // Pre-seed acknowledged state in localStorage
    await page.addInitScript((reqId) => {
      localStorage.setItem('flashyre_last_acknowledged_pending_request_id', reqId);
    }, mockPendingRequestId);

    await page.goto('/recruiter-workflow-candidate');

    // Top banner and toast must NOT appear on page reload
    const toastAlert = page.locator('app-toast-notification .toast-card');
    const superAdminBar = page.locator('app-global-notification-bar .superadmin-bar');
    await expect(toastAlert).not.toBeVisible();
    await expect(superAdminBar).not.toBeVisible();

    // Bell badge must still display 1 for situational reference
    const bellBadge = page.locator('app-notification-bell .bell-badge-count');
    await expect(bellBadge).toBeVisible();
    await expect(bellBadge).toHaveText('1');
  });

  test('Scenario 4: New request arrival triggers alert again for idle user', async ({ page }) => {
    // Pre-seed acknowledged state for older request
    await page.addInitScript((reqId) => {
      localStorage.setItem('flashyre_last_acknowledged_pending_request_id', reqId);
    }, mockPendingRequestId);

    await page.goto('/recruiter-workflow-candidate');

    // Initially suppressed
    const superAdminBar = page.locator('app-global-notification-bar .superadmin-bar');
    await expect(superAdminBar).not.toBeVisible();

    // Simulate new request arriving via polling endpoint
    await page.route('**/api/bulk-import/report/approval-requests/?status=PENDING*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          count: 2,
          next: null,
          previous: null,
          results: [
            {
              id: mockNewPendingRequestId,
              requested_by_name: 'Bob Recruiter',
              candidate_count: 120,
              status: 'PENDING',
              created_at: new Date().toISOString(),
            },
          ],
        }),
      });
    });

    // Manually trigger polling refresh via window or wait for heartbeat
    await page.evaluate(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    // Verify new alert appears automatically
    await expect(superAdminBar).toBeVisible({ timeout: 15000 });
    const toastAlert = page.locator('app-toast-notification .toast-card');
    await expect(toastAlert).toBeVisible();
    await expect(toastAlert).toContainText('New Report Approval Request');
  });

  test('Scenario 5: Idle tab title flashes action notice and restores on notification bell click', async ({ page }) => {
    await page.goto('/recruiter-workflow-candidate');

    // Verify tab title begins flashing to alert idle/background user
    await expect.poll(async () => await page.title(), {
      message: 'Expected document title to flash action notice for idle user',
      timeout: 10000,
      intervals: [1000, 1500],
    }).toContain('Action Required!');

    // Click Notification Bell button to acknowledge
    const bellButton = page.locator('app-notification-bell button.bell-btn');
    await bellButton.click();

    // Verify title stops flashing and restores normal title
    await expect.poll(async () => await page.title(), {
      message: 'Expected document title to restore original title after bell click',
      timeout: 5000,
    }).not.toContain('Action Required!');
  });

  test('Scenario 6: Recruiter idle state receives approved report persistent alert and bell dismissal', async ({ page, context }) => {
    // Switch to Recruiter user with valid Recruiter JWT
    await context.addInitScript((recruiterJwt) => {
      localStorage.setItem('auth_token', recruiterJwt);
      localStorage.setItem('jwtToken', recruiterJwt);
      localStorage.setItem('token', recruiterJwt);
      localStorage.setItem('refreshToken', 'mock-valid-refresh-token');
      localStorage.setItem('isSuperUser', 'false');
      localStorage.setItem('userType', 'recruiter');
      localStorage.setItem('user_type', 'recruiter');
      localStorage.setItem('user_role', 'recruiter');
      localStorage.setItem('userId', '102');
      localStorage.setItem('user_id', '102');
    }, MOCK_RECRUITER_JWT);

    const mockApprovedReqId = 'req-approved-uuid-999';

    // Mock recruiter's my-requests endpoint
    await page.route('**/api/bulk-import/report/approval-requests/my-requests/*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: mockApprovedReqId,
            status: 'APPROVED',
            reviewed_by_name: 'Super Admin Jane',
            created_at: new Date().toISOString(),
            report_params: { format: 'xlsx' }
          }
        ]),
      });
    });

    await page.goto('/recruiter-workflow-candidate');

    // Recruiter receives persistent toast
    const toastAlert = page.locator('app-toast-notification .toast-card');
    await expect(toastAlert).toBeVisible({ timeout: 10000 });
    await expect(toastAlert).toContainText('Report Request Approved');

    // Recruiter top bar is visible
    const recruiterBar = page.locator('app-global-notification-bar .recruiter-bar');
    await expect(recruiterBar).toBeVisible();
    await expect(recruiterBar).toContainText('Report Ready');

    // Bell badge shows 1 approved report ready
    const bellBadge = page.locator('app-notification-bell .bell-badge-count');
    await expect(bellBadge).toBeVisible();
    await expect(bellBadge).toHaveText('1');

    // Clicking bell dismisses alert and persists state
    const bellButton = page.locator('app-notification-bell button.bell-btn');
    await bellButton.click();

    await expect(toastAlert).not.toBeVisible();
    await expect(recruiterBar).not.toBeVisible();

    const storedApprovedId = await page.evaluate(() => {
      return localStorage.getItem('flashyre_last_acknowledged_approved_request_id');
    });
    expect(storedApprovedId).toBe(mockApprovedReqId);
  });
});
