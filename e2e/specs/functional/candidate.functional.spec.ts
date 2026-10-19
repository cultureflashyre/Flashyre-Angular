/**
 * Candidate page: data-driven functional / integration / security scenarios.
 * Values come from e2e/data/candidate.json. Add a scenario there; add code here only for a new action.
 *
 * Run:  npm run e2e:page -- candidate --env local     (see package.json)
 */
import { test, expect } from '../../fixtures/roles';
import { Api } from '../../fixtures/api';
import { Scenario, loadScenarios } from '../../fixtures/data';
import { buildFile, person } from '../../fixtures/pdf';
import { readRun, creds } from '../../config/env';
import { CandidatePage } from '../../pages/CandidatePage';

const run = readRun();
const scenarios = loadScenarios('candidate', run);
const seeds: Record<string, number> = {};
const SEED_KEYS = ['a', 'b', 'c', 'd', 'y', 'z'];

test.describe.configure({ mode: 'serial' });

function seedForm(p: ReturnType<typeof person>, over: Record<string, any> = {}) {
  return {
    first_name: p.first, last_name: p.last, phone_number: p.phone, email: p.email, skills: p.skills,
    total_experience: String(p.years), relevant_experience: String(Math.max(p.years - 1, 0)),
    current_location: p.city, work_experience: p.title, gender: 'Female', ...over,
  };
}

test.beforeAll(async ({ playwright }) => {
  if (!creds('recruiter1')) return;               // every test then skips itself
  const api = await Api.create(playwright, 'recruiter1');
  for (const key of SEED_KEYS) {
    const r = await api.postForm('api/candidates/', seedForm(person(key, run.runId, run.letters)));
    if (r.status() !== 201) throw new Error(`Seeding candidate ${key} failed: HTTP ${r.status()} ${await r.text()}`);
    seeds[key] = (await r.json()).id;
  }
  await api.dispose();
});

test.afterAll(async ({ playwright }) => {
  if (!creds('super')) return;                    // global teardown sweeps whatever is left
  const api = await Api.create(playwright, 'super');
  for (const id of Object.values(seeds)) await api.delete(`api/candidates/${id}/`);
  await api.dispose();
});

const proj = (name: string) => name.replace(/[^a-z]/gi, '').toLowerCase();
const subst = (s: string) => s.replace(/\{\{id:(\w)\}\}/g, (_, k) => String(seeds[k]));

for (const s of scenarios) {
  test(`${s.id} ${s.title}`, { tag: s.tags.map(t => `@${t}`) }, async ({ as, anon, who }, testInfo) => {
    if (s.knownIssue) testInfo.annotations.push({ type: 'known-issue', description: s.knownIssue });
    const pname = proj(testInfo.project.name);
    const uniq = (base: string) => `${base}-${s.id.toLowerCase().replace(/[^a-z0-9]/g, '')}-${pname}`;
    const uiLast = `Ui${pname}`.slice(0, 15);

    switch (s.action) {
      case 'formValidation': {
        const a = await as(s.role as any);
        const cp = new CandidatePage(a.page);
        const dialogs: string[] = [];
        a.page.on('dialog', d => { dialogs.push(d.message()); d.dismiss(); });
        await cp.goto();
        await cp.openAddForm();
        const { _skipFill, ...over } = s.input ?? {};
        if (!_skipFill) await cp.fillPerson(who(uniq('a')), over);
        await cp.submit();
        await cp.form.locator('input,select').evaluateAll(els => els.forEach((e: any) => { e.focus(); e.blur(); }));
        const text = (await cp.hints()).join(' | ');
        for (const h of s.expect?.hints ?? []) expect(text, `hints: ${text}`).toContain(h);
        if (s.expect?.stillOpen) await expect(cp.form).toBeVisible();
        if (s.expect?.noDialog) expect(dialogs).toEqual([]);
        break;
      }

      case 'manualCreate': {
        const a = await as(s.role as any);
        const cp = new CandidatePage(a.page);
        const p = who(uniq(s.input!.person));
        await cp.goto();
        await cp.openAddForm();
        await cp.fillPerson(p, { last_name: uiLast, ...(s.input!.over ?? {}) });
        await cp.submit();
        await expect(a.page.locator('.form-overlay.open')).toHaveCount(0, { timeout: 30_000 });
        await cp.searchFor(p.first);
        await expect(cp.rowFor(new RegExp(`${p.first}\\s+${uiLast}`))).toHaveCount(1, { timeout: 20_000 });
        break;
      }

      case 'uploadFile': {
        const a = await as(s.role as any);
        const cp = new CandidatePage(a.page);
        const dialogs: string[] = [];
        a.page.on('dialog', d => { dialogs.push(d.message()); d.dismiss(); });
        const p = who(uniq('a'));
        const f = buildFile(s.files![0], p, run.tag);
        await cp.goto();
        await cp.openAddForm();
        await cp.upload(f);
        const out = s.expect!.outcome;
        if (out === 'parsed') {
          await cp.waitParsed();
          const email = await cp.formValue('email');
          if (s.expect!.emailRequired) {
            expect(email).toBe('');
            await cp.submit();
            await cp.form.locator('input').evaluateAll(els => els.forEach((e: any) => { e.focus(); e.blur(); }));
            expect((await cp.hints()).join(' ')).toContain('Email is required.');
          } else {
            expect(email.toLowerCase()).toBe(p.email.toLowerCase());
            expect(await cp.formValue('first_name')).toContain(p.first.slice(0, 4));
            expect((await cp.form.locator('.chip-pill').allInnerTexts()).join(' ').toLowerCase()).toMatch(/python|django|docker|postgres/);
          }
        } else if (out === 'alert') {
          await expect(cp.alert).toBeVisible({ timeout: 150_000 });
          expect(await cp.alertText()).toMatch(new RegExp(s.expect!.alert, 'i'));
        } else if (out === 'dialog') {
          await expect.poll(() => dialogs.join(' '), { timeout: 30_000 }).toMatch(new RegExp(s.expect!.dialog, 'i'));
        } else {                                   // 'safe': any answer is fine except a crash
          await expect.poll(async () =>
            (await a.page.locator('.parsing-overlay').count()) === 0 || await cp.alert.isVisible(), { timeout: 150_000 }).toBeTruthy();
          await expect(cp.search).toBeVisible();
        }
        break;
      }

      case 'search': {
        const a = await as(s.role as any);
        const cp = new CandidatePage(a.page);
        await cp.goto();
        const term = s.expect?.upper ? s.input!.term.toUpperCase() : s.input!.term;
        await cp.searchFor(term);
        if (s.expect?.rows !== undefined) await expect(cp.rows).toHaveCount(s.expect.rows);
        if (s.expect?.minRows) expect(await cp.rows.count()).toBeGreaterThanOrEqual(s.expect.minRows);
        await expect(cp.search).toBeVisible();
        break;
      }

      case 'sort': {
        const a = await as(s.role as any);
        const cp = new CandidatePage(a.page);
        await cp.goto();
        await cp.searchFor(s.input!.term);
        await cp.sort(s.input!.order);
        await a.page.waitForTimeout(500);
        const names = await cp.names();
        expect(names.length).toBeGreaterThanOrEqual(4);
        const asc = [...names].sort((x, y) => x.localeCompare(y, undefined, { sensitivity: 'base' }));
        expect(names).toEqual(s.input!.order === 'a-z' ? asc : [...asc].reverse());
        break;
      }

      case 'filter':
      case 'filterClear': {
        const a = await as(s.role as any);
        const cp = new CandidatePage(a.page);
        await cp.goto();
        if (s.input!.term) await cp.searchFor(s.input!.term);
        await cp.applyFilter(s.input!.filter);
        if (s.action === 'filterClear') {
          await expect(cp.rows).toHaveCount(0);
          await cp.clearFilters();
          expect(await cp.rows.count()).toBeGreaterThanOrEqual(s.expect!.minRows);
          break;
        }
        if (s.expect?.rows !== undefined) await expect(cp.rows).toHaveCount(s.expect.rows);
        for (const k of s.expect?.include ?? []) {
          await expect(cp.rowFor(who(k).first).first()).toBeVisible();
        }
        for (const k of s.expect?.exclude ?? []) {
          await expect(cp.rowFor(who(k).first)).toHaveCount(0);
        }
        break;
      }

      case 'adminControls': {
        const a = await as(s.role as any);
        const cp = new CandidatePage(a.page);
        await cp.goto();
        if (s.expect!.visible) {
          await expect(cp.deleteButton).toBeVisible();
          await expect(cp.exportButton).toBeVisible();
        } else {
          await expect(cp.deleteButton).toHaveCount(0);
          await expect(cp.exportButton).toHaveCount(0);
        }
        break;
      }

      case 'api': {
        const api = s.role === 'anonymous' ? await anon() : (await as(s.role as any)).api;
        const path = subst(s.input!.path);
        const method = s.input!.method as string;
        const form = s.input!.form ? Object.fromEntries(Object.entries(s.input!.form).map(([k, v]) => [k, subst(String(v))])) : undefined;
        let res;
        if (method === 'GET') res = await api.ctx.get(path);
        else if (method === 'DELETE') res = await api.ctx.delete(path);
        else if (method === 'PATCH') res = await api.ctx.patch(path, { multipart: form ?? {} });
        else if (form) res = await api.ctx.post(path, { multipart: form });
        else res = await api.ctx.post(path, { data: s.input!.json ?? {} });
        expect(s.expect!.status, `${method} ${path} -> ${res.status()}`).toContain(res.status());
        break;
      }

      case 'apiCreate': {
        const a = await as(s.role as any);
        const p = who(uniq(s.input!.person));
        const { _twice, ...over } = s.input!.form ?? {};
        const form = seedForm(p, over);
        const first = await a.api.postForm('api/candidates/', form);
        if (_twice) {
          expect(first.status()).toBe(201);
          const second = await a.api.postForm('api/candidates/', form);
          expect(s.expect!.status).toContain(second.status());
          break;
        }
        expect(s.expect!.status, `HTTP ${first.status()} ${await first.text()}`).toContain(first.status());
        if (s.expect!.storedLiteral && first.status() === 201) {
          const d = await (await a.api.get(`api/candidates/${(await first.json()).id}/`)).json();
          expect(d.skills).toBe(over.skills);
        }
        break;
      }

      default:
        throw new Error(`Unknown action "${s.action}" in scenario ${s.id}`);
    }
  });
}
