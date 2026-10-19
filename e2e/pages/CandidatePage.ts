import { Locator, Page, expect } from '@playwright/test';
import { Person } from '../fixtures/pdf';

export interface FormValues {
  first_name?: string; last_name?: string; phone?: string; email?: string; total_experience?: string | number;
  relevant_experience?: string | number; current_ctc?: string | number; expected_ctc_min?: string | number;
  expected_ctc_max?: string | number; preferred_location?: string; current_location?: string;
  notice_period?: string; gender?: string; work_experience?: string; skills?: string[];
}

/** Page object for /recruiter-workflow-candidate. Selectors live here only. */
export class CandidatePage {
  readonly route = '/recruiter-workflow-candidate';
  readonly rows: Locator;
  readonly search: Locator;
  readonly form: Locator;
  readonly alert: Locator;

  constructor(readonly page: Page) {
    this.rows = page.locator('table.table:not(.skeleton-table) tbody tr').filter({ has: page.locator('.candidate-name') });
    this.search = page.getByPlaceholder('Search candidates...');
    this.form = page.locator('.form-overlay.open .form-card');
    this.alert = page.locator('app-alert-message');
  }

  // ---------- page ----------
  async goto() {
    await this.page.goto(this.route);
    await this.ready();
  }

  /** Loaded = skeleton gone and either rows or the empty state is showing. */
  async ready() {
    await expect(this.search).toBeVisible();
    await expect(this.page.locator('table.skeleton-table')).toHaveCount(0, { timeout: 45_000 });
  }

  async searchFor(text: string) {
    await this.search.fill(text);
    await this.page.waitForTimeout(700);   // the page debounces its search
    await this.ready();
  }

  rowFor(text: string | RegExp): Locator { return this.rows.filter({ hasText: text }); }
  names(): Promise<string[]> { return this.rows.locator('.candidate-name').allInnerTexts().then(a => a.map(s => s.replace(/\s+/g, ' ').trim())); }

  // ---------- add / edit form ----------
  async openAddForm(source = 'Naukri') {
    await this.page.getByRole('button', { name: /Add Candidate/ }).click();
    const select = this.page.locator('.workflow-modal select.workflow-job-select');
    await select.selectOption(source);
    await this.page.locator('.workflow-modal .btn-confirm', { hasText: 'Proceed' }).click();
    await expect(this.form).toBeVisible();
  }

  async upload(file: { name: string; mimeType: string; buffer: Buffer }) {
    await this.page.locator('.form-overlay.open input[type="file"]').setInputFiles(file);
  }

  /** Waits for the AI spinner to go away. Real parsing can take up to ~2 minutes. */
  async waitParsed(timeoutMs = 150_000) {
    await expect(this.page.locator('.parsing-overlay')).toHaveCount(0, { timeout: timeoutMs });
  }

  field(name: string) { return this.form.locator(`[formControlName="${name}"]`); }

  async fill(v: FormValues) {
    const set = async (n: string, val: unknown) => { if (val !== undefined) await this.field(n).fill(String(val)); };
    await set('first_name', v.first_name);
    await set('last_name', v.last_name);
    if (v.phone !== undefined) await this.form.locator('.phone-numbers-list input').first().fill(v.phone);
    await set('email', v.email);
    await set('total_experience', v.total_experience);
    await set('relevant_experience', v.relevant_experience);
    await set('current_ctc', v.current_ctc);
    await set('expected_ctc_min', v.expected_ctc_min);
    await set('expected_ctc_max', v.expected_ctc_max);
    await set('preferred_location', v.preferred_location);
    await set('current_location', v.current_location);
    await set('work_experience', v.work_experience);
    if (v.notice_period) await this.field('notice_period').selectOption(v.notice_period);
    if (v.gender) await this.field('gender').selectOption(v.gender);
    if (v.skills) {
      const box = this.form.getByPlaceholder('+ Add skill (press Enter)');
      for (const s of v.skills) { await box.fill(s); await box.press('Enter'); }
    }
  }

  /** Fill every required field from a person; overrides win. */
  async fillPerson(p: Person, over: FormValues = {}) {
    await this.fill({
      first_name: p.first, last_name: p.last, phone: p.phone, email: p.email, total_experience: p.years,
      relevant_experience: Math.max(p.years - 1, 0), current_ctc: 8.5, expected_ctc_min: 10, expected_ctc_max: 14,
      preferred_location: p.city, current_location: p.city, notice_period: 'Less than 30 Days', gender: 'Female',
      work_experience: p.title, skills: p.skills.split(',').map(s => s.trim()), ...over,
    });
  }

  async submit() { await this.form.locator('button[type="submit"]').click(); }
  async cancelForm() { await this.form.getByRole('button', { name: 'Cancel' }).click(); }
  hints(): Promise<string[]> { return this.form.locator('.hint').allInnerTexts(); }
  async formValue(name: string) { return this.field(name).inputValue(); }

  /** Add via the UI, return once the form closed (success) */
  async addCandidate(p: Person, over: FormValues = {}) {
    await this.openAddForm();
    await this.fillPerson(p, over);
    await this.submit();
    await expect(this.page.locator('.form-overlay.open')).toHaveCount(0, { timeout: 30_000 });
  }

  // ---------- alerts (app-alert-message) ----------
  alertText() { return this.alert.innerText(); }
  async closeAlert() { await this.alert.getByRole('button').first().click(); }

  // ---------- filters / sort ----------
  async openFilters() { await this.page.getByRole('button', { name: 'Filter', exact: true }).click(); }
  async applyFilter(values: { name?: string; location?: string; skills?: string; email?: string; phone?: string; current_ctc?: string }) {
    await this.openFilters();
    for (const [k, v] of Object.entries(values)) {
      if (v !== undefined) await this.page.locator(`#filter-${k === 'current_ctc' ? 'ctc' : k}`).fill(v);
    }
    await this.page.locator('.filter-panel-actions .apply-button').click();
    await this.ready();
  }
  async clearFilters() {
    await this.openFilters();
    await this.page.locator('.filter-panel-actions .clear-button').click();
    await this.page.keyboard.press('Escape');
    await this.ready();
  }
  async sort(order: 'a-z' | 'z-a' | 'none') { await this.page.locator('select.sort-select').selectOption(order); }

  // ---------- rating ----------
  async openRating(row: Locator) { await row.locator('button.rating').click(); await expect(this.page.locator('.rating-modal-container')).toBeVisible(); }
  async rateAll(score: number, notes: string) {
    const m = this.page.locator('.rating-modal-container');
    await expect(m.locator('.criterion-select').first()).toBeVisible({ timeout: 20_000 });
    const sel = m.locator('.criterion-select');
    for (let i = 0; i < await sel.count(); i++) await sel.nth(i).selectOption(String(score));
    await m.locator('textarea').fill(notes);
    await m.getByRole('button', { name: 'Submit Rating' }).click();
  }

  // ---------- ATS ----------
  async selectRow(row: Locator) { await row.locator('input.checkbox').check(); }
  async addSelectedToAts(jobLabel: RegExp) {
    await this.page.getByRole('button', { name: 'Add to ATS' }).click();
    const m = this.page.locator('.workflow-modal');
    await m.locator('select.workflow-job-select').selectOption({ label: await this.optionLabel(m.locator('select.workflow-job-select'), jobLabel) });
    await m.getByRole('button', { name: 'Add to Workflow' }).click();
  }
  private async optionLabel(select: Locator, re: RegExp) {
    const labels = await select.locator('option').allInnerTexts();
    const hit = labels.map(l => l.trim()).find(l => re.test(l));
    if (!hit) throw new Error(`No job option matching ${re}. Options: ${labels.join(' | ')}`);
    return hit;
  }

  // ---------- admin ----------
  get deleteButton() { return this.page.getByRole('button', { name: /^\s*Delete\s*$/ }); }
  get exportButton() { return this.page.getByRole('button', { name: /^\s*Export\s*$/ }); }
}
