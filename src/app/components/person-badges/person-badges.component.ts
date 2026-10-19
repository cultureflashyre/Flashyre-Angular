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

/**
 * Badges shown next to a person's name:
 *  - "Verify" when AI-parsed values have not been checked by a recruiter (click to verify if allowed)
 *  - one chip per missing mandatory field (or a single "Missing n" chip when `compact`)
 *  - "Legacy" for people imported before the inbox existed that are still incomplete
 */
@Component({
  selector: 'app-person-badges',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="badges">
      <button *ngIf="needsVerify && canVerify" type="button" class="badge verify clickable"
              [title]="verifyTitle" (click)="onVerify($event)">Verify</button>
      <span *ngIf="needsVerify && !canVerify" class="badge verify" [title]="verifyTitle">Verify</span>

      <ng-container *ngIf="missing.length">
        <span *ngIf="compact" class="badge missing" [title]="missingTitle">Missing {{ missing.length }}</span>
        <ng-container *ngIf="!compact">
          <span *ngFor="let m of missing" class="badge missing">{{ label(m) }}</span>
        </ng-container>
      </ng-container>

      <span *ngIf="legacy && missing.length" class="badge legacy"
            title="Imported before the Needs-info inbox existed and still missing mandatory fields">Legacy</span>
    </span>
  `,
  styles: [`
    .badges { display: inline-flex; flex-wrap: wrap; gap: 4px; vertical-align: middle; }
    .badge {
      display: inline-flex; align-items: center; padding: 1px 7px; border-radius: 999px;
      font-size: 10.5px; font-weight: 600; line-height: 1.5; border: 1px solid transparent; font-family: inherit;
    }
    .verify { background: #fffbeb; color: #b45309; border-color: #fde68a; }
    .clickable { cursor: pointer; }
    .clickable:hover { background: #fef3c7; }
    .missing { background: #fef2f2; color: #b91c1c; border-color: #fecaca; }
    .legacy { background: #f1f5f9; color: #475569; border-color: #e2e8f0; }
  `]
})
export class PersonBadgesComponent {
  @Input() missingFields: string[] | null | undefined = [];
  @Input() verificationStatus: string | null | undefined = 'verified';
  @Input() aiFilledFields: string[] | null | undefined = [];
  @Input() legacy = false;
  @Input() compact = false;
  /** True when the signed-in user may verify this person (sourcing recruiter or admin). */
  @Input() canVerify = false;
  @Output() verify = new EventEmitter<void>();

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
      (this.canVerify ? ' Click to confirm they are correct.' : ' The sourcing recruiter or an admin can verify them.');
  }

  get missingTitle(): string {
    return 'Missing: ' + this.missing.map(m => missingFieldLabel(m)).join(', ');
  }

  label(key: string): string {
    return missingFieldLabel(key);
  }

  onVerify(event: Event): void {
    event.stopPropagation();
    this.verify.emit();
  }
}
