// playwright/recruiter-workflow-bulk-import/06-dual-ingestion-workflow.spec.ts
import { test, expect } from '@playwright/test';
import { setupMockAuthAndApis } from './test-fixtures';

test.describe('Scenario 6: Dual Ingestion (Combined Tracker + Resumes Archive)', () => {

  test.beforeEach(async ({ page }) => {
    await setupMockAuthAndApis(page);
    await page.goto('/recruiter-workflow-bulk-import');
    await page.waitForLoadState('networkidle');
    await page.click('button.tab:has-text("New Dual Ingestion")');
  });

  test('should allow selecting both Tracker and Resumes Archive simultaneously and show dual ready banner', async ({ page }) => {
    // 1. Select Tracker file in Dropzone 1
    const trackerInput = page.locator('input[type="file"][accept*=".xlsx"]');
    await trackerInput.setInputFiles({
      name: 'Full_Team_Candidates.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer: Buffer.from('MOCK_XLSX_DATA')
    });

    // 2. Select Resumes ZIP in Dropzone 2
    const resumeInput = page.locator('input[type="file"][accept*=".zip"]');
    await resumeInput.setInputFiles({
      name: 'Full_Team_Resumes.zip',
      mimeType: 'application/zip',
      buffer: Buffer.from('MOCK_ZIP_DATA')
    });

    // Verify both dropzone cards show selected files
    await expect(page.locator('.dropzone-card:has(.tracker-badge) .file-name-lg')).toHaveText('Full_Team_Candidates.xlsx');
    await expect(page.locator('.dropzone-card:has(.resume-badge) .file-name-lg')).toHaveText('Full_Team_Resumes.zip');

    // Verify Dual Ingestion Ready Summary Tag
    const summaryTag = page.locator('.action-summary .summary-tag.good');
    await expect(summaryTag).toBeVisible();
    await expect(summaryTag).toContainText('Dual Ingestion Ready: Tracker + Zip Archive');

    // Verify primary action button is enabled
    const startBtn = page.locator('button:has-text("Start Ingestion & AI Matching")');
    await expect(startBtn).toBeEnabled();
  });

  test('should execute chained dual ingestion uploading tracker first and resume archive second', async ({ page }) => {
    let trackerUploadCalled = false;
    let resumeUploadCalled = false;
    const parentTrackerBatchId = '33333333-4444-5555-6666-777788889999';

    // Mock Preview Headers API
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

    // Mock Tracker Upload API
    await page.route('**/api/bulk-import/upload/**', async (route) => {
      trackerUploadCalled = true;
      await route.fulfill({
        status: 202,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Tracker uploaded.',
          batch: {
            id: parentTrackerBatchId,
            file_name: 'uuid-111_Full_Team_Candidates.xlsx',
            file_size: 1048576,
            status: 'PROCESSING',
            total_rows: 100,
            success_rows: 50,
            failed_rows: 0
          }
        })
      });
    });

    // Mock Resume Upload API
    await page.route('**/api/bulk-import/resume/upload-zip/**', async (route) => {
      resumeUploadCalled = true;
      await route.fulfill({
        status: 202,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Resumes uploaded.',
          resume_batch: {
            id: '44444444-5555-6666-7777-888899990000',
            zip_file_name: 'uuid-222_Full_Team_Resumes.zip',
            file_size: 10485760,
            status: 'PROCESSING',
            total_files: 50,
            extracted_files: 50,
            matched_files: 25,
            unmatched_files: 0
          }
        })
      });
    });

    const trackerInput = page.locator('input[type="file"][accept*=".xlsx"]');
    await trackerInput.setInputFiles({
      name: 'Full_Team_Candidates.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer: Buffer.from('MOCK_XLSX_DATA')
    });

    const resumeInput = page.locator('input[type="file"][accept*=".zip"]');
    await resumeInput.setInputFiles({
      name: 'Full_Team_Resumes.zip',
      mimeType: 'application/zip',
      buffer: Buffer.from('MOCK_ZIP_DATA')
    });

    await page.click('button:has-text("Start Ingestion & AI Matching")');

    // Wait for network requests to complete
    await page.waitForTimeout(500);

    expect(trackerUploadCalled).toBe(true);
    expect(resumeUploadCalled).toBe(true);
  });
});
