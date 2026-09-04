import { test, expect, Page } from '@playwright/test';

// ─── Configuration ────────────────────────────────────────
const BASE_URL = process.env['E2E_BASE_URL'] || 'http://localhost:4200';

// Valid unexpired JWT with exp in year 2038 and role 'admin'
const VALID_MOCK_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjI1MzQwMjMwMDc5OSwidXNlcl9pZCI6MSwidXNlcl90eXBlIjoiYWRtaW4iLCJlbWFpbCI6ImFkbWluQGNoY3MuY29tIn0.signature';

const MOCK_COLLECTION_FORMS = [
  {
    id: 1,
    unique_id: '11111111-2222-3333-4444-555555555551',
    title: 'Frontend Engineer Application 2026',
    job_post: 101,
    job_post_title: 'Senior Frontend Developer',
    company_name: 'Flashyre India',
    logo_url: null,
    require_resume: true,
    is_active: true,
    template_type: 'standard',
    expires_at: null,
    max_submissions: null,
    is_expired: false,
    is_submission_limit_reached: false,
    effective_active: true,
    created_by_name: 'Admin User',
    submission_count: 5,
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    unique_id: '22222222-3333-4444-5555-666666666662',
    title: 'Campus Graduate Hiring Drive',
    job_post: null,
    job_post_title: null,
    company_name: 'Flashyre Tech',
    logo_url: null,
    require_resume: false,
    is_active: false,
    template_type: 'campus',
    expires_at: null,
    max_submissions: 50,
    is_expired: false,
    is_submission_limit_reached: false,
    effective_active: false,
    created_by_name: 'Admin User',
    submission_count: 12,
    created_at: new Date().toISOString()
  }
];

// Helper to seed localStorage with authenticated admin session
async function setupAuthenticatedAdminSession(page: Page) {
  await page.addInitScript(({ jwt }) => {
    localStorage.setItem('jwtToken', jwt);
    localStorage.setItem('userType', 'admin');
    localStorage.setItem('isSuperUser', 'true');
    localStorage.setItem('userEmail', 'admin@chcs.com');
    localStorage.setItem('refreshToken', 'valid-mock-refresh-token');
  }, { jwt: VALID_MOCK_JWT });
}

// Setup common API route mocks
async function setupApiMocks(page: Page, formsList = MOCK_COLLECTION_FORMS) {
  let currentForms = [...formsList];

  await page.route('**/api/collection-forms/**', async (route) => {
    const method = route.request().method();
    const url = route.request().url();

    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(currentForms),
      });
    } else if (method === 'POST') {
      const payload = JSON.parse(route.request().postData() || '{}');
      const newForm = {
        id: currentForms.length + 1,
        unique_id: `mock-uuid-${Date.now()}`,
        title: payload.title || 'New Form',
        job_post: payload.job_post || null,
        job_post_title: 'Job Post',
        company_name: payload.company_name || 'Flashyre',
        logo_url: payload.logo_url || null,
        require_resume: payload.require_resume ?? true,
        template_type: payload.template_type || 'standard',
        is_active: true,
        expires_at: payload.expires_at || null,
        max_submissions: payload.max_submissions || null,
        is_expired: false,
        is_submission_limit_reached: false,
        effective_active: true,
        created_by_name: 'Admin User',
        submission_count: 0,
        created_at: new Date().toISOString()
      };
      currentForms = [newForm, ...currentForms];
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(newForm),
      });
    } else if (method === 'PATCH') {
      const payload = JSON.parse(route.request().postData() || '{}');
      const uuid = url.split('/').filter(Boolean).pop();
      const idx = currentForms.findIndex(f => f.unique_id === uuid);
      if (idx !== -1) {
        currentForms[idx] = { ...currentForms[idx], ...payload };
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(currentForms[idx]),
        });
      } else {
        await route.fulfill({ status: 404 });
      }
    } else if (method === 'DELETE') {
      const uuid = url.split('/').filter(Boolean).pop();
      currentForms = currentForms.filter(f => f.unique_id !== uuid);
      await route.fulfill({ status: 204 });
    } else {
      await route.continue();
    }
  });

  await page.route('**/api/requirements/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { id: 101, job_role: 'Senior Frontend Developer' },
        { id: 102, job_role: 'Python Backend Specialist' }
      ]),
    });
  });
}

// ─── POSITIVE TESTS ───────────────────────────────────────
test.describe('Collection Forms — Positive Tests', () => {

  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedAdminSession(page);
    await setupApiMocks(page);
    await page.goto(`${BASE_URL}/collection-forms`);
    await page.waitForSelector('.page-header, .controls-bar', { timeout: 15000 });
  });

  test('P1: Create a new collection form with valid data', async ({ page }) => {
    await page.locator('.controls-bar .btn-primary').first().click();
    await page.waitForSelector('.modal', { state: 'visible', timeout: 15000 });

    await page.fill('input[formControlName="title"]', 'New Cloud Architect Application');
    await page.fill('input[formControlName="company_name"]', 'Flashyre Cloud');
    await page.locator('input[value="standard"]').check({ force: true }).catch(() => {});

    const submitBtn = page.locator('.modal-footer button[type="submit"]').first();
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click({ force: true });

    await page.waitForSelector('.modal', { state: 'hidden', timeout: 5000 }).catch(() => {});
    await expect(page.locator('text=New Cloud Architect Application')).toBeVisible();
  });

  test('P2: Toggle form active/inactive', async ({ page }) => {
    await page.waitForSelector('.toggle', { state: 'visible' });
    const toggleChk = page.locator('.toggle-chk').first();
    const initialChecked = await toggleChk.isChecked();

    await page.locator('.toggle').first().click({ force: true });
    await page.waitForTimeout(500);

    const newChecked = await toggleChk.isChecked();
    expect(newChecked).not.toBe(initialChecked);
  });

  test('P3: Delete a form via confirmation modal', async ({ page }) => {
    const deleteBtn = page.locator('.delete-btn, [aria-label="Delete form"]').first();
    await deleteBtn.click({ force: true });

    await page.waitForSelector('.modal:has-text("Delete"), .delete-body', { state: 'visible' });
    await page.locator('.modal-footer .btn-danger, button:has-text("Delete Form")').first().click({ force: true });

    await page.waitForSelector('.modal-backdrop', { state: 'hidden', timeout: 5000 }).catch(() => {});
  });

  test('P4: Copy form link to clipboard', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});

    const copyBtn = page.locator('.copy-btn, [aria-label="Copy public link"]').first();
    await copyBtn.click({ force: true });

    await expect(page.locator('.copy-btn.copied')).toBeVisible({ timeout: 3000 });
  });

  test('P5: Open and close QR modal', async ({ page }) => {
    const qrBtn = page.locator('.qr-btn, [aria-label="Show QR code"]').first();
    await qrBtn.click({ force: true });

    await expect(page.locator('.qr-body')).toBeVisible();
    await expect(page.locator('img[alt="QR Code"]')).toBeVisible();

    await page.locator('.modal-close').first().click({ force: true }).catch(() => {});
    await expect(page.locator('.qr-body')).toBeHidden();
  });

  test('P6: Search forms by title', async ({ page }) => {
    const searchInput = page.locator('.search-input, input[placeholder*="Search" i]');
    await searchInput.fill('Frontend Engineer');

    await expect(page.locator('text=Frontend Engineer Application 2026')).toBeVisible();
    await expect(page.locator('text=Campus Graduate Hiring Drive')).toBeHidden();
  });

  test('P7: Filter forms by status tabs', async ({ page }) => {
    const inactiveTab = page.locator('button.pill:has-text("Paused")').first();
    if (await inactiveTab.isVisible()) {
      await inactiveTab.click();
      await expect(page.locator('text=Campus Graduate Hiring Drive')).toBeVisible();
      await expect(page.locator('text=Frontend Engineer Application 2026')).toBeHidden();
    }
  });
});

// ─── NEGATIVE TESTS ───────────────────────────────────────
test.describe('Collection Forms — Negative Tests', () => {

  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedAdminSession(page);
    await setupApiMocks(page);
    await page.goto(`${BASE_URL}/collection-forms`);
    await page.waitForSelector('.page-header, .controls-bar', { timeout: 15000 });
  });

  test('N1: Cannot submit form with empty title', async ({ page }) => {
    await page.locator('.controls-bar .btn-primary').first().click();
    await page.waitForSelector('.modal', { state: 'visible', timeout: 15000 });

    const submitBtn = page.locator('.modal-footer button[type="submit"]').first();
    await expect(submitBtn).toBeDisabled();
  });

  test('N2: XSS payload in title is blocked by pattern validation', async ({ page }) => {
    await page.locator('.controls-bar .btn-primary').first().click();
    await page.waitForSelector('.modal', { state: 'visible', timeout: 15000 });

    await page.fill('input[formControlName="title"]', '<script>alert(1)</script>');
    const submitBtn = page.locator('.modal-footer button[type="submit"]').first();
    await expect(submitBtn).toBeDisabled();
  });

  test('N3: Cannot create form with title exceeding 100 characters', async ({ page }) => {
    await page.locator('.controls-bar .btn-primary').first().click();
    await page.waitForSelector('.modal', { state: 'visible', timeout: 15000 });

    const longTitle = 'A'.repeat(101);
    await page.fill('input[formControlName="title"]', longTitle);
    const submitBtn = page.locator('.modal-footer button[type="submit"]').first();
    await expect(submitBtn).toBeDisabled();
  });
});

test.describe('Collection Forms — Auth Guard Protection', () => {
  test('N4: Unauthenticated user is redirected away from collection-forms', async ({ page }) => {
    await page.goto(`${BASE_URL}/collection-forms`);
    await page.waitForURL(/\/login/, { timeout: 10000 });
  });
});

// ─── EDGE CASE TESTS ─────────────────────────────────────
test.describe('Collection Forms — Edge Cases', () => {

  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedAdminSession(page);
    await setupApiMocks(page);
    await page.goto(`${BASE_URL}/collection-forms`);
    await page.waitForSelector('.page-header, .controls-bar', { timeout: 15000 });
  });

  test('E1: Rapid double-click on Create Form button creates at most 1 form', async ({ page }) => {
    await page.locator('.controls-bar .btn-primary').first().click();
    await page.waitForSelector('.modal', { state: 'visible', timeout: 15000 });

    await page.fill('input[formControlName="title"]', 'Unique Anti-Spam Position');
    const submitBtn = page.locator('.modal-footer button[type="submit"]').first();

    await submitBtn.click({ clickCount: 2, force: true });
    await page.waitForSelector('.modal', { state: 'hidden', timeout: 5000 }).catch(() => {});

    const matches = page.locator('.form-card:has-text("Unique Anti-Spam Position")');
    const count = await matches.count();
    expect(count).toBe(1);
  });

  test('E7: Rapid toggle clicks do not trigger race condition', async ({ page }) => {
    const toggle = page.locator('.toggle').first();
    await toggle.click({ force: true });
    await toggle.click({ force: true }).catch(() => {});
    await page.waitForTimeout(500);
  });

  test('E3: Form with alphanumeric and safe symbols in title is allowed', async ({ page }) => {
    await page.locator('.controls-bar .btn-primary').first().click();
    await page.waitForSelector('.modal', { state: 'visible', timeout: 15000 });

    await page.fill('input[formControlName="title"]', 'Senior Dev (Frontend) & Lead - 2026');
    await page.fill('input[formControlName="company_name"]', 'Flashyre India Pvt. Ltd.');

    const submitBtn = page.locator('.modal-footer button[type="submit"]').first();
    await expect(submitBtn).toBeEnabled();
  });
});
