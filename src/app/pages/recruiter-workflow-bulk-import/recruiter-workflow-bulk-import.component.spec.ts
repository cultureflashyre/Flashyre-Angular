import { of, throwError } from 'rxjs';
import { Router, ActivatedRoute } from '@angular/router';
import { RecruiterWorkflowBulkImportComponent } from './recruiter-workflow-bulk-import.component';
import {
  HeaderPreviewResponse, RecruiterWorkflowBulkImportService, UploadBatchDetail
} from '../../services/recruiter-workflow-bulk-import.service';
import { RecruiterWorkflowCandidateService } from '../../services/recruiter-workflow-candidate.service';
import { ApprovalNotificationService } from '../../services/approval-notification.service';

const FIELDS = [
  { key: 'email', label: 'Email Address', required: true, description: '' },
  { key: 'phone', label: 'Phone Number', required: true, description: '' },
  { key: 'current_location', label: 'Current location', required: false, description: '' },
  { key: 'preferred_location', label: 'Preferred location', required: false, description: '' },
  { key: 'skills', label: 'Skills', required: false, description: '' },
];

function headerResponse(mapping: Record<string, string>, over: Partial<HeaderPreviewResponse> = {}): HeaderPreviewResponse {
  const names = ['Mail ID', 'Mobile No', 'Location', 'Communication Skills'];
  return {
    success: true,
    headers: names,
    mapping,
    resolution_report: names.map((n, i) => ({
      column_index: i, raw_header: n, canonical: mapping[String(i)] || '_unmapped', tier: 1, tier_name: 'Exact Match',
      confidence: 100, reason: i === 3 ? 'ignored_yes_no' : 'matched_name',
      profile: { kind: 'text', share: 1, sample: ['a', 'b', 'c', 'd'] },
    })),
    missing_required: [],
    needs_review: false,
    canonical_fields: FIELDS,
    header_row_index: 0,
    ...over,
  };
}

function batch(over: Partial<UploadBatchDetail> = {}): UploadBatchDetail {
  return {
    id: 'job-1', file_name: 'x.xlsx', file_size: 10, file_hash: '', gcs_url: '', status: 'COMPLETED', total_rows: 5,
    success_rows: 5, failed_rows: 0, outcome_counts: { created_complete: 2, created_incomplete: 3 },
    current_sheet_name: '', last_processed_row: 5, processed_sheets: [], progress_percentage: 100, failure_reason: null,
    uploaded_by_id: null, started_at: null, completed_at: null, last_heartbeat_at: null, created_at: '', updated_at: '',
    ...over,
  } as UploadBatchDetail;
}

describe('RecruiterWorkflowBulkImportComponent import wizard', () => {
  let api: jasmine.SpyObj<RecruiterWorkflowBulkImportService>;
  let router: jasmine.SpyObj<Router>;
  let c: RecruiterWorkflowBulkImportComponent;
  const file = new File(['x'], 'sheet.xlsx');

  const GOOD_MAPPING = { '0': 'email', '1': 'phone', '2': 'current_location', '3': '_unmapped' };

  beforeEach(() => {
    api = jasmine.createSpyObj('RecruiterWorkflowBulkImportService', [
      'previewHeaders', 'createPreview', 'executePreview', 'downloadProblems', 'downloadTemplate',
      'pollBatchProgress', 'pollResumeBatchProgress', 'uploadResumeZip', 'getBatches', 'getResumeBatches',
      'getBatchErrors',
    ]);
    api.getBatches.and.returnValue(of({ count: 0, next: null, previous: null, results: [] }));
    api.getResumeBatches.and.returnValue(of({ count: 0, next: null, previous: null, results: [] }));
    api.previewHeaders.and.returnValue(of(headerResponse(GOOD_MAPPING)));
    api.createPreview.and.returnValue(of({
      id: 'prev-1', total: 5, counts: { created_complete: 2, created_incomplete: 3 }, filter_counts: {},
      fixes_suggested: 1, file_name: 'sheet.xlsx', expires_at: '', header_row_index: 0,
    }));
    api.executePreview.and.returnValue(of({ success: true, job_id: 'job-1', message: 'Import started.', batch: batch({ status: 'PENDING' }) }));
    api.pollBatchProgress.and.returnValue(of(batch({ status: 'PROCESSING' })));
    router = jasmine.createSpyObj('Router', ['navigate']);
    c = new RecruiterWorkflowBulkImportComponent(
      api,
      jasmine.createSpyObj<RecruiterWorkflowCandidateService>('RecruiterWorkflowCandidateService', ['getCandidates']),
      jasmine.createSpyObj<ApprovalNotificationService>('ApprovalNotificationService', ['markNotificationsAsSeen']),
      router,
      { queryParams: of({}) } as unknown as ActivatedRoute,
    );
    c.selectedTrackerFile = file;
    c.selectedDefaultSourcerId = 'u7';
  });

  it('starts on Upload and goes to Map even when the mapping is confident', () => {
    expect(c.step).toBe('upload');
    c.continueFromUpload();
    expect(api.previewHeaders).toHaveBeenCalledWith(file);
    expect(c.step).toBe('map');
    expect(c.previewReportItems.length).toBe(4);
    expect(c.userCustomMapping).toEqual(GOOD_MAPPING);
  });

  it('Continue on Map needs only one mapped column; unmapped mandatory fields are just listed', () => {
    api.previewHeaders.and.returnValue(of(headerResponse({ '0': 'email', '2': 'current_location' })));
    c.continueFromUpload();
    expect(c.missingRequiredList).toEqual(['Phone Number']);
    expect(c.canContinueFromMap).toBeTrue();
    c.onColumnMappingChange(1, 'phone');
    expect(c.missingRequiredList).toEqual([]);
    expect(c.canContinueFromMap).toBeTrue();
  });

  it('a sheet with no Email and no Phone column can still continue, and nothing mapped cannot', () => {
    api.previewHeaders.and.returnValue(of(headerResponse({ '0': 'skills' })));
    c.continueFromUpload();
    expect(c.missingRequiredList).toEqual(['Email Address', 'Phone Number']);
    expect(c.canContinueFromMap).toBeTrue();
    c.onColumnMappingChange(0, '_unmapped');
    expect(c.canContinueFromMap).toBeFalse();
  });

  it('shows the location hint only when Location is mapped and Preferred location is not', () => {
    c.continueFromUpload();
    expect(c.showLocationHint).toBeTrue();
    c.onColumnMappingChange(3, 'preferred_location');
    expect(c.showLocationHint).toBeFalse();
    c.onColumnMappingChange(3, '_unmapped');
    c.onColumnMappingChange(2, '_unmapped');
    expect(c.showLocationHint).toBeFalse();
  });

  it('labels the reason chips and marks a changed column as chosen by you', () => {
    c.continueFromUpload();
    const items = c.previewReportItems;
    expect(c.reasonLabel(items[0])).toBe('Matched name');
    expect(c.reasonLabel(items[3])).toBe('Yes/No answers ignored');
    c.onColumnMappingChange(0, 'skills');
    expect(c.reasonLabel(items[0])).toBe('Chosen by you');
    const labels: Record<string, string> = {
      similar_name: 'Close match', ai_guess: 'AI guess', looks_like_email: 'Looks like emails',
      looks_like_phone: 'Looks like phone numbers',
    };
    for (const [reason, label] of Object.entries(labels)) {
      expect(c.reasonLabel({ ...items[0], reason })).toBe(label);
    }
  });

  it('Continue from Map creates the preview with the mapping and sourcer and opens Review', () => {
    c.continueFromUpload();
    c.continueFromMap();
    expect(api.createPreview).toHaveBeenCalledWith(file, GOOD_MAPPING, 'u7');
    expect(c.step).toBe('review');
    expect(c.previewId).toBe('prev-1');
  });

  it('Back from Map keeps the file and the mapping', () => {
    c.continueFromUpload();
    c.onColumnMappingChange(0, 'skills');
    c.requestStep('upload');
    expect(c.step).toBe('upload');
    expect(c.selectedTrackerFile).toBe(file);
    c.continueFromUpload();
    expect(api.previewHeaders).toHaveBeenCalledTimes(1);
    expect(c.step).toBe('map');
    expect(c.userCustomMapping['0']).toBe('skills');
  });

  describe('leaving Review', () => {
    beforeEach(() => {
      c.continueFromUpload();
      c.continueFromMap();
    });

    it('asks inside the page, not with window.confirm', () => {
      const confirmSpy = spyOn(window, 'confirm');
      c.requestStep('map');
      expect(confirmSpy).not.toHaveBeenCalled();
      expect(c.showLeaveReviewConfirm).toBeTrue();
      expect(c.step).toBe('review');
    });

    it('Stay keeps the review and its preview', () => {
      c.requestStep('map');
      c.cancelLeaveReview();
      expect(c.showLeaveReviewConfirm).toBeFalse();
      expect(c.step).toBe('review');
      expect(c.previewId).toBe('prev-1');
    });

    it('Discard goes back, drops the preview and keeps the mapping', () => {
      c.requestStep('map');
      c.confirmLeaveReview();
      expect(c.step).toBe('map');
      expect(c.previewId).toBeNull();
      expect(c.userCustomMapping).toEqual(GOOD_MAPPING);
      expect(c.showLeaveReviewConfirm).toBeFalse();
    });

    it('clicking the Upload step in the stepper also asks first', () => {
      c.requestStep('upload');
      expect(c.showLeaveReviewConfirm).toBeTrue();
      c.confirmLeaveReview();
      expect(c.step).toBe('upload');
    });
  });

  describe('Import', () => {
    beforeEach(() => {
      c.continueFromUpload();
      c.continueFromMap();
    });

    it('is allowed with unresolved problems and fixes (never blocked)', () => {
      c.onReviewCountsChange({ created_incomplete: 4, skipped_owned: 1, skipped_invalid: 2 });
      c.importNow();
      expect(api.executePreview).toHaveBeenCalledWith('prev-1');
      expect(c.step).toBe('import');
      expect(c.resultsJobId).toBe('job-1');
      expect(api.pollBatchProgress).toHaveBeenCalledWith('job-1', 2000);
    });

    it('moves to Results when the job finishes', () => {
      api.pollBatchProgress.and.returnValue(of(batch({ status: 'COMPLETED_WITH_ERRORS', failed_rows: 1 })));
      api.getBatchErrors.and.returnValue(of({ count: 0, next: null, previous: null, results: [] }));
      c.importNow();
      expect(c.step).toBe('results');
      expect(c.currentTrackerBatch?.status).toBe('COMPLETED_WITH_ERRORS');
    });

    it('follows the running job when the server answers 409', () => {
      api.executePreview.and.returnValue(throwError(() => ({ status: 409, error: { job_id: 'job-9' } })));
      c.importNow();
      expect(c.step).toBe('import');
      expect(c.resultsJobId).toBe('job-9');
    });

    it('shows an error and stays on Review when the import cannot start', () => {
      api.executePreview.and.returnValue(throwError(() => ({ status: 410, error: { detail: 'Preview expired' } })));
      c.importNow();
      expect(c.step).toBe('review');
      expect(c.importErrorMsg).toBe('Preview expired');
    });

    it('sends the selected resumes after Import, linked to the same job', () => {
      const zip = new File(['z'], 'resumes.zip');
      c.selectedResumeFiles = [zip];
      api.uploadResumeZip.and.returnValue(of({ resume_batch: { id: 'rb-1' } }));
      api.pollResumeBatchProgress.and.returnValue(of({ id: 'rb-1', status: 'PROCESSING' } as any));
      c.importNow();
      expect(api.uploadResumeZip).toHaveBeenCalledWith([zip], 'job-1');
      expect(c.selectedResumeFiles).toEqual([]);
      expect(c.step).toBe('import');
    });

    it('locks the stepper once the import has started', () => {
      c.importNow();
      expect(c.wizardLocked).toBeTrue();
      c.requestStep('upload');
      expect(c.step).toBe('import');
    });
  });

  describe('Results', () => {
    beforeEach(() => {
      c.continueFromUpload();
      c.continueFromMap();
      api.pollBatchProgress.and.returnValue(of(batch({
        outcome_counts: { created_complete: 2, created_incomplete: 3, skipped_owned: 1 },
      })));
      c.importNow();
    });

    it('shows friendly outcome counts', () => {
      const tiles = c.resultTiles;
      expect(tiles.find(t => t.key === 'created_complete')).toEqual({ key: 'created_complete', label: 'New candidates', count: 2 });
      expect(tiles.find(t => t.key === 'created_incomplete')?.label).toBe('Added to Needs info');
      expect(tiles.find(t => t.key === 'created_incomplete')?.count).toBe(3);
      expect(tiles.find(t => t.key === 'skipped_owned')?.count).toBe(1);
    });

    it('downloads the problem rows of the finished job', () => {
      const blob = new Blob(['a']);
      api.downloadProblems.and.returnValue(of(blob));
      const save = spyOn<any>(c, 'saveBlob');
      c.downloadProblemRows('job');
      expect(api.downloadProblems).toHaveBeenCalledWith('job-1', 'job');
      expect(save).toHaveBeenCalledWith(blob, 'problem_rows.csv');
    });

    it('opens the Needs info tab of the candidate page', () => {
      c.openNeedsInfo();
      expect(router.navigate).toHaveBeenCalledWith(['/recruiter-workflow-candidate'], { queryParams: { tab: 'needs_info' } });
    });

    it('Import another sheet resets to a clean Upload step', () => {
      c.importAnother();
      expect(c.step).toBe('upload');
      expect(c.selectedTrackerFile).toBeNull();
      expect(c.previewId).toBeNull();
      expect(c.previewData).toBeNull();
      expect(c.resultsJobId).toBeNull();
      expect(c.wizardLocked).toBeFalse();
    });
  });

  describe('where the table is', () => {
    const located = (over: Partial<HeaderPreviewResponse> = {}) => headerResponse(GOOD_MAPPING, {
      header_row_index: 2, header_row_number: 3, first_data_column: 2, first_data_column_letter: 'C',
      sheet: 'Candidates', sheet_names: ['Candidates'], table_ref: null, ...over,
    });

    it('says where the table was found', () => {
      api.previewHeaders.and.returnValue(of(located()));
      c.continueFromUpload();
      expect(c.tableLocationNote).toBe("Table found at row 3, starting at column C (sheet 'Candidates')");
    });

    it('has no note for an answer from an older server', () => {
      c.continueFromUpload();
      expect(c.tableLocationNote).toBe('');
    });

    it('a plain sheet needs no layout options on createPreview', () => {
      api.previewHeaders.and.returnValue(of(located()));
      c.continueFromUpload();
      c.continueFromMap();
      expect(api.createPreview).toHaveBeenCalledWith(file, GOOD_MAPPING, 'u7');
    });

    it('picking another sheet reads the columns again for that sheet', () => {
      api.previewHeaders.and.returnValue(of(located({ sheet_names: ['Candidates', 'Other'] })));
      c.continueFromUpload();
      expect(c.sheetNames).toEqual(['Candidates', 'Other']);
      api.previewHeaders.and.returnValue(of(located({ sheet: 'Other', sheet_names: ['Candidates', 'Other'], header_row_number: 1 })));
      c.onSheetChange('Other');
      expect(api.previewHeaders).toHaveBeenCalledWith(file, { sheet: 'Other' });
      expect(c.chosenSheet).toBe('Other');
      expect(c.tableLocationNote).toContain("(sheet 'Other')");
      expect(c.step).toBe('map');
    });

    it('createPreview is sent the same sheet when the file has several', () => {
      api.previewHeaders.and.returnValue(of(located({ sheet_names: ['Candidates', 'Other'] })));
      c.continueFromUpload();
      c.continueFromMap();
      expect(api.createPreview).toHaveBeenCalledWith(file, GOOD_MAPPING, 'u7', { sheet: 'Candidates' });
    });

    it('"My header is on another row" reads the columns again with that row and createPreview repeats it', () => {
      api.previewHeaders.and.returnValue(of(located()));
      c.continueFromUpload();
      c.toggleHeaderRowEditor();
      expect(c.showHeaderRowEditor).toBeTrue();
      expect(c.headerRowInput).toBe(3);
      api.previewHeaders.and.returnValue(of(located({ header_row_number: 8, header_row_index: 7 })));
      c.headerRowInput = '8';
      c.applyHeaderRow();
      expect(api.previewHeaders).toHaveBeenCalledWith(file, { sheet: 'Candidates', headerRow: 8 });
      expect(c.tableLocationNote).toContain('row 8');
      c.continueFromMap();
      expect(api.createPreview).toHaveBeenCalledWith(file, GOOD_MAPPING, 'u7', { headerRow: 8 });
    });

    it('a header row that is not a number is refused without asking the server', () => {
      api.previewHeaders.and.returnValue(of(located()));
      c.continueFromUpload();
      api.previewHeaders.calls.reset();
      for (const bad of ['', 'abc', 0, -2, 2.5]) {
        c.headerRowInput = bad;
        c.applyHeaderRow();
        expect(c.mapErrorMsg).toContain('row number');
      }
      expect(api.previewHeaders).not.toHaveBeenCalled();
    });

    it('a row the server rejects shows its message and keeps the earlier columns', () => {
      api.previewHeaders.and.returnValue(of(located()));
      c.continueFromUpload();
      api.previewHeaders.and.returnValue(throwError(() => ({ error: { error: 'Row 99 is empty or past the end of the sheet.' } })));
      c.headerRowInput = 99;
      c.applyHeaderRow();
      expect(c.mapErrorMsg).toBe('Row 99 is empty or past the end of the sheet.');
      expect(c.previewReportItems.length).toBe(4);
      expect(c.step).toBe('map');
      expect(c.headerRowOverride).toBeNull();
    });

    it('labels the new reasons', () => {
      c.continueFromUpload();
      const item = c.previewReportItems[0];
      expect(c.reasonLabel({ ...item, reason: 'serial_number' })).toBe('Row numbers ignored');
      expect(c.reasonLabel({ ...item, reason: 'no_header' })).toBe('No header, no match');
    });
  });

  it('downloads the template', () => {
    const blob = new Blob(['t']);
    api.downloadTemplate.and.returnValue(of(blob));
    const save = spyOn<any>(c, 'saveBlob');
    c.downloadTemplate();
    expect(save).toHaveBeenCalledWith(blob, 'candidate_import_template.xlsx');
  });
});
