// playwright/recruiter-workflow-bulk-import/02-tracker-spreadsheet-upload.spec.ts
import { test, expect } from '@playwright/test';
import { setupMockAuthAndApis } from './test-fixtures';

test.describe('Scenario 2: Candidate Tracker Spreadsheet Upload & Header Resolution', () => {

  test.beforeEach(async ({ page }) => {
    await setupMockAuthAndApis(page);
    await page.goto('/recruiter-workflow-bulk-import');
    await page.waitForLoadState('networkidle');
    await page.click('button.tab:has-text("New Dual Ingestion")');
  });

  test('should allow selecting an Excel spreadsheet and display file details', async ({ page }) => {
    const fileInput = page.locator('input[type="file"][accept*=".xlsx"]');

    // Upload mock spreadsheet
    await fileInput.setInputFiles({
      name: 'Tech_Candidates_March_2026.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer: Buffer.from('MOCK_XLSX_DATA')
    });

    // Check selected file card appears
    const selectedFileView = page.locator('.dropzone-card.has-file .selected-file-view');
    await expect(selectedFileView).toBeVisible();
    await expect(selectedFileView.locator('.file-name-lg')).toHaveText('Tech_Candidates_March_2026.xlsx');

    // Remove file button
    await page.click('.remove-btn');
    await expect(page.locator('.dropzone-card.has-file')).not.toBeVisible();
    await expect(page.locator('.dropzone-body h3:has-text("Select Candidate Spreadsheet")')).toBeVisible();
  });

  test('should trigger 3-Tier Header Resolution and open Mapping Modal on ambiguous headers', async ({ page }) => {
    // Mock Preview Headers API returning needs_review = true
    await page.route('**/api/bulk-import/preview-headers/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          headers: ['Candidate Name', 'Mail ID', 'Contact No', 'Total Exp', 'Salary Expected', 'Notice'],
          mapping: {
            '0': 'candidate_name',
            '1': 'email',
            '2': 'phone',
            '3': 'total_exp',
            '4': 'ex_ctc',
            '5': 'notice_period'
          },
          resolution_report: [
            { column_index: 0, raw_header: 'Candidate Name', canonical: 'candidate_name', tier: 1, tier_name: 'Exact Alias', confidence: 100 },
            { column_index: 1, raw_header: 'Mail ID', canonical: 'email', tier: 2, tier_name: 'Fuzzy Match', confidence: 85 },
            { column_index: 2, raw_header: 'Contact No', canonical: 'phone', tier: 2, tier_name: 'Fuzzy Match', confidence: 80 },
            { column_index: 3, raw_header: 'Total Exp', canonical: 'total_exp', tier: 1, tier_name: 'Exact Alias', confidence: 100 },
            { column_index: 4, raw_header: 'Salary Expected', canonical: 'ex_ctc', tier: 3, tier_name: 'AI Inferred', confidence: 75 },
            { column_index: 5, raw_header: 'Notice', canonical: 'notice_period', tier: 2, tier_name: 'Fuzzy Match', confidence: 82 }
          ],
          missing_required: [],
          needs_review: true,
          canonical_fields: [
            { key: 'candidate_name', label: 'Candidate Name', required: false },
            { key: 'email', label: 'Email Address', required: true },
            { key: 'phone', label: 'Phone Number', required: true },
            { key: 'current_ctc', label: 'Current CTC (LPA)', required: false },
            { key: 'ex_ctc', label: 'Expected CTC (LPA)', required: false },
            { key: 'total_exp', label: 'Total Experience (Years)', required: false },
            { key: 'notice_period', label: 'Notice Period', required: false }
          ]
        })
      });
    });

    const fileInput = page.locator('input[type="file"][accept*=".xlsx"]');
    await fileInput.setInputFiles({
      name: 'Custom_Header_Candidates.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer: Buffer.from('MOCK_XLSX_DATA')
    });

    // Click Start Ingestion
    await page.click('button:has-text("Start Ingestion & AI Matching")');

    // Verify Review Column Mapping Modal is displayed
    const mappingModal = page.locator('.modal-content.mapping-modal');
    await expect(mappingModal).toBeVisible();
    await expect(mappingModal.locator('h3')).toHaveText('Review Column Mapping');

    // Verify Tier badges (Exact, Fuzzy, AI Inferred)
    await expect(mappingModal.locator('.tier-badge:has-text("Exact Alias")')).toHaveCount(2);
    await expect(mappingModal.locator('.tier-badge:has-text("Fuzzy Match")')).toHaveCount(3);
    await expect(mappingModal.locator('.tier-badge:has-text("AI Inferred")')).toHaveCount(1);
  });

  test('should allow manual override of column mapping in the review modal', async ({ page }) => {
    await page.route('**/api/bulk-import/preview-headers/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          headers: ['Name', 'Unrecognized_Col'],
          mapping: { '0': 'candidate_name', '1': '_unmapped' },
          resolution_report: [
            { column_index: 0, raw_header: 'Name', canonical: 'candidate_name', tier: 1, tier_name: 'Exact Alias', confidence: 100 },
            { column_index: 1, raw_header: 'Unrecognized_Col', canonical: '_unmapped', tier: 4, tier_name: 'Unmapped', confidence: 0 }
          ],
          missing_required: ['Email Address', 'Phone Number'],
          needs_review: true,
          canonical_fields: [
            { key: 'email', label: 'Email Address', required: true },
            { key: 'phone', label: 'Phone Number', required: true }
          ]
        })
      });
    });

    const fileInput = page.locator('input[type="file"][accept*=".xlsx"]');
    await fileInput.setInputFiles({
      name: 'Unmapped_Tracker.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer: Buffer.from('MOCK_XLSX_DATA')
    });

    await page.click('button:has-text("Start Ingestion & AI Matching")');

    // Missing required fields warning banner
    const alertBanner = page.locator('.mapping-alert-banner');
    await expect(alertBanner).toBeVisible();
    await expect(alertBanner).toContainText('Required fields missing: Email Address, Phone Number');

    // Manually map column 1 to Email Address
    const colSelect = page.locator('.mapping-select').nth(1);
    await colSelect.selectOption('email');

    // Verify tier badge updates to Manual Override
    await expect(page.locator('.tier-badge:has-text("Manual Override")')).toBeVisible();
  });

  test('should execute seamless upload and transition to Live Monitor when headers are confident', async ({ page }) => {
    // 1. Preview headers returns needs_review = false
    await page.route('**/api/bulk-import/preview-headers/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          headers: ['candidate_name', 'email', 'phone'],
          mapping: { '0': 'candidate_name', '1': 'email', '2': 'phone' },
          resolution_report: [],
          missing_required: [],
          needs_review: false
        })
      });
    });

    // 2. Upload Candidate File API
    const newBatchId = '55555555-6666-7777-8888-99990000aaaa';
    await page.route('**/api/bulk-import/upload/**', async (route) => {
      await route.fulfill({
        status: 202,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'File uploaded successfully.',
          batch: {
            id: newBatchId,
            file_name: 'uuid-1234_Verified_Candidates.xlsx',
            file_size: 204800,
            status: 'PROCESSING',
            total_rows: 50,
            success_rows: 25,
            failed_rows: 0,
            last_processed_row: 25,
            current_sheet_name: 'Sheet1',
            created_at: new Date().toISOString()
          }
        })
      });
    });

    // 3. Batch Detail Polling API
    await page.route(`**/api/bulk-import/batch/${newBatchId}/**`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: newBatchId,
          file_name: 'uuid-1234_Verified_Candidates.xlsx',
          file_size: 204800,
          status: 'COMPLETED',
          total_rows: 50,
          success_rows: 50,
          failed_rows: 0,
          last_processed_row: 50,
          current_sheet_name: 'Sheet1',
          created_at: new Date().toISOString()
        })
      });
    });

    const fileInput = page.locator('input[type="file"][accept*=".xlsx"]');
    await fileInput.setInputFiles({
      name: 'Verified_Candidates.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer: Buffer.from('MOCK_XLSX_DATA')
    });

    await page.click('button:has-text("Start Ingestion & AI Matching")');

    // Transitions to Live Monitor tab
    await expect(page.locator('.tab.active')).toHaveText('Live Monitor');
    const liveSection = page.locator('.live-monitor-section');
    await expect(liveSection).toBeVisible();

    // Verify clean display title (no UUID prefix)
    await expect(liveSection.locator('h2')).toHaveText('Verified_Candidates.xlsx');
    await expect(liveSection.locator('h2')).not.toContainText('uuid-1234_');

    // Verify progress metrics
    await expect(liveSection.locator('.counter-box.good-box .cnt-val')).toHaveText('50');
  });
});
