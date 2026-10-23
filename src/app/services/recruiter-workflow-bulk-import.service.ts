import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable, timer } from 'rxjs';
import { switchMap, takeWhile } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

export interface UploadBatchDetail {
  id: string;
  file_name: string;
  file_size: number;
  file_hash: string;
  gcs_url: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'COMPLETED_WITH_ERRORS' | 'FAILED';
  total_rows: number;
  success_rows: number;
  failed_rows: number;
  /** What happened to each row: created_complete, created_incomplete, updated, promoted, skipped_owned, skipped_invalid */
  outcome_counts?: { [outcome: string]: number };
  current_sheet_name: string;
  last_processed_row: number;
  processed_sheets: string[];
  progress_percentage: number;
  failure_reason: string | null;
  column_mapping?: Record<string, string>;
  uploaded_by_id: string | null;
  uploaded_by_name?: string | null;
  uploaded_by_initials?: string | null;
  started_at: string | null;
  completed_at: string | null;
  last_heartbeat_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface HeaderResolutionItem {
  column_index: number;
  raw_header: string;
  canonical: string;
  tier: number;
  tier_name: string;
  confidence: number;
  /** Why the column was mapped: manual, matched_name, similar_name, ai_guess, looks_like_email, looks_like_phone, ignored_yes_no */
  reason?: string;
  /** What the cells look like: kind (email, phone, yes_no, number, date, text, empty), share and a few sample values. */
  profile?: { kind: string; share: number; sample: string[] } | null;
}

export interface CanonicalFieldMeta {
  key: string;
  label: string;
  required: boolean;
  description: string;
}

export interface HeaderPreviewResponse {
  success: boolean;
  headers: string[];
  mapping: Record<string, string>;
  resolution_report: HeaderResolutionItem[];
  missing_required: string[];
  needs_review: boolean;
  canonical_fields: CanonicalFieldMeta[];
  /** 0-based row of the detected header; rows above it were a title or blank. */
  header_row_index?: number;
  /** The same row as Excel numbers it (1-based). */
  header_row_number?: number;
  /** 0-based column (A = 0) where the table starts, and its letter. Mapping keys count from this column. */
  first_data_column?: number;
  first_data_column_letter?: string;
  /** The sheet that was read and every visible sheet of the file. */
  sheet?: string;
  sheet_names?: string[];
  /** Range of the Excel Table / filter the table was taken from, when there is one. */
  table_ref?: string | null;
}

/** Overrides for where the table is: a sheet name and/or the real Excel row of the header. */
export interface SheetLayoutOptions {
  sheet?: string;
  headerRow?: number;
}

export interface ResumeBatchDetail {
  id: string;
  upload_batch_id: string | null;
  zip_file_name: string;
  file_size: number;
  zip_file_hash: string;
  gcs_folder_path: string;
  gcs_zip_url: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'COMPLETED_WITH_ERRORS' | 'FAILED';
  total_files: number;
  extracted_files: number;
  matched_files: number;
  unmatched_files: number;
  failed_files: number;
  progress_percentage: number;
  failure_reason: string | null;
  uploaded_by_id: string | null;
  uploaded_by_name?: string | null;
  uploaded_by_initials?: string | null;
  unmatched_resumes_count: number;
  started_at: string | null;
  completed_at: string | null;
  last_heartbeat_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExportableField {
  key: string;
  label: string;
  category: string;
}

export interface ReportFieldsResponse {
  fields: ExportableField[];
  default_selection: string[];
  categories: string[];
}

export interface ReportGenerateRequest {
  format: 'xlsx' | 'csv';
  date_from?: string;
  date_to?: string;
  fields: string[];
  batch_id?: string;
  source_filter?: string;
}

export interface ReportApprovalRequest {
  id: string;
  requested_by_id: string;
  requested_by_name: string;
  requested_by_initials: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  candidate_count: number;
  report_params: ReportGenerateRequest;
  reviewed_by_name: string | null;
  reviewed_at: string | null;
  report_file_url: string | null;
  is_expired: boolean;
  expires_at: string;
  created_at: string;
  updated_at: string;
}


export interface UnmatchedResumeItem {
  id: number;
  resume_batch_id: string;
  original_filename: string;
  gcs_url: string;
  ai_parsed_data: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone_number?: string;
    skills?: string;
    work_experience?: string;
    total_experience_years?: number;
    current_location?: string;
    location_city?: string;
    current_ctc?: string;
    notice_period?: string;
  } | null;
  match_attempts: any;
  resolved: boolean;
  resolved_candidate_id: number | null;
  resolved_candidate_name: string | null;
  resolved_at: string | null;
  created_at: string;
}

export interface ErrorLogItem {
  id: number;
  sheet_name: string;
  row_number: number;
  error_message: string;
  raw_data: any;
  created_at: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// -------------------------------------------------------------
// REVIEW-BEFORE-IMPORT (PREVIEW) TYPES
// -------------------------------------------------------------
export type PreviewOutcome =
  | 'created_complete' | 'created_incomplete' | 'updated' | 'promoted' | 'matched'
  | 'skipped_owned' | 'skipped_invalid' | 'merged_into_row';

export type PreviewFilter = 'all' | 'ready' | 'needs_info' | 'fixes' | 'skipped' | 'errors';

export interface EmailFix {
  original: string;
  suggested: string;
  confidence: 'likely' | 'guess';
  reason: string;
  accepted: boolean;
  field: 'email';
  /** Checkbox state in the grid: likely starts ticked, guess unticked. */
  ticked: boolean;
}

export interface RowPreview {
  row_number: number;
  /** Canonical field -> cell value; unmapped columns are keyed `_unmapped_<header>`. */
  values: Record<string, any>;
  accepted_fixes: Record<string, string>;
  outcome: PreviewOutcome;
  missing: string[];
  fixes: EmailFix[];
  problems: string[];
  duplicate_of: number | null;
  owner_name: string | null;
  person_kind?: string | null;
  person_id?: number | null;
  merged_rows?: number[];
}

export interface ImportPreviewSummary {
  id: string;
  total: number;
  counts: Record<string, number>;
  filter_counts: Record<string, number>;
  fixes_suggested: number;
  file_name: string;
  expires_at: string;
  header_row_index: number;
  header_row_number?: number;
  first_data_column?: number;
  first_data_column_letter?: string;
  sheet?: string;
  sheet_names?: string[];
}

export interface PreviewRowsResponse {
  results: RowPreview[];
  count: number;
  page: number;
  page_size: number;
  counts: Record<string, number>;
  filter_counts: Record<string, number>;
}

export interface PreviewRowUpdateResponse extends RowPreview {
  changed_rows: number[];
  counts: Record<string, number>;
  filter_counts: Record<string, number>;
}

export interface PreviewAcceptFixesResponse {
  updated: number;
  counts: Record<string, number>;
  filter_counts: Record<string, number>;
}

export interface PreviewExecuteResponse {
  success: boolean;
  job_id: string;
  message: string;
  batch?: any;
}

@Injectable({
  providedIn: 'root'
})
export class RecruiterWorkflowBulkImportService {
  private baseUrl = environment.apiUrl + 'api/bulk-import/';

  constructor(private http: HttpClient) {}

  // -------------------------------------------------------------
  // SPREADSHEET TRACKER IMPORT METHODS
  // -------------------------------------------------------------
  /**
   * Fast header extraction and 3-tier dynamic header mapping preview.
   */
  previewHeaders(file: File, layout?: SheetLayoutOptions): Observable<HeaderPreviewResponse> {
    const formData = new FormData();
    formData.append('file', file);
    this.appendLayout(formData, layout);
    return this.http.post<HeaderPreviewResponse>(`${this.baseUrl}preview-headers/`, formData);
  }

  /**
   * Uploads Excel/CSV file to bulk import endpoint with optional custom column mapping.
   */
  uploadCandidateFile(
    file: File,
    force: boolean = false,
    columnMapping?: Record<string, string>,
    defaultSourcerId?: string
  ): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    if (force) {
      formData.append('force', 'true');
    }
    if (columnMapping && Object.keys(columnMapping).length > 0) {
      formData.append('column_mapping', JSON.stringify(columnMapping));
    }
    if (defaultSourcerId) {
      formData.append('default_sourcer_id', defaultSourcerId);
    }

    return this.http.post(`${this.baseUrl}upload/`, formData);
  }

  /**
   * Retrieves status and checkpoint details for a specific spreadsheet batch.
   */
  getBatchStatus(batchId: string): Observable<UploadBatchDetail> {
    return this.http.get<UploadBatchDetail>(`${this.baseUrl}batch/${batchId}/`);
  }

  /**
   * Retrieves paginated ErrorLog records for a given batch.
   */
  getBatchErrors(
    batchId: string,
    page: number = 1,
    pageSize: number = 50,
    sheetName?: string
  ): Observable<PaginatedResponse<ErrorLogItem>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('page_size', pageSize.toString());

    if (sheetName) {
      params = params.set('sheet_name', sheetName);
    }

    return this.http.get<PaginatedResponse<ErrorLogItem>>(`${this.baseUrl}batch/${batchId}/errors/`, { params });
  }

  /**
   * Retrieves paginated list of historic UploadBatch records.
   */
  getBatches(statusFilter?: string, page: number = 1): Observable<PaginatedResponse<UploadBatchDetail>> {
    let params = new HttpParams().set('page', page.toString());
    if (statusFilter) {
      params = params.set('status', statusFilter);
    }
    return this.http.get<PaginatedResponse<UploadBatchDetail>>(`${this.baseUrl}batches/`, { params });
  }

  /**
   * RxJS Auto-polling stream that polls spreadsheet batch status every 2 seconds.
   */
  pollBatchProgress(batchId: string, pollIntervalMs: number = 2000): Observable<UploadBatchDetail> {
    return timer(0, pollIntervalMs).pipe(
      switchMap(() => this.getBatchStatus(batchId)),
      takeWhile(
        batch => batch.status === 'PENDING' || batch.status === 'PROCESSING',
        true // Include terminal emission (COMPLETED/FAILED)
      )
    );
  }

  // -------------------------------------------------------------
  // RESUME ZIP ARCHIVE & UNMATCHED RESOLUTION METHODS (PHASE 7)
  // -------------------------------------------------------------
  /**
   * Uploads resume .zip archive or multiple individual resume files (.pdf, .docx, .doc).
   */
  uploadResumeZip(
    files: File | File[],
    uploadBatchId?: string,
    force: boolean = false
  ): Observable<any> {
    const formData = new FormData();
    if (Array.isArray(files)) {
      if (files.length === 1) {
        formData.append('file', files[0]);
      } else {
        files.forEach(f => formData.append('files', f));
      }
    } else {
      formData.append('file', files);
    }

    if (uploadBatchId) {
      formData.append('upload_batch_id', uploadBatchId);
    }
    if (force) {
      formData.append('force', 'true');
    }

    return this.http.post(`${this.baseUrl}resume/upload-zip/`, formData);
  }

  /**
   * Retrieves status and counters for a ResumeBatch.
   */
  getResumeBatchDetail(batchId: string): Observable<ResumeBatchDetail> {
    return this.http.get<ResumeBatchDetail>(`${this.baseUrl}resume/batch/${batchId}/`);
  }

  /**
   * Retrieves paginated list of ResumeBatch records.
   */
  getResumeBatches(statusFilter?: string, page: number = 1): Observable<PaginatedResponse<ResumeBatchDetail>> {
    let params = new HttpParams().set('page', page.toString());
    if (statusFilter) {
      params = params.set('status', statusFilter);
    }
    return this.http.get<PaginatedResponse<ResumeBatchDetail>>(`${this.baseUrl}resume/batches/`, { params });
  }

  /**
   * Deletes a tracker UploadBatch and its imported candidate profiles.
   */
  deleteTrackerBatch(batchId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}batch/${batchId}/`);
  }

  /**
   * Deletes a ResumeBatch and its unmatched resumes.
   */
  deleteResumeBatch(batchId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}resume/batch/${batchId}/`);
  }

  /**
   * RxJS Auto-polling stream for ResumeBatch progress.
   */
  pollResumeBatchProgress(batchId: string, pollIntervalMs: number = 2000): Observable<ResumeBatchDetail> {
    return timer(0, pollIntervalMs).pipe(
      switchMap(() => this.getResumeBatchDetail(batchId)),
      takeWhile(
        batch => batch.status === 'PENDING' || batch.status === 'PROCESSING',
        true
      )
    );
  }

  /**
   * Retrieves paginated unresolved resumes.
   */
  getUnmatchedResumes(resumeBatchId?: string, page: number = 1): Observable<PaginatedResponse<UnmatchedResumeItem>> {
    let params = new HttpParams().set('page', page.toString());
    if (resumeBatchId) {
      params = params.set('resume_batch_id', resumeBatchId);
    }
    return this.http.get<PaginatedResponse<UnmatchedResumeItem>>(`${this.baseUrl}resume/unmatched/`, { params });
  }

  /**
   * Manually resolves an unmatched resume by linking to a candidate ID.
   */
  resolveUnmatchedResume(unmatchedId: number, candidateId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}resume/unmatched/${unmatchedId}/resolve/`, { candidate_id: candidateId });
  }

  /**
   * Triggers the stalled batch reconciliation sweeper.
   */
  reconcileBatches(staleMinutes: number = 15): Observable<any> {
    const params = new HttpParams().set('stale_minutes', staleMinutes.toString());
    return this.http.post(`${this.baseUrl}reconcile/`, {}, { params });
  }

  /**
   * Retrieves available candidate export fields and categories.
   */
  getReportFields(): Observable<ReportFieldsResponse> {
    return this.http.get<ReportFieldsResponse>(`${this.baseUrl}report/fields/`);
  }

  /**
   * Generates and downloads custom candidate export report as Blob with full HttpResponse.
   * Allows inspecting HTTP 202 Accepted (approval required) vs 200 OK (immediate binary stream).
   */
  generateReport(request: ReportGenerateRequest): Observable<HttpResponse<Blob>> {
    return this.http.post(`${this.baseUrl}report/generate/`, request, {
      responseType: 'blob',
      observe: 'response'
    });
  }

  // -------------------------------------------------------------
  // REPORT APPROVAL WORKFLOW METHODS
  // -------------------------------------------------------------
  /**
   * Super Admin: Retrieves paginated approval requests with optional status filter.
   */
  getApprovalRequests(statusFilter?: string, page: number = 1): Observable<PaginatedResponse<ReportApprovalRequest>> {
    let params = new HttpParams().set('page', page.toString());
    if (statusFilter) {
      params = params.set('status', statusFilter);
    }
    return this.http.get<PaginatedResponse<ReportApprovalRequest>>(`${this.baseUrl}report/approval-requests/`, { params });
  }

  /**
   * Super Admin: Retrieves count of pending approval requests.
   */
  getPendingApprovalCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.baseUrl}report/approval-requests/pending-count/`);
  }

  /**
   * Super Admin: Approves a report request and generates fresh report.
   */
  approveReportRequest(requestId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}report/approval-requests/${requestId}/approve/`, {});
  }

  /**
   * Super Admin: Rejects a report request.
   */
  rejectReportRequest(requestId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}report/approval-requests/${requestId}/reject/`, {});
  }

  /**
   * Recruiter: Retrieves own report approval requests.
   */
  getMyApprovalRequests(): Observable<ReportApprovalRequest[]> {
    return this.http.get<ReportApprovalRequest[]>(`${this.baseUrl}report/approval-requests/my-requests/`);
  }

  /**
   * Recruiter or Super Admin: Downloads approved report file as Blob.
   */
  downloadApprovedReport(requestId: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}report/approval-requests/${requestId}/download/`, {
      responseType: 'blob'
    });
  }

  /**
   * Retrieves list of active recruiters/admins for sourcer attribution.
   */
  getRecruitersList(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}api/super-admin/list/`);
  }

  // -------------------------------------------------------------
  // REVIEW-BEFORE-IMPORT (PREVIEW) METHODS
  // -------------------------------------------------------------
  /** `sheet` and `header_row` form fields; both endpoints take the same ones so they read the same table. */
  private appendLayout(formData: FormData, layout?: SheetLayoutOptions): void {
    if (layout?.sheet) {
      formData.append('sheet', layout.sheet);
    }
    if (layout?.headerRow) {
      formData.append('header_row', String(layout.headerRow));
    }
  }

  /** Parses the whole sheet on the server and stages it for review. Nothing is saved yet. */
  createPreview(
    file: File, mapping: Record<string, string>, sourcerId?: string, layout?: SheetLayoutOptions
  ): Observable<ImportPreviewSummary> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('mapping', JSON.stringify(mapping || {}));
    if (sourcerId) {
      formData.append('sourcer_id', sourcerId);
    }
    this.appendLayout(formData, layout);
    return this.http.post<ImportPreviewSummary>(`${this.baseUrl}previews/`, formData);
  }

  /** One page (100 rows) of the staged rows, optionally filtered. */
  getPreviewRows(id: string, page: number = 1, filter: PreviewFilter = 'all'): Observable<PreviewRowsResponse> {
    const params = new HttpParams().set('page', page.toString()).set('filter', filter);
    return this.http.get<PreviewRowsResponse>(`${this.baseUrl}previews/${id}/rows/`, { params });
  }

  /**
   * Edits cells and/or accepts a suggested email fix for one row. An empty accepted_fixes.email withdraws the fix.
   * When the response's changed_rows is non-empty, other rows changed too, so the page should be re-fetched.
   */
  updatePreviewRow(
    id: string,
    rowNumber: number,
    edits?: Record<string, any>,
    acceptedFixes?: Record<string, string>
  ): Observable<PreviewRowUpdateResponse> {
    const body: { edits?: Record<string, any>; accepted_fixes?: Record<string, string> } = {};
    if (edits) { body.edits = edits; }
    if (acceptedFixes) { body.accepted_fixes = acceptedFixes; }
    return this.http.patch<PreviewRowUpdateResponse>(`${this.baseUrl}previews/${id}/rows/${rowNumber}/`, body);
  }

  /** Accepts every suggested fix of the given confidences ('auto', 'likely'). */
  acceptFixes(id: string, confidences: string[]): Observable<PreviewAcceptFixesResponse> {
    return this.http.post<PreviewAcceptFixesResponse>(`${this.baseUrl}previews/${id}/accept-fixes/`, { confidence: confidences });
  }

  /** Runs the import on the staged, corrected rows. Returns the job to monitor. 409 if already running. */
  executePreview(id: string): Observable<PreviewExecuteResponse> {
    return this.http.post<PreviewExecuteResponse>(`${this.baseUrl}previews/${id}/execute/`, {});
  }

  /**
   * Problem rows as CSV. These endpoints need the auth header, so this is a blob request, not a plain link.
   * `source` says whether `id` is a preview id (before Import) or a job id (after Import).
   */
  downloadProblems(id: string, source: 'preview' | 'job' = 'preview'): Observable<Blob> {
    const path = source === 'job' ? `jobs/${id}/problems.csv` : `previews/${id}/problems.csv`;
    return this.http.get(`${this.baseUrl}${path}`, { responseType: 'blob' });
  }

  /** Starter spreadsheet template (.xlsx) as a blob. */
  downloadTemplate(): Observable<Blob> {
    return this.http.get(`${this.baseUrl}template.xlsx`, { responseType: 'blob' });
  }
}


