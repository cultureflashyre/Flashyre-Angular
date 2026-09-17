import { test, expect } from './auth-helpers';

/**
 * ══════════════════════════════════════════════════════════════════════════════
 * FLASHYRE PLAYWRIGHT E2E SUITE 3: RECRUITER & HIRING WORKFLOW PAGES
 * ══════════════════════════════════════════════════════════════════════════════
 * 
 * Verifies all recruiter and hiring manager workflows with valid Recruiter JWT
 * token injection and role claims (`data: { roles: ['admin', 'recruiter'] }`).
 * 
 * Route Coverage:
 * 1.  /job-post-list                             -> Recruiter Job Listings & Pipeline
 * 2.  /recruiter-view-job-applications-1/:jobId  -> Job Applicant Tracking & Interview Stages
 * 3.  /job-posting-workflow                      -> Modern 3-Step Job Creation Wizard
 * 4.  /create-job                                -> Admin/Recruiter Job Creation Step 1
 * 5.  /create-job/:id                            -> Job Edit Mode with Route Param
 * 6.  /create-job-step2                          -> Assessment Configuration Step 2
 * 7.  /create-job-step3                          -> AI Question Generator & Skills Step 3
 * 8.  /create-job-step4                          -> Interview Rounds & Schedule Step 4
 * 9.  /recruiter-workflow-candidate              -> Recruiter Candidate Sourcing & DB
 * 10. /collection-forms                          -> Collection Form Builder & Public Forms
 * 11. /recruiter-workflow-bulk-import            -> Dual Bulk Resume & Tracker Ingestion
 * 12. /job-matching-score                        -> Semantic AI Candidate Matching Scores
 */

test.describe('Suite 3: Recruiter & Hiring Workflow Protected Pages', () => {

  // 1. Recruiter Job Listings & Pipeline
  test('REC-PAGE-01: Job Post List (/job-post-list) renders job management tabs and sidebar', async ({ recruiterPage }) => {
    await recruiterPage.goto('/job-post-list');

    const sidebar = recruiterPage.locator('app-recruiter-sidebar');
    await expect(sidebar).toBeVisible({ timeout: 15000 });

    const pageHeading = recruiterPage.locator('.page-head h1');
    await expect(pageHeading).toBeVisible();
    await expect(pageHeading).toHaveText('Jobs Posted');

    // Verify tabs
    const tabs = recruiterPage.locator('.tabs');
    await expect(tabs).toBeVisible();
    await expect(tabs).toContainText('Live');

    // Verify Create Job Post CTA
    const createBtn = recruiterPage.locator('button.btn.primary').filter({ hasText: 'Create Job Post' });
    await expect(createBtn).toBeVisible();
  });

  // 2. Job Applicant Tracking & Interview Stages (Dynamic route :jobId)
  test('REC-PAGE-02: Job Applications View (/recruiter-view-job-applications-1/:jobId) loads stages and applicant layout', async ({ recruiterPage }) => {
    await recruiterPage.goto('/recruiter-view-job-applications-1/42');

    const appLayout = recruiterPage.locator('.app');
    await expect(appLayout).toBeVisible({ timeout: 15000 });

    const topbar = recruiterPage.locator('.topbar');
    await expect(topbar).toBeVisible();

    await expect(recruiterPage).toHaveURL(/\/recruiter-view-job-applications-1\/42/);
  });

  // 3. Modern 3-Step Job Posting Workflow
  test('REC-PAGE-03: Job Posting Workflow (/job-posting-workflow) loads stepper and card container', async ({ recruiterPage }) => {
    await recruiterPage.goto('/job-posting-workflow');

    const workflowContainer = recruiterPage.locator('.workflow-container');
    await expect(workflowContainer).toBeVisible({ timeout: 15000 });

    const contentCard = recruiterPage.locator('.workflow-content-card');
    await expect(contentCard).toBeVisible();

    const progressBar = recruiterPage.locator('app-progress-bar');
    await expect(progressBar).toBeVisible();
  });

  // 4. Job Creation Step 1
  test('REC-PAGE-04: Create Job Step 1 (/create-job) renders creation form and navbar', async ({ recruiterPage }) => {
    await recruiterPage.goto('/create-job');

    const mainContainer = recruiterPage.locator('#create-job-post-main-container');
    await expect(mainContainer).toBeVisible({ timeout: 15000 });

    const jobForm = recruiterPage.locator('form');
    await expect(jobForm).toBeVisible();

    const navbar = recruiterPage.locator('recruiter-workflow-navbar');
    await expect(navbar).toBeVisible();
  });

  // 5. Job Creation Edit Mode (Dynamic route :id)
  test('REC-PAGE-05: Create Job Edit Mode (/create-job/:id) resolves job ID for editing', async ({ recruiterPage }) => {
    await recruiterPage.goto('/create-job/101');

    const mainContainer = recruiterPage.locator('#create-job-post-main-container');
    await expect(mainContainer).toBeVisible({ timeout: 15000 });

    await expect(recruiterPage).toHaveURL(/\/create-job\/101/);
  });

  // 6. Job Creation Step 2
  test('REC-PAGE-06: Create Job Step 2 (/create-job-step2) renders assessment configuration layout', async ({ recruiterPage }) => {
    await recruiterPage.goto('/create-job-step2');

    const pageContainer = recruiterPage.locator('.page-container');
    await expect(pageContainer).toBeVisible({ timeout: 15000 });

    const card = recruiterPage.locator('.main-content-card');
    await expect(card).toBeVisible();
  });

  // 7. Job Creation Step 3
  test('REC-PAGE-07: Create Job Step 3 (/create-job-step3) renders questions generator interface', async ({ recruiterPage }) => {
    await recruiterPage.goto('/create-job-step3');

    const navbar = recruiterPage.locator('recruiter-workflow-navbar');
    await expect(navbar).toBeVisible({ timeout: 15000 });

    const step3Card = recruiterPage.locator('.main-content-card-step3, .admin-create-job-step3-container10, #assessment-container');
    await expect(step3Card.first()).toBeVisible({ timeout: 15000 });
  });

  // 8. Job Creation Step 4
  test('REC-PAGE-08: Create Job Step 4 (/create-job-step4) renders interview rounds configuration', async ({ recruiterPage }) => {
    await recruiterPage.goto('/create-job-step4');

    const container = recruiterPage.locator('.admin-create-job-step4-container1');
    await expect(container).toBeVisible({ timeout: 15000 });

    const interviewContainer = recruiterPage.locator('#interview-container');
    await expect(interviewContainer).toBeVisible();
  });

  // 9. Recruiter Candidate Database & Sourcing
  test('REC-PAGE-09: Recruiter Candidate Database (/recruiter-workflow-candidate) displays stats and candidate controls', async ({ recruiterPage }) => {
    await recruiterPage.goto('/recruiter-workflow-candidate');

    const title = recruiterPage.locator('.page-title');
    await expect(title).toBeVisible({ timeout: 15000 });
    await expect(title).toHaveText('Candidate Database');

    const stats = recruiterPage.locator('.stats');
    await expect(stats).toBeVisible();
    await expect(stats).toContainText('Total Candidates');

    const addBtn = recruiterPage.locator('button.btn.primary').filter({ hasText: 'Add Candidate' });
    await expect(addBtn).toBeVisible();
  });

  // 10. Collection Forms Builder
  test('REC-PAGE-10: Collection Forms (/collection-forms) loads builder and templates overview', async ({ recruiterPage }) => {
    await recruiterPage.goto('/collection-forms');

    const navbar = recruiterPage.locator('recruiter-workflow-navbar');
    await expect(navbar).toBeVisible({ timeout: 15000 });

    const title = recruiterPage.locator('.page-title');
    await expect(title).toBeVisible();
    await expect(title).toHaveText('Collection Forms');

    const statRow = recruiterPage.locator('.stat-row');
    await expect(statRow).toBeVisible();

    const newFormBtn = recruiterPage.locator('button.btn-primary').filter({ hasText: 'New Form' });
    await expect(newFormBtn).toBeVisible();

    await expect(recruiterPage).toHaveURL(/\/collection-forms/);
  });

  // 11. Recruiter Workflow Bulk Import
  test('REC-PAGE-11: Bulk Import (/recruiter-workflow-bulk-import) renders dual dropzone areas', async ({ recruiterPage }) => {
    await recruiterPage.goto('/recruiter-workflow-bulk-import');

    const sidebar = recruiterPage.locator('app-recruiter-sidebar');
    await expect(sidebar).toBeVisible({ timeout: 15000 });

    const title = recruiterPage.locator('.page-title');
    await expect(title).toBeVisible();
    await expect(title).toHaveText('Bulk Ingestion & AI Resume Matcher');

    const newIngestionBtn = recruiterPage.locator('button.btn.primary').filter({ hasText: 'New Ingestion' });
    await expect(newIngestionBtn).toBeVisible();

    const sweeperBtn = recruiterPage.locator('button.btn.good').filter({ hasText: 'Sync Sweeper' });
    await expect(sweeperBtn).toBeVisible();

    await expect(recruiterPage).toHaveURL(/\/recruiter-workflow-bulk-import/);
  });

  // 12. Semantic AI Job Matching Scores
  test('REC-PAGE-12: Job Matching Scores (/job-matching-score) renders AI analysis view and rankings', async ({ recruiterPage }) => {
    await recruiterPage.goto('/job-matching-score');

    const sidebar = recruiterPage.locator('app-recruiter-sidebar');
    await expect(sidebar).toBeVisible({ timeout: 15000 });

    const head = recruiterPage.locator('.page-head h1');
    await expect(head).toBeVisible();
    await expect(head).toHaveText('Job Matching Scores');
  });

  // 13. Candidate Document Upload & Memory Limit Validation (User Request: PDF/Word document acceptance & 5MB memory limit)
  test('REC-PAGE-13: Candidate Sourcing Modal — Accepts PDF/Word documents and rejects files exceeding 5MB memory limit', async ({ recruiterPage }) => {
    await recruiterPage.goto('/recruiter-workflow-candidate');

    const addBtn = recruiterPage.locator('button.btn.primary').filter({ hasText: 'Add Candidate' });
    await expect(addBtn).toBeVisible({ timeout: 15000 });
    await addBtn.click();

    // Verify modal file input accepts .pdf, .doc, .docx
    const fileInput = recruiterPage.locator('input[type="file"][accept*=".pdf"]');
    await expect(fileInput).toBeAttached();
    const acceptAttr = await fileInput.getAttribute('accept');
    expect(acceptAttr).toContain('.pdf');
    expect(acceptAttr).toContain('.doc');
    expect(acceptAttr).toContain('.docx');

    // Test memory limit rejection (> 5MB)
    let dialogTriggered = false;
    let dialogMessage = '';
    recruiterPage.once('dialog', async (dialog) => {
      dialogTriggered = true;
      dialogMessage = dialog.message();
      await dialog.accept();
    });

    // Create a 5.5 MB dummy buffer
    const oversizedBuffer = Buffer.alloc(5.5 * 1024 * 1024, 'a');
    await fileInput.setInputFiles({
      name: 'large_resume.pdf',
      mimeType: 'application/pdf',
      buffer: oversizedBuffer,
    });

    // Verify rejection dialog was triggered with 5 MB message
    expect(dialogTriggered).toBe(true);
    expect(dialogMessage).toContain('File is too large. Max 5 MB.');
  });

});
