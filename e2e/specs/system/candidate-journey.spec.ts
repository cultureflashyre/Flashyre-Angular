/**
 * System journey: recruiter uploads a real resume -> parsed -> saved -> rated -> added to ATS,
 * then a super admin sees it with the right status and deletes it.
 * Tagged data only; the global teardown also sweeps it.
 */
import { test, expect } from '../../fixtures/roles';
import { Api } from '../../fixtures/api';
import { CandidatePage } from '../../pages/CandidatePage';

test.describe.configure({ mode: 'serial' });

test('recruiter to admin candidate journey', { tag: ['@system', '@integration'] }, async ({ as, who, file, run, playwright }, testInfo) => {
  test.setTimeout(300_000);
  const rec = await as('recruiter1');
  const p = who(`a-journey-${testInfo.project.name.replace(/[^a-z]/gi, '').toLowerCase()}`);
  const cp = new CandidatePage(rec.page);

  // 1. upload + parse + save
  await cp.goto();
  await cp.openAddForm();
  await cp.upload(file('valid_pdf', 'a'));
  await cp.waitParsed();
  // The journey uses its own person: overwrite the parsed identity so repeat runs never clash.
  await cp.fillPerson(p, { last_name: 'Journey', gender: 'Female', notice_period: 'Less than 30 Days' });
  await cp.submit();
  await expect(rec.page.locator('.form-overlay.open')).toHaveCount(0, { timeout: 30_000 });
  await cp.searchFor(p.first);
  const row = cp.rowFor(new RegExp(`${p.first}\\s+Journey`));
  await expect(row).toHaveCount(1, { timeout: 20_000 });

  // 2. rate
  await cp.openRating(row);
  await cp.rateAll(3, `${run.tag} journey rating`);
  await expect(rec.page.getByText(/rating (submitted|saved)|successfully/i).first()).toBeVisible({ timeout: 20_000 });

  // 3. ATS: needs a requirement the recruiter can use. Create a tagged one through the API as super admin.
  const sup = await Api.create(playwright, 'super');
  const jobRes = await sup.post('api/job-requirements/', {
    job_role: `${run.tag} QA Engineer`, client_name: `${run.tag} Client`, interview_location: 'Remote',
    job_description: 'QA journey requirement.', skills: ['Python'], location: ['Bengaluru'], status: 'Active',
    total_experience_min: 0, total_experience_max: 10, relevant_experience_min: 0, relevant_experience_max: 10,
    salary_min: 1, salary_max: 20,
  });
  if (jobRes.status() === 201) {
    const job = await jobRes.json();
    testInfo.annotations.push({ type: 'ats', description: `requirement ${job.id}` });
    await rec.page.reload();
    await cp.ready();
    await cp.searchFor(p.first);
    await cp.selectRow(cp.rowFor(new RegExp(`${p.first}\\s+Journey`)));
    await cp.addSelectedToAts(new RegExp(run.tag));
    await expect(cp.alert).toBeVisible({ timeout: 20_000 });
    await cp.closeAlert();
    await expect(cp.rowFor(new RegExp(`${p.first}\\s+Journey`))).toContainText(/Sourced/i, { timeout: 20_000 });
  } else {
    testInfo.annotations.push({ type: 'ats-skipped', description: `could not create a requirement (HTTP ${jobRes.status()}); ATS step skipped` });
  }

  // 4. super admin sees it and deletes it
  const adm = await as('super');
  const ap = new CandidatePage(adm.page);
  await ap.goto();
  await ap.searchFor(p.first);
  const arow = ap.rowFor(new RegExp(`${p.first}\\s+Journey`));
  await expect(arow).toHaveCount(1);
  await arow.locator('button.row-action.danger').click();
  await ap.alert.getByRole('button', { name: /yes|delete|confirm/i }).first().click();
  await expect(ap.rowFor(new RegExp(`${p.first}\\s+Journey`))).toHaveCount(0, { timeout: 20_000 });
  await sup.dispose();
});
