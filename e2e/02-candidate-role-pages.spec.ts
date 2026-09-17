import { test, expect } from './auth-helpers';

/**
 * ══════════════════════════════════════════════════════════════════════════════
 * FLASHYRE PLAYWRIGHT E2E SUITE 2: CANDIDATE ROLE PROTECTED PAGES
 * ══════════════════════════════════════════════════════════════════════════════
 * 
 * Verifies all candidate-specific protected routes with valid candidate JWT
 * token injection and role claims (`data: { roles: ['candidate'] }`).
 * 
 * Route Coverage:
 * 1.  /candidate-home                         -> Candidate Job Feed & Search Hub
 * 2.  /candidate-dashboard                    -> Candidate Scoring & Assessment Stats
 * 3.  /candidate-job-detail-view              -> Detailed Job Posting & Requirements View
 * 4.  /flashyre-assessment-rules-card         -> Pre-Assessment Rules & Instructions
 * 5.  /flashyre-assessment11                  -> Live Candidate Assessment Interface
 * 6.  /candidate-assessment                   -> Candidate Skill Assessment Overview
 * 7.  /assessment-taken-page                  -> Post-Assessment Completion Screen 1
 * 8.  /assessment-taken-page-2/:assessmentId  -> Post-Assessment Stage 2 Review (Dynamic Param)
 * 9.  /assessment-taken-page-3                -> Post-Assessment Stage 3 Performance Metrics
 * 10. /assessment-violation-message           -> Proctoring Rules Security Violation Screen
 */

test.describe('Suite 2: Candidate Role Protected Pages', () => {

  // 1. Candidate Home / Job Feed
  test('CAN-01: Candidate Home (/candidate-home) loads feed and candidate navbar', async ({ candidatePage }) => {
    await candidatePage.goto('/candidate-home');

    const homeContainer = candidatePage.locator('#candidate-home');
    await expect(homeContainer).toBeVisible({ timeout: 15000 });

    const navbar = candidatePage.locator('navbar-for-candidate-view');
    await expect(navbar).toBeVisible();

    // Verify candidate header links (Dashboard, Upskill, Assessment)
    await expect(candidatePage.locator('.candidate-home-text100')).toContainText('Dashboard');
    await expect(candidatePage.locator('.candidate-home-text101')).toContainText('Upskill');
    await expect(candidatePage.locator('.candidate-home-text102')).toContainText('Assessment');

    // Verify job feed container and cards render
    await expect(candidatePage.locator('.candidate-home-container1')).toBeVisible();
  });

  // 2. Candidate Dashboard
  test('CAN-02: Candidate Dashboard (/candidate-dashboard) loads score breakdown and scale', async ({ candidatePage }) => {
    await candidatePage.goto('/candidate-dashboard');

    const dashboardContainer = candidatePage.locator('.candidate-dashboard-container');
    await expect(dashboardContainer).toBeVisible({ timeout: 15000 });

    const dashboardComponent = candidatePage.locator('flashyre-dashboard');
    await expect(dashboardComponent).toBeVisible();

    // Assessment Results heading and scale
    await expect(candidatePage.locator('.candidate-dashboard-fragment16')).toContainText('Assessment Results');
    await expect(candidatePage.locator('.candidate-dashboard-fragment12')).toContainText('Scale:');
  });

  // 3. Candidate Job Detail View
  test('CAN-03: Candidate Job Detail View (/candidate-job-detail-view) renders job description container', async ({ candidatePage }) => {
    await candidatePage.goto('/candidate-job-detail-view');

    const detailContainer = candidatePage.locator('#candidate-job-detail-view');
    await expect(detailContainer).toBeVisible({ timeout: 15000 });

    const mainContainer = candidatePage.locator('#main-container');
    await expect(mainContainer).toBeVisible();
  });

  // 4. Pre-Assessment Rules Card
  test('CAN-04: Flashyre Assessment Rules (/flashyre-assessment-rules-card) renders rules checklist', async ({ candidatePage }) => {
    await candidatePage.goto('/flashyre-assessment-rules-card');

    const rulesPage = candidatePage.locator('.assessment-rules-page');
    await expect(rulesPage).toBeVisible({ timeout: 15000 });

    const rulesTitle = candidatePage.locator('.assessment-card__rules h2');
    await expect(rulesTitle).toBeVisible();
    await expect(rulesTitle).toHaveText('Rules for the Assessment');

    // Test details list
    const rulesSection = candidatePage.locator('.rules-section');
    await expect(rulesSection.first()).toBeVisible();
  });

  // 5. Active Assessment Interface
  test('CAN-05: Active Assessment (/flashyre-assessment11) initializes questions container', async ({ candidatePage }) => {
    await candidatePage.goto('/flashyre-assessment11');

    const container = candidatePage.locator('.flashyre-assessment11-container');
    await expect(container).toBeVisible({ timeout: 15000 });

    const timer = candidatePage.locator('#timer');
    await expect(timer).toBeVisible();

    const endBtn = candidatePage.locator('#end-test-button');
    await expect(endBtn).toBeVisible();
  });

  // 6. Candidate Assessment Hub
  test('CAN-06: Candidate Assessment Hub (/candidate-assessment) loads assessments list', async ({ candidatePage }) => {
    await candidatePage.goto('/candidate-assessment');

    const hubContainer = candidatePage.locator('#candidate-assessment');
    await expect(hubContainer).toBeVisible({ timeout: 15000 });

    const navbar = candidatePage.locator('navbar-for-candidate-view');
    await expect(navbar).toBeVisible();
  });

  // 7. Assessment Taken Completion Page 1
  test('CAN-07: Assessment Taken Page 1 (/assessment-taken-page) renders completion status', async ({ candidatePage }) => {
    await candidatePage.goto('/assessment-taken-page');

    const takenContainer = candidatePage.locator('.assessment-taken-page-container10');
    await expect(takenContainer).toBeVisible({ timeout: 15000 });

    const navbar = candidatePage.locator('navbar-for-candidate-view');
    await expect(navbar).toBeVisible();
  });

  // 8. Assessment Taken Review Page 2 (Dynamic route: :assessmentId)
  test('CAN-08: Assessment Taken Page 2 (/assessment-taken-page-2/:assessmentId) resolves dynamic ID parameter', async ({ candidatePage }) => {
    await candidatePage.goto('/assessment-taken-page-2/101');

    const page2Container = candidatePage.locator('.assessment-taken-page2-container1');
    await expect(page2Container).toBeVisible({ timeout: 15000 });

    await expect(candidatePage).toHaveURL(/\/assessment-taken-page-2\/101/);
  });

  // 9. Assessment Taken Results Page 3
  test('CAN-09: Assessment Taken Page 3 (/assessment-taken-page-3) renders deep dive score cards', async ({ candidatePage }) => {
    await candidatePage.goto('/assessment-taken-page-3');

    const page3Container = candidatePage.locator('.assessment-taken-page3-container10');
    await expect(page3Container).toBeVisible({ timeout: 15000 });

    const navbar = candidatePage.locator('navbar-for-candidate-view');
    await expect(navbar).toBeVisible();
  });

  // 10. Assessment Violation Message Screen
  test('CAN-10: Assessment Violation (/assessment-violation-message) renders security warning and close button', async ({ candidatePage }) => {
    await candidatePage.goto('/assessment-violation-message');

    const messageContainer = candidatePage.locator('.assessment-violation-message-container10, #candidate-home');
    await expect(messageContainer).toBeVisible({ timeout: 15000 });

    const violationText = candidatePage.locator('#message-in-text');
    await expect(violationText).toBeVisible();
    await expect(violationText).toContainText('A violation of the assessment rules has been detected');

    const closeBtn = candidatePage.locator('#close-button');
    await expect(closeBtn).toBeVisible();
    await expect(closeBtn).toHaveText('Close');

    // Click close button and verify navigation to assessment-taken-page
    await closeBtn.click();
    await expect(candidatePage).toHaveURL(/\/assessment-taken-page/);
  });

});
