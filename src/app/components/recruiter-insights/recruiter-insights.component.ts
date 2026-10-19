import { Component, Input, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import Chart from 'chart.js/auto';

import { SuperAdminService } from '../../services/super-admin.service';
import { TableState } from './table-state';

type ViewMode = 'team' | 'single' | 'compare';
type HiresMode = 'top10' | 'top25' | 'bottom10' | 'all';

interface MetricDef {
  key: string;
  label: string;
  fmt: 'int' | 'pct' | 'dec';
  /** true when a higher value is better, so rank and "best" highlighting apply */
  ranked: boolean;
}

const MAX_COMPARE = 5;
const PALETTE = ['#2563eb', '#059669', '#d97706', '#7c3aed', '#dc2626', '#0891b2', '#64748b'];
const GREY = '#cbd5e1';

@Component({
  selector: 'app-recruiter-insights',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './recruiter-insights.component.html',
  styleUrls: ['./recruiter-insights.component.css'],
})
export class RecruiterInsightsComponent implements OnInit, OnDestroy {
  /** Active recruiters from the parent page ({ user_id, first_name, last_name }) for the picker. */
  @Input() recruiters: any[] = [];
  /** Client list from the parent page ({ client_name }). */
  @Input() clients: any[] = [];

  readonly maxCompare = MAX_COMPARE;
  readonly palette = PALETTE;

  // ----- view + filters -----
  view: ViewMode = 'team';
  filters = { start_date: '', end_date: '' };
  client = '';
  preset = '6m';

  // ----- data -----
  team: any = null;
  detail: any = null;
  loading = false;
  error = '';
  selectedIds: string[] = [];

  // ----- picker -----
  pickerQuery = '';
  pickerOpen = false;

  // ----- team overview widgets -----
  hiresMode: HiresMode = 'top10';
  hiresPager = new TableState<any>(['recruiter_name'], '', 'desc', [10], 10);
  hiresHeight = 320;
  funnelFor = '';
  expandedClient: string | null = null;

  tables = {
    placements: new TableState<any>(['recruiter_name'], 'hired'),
    funnel: new TableState<any>(['recruiter_name'], 'submitted'),
    quality: new TableState<any>(['recruiter_name'], 'submitted'),
    offerToJoin: new TableState<any>(['recruiter_name'], 'offers_made'),
    workload: new TableState<any>(['recruiter_name'], 'pipeline_candidates'),
    fill: new TableState<any>(['recruiter_name'], 'vacancies'),
    clients: new TableState<any>(['client'], 'requirements'),
    requirements: new TableState<any>(['job_role', 'client', 'status']),
    singleClients: new TableState<any>(['client'], 'hired'),
  };

  readonly metricDefs: MetricDef[] = [
    { key: 'hires', label: 'Hires', fmt: 'int', ranked: true },
    { key: 'offers', label: 'Offers pending', fmt: 'int', ranked: true },
    { key: 'candidates_added', label: 'Candidates added', fmt: 'int', ranked: true },
    { key: 'submitted', label: 'Submissions', fmt: 'int', ranked: true },
    { key: 'sub_to_interview_pct', label: 'Submit → Interview', fmt: 'pct', ranked: true },
    { key: 'interview_to_offer_pct', label: 'Interview → Offer', fmt: 'pct', ranked: true },
    { key: 'offer_to_hired_pct', label: 'Offer → Hired', fmt: 'pct', ranked: true },
    { key: 'offer_to_join_pct', label: 'Offer-to-join', fmt: 'pct', ranked: true },
    { key: 'fill_pct', label: 'Vacancy fill rate', fmt: 'pct', ranked: true },
    { key: 'avg_rating', label: 'Avg candidate rating', fmt: 'dec', ranked: true },
    { key: 'open_requirements', label: 'Open requirements', fmt: 'int', ranked: false },
    { key: 'pipeline_candidates', label: 'Candidates in pipeline', fmt: 'int', ranked: false },
  ];
  readonly tileKeys = ['hires', 'offers', 'sub_to_interview_pct', 'offer_to_join_pct', 'fill_pct',
    'candidates_added', 'open_requirements', 'pipeline_candidates'];

  private charts: { [id: string]: Chart } = {};
  private requestSeq = 0;

  constructor(
    private api: SuperAdminService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  // =====================================================================
  // lifecycle + URL state
  // =====================================================================
  ngOnInit() {
    const q = this.route.snapshot.queryParamMap;
    const view = q.get('view');
    const ids = (q.get('rec') || '').split(',').map(s => s.trim()).filter(Boolean).slice(0, MAX_COMPARE);
    if ((view === 'single' || view === 'compare') && ids.length) {
      this.view = view;
      this.selectedIds = view === 'single' ? ids.slice(0, 1) : ids;
    }
    this.setPreset('6m');
  }

  ngOnDestroy() {
    this.destroyCharts();
  }

  private syncUrl() {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { view: this.view, rec: this.view === 'team' ? null : this.selectedIds.join(',') || null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  // =====================================================================
  // filters
  // =====================================================================
  setPreset(preset: string) {
    this.preset = preset;
    const today = new Date();
    const fmt = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const past = new Date();
    if (preset === 'all') {
      this.filters.start_date = '';
      this.filters.end_date = '';
    } else {
      if (preset === '7d') past.setDate(today.getDate() - 7);
      else if (preset === '30d') past.setDate(today.getDate() - 30);
      else if (preset === '3m') past.setMonth(today.getMonth() - 3);
      else if (preset === '6m') past.setMonth(today.getMonth() - 6);
      else if (preset === '1y') past.setFullYear(today.getFullYear() - 1);
      this.filters.start_date = fmt(past);
      this.filters.end_date = fmt(today);
    }
    this.refresh();
  }

  onDateChange() {
    this.preset = 'custom';
    this.refresh();
  }

  // =====================================================================
  // view switching + selection
  // =====================================================================
  setView(view: ViewMode) {
    if (view === this.view) return;
    this.view = view;
    if (view === 'single') this.selectedIds = this.selectedIds.slice(0, 1);
    if (view === 'team') this.detail = null;
    this.syncUrl();
    this.refresh();
  }

  openSingle(id: string | null) {
    if (!id) return;
    this.view = 'single';
    this.selectedIds = [id];
    this.detail = null;
    this.pickerQuery = '';
    this.pickerOpen = false;
    this.syncUrl();
    this.refresh();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  compareWith(id: string) {
    this.view = 'compare';
    this.selectedIds = [id];
    this.syncUrl();
    this.refresh();
  }

  addCompare(id: string) {
    if (this.selectedIds.includes(id) || this.selectedIds.length >= MAX_COMPARE) return;
    this.selectedIds = [...this.selectedIds, id];
    this.pickerQuery = '';
    this.syncUrl();
    this.refresh();
  }

  removeCompare(id: string) {
    this.selectedIds = this.selectedIds.filter(i => i !== id);
    if (!this.selectedIds.length) this.detail = null;
    this.syncUrl();
    this.refresh();
  }

  private allRecCache: { src: any[]; val: { recruiter_id: string; recruiter_name: string }[] } | null = null;

  get allRecruiters(): { recruiter_id: string; recruiter_name: string }[] {
    if (this.allRecCache && this.allRecCache.src === this.recruiters) return this.allRecCache.val;
    const val = this.computeAllRecruiters();
    this.allRecCache = { src: this.recruiters, val };
    return val;
  }

  private computeAllRecruiters(): { recruiter_id: string; recruiter_name: string }[] {
    return (this.recruiters || [])
      .map(r => ({
        recruiter_id: r.user_id,
        recruiter_name: `${r.first_name || ''} ${r.last_name || ''}`.trim() || r.email || r.user_id,
      }))
      .sort((a, b) => a.recruiter_name.localeCompare(b.recruiter_name));
  }

  get pickerMatches() {
    const q = this.pickerQuery.trim().toLowerCase();
    return this.allRecruiters
      .filter(r => !this.selectedIds.includes(r.recruiter_id) || this.view === 'single')
      .filter(r => !q || r.recruiter_name.toLowerCase().includes(q))
      .slice(0, 50);
  }

  pick(id: string) {
    if (this.view === 'single') this.openSingle(id);
    else this.addCompare(id);
    this.pickerOpen = false;
  }

  closePickerSoon() {
    setTimeout(() => { this.pickerOpen = false; this.cdr.detectChanges(); }, 150);
  }

  nameOf(id: string): string {
    return this.allRecruiters.find(r => r.recruiter_id === id)?.recruiter_name || id;
  }

  // =====================================================================
  // data loading
  // =====================================================================
  refresh() {
    if (this.view === 'team') this.fetchTeam();
    else if (this.selectedIds.length) this.fetchDetail();
    else { this.loading = false; this.error = ''; this.destroyCharts(); }
  }

  private params() {
    return { ...this.filters, client_name: this.client };
  }

  private fetchTeam() {
    const seq = ++this.requestSeq;
    this.loading = true;
    this.error = '';
    this.api.getRecruiterInsights(this.params()).subscribe({
      next: (data: any) => {
        if (seq !== this.requestSeq) return;
        try {
          this.team = data;
          this.tables.placements.setRows(data.placements.rows);
          this.tables.funnel.setRows(data.funnel.rows);
          this.tables.quality.setRows(data.quality.rows);
          this.tables.offerToJoin.setRows(data.offer_to_join.rows);
          this.tables.workload.setRows(data.workload.rows);
          this.tables.fill.setRows(data.fill_ageing.rows);
          this.tables.clients.setRows(data.clients);
          this.expandedClient = null;
        } catch (e) {
          console.error('Recruiter insights: failed to process team data', e);
        }
        this.loading = false;
        try {
          this.renderTeamCharts();
        } catch (e) {
          console.error('Recruiter insights: failed to render team charts', e);
          this.cdr.detectChanges();
        }
      },
      error: (err: any) => this.fail(seq, err),
    });
  }

  private fetchDetail() {
    const seq = ++this.requestSeq;
    this.loading = true;
    this.error = '';
    this.api.getRecruiterDetail({ ...this.params(), ids: this.selectedIds.join(',') }).subscribe({
      next: (data: any) => {
        if (seq !== this.requestSeq) return;
        try {
          this.detail = data;
          const first = data.recruiters[0];
          if (this.view === 'single' && first) {
            this.tables.requirements.setRows(first.requirements.map((r: any) => ({
              ...r,
              early: (r.stages.Sourced || 0) + (r.stages.Screening || 0),
            })));
            this.tables.singleClients.setRows(first.clients);
          }
        } catch (e) {
          console.error('Recruiter insights: failed to process detail data', e);
        }
        this.loading = false;
        this.cdr.detectChanges();
        try {
          this.renderDetailCharts();
        } catch (e) {
          console.error('Recruiter insights: failed to render detail charts', e);
        }
      },
      error: (err: any) => this.fail(seq, err),
    });
  }

  private fail(seq: number, err: any) {
    if (seq !== this.requestSeq) return;
    console.error('Failed to load recruiter insights', err);
    this.error = err?.error?.error || 'Could not load recruiter insights. Please try again.';
    this.loading = false;
    this.cdr.detectChanges();
  }

  // =====================================================================
  // formatting helpers
  // =====================================================================
  defOf(key: string): MetricDef {
    return this.metricDefs.find(d => d.key === key)!;
  }

  fmt(value: number | null | undefined, def: MetricDef): string {
    if (value === null || value === undefined) return '—';
    if (def.fmt === 'pct') return `${value}%`;
    if (def.fmt === 'dec') return value.toFixed(1);
    return String(Math.round(value * 10) / 10);
  }

  pct(v: number | null | undefined): string {
    return v === null || v === undefined ? '—' : `${v}%`;
  }

  convClass(p: number | null | undefined): string {
    if (p === null || p === undefined) return 'conv-na';
    return p < 30 ? 'conv-low' : p < 60 ? 'conv-mid' : 'conv-high';
  }

  rankText(m: any): string {
    return m && m.rank ? `#${m.rank} of ${m.of}` : '';
  }

  vsAvg(m: any, def: MetricDef): 'up' | 'down' | 'flat' {
    if (!def.ranked || !m || m.value === null || m.team_avg === null) return 'flat';
    return m.value > m.team_avg ? 'up' : m.value < m.team_avg ? 'down' : 'flat';
  }

  /** Compare table: highlight the best value in a row (ties all highlighted). */
  isBest(def: MetricDef, rec: any): boolean {
    if (!def.ranked || !this.detail || this.detail.recruiters.length < 2) return false;
    const vals = this.detail.recruiters
      .map((r: any) => r.metrics[def.key].value)
      .filter((v: any) => v !== null && v !== undefined);
    const v = rec.metrics[def.key].value;
    return v !== null && v !== undefined && vals.length > 1 && v === Math.max(...vals) && Math.max(...vals) > 0;
  }

  colorFor(i: number): string {
    return PALETTE[i % PALETTE.length];
  }

  toggleClient(name: string) {
    this.expandedClient = this.expandedClient === name ? null : name;
  }

  // ----- Pipeline Funnel selector (team view) -----
  private funnelCache: { team: any; fid: string; val: { title: string; stages: { label: string; value: number }[]; max: number } } | null = null;

  get funnelView(): { title: string; stages: { label: string; value: number }[]; max: number } {
    const c = this.funnelCache;
    if (c && c.team === this.team && c.fid === this.funnelFor) return c.val;
    const val = this.computeFunnelView();
    this.funnelCache = { team: this.team, fid: this.funnelFor, val };
    return val;
  }

  private computeFunnelView(): { title: string; stages: { label: string; value: number }[]; max: number } {
    const f = this.team?.funnel;
    if (!f) return { title: '', stages: [], max: 0 };
    const row = this.funnelFor ? f.rows.find((r: any) => r.recruiter_id === this.funnelFor) : f.team;
    const src = row || f.team;
    const stages = [
      { label: 'Sourced', value: src.sourced }, { label: 'Submitted', value: src.submitted },
      { label: 'Interviewed', value: src.interviewed }, { label: 'Offered', value: src.offered },
      { label: 'Hired', value: src.hired },
    ];
    return {
      title: row && this.funnelFor ? `Pipeline Funnel · ${row.recruiter_name}` : 'Pipeline Funnel (Team)',
      stages, max: src.sourced,
    };
  }

  barWidth(value: number, max: number): number {
    return max ? Math.max(4, Math.round((100 * value) / max)) : 0;
  }

  // ----- Hires per recruiter chart -----
  setHiresMode(mode: HiresMode) {
    this.hiresMode = mode;
    this.hiresPager.page = 1;
    this.renderTeamCharts();
  }

  /** Page change from the shared pager; the hires chart must be redrawn for its new page. */
  go(t: TableState<any>, p: number | string) {
    t.setPage(p);
    if (t === this.hiresPager) this.renderTeamCharts();
  }

  private hiresChartRows(): any[] {
    const sorted = [...(this.team?.placements.rows || [])].sort(
      (a, b) => b.hired - a.hired || b.offers - a.offers || a.recruiter_name.localeCompare(b.recruiter_name));
    const topN = (n: number) => {
      const head = sorted.slice(0, n);
      const rest = sorted.slice(n);
      if (rest.length) {
        head.push({
          recruiter_id: null, recruiter_name: `All other recruiters (${rest.length})`,
          hired: rest.reduce((s, r) => s + r.hired, 0), offers: rest.reduce((s, r) => s + r.offers, 0),
        });
      }
      return head;
    };
    if (this.hiresMode === 'top10') return topN(10);
    if (this.hiresMode === 'top25') return topN(25);
    if (this.hiresMode === 'bottom10') return sorted.slice(-10);
    this.hiresPager.setRows(sorted);
    return this.hiresPager.pageRows;
  }

  // =====================================================================
  // charts
  // =====================================================================
  private destroyCharts() {
    Object.values(this.charts).forEach(c => c.destroy());
    this.charts = {};
  }

  private make(id: string, config: any) {
    const canvas = document.getElementById(id) as HTMLCanvasElement | null;
    if (!canvas) return;
    this.charts[id]?.destroy();
    try {
      this.charts[id] = new Chart(canvas, config);
    } catch (e) {
      console.error('Recruiter insights chart failed', id, e);
    }
  }

  renderTeamCharts() {
    if (this.view !== 'team' || !this.team) return;
    // size the hires chart first so the canvas has its final height when it is created
    const rows = this.hiresChartRows();
    this.hiresHeight = Math.max(200, rows.length * 34 + 70);
    this.cdr.detectChanges();  // single pass: renders loaded data and the new chart height

    setTimeout(() => {
      this.destroyCharts();
      const t = this.team;

      // 1. Hires per recruiter (Top N / Bottom N / paged), click a bar to open that recruiter
      this.make('insHiresChart', {
        type: 'bar',
        data: {
          labels: rows.map(r => r.recruiter_name),
          datasets: [
            { label: 'Hired', data: rows.map(r => r.hired), backgroundColor: rows.map(r => r.recruiter_id ? PALETTE[1] : GREY) },
            { label: 'Offers pending', data: rows.map(r => r.offers), backgroundColor: rows.map(r => r.recruiter_id ? PALETTE[2] : '#e2e8f0') },
          ],
        },
        options: {
          indexAxis: 'y', responsive: true, maintainAspectRatio: false,
          onClick: (_e: any, els: any[]) => { if (els.length) this.openSingle(rows[els[0].index].recruiter_id); },
          onHover: (e: any, els: any[]) => {
            const c = e?.native?.target as HTMLElement | undefined;
            if (c) c.style.cursor = els.length && rows[els[0].index].recruiter_id ? 'pointer' : 'default';
          },
          scales: { x: { beginAtZero: true, ticks: { stepSize: 1 } } },
        },
      });

      // 2. Distribution: how many recruiters made N hires (reads well at any team size)
      this.make('insDistChart', {
        type: 'bar',
        data: {
          labels: t.placements.hires_distribution.map((b: any) => b.label),
          datasets: [{ label: 'Recruiters', data: t.placements.hires_distribution.map((b: any) => b.count), backgroundColor: PALETTE[0] }],
        },
        options: {
          responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
          scales: {
            x: { title: { display: true, text: 'Hires in period' } },
            y: { beginAtZero: true, ticks: { stepSize: 1 }, title: { display: true, text: 'Recruiters' } },
          },
        },
      });

      // 3. Weekly sourcing, stacked by source
      this.make('insSourcingChart', {
        type: 'bar',
        data: {
          labels: t.sourcing.weekly.map((w: any) => w.week),
          datasets: t.sourcing.sources.map((s: string, i: number) => ({
            label: s, data: t.sourcing.weekly.map((w: any) => w.by_source[s] || 0), backgroundColor: PALETTE[i % PALETTE.length],
          })),
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true, ticks: { stepSize: 1 } } },
        },
      });

      // 4. Quality scatter, click a dot to open that recruiter
      const q = t.quality.rows.filter((r: any) => r.sub_to_interview_pct !== null);
      if (q.length === 0) {
        this.charts['insQualityChart']?.destroy();
        delete this.charts['insQualityChart'];
      } else this.make('insQualityChart', {
        type: 'scatter',
        data: { datasets: [{ label: 'Recruiter', backgroundColor: PALETTE[0], pointRadius: 6,
          data: q.map((r: any) => ({ x: r.submitted, y: r.sub_to_interview_pct, name: r.recruiter_name, id: r.recruiter_id })) }] },
        options: {
          responsive: true, maintainAspectRatio: false,
          onClick: (_e: any, els: any[]) => { if (els.length) this.openSingle(q[els[0].index].recruiter_id); },
          plugins: { legend: { display: false }, tooltip: { callbacks: {
            label: (ctx: any) => `${ctx.raw.name}: ${ctx.raw.x} submitted, ${ctx.raw.y}% to interview` } } },
          scales: {
            x: { title: { display: true, text: 'Submissions' }, beginAtZero: true, ticks: { stepSize: 1 } },
            y: { title: { display: true, text: 'Submit-to-interview %' }, beginAtZero: true, max: 100 },
          },
        },
      });

      // 5. Ageing: the 10 recruiters with the most open requirements, everyone else combined
      const fa = t.fill_ageing;
      const withTotal = fa.rows.map((r: any) => ({ ...r, total: fa.bucket_labels.reduce((s: number, b: string) => s + r.ageing[b], 0) }))
        .sort((a: any, b: any) => b.total - a.total);
      const top = withTotal.slice(0, 10);
      const rest = withTotal.slice(10);
      if (rest.length) {
        const ageing: any = {};
        fa.bucket_labels.forEach((b: string) => ageing[b] = rest.reduce((s: number, r: any) => s + r.ageing[b], 0));
        top.push({ recruiter_name: `All other recruiters (${rest.length})`, ageing });
      }
      const bucketColors = [PALETTE[1], PALETTE[0], PALETTE[2], PALETTE[4]];
      this.make('insAgeingChart', {
        type: 'bar',
        data: {
          labels: top.map((r: any) => r.recruiter_name),
          datasets: fa.bucket_labels.map((b: string, i: number) => ({
            label: `${b} days`, data: top.map((r: any) => r.ageing[b]), backgroundColor: bucketColors[i],
          })),
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true, ticks: { stepSize: 1 } } },
        },
      });
    }, 50);
  }

  renderDetailCharts() {
    if (this.view === 'team' || !this.detail) return;
    setTimeout(() => {
      this.destroyCharts();
      const d = this.detail;
      const recs: any[] = d.recruiters;
      const stageKeys = ['sourced', 'submitted', 'interviewed', 'offered', 'hired'];
      const stageLabels = ['Sourced', 'Submitted', 'Interviewed', 'Offered', 'Hired'];

      // funnel: each selected recruiter vs the team average (per recruiter)
      this.make('insFunnelCompareChart', {
        type: 'bar',
        data: {
          labels: stageLabels,
          datasets: [
            ...recs.map((r, i) => ({ label: r.recruiter_name, data: stageKeys.map(k => r.funnel[k]), backgroundColor: PALETTE[i % PALETTE.length] })),
            { label: 'Team average', data: stageKeys.map(k => d.team_funnel_avg[k]), backgroundColor: GREY },
          ],
        },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } },
      });

      if (this.view === 'single' && recs[0]) {
        const tr = recs[0].trend;
        this.make('insTrendChart', {
          type: 'line',
          data: {
            labels: tr.map((w: any) => w.week),
            datasets: [
              { label: 'Candidates added', data: tr.map((w: any) => w.candidates_added), borderColor: PALETTE[0], backgroundColor: PALETTE[0], tension: 0.25 },
              { label: 'Submissions', data: tr.map((w: any) => w.submissions), borderColor: PALETTE[2], backgroundColor: PALETTE[2], tension: 0.25 },
              { label: 'Hires', data: tr.map((w: any) => w.hires), borderColor: PALETTE[1], backgroundColor: PALETTE[1], tension: 0.25 },
            ],
          },
          options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } },
        });
      }

      if (this.view === 'compare') {
        // radar axes are all 0-100: hires are scaled against the best recruiter in the team
        const maxHires = d.team_max_hires || 0;
        const axes = ['Hires (vs top)', 'Submit → Interview', 'Interview → Offer', 'Offer → Hired', 'Fill rate'];
        const vals = (get: (k: string) => number | null) => [
          maxHires ? Math.round(100 * ((get('hires') ?? 0) / maxHires)) : 0,
          get('sub_to_interview_pct') ?? 0, get('interview_to_offer_pct') ?? 0,
          get('offer_to_hired_pct') ?? 0, get('fill_pct') ?? 0,
        ];
        this.make('insRadarChart', {
          type: 'radar',
          data: {
            labels: axes,
            datasets: [
              ...recs.map((r, i) => ({
                label: r.recruiter_name, data: vals(k => r.metrics[k].value),
                borderColor: PALETTE[i % PALETTE.length], backgroundColor: PALETTE[i % PALETTE.length] + '22',
              })),
              { label: 'Team average', data: vals(k => d.team_avg[k]), borderColor: '#94a3b8', borderDash: [5, 4], backgroundColor: 'transparent' },
            ],
          },
          options: { responsive: true, maintainAspectRatio: false, scales: { r: { beginAtZero: true, max: 100 } } },
        });
      }
    }, 50);
  }
}
