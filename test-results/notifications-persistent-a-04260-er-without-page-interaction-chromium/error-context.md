# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: notifications-persistent-alert.spec.ts >> Persistent Notification Alerts & Idle Heartbeat Workflow >> Scenario 1: Idle user receives persistent toast and top banner without page interaction
- Location: e2e\notifications-persistent-alert.spec.ts:48:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('app-toast-notification .toast-card')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('app-toast-notification .toast-card')

```

```yaml
- banner:
  - img "image"
- heading "Welcome to Flashyre" [level=1]
- text: Email
- textbox "Enter your email"
- text: Password
- textbox "Enter Password"
- text: "Show Security Check: Error loading challenge"
- button "Refresh challenge":
  - img
- textbox "Answer"
- button "Login" [disabled]
- text: OR
- button "Sign in with Google. Opens in new tab":
  - img
  - text: Sign in with Google
- iframe
- text: Don’t have an account? Sign up Forgot Password
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('Persistent Notification Alerts & Idle Heartbeat Workflow', () => {
  4   |   const mockPendingRequestId = 'req-test-uuid-001';
  5   |   const mockNewPendingRequestId = 'req-test-uuid-002';
  6   | 
  7   |   test.beforeEach(async ({ page, context }) => {
  8   |     // Seed authenticated Super Admin state in localStorage
  9   |     await context.addInitScript(() => {
  10  |       localStorage.setItem('isSuperUser', 'true');
  11  |       localStorage.setItem('userType', 'admin');
  12  |       localStorage.setItem('userId', '1');
  13  |       localStorage.setItem('firstName', 'Super');
  14  |       localStorage.setItem('lastName', 'Admin');
  15  |     });
  16  | 
  17  |     // Mock initial pending requests API responses
  18  |     await page.route('**/api/bulk-import/report/approval-requests/pending-count/', async (route) => {
  19  |       await route.fulfill({
  20  |         status: 200,
  21  |         contentType: 'application/json',
  22  |         body: JSON.stringify({ count: 1 }),
  23  |       });
  24  |     });
  25  | 
  26  |     await page.route('**/api/bulk-import/report/approval-requests/?status=PENDING*', async (route) => {
  27  |       await route.fulfill({
  28  |         status: 200,
  29  |         contentType: 'application/json',
  30  |         body: JSON.stringify({
  31  |           count: 1,
  32  |           next: null,
  33  |           previous: null,
  34  |           results: [
  35  |             {
  36  |               id: mockPendingRequestId,
  37  |               requested_by_name: 'Alice Recruiter',
  38  |               candidate_count: 75,
  39  |               status: 'PENDING',
  40  |               created_at: new Date().toISOString(),
  41  |             },
  42  |           ],
  43  |         }),
  44  |       });
  45  |     });
  46  |   });
  47  | 
  48  |   test('Scenario 1: Idle user receives persistent toast and top banner without page interaction', async ({ page }) => {
  49  |     await page.goto('/recruiter-workflow-candidate');
  50  | 
  51  |     // Wait without interacting; verify the persistent toast alert renders
  52  |     const toastAlert = page.locator('app-toast-notification .toast-card');
> 53  |     await expect(toastAlert).toBeVisible({ timeout: 10000 });
      |                              ^ Error: expect(locator).toBeVisible() failed
  54  |     await expect(toastAlert).toContainText('New Report Approval Request');
  55  | 
  56  |     // Verify top global notification bar is visible
  57  |     const superAdminBar = page.locator('app-global-notification-bar .superadmin-bar');
  58  |     await expect(superAdminBar).toBeVisible();
  59  |     await expect(superAdminBar).toContainText('Super Admin Action Required');
  60  | 
  61  |     // Verify Notification Bell badge displays count 1
  62  |     const bellBadge = page.locator('app-notification-bell .badge-count');
  63  |     await expect(bellBadge).toBeVisible();
  64  |     await expect(bellBadge).toHaveText('1');
  65  | 
  66  |     // Wait 7 seconds to verify toast does NOT auto-dismiss (autoDismiss: false)
  67  |     await page.waitForTimeout(7000);
  68  |     await expect(toastAlert).toBeVisible();
  69  |     await expect(superAdminBar).toBeVisible();
  70  |   });
  71  | 
  72  |   test('Scenario 2: Clicking Notification Bell dismisses toast and top bar and saves to localStorage', async ({ page }) => {
  73  |     await page.goto('/recruiter-workflow-candidate');
  74  | 
  75  |     const toastAlert = page.locator('app-toast-notification .toast-card');
  76  |     const superAdminBar = page.locator('app-global-notification-bar .superadmin-bar');
  77  |     await expect(toastAlert).toBeVisible();
  78  |     await expect(superAdminBar).toBeVisible();
  79  | 
  80  |     // Click Notification Bell button to acknowledge
  81  |     const bellButton = page.locator('app-notification-bell .notification-bell-btn');
  82  |     await bellButton.click();
  83  | 
  84  |     // Both the toast and the top alert bar should immediately disappear
  85  |     await expect(toastAlert).not.toBeVisible();
  86  |     await expect(superAdminBar).not.toBeVisible();
  87  | 
  88  |     // Verify localStorage has recorded the acknowledged request ID
  89  |     const storedAcknowledgedId = await page.evaluate(() => {
  90  |       return localStorage.getItem('flashyre_last_acknowledged_pending_request_id');
  91  |     });
  92  |     expect(storedAcknowledgedId).toBe(mockPendingRequestId);
  93  |   });
  94  | 
  95  |   test('Scenario 3: Reloading page keeps alerts suppressed but maintains badge counter', async ({ page }) => {
  96  |     // Pre-seed acknowledged state in localStorage
  97  |     await page.addInitScript((reqId) => {
  98  |       localStorage.setItem('flashyre_last_acknowledged_pending_request_id', reqId);
  99  |     }, mockPendingRequestId);
  100 | 
  101 |     await page.goto('/recruiter-workflow-candidate');
  102 | 
  103 |     // Top banner and toast must NOT appear on page reload
  104 |     const toastAlert = page.locator('app-toast-notification .toast-card');
  105 |     const superAdminBar = page.locator('app-global-notification-bar .superadmin-bar');
  106 |     await expect(toastAlert).not.toBeVisible();
  107 |     await expect(superAdminBar).not.toBeVisible();
  108 | 
  109 |     // Bell badge must still display 1 for situational reference
  110 |     const bellBadge = page.locator('app-notification-bell .badge-count');
  111 |     await expect(bellBadge).toBeVisible();
  112 |     await expect(bellBadge).toHaveText('1');
  113 |   });
  114 | 
  115 |   test('Scenario 4: New request arrival triggers alert again for idle user', async ({ page }) => {
  116 |     // Pre-seed acknowledged state for older request
  117 |     await page.addInitScript((reqId) => {
  118 |       localStorage.setItem('flashyre_last_acknowledged_pending_request_id', reqId);
  119 |     }, mockPendingRequestId);
  120 | 
  121 |     await page.goto('/recruiter-workflow-candidate');
  122 | 
  123 |     // Initially suppressed
  124 |     const superAdminBar = page.locator('app-global-notification-bar .superadmin-bar');
  125 |     await expect(superAdminBar).not.toBeVisible();
  126 | 
  127 |     // Simulate new request arriving via polling endpoint
  128 |     await page.route('**/api/bulk-import/report/approval-requests/?status=PENDING*', async (route) => {
  129 |       await route.fulfill({
  130 |         status: 200,
  131 |         contentType: 'application/json',
  132 |         body: JSON.stringify({
  133 |           count: 2,
  134 |           next: null,
  135 |           previous: null,
  136 |           results: [
  137 |             {
  138 |               id: mockNewPendingRequestId,
  139 |               requested_by_name: 'Bob Recruiter',
  140 |               candidate_count: 120,
  141 |               status: 'PENDING',
  142 |               created_at: new Date().toISOString(),
  143 |             },
  144 |           ],
  145 |         }),
  146 |       });
  147 |     });
  148 | 
  149 |     // Manually trigger polling refresh via window or wait for heartbeat
  150 |     await page.evaluate(() => {
  151 |       // Dispatch visibilitychange or let service heartbeat run
  152 |       document.dispatchEvent(new Event('visibilitychange'));
  153 |     });
```