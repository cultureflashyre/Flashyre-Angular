/**
 * Candidate page non-functional checks: speed budget, accessibility, resilience.
 * Local and dev only; the runner never runs these on prod (prod is smoke only).
 */
import { test, expect } from '../../fixtures/roles';
import { CandidatePage } from '../../pages/CandidatePage';

const BUDGET_MS = Number(process.env['LIST_BUDGET_MS'] ?? 8000);

test('candidate list is ready within the time budget', { tag: ['@nonfunctional', '@perf'] }, async ({ as }) => {
  const a = await as('recruiter1');
  const cp = new CandidatePage(a.page);
  const t0 = Date.now();
  await cp.goto();
  const ms = Date.now() - t0;
  test.info().annotations.push({ type: 'list-ready-ms', description: String(ms) });
  expect(ms, `list ready in ${ms} ms (budget ${BUDGET_MS})`).toBeLessThan(BUDGET_MS);
});

test('candidate page has no serious accessibility violations', { tag: ['@nonfunctional', '@a11y'] }, async ({ as }) => {
  let AxeBuilder: any;
  try { AxeBuilder = (await import('@axe-core/playwright')).default; }
  catch { test.skip(true, 'Install it first: npm i -D @axe-core/playwright'); }
  const a = await as('recruiter1');
  const cp = new CandidatePage(a.page);
  await cp.goto();
  const r = await new AxeBuilder({ page: a.page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  const bad = r.violations.filter((v: any) => ['serious', 'critical'].includes(v.impact));
  expect(bad.map((v: any) => `${v.id}: ${v.help} (${v.nodes.length})`)).toEqual([]);
});

test('API failure shows the page, not a blank screen', { tag: ['@nonfunctional', '@resilience'] }, async ({ as }) => {
  const a = await as('recruiter1');
  await a.page.route('**/api/candidates/**', r => r.fulfill({ status: 500, body: '{"detail":"boom"}', contentType: 'application/json' }));
  await a.page.goto('/recruiter-workflow-candidate');
  await expect(a.page.getByPlaceholder('Search candidates...')).toBeVisible({ timeout: 30_000 });
  a.serverErrors.length = 0;                           // the 500s above are intentional
});

test('slow network still loads the list', { tag: ['@nonfunctional', '@resilience'] }, async ({ as }) => {
  const a = await as('recruiter1');
  await a.page.route('**/api/candidates/**', async r => { await new Promise(res => setTimeout(res, 3000)); await r.continue(); });
  const cp = new CandidatePage(a.page);
  await cp.goto();
  await expect(cp.search).toBeVisible();
});

test('offline after load does not crash the page', { tag: ['@nonfunctional', '@resilience'] }, async ({ as }) => {
  const a = await as('recruiter1');
  const cp = new CandidatePage(a.page);
  await cp.goto();
  await a.page.context().setOffline(true);
  await cp.search.fill('anything');
  await a.page.waitForTimeout(1000);
  await expect(cp.search).toBeVisible();
  await a.page.context().setOffline(false);
});

test('search box does not run script text', { tag: ['@nonfunctional', '@security'] }, async ({ as }) => {
  const a = await as('recruiter1');
  const dialogs: string[] = [];
  a.page.on('dialog', d => { dialogs.push(d.message()); d.dismiss(); });
  const cp = new CandidatePage(a.page);
  await cp.goto();
  await cp.searchFor('<img src=x onerror=alert(1)>');
  expect(dialogs).toEqual([]);
});
