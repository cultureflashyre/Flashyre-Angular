#!/usr/bin/env node
// Usage: node e2e/run.mjs <local|dev|prod> [playwright args...]
// Adds environment rules: dev defaults to smoke+regression+integration; prod is smoke only,
// Chromium only (unless --all-browsers) and needs you to type "prod".
import { spawn } from 'node:child_process';
import readline from 'node:readline/promises';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const [env, ...rest] = process.argv.slice(2);
if (!['local', 'dev', 'prod'].includes(env)) {
  console.error('First argument must be local, dev or prod.');
  process.exit(2);
}
const args = [...rest];
const allBrowsers = args.includes('--all-browsers');
const idx = args.indexOf('--all-browsers');
if (idx >= 0) args.splice(idx, 1);
const hasGrep = args.some(a => a === '--grep' || a.startsWith('--grep='));
const hasProject = args.some(a => a === '--project' || a.startsWith('--project='));

if (env === 'prod') {
  const requested = args.find(a => a.startsWith('--grep='))?.slice(7) ?? args[args.indexOf('--grep') + 1] ?? '';
  if (hasGrep && !/^@smoke$/.test(requested)) {
    console.error('Prod runs smoke tests only. Remove --grep or use --grep @smoke.');
    process.exit(2);
  }
  if (!hasGrep) args.push('--grep', '@smoke');
  if (!allBrowsers && !hasProject) args.push('--project=chromium');
  if (!args.includes('--yes')) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const a = await rl.question('This will run against PROD and create/clean up tagged QA data. Type "prod" to continue: ');
    rl.close();
    if (a.trim() !== 'prod') { console.error('Aborted.'); process.exit(1); }
  } else {
    args.splice(args.indexOf('--yes'), 1);
  }
} else if (env === 'dev' && !hasGrep) {
  args.push('--grep', '@smoke|@regression|@integration');
}
// smoke checks the same thing in every browser: one browser is enough unless asked
{
  const g = args.find(a => a.startsWith('--grep='))?.slice(7) ?? args[args.indexOf('--grep') + 1] ?? '';
  if (g === '@smoke' && !allBrowsers && !args.some(a => a === '--project' || a.startsWith('--project='))) args.push('--project=chromium');
}

const runId = crypto.randomBytes(4).toString('hex');
const childEnv = { ...process.env };

// Temporary logins: when the Test Lab passes the admin's session, Django creates throw-away QA accounts for this run
// (qa-<runid>-<role>@...) and cleanup removes them. No passwords have to be stored anywhere.
if (process.env.QA_BOOTSTRAP_TOKEN && process.env.QA_API_URL) {
  try {
    const api = process.env.QA_API_URL.replace(/\/?$/, '/');
    const r = await fetch(api + 'api/super-admin/qa/accounts/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.QA_BOOTSTRAP_TOKEN}` },
      body: JSON.stringify({ run_id: runId, confirm_env: env === 'prod' ? 'prod' : undefined }),
    });
    const body = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(`HTTP ${r.status} ${body.error || ''}`);
    for (const [role, c] of Object.entries(body.accounts)) {
      childEnv[`QA_${role.toUpperCase()}_EMAIL`] = c.email;
      childEnv[`QA_${role.toUpperCase()}_PASSWORD`] = c.password;
    }
    childEnv.API_URL = api;
    console.log(`Temporary QA logins created for run ${runId} (they are deleted when the run ends).`);
  } catch (e) {
    console.warn(`Could not create temporary QA logins (${e.message}); falling back to .env credentials.`);
  }
}
delete childEnv.QA_BOOTSTRAP_TOKEN;

// no logins at all: stop here instead of "passing" with every test skipped
{
  const here = path.dirname(fileURLToPath(import.meta.url));
  const envFile = path.join(here, 'config', `.env.${env}`);
  const fileHas = fs.existsSync(envFile) && /^\s*QA_(\w+_)?PASSWORD\s*=\s*\S+/m.test(fs.readFileSync(envFile, 'utf8'));
  const procHas = Object.keys(childEnv).some(k => /^QA_(\w+_)?PASSWORD$/.test(k) && childEnv[k]);
  if (!fileHas && !procHas) {
    console.error(`No QA logins for ${env}. Either start the run from the Test Lab tab (it creates temporary logins), or set QA_PASSWORD in e2e/config/.env.${env}.`);
    process.exit(2);
  }
}

console.log(`QA run ${runId} on ${env}`);
const child = spawn('npx', ['playwright', 'test', '-c', 'playwright.live.config.ts', ...args], {
  stdio: 'inherit',
  shell: true,
  env: { ...childEnv, TEST_ENV: env, QA_RUN_ID: runId, QA_RUN_STARTED: new Date().toISOString(), ALLOW_PROD: env === 'prod' ? '1' : process.env.ALLOW_PROD ?? '' },
});
child.on('exit', code => process.exit(code ?? 1));
