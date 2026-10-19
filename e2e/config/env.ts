import fs from 'fs';
import path from 'path';

export type TestEnv = 'local' | 'dev' | 'prod';
export type Role = 'recruiter1' | 'recruiter2' | 'admin' | 'super' | 'client';
export const ROLES: Role[] = ['recruiter1', 'recruiter2', 'admin', 'super', 'client'];

export const TEST_ENV = (process.env['TEST_ENV'] || 'local') as TestEnv;

if (TEST_ENV === 'prod' && process.env['ALLOW_PROD'] !== '1') {
  throw new Error(
    'TEST_ENV=prod is blocked. Run through `npm run e2e:smoke:prod` (it asks you to type "prod").'
  );
}

function parseEnvFile(file: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!fs.existsSync(file)) return out;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !line.trim().startsWith('#')) out[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return out;
}

const fileVars = parseEnvFile(path.join(__dirname, `.env.${TEST_ENV}`));
const get = (k: string, d = ''): string => process.env[k] ?? fileVars[k] ?? d;

export const BASE_URL = get('BASE_URL', 'http://localhost:4200').replace(/\/$/, '');
export const API_URL = get('API_URL', 'http://localhost:8000/').replace(/\/?$/, '/');

export function creds(role: Role): { email: string; password: string } | null {
  const key = role.toUpperCase();
  const email = get(`QA_${key}_EMAIL`, `qa.${role}@flashyre-qa.example`);
  const password = get(`QA_${key}_PASSWORD`, get('QA_PASSWORD'));
  return password ? { email, password } : null;
}

export const AUTH_DIR = path.join(__dirname, '..', '..', '.auth', TEST_ENV);
export const statePath = (role: Role) => path.join(AUTH_DIR, `${role}.json`);

export interface RunInfo { runId: string; tag: string; letters: string; startedAt: string; env: TestEnv; }

/** Same mapping as the Django Test Lab: the app only accepts letters in first names. */
export function lettersFor(runId: string): string {
  return 'Qa' + [...runId.toLowerCase()].map(c => 'ghijklmnopabcdef'[parseInt(c, 16)]).join('');
}

/** The run id is created by `e2e/run.mjs` and passed down in the environment, so every worker agrees. */
export function readRun(): RunInfo {
  const runId = process.env['QA_RUN_ID'];
  if (!runId || !/^[0-9a-f]{8}$/.test(runId)) {
    throw new Error('QA_RUN_ID is not set. Start tests with `npm run e2e:...` (it goes through e2e/run.mjs).');
  }
  return {
    runId, tag: `QA${runId}`, letters: lettersFor(runId),
    startedAt: process.env['QA_RUN_STARTED'] || new Date().toISOString(), env: TEST_ENV,
  };
}
