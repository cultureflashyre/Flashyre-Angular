import { test as base, expect, Page, PlaywrightWorkerArgs } from '@playwright/test';
type Playwright = PlaywrightWorkerArgs['playwright'];
import fs from 'fs';
import { Role, RunInfo, creds, readRun, statePath } from '../config/env';
import { Api } from './api';
import { Person, TestFile, buildFile, person } from './pdf';

export interface Actor { role: Role; page: Page; api: Api; serverErrors: string[]; }

interface Fixtures {
  run: RunInfo;
  as: (role: Role) => Promise<Actor>;
  anon: () => Promise<Api>;
  who: (key: string, n?: number) => Person;
  file: (kind: string, key?: string) => TestFile;
}

export const test = base.extend<Fixtures>({
  run: async ({}, use) => { await use(readRun()); },

  as: async ({ browser, playwright }, use, testInfo) => {
    const opened: Actor[] = [];
    const ctxs: any[] = [];
    await use(async (role: Role) => {
      if (!creds(role) || !fs.existsSync(statePath(role))) {
        testInfo.skip(true, `No QA login for ${role} (see e2e/config/.env.example)`);
      }
      const context = await browser.newContext({ storageState: statePath(role) });
      ctxs.push(context);
      const page = await context.newPage();
      const actor: Actor = { role, page, api: await Api.create(playwright, role), serverErrors: [] };
      page.on('response', r => {
        if (r.status() >= 500) actor.serverErrors.push(`${r.status()} ${r.request().method()} ${r.url()}`);
      });
      opened.push(actor);
      return actor;
    });
    for (const a of opened) {
      await a.api.dispose();
      expect.soft(a.serverErrors, `server errors seen by ${a.role}`).toEqual([]);
    }
    for (const c of ctxs) await c.close();
  },

  anon: async ({ playwright }, use) => {
    const made: Api[] = [];
    await use(async () => { const a = await Api.create(playwright, null); made.push(a); return a; });
    for (const a of made) await a.dispose();
  },

  who: async ({ run }, use) => { await use((key, n = 0) => person(key, run.runId, run.letters, n)); },
  file: async ({ run, who }, use) => { await use((kind, key = 'a') => buildFile(kind, who(key), run.tag)); },
});

export { expect };
