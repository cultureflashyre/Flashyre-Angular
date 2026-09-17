import { test, expect } from './auth-helpers';

/**
 * ══════════════════════════════════════════════════════════════════════════════
 * FLASHYRE PLAYWRIGHT E2E SUITE 4: ADMIN & MANAGEMENT / CLIENT PAGES
 * ══════════════════════════════════════════════════════════════════════════════
 * 
 * Verifies all Admin, Super Admin, and Corporate Client / Management pages with
 * valid JWT tokens, superuser state, and client role permissions.
 * 
 * Route Coverage:
 * 1.  /admin-page1                               -> Admin Control Center & CV Uploader
 * 2.  /recruiter-workflow-client                 -> Enterprise Client Management (Admin Only)
 * 3.  /recruiter-super-admin-analytical-module   -> Super Admin Analytical BI Module
 * 4.  /admin-candidate-scores                    -> Candidate Scores Review Center
 * 5.  /recruiter-workflow-requirement            -> Client & Recruiter Requirement Pipeline
 * 6.  /recruiter-workflow-ats/:id                -> Multi-Role ATS Pipeline (Dynamic Param)
 */

test.describe('Suite 4: Admin & Corporate Client / Management Pages', () => {

  // 1. Admin Control Center & CV Uploader
  test('ADM-01: Admin Control Page (/admin-page1) renders admin navbar and CV uploader', async ({ adminPage }) => {
    await adminPage.goto('/admin-page1');

    const adminNavbar = adminPage.locator('navbar-for-admin-view');
    await expect(adminNavbar).toBeVisible({ timeout: 15000 });

    const hiddenCvInput = adminPage.locator('input[type="file"][accept*=".pdf"]');
    await expect(hiddenCvInput.first()).toBeAttached();
  });

  // 2. Enterprise Client Management (Admin Only)
  test('ADM-02: Client Management (/recruiter-workflow-client) renders client portal', async ({ adminPage }) => {
    await adminPage.goto('/recruiter-workflow-client');

    const clientContainer = adminPage.locator('.recruiter-workflow-client-container10');
    await expect(clientContainer).toBeVisible({ timeout: 15000 });

    const navbar = adminPage.locator('recruiter-workflow-navbar');
    await expect(navbar).toBeVisible();
  });

  // 3. Super Admin Analytical BI Module (Requires Super Admin Flag)
  test('ADM-03: Super Admin Analytical Module (/recruiter-super-admin-analytical-module) loads for Super Admin', async ({ superAdminPage }) => {
    await superAdminPage.goto('/recruiter-super-admin-analytical-module');

    const analyticsContainer = superAdminPage.locator('.recruiter-super-admin-analytical-module-container10');
    await expect(analyticsContainer).toBeVisible({ timeout: 15000 });

    const navbar = superAdminPage.locator('recruiter-workflow-navbar');
    await expect(navbar).toBeVisible();

    await expect(superAdminPage).toHaveURL(/\/recruiter-super-admin-analytical-module/);
  });

  // 4. Candidate Scores Review Center
  test('ADM-04: Admin Candidate Scores (/admin-candidate-scores) renders score matrix', async ({ adminPage }) => {
    await adminPage.goto('/admin-candidate-scores');

    const scoresComponent = adminPage.locator('#admin-page-scores-component');
    await expect(scoresComponent).toBeVisible({ timeout: 15000 });

    const adminNavbar = adminPage.locator('navbar-for-admin-view');
    await expect(adminNavbar).toBeVisible();

    await expect(adminPage).toHaveURL(/\/admin-candidate-scores/);
  });

  // 5. Client & Recruiter Requirement Pipeline
  test('MGMT-01: Requirements Pipeline (/recruiter-workflow-requirement) renders for Client / Management', async ({ clientPage }) => {
    await clientPage.goto('/recruiter-workflow-requirement');

    const sidebar = clientPage.locator('app-recruiter-sidebar');
    await expect(sidebar).toBeVisible({ timeout: 15000 });

    const heading = clientPage.locator('.page-head h1');
    await expect(heading).toBeVisible();
    await expect(heading).toHaveText('Job Requirements');

    const stats = clientPage.locator('.stats');
    await expect(stats).toBeVisible();
    await expect(stats).toContainText('Total Requirements');
  });

  // 6. Multi-Role ATS Pipeline (Dynamic route :id)
  test('MGMT-02: ATS Workflow Pipeline (/recruiter-workflow-ats/:id) loads pipeline stages for Client', async ({ clientPage }) => {
    await clientPage.goto('/recruiter-workflow-ats/99');

    const atsWrapper = clientPage.locator('.ats-layout-wrapper');
    await expect(atsWrapper).toBeVisible({ timeout: 15000 });

    const atsNavbar = clientPage.locator('.ats-navbar-container');
    await expect(atsNavbar).toBeVisible();

    const addCandBtn = clientPage.locator('button.add-candidate-btn');
    await expect(addCandBtn).toBeVisible();

    await expect(clientPage).toHaveURL(/\/recruiter-workflow-ats\/99/);
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 7. ADMIN DUAL-ROLE ROUTE ACCESS VERIFICATIONS
  // ════════════════════════════════════════════════════════════════════════════
  test('ADM-05: Admin is granted full access to Job Postings (/job-post-list)', async ({ adminPage }) => {
    await adminPage.goto('/job-post-list');

    const sidebar = adminPage.locator('app-recruiter-sidebar');
    await expect(sidebar).toBeVisible({ timeout: 15000 });

    const head = adminPage.locator('.page-head h1');
    await expect(head).toBeVisible();
    await expect(head).toHaveText('Jobs Posted');
  });

  test('ADM-06: Admin is granted full access to Job Creation (/create-job)', async ({ adminPage }) => {
    await adminPage.goto('/create-job');

    const mainContainer = adminPage.locator('#create-job-post-main-container');
    await expect(mainContainer).toBeVisible({ timeout: 15000 });

    const jobForm = adminPage.locator('form');
    await expect(jobForm).toBeVisible();
  });

  test('ADM-07: Admin is granted full access to Candidate Sourcing (/recruiter-workflow-candidate)', async ({ adminPage }) => {
    await adminPage.goto('/recruiter-workflow-candidate');

    const title = adminPage.locator('.page-title');
    await expect(title).toBeVisible({ timeout: 15000 });
    await expect(title).toHaveText('Candidate Database');
  });

  test('ADM-08: Admin is granted full access to Collection Forms (/collection-forms)', async ({ adminPage }) => {
    await adminPage.goto('/collection-forms');

    const title = adminPage.locator('.page-title');
    await expect(title).toBeVisible({ timeout: 15000 });
    await expect(title).toHaveText('Collection Forms');
  });

  test('ADM-09: Admin is granted full access to Bulk Ingestion (/recruiter-workflow-bulk-import)', async ({ adminPage }) => {
    await adminPage.goto('/recruiter-workflow-bulk-import');

    const sidebar = adminPage.locator('app-recruiter-sidebar');
    await expect(sidebar).toBeVisible({ timeout: 15000 });

    const title = adminPage.locator('.page-title');
    await expect(title).toBeVisible();
    await expect(title).toHaveText('Bulk Ingestion & AI Resume Matcher');
  });

  test('ADM-10: Admin is granted full access to Job Matching Scores (/job-matching-score)', async ({ adminPage }) => {
    await adminPage.goto('/job-matching-score');

    const sidebar = adminPage.locator('app-recruiter-sidebar');
    await expect(sidebar).toBeVisible({ timeout: 15000 });

    const head = adminPage.locator('.page-head h1');
    await expect(head).toBeVisible();
    await expect(head).toHaveText('Job Matching Scores');
  });

  test('ADM-11: Admin is granted full access to Modern Job Posting Workflow (/job-posting-workflow)', async ({ adminPage }) => {
    await adminPage.goto('/job-posting-workflow');

    const workflowContainer = adminPage.locator('.workflow-container');
    await expect(workflowContainer).toBeVisible({ timeout: 15000 });

    const contentCard = adminPage.locator('.workflow-content-card');
    await expect(contentCard).toBeVisible();
  });

});
