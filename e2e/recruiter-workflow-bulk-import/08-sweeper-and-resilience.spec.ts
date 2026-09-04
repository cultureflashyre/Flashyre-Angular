// playwright/recruiter-workflow-bulk-import/08-sweeper-and-resilience.spec.ts
import { test, expect } from '@playwright/test';
import {
  setupMockAuthAndApis,
  MOCK_TRACKER_BATCHES,
  MOCK_RESUME_BATCHES,
  MOCK_RECRUITER_JWT
} from './test-fixtures';

test.describe('Scenario 8: Sweeper Reconciliation, RBAC Permissions & Safe Deletion', () => {

  test.describe('Admin / Super Admin Permissions', () => {
    test.beforeEach(async ({ page }) => {
      await setupMockAuthAndApis(page, {
        user: { user_type: 'admin', user_id: '1', is_superuser: true }
      });
      await page.goto('/recruiter-workflow-bulk-import');
      await page.waitForLoadState('networkidle');
    });

    test('should trigger Sync Sweeper from topbar and reload batch states', async ({ page }) => {
      let reconcileTriggered = false;

      await page.route('**/api/bulk-import/reconcile/**', async (route) => {
        reconcileTriggered = true;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Reconciliation completed.',
            stats: { checked: 2, reconciled: 1 }
          })
        });
      });

      const sweeperBtn = page.locator('button.btn.good:has-text("Sync Sweeper")');
      await expect(sweeperBtn).toBeVisible();
      await sweeperBtn.click();

      // Verify sweeper was called
      await page.waitForTimeout(500);
      expect(reconcileTriggered).toBe(true);
    });

    test('admin can delete any tracker batch with clean filename in confirmation prompt', async ({ page }) => {
      let deletePromptMessage = '';
      let deleteApiCalled = false;

      // Listen to window confirm dialog
      page.on('dialog', async (dialog) => {
        deletePromptMessage = dialog.message();
        await dialog.accept();
      });

      // Mock Delete API
      const targetBatchId = MOCK_TRACKER_BATCHES[0].id;
      await page.route(`**/api/bulk-import/batch/${targetBatchId}/**`, async (route) => {
        if (route.request().method() === 'DELETE') {
          deleteApiCalled = true;
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, message: 'Batch deleted.' })
          });
        }
      });

      // Admin sees Delete buttons on all tracker rows
      const rows = page.locator('.data-table tbody tr.clickable-row');
      await expect(rows.nth(0).locator('button:has-text("Delete")')).toBeVisible();
      await expect(rows.nth(1).locator('button:has-text("Delete")')).toBeVisible();

      // Click delete on first row
      await rows.first().locator('button:has-text("Delete")').click();

      // Verify confirmation dialog text used clean filename (no UUID prefix)
      expect(deletePromptMessage).toContain('Q3_Tech_Recruitment_Tracker.xlsx');
      expect(deletePromptMessage).not.toContain('c9bf7e45-');
      expect(deleteApiCalled).toBe(true);
    });

    test('admin can delete any resume batch with clean filename in confirmation prompt', async ({ page }) => {
      let deletePromptMessage = '';
      let deleteApiCalled = false;

      page.on('dialog', async (dialog) => {
        deletePromptMessage = dialog.message();
        await dialog.accept();
      });

      // Switch to Resumes Subtab
      await page.click('.sub-tab-btn:has-text("Resume Zip Archives")');

      const targetResumeBatchId = MOCK_RESUME_BATCHES[0].id;
      await page.route(`**/api/bulk-import/resume/batch/${targetResumeBatchId}/**`, async (route) => {
        if (route.request().method() === 'DELETE') {
          deleteApiCalled = true;
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, message: 'Resume batch deleted.' })
          });
        }
      });

      // Admin sees Delete buttons on all resume rows
      const resumeRows = page.locator('.data-table tbody tr.clickable-row');
      await expect(resumeRows.nth(0).locator('button:has-text("Delete")')).toBeVisible();
      await expect(resumeRows.nth(1).locator('button:has-text("Delete")')).toBeVisible();

      await resumeRows.first().locator('button:has-text("Delete")').click();

      // Verify confirmation prompt has clean name
      expect(deletePromptMessage).toContain('Engineering_Resumes_Aug2026.zip');
      expect(deletePromptMessage).not.toContain('12345678-');
      expect(deleteApiCalled).toBe(true);
    });
  });

  test.describe('Recruiter RBAC Permissions (Owner-Only Deletion)', () => {
    test.beforeEach(async ({ page }) => {
      // Login as Alex Recruiter (ID: 102, role: recruiter)
      await setupMockAuthAndApis(page, {
        user: {
          jwt: MOCK_RECRUITER_JWT,
          user_type: 'recruiter',
          user_id: '102',
          is_superuser: false
        }
      });
      await page.goto('/recruiter-workflow-bulk-import');
      await page.waitForLoadState('networkidle');
    });

    test('recruiter can delete own tracker upload but CANNOT delete other users uploads', async ({ page }) => {
      const rows = page.locator('.data-table tbody tr.clickable-row');

      // Row 0: Uploaded by Super Admin (ID: 1) -> Delete button must NOT exist
      await expect(rows.nth(0).locator('button:has-text("Inspect")')).toBeVisible();
      await expect(rows.nth(0).locator('button:has-text("Delete")')).not.toBeVisible();

      // Row 1: Uploaded by Alex Recruiter (ID: 102) -> Delete button MUST exist
      await expect(rows.nth(1).locator('button:has-text("Inspect")')).toBeVisible();
      const ownDeleteBtn = rows.nth(1).locator('button:has-text("Delete")');
      await expect(ownDeleteBtn).toBeVisible();

      // Deleting own batch succeeds
      let deleteApiCalled = false;
      page.on('dialog', async (dialog) => {
        await dialog.accept();
      });

      const ownBatchId = MOCK_TRACKER_BATCHES[1].id;
      await page.route(`**/api/bulk-import/batch/${ownBatchId}/**`, async (route) => {
        if (route.request().method() === 'DELETE') {
          deleteApiCalled = true;
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, message: 'Batch deleted.' })
          });
        }
      });

      await ownDeleteBtn.click();
      expect(deleteApiCalled).toBe(true);
    });

    test('recruiter can delete own resume batch but CANNOT delete other users resume batches', async ({ page }) => {
      // Switch to Resumes Subtab
      await page.click('.sub-tab-btn:has-text("Resume Zip Archives")');

      const resumeRows = page.locator('.data-table tbody tr.clickable-row');

      // Row 0: Uploaded by Super Admin (ID: 1) -> Delete button must NOT exist
      await expect(resumeRows.nth(0).locator('button:has-text("Inspect")')).toBeVisible();
      await expect(resumeRows.nth(0).locator('button:has-text("Delete")')).not.toBeVisible();

      // Row 1: Uploaded by Alex Recruiter (ID: 102) -> Delete button MUST exist
      await expect(resumeRows.nth(1).locator('button:has-text("Inspect")')).toBeVisible();
      const ownResumeDeleteBtn = resumeRows.nth(1).locator('button:has-text("Delete")');
      await expect(ownResumeDeleteBtn).toBeVisible();
    });
  });
});
