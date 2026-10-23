import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, QueryList, SimpleChanges, ViewChildren } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Observable, Subscription, timer } from 'rxjs';
import { switchMap, takeWhile } from 'rxjs/operators';
import {
  Candidate, IntakePerson, IntakeUpdateResult, RecruiterWorkflowCandidateService
} from '../../services/recruiter-workflow-candidate.service';
import { PersonBadgesComponent, aiFieldLabel, missingFieldLabel } from '../person-badges/person-badges.component';
import { PersonNotesComponent } from '../person-notes/person-notes.component';
import { ResumeStatusLineComponent } from '../resume-status-line/resume-status-line.component';
import { LocationInputComponent } from '../location-input/location-input.component';
import { PlaceEntry } from '../../services/location-autocomplete.service';

/** Resume limit, as enforced by the server. */
export const RESUME_MAX_BYTES = 20 * 1024 * 1024;
const RESUME_EXTENSIONS = ['pdf', 'doc', 'docx'];
/** The resume status is polled every 3 s, up to 25 times (75 s). */
const POLL_EVERY_MS = 3000;
const POLL_MAX_ATTEMPTS = 25;
const NO_TEXT_MESSAGE = 'The file has no readable text (it may be blank or a scan). You can still save the file.';

/**
 * Side panel to complete a person who is missing mandatory fields. It works for a person in the "Needs info"
 * inbox (`kind` "intake", saved to the inbox record) and for a candidate that is still incomplete (`kind`
 * "candidate", saved to the candidate record). It lists what is missing, lets the sourcing recruiter (or an admin)
 * fill the fields in (typing, or by uploading a resume that is read for review), and shows the uploaded resume.
 * Anyone else gets the same panel in view mode: details and resume, no inputs and no upload.
 */
@Component({
  selector: 'app-intake-drawer',
  standalone: true,
  imports: [CommonModule, FormsModule, PersonBadgesComponent, PersonNotesComponent, LocationInputComponent, ResumeStatusLineComponent],
  template: `
    <div class="overlay" (click)="close()"></div>
    <aside class="drawer" role="dialog" aria-label="Complete profile">
      <header>
        <div>
          <h2>{{ displayName }}</h2>
          <div class="sub">
            Source: {{ person?.source || '—' }} · Sourced by {{ person?.sourced_by_name || person?.recruiter_name || 'N/A' }}
          </div>
          <button type="button" class="link view-profile" (click)="viewProfile.emit()">View full profile</button>
        </div>
        <button type="button" class="x" (click)="close()" aria-label="Close">×</button>
      </header>

      <div class="body" *ngIf="person">
        <div class="banner missing" *ngIf="person.missing_fields?.length">
          <strong>Still needed for a complete profile:</strong>
          <span>{{ missingText }}</span>
        </div>
        <section class="ai-panel" *ngIf="needsReview" data-test="ai-panel" role="region" aria-label="Check what the AI filled in">
          <div class="ai-panel-head">
            <strong>Check what the AI filled in</strong>
            <button type="button" class="btn small" data-test="verify-btn" *ngIf="canVerify" (click)="verify()" [disabled]="busy">Verify</button>
          </div>
          <div class="ai-panel-text">
            Some details were filled in by AI from the resume<ng-container *ngIf="aiFieldLabels.length"> (marked <em>From resume, please check</em> below)</ng-container>.
            <ng-container *ngIf="canVerify">Check them, then press Verify.</ng-container>
            <ng-container *ngIf="!canVerify">The sourcing recruiter or an admin can verify them.</ng-container>
          </div>
          <ul class="ai-list" *ngIf="aiFieldLabels.length" data-test="ai-list"><li *ngFor="let l of aiFieldLabels">{{ l }}</li></ul>
        </section>
        <div class="banner info" *ngIf="!canEdit">
          Only the recruiter who sourced this person, or an admin, can change these details.
        </div>

        <app-person-badges [missingFields]="person.missing_fields || []" [verificationStatus]="person.verification_status"
                           [aiFilledFields]="person.ai_filled_fields">
        </app-person-badges>

        <section class="resume" [class.drag]="dragOver" (dragover)="onDragOver($event)" (dragleave)="dragOver = false"
                 (drop)="onDrop($event)">
          <div class="lbl">Resume</div>
          <ng-container *ngIf="resumeRef">
            <div class="resume-line current">
              <span class="fname">{{ resumeName }}</span>
              <button type="button" class="link open-tab" (click)="openResume.emit(resumeRef)">Open in new tab</button>
            </div>
            <object *ngIf="previewUrl" class="preview" type="application/pdf" [data]="previewUrl" aria-label="Resume preview">
              <span class="muted">The preview cannot be shown here. Use Open in new tab.</span>
            </object>
            <div class="muted preview-msg" *ngIf="!isPdf">Preview not available, open or download</div>
            <div class="muted preview-msg" *ngIf="isPdf && previewFailed">The preview could not be loaded. Use Open in new tab.</div>
          </ng-container>
          <div class="resume-line">
            <span class="muted" *ngIf="!resumeRef && !resumeFile">No resume yet</span>
            <span class="picked" *ngIf="resumeFile">New file: {{ resumeFile.name }} (saved when you press Save changes)</span>
            <ng-container *ngIf="canEdit">
              <input #fileInput type="file" class="file" accept=".pdf,.doc,.docx" (change)="onFilePicked($event)" />
              <button type="button" class="btn ghost" (click)="fileInput.click()" [disabled]="parsing || busy">
                {{ resumeRef || resumeFile ? 'Replace resume' : 'Upload resume' }}</button>
              <span class="hint">or drop a PDF, DOC or DOCX here (up to 20 MB)</span>
            </ng-container>
          </div>
          <div class="reading" *ngIf="parsing" role="status"><span class="spinner"></span> Reading the resume…</div>
          <div class="parse-msg" [class.err]="parseIsError" *ngIf="parseMessage" role="status">{{ parseMessage }}</div>
          <app-resume-status-line *ngIf="!parsing && resumeRef" [status]="person.resume_status" [canRetry]="canEdit" [busy]="resumeBusy"
                                  (retry)="retryResume()" (refresh)="refreshResume()"></app-resume-status-line>
        </section>

        <form *ngIf="canEdit; else viewMode" (ngSubmit)="save()" #f="ngForm" class="grid">
          <label [class.need]="isMissing('first_name')" [class.ai]="isAi('first_name')">First name
            <span class="ai-tag" *ngIf="isAi('first_name')">From resume, please check</span>
            <input name="first_name" [(ngModel)]="form.first_name" [disabled]="!canEdit" maxlength="100" /></label>
          <label [class.need]="isMissing('last_name')" [class.ai]="isAi('last_name')">Last name
            <span class="ai-tag" *ngIf="isAi('last_name')">From resume, please check</span>
            <input name="last_name" [(ngModel)]="form.last_name" [disabled]="!canEdit" maxlength="100" /></label>
          <label [class.need]="isMissing('email')" [class.ai]="isAi('email')">Email
            <span class="ai-tag" *ngIf="isAi('email')">From resume, please check</span>
            <input name="email" type="email" [(ngModel)]="form.email" [disabled]="!canEdit" /></label>
          <label [class.need]="isMissing('phone')" [class.ai]="isAi('phone_number')">Phone (10 digits, comma separated for several)
            <span class="ai-tag" *ngIf="isAi('phone_number')">From resume, please check</span>
            <input name="phone_number" [(ngModel)]="form.phone_number" [disabled]="!canEdit" /></label>

          <div class="full" [class.need]="isMissing('skills')" [class.ai]="isAi('skills')">
            <span class="lbl">Skills</span>
            <span class="ai-tag" *ngIf="isAi('skills')">From resume, please check</span>
            <div class="chips">
              <span class="chip" *ngFor="let s of skills; let i = index">{{ s }}
                <button type="button" *ngIf="canEdit" (click)="removeSkill(i)" aria-label="Remove">×</button></span>
              <input *ngIf="canEdit" name="skill_input" [(ngModel)]="skillInput" placeholder="Type a skill and press Enter"
                     (keydown.enter)="addSkill($event)" (keydown.comma)="addSkill($event)" (blur)="addSkill()" />
            </div>
          </div>

          <label [class.need]="isMissing('education')" [class.ai]="isAi('latest_education_level')">Highest qualification
            <span class="ai-tag" *ngIf="isAi('latest_education_level')">From resume, please check</span>
            <input name="latest_education_level" [(ngModel)]="form.latest_education_level" [disabled]="!canEdit"
                   placeholder="e.g. B.Tech, MBA, MCA" maxlength="255" /></label>
          <label [class.ai]="isAi('latest_university')">University / college
            <span class="ai-tag" *ngIf="isAi('latest_university')">From resume, please check</span>
            <input name="latest_university" [(ngModel)]="form.latest_university" [disabled]="!canEdit" maxlength="255" /></label>
          <label [class.ai]="isAi('latest_specialization')">Specialization
            <span class="ai-tag" *ngIf="isAi('latest_specialization')">From resume, please check</span>
            <input name="latest_specialization" [(ngModel)]="form.latest_specialization" [disabled]="!canEdit" maxlength="255" /></label>
          <label [class.ai]="isAi('year_of_graduation')">Year of graduation
            <span class="ai-tag" *ngIf="isAi('year_of_graduation')">From resume, please check</span>
            <input name="year_of_graduation" type="number" [(ngModel)]="form.year_of_graduation" [disabled]="!canEdit"
                   min="1950" max="2050" /></label>

          <div class="full" [class.need]="isMissing('preferred_location')" [class.ai]="isAi('preferred_location')">
            <span class="lbl">Preferred location</span>
            <span class="ai-tag" *ngIf="isAi('preferred_location')">From resume, please check</span>
            <app-location-input class="loc-preferred" [(value)]="locations" [multiple]="true" [disabled]="!canEdit"
                                placeholder="Type a city and press Enter"></app-location-input>
          </div>

          <div [class.ai]="isAi('current_location')">
            <span class="lbl">Current location</span>
            <span class="ai-tag" *ngIf="isAi('current_location')">From resume, please check</span>
            <app-location-input class="loc-current" [(value)]="currentLocation" [multiple]="false" [disabled]="!canEdit"
                                placeholder="Type a city and press Enter"></app-location-input>
          </div>
          <label [class.ai]="isAi('work_experience')">Current role
            <span class="ai-tag" *ngIf="isAi('work_experience')">From resume, please check</span>
            <input name="work_experience" [(ngModel)]="form.work_experience" [disabled]="!canEdit" maxlength="255" /></label>

          <div class="error full" *ngIf="error">{{ error }}</div>
          <div class="actions full">
            <button type="submit" class="btn" [disabled]="busy || parsing">{{ busy ? 'Saving...' : 'Save changes' }}</button>
            <span class="hint" *ngIf="kind === 'intake'">When nothing is missing the person moves to Candidates automatically.</span>
          </div>
        </form>

        <!-- View mode: the same details as plain text, nothing to type into -->
        <ng-template #viewMode>
          <dl class="view grid">
            <div [class.need]="isMissing('email')" [class.ai]="isAi('email')"><dt>Email</dt><dd>{{ form.email || '—' }}</dd><span class="ai-tag" *ngIf="isAi('email')">From resume, please check</span></div>
            <div [class.need]="isMissing('phone')" [class.ai]="isAi('phone_number')"><dt>Phone</dt><dd>{{ form.phone_number || '—' }}</dd><span class="ai-tag" *ngIf="isAi('phone_number')">From resume, please check</span></div>
            <div class="full" [class.need]="isMissing('skills')" [class.ai]="isAi('skills')"><dt>Skills</dt>
              <dd><span class="chip" *ngFor="let s of skills">{{ s }}</span><span *ngIf="!skills.length">—</span></dd><span class="ai-tag" *ngIf="isAi('skills')">From resume, please check</span></div>
            <div [class.need]="isMissing('education')" [class.ai]="isAi('latest_education_level')"><dt>Highest qualification</dt><dd>{{ form.latest_education_level || '—' }}</dd><span class="ai-tag" *ngIf="isAi('latest_education_level')">From resume, please check</span></div>
            <div [class.ai]="isAi('latest_university')"><dt>University / college</dt><dd>{{ form.latest_university || '—' }}</dd><span class="ai-tag" *ngIf="isAi('latest_university')">From resume, please check</span></div>
            <div [class.ai]="isAi('latest_specialization')"><dt>Specialization</dt><dd>{{ form.latest_specialization || '—' }}</dd><span class="ai-tag" *ngIf="isAi('latest_specialization')">From resume, please check</span></div>
            <div [class.ai]="isAi('year_of_graduation')"><dt>Year of graduation</dt><dd>{{ form.year_of_graduation || '—' }}</dd><span class="ai-tag" *ngIf="isAi('year_of_graduation')">From resume, please check</span></div>
            <div class="full" [class.need]="isMissing('preferred_location')" [class.ai]="isAi('preferred_location')"><dt>Preferred location</dt>
              <dd><span class="chip" *ngFor="let l of locations">{{ l.name }}</span><span *ngIf="!locations.length">—</span></dd><span class="ai-tag" *ngIf="isAi('preferred_location')">From resume, please check</span></div>
            <div [class.ai]="isAi('current_location')"><dt>Current location</dt>
              <dd><span class="chip" *ngFor="let l of currentLocation">{{ l.name }}</span><span *ngIf="!currentLocation.length">—</span></dd><span class="ai-tag" *ngIf="isAi('current_location')">From resume, please check</span></div>
            <div [class.ai]="isAi('work_experience')"><dt>Current role</dt><dd>{{ form.work_experience || '—' }}</dd><span class="ai-tag" *ngIf="isAi('work_experience')">From resume, please check</span></div>
          </dl>
        </ng-template>

        <section class="forms" *ngIf="person.submissions?.length">
          <div class="lbl">Applied through</div>
          <ul><li *ngFor="let s of person.submissions">{{ s.form }} · {{ s.submitted_at | date: 'mediumDate' }}</li></ul>
        </section>

        <app-person-notes [kind]="kind" [personId]="person.id"></app-person-notes>
      </div>
    </aside>
  `,
  styles: [`
    :host { position: fixed; inset: 0; z-index: 1000; display: block; }
    .overlay { position: absolute; inset: 0; background: rgba(15, 23, 42, .45); }
    .drawer { position: absolute; top: 0; right: 0; bottom: 0; width: min(640px, 100%); background: #fff; display: flex;
      flex-direction: column; box-shadow: -8px 0 30px rgba(0,0,0,.18); font-size: 13px; color: #0f172a; }
    header { display: flex; justify-content: space-between; align-items: flex-start; padding: 16px 20px; border-bottom: 1px solid #e2e8f0; }
    h2 { margin: 0; font-size: 18px; }
    .sub { color: #64748b; margin-top: 2px; }
    .x { border: 0; background: none; font-size: 26px; line-height: 1; cursor: pointer; color: #64748b; }
    .body { padding: 16px 20px 28px; overflow: auto; display: grid; gap: 14px; }
    .banner { border-radius: 8px; padding: 10px 12px; display: flex; gap: 8px; align-items: center; justify-content: space-between; }
    .banner.missing { background: #fef2f2; color: #991b1b; justify-content: flex-start; flex-wrap: wrap; }
    .ai-panel { border: 1px solid #fcd34d; background: #fffbeb; color: #92400e; border-radius: 8px; padding: 10px 12px; display: grid; gap: 6px; }
    .ai-panel-head { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
    .ai-list { margin: 0; padding: 0; list-style: none; display: flex; flex-wrap: wrap; gap: 6px; }
    .ai-list li { background: #dbeafe; color: #1d4ed8; border-radius: 999px; padding: 1px 9px; font-size: 12px; font-weight: 500; }
    .banner.info { background: #f1f5f9; color: #475569; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .full { grid-column: 1 / -1; }
    label, .full, .grid > div { display: grid; gap: 4px; align-content: start; }
    .lbl { font-weight: 600; color: #334155; }
    label { font-weight: 600; color: #334155; }
    input { border: 1px solid #e2e8f0; border-radius: 8px; padding: 7px 9px; font: inherit; font-weight: 400; min-width: 0; }
    input:disabled { background: #f8fafc; color: #64748b; }
    .need > input, .need > .chips { border-color: #fca5a5; background: #fffafa; }
    .need > .lbl, label.need { color: #b91c1c; }
    .need > app-location-input { border-radius: 8px; outline: 1px solid #fca5a5; background: #fffafa; }
    .ai > input, .ai > .chips { border-color: #93c5fd; background: #f8fbff; }
    .ai > app-location-input { border-radius: 8px; outline: 1px solid #93c5fd; background: #f8fbff; }
    .ai-tag { font-size: 11px; font-weight: 500; color: #1d4ed8; background: #dbeafe; border-radius: 999px; padding: 1px 8px;
      justify-self: start; }
    .chips { display: flex; flex-wrap: wrap; gap: 6px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 6px; }
    .chips input { border: 0; flex: 1; min-width: 140px; padding: 2px 4px; }
    .chip { background: #f1f5f9; border-radius: 999px; padding: 2px 4px 2px 10px; display: inline-flex; gap: 4px; align-items: center; }
    .chip button { border: 0; background: none; cursor: pointer; color: #64748b; font-size: 15px; line-height: 1; }
    .btn { border: 1px solid #0f172a; background: #0f172a; color: #fff; border-radius: 8px; padding: 8px 14px; cursor: pointer; font: inherit; }
    .btn.small { padding: 4px 10px; background: #b45309; border-color: #b45309; }
    .btn.ghost { background: #fff; color: #0f172a; padding: 5px 12px; }
    .btn[disabled] { opacity: .5; cursor: default; }
    .actions { display: flex; align-items: center; gap: 12px; }
    .hint { color: #64748b; font-size: 12px; }
    .error { color: #b91c1c; }
    .link { border: 0; background: none; color: #1d4ed8; cursor: pointer; padding: 0; font: inherit; text-decoration: underline; }
    .resume { border: 1px dashed #cbd5e1; border-radius: 8px; padding: 10px 12px; display: grid; gap: 6px; }
    .resume.drag { border-color: #1d4ed8; background: #eff6ff; }
    .resume-line { display: flex; flex-wrap: wrap; gap: 8px 12px; align-items: center; }
    .resume .file { display: none; }
    .resume .fname { font-weight: 600; color: #334155; word-break: break-all; }
    .preview { width: 100%; height: 420px; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc; }
    .preview-msg { font-size: 12.5px; }
    .view { margin: 0; }
    .view > div { display: grid; gap: 2px; align-content: start; }
    .view dt { font-weight: 600; color: #334155; }
    .view dd { margin: 0; color: #0f172a; word-break: break-word; }
    .view .need dt { color: #b91c1c; }
    .view .chip { padding: 2px 10px; margin: 0 6px 4px 0; }
    .view-profile { margin-top: 4px; font-size: 12.5px; }
    .muted { color: #64748b; }
    .picked { color: #334155; }
    .reading { display: flex; align-items: center; gap: 8px; color: #334155; }
    .spinner { width: 14px; height: 14px; border: 2px solid #cbd5e1; border-top-color: #0f172a; border-radius: 50%;
      display: inline-block; animation: spin .8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .parse-msg { color: #334155; }
    .parse-msg.err { color: #b45309; }
    .forms ul { margin: 4px 0 0; padding-left: 18px; color: #475569; }
    @media (max-width: 560px) { .grid { grid-template-columns: 1fr; } }
  `]
})
export class IntakeDrawerComponent implements OnChanges, OnDestroy {
  /** A Needs info person or a candidate (the list rows of both kinds are accepted, see `kind`). */
  @Input() person: IntakePerson | Candidate | any | null = null;
  /** Which record is edited: a Needs info person (default) or a candidate that is still incomplete. */
  @Input() kind: 'intake' | 'candidate' = 'intake';
  @Input() canEdit = false;
  @Input() canVerify = false;
  @Output() closed = new EventEmitter<void>();
  /**
   * Emitted after a save or verify. For a Needs info person `promoted` is true when the person is now a candidate.
   * For a candidate the server's updated record comes in `candidate` (and `saved` is true after Save changes).
   */
  @Output() updated = new EventEmitter<{ result?: IntakeUpdateResult; promoted: boolean; candidate?: Candidate; saved?: boolean }>();
  @Output() openResume = new EventEmitter<string>();
  /** The user wants the read-only detail card instead. */
  @Output() viewProfile = new EventEmitter<void>();

  form: any = {};
  skills: string[] = [];
  locations: PlaceEntry[] = [];
  /** At most one entry. */
  currentLocation: PlaceEntry[] = [];
  skillInput = '';
  busy = false;
  /** A resume Retry or Refresh is in flight. */
  resumeBusy = false;
  error = '';

  /** The resume chosen in this session; it is sent with Save. */
  resumeFile: File | null = null;
  parsing = false;
  parseMessage = '';
  parseIsError = false;
  /** Names of the fields filled from the resume (the server marks them for Verify on Save). */
  aiFilled: string[] = [];
  dragOver = false;
  /** The staged upload of the file chosen in this session; a candidate gets its resume through it. */
  private stagingId: number | null = null;

  /** Inline preview of the saved resume (PDF only). */
  previewUrl: SafeResourceUrl | null = null;
  previewFailed = false;
  private previewRef = '';
  private previewSub?: Subscription;

  @ViewChildren(LocationInputComponent) private locationInputs?: QueryList<LocationInputComponent>;
  private parseSub?: Subscription;
  private pollSub?: Subscription;

  constructor(private service: RecruiterWorkflowCandidateService, private sanitizer: DomSanitizer) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['person'] && this.person) {
      const p = this.person;
      this.form = {
        first_name: p.first_name || '', last_name: p.last_name || '', email: p.email || '',
        phone_number: p.phone_number || '', latest_education_level: p.latest_education_level || '',
        latest_university: p.latest_university || '', latest_specialization: p.latest_specialization || '',
        year_of_graduation: p.year_of_graduation || null, work_experience: p.work_experience || '',
      };
      this.skills = this.skillsOf(p);
      this.locations = this.placesOf(p);
      this.currentLocation = this.currentPlaceOf(p);
      this.skillInput = '';
      this.error = '';
      this.cancelParse();
      this.resumeFile = null;
      this.aiFilled = [];
      this.stagingId = null;
      this.setMessage('', false);
      this.loadPreview();
    }
  }

  ngOnDestroy(): void {
    this.cancelParse();
    this.previewSub?.unsubscribe();
  }

  close(): void {
    this.cancelParse();
    this.closed.emit();
  }

  get displayName(): string {
    const p = this.person;
    const name = `${p?.first_name || ''} ${p?.last_name || ''}`.trim();
    return name || p?.email || p?.phone_number || 'Unnamed person';
  }

  get missingText(): string {
    return ((this.person?.missing_fields || []) as string[]).map(m => missingFieldLabel(m)).join(', ');
  }

  // ---- The saved resume (either kind) ----

  /** The saved resume: a storage path for a Needs info person, a link for a candidate. */
  get resumeRef(): string {
    const p = this.person;
    return (p?.resume_path || p?.resume || p?.resume_url || '') as string;
  }

  get resumeName(): string {
    const p = this.person;
    if (p?.resume_filename) { return p.resume_filename; }
    const last = this.refPath().split('/').pop() || '';
    try { return decodeURIComponent(last) || 'Resume'; } catch { return last || 'Resume'; }
  }

  /** Only a PDF is previewed; Word files are opened or downloaded. */
  get isPdf(): boolean {
    const named = (this.person?.resume_filename || '').toLowerCase();
    const name = /\.[a-z0-9]+$/.test(named) ? named : this.refPath().toLowerCase();
    return name.endsWith('.pdf');
  }

  private refPath(): string {
    return this.resumeRef.split('?')[0].split('#')[0];
  }

  /**
   * Gets the address for the preview. A bare storage path is exchanged for a signed link first (the same call the
   * page uses to open a resume). Only http(s) addresses are trusted for the frame.
   */
  private loadPreview(): void {
    const ref = this.resumeRef;
    if (ref === this.previewRef) { return; }
    this.previewRef = ref;
    this.previewSub?.unsubscribe();
    this.previewUrl = null;
    this.previewFailed = false;
    if (!ref || !this.isPdf) { return; }
    if (/^https?:\/\//i.test(ref)) {
      this.setPreview(ref);
      return;
    }
    this.previewSub = this.service.getSignedUrl(ref).subscribe({
      next: res => this.setPreview(res?.signed_url),
      error: () => { this.previewFailed = true; }
    });
  }

  private setPreview(url: string | undefined): void {
    if (url && /^https?:\/\//i.test(url)) {
      this.previewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);   // the only place a URL is trusted
    } else {
      this.previewFailed = true;
    }
  }

  // ---- Reading either shape of person ----

  private skillsOf(p: any): string[] {
    if (Array.isArray(p.skills_list) && p.skills_list.length) { return [...p.skills_list]; }
    return typeof p.skills === 'string' ? p.skills.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
  }

  private placesOf(p: any): PlaceEntry[] {
    if (Array.isArray(p.preferred_locations) && p.preferred_locations.length) {
      return p.preferred_locations.map((l: any) => ({ name: l.name, lat: l.lat ?? null, lng: l.lng ?? null }));
    }
    return this.toPlaces(this.maybeJson(p.preferred_location));
  }

  private currentPlaceOf(p: any): PlaceEntry[] {
    const places = this.toPlaces(this.maybeJson(p.current_location), false);
    return places.length ? [places[0]] : [];
  }

  /** A candidate stores locations as a list, as JSON text or as comma separated text. */
  private maybeJson(v: any): any {
    if (typeof v === 'string' && /^\s*[\[{]/.test(v)) {
      try { return JSON.parse(v); } catch { return v; }
    }
    return v;
  }

  isMissing(key: string): boolean {
    return !!this.person?.missing_fields?.includes(key);
  }

  /**
   * True for a field that was filled from the resume: either read in this session and not saved yet, or reported by the
   * server as AI-filled while the person is still waiting for a recruiter's Verify.
   */
  isAi(field: string): boolean {
    return this.aiFilled.includes(field) || this.serverAiFields.includes(field);
  }

  /** The columns the server lists as AI-filled; only meaningful while the person is not verified. */
  private get serverAiFields(): string[] {
    const list = this.person?.verification_status === 'ai_unverified' ? this.person?.ai_filled_fields : null;
    return Array.isArray(list) ? list : [];
  }

  /** The "Check what the AI filled in" panel shows while the person is waiting for Verify (also in view mode). */
  get needsReview(): boolean {
    return this.person?.verification_status === 'ai_unverified';
  }

  /** Readable names of the AI-filled fields, without repeats (Phone can come as phone or phone_number). */
  get aiFieldLabels(): string[] {
    const names = [...this.serverAiFields, ...this.aiFilled].map(f => aiFieldLabel(f));
    return names.filter((n, i) => names.indexOf(n) === i);
  }

  addSkill(event?: Event): void {
    event?.preventDefault();
    const value = this.skillInput.replace(/,/g, '').trim();
    if (value && !this.skills.some(s => s.toLowerCase() === value.toLowerCase())) { this.skills.push(value); }
    this.skillInput = '';
  }

  removeSkill(i: number): void { this.skills.splice(i, 1); }

  /** The values sent to the server. Empty strings are left out: the server never erases a value with an empty one. */
  buildPayload(): any {
    this.addSkill();
    const payload: any = {};
    for (const key of ['first_name', 'last_name', 'email', 'phone_number', 'latest_education_level',
                       'latest_university', 'latest_specialization', 'work_experience']) {
      const value = (this.form[key] || '').toString().trim();
      if (value) { payload[key] = value; }
    }
    if (this.form.year_of_graduation) { payload.year_of_graduation = Number(this.form.year_of_graduation); }
    if (this.skills.length) { payload.skills = this.skills.join(', '); }
    if (this.locations.length) {
      payload.preferred_location = this.locations.map(l => ({ name: l.name, lat: l.lat ?? null, lng: l.lng ?? null }));
    }
    const current = this.currentLocation[0]?.name?.trim();
    if (current) { payload.current_location = current; }
    if (this.resumeFile && this.aiFilled.length) { payload.ai_filled_fields = [...this.aiFilled]; }
    return payload;
  }

  save(): void {
    if (!this.person || !this.canEdit || this.busy || this.parsing) { return; }
    this.busy = true;
    this.error = '';
    // Leaving a location box adds its text asynchronously (it is looked up in Places). Wait for that, or the
    // place typed just before pressing Save would be missing from the payload.
    const inputs = this.locationInputs?.toArray() || [];
    const flushes = inputs.map(i => i.flush());
    if (inputs.some(i => i.pending)) {
      Promise.all(flushes).then(() => this.send());
    } else {
      this.send();
    }
  }

  private send(): void {
    if (!this.person) { this.busy = false; return; }
    if (this.kind === 'candidate') { this.sendCandidate(); return; }
    const file = this.resumeFile;
    this.service.updateIntake(this.person.id, this.buildPayload(), file).subscribe({
      next: result => {
        this.busy = false;
        if (file) {
          this.keepAiFlagged();      // the server now lists these fields; keep the panel up until the list is reloaded
          this.resumeFile = null;
          this.aiFilled = [];
          this.setMessage('', false);
        }
        this.updated.emit({ result, promoted: !!result.promoted });
      },
      // on a server refusal (another person's email, a bad file, scanner down) the file and the form stay as they are
      error: err => {
        this.busy = false;
        this.error = this.describeError(err);
      }
    });
  }

  /**
   * Saves a candidate: a partial multipart PATCH of the writable fields (the candidate endpoint reads multipart only).
   * A chosen resume goes in as the id of its staged upload, as the page's edit form does; the server marks nothing as
   * AI-filled for a candidate, so `ai_filled_fields` is not sent.
   */
  private sendCandidate(): void {
    const file = this.resumeFile;
    if (file && !this.stagingId) {
      this.busy = false;
      this.error = 'The resume could not be uploaded, so it cannot be attached. Please choose the file again.';
      return;
    }
    const payload = this.buildPayload();
    delete payload.ai_filled_fields;
    const body = new FormData();
    Object.keys(payload).forEach(key => {
      const value = payload[key];
      if (value === undefined || value === null) { return; }
      body.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
    });
    if (file && this.stagingId) { body.append('staging_id', String(this.stagingId)); }
    this.service.patchCandidate(this.person.id, body).subscribe({
      next: candidate => {
        this.busy = false;
        if (file) {
          this.resumeFile = null;
          this.stagingId = null;
          this.aiFilled = [];
          this.setMessage('', false);
        }
        this.updated.emit({ promoted: false, candidate, saved: true });
      },
      error: err => {
        this.busy = false;
        this.error = this.describeError(err);
      }
    });
  }

  /** After a Save that carried AI-read values: the person is waiting for Verify and lists those fields. */
  private keepAiFlagged(): void {
    if (!this.person || !this.aiFilled.length) { return; }
    const merged = [...(this.person.ai_filled_fields || [])];
    this.aiFilled.forEach(f => { if (!merged.includes(f)) { merged.push(f); } });
    this.person = { ...this.person, verification_status: 'ai_unverified', ai_filled_fields: merged };
  }

  /** Retry on the resume status line: the stored resume is queued for reading again; the person comes back as 'processing'. */
  retryResume(): void {
    if (!this.person || !this.canEdit || this.resumeBusy) { return; }
    const kind = this.kind;
    this.resumeBusy = true;
    const request: Observable<any> = kind === 'candidate'
      ? this.service.reparseCandidateResume(this.person.id) : this.service.reparseIntakeResume(this.person.id);
    request.subscribe({
      next: result => {
        this.resumeBusy = false;
        this.person = { ...this.person, ...result, kind };
        this.emitReloaded(result);
      },
      error: err => { this.resumeBusy = false; this.error = this.describeError(err); }
    });
  }

  /** Refresh on the resume status line: reloads the person; the page is told when the status moved on. */
  refreshResume(): void {
    if (!this.person || this.resumeBusy) { return; }
    const kind = this.kind;
    const before = this.person.resume_status;
    this.resumeBusy = true;
    const request: Observable<any> = kind === 'candidate'
      ? this.service.getCandidate(this.person.id) : this.service.getIntake(this.person.id);
    request.subscribe({
      next: result => {
        this.resumeBusy = false;
        this.person = { ...this.person, ...result, kind };
        if (result?.resume_status !== before) { this.emitReloaded(result); }
      },
      error: () => { this.resumeBusy = false; }
    });
  }

  private emitReloaded(result: any): void {
    if (this.kind === 'candidate') {
      this.updated.emit({ promoted: false, candidate: result });
    } else {
      this.updated.emit({ promoted: false });
    }
  }

  verify(): void {
    if (!this.person || !this.canVerify || this.busy) { return; }
    this.busy = true;
    if (this.kind === 'candidate') {
      this.service.verifyCandidate(this.person.id).subscribe({
        next: candidate => {
          this.busy = false;
          this.person = { ...this.person, ...candidate, kind: 'candidate' };
          this.updated.emit({ promoted: false, candidate });
        },
        error: err => { this.busy = false; this.error = this.describeError(err); }
      });
      return;
    }
    this.service.verifyIntake(this.person.id).subscribe({
      next: person => {
        this.busy = false;
        this.person = person;
        this.updated.emit({ promoted: false });
      },
      error: err => { this.busy = false; this.error = this.describeError(err); }
    });
  }

  // ---- Resume ----

  onFilePicked(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';                 // the same file can be chosen again
    if (file) { this.chooseResume(file); }
  }

  onDragOver(event: DragEvent): void {
    if (!this.canEdit) { return; }
    event.preventDefault();
    this.dragOver = true;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragOver = false;
    const file = event.dataTransfer?.files?.[0];
    if (file && this.canEdit && !this.parsing && !this.busy) { this.chooseResume(file); }
  }

  /** Attaches the file and reads it; the values found fill the form for review. Nothing is saved yet. */
  chooseResume(file: File): void {
    if (!this.canEdit) { return; }
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    if (!RESUME_EXTENSIONS.includes(ext)) {
      this.setMessage('Please choose a PDF, DOC or DOCX file.', true);
      return;
    }
    if (file.size > RESUME_MAX_BYTES) {
      this.setMessage('This file is larger than 20 MB. Please choose a smaller file.', true);
      return;
    }
    if (file.size === 0) {
      this.setMessage('This file is empty. Please choose another file.', true);
      return;
    }
    this.cancelParse();
    this.resumeFile = file;           // stays attachable whatever the reading result is
    this.stagingId = null;
    this.parsing = true;
    this.setMessage('', false);
    this.parseSub = this.service.parseResume(file).subscribe({
      next: (response: any) => this.onParseStarted(response),
      error: err => this.parseFailed(
        err?.status === 409
          ? 'This resume looks like it belongs to someone already in the system. You can still save the file.'
          : (err?.error?.detail || 'The resume could not be read. You can still save the file.'))
    });
  }

  private onParseStarted(response: any): void {
    this.stagingId = response?.staging_id ?? null;
    const status = (response?.status || '').toString().toUpperCase();
    if ((status === 'PROCESSING' || status === 'PENDING') && response.staging_id) {
      this.poll(response.staging_id);
    } else if (response?.success && response.data) {
      this.finishParse(response.data);
    } else if (response?.errors) {
      this.parseFailed('The resume could not be read. You can still save the file.');
    } else {
      this.parseFailed('Unexpected answer from the server. You can still save the file.');
    }
  }

  private poll(stagingId: number): void {
    let attempt = 0;
    this.pollSub = timer(0, POLL_EVERY_MS).pipe(
      switchMap(() => this.service.checkResumeStatus(stagingId)),
      takeWhile((res: any) => {
        attempt++;
        if (attempt >= POLL_MAX_ATTEMPTS) { return false; }
        return res.status === 'PENDING' || res.status === 'PROCESSING';
      }, true)
    ).subscribe({
      next: (res: any) => {
        if (res.status === 'COMPLETED' && res.data) {
          this.finishParse(res.data);
        } else if (res.status === 'COMPLETED' || res.status === 'FAILED') {
          this.parseFailed(res.error ? `${res.error}. You can still save the file.` : NO_TEXT_MESSAGE);
        }
      },
      error: () => this.parseFailed('Could not check the resume right now. You can still save the file.'),
      complete: () => {
        if (this.parsing) { this.parseFailed('Parsing took too long, you can still save the file.'); }
      }
    });
  }

  private finishParse(raw: any): void {
    this.cancelParse();
    if (this.applyParsed(raw)) {
      this.setMessage('Resume read. Please check the highlighted details, then press Save changes.', false);
    } else {
      this.setMessage(NO_TEXT_MESSAGE, true);
    }
  }

  private parseFailed(message: string): void {
    this.cancelParse();
    if (this.kind === 'candidate' && !this.stagingId) {
      // a candidate only gets a resume through its staged upload: without one the file cannot be saved
      this.resumeFile = null;
      message = message.replace(/,? ?[Yy]ou can still save the file\.?/, '').trim() + ' The file was not attached.';
    }
    this.setMessage(message, true);
  }

  private cancelParse(): void {
    this.parseSub?.unsubscribe();
    this.pollSub?.unsubscribe();
    this.parseSub = undefined;
    this.pollSub = undefined;
    this.parsing = false;
  }

  private setMessage(text: string, isError: boolean): void {
    this.parseMessage = text;
    this.parseIsError = isError;
  }

  /**
   * Fills the form from the parsed resume. Only fields the resume contains are overwritten (even when the form
   * already has a value); an empty parsed value never blanks anything. Returns how many fields were filled.
   */
  applyParsed(raw: any): number {
    let data = raw;
    if (typeof data === 'string') {
      try { data = JSON.parse(data); } catch {
        try { data = JSON.parse(data.replace(/'/g, '"')); } catch { data = null; }
      }
    }
    if (!data || typeof data !== 'object') { return 0; }
    let filled = 0;
    const mark = (name: string) => {
      if (!this.aiFilled.includes(name)) { this.aiFilled = [...this.aiFilled, name]; }
      filled++;
    };
    const text = (v: any): string => (v === null || v === undefined || typeof v === 'object') ? '' : String(v).trim();

    for (const key of ['first_name', 'last_name', 'email', 'phone_number', 'latest_education_level',
                       'latest_university', 'latest_specialization']) {
      const value = text(data[key]);
      if (value) { this.form[key] = value; mark(key); }
    }
    const role = text(data.work_experience) || text(data.current_job_title);
    if (role) { this.form.work_experience = role; mark('work_experience'); }

    const year = Number(text(data.year_of_graduation));
    if (Number.isInteger(year) && year >= 1950 && year <= 2050) { this.form.year_of_graduation = year; mark('year_of_graduation'); }

    const skills = this.toList(data.skills);
    if (skills.length) {
      this.skills = skills.filter((s, i) => skills.findIndex(o => o.toLowerCase() === s.toLowerCase()) === i);
      mark('skills');
    }
    const preferred = this.toPlaces(data.preferred_location);
    if (preferred.length) { this.locations = preferred; mark('preferred_location'); }
    const current = this.toPlaces(data.current_location, false);
    if (current.length) { this.currentLocation = [current[0]]; mark('current_location'); }
    return filled;
  }

  /** A list or a comma separated string to a clean list of strings. */
  private toList(v: any): string[] {
    const items: any[] = Array.isArray(v) ? v : (typeof v === 'string' ? v.split(',') : []);
    return items.map(i => String(typeof i === 'string' ? i : (i?.name ?? '')).trim()).filter(Boolean);
  }

  /**
   * Strings or `{name, lat, lng}` objects to place entries. A plain string is a comma separated list, except for
   * the current location (`splitText` false), where "Hubli, Karnataka" is one place.
   */
  private toPlaces(v: any, splitText = true): PlaceEntry[] {
    const items: any[] = Array.isArray(v) ? v : (typeof v === 'string' ? (splitText ? v.split(',') : [v]) : []);
    const out: PlaceEntry[] = [];
    for (const item of items) {
      const isObject = item !== null && typeof item === 'object';
      const name = String(isObject ? (item.name ?? '') : (item ?? '')).trim();
      if (!name || out.some(o => o.name.toLowerCase() === name.toLowerCase())) { continue; }
      out.push({ name, lat: isObject ? (item.lat ?? null) : null, lng: isObject ? (item.lng ?? null) : null });
    }
    return out;
  }

  private describeError(err: any): string {
    const e = err?.error;
    if (!e) { return 'Something went wrong. Please try again.'; }
    if (typeof e === 'string') { return e; }
    if (e.detail) { return e.detail; }
    const first = Object.keys(e)[0];
    const message = Array.isArray(e[first]) ? e[first][0] : e[first];
    return first ? `${first.replace(/_/g, ' ')}: ${message}` : 'Could not save.';
  }
}
