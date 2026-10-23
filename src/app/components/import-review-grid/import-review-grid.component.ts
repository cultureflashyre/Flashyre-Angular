import {
  ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  EmailFix, PreviewFilter, PreviewOutcome, RecruiterWorkflowBulkImportService, RowPreview
} from '../../services/recruiter-workflow-bulk-import.service';
import { PersonBadgesComponent, missingFieldLabel } from '../person-badges/person-badges.component';

interface FilterChip { key: PreviewFilter; label: string; }

const PROBLEM_LABELS: { [key: string]: string } = {
  invalid_email: 'Invalid email',
  phone_damaged_by_excel: 'Phone damaged by Excel',
  invalid_phone: 'Invalid phone',
  duplicate_in_file: 'Duplicate in file',
};

/**
 * The review table of the bulk-import wizard. Shows every staged row (100 per server page) with what Import will do
 * with it, lets the recruiter tick suggested email fixes and edit Email, Phone, Skills, Education and Preferred location
 * in place (saved when the cell loses focus). Nothing here ever blocks Import: problems and unticked fixes are optional.
 */
@Component({
  selector: 'app-import-review-grid',
  standalone: true,
  imports: [CommonModule, PersonBadgesComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toolbar">
      <div class="chips" role="tablist" aria-label="Filter rows">
        <button *ngFor="let f of filters" type="button" class="fchip" role="tab"
                [class.active]="filter() === f.key" [attr.aria-selected]="filter() === f.key"
                [attr.data-filter]="f.key" (click)="setFilter(f.key)">
          {{ f.label }} <span class="n">{{ filterCounts()[f.key] || 0 }}</span>
        </button>
      </div>
      <button type="button" class="accept-all" [disabled]="busy()" (click)="acceptAllLikely()">Accept all likely fixes</button>
    </div>

    <p *ngIf="error()" class="error" role="alert">{{ error() }}</p>

    <div class="scroll">
      <table class="grid">
        <thead>
          <tr>
            <th class="c-row">Row</th><th>Name</th><th>Phone</th><th>Email</th><th>Skills</th>
            <th>Education</th><th>Preferred location</th><th class="c-status">Import result</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let row of rows(); trackBy: trackRow" class="row" [attr.data-row]="row.row_number"
              [class.owned]="isOwned(row)">
            <td class="c-row">{{ row.row_number }}</td>
            <td class="name">{{ nameOf(row) }}</td>

            <td>
              <span *ngIf="isOwned(row)" class="ro">{{ text(row, 'phone') }}</span>
              <input *ngIf="!isOwned(row)" class="cell" data-field="phone" type="text" [value]="text(row, 'phone')"
                     placeholder="Phone" (blur)="saveCell(row, 'phone', $any($event.target).value)"
                     (keydown.enter)="$any($event.target).blur()" />
            </td>

            <td class="email-cell">
              <span *ngIf="isOwned(row)" class="ro">{{ text(row, 'email') }}</span>
              <ng-container *ngIf="!isOwned(row)">
                <div *ngIf="fixOf(row) as fix" class="fix">
                  <s class="orig">{{ fix.original }}</s>
                  <label class="suggest">
                    <input type="checkbox" class="fix-box" [checked]="fix.ticked"
                           (change)="toggleFix(row, fix, $any($event.target))" />
                    <span class="sugg">{{ fix.suggested }}</span>
                  </label>
                  <span class="conf" [class.guess]="fix.confidence === 'guess'" [title]="fix.reason">
                    {{ fix.confidence === 'guess' ? 'Guess' : 'Suggested fix' }}
                  </span>
                  <button type="button" class="linkish" (click)="startEditEmail(row)">Type another</button>
                </div>
                <input *ngIf="!fixOf(row) || editingEmail().has(row.row_number)" class="cell" data-field="email"
                       type="text" [value]="editingEmail().has(row.row_number) ? '' : text(row, 'email')" placeholder="Email"
                       (blur)="saveCell(row, 'email', $any($event.target).value)"
                       (keydown.enter)="$any($event.target).blur()" />
              </ng-container>
            </td>

            <td>
              <span *ngIf="isOwned(row)" class="ro">{{ text(row, 'skills') }}</span>
              <input *ngIf="!isOwned(row)" class="cell" data-field="skills" type="text" [value]="text(row, 'skills')"
                     placeholder="Skills" (blur)="saveCell(row, 'skills', $any($event.target).value)"
                     (keydown.enter)="$any($event.target).blur()" />
            </td>

            <td>
              <span *ngIf="isOwned(row)" class="ro">{{ educationOf(row) }}</span>
              <input *ngIf="!isOwned(row)" class="cell" data-field="education" type="text" [value]="educationOf(row)"
                     placeholder="Education" (blur)="saveCell(row, educationField(row), $any($event.target).value)"
                     (keydown.enter)="$any($event.target).blur()" />
            </td>

            <td>
              <span *ngIf="isOwned(row)" class="ro">{{ text(row, 'preferred_location') }}</span>
              <input *ngIf="!isOwned(row)" class="cell" data-field="preferred_location" type="text"
                     [value]="text(row, 'preferred_location')" placeholder="Preferred location"
                     (blur)="saveCell(row, 'preferred_location', $any($event.target).value)"
                     (keydown.enter)="$any($event.target).blur()" />
            </td>

            <td class="c-status">
              <span class="pill" [ngClass]="pillClass(row)" [title]="pillTitle(row)">{{ pillLabel(row) }}</span>
              <span *ngIf="isOwned(row)" class="owner">Owned by {{ row.owner_name }}</span>
              <app-person-badges *ngIf="showNeedsInfo(row)" [missingFields]="row.missing" [compact]="true"></app-person-badges>
              <span *ngFor="let p of row.problems" class="problem">{{ problemLabel(p) }}</span>
            </td>
          </tr>
          <tr *ngIf="!rows().length && !loading()">
            <td colspan="8" class="empty">No rows in this view.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="pager" *ngIf="totalPages() > 1">
      <button type="button" class="prev" [disabled]="page() <= 1 || loading()" (click)="goToPage(page() - 1)">Previous</button>
      <span>Page {{ page() }} of {{ totalPages() }}</span>
      <button type="button" class="next" [disabled]="page() >= totalPages() || loading()" (click)="goToPage(page() + 1)">Next</button>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .toolbar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 10px; }
    .chips { display: flex; flex-wrap: wrap; gap: 6px; }
    .fchip {
      border: 1px solid var(--line, #e2e8f0); background: var(--surface, #fff); color: var(--ink-2, #475569);
      border-radius: 999px; padding: 3px 10px; font: inherit; font-size: 12px; font-weight: 600; cursor: pointer;
    }
    .fchip .n { margin-left: 4px; opacity: 0.75; }
    .fchip.active { background: var(--accent-soft, #eff6ff); color: var(--accent, #2563eb); border-color: var(--accent, #2563eb); }
    .accept-all {
      border: 0; border-radius: 6px; padding: 6px 12px; font: inherit; font-size: 12.5px; font-weight: 600; cursor: pointer;
      background: var(--accent, #2563eb); color: #fff;
    }
    .accept-all:disabled { opacity: 0.55; cursor: default; }
    .error { color: var(--bad, #dc2626); font-size: 12.5px; margin: 0 0 8px; }
    .scroll { overflow-x: auto; }
    .grid { width: 100%; border-collapse: collapse; font-size: 12.5px; }
    .grid th { text-align: left; padding: 6px 8px; font-weight: 600; color: var(--ink-2, #475569); border-bottom: 1px solid var(--line, #e2e8f0); white-space: nowrap; }
    .grid td { padding: 5px 8px; border-bottom: 1px solid var(--line, #f1f5f9); vertical-align: top; }
    .c-row { width: 44px; color: var(--ink-2, #64748b); }
    .c-status { min-width: 190px; }
    .name { font-weight: 600; white-space: nowrap; }
    .owned { background: var(--primary-soft, #f8fafc); color: var(--ink-2, #64748b); }
    .cell { width: 100%; min-width: 110px; box-sizing: border-box; padding: 3px 6px; font: inherit; font-size: 12.5px; border: 1px solid transparent; border-radius: 4px; background: transparent; }
    .cell:hover { border-color: var(--line, #e2e8f0); }
    .cell:focus { border-color: var(--accent, #2563eb); background: #fff; outline: none; }
    .fix { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
    .orig { color: var(--bad, #dc2626); }
    .suggest { display: inline-flex; align-items: center; gap: 4px; cursor: pointer; font-weight: 600; }
    .conf { font-size: 10.5px; font-weight: 600; padding: 1px 7px; border-radius: 999px; background: var(--accent-soft, #eff6ff); color: var(--accent, #2563eb); }
    .conf.guess { background: var(--warn-soft, #fffbeb); color: var(--warn, #d97706); }
    .linkish { border: 0; background: none; padding: 0; font: inherit; font-size: 11px; color: var(--accent, #2563eb); cursor: pointer; text-decoration: underline; }
    /* Same pill look as app-person-badges */
    .pill {
      display: inline-flex; align-items: center; padding: 1px 7px; border-radius: 999px;
      font-size: 10.5px; font-weight: 600; line-height: 1.5; white-space: nowrap;
    }
    .pill-new { background: var(--good-soft, #ecfdf5); color: var(--good, #059669); }
    .pill-needs { background: var(--warn-soft, #fffbeb); color: var(--warn, #d97706); }
    .pill-updated { background: var(--accent-soft, #eff6ff); color: var(--accent, #2563eb); }
    .pill-skip { background: var(--primary-soft, #f1f5f9); color: var(--ink-2, #475569); }
    .pill-problem { background: var(--bad-soft, #fef2f2); color: var(--bad, #dc2626); }
    .owner { margin-left: 6px; font-size: 11px; color: var(--ink-2, #64748b); }
    .problem { display: inline-flex; margin-left: 6px; padding: 1px 7px; border-radius: 999px; font-size: 10.5px; font-weight: 600; background: var(--bad-soft, #fef2f2); color: var(--bad, #dc2626); }
    .empty { text-align: center; color: var(--ink-2, #64748b); padding: 18px; }
    .pager { display: flex; align-items: center; justify-content: center; gap: 12px; margin-top: 10px; font-size: 12.5px; }
    .pager button { border: 1px solid var(--line, #e2e8f0); background: #fff; border-radius: 6px; padding: 4px 10px; font: inherit; cursor: pointer; }
    .pager button:disabled { opacity: 0.5; cursor: default; }
  `]
})
export class ImportReviewGridComponent implements OnChanges {
  private readonly api = inject(RecruiterWorkflowBulkImportService);

  @Input() previewId: string | null = null;
  /** Emits the per-outcome counts whenever the server reports new ones (load, edit, accept). */
  @Output() countsChange = new EventEmitter<Record<string, number>>();

  readonly filters: FilterChip[] = [
    { key: 'all', label: 'All' },
    { key: 'ready', label: 'Ready' },
    { key: 'needs_info', label: 'Needs info' },
    { key: 'fixes', label: 'Suggested fixes' },
    { key: 'skipped', label: 'Will skip' },
    { key: 'errors', label: 'Problems' },
  ];

  readonly rows = signal<RowPreview[]>([]);
  readonly filter = signal<PreviewFilter>('all');
  readonly page = signal(1);
  readonly pageSize = signal(100);
  readonly total = signal(0);
  readonly filterCounts = signal<Record<string, number>>({});
  readonly loading = signal(false);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly editingEmail = signal<Set<number>>(new Set());

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['previewId'] && this.previewId) {
      this.page.set(1);
      this.load();
    }
  }

  totalPages(): number {
    return Math.max(1, Math.ceil(this.total() / (this.pageSize() || 100)));
  }

  trackRow = (_: number, row: RowPreview) => row.row_number;

  setFilter(f: PreviewFilter): void {
    this.filter.set(f);
    this.page.set(1);
    this.load();
  }

  goToPage(p: number): void {
    this.page.set(p);
    this.load();
  }

  /** (Re)loads the current page from the server. */
  load(): void {
    if (!this.previewId) { return; }
    this.loading.set(true);
    this.api.getPreviewRows(this.previewId, this.page(), this.filter()).subscribe({
      next: res => {
        this.rows.set(res.results || []);
        this.total.set(res.count || 0);
        if (res.page_size) { this.pageSize.set(res.page_size); }
        this.applyCounts(res.counts, res.filter_counts);
        this.loading.set(false);
      },
      error: err => { this.loading.set(false); this.error.set(this.messageFrom(err, 'Could not load the rows.')); },
    });
  }

  acceptAllLikely(): void {
    if (!this.previewId) { return; }
    this.busy.set(true);
    this.error.set('');
    this.api.acceptFixes(this.previewId, ['auto', 'likely']).subscribe({
      next: res => {
        this.applyCounts(res.counts, res.filter_counts);
        this.busy.set(false);
        this.load();
      },
      error: err => { this.busy.set(false); this.error.set(this.messageFrom(err, 'Could not accept the fixes.')); },
    });
  }

  toggleFix(row: RowPreview, fix: EmailFix, box: HTMLInputElement): void {
    const wanted = box.checked;
    this.send(row, undefined, { email: wanted ? fix.suggested : '' }, () => { box.checked = fix.ticked; });
  }

  saveCell(row: RowPreview, field: string, raw: string): void {
    const value = (raw ?? '').trim();
    const wasEditingEmail = field === 'email' && this.editingEmail().has(row.row_number);
    if (value === this.currentText(row, field) && !wasEditingEmail) { return; }
    if (wasEditingEmail && !value) { return; }
    this.send(row, { [field]: value }, undefined, undefined, () => {
      if (wasEditingEmail) { this.stopEditEmail(row.row_number); }
    });
  }

  startEditEmail(row: RowPreview): void {
    const next = new Set(this.editingEmail());
    next.add(row.row_number);
    this.editingEmail.set(next);
  }

  private stopEditEmail(rowNumber: number): void {
    const next = new Set(this.editingEmail());
    next.delete(rowNumber);
    this.editingEmail.set(next);
  }

  private send(
    row: RowPreview, edits?: Record<string, any>, fixes?: Record<string, string>, onError?: () => void, onDone?: () => void
  ): void {
    if (!this.previewId) { return; }
    this.error.set('');
    this.api.updatePreviewRow(this.previewId, row.row_number, edits, fixes).subscribe({
      next: res => {
        const { changed_rows, counts, filter_counts, ...updated } = res as any;
        this.rows.update(list => list.map(r => (r.row_number === row.row_number ? (updated as RowPreview) : r)));
        this.applyCounts(counts, filter_counts);
        onDone?.();
        if (changed_rows && changed_rows.length) { this.load(); }
      },
      error: err => { onError?.(); this.error.set(this.messageFrom(err, 'Could not save the change.')); },
    });
  }

  private applyCounts(counts?: Record<string, number>, filterCounts?: Record<string, number>): void {
    if (filterCounts) { this.filterCounts.set(filterCounts); }
    if (counts) { this.countsChange.emit(counts); }
  }

  private messageFrom(err: any, fallback: string): string {
    return (err && err.error && (err.error.detail || err.error.error)) || fallback;
  }

  // ---- view helpers ----
  isOwned(row: RowPreview): boolean { return row.outcome === 'skipped_owned'; }

  fixOf(row: RowPreview): EmailFix | null {
    return (row.fixes || []).find(f => f.field === 'email' || !f.field) || null;
  }

  text(row: RowPreview, field: string): string {
    const v = row.values ? row.values[field] : null;
    if (v === null || v === undefined) { return ''; }
    return Array.isArray(v) ? v.join(', ') : String(v);
  }

  private currentText(row: RowPreview, field: string): string {
    return this.text(row, field).trim();
  }

  educationField(row: RowPreview): string {
    return row.values && row.values['latest_education_level'] ? 'latest_education_level' : 'qualification';
  }

  educationOf(row: RowPreview): string {
    return this.text(row, 'latest_education_level') || this.text(row, 'qualification');
  }

  nameOf(row: RowPreview): string {
    const full = this.text(row, 'candidate_name');
    if (full) { return full; }
    return [this.text(row, 'first_name_only'), this.text(row, 'last_name_only')].filter(Boolean).join(' ');
  }

  pillLabel(row: RowPreview): string {
    switch (row.outcome as PreviewOutcome) {
      case 'created_complete': return 'New candidate';
      case 'created_incomplete': return 'Needs info';
      case 'updated': case 'promoted': case 'matched': return 'Updated';
      case 'skipped_owned': return 'Will skip';
      case 'skipped_invalid': return 'Problem';
      case 'merged_into_row': return `Merged into row ${row.duplicate_of}`;
      default: return String(row.outcome);
    }
  }

  pillClass(row: RowPreview): string {
    switch (row.outcome as PreviewOutcome) {
      case 'created_complete': return 'pill-new';
      case 'created_incomplete': return 'pill-needs';
      case 'updated': case 'promoted': case 'matched': return 'pill-updated';
      case 'skipped_invalid': return 'pill-problem';
      default: return 'pill-skip';
    }
  }

  pillTitle(row: RowPreview): string {
    if (row.outcome === 'created_incomplete' && row.missing.length) {
      return 'Still needed: ' + row.missing.map(m => missingFieldLabel(m)).join(', ');
    }
    if (row.outcome === 'skipped_owned') { return `Owned by ${row.owner_name}, so this row will be skipped.`; }
    return '';
  }

  /** Updated rows that are still incomplete also get the "Needs info" badge. */
  showNeedsInfo(row: RowPreview): boolean {
    return ['updated', 'promoted', 'matched'].includes(row.outcome) && (row.missing || []).length > 0;
  }

  problemLabel(code: string): string {
    return PROBLEM_LABELS[code] || code.replace(/_/g, ' ');
  }
}
