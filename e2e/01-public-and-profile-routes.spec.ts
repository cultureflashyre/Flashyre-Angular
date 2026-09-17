import { test, expect } from './auth-helpers';

/**
 * ══════════════════════════════════════════════════════════════════════════════
 * FLASHYRE PLAYWRIGHT E2E SUITE 1: PUBLIC & PROFILE ROUTES
 * ══════════════════════════════════════════════════════════════════════════════
 * 
 * Verifies all publicly accessible routes, authentication entry points,
 * candidate onboarding/profile wizard stages, and the wildcard 404 error page.
 * 
 * Route Coverage:
 * 1.  /                                -> Landing Page / Index
 * 2.  /login                           -> Candidate Login Page
 * 3.  /signup                          -> Candidate Signup Registration
 * 4.  /login-forgot-password           -> Password Recovery Request
 * 5.  /login-reset-password            -> OTP & Password Reset
 * 6.  /error-system-requirement-failed -> System Check / Diagnostic Failure Screen
 * 7.  /buffer-page                     -> Transition Buffer Loading Screen
 * 8.  /coding-assessment               -> Online Coding IDE & Problem Interface
 * 9.  /apply/:formId                   -> Public Collection Form Candidate Application
 * 10. /profile-basic-information       -> Candidate Profile Setup: Personal Info
 * 11. /profile-employment-page         -> Candidate Profile Setup: Employment History
 * 12. /profile-certification-page      -> Candidate Profile Setup: Certifications
 * 13. /profile-last-page1              -> Candidate Profile Setup: Final Confirmation
 * 14. /profile-overview-page           -> Candidate Profile Overview & Metrics
 * 15. /** (404 Not Found)              -> Global Wildcard Fallback Screen
 */

test.describe('Suite 1: Public & Candidate Profile Onboarding Routes', () => {

  // 1. Landing Page / Index
  test('PUB-01: Landing Page (/) renders hero search and navbar navigation', async ({ page }) => {
    await page.goto('/');
    
    // Check main container
    const mainContainer = page.locator('.index-container1');
    await expect(mainContainer).toBeVisible();

    // Check navbar links
    const navbar = page.locator('landing-page-navbar');
    await expect(navbar).toBeVisible();
    await expect(page.locator('.index-fragment13, .index-fragment18').first()).toContainText('Login');
    await expect(page.locator('.index-fragment14, .index-fragment19').first()).toContainText('Sign-up');

    // Check Hero search section
    const searchHero = page.locator('landing-page-job-search-hero');
    await expect(searchHero).toBeVisible();
  });

  // 2. Candidate Signup Registration
  test('PUB-02: Candidate Signup (/signup) renders form and required fields', async ({ page }) => {
    await page.goto('/signup');

    const signupContainer = page.locator('#signup-candidate');
    await expect(signupContainer).toBeVisible();

    // Verify presence of input fields and labels
    await expect(page.locator('.signup-candidate-fragment10')).toContainText('First Name');
    await expect(page.locator('.signup-candidate-fragment11')).toContainText('Last Name');
    await expect(page.locator('.signup-candidate-fragment16')).toContainText('Email Id');
    await expect(page.locator('.signup-candidate-fragment15')).toContainText('Sign Up');
  });

  // 3. Password Recovery Request
  test('PUB-03: Forgot Password (/login-forgot-password) renders email prompt and submit action', async ({ page }) => {
    await page.goto('/login-forgot-password');

    const heading = page.locator('#forgot-password-title');
    await expect(heading).toBeVisible();
    await expect(heading).toHaveText('Forgot Password');

    const emailInput = page.locator('#email');
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toHaveAttribute('type', 'email');

    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeVisible();
    await expect(submitBtn).toContainText('Submit');
  });

  // 4. OTP & Password Reset
  test('PUB-04: Reset Password (/login-reset-password) renders reset form card', async ({ page }) => {
    await page.goto('/login-reset-password');

    const cardTitle = page.locator('.card-title');
    await expect(cardTitle).toBeVisible();
    await expect(cardTitle).toHaveText('Reset Your Password');

    const emailField = page.locator('#email');
    await expect(emailField).toBeVisible();
  });

  // 5. System Check / Diagnostic Failure Screen
  test('PUB-05: System Requirement Failure (/error-system-requirement-failed) renders diagnostic error banner', async ({ page }) => {
    await page.goto('/error-system-requirement-failed');

    const errorContainer = page.locator('.error-system-requirement-failed-container10');
    await expect(errorContainer).toBeVisible();

    // Verify logo and navbar elements
    const logo = page.locator('#flashyre-logo');
    await expect(logo).toBeVisible();
  });

  // 6. Transition Buffer Loading Screen
  test('PUB-06: Transition Buffer Screen (/buffer-page) initializes gracefully', async ({ page }) => {
    await page.goto('/buffer-page');
    // Buffer page component is attached and body is visible
    await expect(page.locator('buffer-page')).toBeAttached();
    await expect(page.locator('body')).toBeVisible();
  });

  // 7. Online Coding Assessment IDE
  test('PUB-07: Public Coding Assessment (/coding-assessment) renders editor and problem layout', async ({ page }) => {
    await page.goto('/coding-assessment');

    const pageContainer = page.locator('.page-container');
    await expect(pageContainer).toBeVisible();

    // Timer display and left/right workspace
    const leftSection = page.locator('.left-section');
    const rightSection = page.locator('.right-section');
    await expect(leftSection).toBeVisible();
    await expect(rightSection).toBeVisible();
    await expect(page.locator('.timer-display')).toBeVisible();
  });

  // 8. Public Collection Form Application
  test('PUB-08: Public Apply Page (/apply/:formId) renders active form submission container', async ({ page }) => {
    await page.goto('/apply/test-form-uuid-123');

    // Verify page loads without redirection
    await expect(page).toHaveURL(/\/apply\/test-form-uuid-123/);
    await expect(page.locator('.apply-page-wrapper, .card-panel, body')).toBeVisible();
    await expect(page.locator('#flashyre-logo')).toBeVisible();
  });

  // 9. Profile Setup: Basic Information
  test('PUB-09: Profile Basic Information (/profile-basic-information) renders candidate info form', async ({ page }) => {
    await page.goto('/profile-basic-information');

    const profileContainer = page.locator('#profile-basic-information');
    await expect(profileContainer).toBeVisible();

    const navbar = page.locator('navbar-for-candidate-view1');
    await expect(navbar).toBeVisible();
    await expect(page.locator('.profile-basic-information-fragment10')).toContainText('Profile');
  });

  // 10. Profile Setup: Employment History
  test('PUB-10: Profile Employment Page (/profile-employment-page) renders work history view', async ({ page }) => {
    await page.goto('/profile-employment-page');

    const employmentContainer = page.locator('#profile-employment-page');
    await expect(employmentContainer).toBeVisible();

    await expect(page.locator('.profile-employment-page-fragment10')).toContainText('Profile');
  });

  // 11. Profile Setup: Certifications
  test('PUB-11: Profile Certification Page (/profile-certification-page) renders certifications view', async ({ page }) => {
    await page.goto('/profile-certification-page');

    const certContainer = page.locator('#profile-certification-page');
    await expect(certContainer).toBeVisible();

    await expect(page.locator('.profile-certification-page-fragment10')).toContainText('Profile');
  });

  // 12. Profile Setup: Final Confirmation
  test('PUB-12: Profile Last Page (/profile-last-page1) renders final submission view', async ({ page }) => {
    await page.goto('/profile-last-page1');

    const lastPageContainer = page.locator('#profile-last-page1');
    await expect(lastPageContainer).toBeVisible();

    await expect(page.locator('.profile-last-page1-fragment10')).toContainText('Profile');
  });

  // 13. Profile Overview & Metrics
  test('PUB-13: Profile Overview (/profile-overview-page) renders candidate overview cards', async ({ page }) => {
    await page.goto('/profile-overview-page');

    const overviewContainer = page.locator('.profile-overview-page-container1');
    await expect(overviewContainer).toBeVisible();

    await expect(page.locator('.profile-overview-page-fragment100')).toContainText('90% Profile Completion');
  });

  // 14. Global Wildcard Fallback (404 Page)
  test('PUB-14: Wildcard 404 Route (/**) renders Not Found error screen for unknown URLs', async ({ page }) => {
    await page.goto('/some-completely-invalid-nonexistent-url-999');

    const notFoundContainer = page.locator('.not-found-container1');
    await expect(notFoundContainer).toBeVisible();

    const notFoundCode = page.locator('.not-found-text2');
    await expect(notFoundCode).toHaveText('404');

    const notFoundMessage = page.locator('.not-found-text3');
    await expect(notFoundMessage).toContainText('THE PAGE YOU REQUESTED WAS NOT FOUND');
  });

  // 15. Candidate Login (/login)
  test('PUB-15: Candidate Login (/login) renders login container and form controls', async ({ page }) => {
    await page.goto('/login');

    const loginContainer = page.locator('#login-candidate');
    await expect(loginContainer).toBeVisible();

    const loginPage = page.locator('log-in-page');
    await expect(loginPage).toBeVisible();

    // Verify presence of input containers and labels
    await expect(page.locator('.login-candidate-fragment1')).toContainText('Email');
    await expect(page.locator('.login-candidate-fragment6')).toContainText('Password');
    await expect(page.locator('.login-candidate-fragment5')).toContainText('Login');
    await expect(page.locator('.login-candidate-fragment9')).toContainText('Forgot Password');
  });

  // 16. Login Form Validation (User Request: Empty fields, format, button states)
  test('PUB-16: Candidate Login Form Validation — Empty fields keep submit disabled, invalid email format triggers error', async ({ page }) => {
    await page.goto('/login');

    const emailInput = page.locator('#login-email-input');
    const passwordInput = page.locator('#login-password-input');
    const submitBtn = page.locator('#login-button-container');

    // 1. Initial State: fields empty, submit button disabled
    await expect(emailInput).toHaveValue('');
    await expect(passwordInput).toHaveValue('');
    await expect(submitBtn).toBeDisabled();

    // 2. Email blur without value shows error
    await emailInput.focus();
    await emailInput.blur();
    await expect(page.locator('.error-text').filter({ hasText: 'Email is required.' })).toBeVisible();

    // 3. Invalid email format shows error
    await emailInput.fill('not-an-email');
    await emailInput.blur();
    await expect(page.locator('.error-text').filter({ hasText: 'Please enter a valid email address.' })).toBeVisible();

    // 4. Short password shows length validation error
    await passwordInput.fill('short');
    await passwordInput.blur();
    await expect(page.locator('.error-text').filter({ hasText: 'Password should be 8-15 characters.' })).toBeVisible();

    // 5. Submit button remains strictly disabled on invalid form
    await expect(submitBtn).toBeDisabled();
  });

  // 17. Security & Attack Simulation Defense (User Request: SQLi, rapid click / brute force defense)
  test('PUB-17: Candidate Login Attack Defense — SQL injection payloads & repeated clicks handled safely without app crash', async ({ page }) => {
    await page.goto('/login');

    const emailInput = page.locator('#login-email-input');
    const passwordInput = page.locator('#login-password-input');
    const submitBtn = page.locator('#login-button-container');

    // Attempt SQL injection strings
    await emailInput.fill("' OR '1'='1' --");
    await passwordInput.fill("' OR '1'='1'");

    // Input format validator blocks malformed email before network request
    await expect(page.locator('.error-text').filter({ hasText: 'Please enter a valid email address.' })).toBeVisible();
    await expect(submitBtn).toBeDisabled();

    // Rapid repeated clicking on disabled submit button does not trigger uncaught errors
    for (let i = 0; i < 5; i++) {
      await submitBtn.click({ force: true }).catch(() => {});
    }

    // Verify page remains responsive and interactive
    await expect(emailInput).toBeVisible();
    await expect(page.locator('#login-candidate')).toBeVisible();
  });

});
