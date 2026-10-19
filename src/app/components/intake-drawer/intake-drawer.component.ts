import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IntakePerson, IntakeUpdateResult, RecruiterWorkflowCandidateService
} from '../../services/recruiter-workflow-candidate.service';
import { PersonBadgesComponent, missingFieldLabel } from '../person-badges/person-badges.component';
import { PersonNotesComponent } from '../person-notes/person-notes.component';

/**
 * Side panel to complete a person in the "Needs info" inbox. It lists what is missing, lets the sourcing
 * recruiter (or an admin) fill the fields in, and tells them when the person has been promoted to a candidate.
 */
@Component({
  selector: 'app-intake-drawer',
  standalone: true,
  imports: [CommonModule, FormsModule, PersonBadgesComponent, PersonNotesComponent],
  template: `
    <div class="overlay" (click)="closed.emit()"></div>
    <aside class="drawer" role="dialog" aria-label="Complete profile">
      <header>
        <div>
          <h2>{{ displayName }}</h2>
          <div class="sub">
            Source: {{ person?.source || '—' }} · Sourced by {{ person?.sourced_by_name || 'N/A' }}
          </div>
        </div>
        <button type="button" class="x" (click)="closed.emit()" aria-label="Close">×</button>
      </header>

      <div class="body" *ngIf="person">
        <div class="banner missing" *ngIf="person.missing_fields.length">
          <strong>Still needed for a complete profile:</strong>
          <span>{{ missingText }}</span>
        </div>
        <div class="banner verify" *ngIf="person.verification_status === 'ai_unverified'">
          <span>Some details were filled in by AI from the resume. Please check them.</span>
          <button type="button" class="btn small" *ngIf="canVerify" (click)="verify()" [disabled]="busy">Verify</button>
        </div>
        <div class="banner info" *ngIf="!canEdit">
          Only the recruiter who sourced this person, or an admin, can change these details.
        </div>

        <app-person-badges [missingFields]="person.missing_fields" [verificationStatus]="person.verification_status"
                           [aiFilledFields]="person.ai_filled_fields" [canVerify]="canVerify" (verify)="verify()">
        </app-person-badges>

        <div class="resume-row" *ngIf="person.resume_path">
          <button type="button" class="link" (click)="openResume.emit(person.resume_path!)">
            View resume {{ person.resume_filename ? '(' + person.resume_filename + ')' : '' }}
          </button>
        </div>

        <form (ngSubmit)="save()" #f="ngForm" class="grid">
          <label [class.need]="isMissing('first_name')">First name
            <input name="first_name" [(ngModel)]="form.first_name" [disabled]="!canEdit" maxlength="100" /></label>
          <label [class.need]="isMissing('last_name')">Last name
            <input name="last_name" [(ngModel)]="form.last_name" [disabled]="!canEdit" maxlength="100" /></label>
          <label [class.need]="isMissing('email')">Email
            <input name="email" type="email" [(ngModel)]="form.email" [disabled]="!canEdit" /></label>
          <label [class.need]="isMissing('phone')">Phone (10 digits, comma separated for several)
            <input name="phone_number" [(ngModel)]="form.phone_number" [disabled]="!canEdit" /></label>

          <div class="full" [class.need]="isMissing('skills')">
            <span class="lbl">Skills</span>
            <div class="chips">
              <span class="chip" *ngFor="let s of skills; let i = index">{{ s }}
                <button type="button" *ngIf="canEdit" (click)="removeSkill(i)" aria-label="Remove">×</button></span>
              <input *ngIf="canEdit" name="skill_input" [(ngModel)]="skillInput" placeholder="Type a skill and press Enter"
                     (keydown.enter)="addSkill($event)" (keydown.comma)="addSkill($event)" (blur)="addSkill()" />
            </div>
          </div>

          <label [class.need]="isMissing('education')">Highest qualification
            <input name="latest_education_level" [(ngModel)]="form.latest_education_level" [disabled]="!canEdit"
                   placeholder="e.g. B.Tech, MBA, MCA" maxlength="255" /></label>
          <label>University / college
            <input name="latest_university" [(ngModel)]="form.latest_university" [disabled]="!canEdit" maxlength="255" /></label>
          <label>Specialization
            <input name="latest_specialization" [(ngModel)]="form.latest_specialization" [disabled]="!canEdit" maxlength="255" /></label>
          <label>Year of graduation
            <input name="year_of_graduation" type="number" [(ngModel)]="form.year_of_graduation" [disabled]="!canEdit"
                   min="1950" max="2050" /></label>

          <div class="full" [class.need]="isMissing('preferred_location')">
            <span class="lbl">Preferred locations</span>
            <div class="chips">
              <span class="chip" *ngFor="let l of locations; let i = index">{{ l }}
                <button type="button" *ngIf="canEdit" (click)="removeLocation(i)" aria-label="Remove">×</button></span>
              <input *ngIf="canEdit" name="location_input" [(ngModel)]="locationInput" placeholder="Type a city and press Enter"
                     (keydown.enter)="addLocation($event)" (keydown.comma)="addLocation($event)" (blur)="addLocation()" />
            </div>
          </div>

          <label>Current location
            <input name="current_location" [(ngModel)]="form.current_location" [disabled]="!canEdit" maxlength="255" /></label>
          <label>Current role
            <input name="work_experience" [(ngModel)]="form.work_experience" [disabled]="!canEdit" maxlength="255" /></label>

          <div class="error full" *ngIf="error">{{ error }}</div>
          <div class="actions full" *ngIf="canEdit">
            <button type="submit" class="btn" [disabled]="busy">{{ busy ? 'Saving...' : 'Save changes' }}</button>
            <span class="hint">When nothing is missing the person moves to Candidates automatically.</span>
          </div>
        </form>

        <section class="forms" *ngIf="person.submissions?.length">
          <div class="lbl">Applied through</div>
          <ul><li *ngFor="let s of person.submissions">{{ s.form }} · {{ s.submitted_at | date: 'mediumDate' }}</li></ul>
        </section>

        <app-person-notes kind="intake" [personId]="person.id"></app-person-notes>
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
    .banner.verify { background: #fffbeb; color: #92400e; }
    .banner.info { background: #f1f5f9; color: #475569; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .full { grid-column: 1 / -1; }
    label, .full { display: grid; gap: 4px; }
    .lbl { font-weight: 600; color: #334155; }
    label { font-weight: 600; color: #334155; }
    input { border: 1px solid #e2e8f0; border-radius: 8px; padding: 7px 9px; font: inherit; font-weight: 400; min-width: 0; }
    input:disabled { background: #f8fafc; color: #64748b; }
    .need > input, .need > .chips { border-color: #fca5a5; background: #fffafa; }
    .need > .lbl, label.need { color: #b91c1c; }
    .chips { display: flex; flex-wrap: wrap; gap: 6px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 6px; }
    .chips input { border: 0; flex: 1; min-width: 140px; padding: 2px 4px; }
    .chip { background: #f1f5f9; border-radius: 999px; padding: 2px 4px 2px 10px; display: inline-flex; gap: 4px; align-items: center; }
    .chip button { border: 0; background: none; cursor: pointer; color: #64748b; font-size: 15px; line-height: 1; }
    .btn { border: 1px solid #0f172a; background: #0f172a; color: #fff; border-radius: 8px; padding: 8px 14px; cursor: pointer; font: inherit; }
    .btn.small { padding: 4px 10px; background: #b45309; border-color: #b45309; }
    .btn[disabled] { opacity: .5; cursor: default; }
    .actions { display: flex; align-items: center; gap: 12px; }
    .hint { color: #64748b; font-size: 12px; }
    .error { color: #b91c1c; }
    .link { border: 0; background: none; color: #1d4ed8; cursor: pointer; padding: 0; font: inherit; text-decoration: underline; }
    .forms ul { margin: 4px 0 0; padding-left: 18px; color: #475569; }
    @media (max-width: 560px) { .grid { grid-template-columns: 1fr; } }
  `]
})
export class IntakeDrawerComponent implements OnChanges {
  @Input() person: IntakePerson | null = null;
  @Input() canEdit = false;
  @Input() canVerify = false;
  @Output() closed = new EventEmitter<void>();
  /** Emitted after a save or verify. `promoted` is true when the person is now a candidate. */
  @Output() updated = new EventEmitter<{ result?: IntakeUpdateResult; promoted: boolean }>();
  @Output() openResume = new EventEmitter<string>();

  form: any = {};
  skills: string[] = [];
  locations: string[] = [];
  skillInput = '';
  locationInput = '';
  busy = false;
  error = '';

  constructor(private service: RecruiterWorkflowCandidateService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['person'] && this.person) {
      const p = this.person;
      this.form = {
        first_name: p.first_name || '', last_name: p.last_name || '', email: p.email || '',
        phone_number: p.phone_number || '', latest_education_level: p.latest_education_level || '',
        latest_university: p.latest_university || '', latest_specialization: p.latest_specialization || '',
        year_of_graduation: p.year_of_graduation || null, current_location: p.current_location || '',
        work_experience: p.work_experience || '',
      };
      this.skills = [...(p.skills_list || [])];
      this.locations = (p.preferred_locations || []).map(l => l.name);
      this.skillInput = '';
      this.locationInput = '';
      this.error = '';
    }
  }

  get displayName(): string {
    const p = this.person;
    const name = `${p?.first_name || ''} ${p?.last_name || ''}`.trim();
    return name || p?.email || p?.phone_number || 'Unnamed person';
  }

  get missingText(): string {
    return (this.person?.missing_fields || []).map(m => missingFieldLabel(m)).join(', ');
  }

  isMissing(key: string): boolean {
    return !!this.person?.missing_fields?.includes(key);
  }

  addSkill(event?: Event): void {
    event?.preventDefault();
    const value = this.skillInput.replace(/,/g, '').trim();
    if (value && !this.skills.some(s => s.toLowerCase() === value.toLowerCase())) { this.skills.push(value); }
    this.skillInput = '';
  }

  removeSkill(i: number): void { this.skills.splice(i, 1); }

  addLocation(event?: Event): void {
    event?.preventDefault();
    const value = this.locationInput.replace(/,/g, '').trim();
    if (value && !this.locations.some(l => l.toLowerCase() === value.toLowerCase())) { this.locations.push(value); }
    this.locationInput = '';
  }

  removeLocation(i: number): void { this.locations.splice(i, 1); }

  /** The values sent to the server. Empty strings are left out: the server never erases a value with an empty one. */
  buildPayload(): any {
    this.addSkill();
    this.addLocation();
    const payload: any = {};
    for (const key of ['first_name', 'last_name', 'email', 'phone_number', 'latest_education_level',
                       'latest_university', 'latest_specialization', 'current_location', 'work_experience']) {
      const value = (this.form[key] || '').toString().trim();
      if (value) { payload[key] = value; }
    }
    if (this.form.year_of_graduation) { payload.year_of_graduation = Number(this.form.year_of_graduation); }
    if (this.skills.length) { payload.skills = this.skills.join(', '); }
    if (this.locations.length) { payload.preferred_location = this.locations; }
    return payload;
  }

  save(): void {
    if (!this.person || !this.canEdit || this.busy) { return; }
    this.busy = true;
    this.error = '';
    this.service.updateIntake(this.person.id, this.buildPayload()).subscribe({
      next: result => {
        this.busy = false;
        this.updated.emit({ result, promoted: !!result.promoted });
      },
      error: err => {
        this.busy = false;
        this.error = this.describeError(err);
      }
    });
  }

  verify(): void {
    if (!this.person || !this.canVerify || this.busy) { return; }
    this.busy = true;
    this.service.verifyIntake(this.person.id).subscribe({
      next: person => {
        this.busy = false;
        this.person = person;
        this.updated.emit({ promoted: false });
      },
      error: err => { this.busy = false; this.error = this.describeError(err); }
    });
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
