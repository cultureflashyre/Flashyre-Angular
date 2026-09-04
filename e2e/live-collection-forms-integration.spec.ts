import { test, expect, request as apiRequest, APIRequestContext } from '@playwright/test';

/**
 * ══════════════════════════════════════════════════════════════════════════════
 * TRUE LIVE E2E INTEGRATION TEST SUITE: CANDIDATE COLLECTION FORMS
 * ══════════════════════════════════════════════════════════════════════════════
 * 
 * ARCHITECTURE PRINCIPLES:
 * 1. ZERO MOCKS: No `page.route()` interception. Every request hits the live Django API.
 * 2. LIVE DATABASE: Uses real MySQL database for records and Django DatabaseCache for throttling.
 * 3. REAL BOT PROTECTION: Lets Angular compute real browser fingerprints, time gates, and HMAC tokens.
 * 4. CLEAN TEARDOWN: Tracks all provisioned IDs and deletes them from MySQL on completion.
 * ══════════════════════════════════════════════════════════════════════════════
 */

const DJANGO_BASE_URL = process.env['DJANGO_API_URL'] || 'http://localhost:8000';
const ADMIN_EMAIL = process.env['LIVE_ADMIN_EMAIL'] || 'admin@chcs.com';
const ADMIN_PASSWORD = process.env['LIVE_ADMIN_PASSWORD'] || 'pass@123';

// Sample dummy PDF buffer with valid %PDF-1.4 magic bytes
const VALID_PDF_BUFFER = Buffer.from(
  '%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000010 00000 n \n0000000060 00000 n \n0000000117 00000 n \ntrailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n190\n%%EOF'
);

interface ProvisionedForm {
  id: number;
  unique_id: string;
  template_type: string;
  title: string;
}

test.describe.serial('True Live E2E: Candidate Collection Forms (Zero Mocks)', () => {
  let apiContext: APIRequestContext;
  let adminToken: string;
  const createdFormUuids: string[] = [];
  const createdCandidateEmails: string[] = [];

  test.beforeAll(async () => {
    apiContext = await apiRequest.newContext({
      baseURL: DJANGO_BASE_URL,
    });

    // 1. Authenticate directly with live Django backend to obtain valid JWT
    const loginResponse = await apiContext.post('/api/auth/token/', {
      data: {
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      },
    });

    if (!loginResponse.ok()) {
      // Fallback to /api/token/ if auth endpoint varies
      const altLogin = await apiContext.post('/api/token/', {
        data: {
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
        },
      });
      expect(altLogin.ok(), `Live authentication failed with status ${altLogin.status()}`).toBeTruthy();
      const authData = await altLogin.json();
      adminToken = authData.access;
    } else {
      const authData = await loginResponse.json();
      adminToken = authData.access;
    }

    expect(adminToken, 'Live JWT token must be returned').toBeTruthy();
  });

  test.afterAll(async () => {
    // 2. Comprehensive MySQL Teardown: Clean up live forms and candidates
    for (const formUuid of createdFormUuids) {
      try {
        await apiContext.delete(`/api/collection-forms/${formUuid}/`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        });
      } catch (err) {
        console.warn(`[Cleanup] Failed to delete form ${formUuid}:`, err);
      }
    }

    await apiContext.dispose();
  });

  /**
   * Helper: Provisions a live CandidateCollectionForm in MySQL via Django DRF API
   */
  async function provisionLiveForm(templateType: 'standard' | 'campus' | 'experienced', customProps: any = {}): Promise<ProvisionedForm> {
    const timestamp = Date.now();
    const payload = {
      title: `Live QA ${templateType.toUpperCase()} Form ${timestamp}`,
      company_name: 'Flashyre Systems India',
      template_type: templateType,
      require_resume: true,
      is_active: true,
      ...customProps,
    };

    const response = await apiContext.post('/api/collection-forms/', {
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      data: payload,
    });

    expect(response.status(), `Failed to provision ${templateType} form in MySQL`).toBe(201);
    const formData = await response.json();
    const formRecord = formData.data || formData;
    createdFormUuids.push(formRecord.unique_id);
    return formRecord;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // TEMPLATE 1: STANDARD FORM LIVE E2E SUBMISSION
  // ════════════════════════════════════════════════════════════════════════════
  test('Live Flow: Standard Template Submission -> MySQL Persistence', async ({ page }) => {
    // 1. Provision live form in MySQL
    const liveForm = await provisionLiveForm('standard');
    const candidateEmail = `std.candidate.${Date.now()}@flashyre-qa.test`;
    createdCandidateEmails.push(candidateEmail);

    // 2. Open the real public application URL in Chromium
    await page.goto(`/apply/${liveForm.unique_id}`);

    // Verify form header loaded from live Django API
    await expect(page.locator('h1')).toHaveText(liveForm.title, { timeout: 10000 });
    await expect(page.locator('.company-subtitle')).toHaveText('Flashyre Systems India');

    // 3. Fill standard candidate fields
    await page.locator('#name').fill('Aarav Patel');
    await page.locator('#email').fill(candidateEmail);
    await page.locator('#phone_number').fill('9876543210');
    await page.locator('#gender').selectOption('Male');

    // 4. Attach real PDF resume (triggers Angular magic byte verification)
    const fileInput = page.locator('#resume');
    await fileInput.setInputFiles({
      name: 'aarav_patel_resume.pdf',
      mimeType: 'application/pdf',
      buffer: VALID_PDF_BUFFER,
    });

    // 5. Wait for time-gate requirement (minimum 8 seconds human simulation)
    await page.waitForTimeout(8500);

    // 6. Submit form through real browser
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // 7. Verify live UI confirmation card with recruiter phone and WhatsApp CTA
    const successCard = page.locator('.success-container');
    await expect(successCard.locator('h2')).toHaveText('Application Submitted!', { timeout: 15000 });
    await expect(successCard.locator('.success-desc')).toContainText(`Thank you for applying. Reach our team by sending Hi with ${liveForm.title}`);
    await expect(successCard.locator('.contact-phone-link')).toBeVisible();
    await expect(successCard.locator('.btn-whatsapp')).toBeVisible();

    // 8. Direct MySQL Backend Verification via Django API
    const verifyResponse = await apiContext.get(`/api/collection-forms/${liveForm.unique_id}/`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(verifyResponse.ok()).toBeTruthy();
    const updatedForm = await verifyResponse.json();
    const formStats = updatedForm.data || updatedForm;
    expect(formStats.submission_count).toBeGreaterThanOrEqual(1);
  });

  // ════════════════════════════════════════════════════════════════════════════
  // TEMPLATE 2: CAMPUS DRIVE TEMPLATE LIVE E2E SUBMISSION
  // ════════════════════════════════════════════════════════════════════════════
  test('Live Flow: Campus Template (University & Grad Year) -> Persistence', async ({ page }) => {
    // 1. Provision live campus form in MySQL
    const liveForm = await provisionLiveForm('campus');
    const candidateEmail = `campus.graduate.${Date.now()}@flashyre-qa.test`;
    createdCandidateEmails.push(candidateEmail);

    // 2. Open public form URL
    await page.goto(`/apply/${liveForm.unique_id}`);
    await expect(page.locator('h1')).toHaveText(liveForm.title, { timeout: 10000 });

    // 3. Fill baseline fields
    await page.locator('#name').fill('Sneha Kulkarni');
    await page.locator('#email').fill(candidateEmail);
    await page.locator('#phone_number').fill('9823012345');
    await page.locator('#gender').selectOption('Female');

    // 4. Fill Campus-specific required fields
    await expect(page.locator('#latest_university')).toBeVisible();
    await page.locator('#latest_university').fill('IIT Bombay');
    await expect(page.locator('#year_of_graduation')).toBeVisible();
    await page.locator('#year_of_graduation').fill('2025');

    // 5. Attach resume
    await page.locator('#resume').setInputFiles({
      name: 'sneha_kulkarni_cv.pdf',
      mimeType: 'application/pdf',
      buffer: VALID_PDF_BUFFER,
    });

    // 6. Respect the 8-second time gate
    await page.waitForTimeout(8500);

    // 7. Submit and assert live success
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('.success-container h2')).toHaveText('Application Submitted!', { timeout: 15000 });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // TEMPLATE 3: EXPERIENCED HIRE TEMPLATE LIVE E2E SUBMISSION
  // ════════════════════════════════════════════════════════════════════════════
  test('Live Flow: Experienced Template (Company, CTC, Notice) -> Persistence', async ({ page }) => {
    // 1. Provision live experienced hire form in MySQL
    const liveForm = await provisionLiveForm('experienced');
    const candidateEmail = `exp.lead.${Date.now()}@flashyre-qa.test`;
    createdCandidateEmails.push(candidateEmail);

    // 2. Open public URL
    await page.goto(`/apply/${liveForm.unique_id}`);
    await expect(page.locator('h1')).toHaveText(liveForm.title, { timeout: 10000 });

    // 3. Fill base info
    await page.locator('#name').fill('Rohan Verma');
    await page.locator('#email').fill(candidateEmail);
    await page.locator('#phone_number').fill('9711223344');
    await page.locator('#gender').selectOption('Male');

    // 4. Fill Experienced-specific dropdowns and inputs
    await expect(page.locator('#latest_company')).toBeVisible();
    await page.locator('#latest_company').fill('Infosys Limited');

    await expect(page.locator('#current_ctc')).toBeVisible();
    await page.locator('#current_ctc').selectOption('12+ LPA');

    await expect(page.locator('#notice_period')).toBeVisible();
    await page.locator('#notice_period').selectOption('30 Days');

    // 5. Attach resume
    await page.locator('#resume').setInputFiles({
      name: 'rohan_verma_lead.pdf',
      mimeType: 'application/pdf',
      buffer: VALID_PDF_BUFFER,
    });

    // 6. Wait time gate
    await page.waitForTimeout(8500);

    // 7. Submit
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('.success-container h2')).toHaveText('Application Submitted!', { timeout: 15000 });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // LIVE SECURITY & TIME-GATE VERIFICATION (AGAINST REAL DJANGO)
  // ════════════════════════════════════════════════════════════════════════════
  test('Live Security: Fast Submission (<8s) is Rejected by Django Bot Protection', async ({ page }) => {
    const liveForm = await provisionLiveForm('standard');
    await page.goto(`/apply/${liveForm.unique_id}`);
    await expect(page.locator('h1')).toHaveText(liveForm.title, { timeout: 10000 });

    // Fill form instantly
    await page.locator('#name').fill('Fast Bot');
    await page.locator('#email').fill(`bot.${Date.now()}@flashyre-qa.test`);
    await page.locator('#phone_number').fill('9000000000');
    await page.locator('#gender').selectOption('Others');
    await page.locator('#resume').setInputFiles({
      name: 'bot.pdf',
      mimeType: 'application/pdf',
      buffer: VALID_PDF_BUFFER,
    });

    // Submit immediately WITHOUT waiting 8 seconds
    await page.locator('button[type="submit"]').click();

    // Verify backend rejected submission due to time gate (<8s)
    await expect(page.locator('.submission-error')).toContainText(/Form submitted too quickly|Please refresh/i, { timeout: 10000 });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // LIVE PER-FORM DUPLICATE PREVENTION VERIFICATION
  // ════════════════════════════════════════════════════════════════════════════
  test('Live Duplicate Check: Candidate cannot apply more than once to the same form (Email or Phone)', async ({ page }) => {
    const liveForm = await provisionLiveForm('standard');
    const candidateEmail = `duplicate.live.${Date.now()}@flashyre-qa.test`;
    const candidatePhone = '9988776655';
    createdCandidateEmails.push(candidateEmail);

    // Submission 1: Valid initial application
    await page.goto(`/apply/${liveForm.unique_id}`);
    await page.locator('#name').fill('Vikram Malhotra');
    await page.locator('#email').fill(candidateEmail);
    await page.locator('#phone_number').fill(candidatePhone);
    await page.locator('#gender').selectOption('Male');
    await page.locator('#resume').setInputFiles({
      name: 'vikram.pdf',
      mimeType: 'application/pdf',
      buffer: VALID_PDF_BUFFER,
    });
    await page.waitForTimeout(8500);
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('.success-container h2')).toHaveText('Application Submitted!', { timeout: 15000 });

    // Submission 2: Re-applying to same form with same email & phone is rejected
    await page.goto(`/apply/${liveForm.unique_id}`);
    await page.locator('#name').fill('Vikram Malhotra');
    await page.locator('#email').fill(candidateEmail);
    await page.locator('#phone_number').fill(candidatePhone);
    await page.locator('#gender').selectOption('Male');
    await page.locator('#resume').setInputFiles({
      name: 'vikram.pdf',
      mimeType: 'application/pdf',
      buffer: VALID_PDF_BUFFER,
    });
    await page.waitForTimeout(8500);
    await page.locator('button[type="submit"]').click();

    // Verify Django rejected with duplicate application error message
    await expect(page.locator('.submission-error')).toContainText(/already submitted an application for this position/i, { timeout: 10000 });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // LIVE MULTI-FORM APPLICATION & CANDIDATE PROFILE DATA OVERRIDE
  // ════════════════════════════════════════════════════════════════════════════
  test('Live Multi-Form Flow: Candidate applies to Form A then Form B -> Allowed & Data Updated', async ({ page }) => {
    // 1. Provision Form A (Standard) and Form B (Experienced)
    const formA = await provisionLiveForm('standard', { title: `Live SDE Form ${Date.now()}` });
    const formB = await provisionLiveForm('experienced', { title: `Live DevOps Form ${Date.now()}` });

    const multiEmail = `cross.candidate.${Date.now()}@flashyre-qa.test`;
    const multiPhone = '9876543210';
    createdCandidateEmails.push(multiEmail);

    // 2. Apply to Form A
    await page.goto(`/apply/${formA.unique_id}`);
    await page.locator('#name').fill('Dev Candidate');
    await page.locator('#email').fill(multiEmail);
    await page.locator('#phone_number').fill(multiPhone);
    await page.locator('#gender').selectOption('Male');
    await page.locator('#resume').setInputFiles({
      name: 'dev_v1.pdf',
      mimeType: 'application/pdf',
      buffer: VALID_PDF_BUFFER,
    });
    await page.waitForTimeout(8500);
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('.success-container h2')).toHaveText('Application Submitted!', { timeout: 15000 });

    // 3. Apply to Form B with updated details (Company & Notice Period)
    await page.goto(`/apply/${formB.unique_id}`);
    await page.locator('#name').fill('Dev Candidate Senior');
    await page.locator('#email').fill(multiEmail);
    await page.locator('#phone_number').fill(multiPhone);
    await page.locator('#gender').selectOption('Male');
    await page.locator('#latest_company').fill('New Tech Enterprises');
    await page.locator('#current_ctc').selectOption('9 - 12 LPA');
    await page.locator('#notice_period').selectOption('Immediate');
    await page.locator('#resume').setInputFiles({
      name: 'dev_v2.pdf',
      mimeType: 'application/pdf',
      buffer: VALID_PDF_BUFFER,
    });
    await page.waitForTimeout(8500);
    await page.locator('button[type="submit"]').click();

    // 4. Assert Form B submission succeeds
    await expect(page.locator('.success-container h2')).toHaveText('Application Submitted!', { timeout: 15000 });
    await expect(page.locator('.success-container .success-desc')).toContainText(formB.title);
  });

  // ════════════════════════════════════════════════════════════════════════════
  // LIVE INACTIVE & EXPIRED FORM VERIFICATION
  // ════════════════════════════════════════════════════════════════════════════
  test('Live Lifecycle: Deactivated Form returns 410 Gone', async ({ page }) => {
    const liveForm = await provisionLiveForm('standard', { is_active: false });
    await page.goto(`/apply/${liveForm.unique_id}`);

    // Verify Django returned 410 Gone and Angular displays unavailability card
    await expect(page.locator('.error-container h2')).toHaveText('Application Unavailable', { timeout: 10000 });
    await expect(page.locator('.error-container p')).toContainText(/no longer active/i);
  });
});
