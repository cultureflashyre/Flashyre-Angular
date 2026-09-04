// playwright/recruiter-workflow-bulk-import/04-resume-archive-and-ai-matching.spec.ts
import { test, expect } from '@playwright/test';
import { setupMockAuthAndApis } from './test-fixtures';

test.describe('Scenario 4: Bulk Resume Archive Upload & AI Matching', () => {

  test.beforeEach(async ({ page }) => {
    await setupMockAuthAndApis(page);
    await page.goto('/recruiter-workflow-bulk-import');
    await page.waitForLoadState('networkidle');
    await page.click('button.tab:has-text("New Dual Ingestion")');
  });

  test('should accept single .zip resume archive and display package summary', async ({ page }) => {
    const zipInput = page.locator('input[type="file"][accept*=".zip"]');

    await zipInput.setInputFiles({
      name: 'Frontend_Engineers_Resumes_2026.zip',
      mimeType: 'application/zip',
      buffer: Buffer.from('MOCK_ZIP_DATA')
    });

    const resumeDropzone = page.locator('.dropzone-card:has(.resume-badge)');
    await expect(resumeDropzone).toHaveClass(/has-file/);
    await expect(resumeDropzone.locator('.file-name-lg')).toHaveText('Frontend_Engineers_Resumes_2026.zip');

    // Summary pill updates
    const summaryTag = page.locator('.action-summary .summary-tag.purple');
    await expect(summaryTag).toBeVisible();
    await expect(summaryTag).toContainText('Single Ingestion: Resumes Package (.zip)');
  });

  test('should accept multiple individual PDF and DOCX resume documents', async ({ page }) => {
    const resumeInput = page.locator('input[type="file"][accept*=".zip"]');

    await resumeInput.setInputFiles([
      { name: 'John_Doe_FullStack.pdf', mimeType: 'application/pdf', buffer: Buffer.from('MOCK_PDF_1') },
      { name: 'Jane_Smith_DevOps.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', buffer: Buffer.from('MOCK_DOCX_1') },
      { name: 'Amit_Patel_Backend.pdf', mimeType: 'application/pdf', buffer: Buffer.from('MOCK_PDF_2') }
    ]);

    const resumeDropzone = page.locator('.dropzone-card:has(.resume-badge)');
    await expect(resumeDropzone).toHaveClass(/has-file/);
    await expect(resumeDropzone.locator('.file-name-lg')).toHaveText('3 Resume Documents Selected');
    await expect(resumeDropzone.locator('.files-summary-pill')).toContainText('John_Doe_FullStack.pdf and 2 more file(s)');
  });

  test('should execute resume matching and display live progress bar', async ({ page }) => {
    const resumeBatchId = '88888888-9999-aaaa-bbbb-ccccddddeeee';

    // Mock Upload Resume API
    await page.route('**/api/bulk-import/resume/upload-zip/**', async (route) => {
      await route.fulfill({
        status: 202,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Processed 30 resumes successfully. Matching initiated.',
          resume_batch: {
            id: resumeBatchId,
            zip_file_name: 'uuid-5678_Java_Resumes.zip',
            file_size: 5242880,
            status: 'PROCESSING',
            total_files: 30,
            extracted_files: 30,
            matched_files: 10,
            unmatched_files: 2,
            failed_files: 0,
            created_at: new Date().toISOString()
          }
        })
      });
    });

    // Mock Resume Batch Detail Polling API
    await page.route(`**/api/bulk-import/resume/batch/${resumeBatchId}/**`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: resumeBatchId,
          zip_file_name: 'uuid-5678_Java_Resumes.zip',
          file_size: 5242880,
          status: 'COMPLETED',
          total_files: 30,
          extracted_files: 30,
          matched_files: 28,
          unmatched_files: 2,
          failed_files: 0,
          created_at: new Date().toISOString()
        })
      });
    });

    const zipInput = page.locator('input[type="file"][accept*=".zip"]');
    await zipInput.setInputFiles({
      name: 'Java_Resumes.zip',
      mimeType: 'application/zip',
      buffer: Buffer.from('MOCK_ZIP_DATA')
    });

    await page.click('button:has-text("Start Ingestion & AI Matching")');

    // Transitions to Live Monitor
    await expect(page.locator('.tab.active')).toHaveText('Live Monitor');

    // Verify clean display title
    const liveResumeSection = page.locator('.live-monitor-section:has(.eyebrow:has-text("Resume Archive AI Matcher"))');
    await expect(liveResumeSection).toBeVisible();
    await expect(liveResumeSection.locator('h2')).toHaveText('Java_Resumes.zip');
    await expect(liveResumeSection.locator('h2')).not.toContainText('uuid-5678_');

    // Verify counters
    await expect(liveResumeSection.locator('.counter-box.good-box .cnt-val')).toHaveText('28');
    await expect(liveResumeSection.locator('.counter-box.warn-box .cnt-val')).toHaveText('2');
  });
});
