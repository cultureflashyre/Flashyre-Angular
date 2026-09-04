import { test, expect } from '@playwright/test';

/**
 * =========================================================================
 * Comprehensive Playwright E2E Test Suite
 * Route: /recruiter-workflow-bulk-import
 * 
 * Includes:
 * 1. Positive Scenarios (Happy Path Flows)
 * 2. Negative Scenarios (Error Handling, Edge Cases, Network Failures, Auth)
 * =========================================================================
 */
test.describe('Bulk Ingestion & AI Resume Matcher E2E Test Suite', () => {

  // Valid unexpired JWT with exp in year 2038 and role 'admin'
  const VALID_MOCK_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjI1MzQwMjMwMDc5OSwidXNlcl9pZCI6MSwidXNlcl90eXBlIjoiYWRtaW4ifQ.signature';

  const MOCK_TRACKER_BATCHES = [
    {
      id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
      file_name: 'Q3_Tech_Recruitment_Tracker.xlsx',
      file_size: 1048576,
      status: 'COMPLETED',
      total_rows: 150,
      processed_rows: 150,
      success_rows: 142,
      failed_rows: 8,
      last_processed_row: 150,
      current_sheet_name: 'Frontend Developers',
      processed_sheets: ['Frontend Developers', 'Backend Engineers'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'f9e8d7c6-b5a4-3210-9876-543210fedcba',
      file_name: 'Sales_Hiring_Tracker_2026.csv',
      file_size: 524288,
      status: 'COMPLETED_WITH_ERRORS',
      total_rows: 80,
      processed_rows: 80,
      success_rows: 70,
      failed_rows: 10,
      last_processed_row: 80,
      current_sheet_name: 'Sheet1',
      processed_sheets: ['Sheet1'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  ];

  const MOCK_RESUME_BATCHES = [
    {
      id: '77777777-8888-9999-aaaa-bbbbccccdddd',
      zip_file_name: 'Engineering_Resumes_Aug2026.zip',
      file_size: 15728640,
      status: 'COMPLETED',
      total_files: 45,
      extracted_files: 45,
      matched_files: 42,
      unmatched_files: 3,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  ];

  const MOCK_UNMATCHED_RESUMES = [
    {
      id: 101,
      resume_batch: '77777777-8888-9999-aaaa-bbbbccccdddd',
      original_filename: 'Vikram_Aditya_Senior_Java_Resume.pdf',
      gcs_url: 'https://storage.googleapis.com/test-bucket/Vikram_Aditya.pdf',
      extracted_text_preview: 'Vikram Aditya, 8+ years Java Spring Boot Microservices...',
      ai_parsed_data: {
        first_name: 'Vikram',
        last_name: 'Aditya',
        email: 'vikram.aditya@techcloud.io',
        phone_number: '9876543210',
        skills: 'Java, Spring Boot, Microservices, AWS, Docker',
        total_experience_years: 8
      },
      match_attempts: {
        priority_result: 'AMBIGUOUS_MATCH',
        details: 'Found 2 candidates matching first name Vikram'
      },
      is_resolved: false,
      resolved_candidate: null
    }
  ];

  const MOCK_CANDIDATES = [
    {
      id: 501,
      first_name: 'Vikram',
      last_name: 'Aditya',
      email: 'vikram.aditya@techcloud.io',
      phone_number: '+919876543210'
    },
    {
      id: 502,
      first_name: 'Vikram',
      last_name: 'Sharma',
      email: 'vikram.s@example.com',
      phone_number: '+919123456780'
    }
  ];

  const MOCK_ERROR_LOGS = [
    {
      sheet_name: 'Frontend Developers',
      row_number: 14,
      error_message: 'Phone number missing or invalid format (got null)',
      raw_data: { candidate_name: 'John Doe', email: 'johndoe@test.com', phone: null }
    }
  ];

  // Helper to seed localStorage with valid Admin credentials
  async function setupAuthenticatedAdminSession(page: any) {
    await page.addInitScript(({ jwt, userType, isSuperUser }) => {
      localStorage.setItem('jwtToken', jwt);
      localStorage.setItem('userType', userType);
      localStorage.setItem('isSuperUser', isSuperUser);
      localStorage.setItem('refreshToken', 'valid-mock-refresh-token');
    }, { jwt: VALID_MOCK_JWT, userType: 'admin', isSuperUser: 'true' });
  }

  // =========================================================================
  // POSITIVE SCENARIOS (HAPPY PATH)
  // =========================================================================
  test.describe('POSITIVE SCENARIOS', () => {

    test.beforeEach(async ({ page }) => {
      await setupAuthenticatedAdminSession(page);

      // Mock standard API routes
      await page.route('**/api/bulk-import/batches/**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ results: MOCK_TRACKER_BATCHES, count: MOCK_TRACKER_BATCHES.length }),
        });
      });

      await page.route('**/api/bulk-import/resume/batches/**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ results: MOCK_RESUME_BATCHES, count: MOCK_RESUME_BATCHES.length }),
        });
      });

      await page.route('**/api/bulk-import/resume/unmatched/**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ results: MOCK_UNMATCHED_RESUMES, count: MOCK_UNMATCHED_RESUMES.length }),
        });
      });

      await page.route('**/api/candidates/**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ results: MOCK_CANDIDATES, count: MOCK_CANDIDATES.length }),
        });
      });

      await page.route('**/api/bulk-import/batch/*/errors/**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ results: MOCK_ERROR_LOGS }),
        });
      });

      await page.goto('/recruiter-workflow-bulk-import');
    });

    test('POS-1: Page renders with correct title, aligned layout, and 4 calculated stat cards', async ({ page }) => {
      await expect(page.locator('.page-title')).toHaveText('Bulk Ingestion & AI Resume Matcher');
      await expect(page.locator('.crumbs .here')).toHaveText('Bulk Ingestion & AI Matcher');

      const statCards = page.locator('.stats .stat');
      await expect(statCards).toHaveCount(4);

      // Card 1: Total Batches (2 trackers + 1 zip = 3)
      await expect(statCards.nth(0)).toContainText('Total Ingestion Batches');
      await expect(statCards.nth(0).locator('.stat-value')).toHaveText('3');

      // Card 2: Imported Candidates (142 + 70 = 212)
      await expect(statCards.nth(1)).toContainText('Imported Candidates');
      await expect(statCards.nth(1).locator('.stat-value')).toHaveText('212');

      // Card 3: Matched Resumes (42)
      await expect(statCards.nth(2)).toContainText('AI Matched Resumes');
      await expect(statCards.nth(2).locator('.stat-value')).toHaveText('42');

      // Card 4: Unmatched Resumes (1)
      await expect(statCards.nth(3)).toContainText('Unmatched Resumes');
      await expect(statCards.nth(3).locator('.stat-value')).toHaveText('1');
    });

    test('POS-2: Ingestion History sub-tab switcher toggles between Trackers and Resume Zip archives', async ({ page }) => {
      const trackerTable = page.locator('.data-table');
      await expect(trackerTable).toContainText('Q3_Tech_Recruitment_Tracker.xlsx');
      await expect(trackerTable).toContainText('Sales_Hiring_Tracker_2026.csv');

      // Switch to Resume Archives view
      const resumeSubTabBtn = page.locator('.sub-tab-btn').filter({ hasText: 'Resume Zip Archives' });
      await resumeSubTabBtn.click();
      await expect(resumeSubTabBtn).toHaveClass(/active/);

      // Verify Resume Zip archives data
      await expect(page.locator('.data-table')).toContainText('Engineering_Resumes_Aug2026.zip');
      await expect(page.locator('.data-table')).toContainText('42');
      await expect(page.locator('.data-table')).toContainText('3');
    });

    test('POS-3: Live batch inspection displays progress, row counters, and error diagnostics modal', async ({ page }) => {
      const inspectBtn = page.locator('.btn-xs').filter({ hasText: 'Inspect' }).first();
      await inspectBtn.click();

      // Verify active tab switched to Live Monitor
      await expect(page.locator('.tab.active')).toContainText('Live Monitor');

      // Check batch details in monitor
      await expect(page.locator('.live-monitor-section')).toContainText('Q3_Tech_Recruitment_Tracker.xlsx');
      await expect(page.locator('.cnt-val').first()).toHaveText('150');

      // Open View JSON modal from error diagnostics
      const viewJsonBtn = page.locator('.btn-xs').filter({ hasText: 'View JSON' }).first();
      await viewJsonBtn.click();

      const rawModal = page.locator('.modal-content');
      await expect(rawModal).toBeVisible();
      await expect(rawModal).toContainText('Raw Extracted JSON Payload');
      await expect(rawModal.locator('.json-code-block')).toContainText('johndoe@test.com');

      // Close modal
      const closeBtn = rawModal.locator('.btn.primary').filter({ hasText: 'Close' });
      await closeBtn.click();
      await expect(rawModal).not.toBeVisible();
    });

    test('POS-4: Dual Dropzone handles combined ingestion (Tracker + Resume Zip Archive)', async ({ page }) => {
      // Navigate to New Ingestion tab
      await page.locator('.tab').filter({ hasText: 'New Dual Ingestion' }).click();

      // Mock upload endpoints with correct JSON structure
      await page.route('**/api/bulk-import/upload/**', async (route) => {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            batch: { id: 'new-tracker-uuid', file_name: 'candidates.xlsx', status: 'PROCESSING', total_rows: 50, processed_rows: 0, success_rows: 0, failed_rows: 0 }
          }),
        });
      });

      await page.route('**/api/bulk-import/resume/upload-zip/**', async (route) => {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            resume_batch: { id: 'new-resume-uuid', zip_file_name: 'resumes.zip', status: 'PROCESSING', total_files: 20, matched_files: 0, unmatched_files: 0 }
          }),
        });
      });

      // 1. Select Tracker file
      const trackerFileInput = page.locator('.dropzone-card').nth(0).locator('input[type="file"]');
      await trackerFileInput.setInputFiles({
        name: 'candidates.xlsx',
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        buffer: Buffer.from('mock excel data')
      });
      await expect(page.locator('.dropzone-card').nth(0)).toContainText('candidates.xlsx');

      // 2. Select Zip Archive file
      const zipFileInput = page.locator('.dropzone-card').nth(1).locator('input[type="file"]');
      await zipFileInput.setInputFiles({
        name: 'resumes.zip',
        mimeType: 'application/zip',
        buffer: Buffer.from('mock zip data')
      });
      await expect(page.locator('.dropzone-card').nth(1)).toContainText('resumes.zip');

      // 3. Verify Combined Ingestion Ready badge
      await expect(page.locator('.summary-tag.good')).toContainText('Dual Ingestion Ready: Tracker + Resumes Package');

      // 4. Start Ingestion
      const startBtn = page.locator('.action-buttons .btn.primary');
      await expect(startBtn).toBeEnabled();
      await startBtn.click();

      // Verify redirect to Live Monitor tab
      await expect(page.locator('.tab.active')).toContainText('Live Monitor');
    });

    test('POS-5: Unmatched Resumes Resolver opens search modal, selects candidate, and resolves resume', async ({ page }) => {
      // Navigate to Unmatched Resumes tab
      await page.locator('.tab').filter({ hasText: 'Unmatched Resumes' }).click();

      // Verify unmatched card
      const unmatchedCard = page.locator('.unmatched-card').first();
      await expect(unmatchedCard).toContainText('Vikram_Aditya_Senior_Java_Resume.pdf');
      await expect(unmatchedCard).toContainText('Java, Spring Boot');

      // Mock resolve API
      await page.route('**/api/bulk-import/resume/unmatched/101/resolve/**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ status: 'success', candidate_id: 501 }),
        });
      });

      // Open Resolve modal
      await page.locator('.resolve-action-btn').click();
      const modal = page.locator('.resolve-modal');
      await expect(modal).toBeVisible();

      // Search and pick candidate
      await modal.locator('.modal-search-box input').fill('Vikram Aditya');
      const candidatePick = modal.locator('.candidate-pick-item').first();
      await candidatePick.click();
      await expect(candidatePick).toHaveClass(/selected/);

      // Confirm resolve
      const confirmBtn = modal.locator('.modal-footer .btn.primary');
      await confirmBtn.click();

      // Modal closed and success alert displayed
      await expect(modal).not.toBeVisible();
      const alertMsg = page.locator('.alert-message');
      await expect(alertMsg).toBeVisible();
      await expect(alertMsg).toContainText('successfully attached');
    });

    test('POS-6: Sync Sweeper triggers background reconciliation and shows success banner', async ({ page }) => {
      await page.route('**/api/bulk-import/**reconcile/**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, message: 'Reconciliation completed.', stats: { stalled_found: 1, reenqueued: 1 } }),
        });
      });

      const sweeperBtn = page.locator('.topbar-actions .btn.good');
      await sweeperBtn.click();

      // Verify custom alert message displays
      const alertMsg = page.locator('.alert-message');
      await expect(alertMsg).toBeVisible();
      await expect(alertMsg).toContainText('Reconciliation completed');

      // Dismiss alert
      const closeAlertBtn = alertMsg.locator('.close-icon');
      await closeAlertBtn.click();
      await expect(alertMsg).not.toBeVisible();
    });
  });

  // =========================================================================
  // NEGATIVE SCENARIOS (ERROR HANDLING & EDGE CASES)
  // =========================================================================
  test.describe('NEGATIVE SCENARIOS', () => {

    test.beforeEach(async ({ page }) => {
      await setupAuthenticatedAdminSession(page);
    });

    test('NEG-1: Displays error banner when tracker spreadsheet upload fails (500 Internal Error)', async ({ page }) => {
      await page.route('**/api/bulk-import/batches/**', async (route) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ results: [] }) });
      });
      await page.route('**/api/bulk-import/resume/batches/**', async (route) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ results: [] }) });
      });
      await page.route('**/api/bulk-import/resume/unmatched/**', async (route) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ results: [] }) });
      });

      // Mock upload failure
      await page.route('**/api/bulk-import/upload/**', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Server database connection timed out during upload.' }),
        });
      });

      await page.goto('/recruiter-workflow-bulk-import');
      await page.locator('.tab').filter({ hasText: 'New Dual Ingestion' }).click();

      // Upload file
      const trackerFileInput = page.locator('.dropzone-card').nth(0).locator('input[type="file"]');
      await trackerFileInput.setInputFiles({
        name: 'corrupted_file.xlsx',
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        buffer: Buffer.from('corrupted data')
      });

      await page.locator('.action-buttons .btn.primary').click();

      // Verify Error Alert banner appears inside dropzone card
      const errorBanner = page.locator('.dropzone-card').nth(0).locator('.upload-error-banner');
      await expect(errorBanner).toBeVisible();
      await expect(errorBanner).toContainText('Server database connection timed out');
    });

    test('NEG-2: Displays error banner when resume zip upload fails with 422 Invalid Archive', async ({ page }) => {
      await page.route('**/api/bulk-import/batches/**', async (route) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ results: [] }) });
      });
      await page.route('**/api/bulk-import/resume/batches/**', async (route) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ results: [] }) });
      });
      await page.route('**/api/bulk-import/resume/unmatched/**', async (route) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ results: [] }) });
      });

      // Mock Zip upload error
      await page.route('**/api/bulk-import/resume/upload-zip/**', async (route) => {
        await route.fulfill({
          status: 422,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'The uploaded file is not a valid zip archive.' }),
        });
      });

      await page.goto('/recruiter-workflow-bulk-import');
      await page.locator('.tab').filter({ hasText: 'New Dual Ingestion' }).click();

      // Upload zip file
      const zipFileInput = page.locator('.dropzone-card').nth(1).locator('input[type="file"]');
      await zipFileInput.setInputFiles({
        name: 'invalid.zip',
        mimeType: 'application/zip',
        buffer: Buffer.from('invalid content')
      });

      await page.locator('.action-buttons .btn.primary').click();

      // Verify Error Alert banner appears inside zip dropzone card
      const errorBanner = page.locator('.dropzone-card').nth(1).locator('.upload-error-banner');
      await expect(errorBanner).toBeVisible();
      await expect(errorBanner).toContainText('The uploaded file is not a valid zip archive');
    });

    test('NEG-3: Displays empty state message when search query yields no matching batches', async ({ page }) => {
      await page.route('**/api/bulk-import/batches/**', async (route) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ results: MOCK_TRACKER_BATCHES }) });
      });
      await page.route('**/api/bulk-import/resume/batches/**', async (route) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ results: [] }) });
      });
      await page.route('**/api/bulk-import/resume/unmatched/**', async (route) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ results: [] }) });
      });

      await page.goto('/recruiter-workflow-bulk-import');

      // Search for nonexistent file
      const searchInput = page.locator('.search input');
      await searchInput.fill('NonExistentFilename12345');

      // Verify empty table message
      await expect(page.locator('.empty-table-msg')).toBeVisible();
      await expect(page.locator('.empty-table-msg')).toHaveText('No tracker batches found matching your search.');
    });

    test('NEG-4: Displays empty state illustration when all resumes are matched', async ({ page }) => {
      await page.route('**/api/bulk-import/batches/**', async (route) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ results: [] }) });
      });
      await page.route('**/api/bulk-import/resume/batches/**', async (route) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ results: [] }) });
      });
      // Return 0 unmatched resumes
      await page.route('**/api/bulk-import/resume/unmatched/**', async (route) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ results: [] }) });
      });

      await page.goto('/recruiter-workflow-bulk-import');
      await page.locator('.tab').filter({ hasText: 'Unmatched Resumes' }).click();

      // Verify all matched empty state
      const emptyView = page.locator('.all-resolved-view');
      await expect(emptyView).toBeVisible();
      await expect(emptyView).toContainText('All Resumes Successfully Matched!');
    });

    test('NEG-5: Displays error alert when unmatched resume resolution fails on server', async ({ page }) => {
      await page.route('**/api/bulk-import/batches/**', async (route) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ results: [] }) });
      });
      await page.route('**/api/bulk-import/resume/batches/**', async (route) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ results: [] }) });
      });
      await page.route('**/api/bulk-import/resume/unmatched/**', async (route) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ results: MOCK_UNMATCHED_RESUMES }) });
      });
      await page.route('**/api/candidates/**', async (route) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ results: MOCK_CANDIDATES }) });
      });

      // Mock resolve endpoint 500 error
      await page.route('**/api/bulk-import/resume/unmatched/101/resolve/**', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Candidate profile locked by another process.' }),
        });
      });

      await page.goto('/recruiter-workflow-bulk-import');
      await page.locator('.tab').filter({ hasText: 'Unmatched Resumes' }).click();
      await page.locator('.resolve-action-btn').click();

      const modal = page.locator('.resolve-modal');
      await modal.locator('.candidate-pick-item').first().click();
      await modal.locator('.modal-footer .btn.primary').click();

      // Verify Error Alert modal appears
      const alertMsg = page.locator('.alert-message');
      await expect(alertMsg).toBeVisible();
      await expect(alertMsg).toContainText('Failed to resolve resume');
    });

    test('NEG-6: AuthGuard blocks access and redirects to /login when user is not authenticated', async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.clear();
      });

      await page.goto('/recruiter-workflow-bulk-import');
      await expect(page).toHaveURL(/.*login.*/);
    });

    test('NEG-7: AuthGuard redirects candidate role to /candidate-home due to role mismatch', async ({ page }) => {
      await page.addInitScript(({ jwt }) => {
        localStorage.setItem('jwtToken', jwt);
        localStorage.setItem('userType', 'candidate');
        localStorage.setItem('refreshToken', 'valid-refresh-token');
      }, { jwt: VALID_MOCK_JWT });

      await page.goto('/recruiter-workflow-bulk-import');
      await expect(page).toHaveURL(/.*candidate-home.*/);
    });
  });
});
