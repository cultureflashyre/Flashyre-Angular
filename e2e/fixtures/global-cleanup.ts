import { test as teardown } from '@playwright/test';
import fs from 'fs';
import { creds, readRun, statePath } from '../config/env';
import { Api } from './api';

teardown('remove this run\'s QA data', async ({ playwright }) => {
  const run = readRun();
  if (!creds('super') || !fs.existsSync(statePath('super'))) {
    console.warn(`[cleanup] no super admin login, cannot clean run ${run.runId}. Run: npm run qa:sweep -- --env ${run.env}`);
    return;
  }
  const api = await Api.create(playwright, 'super');
  const r = await api.post('api/super-admin/qa/cleanup/', { run_id: run.runId, since: run.startedAt });
  console.log(`[cleanup] run ${run.runId} -> HTTP ${r.status()} ${JSON.stringify(await api.json(r))}`);
  await api.dispose();
});
