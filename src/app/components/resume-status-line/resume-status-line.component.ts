import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ResumeStatus } from '../../services/recruiter-workflow-candidate.service';

/**
 * One-line state of the resume reading, shared by the sidebar and the detail card.
 * processing: "Reading the resume…" with a Refresh button (the page reloads the person);
 * failed / unreadable: the reason with a Retry button for editors only; none and done show nothing.
 */
@Component({
  selector: 'app-resume-status-line',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="line" *ngIf="message()" [class.problem]="problem()" role="status" data-test="resume-status" [attr.data-status]="status()">
      <span class="spinner" *ngIf="status() === 'processing'" aria-hidden="true"></span>
      <span class="msg" data-test="resume-status-text">{{ message() }}</span>
      <button type="button" class="act" data-test="refresh-resume" *ngIf="status() === 'processing'"
              [disabled]="busy()" (click)="refresh.emit()">Refresh</button>
      <button type="button" class="act" data-test="retry-resume" *ngIf="problem() && canRetry()"
              [disabled]="busy()" (click)="retry.emit()">Retry</button>
    </div>
  `,
  styles: [`
    .line { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; font-size: 13px; color: #334155; }
    .line.problem { color: #b45309; }
    .spinner { width: 12px; height: 12px; border: 2px solid #cbd5e1; border-top-color: #0f172a; border-radius: 50%;
      display: inline-block; animation: spin .8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .act { border: 0; background: none; padding: 0; color: #1d4ed8; cursor: pointer; font: inherit; text-decoration: underline; }
    .act:disabled { opacity: .5; cursor: default; }
    .act:focus-visible { outline: 2px solid #2563eb; outline-offset: 2px; }
  `]
})
export class ResumeStatusLineComponent {
  readonly status = input<ResumeStatus | null | undefined>('none');
  /** True for the sourcing recruiter or an admin; others never see Retry. */
  readonly canRetry = input<boolean>(false);
  /** A retry or refresh is in flight. */
  readonly busy = input<boolean>(false);

  readonly retry = output<void>();
  readonly refresh = output<void>();

  readonly problem = computed(() => this.status() === 'failed' || this.status() === 'unreadable');
  readonly message = computed(() => {
    switch (this.status()) {
      case 'processing': return 'Reading the resume…';
      case 'failed': return 'Could not read the resume';
      case 'unreadable': return 'The file has no readable text';
      default: return '';
    }
  });
}
