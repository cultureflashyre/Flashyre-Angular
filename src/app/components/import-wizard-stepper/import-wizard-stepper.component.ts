import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ImportWizardStep = 'upload' | 'map' | 'review' | 'import' | 'results';

export interface WizardStepInfo {
  key: ImportWizardStep;
  label: string;
  /** Short line under the label, e.g. the file name or "3 need a look". */
  sub?: string;
}

export const IMPORT_WIZARD_STEPS: ImportWizardStep[] = ['upload', 'map', 'review', 'import', 'results'];

/**
 * The five-step header of the bulk-import wizard. Steps before the current one are shown as done and, unless the
 * wizard is `locked` (an import is running or finished), can be clicked to go back.
 */
@Component({
  selector: 'app-import-wizard-stepper',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ol class="steps" aria-label="Import steps">
      <li *ngFor="let s of steps; let i = index" [class.done]="i < currentIndex" [class.on]="i === currentIndex"
          [attr.data-step]="s.key">
        <button type="button" [disabled]="!isClickable(i)" [attr.aria-current]="i === currentIndex ? 'step' : null"
                (click)="choose(i)">
          <b>{{ s.label }}</b>
          <small *ngIf="s.sub">{{ s.sub }}</small>
        </button>
      </li>
    </ol>
  `,
  styles: [`
    :host { display: block; }
    .steps { display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; list-style: none; margin: 0; padding: 0; }
    .steps li button {
      width: 100%; text-align: left; border: 1px solid var(--line, #e6e7eb); background: var(--surface, #fff);
      border-radius: 10px; padding: 10px 12px; font: inherit; color: var(--ink-2, #475569); display: grid; gap: 2px;
      cursor: default; min-width: 0;
    }
    .steps li button b { font-size: 13px; color: var(--ink, #0f172a); }
    .steps li button small { font-size: 11.5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .steps li.done button { border-color: var(--good, #059669); cursor: pointer; }
    .steps li.done button b::before { content: "\\2713  "; color: var(--good, #059669); }
    .steps li.on button { border-color: var(--accent, #2563eb); box-shadow: 0 0 0 3px var(--accent-soft, #eff6ff); }
    .steps li.done button:disabled { cursor: default; }
    .steps li button:focus-visible { outline: 2px solid var(--accent, #2563eb); outline-offset: 2px; }
    @media (max-width: 760px) {
      .steps { grid-template-columns: 1fr 1fr; }
      .steps li button small { display: none; }
    }
  `]
})
export class ImportWizardStepperComponent {
  @Input() steps: WizardStepInfo[] = [];
  @Input() current: ImportWizardStep = 'upload';
  /** When true no step can be clicked (an import is running or finished). */
  @Input() locked = false;
  @Output() stepSelect = new EventEmitter<ImportWizardStep>();

  get currentIndex(): number {
    return this.steps.findIndex(s => s.key === this.current);
  }

  isClickable(i: number): boolean {
    return !this.locked && i < this.currentIndex;
  }

  choose(i: number): void {
    if (this.isClickable(i)) {
      this.stepSelect.emit(this.steps[i].key);
    }
  }
}
