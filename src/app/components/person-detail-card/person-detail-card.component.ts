import { ChangeDetectionStrategy, Component, HostListener, computed, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Candidate, IntakePerson } from '../../services/recruiter-workflow-candidate.service';
import { PersonBadgesComponent } from '../person-badges/person-badges.component';
import { PersonNotesComponent } from '../person-notes/person-notes.component';
import { ResumeStatusLineComponent } from '../resume-status-line/resume-status-line.component';

export type PersonDetailTab = 'overview' | 'resume' | 'notes' | 'sheet' | 'applications';

/** Values longer than this are cut with a "Show more" link in the "From the sheet" tab. */
export const SHEET_VALUE_PREVIEW_CHARS = 200;

interface EducationRow { level: string; institution: string; specialization: string; year: string; }
interface SheetRow { key: string; value: string; long: boolean; label?: string; }
interface PlacementInfo { status: 'Hired' | 'Offered'; placedBy: string; job: string; client: string; at: string; cooldown: boolean; }

/** import_metadata keys shown first, in this order, with their labels. */
const META_PROMINENT: [string, string][] = [
  ['recruiter', 'Recruiter'], ['spoc', 'SPOC'], ['client', 'Client'], ['sub_client', 'Sub client'], ['status', 'Status'],
  ['l1_date', 'L1 date'], ['l1_feedback', 'L1 feedback'], ['l2_date', 'L2 date'], ['l2_feedback', 'L2 feedback'], ['comments', 'Tracker comments']
];
/** import_metadata keys that are shown elsewhere in the card or are internal; never listed as sheet details. */
const META_SKIP = new Set([
  'extra_columns', 'file_name', 'imported_at', 'batch_id', 'upload_batch_id', 'row_number', 'invalid_email', 'phone_problem',
  'email_fix', 'recruiter_raw', 'sourced_by_id', 'preferred_location_source', 'resume_matched', 'resume_matched_filename',
  'resume_matched_at'
]);
const META_LABELS: { [key: string]: string } = { sheet_name: 'Sheet', dob: 'Date of birth', qualification: 'Qualification', secondary_education: 'Secondary education' };

/**
 * Read-only detail pop-up for one person. Works for a candidate and for a Needs info person:
 * both shapes are normalised here, so the same person shows the same data in either kind.
 * Everything is rendered with plain-text interpolation only (imported sheet text is never HTML).
 */
@Component({
  selector: 'app-person-detail-card',
  standalone: true,
  imports: [CommonModule, PersonBadgesComponent, PersonNotesComponent, ResumeStatusLineComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './person-detail-card.component.html',
  styleUrls: ['./person-detail-card.component.css']
})
export class PersonDetailCardComponent {
  readonly person = input.required<Candidate | IntakePerson | any>();
  /** True for the sourcing recruiter or an admin. */
  readonly canEdit = input<boolean>(false);
  /** Months a placed person stays in cooldown (the page loads the configured value). */
  readonly cooldownMonths = input<number>(6);

  readonly closed = output<void>();
  readonly completeProfile = output<void>();
  /** The Verify tag was clicked: the page opens the sidebar to review the AI-filled values (nothing is verified here). */
  readonly reviewAi = output<void>();
  readonly edit = output<void>();
  /** Retry on the resume status line (editors only): the page re-queues the parse and refreshes the person. */
  readonly retryResume = output<void>();
  /** Refresh on the resume status line while the resume is being read: the page reloads the person. */
  readonly refreshPerson = output<void>();
  /** The resume path or url; the page turns it into a signed link. */
  readonly openResume = output<string>();

  readonly tab = signal<PersonDetailTab>('overview');
  private readonly expanded = signal<Record<string, boolean>>({});

  readonly kind = computed<'candidate' | 'intake'>(() => (this.person()?.kind === 'intake' ? 'intake' : 'candidate'));
  readonly missing = computed<string[]>(() => this.person()?.missing_fields || []);
  readonly fullName = computed(() => {
    const p = this.person() || {};
    return [p.first_name, p.last_name].filter(x => !!x).join(' ').trim() || 'Unnamed';
  });
  readonly initials = computed(() => {
    const p = this.person() || {};
    const a = (p.first_name || '').trim().charAt(0);
    const b = (p.last_name || '').trim().charAt(0);
    return (a + b).toUpperCase() || '?';
  });
  readonly subtitle = computed(() => {
    const p = this.person() || {};
    const role = p.current_job_title || p.work_experience;
    return [role, p.latest_company].filter(x => !!x && String(x).trim()).join(' at ') || '';
  });
  /** Edit (the full form) is for complete people only; incomplete people go through Complete profile. */
  readonly showEdit = computed(() => this.canEdit() && this.missing().length === 0);
  readonly showComplete = computed(() => this.missing().length > 0);

  readonly phone = computed(() => this.person()?.phone_number || '');
  readonly email = computed(() => this.person()?.email || '');
  readonly currentLocation = computed(() => this.formatLocations(this.person()?.current_location));
  readonly preferredLocations = computed(() => {
    const p = this.person() || {};
    if (Array.isArray(p.preferred_locations) && p.preferred_locations.length) {
      return p.preferred_locations.map((l: any) => l?.name || String(l)).join(', ');
    }
    return this.formatLocations(p.preferred_location);
  });
  readonly totalExperience = computed(() => this.years(this.person()?.total_experience));
  readonly relevantExperience = computed(() => this.years(this.person()?.relevant_experience));
  readonly noticePeriod = computed(() => this.person()?.notice_period || '');
  readonly currentCtc = computed(() => {
    const v = this.person()?.current_ctc;
    if (v === null || v === undefined || v === '') { return ''; }
    const s = String(v);
    return /lpa|fresher/i.test(s) ? s : s + ' LPA';
  });
  readonly expectedCtc = computed(() => {
    const p = this.person() || {};
    const lo = p.expected_ctc_min;
    const hi = p.expected_ctc_max;
    const has = (v: any) => v !== null && v !== undefined && v !== '';
    if (!has(lo) && !has(hi)) { return ''; }
    if (!has(hi) || lo === hi) { return lo + ' LPA'; }
    if (!has(lo)) { return hi + ' LPA'; }
    return `${lo} - ${hi} LPA`;
  });

  readonly education = computed<EducationRow[]>(() => {
    const p = this.person() || {};
    const rows: EducationRow[] = [];
    if (Array.isArray(p.education) && p.education.length) {
      for (const e of p.education) {
        rows.push({ level: e?.level || '', institution: e?.institution || '', specialization: e?.specialization || '', year: e?.year ? String(e.year) : '' });
      }
    } else if (p.latest_education_level || p.latest_university || p.latest_specialization) {
      rows.push({
        level: p.latest_education_level || '', institution: p.latest_university || '',
        specialization: p.latest_specialization || '', year: p.year_of_graduation ? String(p.year_of_graduation) : ''
      });
    }
    return rows;
  });

  readonly skills = computed<string[]>(() => {
    const p = this.person() || {};
    const list: string[] = Array.isArray(p.skills_list) && p.skills_list.length
      ? p.skills_list
      : (typeof p.skills === 'string' ? p.skills.split(',') : []);
    return list.map(s => String(s).trim()).filter(s => !!s);
  });

  readonly resumeRef = computed<string>(() => {
    const p = this.person() || {};
    return p.resume || p.resume_url || p.resume_path || '';
  });
  readonly resumeStatus = computed(() => (this.resumeRef() ? this.person()?.resume_status || 'none' : 'none'));
  readonly resumeName = computed(() => this.person()?.resume_filename || 'Resume');

  readonly sourcedBy = computed(() => {
    const p = this.person() || {};
    return p.sourced_by_name || p.recruiter_name || '';
  });

  readonly importSource = computed(() => this.person()?.import_source || null);
  readonly sheetRows = computed<SheetRow[]>(() => {
    const extra = this.person()?.extra_columns;
    if (!extra || typeof extra !== 'object') { return []; }
    return Object.keys(extra).map(key => {
      const value = extra[key] === null || extra[key] === undefined ? '' : String(extra[key]);
      return { key, value, long: value.length > SHEET_VALUE_PREVIEW_CHARS };
    });
  });
  /** The tracker details the sheet carried (client, SPOC, recruiter, status, feedback, comments...), plain text only. */
  readonly metaRows = computed<SheetRow[]>(() => {
    const meta = this.person()?.import_metadata;
    if (!meta || typeof meta !== 'object') { return []; }
    const text = (v: any): string => {
      if (v === null || v === undefined || typeof v === 'object') { return ''; }
      const s = String(v).trim();
      return /^(none|nan|nat|null|undefined)$/i.test(s) ? '' : s;
    };
    const rows: SheetRow[] = [];
    const add = (key: string, label: string) => {
      const value = text(meta[key]);
      if (value) { rows.push({ key: 'meta:' + key, label, value, long: value.length > SHEET_VALUE_PREVIEW_CHARS }); }
    };
    const done = new Set<string>();
    for (const [key, label] of META_PROMINENT) { add(key, label); done.add(key); }
    for (const key of Object.keys(meta)) {
      if (done.has(key) || META_SKIP.has(key)) { continue; }
      add(key, META_LABELS[key] || this.humanize(key));
    }
    return rows;
  });
  readonly hasSheetDetails = computed(() => this.sheetRows().length > 0 || this.metaRows().length > 0 || !!this.importSource());

  /** Offered / Hired details; null when the person has no placement. */
  readonly placement = computed<PlacementInfo | null>(() => {
    const p = this.person() || {};
    const raw = p.placement_status;
    if (raw !== 'Hired' && raw !== 'Offered' && raw !== 'Offer') { return null; }
    const at = p.placement_at || '';
    return {
      status: raw === 'Hired' ? 'Hired' : 'Offered',
      placedBy: p.placed_by_name || '',
      job: p.placement_job_title || '',
      client: p.placement_client_name || '',
      at,
      cooldown: raw === 'Hired' && this.isRecent(at)
    };
  });

  readonly applications = computed<any[]>(() => this.person()?.active_applications || []);
  readonly submissions = computed<any[]>(() => this.person()?.submissions || []);
  readonly formTitle = computed(() => this.person()?.source_form_title || '');
  readonly hasApplications = computed(() => this.applications().length > 0 || this.submissions().length > 0);

  readonly tabs = computed<{ id: PersonDetailTab; label: string }[]>(() => {
    const t: { id: PersonDetailTab; label: string }[] = [
      { id: 'overview', label: 'Overview' },
      { id: 'resume', label: 'Resume' },
      { id: 'notes', label: 'Notes' },
      { id: 'sheet', label: 'From the sheet' }
    ];
    if (this.hasApplications()) { t.push({ id: 'applications', label: 'Applications' }); }
    return t;
  });

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closed.emit();
  }

  select(tab: PersonDetailTab): void {
    this.tab.set(tab);
  }

  isExpanded(key: string): boolean {
    return !!this.expanded()[key];
  }

  toggle(key: string): void {
    this.expanded.update(m => ({ ...m, [key]: !m[key] }));
  }

  shown(row: SheetRow): string {
    return row.long && !this.isExpanded(row.key) ? row.value.slice(0, SHEET_VALUE_PREVIEW_CHARS) + '...' : row.value;
  }

  open(): void {
    const ref = this.resumeRef();
    if (ref) { this.openResume.emit(ref); }
  }

  trackByIndex(i: number): number {
    return i;
  }

  trackByKey(_: number, row: SheetRow): string {
    return row.key;
  }

  private isRecent(at: string): boolean {
    if (!at) { return false; }
    const t = new Date(at).getTime();
    if (isNaN(t)) { return false; }
    return Date.now() - t < this.cooldownMonths() * 30 * 24 * 60 * 60 * 1000;
  }

  private humanize(key: string): string {
    const s = key.replace(/[_-]+/g, ' ').trim();
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  private years(v: any): string {
    return v === null || v === undefined || v === '' ? '' : `${v} Yrs`;
  }

  private formatLocations(value: any): string {
    if (!value) { return ''; }
    let v = value;
    if (typeof v === 'string') {
      try { v = JSON.parse(v); } catch { return v; }
    }
    if (Array.isArray(v)) { return v.map(l => (l && l.name) || String(l)).join(', '); }
    return typeof v === 'string' ? v : String(v);
  }
}
