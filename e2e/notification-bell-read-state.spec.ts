import { test, expect, setupAuthenticatedSession } from './test-helpers';

test.describe('Synchronized Notification Badges (Bell, Sidebar Import, & Approval Requests Tab)', () => {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // 7 items: 6 within last 5 days, 1 older than 5 days (7 days old)
  const mockItems = [
    { id: 'req-01', requested_by_name: 'John Recruiter', requester_name: 'John Recruiter', candidate_count: 10, status: 'PENDING', created_at: now.toISOString() },
    { id: 'req-02', requested_by_name: 'Jane Recruiter', requester_name: 'Jane Recruiter', candidate_count: 20, status: 'PENDING', created_at: oneDayAgo },
    { id: 'req-03', requested_by_name: 'Bob Recruiter', requester_name: 'Bob Recruiter', candidate_count: 30, status: 'PENDING', created_at: oneDayAgo },
    { id: 'req-04', requested_by_name: 'Alice Recruiter', requester_name: 'Alice Recruiter', candidate_count: 40, status: 'PENDING', created_at: twoDaysAgo },
    { id: 'req-05', requested_by_name: 'Charlie Recruiter', requester_name: 'Charlie Recruiter', candidate_count: 50, status: 'PENDING', created_at: twoDaysAgo },
    { id: 'req-06', requested_by_name: 'David Recruiter', requester_name: 'David Recruiter', candidate_count: 60, status: 'PENDING', created_at: twoDaysAgo },
    { id: 'req-07-old', requested_by_name: 'Old Recruiter', requester_name: 'Old Recruiter', candidate_count: 70, status: 'PENDING', created_at: sevenDaysAgo },
  ];

  test.beforeEach(async ({ page }) => {
    // Seed authenticated Super Admin session
    await setupAuthenticatedSession(page, 'admin');

    // Block Firestore network connections so deterministic REST mocks drive the state
    await page.route(/.*firestore\.googleapis\.com.*/, route => route.abort());

    // Clear notification seen state in localStorage to simulate fresh unread notifications
    await page.addInitScript(() => {
      localStorage.removeItem('flashyre_notif_last_seen_admin');
      localStorage.removeItem('flashyre_last_acknowledged_pending_request_id');
    });

    // Mock candidates endpoint
    await page.route('**/api/candidates/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ count: 0, next: null, previous: null, results: [] })
      });
    });

    // Mock bulk import batches and candidates endpoints to avoid 401s
    await page.route('**/api/bulk-import/batches/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ count: 0, next: null, previous: null, results: [] })
      });
    });

    await page.route('**/api/bulk-import/resume/batches/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ count: 0, next: null, previous: null, results: [] })
      });
    });

    await page.route('**/api/bulk-import/resume/unmatched/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ count: 0, next: null, previous: null, results: [] })
      });
    });

    await page.route('**/api/token/refresh/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ access: 'mock-fresh-access-token' })
      });
    });

    // Mock bulk import approval requests endpoints cleanly
    await page.route('**/api/bulk-import/report/approval-requests/**', async (route) => {
      const url = route.request().url();
      if (url.includes('pending-count')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ count: 6 })
        });
      } else if (url.includes('my-requests')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            count: mockItems.length,
            next: null,
            previous: null,
            results: mockItems
          })
        });
      }
    });
  });

  test('All 3 numbers (bell, sidebar Import, and Approval Request tab) display unread count 6 simultaneously', async ({ page }) => {
    await page.goto('/recruiter-workflow-bulk-import');

    // 1. Notification Bell badge shows 6
    const bellBadge = page.locator('app-notification-bell .bell-badge-count');
    await expect(bellBadge).toBeVisible({ timeout: 10000 });
    await expect(bellBadge).toHaveText('6');

    // 2. Sidebar "Import" badge shows 6
    const sidebarImportBadge = page.locator('app-recruiter-sidebar a[routerLink="/recruiter-workflow-bulk-import"] .sidebar-badge');
    await expect(sidebarImportBadge).toBeVisible();
    await expect(sidebarImportBadge).toHaveText('6');

    // 3. Approval Requests tab badge shows 6
    const approvalsTabBadge = page.locator('button.tab-approvals .tab-count');
    await expect(approvalsTabBadge).toBeVisible();
    await expect(approvalsTabBadge).toHaveText('6');
  });

  test('When notification clears on closing bell popover, all 3 badges (bell, sidebar Import, tab) disappear simultaneously', async ({ page }) => {
    await page.goto('/recruiter-workflow-bulk-import');

    const bellBadge = page.locator('app-notification-bell .bell-badge-count');
    const sidebarImportBadge = page.locator('app-recruiter-sidebar a[routerLink="/recruiter-workflow-bulk-import"] .sidebar-badge');
    const approvalsTabBadge = page.locator('button.tab-approvals .tab-count');

    // Confirm all 3 badges are visible initially
    await expect(bellBadge).toBeVisible({ timeout: 10000 });
    await expect(bellBadge).toHaveText('6');
    await expect(sidebarImportBadge).toHaveText('6');
    await expect(approvalsTabBadge).toHaveText('6');

    // Open bell dropdown
    const bellButton = page.locator('app-notification-bell button.bell-btn');
    await bellButton.click({ force: true });

    const popover = page.locator('app-notification-bell .bell-popover');
    await expect(popover).toBeVisible();

    // Verify top 5 items and See More row
    const notifItems = page.locator('app-notification-bell .notif-item');
    await expect(notifItems).toHaveCount(5);
    const seeMoreRow = page.locator('app-notification-bell .see-more-row');
    await expect(seeMoreRow).toBeVisible();
    await expect(seeMoreRow).toContainText('+1 more recent requests');

    // Close the popover via the close button ("✕") -> "comes out"
    const closeBtn = page.locator('app-notification-bell .close-popover-btn');
    await closeBtn.click();
    await expect(popover).not.toBeVisible();

    // ALL THREE BADGES MUST DISAPPEAR AT THE EXACT SAME TIME!
    await expect(bellBadge).not.toBeVisible();
    await expect(sidebarImportBadge).not.toBeVisible();
    await expect(approvalsTabBadge).not.toBeVisible();

    // Verify localStorage has stored the seen timestamp
    const lastSeen = await page.evaluate(() => localStorage.getItem('flashyre_notif_last_seen_admin'));
    expect(lastSeen).not.toBeNull();

    // Reopening the bell dropdown should keep all 3 badges hidden (cleared)
    await bellButton.click({ force: true });
    await expect(popover).toBeVisible();
    await expect(bellBadge).not.toBeVisible();
    await expect(sidebarImportBadge).not.toBeVisible();
    await expect(approvalsTabBadge).not.toBeVisible();
  });

  test('Clicking directly on Approval Requests tab clears all 3 badges (bell, sidebar Import, tab) simultaneously', async ({ page }) => {
    await page.goto('/recruiter-workflow-bulk-import');

    const bellBadge = page.locator('app-notification-bell .bell-badge-count');
    const sidebarImportBadge = page.locator('app-recruiter-sidebar a[routerLink="/recruiter-workflow-bulk-import"] .sidebar-badge');
    const approvalsTabBadge = page.locator('button.tab-approvals .tab-count');

    // Confirm all 3 badges are visible initially
    await expect(bellBadge).toBeVisible({ timeout: 10000 });
    await expect(sidebarImportBadge).toHaveText('6');
    await expect(approvalsTabBadge).toHaveText('6');

    // Click directly on the Approval Requests tab
    const approvalsTabBtn = page.locator('button.tab-approvals');
    await approvalsTabBtn.click();

    // Approvals tab is active
    await expect(approvalsTabBtn).toHaveClass(/active/);

    // ALL THREE BADGES MUST IMMEDIATELY CLEAR!
    await expect(bellBadge).not.toBeVisible();
    await expect(sidebarImportBadge).not.toBeVisible();
    await expect(approvalsTabBadge).not.toBeVisible();
  });

  test('Clicking See More in popover navigates to approvals tab and closes popover with badges cleared', async ({ page }) => {
    await page.goto('/recruiter-workflow-bulk-import');

    const bellButton = page.locator('app-notification-bell button.bell-btn');
    await bellButton.click({ force: true });

    const popover = page.locator('app-notification-bell .bell-popover');
    await expect(popover).toBeVisible();

    const seeMoreBtn = page.locator('app-notification-bell .see-more-btn');
    await seeMoreBtn.click();

    // Popover closes
    await expect(popover).not.toBeVisible();

    // Tab is switched to approvals
    const approvalsTabBtn = page.locator('button.tab-approvals');
    await expect(approvalsTabBtn).toHaveClass(/active/);

    // Badges are cleared
    const bellBadge = page.locator('app-notification-bell .bell-badge-count');
    const sidebarImportBadge = page.locator('app-recruiter-sidebar a[routerLink="/recruiter-workflow-bulk-import"] .sidebar-badge');
    const approvalsTabBadge = page.locator('button.tab-approvals .tab-count');
    await expect(bellBadge).not.toBeVisible();
    await expect(sidebarImportBadge).not.toBeVisible();
    await expect(approvalsTabBadge).not.toBeVisible();
  });
});
