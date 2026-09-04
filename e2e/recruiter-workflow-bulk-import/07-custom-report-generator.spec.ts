// playwright/recruiter-workflow-bulk-import/07-custom-report-generator.spec.ts
import { test, expect } from '@playwright/test';
import { setupMockAuthAndApis } from './test-fixtures';

test.describe('Scenario 7: Custom Candidate Report Generator & Exporter', () => {

  test.beforeEach(async ({ page }) => {
    await setupMockAuthAndApis(page);
    await page.goto('/recruiter-workflow-bulk-import');
    await page.waitForLoadState('networkidle');
    await page.click('button.tab:has-text("Export Reports")');
  });

  test('should render report builder with date range presets and format toggles', async ({ page }) => {
    const reportBuilder = page.locator('.report-builder-container');
    await expect(reportBuilder).toBeVisible();

    // Verify Format radio cards
    const excelCard = page.locator('.format-card:has(.format-title:has-text("Excel (.xlsx)"))');
    const csvCard = page.locator('.format-card:has(.format-title:has-text("CSV (.csv)"))');
    await expect(excelCard).toHaveClass(/active/); // default active

    // Switch to CSV format
    await csvCard.click();
    await expect(csvCard).toHaveClass(/active/);
    await expect(excelCard).not.toHaveClass(/active/);

    // Verify preset pills
    const pill30Days = page.locator('.preset-pill:has-text("Last 30 Days")');
    await expect(pill30Days).toHaveClass(/active/);

    // Switch preset to "This Month"
    await page.click('.preset-pill:has-text("This Month")');
    await expect(page.locator('.preset-pill:has-text("This Month")')).toHaveClass(/active/);
  });

  test('should display clean filenames in the optional batch filter dropdown', async ({ page }) => {
    const batchSelect = page.locator('select.form-select').first();
    await expect(batchSelect).toBeVisible();

    // Verify options have clean names (no UUID)
    const optionsText = await batchSelect.allInnerTexts();
    expect(optionsText.length).toBeGreaterThan(0);
    expect(optionsText[0]).toContain('Q3_Tech_Recruitment_Tracker.xlsx');
    expect(optionsText[0]).not.toContain('c9bf7e45-');
  });

  test('should customize report columns using categories, select all and deselect all', async ({ page }) => {
    const selectedBadge = page.locator('.selected-count-badge strong');
    await expect(selectedBadge).toHaveText('8'); // 8 default columns

    // Click "Deselect All"
    await page.click('button:has-text("Deselect All")');
    await expect(selectedBadge).toHaveText('0');

    // Click "Select All"
    await page.click('button:has-text("Select All")');
    await expect(selectedBadge).toHaveText('13'); // 13 total available columns

    // Toggle specific category "Education"
    const eduCategory = page.locator('.category-box:has(.category-name:has-text("Education"))');
    await eduCategory.locator('.cat-toggle-btn').click();
    await expect(selectedBadge).toHaveText('10'); // 13 - 3 education columns = 10
  });

  test('should trigger report generation and download file successfully', async ({ page }) => {
    // Setup download listener
    const downloadPromise = page.waitForEvent('download');

    // Click Generate & Download Report
    const downloadBtn = page.locator('.report-action-bar button:has-text("Download Statement Report")');
    await expect(downloadBtn).toBeEnabled();
    await downloadBtn.click();

    // Verify success banner appears
    const successBanner = page.locator('.report-banner.success-banner');
    await expect(successBanner).toBeVisible();
    await expect(successBanner).toContainText('successfully generated and downloaded');

    // Verify downloaded file name
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('Candidate_Report_');
  });
});
