/**
 * Candidate page smoke test: safe for dev and prod.
 * Reads the page as each role, creates ONE tagged candidate by hand and removes it again.
 */
import { test, expect } from '../../fixtures/roles';
import { Api } from '../../fixtures/api';
import { CandidatePage } from '../../pages/CandidatePage';

test.describe.configure({ mode: 'serial' });

for (const role of ['recruiter1', 'admin', 'super'] as const) {
  test(`candidate page loads for ${role}`, { tag: ['@smoke'] }, async ({ as }) => {
    const a = await as(role);
    const consoleErrors: string[] = [];
    a.page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
    const cp = new CandidatePage(a.page);
    await cp.goto();
    await expect(a.page).toHaveURL(/recruiter-workflow-candidate/);
    await expect(a.page.getByRole('button', { name: /Add Candidate/ })).toBeVisible();
    expect.soft(consoleErrors.filter(e => !/favicon|ResizeObserver/i.test(e)), 'console errors').toEqual([]);
  });
}

test('recruiter creates a tagged candidate, finds it, and it is removed again', { tag: ['@smoke'] }, async ({ as, who, playwright }) => {
  const a = await as('recruiter1');
  const cp = new CandidatePage(a.page);
  const p = who('a-smoke');
  const last = 'Smoke';
  await cp.goto();
  await cp.openAddForm();
  await cp.fillPerson(p, { last_name: last });
  await cp.submit();
  await expect(a.page.locator('.form-overlay.open')).toHaveCount(0, { timeout: 30_000 });
  await cp.searchFor(p.first);
  await expect(cp.rowFor(new RegExp(`${p.first}\\s+${last}`))).toHaveCount(1, { timeout: 20_000 });

  // Remove it now (the global teardown would also do it). Needs the super admin login.
  const sup = await Api.create(playwright, 'super');
  const list = await sup.get('api/candidates/', { paginate: 'false' });
  const row = (await list.json()).find((c: any) => c.email?.toLowerCase() === p.email.toLowerCase());
  if (row) expect((await sup.delete(`api/candidates/${row.id}/`)).status()).toBe(204);
  await sup.dispose();
});
