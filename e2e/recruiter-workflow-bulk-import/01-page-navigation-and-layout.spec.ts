// playwright/recruiter-workflow-bulk-import/01-page-navigation-and-layout.spec.ts
import { test, expect } from '@playwright/test';
import { setupMockAuthAndApis } from './test-fixtures';

test.describe('Scenario 1: Page Navigation, Layout & Clean File Display', () => {

  test.beforeEach(async ({ page }) => {
    await setupMockAuthAndApis(page);
    await page.goto('/recruiter-workflow-bulk-import');
    await page.waitForLoadState('networkidle');
  });

  test('should render page headers, breadcrumbs and title correctly', async ({ page }) => {
    // Breadcrumbs
    await expect(page.locator('.crumbs')).toContainText('Bulk Ingestion & AI Matcher');

    // Page title and subtitle
    await expect(page.locator('.page-title')).toHaveText('Bulk Ingestion & AI Resume Matcher');
    await expect(page.locator('.page-sub')).toContainText('Stream candidate trackers');

    // Action buttons in topbar
    await expect(page.locator('button:has-text("Sync Sweeper")')).toBeVisible();
    await expect(page.locator('button:has-text("New Ingestion")')).toBeVisible();
    await expect(page.locator('button:has-text("Candidates Hub")')).toBeVisible();
  });

  test('should display aggregate statistics in the stats strip', async ({ page }) => {
    const statsStrip = page.locator('.stats');
    await expect(statsStrip).toBeVisible();

    // 1. Total Batches Count (2 Trackers + 1 Resume = 3)
    await expect(statsStrip.locator('.stat:has-text("Total Ingestion Batches") .stat-value')).toHaveText('3');

    // 2. Imported Candidates (142 + 70 = 212)
    await expect(statsStrip.locator('.stat:has-text("Imported Candidates") .stat-value')).toHaveText('212');

    // 3. AI Matched Resumes (42)
    await expect(statsStrip.locator('.stat:has-text("AI Matched Resumes") .stat-value')).toHaveText('42');

    // 4. Unmatched Resumes (2)
    await expect(statsStrip.locator('.stat:has-text("Unmatched Resumes") .stat-value')).toHaveText('2');
  });

  test('should switch between all 5 primary tabs smoothly', async ({ page }) => {
    // Tab 1: Ingestion History (active by default)
    await expect(page.locator('.tab.active')).toContainText('Ingestion History');
    await expect(page.locator('.sub-tab-strip')).toBeVisible();

    // Tab 2: New Dual Ingestion
    await page.click('button.tab:has-text("New Dual Ingestion")');
    await expect(page.locator('.dual-dropzone-container')).toBeVisible();
    await expect(page.locator('.dropzone-card')).toHaveCount(2);

    // Tab 3: Live Monitor
    await page.click('button.tab:has-text("Live Monitor")');
    await expect(page.locator('.no-batch-monitor, .live-monitor-section')).toBeVisible();

    // Tab 4: Unmatched Resumes
    await page.click('button.tab:has-text("Unmatched Resumes")');
    await expect(page.locator('.resolver-head')).toBeVisible();
    await expect(page.locator('.unmatched-card')).toHaveCount(2);

    // Tab 5: Export Reports
    await page.click('button.tab:has-text("Export Reports")');
    await expect(page.locator('.report-builder-container')).toBeVisible();
  });

  test('should display clean filenames without technical UUIDs in history tables', async ({ page }) => {
    // 1. Check Trackers Table
    const trackerRow = page.locator('.data-table tbody tr.clickable-row').first();
    await expect(trackerRow).toBeVisible();

    // Verify clean display title (stripped UUID)
    const fileTitle = trackerRow.locator('.file-title');
    await expect(fileTitle).toHaveText('Q3_Tech_Recruitment_Tracker.xlsx');
    await expect(fileTitle).not.toContainText('c9bf7e45-');

    // Verify file meta does NOT show raw UUID
    const fileMeta = trackerRow.locator('.file-meta');
    await expect(fileMeta).toHaveText('1.00 MB');
    await expect(fileMeta).not.toContainText('ID:');

    // 2. Switch to Resumes Sub-Tab
    await page.click('.sub-tab-btn:has-text("Resume Zip Archives")');
    const resumeRow = page.locator('.data-table tbody tr.clickable-row').first();
    await expect(resumeRow).toBeVisible();

    const resumeTitle = resumeRow.locator('.file-title');
    await expect(resumeTitle).toHaveText('Engineering_Resumes_Aug2026.zip');
    await expect(resumeTitle).not.toContainText('12345678-');

    const resumeMeta = resumeRow.locator('.file-meta');
    await expect(resumeMeta).toHaveText('15.00 MB');
    await expect(resumeMeta).not.toContainText('ID:');
  });

  test('should filter history table when searching by clean filename', async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Search by file name..."]');
    await expect(searchInput).toBeVisible();

    // Search for "Sales"
    await searchInput.fill('Sales');
    const rows = page.locator('.data-table tbody tr.clickable-row');
    await expect(rows).toHaveCount(1);
    await expect(rows.first().locator('.file-title')).toHaveText('Sales_Hiring_Tracker_2026.csv');

    // Clear search
    await searchInput.fill('');
    await expect(page.locator('.data-table tbody tr.clickable-row')).toHaveCount(2);
  });
});
