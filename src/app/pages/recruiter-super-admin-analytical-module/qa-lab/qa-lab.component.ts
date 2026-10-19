import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { QaRunnerPanelComponent } from './qa-runner-panel.component';
import { environment } from '../../../../environments/environment';

interface QaStep { name: string; ok: boolean; detail: string; info?: boolean; }
interface QaCase { id: string; title: string; status: string; error: string; ms: number; steps: QaStep[]; }
interface QaResult {
  run_id: string; tag: string; duration_ms: number; mock_parser: boolean;
  summary: { passed: number; failed: number; skipped: number };
  cases: QaCase[]; cleanup: { name: string; ok: boolean; detail: string }[];
}

@Component({
  selector: 'app-qa-lab',
  standalone: true,
  imports: [CommonModule, FormsModule, QaRunnerPanelComponent],
  styles: [`
    :host { display: block; }
    .panel { background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; margin-bottom: 20px; box-shadow: 0 1px 2px rgba(15,23,42,.04); }
    .row { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap; }
    h3 { margin: 0 0 4px; font-size: 20px; color: #0f172a; } h4 { margin: 0 0 4px; font-size: 16px; color: #0f172a; }
    .sub { margin: 0; color: #64748b; font-size: 13px; }
    .pill { display: inline-flex; padding: 6px 14px; border-radius: 999px; font-weight: 600; font-size: 13px; }
    .btn { height: 40px; padding: 0 22px; border-radius: 10px; border: 0; font-size: 14px; font-weight: 600; cursor: pointer; background: #0f172a; color: #fff; }
    .btn:hover:not(:disabled) { background: #1e293b; } .btn:disabled { opacity: .5; cursor: not-allowed; }
    .btn.ghost { background: #fff; color: #0f172a; border: 1px solid #cbd5e1; }
    .opt { font-size: 13px; color: #475569; display: inline-flex; gap: 6px; align-items: center; }
    ul.cases { margin: 16px 0 0; padding: 0; list-style: none; display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 6px 24px; font-size: 13px; color: #475569; }
    ul.cases li::before { content: '○'; margin-right: 8px; color: #94a3b8; }
    .sum { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; margin-bottom: 14px; font-size: 13px; }
    .chip { padding: 3px 10px; border-radius: 999px; font-weight: 600; } .chip.p { background: #dcfce7; color: #166534; } .chip.f { background: #fee2e2; color: #991b1b; } .chip.s { background: #f1f5f9; color: #475569; }
    .case { border-top: 1px solid #f1f5f9; padding: 10px 0; }
    .case .top { cursor: pointer; display: flex; gap: 12px; align-items: center; }
    .badge { width: 64px; font-weight: 700; font-size: 12px; letter-spacing: .04em; }
    .err { color: #b91c1c; font-size: 13px; margin: 4px 0 0 76px; }
    ul.steps { list-style: none; margin: 8px 0 0 76px; padding: 0; font-size: 13px; }
    .load-err { color: #b91c1c; margin-top: 12px; font-size: 13px; }
  `],
  template: `
  <div class="panel">
    <div class="row">
      <div>
        <h3>Test Lab</h3>
        <p class="sub">End-to-end checks against the server you are logged into. Test data is tagged and removed after each run.</p>
      </div>
      <span *ngIf="env" class="pill" [style.background]="env.is_prod ? '#fee2e2' : '#dcfce7'" [style.color]="env.is_prod ? '#991b1b' : '#166534'">
        Environment: {{ env.label | uppercase }}<span *ngIf="env.bucket"> · {{ env.bucket }}</span>
      </span>
    </div>
    <p class="load-err" *ngIf="loadError">{{ loadError }}</p>
  </div>

  <app-qa-runner-panel [serverEnv]="serverEnv"></app-qa-runner-panel>

  <div class="panel" *ngFor="let s of suites">
    <div class="row">
      <div>
        <h4>{{ s.title }} <span class="sub">(server-side suite)</span></h4>
        <p class="sub">{{ s.description }}</p>
      </div>
      <div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap;">
        <label class="opt" [title]="env?.is_prod ? 'Not allowed on prod' : 'Use canned parser output instead of calling OpenAI'">
          <input type="checkbox" [(ngModel)]="mockParser" [disabled]="env?.is_prod || running"> Mock parser
        </label>
        <button class="btn" (click)="run(s.id)" [disabled]="running">{{ running ? 'Running… (can take a minute)' : '▶ Run suite' }}</button>
      </div>
    </div>
    <ul class="cases" *ngIf="!result"><li *ngFor="let c of s.cases">{{ c.title }}</li></ul>
  </div>

  <div class="panel" *ngIf="result">
    <div class="sum">
      <strong>Run {{ result.tag }}</strong>
      <span class="chip p">{{ result.summary.passed }} passed</span>
      <span class="chip f">{{ result.summary.failed }} failed</span>
      <span class="chip s">{{ result.summary.skipped }} skipped</span>
      <span class="sub">{{ result.duration_ms / 1000 | number:'1.0-1' }}s<span *ngIf="result.mock_parser"> · mock parser</span></span>
      <button class="btn ghost" style="margin-left:auto;" (click)="download()">Download report</button>
    </div>
    <div class="case" *ngFor="let c of result.cases">
      <div class="top" (click)="open[c.id] = !open[c.id]">
        <span class="badge" [style.color]="color(c.status)">{{ c.status | uppercase }}</span>
        <span style="flex:1;color:#0f172a;">{{ c.title }}</span>
        <span class="sub">{{ c.ms }} ms</span>
      </div>
      <div class="err" *ngIf="c.error">{{ c.error }}</div>
      <ul class="steps" *ngIf="open[c.id] || c.status === 'failed'">
        <li *ngFor="let st of c.steps" [style.color]="st.ok ? '#166534' : '#b91c1c'">
          {{ st.info ? 'ℹ' : (st.ok ? '✓' : '✗') }} {{ st.name }}<span *ngIf="st.detail" style="color:#64748b;"> — {{ st.detail }}</span>
        </li>
      </ul>
    </div>
    <div class="case">
      <strong>Cleanup</strong>
      <ul class="steps" style="margin-left:0;">
        <li *ngFor="let c of result.cleanup" [style.color]="c.ok ? '#166534' : '#b91c1c'">{{ c.ok ? '✓' : '✗' }} {{ c.name }}<span *ngIf="c.detail"> — {{ c.detail }}</span></li>
      </ul>
    </div>
  </div>
  `,
})
export class QaLabComponent implements OnInit {
  private base = environment.apiUrl + 'api/super-admin/qa/';
  env: any = null;
  suites: any[] = [];
  result: QaResult | null = null;
  running = false;
  mockParser = false;
  loadError = '';
  open: Record<string, boolean> = {};

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.http.get<any>(this.base + 'suites/').subscribe({
      next: d => { this.env = d.environment; this.suites = d.suites; },
      error: e => this.loadError = e?.error?.error || 'Could not load Test Lab (super admin only).',
    });
  }

  get serverEnv(): string {
    if (this.env?.is_prod) { return 'prod'; }
    return /localhost|127\.0\.0\.1/.test(environment.apiUrl) ? 'local' : 'dev';
  }

  color(s: string) { return s === 'passed' ? '#166534' : s === 'failed' ? '#991b1b' : '#64748b'; }

  run(suite: string) {
    if (this.env?.is_prod && !window.confirm(
      'You are on PROD. The suite will create, edit and delete only its own tagged QA records, ' +
      'but it does write to the live database and bucket. Continue?')) { return; }
    this.running = true; this.result = null; this.loadError = '';
    this.http.post<QaResult>(this.base + 'run/', {
      suite, mock_parser: this.mockParser, confirm_env: this.env?.is_prod ? 'prod' : undefined,
    }).subscribe({
      next: r => { this.result = r; this.running = false; },
      error: e => { this.loadError = e?.error?.error || 'Run failed to complete.'; this.running = false; },
    });
  }

  download() {
    if (!this.result) { return; }
    const blob = new Blob([JSON.stringify({ environment: this.env, ...this.result }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `test-lab-${this.result.tag}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }
}
