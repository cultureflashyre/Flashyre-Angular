import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

/** Human names for the seven mandatory fields the server reports as "missing". */
export const MISSING_FIELD_LABELS: { [key: string]: string } = {
  first_name: 'First name',
  last_name: 'Last name',
  phone: 'Phone',
  email: 'Email',
  skills: 'Skills',
  education: 'Education',
  preferred_location: 'Preferred location',
};

export function missingFieldLabel(key: string): string {
  return MISSING_FIELD_LABELS[key] || key.replace(/_/g, ' ');
}

/** Human names for the columns a resume parse can fill (the server's `ai_filled_fields`), as the forms call them. */
export const AI_FIELD_LABELS: { [key: string]: string } = {
  first_name: 'First name',
  last_name: 'Last name',
  email: 'Email',
  phone: 'Phone',
  phone_number: 'Phone',
  skills: 'Skills',
  latest_education_level: 'Highest qualification',
  latest_university: 'University / college',
  latest_specialization: 'Specialization',
  year_of_graduation: 'Year of graduation',
  preferred_location: 'Preferred location',
  current_location: 'Current location',
  work_experience: 'Current role',
  current_job_title: 'Current job title',
  latest_company: 'Latest company',
  total_experience: 'Total experience',
  relevant_experience: 'Relevant experience',
  current_ctc: 'Current CTC',
  expected_ctc_min: 'Expected CTC (min)',
  expected_ctc_max: 'Expected CTC (max)',
  notice_period: 'Notice period',
};

/** Readable name of an AI-filled column; an unknown one is prettified ("some_new_field" to "Some new field"). */
export function aiFieldLabel(key: string): string {
  if (AI_FIELD_LABELS[key]) { return AI_FIELD_LABELS[key]; }
  const s = String(key).replace(/_/g, ' ').trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Status badges shown next to a person's name (icon + short label in a small rounded pill):
 *  - "Needs info" (amber, warning triangle) while mandatory fields are missing; hover lists them
 *  - "Verify" (blue, scan icon) when AI-parsed values have not been checked by a recruiter; for people who may verify it is a
 *    button that emits `verifyClick` (the page opens the review sidebar: the badge itself never verifies)
 *  - "Legacy" (grey, clock) for people imported before the Needs info list existed that are still incomplete
 * With `compact` off (profile panels) the missing fields are also listed as small chips.
 * The pills use the page's existing pill style (like the "Form" pill) and sit inline right after the name.
 */
@Component({
  selector: 'app-person-badges',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="badges">
      <button *ngIf="missing.length && needsInfoClickable" type="button" class="pill needs clickable" [title]="missingTitle"
              (click)="onNeedsInfo($event)">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
        Needs info
      </button>
      <span *ngIf="missing.length && !needsInfoClickable" class="pill needs" [title]="missingTitle">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
        Needs info
      </span>

      <button *ngIf="needsVerify && canVerify" type="button" class="pill review clickable" [title]="verifyTitle" (click)="onVerifyClick($event)">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><circle cx="12" cy="12" r="3"/><path d="m16 16-1.9-1.9"/></svg>
        Verify
      </button>
      <span *ngIf="needsVerify && !canVerify" class="pill review" [title]="verifyTitle">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><circle cx="12" cy="12" r="3"/><path d="m16 16-1.9-1.9"/></svg>
        Verify
      </span>

      <span *ngIf="legacy && missing.length" class="pill legacy"
            title="Imported before the Needs info list existed and still missing mandatory fields">
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 15 14.5"/></svg>
        Legacy
      </span>

      <ng-container *ngIf="!compact && missing.length">
        <span *ngFor="let m of missing" class="chip">{{ label(m) }}</span>
      </ng-container>
    </span>
  `,
  styles: [`
    /* Same look as the page's existing pill next to a name (the "Form" pill): small rounded pill, 10px icon.
       The colors come from the page's own palette (custom properties), with fallbacks for other pages. */
    :host { display: inline; }
    .badges { display: inline; }
    .pill {
      display: inline-flex; align-items: center; gap: 4px; padding: 1px 7px; margin-left: 6px;
      border-radius: 999px; border: 0; font-family: inherit; font-size: 10.5px; font-weight: 600; line-height: 1.5;
      vertical-align: middle; white-space: nowrap;
    }
    .pill svg { width: 10px; height: 10px; flex: none; fill: none; stroke: currentColor; stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; }
    .needs { background: var(--warn-soft, #fffbeb); color: var(--warn, #d97706); }
    .review { background: var(--accent-soft, #eff6ff); color: var(--accent, #2563eb); }
    .legacy { background: var(--primary-soft, #f1f5f9); color: var(--ink-2, #475569); }
    .clickable { cursor: pointer; }
    .clickable:hover { filter: brightness(0.96); }
    .clickable:focus-visible { outline: 2px solid var(--accent, #2563eb); outline-offset: 2px; }
    .chip {
      display: inline-flex; padding: 1px 7px; margin-left: 6px; border-radius: 999px; font-size: 10.5px; font-weight: 600;
      line-height: 1.5; vertical-align: middle; background: var(--bad-soft, #fef2f2); color: var(--bad, #dc2626);
    }
  `]
})
export class PersonBadgesComponent {
  @Input() missingFields: string[] | null | undefined = [];
  @Input() verificationStatus: string | null | undefined = 'verified';
  @Input() aiFilledFields: string[] | null | undefined = [];
  @Input() legacy = false;
  /** Compact: only the "Needs info" badge (hover for the list). Otherwise the missing fields are also listed as chips. */
  @Input() compact = false;
  /** True when the signed-in user may verify this person (sourcing recruiter or admin). */
  @Input() canVerify = false;
  /** The Verify pill was clicked. Nothing is verified here: the page opens the sidebar so the values are reviewed first. */
  @Output() verifyClick = new EventEmitter<void>();
  /**
   * Emitted when the Needs info badge is clicked (or activated with Enter or Space). The badge is only a button
   * when somebody listens, so places that just show the badge keep a plain, non-clickable pill.
   */
  @Output() needsInfoClick = new EventEmitter<void>();

  get needsInfoClickable(): boolean {
    return this.needsInfoClick.observed;
  }

  get missing(): string[] {
    return this.missingFields || [];
  }

  get needsVerify(): boolean {
    return this.verificationStatus === 'ai_unverified';
  }

  get verifyTitle(): string {
    const filled = (this.aiFilledFields || []).map(f => f.replace(/_/g, ' '));
    const what = filled.length ? ` Filled from the resume: ${filled.join(', ')}.` : '';
    return `Some details were filled in by AI from the resume.${what}` +
      (this.canVerify ? ' Click to review them.' : ' The sourcing recruiter or an admin can verify them.');
  }

  get missingTitle(): string {
    return 'Still needed: ' + this.missing.map(m => missingFieldLabel(m)).join(', ');
  }

  label(key: string): string {
    return missingFieldLabel(key);
  }

  onVerifyClick(event: Event): void {
    event.stopPropagation();
    this.verifyClick.emit();
  }

  onNeedsInfo(event: Event): void {
    event.stopPropagation();   // the badge sits inside the clickable name: do not also open the detail card
    this.needsInfoClick.emit();
  }
}
