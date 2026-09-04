// playwright/recruiter-workflow-bulk-import/03-duplicate-handling-and-diagnostics.spec.ts
import { test, expect } from '@playwright/test';
import { setupMockAuthAndApis, MOCK_ERROR_LOGS } from './test-fixtures';

test.describe('Scenario 3: Duplicate Candidate Handling & Error Diagnostics', () => {

  test.beforeEach(async ({ page }) => {
    await setupMockAuthAndApis(page);
    await page.goto('/recruiter-workflow-bulk-import');
    await page.waitForLoadState('networkidle');
  });

  test('should display 409 duplicate file conflict when uploading an already processed file', async ({ page }) => {
    await page.click('button.tab:has-text("New Dual Ingestion")');

    // Mock Preview Headers high confidence
    await page.route('**/api/bulk-import/preview-headers/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          headers: ['email', 'phone'],
          mapping: { '0': 'email', '1': 'phone' },
          needs_review: false
        })
      });
    });

    // Mock 409 Duplicate file response
    await page.route('**/api/bulk-import/upload/**', async (route) => {
      await route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Duplicate file detected. This file has already been uploaded.',
          existing_batch_id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
          status: 'COMPLETED',
          completed_at: new Date().toISOString()
        })
      });
    });

    const fileInput = page.locator('input[type="file"][accept*=".xlsx"]');
    await fileInput.setInputFiles({
      name: 'Duplicate_Candidates_List.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer: Buffer.from('DUPLICATE_FILE_BYTES')
    });

    await page.click('button:has-text("Start Ingestion & AI Matching")');

    // Verify upload error banner displays duplicate message
    const errorBanner = page.locator('.upload-error-banner');
    await expect(errorBanner).toBeVisible();
    await expect(errorBanner).toContainText('Duplicate file detected. This file has already been uploaded.');
  });

  test('should display COMPLETED_WITH_ERRORS status and Error Diagnostics table for batches with skipped duplicates', async ({ page }) => {
    // Select the batch with errors (Sales_Hiring_Tracker_2026.csv) from history
    const errorBatchRow = page.locator('.data-table tbody tr.clickable-row').nth(1);
    await expect(errorBatchRow.locator('.chip-status')).toHaveText('COMPLETED_WITH_ERRORS');

    // Click "Inspect"
    await errorBatchRow.locator('button:has-text("Inspect")').click();

    // Verify Live Monitor view is loaded
    await expect(page.locator('.tab.active')).toHaveText('Live Monitor');
    const liveSection = page.locator('.live-monitor-section');
    await expect(liveSection).toBeVisible();

    // Verify clean display title
    await expect(liveSection.locator('h2')).toHaveText('Sales_Hiring_Tracker_2026.csv');

    // Verify Validation Errors counter is highlighted in amber
    const warnBox = liveSection.locator('.counter-box.warn-box');
    await expect(warnBox.locator('.cnt-val')).toHaveText('10');

    // Verify Error Diagnostics section is rendered
    const errorLogsContainer = page.locator('.error-logs-container');
    await expect(errorLogsContainer).toBeVisible();
    await expect(errorLogsContainer.locator('h3')).toContainText('Error Diagnostics (10 rows)');

    // Verify Error Table rows
    const errorRows = errorLogsContainer.locator('.error-table tbody tr');
    await expect(errorRows).toHaveCount(2);

    // Row 1: Duplicate Email error
    await expect(errorRows.nth(0).locator('.num-cell')).toHaveText('#42');
    await expect(errorRows.nth(0).locator('.err-msg-cell')).toContainText('Skipped duplicate candidate email: rahul.sharma@example.com');

    // Row 2: Duplicate Phone error
    await expect(errorRows.nth(1).locator('.num-cell')).toHaveText('#75');
    await expect(errorRows.nth(1).locator('.err-msg-cell')).toContainText('Skipped duplicate candidate phone: 9123456780');
  });

  test('should open Raw JSON modal to inspect exact extracted row payload for skipped duplicates', async ({ page }) => {
    // Navigate directly to inspect error batch
    const errorBatchRow = page.locator('.data-table tbody tr.clickable-row').nth(1);
    await errorBatchRow.click();

    // Click "View JSON" on first error row
    const viewJsonBtn = page.locator('.error-table tbody tr').first().locator('button:has-text("View JSON")');
    await expect(viewJsonBtn).toBeVisible();
    await viewJsonBtn.click();

    // Verify Raw Data Modal opens
    const rawModal = page.locator('.modal-content:has(h3:has-text("Raw Extracted JSON Payload"))');
    await expect(rawModal).toBeVisible();

    // Verify JSON payload content
    const codeBlock = rawModal.locator('.json-code-block');
    await expect(codeBlock).toContainText('rahul.sharma@example.com');
    await expect(codeBlock).toContainText('9876543210');
    await expect(codeBlock).toContainText('18 LPA');

    // Close modal
    await rawModal.locator('button:has-text("Close")').click();
    await expect(rawModal).not.toBeVisible();
  });
});
