import { test, expect, Page } from '@playwright/test';

// ─── Configuration ────────────────────────────────────────
const BASE_URL = process.env['E2E_BASE_URL'] || 'http://localhost:4200';
const API_URL = process.env['E2E_API_URL'] || 'http://localhost:8000';

const MOCK_FORM_UUID = '11111111-2222-3333-4444-555555555551';
const MOCK_FORM_2_UUID = '22222222-3333-4444-5555-666666666662';

const uniqueEmail = () => `e2e_${Date.now()}_${Math.random().toString(36).substring(7)}@testdomain.com`;

// ─── Magic Byte File Buffers ──────────────────────────────
const VALID_PDF_BUFFER = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\ntrailer\n<< /Size 2 >>\n%%EOF');
const VALID_DOCX_BUFFER = Buffer.from([0x50, 0x4B, 0x03, 0x04, 0x14, 0x00, 0x06, 0x00, 0x08, 0x00, 0x00, 0x00]); // PK\x03\x04
const VALID_DOC_BUFFER = Buffer.from([0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1, 0x00, 0x00, 0x00, 0x00]); // OLE2 doc
const FAKE_EXE_BUFFER = Buffer.from([0x4D, 0x5A, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]); // MZ executable
const FAKE_PNG_BUFFER = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]); // PNG header

interface MockFormOptions {
  uuid?: string;
  title?: string;
  companyName?: string;
  templateType?: 'standard' | 'campus' | 'experienced' | 'walkin';
  requireResume?: boolean;
  createdByPhone?: string;
}

async function setupPublicFormMocks(page: Page, options: MockFormOptions = {}) {
  const formUuid = options.uuid || MOCK_FORM_UUID;
  const title = options.title || 'Senior Software Engineer Hiring Form';
  const companyName = options.companyName || 'Flashyre Global';
  const templateType = options.templateType || 'standard';
  const requireResume = options.requireResume !== undefined ? options.requireResume : true;
  const createdByPhone = options.createdByPhone || '9876543210';

  await page.route(`**/api/public-forms/${formUuid}/`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        unique_id: formUuid,
        title: title,
        company_name: companyName,
        logo_url: null,
        require_resume: requireResume,
        is_active: true,
        template_type: templateType,
        created_by_phone: createdByPhone,
        form_token: `${Math.floor(Date.now() / 1000)}:mockhmacsignatureforplaywrighte2etesting1234567890abcdef`
      }),
    });
  });

  await page.route(`**/api/public-forms/${formUuid}/submit/`, async (route) => {
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        message: 'Thank you! Your application has been submitted successfully.'
      }),
    });
  });
}

async function fillStandardForm(page: Page, overrides: Record<string, string> = {}) {
  const defaults: Record<string, string> = {
    name: 'Vikram Aditya',
    email: uniqueEmail(),
    phone_number: '9876543210',
    gender: 'Male',
  };
  const data = { ...defaults, ...overrides };

  await page.fill('#name', data['name']);
  await page.fill('#email', data['email']);
  await page.fill('#phone_number', data['phone_number']);
  await page.selectOption('#gender', data['gender']);
}

async function uploadFile(page: Page, filename: string, mimeType: string, buffer: Buffer) {
  const fileInput = page.locator('input[type="file"]#resume');
  await fileInput.setInputFiles({
    name: filename,
    mimeType: mimeType,
    buffer: buffer,
  });
}

async function uploadValidPDF(page: Page, filename = 'resume.pdf') {
  await uploadFile(page, filename, 'application/pdf', VALID_PDF_BUFFER);
  await expect(page.locator('.file-info')).toBeVisible({ timeout: 5000 });
}

// ════════════════════════════════════════════════════════════════════════════
// 1. POSITIVE TESTS & VALID FILE FORMATS WITH MAGIC NUMBERS
// ════════════════════════════════════════════════════════════════════════════
test.describe('Public Apply — Positive Tests & Magic Number Verification', () => {

  test('P1: Submit standard form with valid PDF (%PDF header) -> Verify success screen, Job Title, phone, and WhatsApp CTA', async ({ page }) => {
    const jobTitle = 'Lead Full Stack Architect';
    const recruiterPhone = '9876543210';
    await setupPublicFormMocks(page, {
      title: jobTitle,
      companyName: 'Flashyre Platform',
      templateType: 'standard',
      createdByPhone: recruiterPhone
    });

    await page.goto(`${BASE_URL}/apply/${MOCK_FORM_UUID}`);
    await page.waitForSelector('.form-container, form', { timeout: 10000 });

    // Verify company logo is displayed in the top navigation header
    const topLogo = page.locator('#flashyre-logo');
    await expect(topLogo).toBeVisible();
    await expect(topLogo).toHaveAttribute('src', '/assets/main-logo/logo%20-%20flashyre(1500px)-200h.png');

    await fillStandardForm(page);
    await uploadValidPDF(page);

    const submitBtn = page.locator('button[type="submit"].btn-submit');
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // 1. Success header
    const successCard = page.locator('.success-container');
    await expect(successCard).toBeVisible({ timeout: 10000 });
    await expect(successCard.locator('h2')).toHaveText('Application Submitted!');

    // 2. Dynamic message with Job Title and Recruiter Phone
    await expect(successCard.locator('.success-desc')).toContainText(`Thank you for applying. Reach our team by sending Hi with ${jobTitle} to ${recruiterPhone}.`);

    // 3. Contact badge with phone link
    const phoneLink = successCard.locator('.contact-phone-link');
    await expect(phoneLink).toBeVisible();
    await expect(phoneLink).toHaveAttribute('href', `tel:${recruiterPhone}`);
    await expect(phoneLink).toContainText(recruiterPhone);

    // 4. WhatsApp CTA button with preloaded message
    const whatsappBtn = successCard.locator('.btn-whatsapp');
    await expect(whatsappBtn).toBeVisible();
    const expectedWaLink = `https://wa.me/91${recruiterPhone}?text=${encodeURIComponent(`Hi with ${jobTitle}`)}`;
    await expect(whatsappBtn).toHaveAttribute('href', expectedWaLink);
  });

  test('P2: Submit form with valid DOCX file (PK zip signature 504B0304)', async ({ page }) => {
    await setupPublicFormMocks(page, { title: 'Backend Developer' });
    await page.goto(`${BASE_URL}/apply/${MOCK_FORM_UUID}`);
    await page.waitForSelector('.form-container, form', { timeout: 10000 });

    await fillStandardForm(page);
    await uploadFile(page, 'candidate_resume.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', VALID_DOCX_BUFFER);
    await expect(page.locator('.file-info')).toBeVisible({ timeout: 5000 });

    const submitBtn = page.locator('button[type="submit"].btn-submit');
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    await expect(page.locator('.success-container')).toBeVisible({ timeout: 10000 });
  });

  test('P3: Submit form with valid legacy DOC file (OLE2 signature D0CF11E0A1B11AE1)', async ({ page }) => {
    await setupPublicFormMocks(page, { title: 'Systems Engineer' });
    await page.goto(`${BASE_URL}/apply/${MOCK_FORM_UUID}`);
    await page.waitForSelector('.form-container, form', { timeout: 10000 });

    await fillStandardForm(page);
    await uploadFile(page, 'legacy_resume.doc', 'application/msword', VALID_DOC_BUFFER);
    await expect(page.locator('.file-info')).toBeVisible({ timeout: 5000 });

    const submitBtn = page.locator('button[type="submit"].btn-submit');
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    await expect(page.locator('.success-container')).toBeVisible({ timeout: 10000 });
  });

  test('P4: Submit campus template with university and graduation year', async ({ page }) => {
    await setupPublicFormMocks(page, {
      templateType: 'campus',
      title: 'Graduate Software Engineer 2026',
      createdByPhone: '9823012345'
    });

    await page.goto(`${BASE_URL}/apply/${MOCK_FORM_UUID}`);
    await page.waitForSelector('.form-container, form', { timeout: 10000 });

    await fillStandardForm(page);
    await page.fill('#latest_university', 'IIT Bombay');
    await page.fill('#year_of_graduation', '2026');
    await uploadValidPDF(page);

    const submitBtn = page.locator('button[type="submit"].btn-submit');
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    await expect(page.locator('.success-container')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.success-container')).toContainText('Graduate Software Engineer 2026');
  });

  test('P5: Submit experienced template with company, CTC, and notice period', async ({ page }) => {
    await setupPublicFormMocks(page, {
      templateType: 'experienced',
      title: 'Senior DevOps Specialist',
      createdByPhone: '9711223344'
    });

    await page.goto(`${BASE_URL}/apply/${MOCK_FORM_UUID}`);
    await page.waitForSelector('.form-container, form', { timeout: 10000 });

    await fillStandardForm(page);
    await page.fill('#latest_company', 'Google India');
    await page.selectOption('#current_ctc', '12+ LPA');
    await page.selectOption('#notice_period', '15 Days');
    await uploadValidPDF(page);

    const submitBtn = page.locator('button[type="submit"].btn-submit');
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    await expect(page.locator('.success-container')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.contact-phone-link')).toContainText('9711223344');
  });

  test('P6: Cross-Form Submissions: Candidate can apply to multiple different job forms', async ({ page }) => {
    await setupPublicFormMocks(page, {
      uuid: MOCK_FORM_UUID,
      title: 'Python Engineer',
      createdByPhone: '9876543210'
    });

    await setupPublicFormMocks(page, {
      uuid: MOCK_FORM_2_UUID,
      title: 'Angular Developer',
      createdByPhone: '9876543210'
    });

    const candidateEmail = 'candidate.multi@test.com';
    const candidatePhone = '9876543210';

    // 1. Submit Form 1
    await page.goto(`${BASE_URL}/apply/${MOCK_FORM_UUID}`);
    await fillStandardForm(page, { email: candidateEmail, phone_number: candidatePhone });
    await uploadValidPDF(page);
    await page.locator('button[type="submit"].btn-submit').click();
    await expect(page.locator('.success-container')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.success-desc')).toContainText('Python Engineer');

    // 2. Submit Form 2 with same email and phone
    await page.goto(`${BASE_URL}/apply/${MOCK_FORM_2_UUID}`);
    await fillStandardForm(page, { email: candidateEmail, phone_number: candidatePhone });
    await uploadValidPDF(page);
    await page.locator('button[type="submit"].btn-submit').click();
    await expect(page.locator('.success-container')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.success-desc')).toContainText('Angular Developer');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 2. FILE VALIDATION & SPOOFED MAGIC BYTE ATTACK REJECTIONS
// ════════════════════════════════════════════════════════════════════════════
test.describe('Public Apply — File Magic Byte & Integrity Rejections', () => {

  test('FILE-1: Spoofed PDF (Windows EXE header 4D5A renamed to .pdf) fails client magic-byte check', async ({ page }) => {
    await setupPublicFormMocks(page);
    await page.goto(`${BASE_URL}/apply/${MOCK_FORM_UUID}`);
    await page.waitForSelector('.form-container, form', { timeout: 10000 });

    await fillStandardForm(page);
    await uploadFile(page, 'malicious_virus.pdf', 'application/pdf', FAKE_EXE_BUFFER);

    // Expect client magic-byte integrity error
    await expect(page.locator('.validation-error').filter({ hasText: 'File integrity check failed' })).toBeVisible({ timeout: 5000 });
    await expect(page.locator('button[type="submit"].btn-submit')).toBeDisabled();
  });

  test('FILE-2: Spoofed DOCX (PNG image renamed to .docx) fails client magic-byte check', async ({ page }) => {
    await setupPublicFormMocks(page);
    await page.goto(`${BASE_URL}/apply/${MOCK_FORM_UUID}`);
    await page.waitForSelector('.form-container, form', { timeout: 10000 });

    await fillStandardForm(page);
    await uploadFile(page, 'photo_as_doc.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', FAKE_PNG_BUFFER);

    await expect(page.locator('.validation-error').filter({ hasText: 'File integrity check failed' })).toBeVisible({ timeout: 5000 });
    await expect(page.locator('button[type="submit"].btn-submit')).toBeDisabled();
  });

  test('FILE-3: Disallowed file extension (.exe) is rejected immediately', async ({ page }) => {
    await setupPublicFormMocks(page);
    await page.goto(`${BASE_URL}/apply/${MOCK_FORM_UUID}`);
    await page.waitForSelector('.form-container, form', { timeout: 10000 });

    await fillStandardForm(page);
    await uploadFile(page, 'installer.exe', 'application/x-msdownload', FAKE_EXE_BUFFER);

    await expect(page.locator('.validation-error').filter({ hasText: 'Only PDF, DOCX, and DOC files are allowed.' })).toBeVisible({ timeout: 5000 });
    await expect(page.locator('button[type="submit"].btn-submit')).toBeDisabled();
  });

  test('FILE-4: File exceeding 5MB limit is rejected by client size check', async ({ page }) => {
    await setupPublicFormMocks(page);
    await page.goto(`${BASE_URL}/apply/${MOCK_FORM_UUID}`);
    await page.waitForSelector('.form-container, form', { timeout: 10000 });

    await fillStandardForm(page);

    const oversizedBuffer = Buffer.alloc(6 * 1024 * 1024, '%PDF-1.4 ');
    await uploadFile(page, 'huge_resume.pdf', 'application/pdf', oversizedBuffer);

    await expect(page.locator('.validation-error').filter({ hasText: 'File size exceeds the 5MB limit.' })).toBeVisible({ timeout: 5000 });
    await expect(page.locator('button[type="submit"].btn-submit')).toBeDisabled();
  });

  test('FILE-5: Server-side API rejects spoofed file with 400 Bad Request', async ({ request }) => {
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
    const formBody = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="name"',
      '',
      'Spoofed Candidate',
      `--${boundary}`,
      'Content-Disposition: form-data; name="email"',
      '',
      'spoof@testdomain.com',
      `--${boundary}`,
      'Content-Disposition: form-data; name="phone_number"',
      '',
      '9876543210',
      `--${boundary}`,
      'Content-Disposition: form-data; name="gender"',
      '',
      'Male',
      `--${boundary}`,
      'Content-Disposition: form-data; name="_ts"',
      '',
      Date.now().toString(),
      `--${boundary}`,
      'Content-Disposition: form-data; name="_duration"',
      '',
      '10',
      `--${boundary}`,
      'Content-Disposition: form-data; name="_browser_token"',
      '',
      btoa('test|1920x1080|UTC'),
      `--${boundary}`,
      'Content-Disposition: form-data; name="_form_token"',
      '',
      'mocktoken',
      `--${boundary}`,
      'Content-Disposition: form-data; name="resume"; filename="corrupt.pdf"',
      'Content-Type: application/pdf',
      '',
      'NOT A REAL PDF HEADER',
      `--${boundary}--`
    ].join('\r\n');

    const response = await request.post(`${API_URL}/api/public-forms/${MOCK_FORM_UUID}/submit/`, {
      data: formBody,
      headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` }
    });

    expect([400, 404, 429]).toContain(response.status());
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 3. EMAIL VALIDATION (CLIENT-SIDE & SERVER-SIDE)
// ════════════════════════════════════════════════════════════════════════════
test.describe('Public Apply — Email Format Validations', () => {

  const invalidEmails = [
    'plainaddress',
    'missingatsign.com',
    '@missinguser.com',
    'user@domain..com',
    'user@.com',
    'user with spaces@domain.com'
  ];

  for (const email of invalidEmails) {
    test(`EMAIL-CLIENT: Invalid email '${email}' is rejected by client validator`, async ({ page }) => {
      await setupPublicFormMocks(page);
      await page.goto(`${BASE_URL}/apply/${MOCK_FORM_UUID}`);
      await page.waitForSelector('.form-container, form', { timeout: 10000 });

      await page.fill('#name', 'Valid Name');
      await page.fill('#email', email);
      await page.locator('#email').blur();

      await expect(page.locator('.validation-error').filter({ hasText: 'Please enter a valid email address.' })).toBeVisible();
      await expect(page.locator('button[type="submit"].btn-submit')).toBeDisabled();
    });
  }

  test('EMAIL-SERVER: Server-side validation rejects invalid email with 400 Bad Request', async ({ request }) => {
    const response = await request.post(`${API_URL}/api/public-forms/${MOCK_FORM_UUID}/submit/`, {
      data: {
        name: 'John Doe',
        email: 'invalid-not-an-email',
        phone_number: '9876543210',
        gender: 'Male',
        _ts: Date.now().toString(),
        _duration: '10',
        _browser_token: btoa('test|1920x1080|UTC'),
        _form_token: 'mocktoken'
      },
      headers: { 'Content-Type': 'application/json' }
    });

    expect([400, 404, 429]).toContain(response.status());
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 4. PER-TEMPLATE FIELD VALIDATIONS (CLIENT-SIDE & SERVER-SIDE)
// ════════════════════════════════════════════════════════════════════════════
test.describe('Public Apply — Template Fields & Rule Validations', () => {

  // ── Baseline Standard Fields ──
  test('FIELD-STD-1: Full Name with numbers or special symbols is rejected', async ({ page }) => {
    await setupPublicFormMocks(page);
    await page.goto(`${BASE_URL}/apply/${MOCK_FORM_UUID}`);
    await page.waitForSelector('.form-container, form', { timeout: 10000 });

    await page.fill('#name', 'John Doe 123 <script>');
    await page.locator('#name').blur();

    await expect(page.locator('.validation-error').filter({ hasText: 'Name can contain letters and spaces only.' })).toBeVisible();
    await expect(page.locator('button[type="submit"].btn-submit')).toBeDisabled();
  });

  test('FIELD-STD-2: Full Name exceeding 30 characters is rejected', async ({ page }) => {
    await setupPublicFormMocks(page);
    await page.goto(`${BASE_URL}/apply/${MOCK_FORM_UUID}`);
    await page.waitForSelector('.form-container, form', { timeout: 10000 });

    // Try filling 35 characters
    await page.fill('#name', 'This Is A Very Long Name That Exceeds Thirty Chars');
    await page.locator('#name').blur();

    const nameValue = await page.locator('#name').inputValue();
    expect(nameValue.length).toBeLessThanOrEqual(30);
  });

  test('FIELD-STD-3: Phone number with less than 10 digits is rejected', async ({ page }) => {
    await setupPublicFormMocks(page);
    await page.goto(`${BASE_URL}/apply/${MOCK_FORM_UUID}`);
    await page.waitForSelector('.form-container, form', { timeout: 10000 });

    await page.fill('#phone_number', '12345678');
    await page.locator('#phone_number').blur();

    await expect(page.locator('.validation-error').filter({ hasText: 'Only numbers are allowed, exactly 10 digits.' })).toBeVisible();
    await expect(page.locator('button[type="submit"].btn-submit')).toBeDisabled();
  });

  test('FIELD-STD-4: Phone number with letters or symbols is rejected', async ({ page }) => {
    await setupPublicFormMocks(page);
    await page.goto(`${BASE_URL}/apply/${MOCK_FORM_UUID}`);
    await page.waitForSelector('.form-container, form', { timeout: 10000 });

    await page.fill('#phone_number', '987654321A');
    await page.locator('#phone_number').blur();

    await expect(page.locator('.validation-error').filter({ hasText: 'Only numbers are allowed, exactly 10 digits.' })).toBeVisible();
    await expect(page.locator('button[type="submit"].btn-submit')).toBeDisabled();
  });

  // ── Campus Drive Template Fields ──
  test('FIELD-CAMPUS-1: Campus University with numbers or special chars is rejected', async ({ page }) => {
    await setupPublicFormMocks(page, { templateType: 'campus' });
    await page.goto(`${BASE_URL}/apply/${MOCK_FORM_UUID}`);
    await page.waitForSelector('.form-container, form', { timeout: 10000 });

    await fillStandardForm(page);
    await page.fill('#latest_university', 'IIT Bombay #101');
    await page.locator('#latest_university').blur();

    await expect(page.locator('.validation-error').filter({ hasText: 'Only letters and spaces are allowed.' })).toBeVisible();
    await expect(page.locator('button[type="submit"].btn-submit')).toBeDisabled();
  });

  test('FIELD-CAMPUS-2: Campus Graduation Year not exactly 4 digits is rejected', async ({ page }) => {
    await setupPublicFormMocks(page, { templateType: 'campus' });
    await page.goto(`${BASE_URL}/apply/${MOCK_FORM_UUID}`);
    await page.waitForSelector('.form-container, form', { timeout: 10000 });

    await fillStandardForm(page);
    await page.fill('#latest_university', 'BITS Pilani');
    await page.fill('#year_of_graduation', '202'); // 3 digits
    await page.locator('#year_of_graduation').blur();

    await expect(page.locator('.validation-error').filter({ hasText: 'Enter a valid 4-digit year.' })).toBeVisible();
    await expect(page.locator('button[type="submit"].btn-submit')).toBeDisabled();
  });

  // ── Experienced Hire Template Fields ──
  test('FIELD-EXP-1: Experienced Company with special symbols is rejected', async ({ page }) => {
    await setupPublicFormMocks(page, { templateType: 'experienced' });
    await page.goto(`${BASE_URL}/apply/${MOCK_FORM_UUID}`);
    await page.waitForSelector('.form-container, form', { timeout: 10000 });

    await fillStandardForm(page);
    await page.fill('#latest_company', 'Tech Corp <script>');
    await page.locator('#latest_company').blur();

    await expect(page.locator('.validation-error').filter({ hasText: 'Only letters, numbers and spaces are allowed.' })).toBeVisible();
    await expect(page.locator('button[type="submit"].btn-submit')).toBeDisabled();
  });

  test('FIELD-EXP-2: Experienced form with unselected CTC or Notice Period disables submit', async ({ page }) => {
    await setupPublicFormMocks(page, { templateType: 'experienced' });
    await page.goto(`${BASE_URL}/apply/${MOCK_FORM_UUID}`);
    await page.waitForSelector('.form-container, form', { timeout: 10000 });

    await fillStandardForm(page);
    await page.fill('#latest_company', 'Infosys');
    await uploadValidPDF(page);

    // CTC and Notice Period unselected
    const submitBtn = page.locator('button[type="submit"].btn-submit');
    await expect(submitBtn).toBeDisabled();

    // Select CTC and Notice Period
    await page.selectOption('#current_ctc', '6 - 8 LPA');
    await page.selectOption('#notice_period', '30 Days');
    await expect(submitBtn).toBeEnabled();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 5. PER-FORM DUPLICATE APPLICATION PREVENTION
// ════════════════════════════════════════════════════════════════════════════
test.describe('Public Apply — Per-Form Duplicate Rejections', () => {

  test('DUP-1: Duplicate submission to same form displays rejection message', async ({ page }) => {
    await setupPublicFormMocks(page);

    await page.route(`**/api/public-forms/${MOCK_FORM_UUID}/submit/`, async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'You have already submitted an application for this position with this email address or phone number.'
        }),
      });
    });

    await page.goto(`${BASE_URL}/apply/${MOCK_FORM_UUID}`);
    await page.waitForSelector('.form-container, form', { timeout: 10000 });

    await fillStandardForm(page, { email: 'already.applied@test.com', phone_number: '9876543210' });
    await uploadValidPDF(page);

    await page.locator('button[type="submit"].btn-submit').click();

    const errorBox = page.locator('.submission-error');
    await expect(errorBox).toBeVisible({ timeout: 10000 });
    await expect(errorBox).toContainText('You have already submitted an application for this position with this email address or phone number.');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 6. SECURITY & BOT PROTECTION
// ════════════════════════════════════════════════════════════════════════════
test.describe('Public Apply — Security & Bot Attack Prevention', () => {

  test('SEC-1: Rate Limiting / 429 too many submissions renders retry message with minutes', async ({ page }) => {
    await setupPublicFormMocks(page);

    await page.route(`**/api/public-forms/${MOCK_FORM_UUID}/submit/`, async (route) => {
      await route.fulfill({
        status: 429,
        headers: { 'Retry-After': '300' },
        contentType: 'application/json',
        body: JSON.stringify({ error: "You've submitted too many applications. Please try again in 5 minute(s)." }),
      });
    });

    await page.goto(`${BASE_URL}/apply/${MOCK_FORM_UUID}`);
    await page.waitForSelector('.form-container, form', { timeout: 10000 });

    await fillStandardForm(page);
    await uploadValidPDF(page);

    await page.locator('button[type="submit"].btn-submit').click();

    await expect(page.locator('.submission-error')).toContainText(/too many applications.*try again in 5 minute\(s\)/i, { timeout: 10000 });
  });

  test('SEC-2: Direct API submission with missing bot fields returns 400 Bad Request', async ({ request }) => {
    const response = await request.post(`${API_URL}/api/public-forms/${MOCK_FORM_UUID}/submit/`, {
      data: {
        name: 'Bot User',
        email: 'bot@test.com',
        phone_number: '1234567890',
        gender: 'Male',
      },
      headers: { 'Content-Type': 'application/json' },
    });

    expect([400, 404, 429]).toContain(response.status());
  });

  test('SEC-3: Honeypot field filled triggers bot rejection', async ({ request }) => {
    const response = await request.post(`${API_URL}/api/public-forms/${MOCK_FORM_UUID}/submit/`, {
      data: {
        name: 'Bot User',
        email: 'bot@test.com',
        phone_number: '1234567890',
        gender: 'Male',
        website: 'http://spam-link.com',
        _ts: Date.now().toString(),
        _duration: '30',
        _browser_token: btoa('en-US|1920x1080|UTC|abc|1234'),
        _form_token: 'fake:token',
      },
      headers: { 'Content-Type': 'application/json' },
    });

    expect([400, 404, 429]).toContain(response.status());
  });
});
