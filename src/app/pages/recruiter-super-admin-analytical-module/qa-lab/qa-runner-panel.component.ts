import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

const RUNNER = 'http://127.0.0.1:4777';

interface RunKind { id: string; label: string; hint: string; prodOk?: boolean; localOnly?: boolean; }
interface Recent { title: string; project?: string; status: string; ms?: number; error?: string; }
interface Progress { total: number; done: number; passed: number; failed: number; skipped: number; current: { title: string; project?: string; file?: string } | null; recent: Recent[]; }

@Component({
  selector: 'app-qa-runner-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styles: [`
    :host { display: block; margin-bottom: 20px; }
    .panel { background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; box-shadow: 0 1px 2px rgba(15,23,42,.04); }
    .head { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap; }
    h3 { margin: 0 0 4px; font-size: 18px; color: #0f172a; }
    .sub { margin: 0; color: #64748b; font-size: 13px; }
    .pill { display: inline-flex; align-items: center; gap: 8px; padding: 6px 14px; border-radius: 999px; font-size: 13px; font-weight: 600; }
    .pill.ok { background: #dcfce7; color: #166534; } .pill.off { background: #fef3c7; color: #92400e; }
    .dot { width: 8px; height: 8px; border-radius: 50%; background: currentColor; }
    .controls { display: grid; grid-template-columns: 1fr 1.6fr auto; gap: 16px; align-items: end; margin-top: 22px; }
    @media (max-width: 800px) { .controls { grid-template-columns: 1fr; } }
    label { display: block; font-size: 12px; font-weight: 600; color: #475569; margin-bottom: 6px; text-transform: uppercase; letter-spacing: .04em; }
    select { width: 100%; height: 42px; border: 1px solid #cbd5e1; border-radius: 10px; padding: 0 12px; background: #fff; font-size: 14px; color: #0f172a; }
    select:disabled { background: #f1f5f9; }
    .btn { height: 42px; padding: 0 24px; border-radius: 10px; border: 0; font-size: 14px; font-weight: 600; cursor: pointer; background: #0f172a; color: #fff; display: inline-flex; align-items: center; gap: 8px; }
    .btn:hover:not(:disabled) { background: #1e293b; } .btn:disabled { opacity: .5; cursor: not-allowed; }
    .btn.stop { background: #fff; color: #b91c1c; border: 1px solid #fecaca; }
    .hint { color: #64748b; font-size: 12.5px; margin-top: 10px; }
    .help { margin-top: 16px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 14px 16px; font-size: 13px; color: #78350f; }
    .help code { display: inline-block; background: #fff; border: 1px solid #fde68a; border-radius: 6px; padding: 3px 8px; margin: 6px 6px 0 0; font-size: 13px; }
    .help button { background: transparent; border: 0; color: #92400e; font-weight: 600; cursor: pointer; text-decoration: underline; }
    .err { color: #b91c1c; font-size: 13px; margin-top: 12px; }
    .run { margin-top: 22px; border-top: 1px solid #e2e8f0; padding-top: 20px; }
    .now { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; min-height: 28px; }
    .spin { width: 16px; height: 16px; border: 2px solid #cbd5e1; border-top-color: #0f172a; border-radius: 50%; animation: s 0.8s linear infinite; flex: none; }
    @keyframes s { to { transform: rotate(360deg); } }
    .now .title { font-weight: 600; color: #0f172a; word-break: break-word; }
    .now .meta { color: #64748b; font-size: 12px; }
    .bar { height: 12px; border-radius: 999px; background: #e2e8f0; overflow: hidden; display: flex; }
    .bar > span { height: 100%; transition: width .3s; }
    .bar .p { background: #16a34a; } .bar .f { background: #dc2626; } .bar .s { background: #94a3b8; }
    .bar.indet { position: relative; } .bar.indet::after { content: ''; position: absolute; inset: 0; width: 30%; background: #0f172a; border-radius: 999px; animation: m 1.2s ease-in-out infinite; }
    @keyframes m { 0% { left: -30%; } 100% { left: 100%; } }
    .stats { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 12px; align-items: center; font-size: 13px; }
    .chip { padding: 3px 10px; border-radius: 999px; font-weight: 600; }
    .chip.p { background: #dcfce7; color: #166534; } .chip.f { background: #fee2e2; color: #991b1b; } .chip.s { background: #f1f5f9; color: #475569; }
    .count { margin-left: auto; color: #475569; font-weight: 600; }
    .done-warn { color: #92400e; font-weight: 700; }
    .done-ok { color: #166534; font-weight: 700; } .done-bad { color: #991b1b; font-weight: 700; }
    ul.recent { list-style: none; margin: 16px 0 0; padding: 0; max-height: 280px; overflow: auto; border: 1px solid #e2e8f0; border-radius: 12px; }
    ul.recent li { display: flex; gap: 10px; align-items: baseline; padding: 8px 14px; font-size: 13px; border-bottom: 1px solid #f1f5f9; }
    ul.recent li:last-child { border-bottom: 0; }
    .st { width: 18px; text-align: center; font-weight: 700; flex: none; } .st.passed { color: #16a34a; } .st.failed, .st.timedOut { color: #dc2626; } .st.skipped { color: #94a3b8; }
    .t { flex: 1; color: #0f172a; } .t small { display: block; color: #b91c1c; font-size: 12px; margin-top: 2px; }
    .ms { color: #94a3b8; font-size: 12px; flex: none; }
    .links { margin-top: 12px; display: flex; gap: 16px; font-size: 13px; }
    .links a, .links button { color: #1d4ed8; background: none; border: 0; padding: 0; cursor: pointer; font-size: 13px; text-decoration: underline; }
    pre { background: #0f172a; color: #e2e8f0; padding: 12px; border-radius: 10px; max-height: 260px; overflow: auto; font-size: 12px; white-space: pre-wrap; margin: 10px 0 0; }
  `],
  template: `
  <div class="panel">
    <div class="head">
      <div>
        <h3>Browser and API tests</h3>
        <p class="sub">Playwright and Newman run on your own PC through the local QA runner.</p>
      </div>
      <span class="pill" [ngClass]="online ? 'ok' : 'off'"><span class="dot"></span>{{ online ? 'Runner connected' : 'Runner not running' }}</span>
    </div>

    <div class="controls">
      <div>
        <label>Target server</label>
        <select [(ngModel)]="target" [disabled]="running" (ngModelChange)="touched = true">
          <option value="local">Local (your PC)</option>
          <option value="dev">Dev</option>
          <option value="prod">Prod (smoke only)</option>
        </select>
      </div>
      <div>
        <label>Test type</label>
        <select [(ngModel)]="kind" [disabled]="running">
          <option *ngFor="let k of kinds" [value]="k.id" [disabled]="(target === 'prod' && !k.prodOk) || (k.localOnly && target !== 'local')">{{ k.label }}</option>
        </select>
      </div>
      <div style="display:flex;gap:8px;">
        <button class="btn" (click)="start()" [disabled]="running || starting">
          {{ launching ? 'Starting runner…' : starting ? 'Starting…' : running ? 'Running…' : '▶ Start test' }}
        </button>
        <button class="btn stop" (click)="stop()" *ngIf="running">Stop</button>
      </div>
    </div>
    <div class="hint">{{ hint }}</div>

    <div class="help" *ngIf="!online && showHelp">
      The local runner could not be started automatically (Django must run on this PC). Open a terminal in the Angular folder and run one of:<br>
      <code>npm run qa:runner</code> (runner only) <code>npm run start:qa</code> (app + runner together)<br>
      <button (click)="copy('npm run qa:runner')">Copy command</button> · <button (click)="start()">Try again</button>
    </div>
    <p class="err" *ngIf="error">{{ error }}</p>

    <div class="run" *ngIf="running || finished">
      <div class="now">
        <ng-container *ngIf="running">
          <span class="spin"></span>
          <div>
            <div class="title">{{ p.current?.title || (p.total ? 'Preparing next test…' : 'Starting up (login, set-up)…') }}</div>
            <div class="meta" *ngIf="p.current?.project">{{ p.current?.project }}<span *ngIf="p.current?.file"> · {{ p.current?.file }}</span></div>
          </div>
        </ng-container>
        <span *ngIf="finished && exitCode === 0 && !mostlySkipped" class="done-ok">✓ Finished: everything passed</span>
        <span *ngIf="finished && exitCode === 0 && mostlySkipped" class="done-warn">⚠ Finished, but {{ p.skipped }} of {{ p.total }} tests were skipped (no login or not applicable). This is not a pass.</span>
        <span *ngIf="finished && exitCode !== 0" class="done-bad">✗ Finished with failures{{ p.failed ? ' (' + p.failed + ')' : '' }}</span>
      </div>

      <div class="bar" [class.indet]="running && !p.total">
        <ng-container *ngIf="p.total">
          <span class="p" [style.width.%]="pct(p.passed)"></span>
          <span class="f" [style.width.%]="pct(p.failed)"></span>
          <span class="s" [style.width.%]="pct(p.skipped)"></span>
        </ng-container>
      </div>
      <div class="stats">
        <span class="chip p">{{ p.passed }} passed</span>
        <span class="chip f">{{ p.failed }} failed</span>
        <span class="chip s" *ngIf="p.skipped">{{ p.skipped }} skipped</span>
        <span class="count" *ngIf="p.total">{{ p.done }} / {{ p.total }} · {{ pct(p.done) | number:'1.0-0' }}% · {{ elapsed }}</span>
        <span class="count" *ngIf="!p.total">{{ elapsed }}</span>
      </div>

      <ul class="recent" *ngIf="p.recent.length">
        <li *ngFor="let r of p.recent">
          <span class="st" [ngClass]="r.status">{{ r.status === 'passed' ? '✓' : r.status === 'skipped' ? '–' : '✗' }}</span>
          <span class="t">{{ r.title }}<span *ngIf="r.project" style="color:#94a3b8;"> · {{ r.project }}</span><small *ngIf="r.error">{{ r.error }}</small></span>
          <span class="ms" *ngIf="r.ms">{{ r.ms / 1000 | number:'1.1-1' }}s</span>
        </li>
      </ul>

      <div class="links">
        <button (click)="showLog = !showLog">{{ showLog ? 'Hide' : 'Show' }} full output</button>
        <a *ngIf="finished && !kindIsApi" [href]="reportUrl" target="_blank">Open Playwright report</a>
      </div>
      <pre *ngIf="showLog">{{ lines.join('\\n') }}</pre>
    </div>
  </div>
  `,
})
export class QaRunnerPanelComponent implements OnInit, OnDestroy {
  @Input() set serverEnv(v: string | undefined) {
    if (v && ['local', 'dev', 'prod'].includes(v)) { this.serverEnvValue = v; if (!this.touched) { this.target = v; } }
  }
  kinds: RunKind[] = [
    { id: 'smoke', label: 'Smoke (browser, quick)', hint: 'A few critical checks per role. The only browser run allowed on prod.', prodOk: true },
    { id: 'api-smoke', label: 'API smoke', hint: 'Login, list, create and read a tagged candidate, then cleanup.', prodOk: true },
    { id: 'regression', label: 'Regression (browser)', hint: 'Everything tagged regression.' },
    { id: 'full', label: 'Full, all 5 browsers', hint: 'Every scenario on Chromium, Firefox, WebKit and two mobile profiles. Slow.' },
    { id: 'chromium', label: 'Full, Chromium only', hint: 'Every scenario in one browser. Faster.' },
    { id: 'api-full', label: 'API full (happy + negative)', hint: 'Newman collection with happy and negative cases.' },
    { id: 'api-data', label: 'API data-driven', hint: 'API scenarios read from the candidate data file.' },
    { id: 'nonfunctional', label: 'Non-functional (local only)', hint: 'Performance budget, accessibility, resilience, XSS.', localOnly: true },
  ];
  target = 'local';
  kind = 'smoke';
  online = false;
  running = false;
  starting = false;
  launching = false;
  finished = false;
  showHelp = false;
  showLog = false;
  exitCode: number | null = null;
  runTarget = '';
  lines: string[] = [];
  p: Progress = { total: 0, done: 0, passed: 0, failed: 0, skipped: 0, current: null, recent: [] };
  error = '';
  elapsed = '';
  touched = false;
  serverEnvValue = '';
  constructor(private http: HttpClient) {}
  private next = 0;
  private startedAt = 0;
  private timer: any;

  get hint() { return this.kinds.find(k => k.id === this.kind)?.hint ?? ''; }
  get mostlySkipped() { return this.p.total > 0 && this.p.skipped / this.p.total >= 0.25; }
  get kindIsApi() { return this.kind.startsWith('api-'); }
  get reportUrl() { return `${RUNNER}/report?env=${this.runTarget || this.target}`; }
  pct(n: number) { return this.p.total ? Math.min(100, (n / this.p.total) * 100) : 0; }

  ngOnInit() { this.ping(); this.timer = setInterval(() => this.tick(), 1000); }
  ngOnDestroy() { clearInterval(this.timer); }

  async copy(t: string) { try { await navigator.clipboard.writeText(t); } catch { /* ignore */ } }

  private async ping(): Promise<boolean> {
    try {
      const s = await (await fetch(`${RUNNER}/status`)).json();
      this.online = true; this.showHelp = false;
      if (s.running && !this.running) {   // page reloaded while a run is in progress: re-attach
        this.running = true; this.finished = false; this.runTarget = s.env; this.kind = s.kind; this.target = s.env;
        this.next = 0; this.lines = []; this.startedAt = Date.parse(s.startedAt) || Date.now();
      }
      return true;
    } catch { this.online = false; return false; }
  }

  private async tick() {
    if (this.running) { this.elapsed = this.fmt(Date.now() - this.startedAt); }
    if (!this.running) { if (!this.online) { this.ping(); } return; }
    try {
      const r = await (await fetch(`${RUNNER}/log?since=${this.next}`)).json();
      this.lines.push(...r.lines); this.next = r.next; this.p = r.progress;
      if (!r.running) { this.running = false; this.finished = true; this.exitCode = r.exitCode; }
    } catch { this.online = false; this.running = false; this.error = 'Lost connection to the local runner.'; }
  }

  /** Your own login, so the run can create temporary QA accounts on the server you are on (only when the target is that server). */
  private session(): { token?: string; apiUrl?: string } {
    if (this.target !== this.serverEnvValue) { return {}; }
    try { const token = localStorage.getItem('jwtToken'); return token ? { token, apiUrl: environment.apiUrl } : {}; }
    catch { return {}; }
  }

  private fmt(ms: number) { const s = Math.floor(ms / 1000); return `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, '0')}s`; }

  async start() {
    this.touched = true; this.error = ''; this.starting = true;
    try {
      let confirm: string | undefined;
      if (this.target === 'prod') {
        const t = window.prompt('This runs smoke tests against PROD. They create only tagged QA records and remove them again.\nType "prod" to continue:');
        if (t !== 'prod') { return; }
        confirm = 'prod';
      }
      if (!(await this.ping())) {
        this.launching = true;
        try {
          await new Promise<void>((ok, bad) => this.http.post(environment.apiUrl + 'api/super-admin/qa/runner/start/', {}).subscribe({ next: () => ok(), error: e => bad(e) }));
          for (let i = 0; i < 20 && !(await this.ping()); i++) { await new Promise(r => setTimeout(r, 750)); }
        } catch { /* fall through to the manual instructions */ }
        this.launching = false;
        if (!this.online) { this.showHelp = true; return; }
      }
      const res = await fetch(`${RUNNER}/run`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ env: this.target, kind: this.kind, confirm, ...this.session() }) });
      const body = await res.json();
      if (!res.ok) { this.error = body.error || 'Could not start the run.'; return; }
      this.lines = []; this.next = 0; this.exitCode = null; this.finished = false; this.showLog = false;
      this.p = { total: 0, done: 0, passed: 0, failed: 0, skipped: 0, current: null, recent: [] };
      this.running = true; this.runTarget = this.target; this.startedAt = Date.now(); this.elapsed = '0m 00s';
    } catch { this.online = false; this.showHelp = true; }
    finally { this.starting = false; }
  }

  async stop() { try { await fetch(`${RUNNER}/stop`, { method: 'POST' }); } catch { /* ignore */ } }
}
