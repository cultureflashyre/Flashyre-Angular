#!/usr/bin/env node
// Local QA runner: lets the Test Lab tab start Playwright / Newman runs on THIS PC with one click.
// Start it with `npm run qa:runner` (keep the window open). It only listens on 127.0.0.1.
//   GET  /status          -> { running, kind, env, startedAt, exitCode, lines }
//   GET  /log?since=N     -> { lines: [...], next: N, running, exitCode }
//   POST /run {env, kind, confirm?}   kind: smoke | full | chromium | regression | nonfunctional | api-smoke | api-full | api-data
//   POST /stop
// Rules: prod = smoke / api-smoke only and needs confirm:"prod"; one run at a time; fixed command table, no free-form args.
import http from 'node:http';
import { spawn, spawnSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.QA_RUNNER_PORT || 4777);
const ORIGINS = new Set(['http://localhost:4200', 'http://127.0.0.1:4200',
  ...(process.env.QA_RUNNER_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean)]);

const KINDS = {
  smoke:         { script: 'e2e/run.mjs', args: ['--grep', '@smoke'], prodOk: true },
  full:          { script: 'e2e/run.mjs', args: [] },
  chromium:      { script: 'e2e/run.mjs', args: ['--project=chromium'] },
  regression:    { script: 'e2e/run.mjs', args: ['--grep', '@regression'] },
  nonfunctional: { script: 'e2e/run.mjs', args: ['--grep', '@nonfunctional'], localOnly: true },
  'api-smoke':   { script: 'api/run.mjs', args: ['smoke'], prodOk: true, api: true },
  'api-full':    { script: 'api/run.mjs', args: ['full'], api: true },
  'api-data':    { script: 'api/run.mjs', args: ['data'], api: true },
};

const blankProgress = () => ({ total: 0, done: 0, passed: 0, failed: 0, skipped: 0, current: null, recent: [] });
const state = { progress: blankProgress(), running: false, kind: null, env: null, startedAt: null, exitCode: null, lines: [], child: null };

function track(line) {
  const p = state.progress;
  if (line.startsWith('@@QA ')) {
    let e; try { e = JSON.parse(line.slice(5)); } catch { return true; }
    if (e.type === 'begin') p.total = e.total;
    if (e.type === 'start') p.current = { title: e.title, project: e.project, file: e.file };
    if (e.type === 'end') {
      p.done++; p.current = null;
      if (e.status === 'passed') p.passed++; else if (e.status === 'skipped') p.skipped++; else p.failed++;
      p.recent.unshift({ title: e.title, project: e.project, status: e.status, ms: e.ms, error: e.error });
      p.recent.length = Math.min(p.recent.length, 40);
    }
    return true; // progress lines are not shown in the log
  }
  // Newman (CLI): "→ Request name" starts a request, assertions are "✓" / "N. name"
  const m = line.match(/^→\s+(.+)$/);
  if (m) {
    if (p.current) { p.done++; p.passed += p.current.bad ? 0 : 1; p.failed += p.current.bad ? 1 : 0; p.recent.unshift({ title: p.current.title, status: p.current.bad ? 'failed' : 'passed' }); p.recent.length = Math.min(p.recent.length, 40); }
    p.current = { title: m[1], project: 'API' };
  } else if (p.current && /^\s*(\d+\.\s|✗)/.test(line)) p.current.bad = true;
  return false;
}

function push(text) {
  for (const l of String(text).split(/\r?\n/)) {
    if (!l.trim()) continue;
    const clean = l.replace(/\x1b\[[0-9;]*m/g, '');
    if (!track(clean)) state.lines.push(clean);
  }
  if (state.lines.length > 5000) state.lines.splice(0, state.lines.length - 5000);
}

function cors(req, res) {
  const o = req.headers.origin;
  if (o && !ORIGINS.has(o)) { res.writeHead(403); res.end('origin not allowed'); return false; }
  if (o) {
    res.setHeader('Access-Control-Allow-Origin', o);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Private-Network', 'true');
  }
  return true;
}
const send = (res, code, obj) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(obj)); };
const readBody = req => new Promise(r => { let b = ''; req.on('data', c => (b += c)); req.on('end', () => { try { r(JSON.parse(b || '{}')); } catch { r({}); } }); });

function start({ env, kind, confirm, token, apiUrl }) {
  const k = KINDS[kind];
  if (!k) return [400, { error: 'unknown kind' }];
  if (!['local', 'dev', 'prod'].includes(env)) return [400, { error: 'env must be local, dev or prod' }];
  if (state.running) return [409, { error: 'a run is already in progress' }];
  if (env === 'prod' && !k.prodOk) return [403, { error: 'prod allows smoke tests only' }];
  if (env === 'prod' && confirm !== 'prod') return [403, { error: 'confirm "prod" is required' }];
  if (k.localOnly && env !== 'local') return [403, { error: `${kind} runs on local only` }];
  const args = [path.join(root, k.script), env, ...k.args];
  if (env === 'prod') args.push('--yes');
  Object.assign(state, { running: true, kind, env, startedAt: new Date().toISOString(), exitCode: null, lines: [], progress: blankProgress() });
  push(`> node ${k.script} ${env} ${k.args.join(' ')}`);
  const child = spawn(process.execPath, args, { cwd: root, env: { ...process.env, FORCE_COLOR: '0', CI: '', ...(token && apiUrl ? { QA_BOOTSTRAP_TOKEN: String(token), QA_API_URL: String(apiUrl) } : {}) }, windowsHide: true });
  state.child = child;
  child.stdout.on('data', push);
  child.stderr.on('data', push);
  child.on('error', e => push(`runner error: ${e.message}`));
  child.on('exit', code => { state.running = false; state.exitCode = code; state.child = null;
    const p = state.progress;
    if (p.current && !p.current.file) { p.done++; p.passed += p.current.bad ? 0 : 1; p.failed += p.current.bad ? 1 : 0; p.recent.unshift({ title: p.current.title, status: p.current.bad ? 'failed' : 'passed' }); p.current = null; }
    if (p.total < p.done) p.total = p.done; push(`--- finished with exit code ${code}`); });
  return [200, { started: true }];
}

function stop() {
  if (!state.child) return;
  if (process.platform === 'win32') spawnSync('taskkill', ['/PID', String(state.child.pid), '/T', '/F']);
  else state.child.kill('SIGTERM');
}

http.createServer(async (req, res) => {
  if (!cors(req, res)) return;
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
  const url = new URL(req.url, 'http://x');
  if (req.method === 'GET' && url.pathname === '/status') {
    const { running, kind, env, startedAt, exitCode, lines } = state;
    return send(res, 200, { ok: true, running, kind, env, startedAt, exitCode, progress: state.progress, lines: lines.length, kinds: Object.keys(KINDS) });
  }
  if (req.method === 'GET' && url.pathname === '/log') {
    const since = Math.max(0, Number(url.searchParams.get('since') || 0));
    return send(res, 200, { lines: state.lines.slice(since), next: state.lines.length, running: state.running, exitCode: state.exitCode, progress: state.progress, startedAt: state.startedAt });
  }
  if (req.method === 'POST' && url.pathname === '/run') { const [c, o] = start(await readBody(req)); return send(res, c, o); }
  if (req.method === 'POST' && url.pathname === '/stop') { stop(); return send(res, 200, { stopped: true }); }
  if (req.method === 'GET' && url.pathname === '/report') {
    const e = ['local', 'dev', 'prod'].includes(url.searchParams.get('env')) ? url.searchParams.get('env') : 'local';
    const f = path.join(root, 'playwright-report', e, 'index.html');
    if (!fs.existsSync(f)) return send(res, 404, { error: 'no report yet' });
    res.writeHead(200, { 'Content-Type': 'text/html' }); return res.end(fs.readFileSync(f));
  }
  send(res, 404, { error: 'not found' });
}).listen(PORT, '127.0.0.1', () => console.log(`QA runner listening on http://127.0.0.1:${PORT}  (allowed origins: ${[...ORIGINS].join(', ')})`));
