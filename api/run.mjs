#!/usr/bin/env node
// Usage: node api/run.mjs <local|dev|prod> [smoke|full|data]
//   smoke : folder "00 Smoke" only (the only thing allowed on prod)
//   full  : the static collection (local/dev)
//   data  : data-driven scenarios generated from e2e/data/*.json (local/dev)
// Password: QA_PASSWORD in your shell, or api/environments/<env>.local.json (git-ignored copy).
import { spawnSync } from 'node:child_process';
import readline from 'node:readline/promises';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const [env, mode = 'smoke'] = process.argv.slice(2);
if (!['local', 'dev', 'prod'].includes(env) || !['smoke', 'full', 'data'].includes(mode)) {
  console.error('Usage: node api/run.mjs <local|dev|prod> [smoke|full|data]');
  process.exit(2);
}
if (env === 'prod' && mode !== 'smoke') { console.error('Prod runs smoke only.'); process.exit(2); }
if (env === 'prod' && !process.argv.includes('--yes')) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const a = await rl.question('This will run against PROD (tagged data, cleaned up). Type "prod" to continue: ');
  rl.close();
  if (a.trim() !== 'prod') { console.error('Aborted.'); process.exit(1); }
}

const localEnv = path.join(here, 'environments', `${env}.local.json`);
const envFile = fs.existsSync(localEnv) ? localEnv : path.join(here, 'environments', `${env}.postman_environment.json`);
const reportDir = path.join(here, 'reports');
fs.mkdirSync(reportDir, { recursive: true });

const extraVars = [];
if (process.env.QA_BOOTSTRAP_TOKEN && process.env.QA_API_URL) {
  try {
    const apiUrl = process.env.QA_API_URL.replace(/\/?$/, '/');
    const runId = Math.random().toString(16).slice(2, 10).padEnd(8, '0');
    const r = await fetch(apiUrl + 'api/super-admin/qa/accounts/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.QA_BOOTSTRAP_TOKEN}` },
      body: JSON.stringify({ run_id: runId, confirm_env: env === 'prod' ? 'prod' : undefined }),
    });
    const body = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(`HTTP ${r.status} ${body.error || ''}`);
    extraVars.push('--env-var', `base_url=${apiUrl}`, '--env-var', `qa_password=${body.accounts.super.password}`, '--env-var', `runId=${runId}`);
    for (const [role, c] of Object.entries(body.accounts)) extraVars.push('--env-var', `email_${role}=${c.email}`);
    console.log(`Temporary QA logins created for run ${runId} (deleted again by the cleanup step).`);
  } catch (e) {
    console.warn(`Could not create temporary QA logins (${e.message}); falling back to the environment file.`);
  }
}
delete process.env.QA_BOOTSTRAP_TOKEN;
const args = ['newman', 'run'];
if (mode === 'data') {
  spawnSync('node', [path.join(here, '..', 'tools', 'data-to-newman.mjs'), 'candidate'], { stdio: 'inherit' });
  args.push(path.join(here, 'collections', 'candidate-data.postman_collection.json'), '-d', path.join(here, 'data', 'candidate-api.json'));
} else {
  args.push(path.join(here, 'collections', 'candidate.postman_collection.json'));
  if (mode === 'smoke') args.push('--folder', '00 Smoke (safe on prod)');
}
args.push('-e', envFile, '--delay-request', '100', '--reporters', 'cli,htmlextra,json',
  '--reporter-htmlextra-export', path.join(reportDir, `${env}-${mode}.html`),
  '--reporter-json-export', path.join(reportDir, `${env}-${mode}.json`));
args.push(...extraVars);
if (process.env.QA_PASSWORD && !extraVars.length) args.push('--env-var', `qa_password=${process.env.QA_PASSWORD}`);
// progress: tell the Test Lab how many requests to expect
try {
  const count = items => items.reduce((n, i) => n + (i.item ? count(i.item) : 1), 0);
  const col = JSON.parse(fs.readFileSync(args[2], 'utf8'));
  let total;
  if (mode === 'data') total = JSON.parse(fs.readFileSync(path.join(here, 'data', 'candidate-api.json'), 'utf8')).length;
  else if (mode === 'smoke') total = count(col.item.find(f => f.name.startsWith('00 Smoke')).item);
  else total = count(col.item);
  console.log('@@QA ' + JSON.stringify({ type: 'begin', total }));
} catch { /* progress is optional */ }
const r = spawnSync('npx', args, { stdio: 'inherit', shell: true });
process.exit(r.status ?? 1);
