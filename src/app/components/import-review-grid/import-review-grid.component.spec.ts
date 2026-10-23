import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ImportReviewGridComponent } from './import-review-grid.component';
import { RecruiterWorkflowBulkImportService, RowPreview } from '../../services/recruiter-workflow-bulk-import.service';

function row(over: Partial<RowPreview> & { row_number: number }): RowPreview {
  return {
    values: {}, accepted_fixes: {}, outcome: 'created_complete', missing: [], fixes: [], problems: [],
    duplicate_of: null, owner_name: null, ...over,
  } as RowPreview;
}

const FILTER_COUNTS = { all: 5, ready: 1, needs_info: 2, fixes: 1, skipped: 1, errors: 0 };
const COUNTS = { created_complete: 1, created_incomplete: 2, skipped_owned: 1 };

describe('ImportReviewGridComponent', () => {
  let fixture: ComponentFixture<ImportReviewGridComponent>;
  let api: jasmine.SpyObj<RecruiterWorkflowBulkImportService>;
  let el: HTMLElement;

  const rows: RowPreview[] = [
    row({ row_number: 1, values: { first_name_only: 'Asha', last_name_only: 'Rao', email: 'asha@gmail.com' } }),
    row({
      row_number: 2, outcome: 'created_incomplete', missing: ['skills'],
      values: { candidate_name: 'Shubh Vernekar', email: 'shubhvernekar@' },
      fixes: [{ original: 'shubhvernekar@', suggested: 'shubhvernekar@gmail.com', confidence: 'likely', reason: 'Added gmail.com', accepted: false, field: 'email', ticked: true }],
    }),
    row({
      row_number: 3, outcome: 'created_incomplete', missing: ['email'],
      values: { candidate_name: 'Guess Person', email: 'shubh.vernekar' },
      fixes: [{ original: 'shubh.vernekar', suggested: 'shubh.vernekar@gmail.com', confidence: 'guess', reason: 'Bare username', accepted: false, field: 'email', ticked: false }],
      problems: ['invalid_email'],
    }),
    row({ row_number: 4, outcome: 'skipped_owned', owner_name: 'Rec Two', values: { candidate_name: 'Owned Person', email: 'o@x.com', phone: '9876543210' } }),
    row({ row_number: 5, outcome: 'merged_into_row', duplicate_of: 1, values: { candidate_name: 'Asha Again' } }),
  ];

  const rowsResponse = (results = rows) =>
    of({ results, count: results.length, page: 1, page_size: 100, counts: COUNTS, filter_counts: FILTER_COUNTS });

  beforeEach(() => {
    api = jasmine.createSpyObj('RecruiterWorkflowBulkImportService', ['getPreviewRows', 'updatePreviewRow', 'acceptFixes']);
    api.getPreviewRows.and.callFake(() => rowsResponse());
    TestBed.configureTestingModule({
      imports: [ImportReviewGridComponent],
      providers: [{ provide: RecruiterWorkflowBulkImportService, useValue: api }],
    });
    fixture = TestBed.createComponent(ImportReviewGridComponent);
    el = fixture.nativeElement;
    fixture.componentRef.setInput('previewId', 'p1');
    fixture.detectChanges();
  });

  const rowEl = (n: number) => el.querySelector(`tr[data-row="${n}"]`) as HTMLElement;
  const norm = (e: Element) => e.textContent!.replace(/\s+/g, ' ').trim();

  it('loads page 1 of all rows and emits the outcome counts', () => {
    expect(api.getPreviewRows).toHaveBeenCalledWith('p1', 1, 'all');
    expect(el.querySelectorAll('tbody tr.row').length).toBe(5);
  });

  it('emits countsChange with the server counts', () => {
    const emitted: Record<string, number>[] = [];
    const f2 = TestBed.createComponent(ImportReviewGridComponent);
    f2.componentInstance.countsChange.subscribe(c => emitted.push(c));
    f2.componentRef.setInput('previewId', 'p1');
    f2.detectChanges();
    expect(emitted[0]).toEqual(COUNTS);
  });

  it('shows filter chips with their counts and reloads when one is chosen', () => {
    const chip = (k: string) => el.querySelector(`.fchip[data-filter="${k}"]`) as HTMLButtonElement;
    expect(norm(chip('needs_info'))).toBe('Needs info 2');
    expect(norm(chip('skipped'))).toBe('Will skip 1');
    api.getPreviewRows.calls.reset();
    api.getPreviewRows.and.callFake(() => rowsResponse([rows[1], rows[2]]));
    chip('needs_info').click();
    fixture.detectChanges();
    expect(api.getPreviewRows).toHaveBeenCalledWith('p1', 1, 'needs_info');
    expect(el.querySelectorAll('tbody tr.row').length).toBe(2);
    expect(chip('needs_info').classList.contains('active')).toBeTrue();
  });

  it('uses the mockup outcome labels', () => {
    expect(norm(rowEl(1).querySelector('.pill')!)).toBe('New candidate');
    expect(norm(rowEl(2).querySelector('.pill')!)).toBe('Needs info');
    expect(norm(rowEl(4).querySelector('.pill')!)).toBe('Will skip');
    expect(norm(rowEl(5).querySelector('.pill')!)).toBe('Merged into row 1');
  });

  it('shows the original email struck through with the suggestion; likely is ticked, guess is not', () => {
    const r2 = rowEl(2);
    expect(norm(r2.querySelector('s')!)).toBe('shubhvernekar@');
    expect(norm(r2.querySelector('.sugg')!)).toBe('shubhvernekar@gmail.com');
    expect((r2.querySelector('input.fix-box') as HTMLInputElement).checked).toBeTrue();
    expect((rowEl(3).querySelector('input.fix-box') as HTMLInputElement).checked).toBeFalse();
    expect(norm(rowEl(3).querySelector('.problem')!)).toBe('Invalid email');
  });

  it('ticking a fix saves it and updates the outcome pill from the response', () => {
    api.updatePreviewRow.and.returnValue(of({
      ...rows[2], outcome: 'created_complete', missing: [], accepted_fixes: { email: 'shubh.vernekar@gmail.com' },
      fixes: [{ ...rows[2].fixes[0], accepted: true, ticked: true }],
      changed_rows: [], counts: COUNTS, filter_counts: FILTER_COUNTS,
    } as any));
    const box = rowEl(3).querySelector('input.fix-box') as HTMLInputElement;
    box.click();
    fixture.detectChanges();
    expect(api.updatePreviewRow).toHaveBeenCalledWith('p1', 3, undefined, { email: 'shubh.vernekar@gmail.com' });
    expect(norm(rowEl(3).querySelector('.pill')!)).toBe('New candidate');
    expect((rowEl(3).querySelector('input.fix-box') as HTMLInputElement).checked).toBeTrue();
  });

  it('unticking withdraws the fix with an empty email', () => {
    api.updatePreviewRow.and.returnValue(of({ ...rows[1], changed_rows: [], counts: COUNTS, filter_counts: FILTER_COUNTS } as any));
    (rowEl(2).querySelector('input.fix-box') as HTMLInputElement).click();
    expect(api.updatePreviewRow).toHaveBeenCalledWith('p1', 2, undefined, { email: '' });
  });

  it('re-fetches the page when other rows changed', () => {
    api.updatePreviewRow.and.returnValue(of({ ...rows[1], changed_rows: [2, 5], counts: COUNTS, filter_counts: FILTER_COUNTS } as any));
    api.getPreviewRows.calls.reset();
    (rowEl(2).querySelector('input.fix-box') as HTMLInputElement).click();
    expect(api.getPreviewRows).toHaveBeenCalledTimes(1);
  });

  it('Accept all likely fixes calls acceptFixes with auto and likely, then reloads', () => {
    api.acceptFixes.and.returnValue(of({ updated: 1, counts: COUNTS, filter_counts: FILTER_COUNTS }));
    api.getPreviewRows.calls.reset();
    (el.querySelector('button.accept-all') as HTMLButtonElement).click();
    expect(api.acceptFixes).toHaveBeenCalledWith('p1', ['auto', 'likely']);
    expect(api.getPreviewRows).toHaveBeenCalledTimes(1);
  });

  it('edits Phone, Email, Skills, Education and Preferred location inline, saving on blur', () => {
    api.updatePreviewRow.and.callFake((_id, n) => of({ ...rows[0], row_number: n, changed_rows: [], counts: COUNTS, filter_counts: FILTER_COUNTS } as any));
    const r1 = rowEl(1);
    const cases: [string, string, string][] = [
      ['phone', 'phone', '9876543210'],
      ['email', 'email', 'asha.rao@gmail.com'],
      ['skills', 'skills', 'Python, SQL'],
      ['education', 'qualification', 'B.Tech'],
      ['preferred_location', 'preferred_location', 'Pune'],
    ];
    for (const [cell, field, value] of cases) {
      const input = r1.querySelector(`input[data-field="${cell}"]`) as HTMLInputElement;
      expect(input).withContext(cell).not.toBeNull();
      input.value = value;
      input.dispatchEvent(new Event('blur'));
      expect(api.updatePreviewRow).toHaveBeenCalledWith('p1', 1, { [field]: value }, undefined);
    }
  });

  it('does not save a cell that was not changed', () => {
    const input = rowEl(1).querySelector('input[data-field="email"]') as HTMLInputElement;
    input.dispatchEvent(new Event('blur'));
    expect(api.updatePreviewRow).not.toHaveBeenCalled();
  });

  it('shows "Owned by <name>" and makes owned rows read-only', () => {
    const r4 = rowEl(4);
    expect(norm(r4)).toContain('Owned by Rec Two');
    expect(r4.querySelectorAll('input[data-field]').length).toBe(0);
    expect(norm(r4)).toContain('9876543210');
  });

  it('pages from the server 100 rows at a time', () => {
    api.getPreviewRows.and.returnValue(of({ results: rows, count: 250, page: 1, page_size: 100, counts: COUNTS, filter_counts: FILTER_COUNTS }));
    fixture.componentInstance.load();
    fixture.detectChanges();
    expect(norm(el.querySelector('.pager')!)).toContain('Page 1 of 3');
    api.getPreviewRows.calls.reset();
    (el.querySelector('.pager .next') as HTMLButtonElement).click();
    expect(api.getPreviewRows).toHaveBeenCalledWith('p1', 2, 'all');
  });
});
