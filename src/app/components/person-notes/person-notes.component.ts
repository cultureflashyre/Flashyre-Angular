import { ChangeDetectorRef, Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CandidateNote, RecruiterWorkflowCandidateService } from '../../services/recruiter-workflow-candidate.service';

/** Notes on one person (a candidate or someone in the Needs-info inbox). Any recruiter can add; the author or a super admin can delete. */
@Component({
  selector: 'app-person-notes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="notes">
      <div class="notes-head">Notes <span class="count" *ngIf="notes.length">{{ notes.length }}</span></div>

      <div class="add">
        <textarea [(ngModel)]="draft" rows="2" maxlength="5000" placeholder="Add a note (call outcome, feedback, reminder)..."
                  [disabled]="saving" (keydown.control.enter)="add()"></textarea>
        <button type="button" class="btn" (click)="add()" [disabled]="saving || !draft.trim()">
          {{ saving ? 'Saving...' : 'Add note' }}
        </button>
      </div>
      <div class="error" *ngIf="error">{{ error }}</div>

      <div class="loading" *ngIf="loading">Loading notes...</div>
      <div class="empty" *ngIf="!loading && !notes.length">No notes yet.</div>

      <ul class="list" *ngIf="notes.length">
        <li *ngFor="let n of notes; trackBy: trackById">
          <div class="meta">
            <strong>{{ n.author_name || 'Unknown' }}</strong>
            <span>{{ n.created_at | date: 'medium' }}</span>
            <span *ngIf="n.source === 'import'" class="tag-import" title="Created from the Remarks column of an imported sheet">Imported from sheet</span>
            <button *ngIf="canDelete(n)" type="button" class="del" (click)="remove(n)" title="Delete note">Delete</button>
          </div>
          <div class="body">{{ n.body }}</div>
        </li>
      </ul>
    </div>
  `,
  styles: [`
    .notes { font-size: 13px; color: #0f172a; }
    .notes-head { font-weight: 700; margin-bottom: 8px; }
    .count { background: #f1f5f9; border-radius: 999px; padding: 0 7px; font-size: 11px; margin-left: 4px; }
    .add { display: flex; gap: 8px; align-items: flex-start; }
    textarea { flex: 1; resize: vertical; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px; font: inherit; }
    .btn { border: 1px solid #0f172a; background: #0f172a; color: #fff; border-radius: 8px; padding: 7px 12px; cursor: pointer; font: inherit; }
    .btn[disabled] { opacity: .5; cursor: default; }
    .error { color: #b91c1c; margin-top: 6px; }
    .empty, .loading { color: #64748b; margin: 10px 0; }
    .list { list-style: none; margin: 12px 0 0; padding: 0; display: grid; gap: 8px; }
    .list li { border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 10px; background: #fafafb; }
    .meta { display: flex; gap: 8px; align-items: center; color: #64748b; font-size: 12px; }
    .meta strong { color: #0f172a; }
    .tag-import { background: var(--primary-soft, #f1f5f9); color: var(--ink-2, #475569); border-radius: 999px; padding: 1px 7px; font-size: 10.5px; font-weight: 600; line-height: 1.5; }
    .del { margin-left: auto; border: 0; background: none; color: #b91c1c; cursor: pointer; font: inherit; font-size: 12px; }
    .body { white-space: pre-wrap; margin-top: 4px; word-break: break-word; }
  `]
})
export class PersonNotesComponent implements OnChanges {
  @Input() kind: 'candidate' | 'intake' = 'candidate';
  @Input() personId: number | null = null;

  notes: CandidateNote[] = [];
  draft = '';
  loading = false;
  saving = false;
  error = '';

  private readonly userId = String(localStorage.getItem('user_id') || localStorage.getItem('userId') || '');
  private readonly isSuperUser = localStorage.getItem('isSuperUser') === 'true';

  constructor(private service: RecruiterWorkflowCandidateService, private cdr: ChangeDetectorRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['personId'] || changes['kind']) {
      this.load();
    }
  }

  trackById(_: number, note: CandidateNote): number {
    return note.id;
  }

  canDelete(note: CandidateNote): boolean {
    return this.isSuperUser || (!!note.author && String(note.author) === this.userId);
  }

  load(): void {
    this.notes = [];
    this.error = '';
    if (!this.personId) { return; }
    this.loading = true;
    this.service.getNotes(this.kind, this.personId).subscribe({
      next: notes => { this.notes = notes; this.loading = false; this.cdr.markForCheck(); },
      error: () => { this.loading = false; this.error = 'Could not load notes.'; this.cdr.markForCheck(); }
    });
  }

  add(): void {
    const body = this.draft.trim();
    if (!body || !this.personId || this.saving) { return; }
    this.saving = true;
    this.error = '';
    this.service.addNote(this.kind, this.personId, body).subscribe({
      next: note => { this.notes = [note, ...this.notes]; this.draft = ''; this.saving = false; this.cdr.markForCheck(); },
      error: err => {
        this.saving = false;
        this.error = err?.error?.body?.[0] || err?.error?.detail || 'Could not save the note.';
        this.cdr.markForCheck();
      }
    });
  }

  remove(note: CandidateNote): void {
    this.service.deleteNote(note.id).subscribe({
      next: () => { this.notes = this.notes.filter(n => n.id !== note.id); this.cdr.markForCheck(); },
      error: err => { this.error = err?.error?.detail || 'Could not delete the note.'; this.cdr.markForCheck(); }
    });
  }
}
