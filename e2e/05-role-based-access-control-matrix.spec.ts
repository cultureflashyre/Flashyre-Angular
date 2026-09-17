import { test, expect } from './auth-helpers';
import { setupAuthenticatedSession, generateMockJwt } from './auth-helpers';

/**
 * ══════════════════════════════════════════════════════════════════════════════
 * FLASHYRE PLAYWRIGHT E2E SUITE 5: ROLE-BASED ACCESS CONTROL (RBAC) MATRIX
 * ══════════════════════════════════════════════════════════════════════════════
 * 
 * Exhaustively tests authGuard across all routes in app.routes.ts to guarantee:
 * 1. Unauthenticated users are redirected to /login with returnUrl query parameter.
 * 2. Candidates cannot access Recruiter, Admin, or Super Admin routes.
 * 3. Recruiters cannot access Candidate, Admin-only, or Super Admin routes.
 * 4. Admins cannot access Candidate-specific protected routes.
 * 5. Clients / Management cannot access Recruiter-only, Candidate, or Admin-only routes.
 * 6. Standard Admins without superuser privileges are blocked from Super Admin routes.
 * 7. Super Admins have unrestricted access to Super Admin analytics.
 * 8. Expired or corrupted JWT tokens without refresh tokens are rejected.
 * 9. Expired JWT tokens WITH valid refresh tokens are permitted.
 */

test.describe('Suite 5: Role-Based Access Control (RBAC) & Redirection Matrix', () => {

  // ════════════════════════════════════════════════════════════════════════════
  // 1. UNAUTHENTICATED VISITOR ATTEMPTS (Strict /login Redirect with returnUrl)
  // ════════════════════════════════════════════════════════════════════════════
  test.describe('1. Unauthenticated Access Protection across All Protected Routes', () => {

    const protectedRoutes = [
      { path: '/candidate-home', name: 'Candidate Home' },
      { path: '/candidate-dashboard', name: 'Candidate Dashboard' },
      { path: '/candidate-job-detail-view', name: 'Candidate Job Details' },
      { path: '/flashyre-assessment-rules-card', name: 'Assessment Rules Card' },
      { path: '/flashyre-assessment11', name: 'Active Assessment' },
      { path: '/candidate-assessment', name: 'Candidate Assessment Hub' },
      { path: '/assessment-taken-page', name: 'Assessment Taken Page 1' },
      { path: '/assessment-taken-page-2/101', name: 'Assessment Taken Page 2' },
      { path: '/assessment-taken-page-3', name: 'Assessment Taken Page 3' },
      { path: '/assessment-violation-message', name: 'Assessment Violation' },
      { path: '/job-post-list', name: 'Recruiter Jobs Posted' },
      { path: '/recruiter-view-job-applications-1/42', name: 'Job Applications View' },
      { path: '/job-posting-workflow', name: 'Job Posting Stepper Workflow' },
      { path: '/create-job', name: 'Create Job Step 1' },
      { path: '/create-job/101', name: 'Edit Job Mode' },
      { path: '/create-job-step2', name: 'Create Job Step 2' },
      { path: '/create-job-step3', name: 'Create Job Step 3' },
      { path: '/create-job-step4', name: 'Create Job Step 4' },
      { path: '/recruiter-workflow-candidate', name: 'Candidate Database' },
      { path: '/collection-forms', name: 'Collection Forms Builder' },
      { path: '/recruiter-workflow-requirement', name: 'Job Requirements' },
      { path: '/recruiter-workflow-client', name: 'Enterprise Client Management' },
      { path: '/recruiter-super-admin-analytical-module', name: 'Super Admin Analytics' },
      { path: '/recruiter-workflow-ats/99', name: 'ATS Workflow Pipeline' },
      { path: '/recruiter-workflow-bulk-import', name: 'Bulk Import Hub' },
      { path: '/job-matching-score', name: 'AI Job Matching Scores' },
      { path: '/admin-page1', name: 'Admin Control Center' },
      { path: '/admin-candidate-scores', name: 'Admin Candidate Scores' },
    ];

    for (const route of protectedRoutes) {
      test(`RBAC-UNAUTH: Unauthed access to ${route.name} (${route.path}) -> redirects to /login`, async ({ page }) => {
        await page.goto(route.path);
        const encodedUrl = encodeURIComponent(route.path);
        await expect(page).toHaveURL(new RegExp(`/login\\?returnUrl=${encodedUrl}`));
      });
    }
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 2. CANDIDATE ROLE BOUNDARY ENFORCEMENT
  // ════════════════════════════════════════════════════════════════════════════
  test.describe('2. Candidate Role Restrictions', () => {

    test('RBAC-CAND-01: Candidate is blocked from Recruiter Candidate Database -> redirected to /candidate-home', async ({ candidatePage }) => {
      await candidatePage.goto('/recruiter-workflow-candidate');
      await expect(candidatePage).toHaveURL(/\/candidate-home/);
    });

    test('RBAC-CAND-02: Candidate is blocked from Jobs Posted list -> redirected to /candidate-home', async ({ candidatePage }) => {
      await candidatePage.goto('/job-post-list');
      await expect(candidatePage).toHaveURL(/\/candidate-home/);
    });

    test('RBAC-CAND-03: Candidate is blocked from Create Job post -> redirected to /candidate-home', async ({ candidatePage }) => {
      await candidatePage.goto('/create-job');
      await expect(candidatePage).toHaveURL(/\/candidate-home/);
    });

    test('RBAC-CAND-04: Candidate is blocked from Admin Control Center (/admin-page1) -> redirected to /candidate-home', async ({ candidatePage }) => {
      await candidatePage.goto('/admin-page1');
      await expect(candidatePage).toHaveURL(/\/candidate-home/);
    });

    test('RBAC-CAND-05: Candidate is blocked from Client Management (/recruiter-workflow-client) -> redirected to /candidate-home', async ({ candidatePage }) => {
      await candidatePage.goto('/recruiter-workflow-client');
      await expect(candidatePage).toHaveURL(/\/candidate-home/);
    });

    test('RBAC-CAND-06: Candidate is blocked from Super Admin Module -> redirected to /candidate-home', async ({ candidatePage }) => {
      await candidatePage.goto('/recruiter-super-admin-analytical-module');
      await expect(candidatePage).toHaveURL(/\/candidate-home/);
    });

    test('RBAC-CAND-07: Candidate is blocked from Collection Forms -> redirected to /candidate-home', async ({ candidatePage }) => {
      await candidatePage.goto('/collection-forms');
      await expect(candidatePage).toHaveURL(/\/candidate-home/);
    });

    test('RBAC-CAND-08: Candidate is blocked from Job Requirements -> redirected to /candidate-home', async ({ candidatePage }) => {
      await candidatePage.goto('/recruiter-workflow-requirement');
      await expect(candidatePage).toHaveURL(/\/candidate-home/);
    });

    test('RBAC-CAND-09: Candidate is blocked from Job Matching Scores -> redirected to /candidate-home', async ({ candidatePage }) => {
      await candidatePage.goto('/job-matching-score');
      await expect(candidatePage).toHaveURL(/\/candidate-home/);
    });

    test('RBAC-CAND-10: Candidate is blocked from Bulk Import -> redirected to /candidate-home', async ({ candidatePage }) => {
      await candidatePage.goto('/recruiter-workflow-bulk-import');
      await expect(candidatePage).toHaveURL(/\/candidate-home/);
    });

    test('RBAC-CAND-11: Candidate is blocked from Create Job Step 2 (/create-job-step2) -> redirected to /candidate-home', async ({ candidatePage }) => {
      await candidatePage.goto('/create-job-step2');
      await expect(candidatePage).toHaveURL(/\/candidate-home/);
    });

    test('RBAC-CAND-12: Candidate is blocked from Create Job Step 3 (/create-job-step3) -> redirected to /candidate-home', async ({ candidatePage }) => {
      await candidatePage.goto('/create-job-step3');
      await expect(candidatePage).toHaveURL(/\/candidate-home/);
    });

    test('RBAC-CAND-13: Candidate is blocked from Create Job Step 4 (/create-job-step4) -> redirected to /candidate-home', async ({ candidatePage }) => {
      await candidatePage.goto('/create-job-step4');
      await expect(candidatePage).toHaveURL(/\/candidate-home/);
    });

    test('RBAC-CAND-14: Candidate is blocked from Admin Candidate Scores (/admin-candidate-scores) -> redirected to /candidate-home', async ({ candidatePage }) => {
      await candidatePage.goto('/admin-candidate-scores');
      await expect(candidatePage).toHaveURL(/\/candidate-home/);
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 3. RECRUITER ROLE BOUNDARY ENFORCEMENT
  // ════════════════════════════════════════════════════════════════════════════
  test.describe('3. Recruiter Role Restrictions', () => {

    test('RBAC-REC-01: Recruiter is blocked from Candidate Home -> redirected to /recruiter-workflow-candidate', async ({ recruiterPage }) => {
      await recruiterPage.goto('/candidate-home');
      await expect(recruiterPage).toHaveURL(/\/recruiter-workflow-candidate/);
    });

    test('RBAC-REC-02: Recruiter is blocked from Candidate Dashboard -> redirected to /recruiter-workflow-candidate', async ({ recruiterPage }) => {
      await recruiterPage.goto('/candidate-dashboard');
      await expect(recruiterPage).toHaveURL(/\/recruiter-workflow-candidate/);
    });

    test('RBAC-REC-03: Recruiter is blocked from Assessment Rules Card -> redirected to /recruiter-workflow-candidate', async ({ recruiterPage }) => {
      await recruiterPage.goto('/flashyre-assessment-rules-card');
      await expect(recruiterPage).toHaveURL(/\/recruiter-workflow-candidate/);
    });

    test('RBAC-REC-04: Recruiter is blocked from Admin-Only Control Center (/admin-page1) -> redirected to /recruiter-workflow-candidate', async ({ recruiterPage }) => {
      await recruiterPage.goto('/admin-page1');
      await expect(recruiterPage).toHaveURL(/\/recruiter-workflow-candidate/);
    });

    test('RBAC-REC-05: Recruiter is blocked from Admin-Only Client Management (/recruiter-workflow-client) -> redirected to /recruiter-workflow-candidate', async ({ recruiterPage }) => {
      await recruiterPage.goto('/recruiter-workflow-client');
      await expect(recruiterPage).toHaveURL(/\/recruiter-workflow-candidate/);
    });

    test('RBAC-REC-06: Recruiter is blocked from Super Admin Analytical Module -> redirected to /recruiter-workflow-candidate', async ({ recruiterPage }) => {
      await recruiterPage.goto('/recruiter-super-admin-analytical-module');
      await expect(recruiterPage).toHaveURL(/\/recruiter-workflow-candidate/);
    });

    test('RBAC-REC-07: Recruiter is blocked from Candidate Assessment Hub -> redirected to /recruiter-workflow-candidate', async ({ recruiterPage }) => {
      await recruiterPage.goto('/candidate-assessment');
      await expect(recruiterPage).toHaveURL(/\/recruiter-workflow-candidate/);
    });

    test('RBAC-REC-08: Recruiter is blocked from Assessment Taken Page 1 -> redirected to /recruiter-workflow-candidate', async ({ recruiterPage }) => {
      await recruiterPage.goto('/assessment-taken-page');
      await expect(recruiterPage).toHaveURL(/\/recruiter-workflow-candidate/);
    });

    test('RBAC-REC-09: Recruiter is blocked from Assessment Violation Message -> redirected to /recruiter-workflow-candidate', async ({ recruiterPage }) => {
      await recruiterPage.goto('/assessment-violation-message');
      await expect(recruiterPage).toHaveURL(/\/recruiter-workflow-candidate/);
    });

    test('RBAC-REC-10: Recruiter is blocked from Admin Candidate Scores (/admin-candidate-scores) -> redirected to /recruiter-workflow-candidate', async ({ recruiterPage }) => {
      await recruiterPage.goto('/admin-candidate-scores');
      await expect(recruiterPage).toHaveURL(/\/recruiter-workflow-candidate/);
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 4. ADMIN ROLE BOUNDARY ENFORCEMENT ON CANDIDATE PAGES
  // ════════════════════════════════════════════════════════════════════════════
  test.describe('4. Admin Role Boundary Restrictions', () => {

    test('RBAC-ADM-01: Admin is blocked from Candidate Home -> redirected to /recruiter-workflow-candidate', async ({ adminPage }) => {
      await adminPage.goto('/candidate-home');
      await expect(adminPage).toHaveURL(/\/recruiter-workflow-candidate/);
    });

    test('RBAC-ADM-02: Admin is blocked from Candidate Dashboard -> redirected to /recruiter-workflow-candidate', async ({ adminPage }) => {
      await adminPage.goto('/candidate-dashboard');
      await expect(adminPage).toHaveURL(/\/recruiter-workflow-candidate/);
    });

    test('RBAC-ADM-03: Admin is blocked from Assessment Rules Card -> redirected to /recruiter-workflow-candidate', async ({ adminPage }) => {
      await adminPage.goto('/flashyre-assessment-rules-card');
      await expect(adminPage).toHaveURL(/\/recruiter-workflow-candidate/);
    });

    test('RBAC-ADM-04: Admin is blocked from Active MCQ Assessment -> redirected to /recruiter-workflow-candidate', async ({ adminPage }) => {
      await adminPage.goto('/flashyre-assessment11');
      await expect(adminPage).toHaveURL(/\/recruiter-workflow-candidate/);
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 5. CLIENT / MANAGEMENT ROLE BOUNDARY ENFORCEMENT
  // ════════════════════════════════════════════════════════════════════════════
  test.describe('5. Client / Corporate Management Role Permissions', () => {

    test('RBAC-CLIENT-01: Client is granted access to Job Requirements (/recruiter-workflow-requirement)', async ({ clientPage }) => {
      await clientPage.goto('/recruiter-workflow-requirement');
      await expect(clientPage).toHaveURL(/\/recruiter-workflow-requirement/);
    });

    test('RBAC-CLIENT-02: Client is granted access to ATS Workflow (/recruiter-workflow-ats/1)', async ({ clientPage }) => {
      await clientPage.goto('/recruiter-workflow-ats/1');
      await expect(clientPage).toHaveURL(/\/recruiter-workflow-ats\/1/);
    });

    test('RBAC-CLIENT-03: Client is blocked from Candidate Home -> redirected to /recruiter-workflow-requirement', async ({ clientPage }) => {
      await clientPage.goto('/candidate-home');
      await expect(clientPage).toHaveURL(/\/recruiter-workflow-requirement/);
    });

    test('RBAC-CLIENT-04: Client is blocked from Recruiter Jobs Posted -> redirected to /recruiter-workflow-requirement', async ({ clientPage }) => {
      await clientPage.goto('/job-post-list');
      await expect(clientPage).toHaveURL(/\/recruiter-workflow-requirement/);
    });

    test('RBAC-CLIENT-05: Client is blocked from Admin-Only Client Management -> redirected to /recruiter-workflow-requirement', async ({ clientPage }) => {
      await clientPage.goto('/recruiter-workflow-client');
      await expect(clientPage).toHaveURL(/\/recruiter-workflow-requirement/);
    });

    test('RBAC-CLIENT-06: Client is blocked from Admin Control Center (/admin-page1) -> redirected to /recruiter-workflow-requirement', async ({ clientPage }) => {
      await clientPage.goto('/admin-page1');
      await expect(clientPage).toHaveURL(/\/recruiter-workflow-requirement/);
    });

    test('RBAC-CLIENT-07: Client is blocked from Create Job Post (/create-job) -> redirected to /recruiter-workflow-requirement', async ({ clientPage }) => {
      await clientPage.goto('/create-job');
      await expect(clientPage).toHaveURL(/\/recruiter-workflow-requirement/);
    });

    test('RBAC-CLIENT-08: Client is blocked from Super Admin Module -> redirected to /recruiter-workflow-requirement', async ({ clientPage }) => {
      await clientPage.goto('/recruiter-super-admin-analytical-module');
      await expect(clientPage).toHaveURL(/\/recruiter-workflow-requirement/);
    });

    test('RBAC-CLIENT-09: Client is blocked from Create Job Step 2 (/create-job-step2) -> redirected to /recruiter-workflow-requirement', async ({ clientPage }) => {
      await clientPage.goto('/create-job-step2');
      await expect(clientPage).toHaveURL(/\/recruiter-workflow-requirement/);
    });

    test('RBAC-CLIENT-10: Client is blocked from Create Job Step 3 (/create-job-step3) -> redirected to /recruiter-workflow-requirement', async ({ clientPage }) => {
      await clientPage.goto('/create-job-step3');
      await expect(clientPage).toHaveURL(/\/recruiter-workflow-requirement/);
    });

    test('RBAC-CLIENT-11: Client is blocked from Create Job Step 4 (/create-job-step4) -> redirected to /recruiter-workflow-requirement', async ({ clientPage }) => {
      await clientPage.goto('/create-job-step4');
      await expect(clientPage).toHaveURL(/\/recruiter-workflow-requirement/);
    });

    test('RBAC-CLIENT-12: Client is blocked from Admin Candidate Scores (/admin-candidate-scores) -> redirected to /recruiter-workflow-requirement', async ({ clientPage }) => {
      await clientPage.goto('/admin-candidate-scores');
      await expect(clientPage).toHaveURL(/\/recruiter-workflow-requirement/);
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 6. STANDARD ADMIN vs. SUPER ADMIN PRIVILEGE ELEVATION PROTECTION
  // ════════════════════════════════════════════════════════════════════════════
  test.describe('6. Super Admin Privilege Checks', () => {

    test('RBAC-SUPER-01: Standard Admin (isSuperUser=false) is BLOCKED from Super Admin module -> redirected to /recruiter-workflow-candidate', async ({ standardAdminPage }) => {
      await standardAdminPage.goto('/recruiter-super-admin-analytical-module');
      await expect(standardAdminPage).toHaveURL(/\/recruiter-workflow-candidate/);
    });

    test('RBAC-SUPER-02: Super Admin (isSuperUser=true) is GRANTED access to Super Admin analytical module', async ({ superAdminPage }) => {
      await superAdminPage.goto('/recruiter-super-admin-analytical-module');
      await expect(superAdminPage).toHaveURL(/\/recruiter-super-admin-analytical-module/);
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 7. TOKEN EXPIRATION & LIFECYCLE SECURITY
  // ════════════════════════════════════════════════════════════════════════════
  test.describe('7. Token Lifecycle & Expiration Security', () => {

    test('RBAC-TOK-01: Expired token without refreshToken is rejected -> redirects to /login', async ({ page }) => {
      // Create an expired JWT token (expired in year 2020)
      const expiredJwt = generateMockJwt({
        exp: 1577836800, // 2020-01-01
        user_type: 'candidate',
      });

      await page.addInitScript((token) => {
        localStorage.setItem('jwtToken', token);
        localStorage.setItem('userType', 'candidate');
        localStorage.removeItem('refreshToken');
      }, expiredJwt);

      await page.goto('/candidate-home');
      await expect(page).toHaveURL(/\/login\?returnUrl=%2Fcandidate-home/);
    });

    test('RBAC-TOK-02: Malformed / corrupted token string is rejected -> redirects to /login', async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.setItem('jwtToken', 'not-a-valid-jwt-token-string-at-all');
        localStorage.setItem('userType', 'admin');
        localStorage.removeItem('refreshToken');
      });

      await page.goto('/admin-page1');
      await expect(page).toHaveURL(/\/login\?returnUrl=%2Fadmin-page1/);
    });

    test('RBAC-TOK-03: Empty token string without refreshToken is rejected -> redirects to /login', async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.setItem('jwtToken', '');
        localStorage.setItem('userType', 'candidate');
        localStorage.removeItem('refreshToken');
      });

      await page.goto('/candidate-dashboard');
      await expect(page).toHaveURL(/\/login\?returnUrl=%2Fcandidate-dashboard/);
    });

    test('RBAC-TOK-04: Expired token WITH valid refreshToken is PERMITTED -> access granted', async ({ page }) => {
      // Create an expired JWT token
      const expiredJwt = generateMockJwt({
        exp: 1577836800, // 2020-01-01
        user_type: 'candidate',
      });

      await page.addInitScript((token) => {
        localStorage.setItem('jwtToken', token);
        localStorage.setItem('userType', 'candidate');
        localStorage.setItem('refreshToken', 'mock-valid-refresh-token-session');
        localStorage.setItem('userProfile', JSON.stringify({
          user_id: '501',
          first_name: 'John',
          last_name: 'Candidate',
          user_type: 'candidate',
        }));
      }, expiredJwt);

      await page.goto('/candidate-home');
      // Should NOT be redirected to /login because refreshToken exists
      await expect(page).not.toHaveURL(/\/login/);
      await expect(page).toHaveURL(/\/candidate-home/);
    });
  });

});
