import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { HttpResponse } from '@angular/common/http';
import { RecruiterSidebarComponent } from '../../components/recruiter-sidebar/recruiter-sidebar.component';
import { AlertMessageComponent } from '../../components/alert-message/alert-message.component';
import {
  RecruiterWorkflowBulkImportService,
  UploadBatchDetail,
  ResumeBatchDetail,
  UnmatchedResumeItem,
  ErrorLogItem,
  HeaderPreviewResponse,
  HeaderResolutionItem,
  CanonicalFieldMeta,
  ExportableField,
  ReportFieldsResponse,
  ReportGenerateRequest,
  ReportApprovalRequest
} from '../../services/recruiter-workflow-bulk-import.service';
import { ApprovalNotificationService } from '../../services/approval-notification.service';
import {
  RecruiterWorkflowCandidateService,
  Candidate
} from '../../services/recruiter-workflow-candidate.service';

import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { NotificationBellComponent } from '../../components/notification-bell/notification-bell.component';

@Component({
  standalone: true,
  selector: 'app-bulk-import',
  templateUrl: './recruiter-workflow-bulk-import.component.html',
  styleUrls: ['./recruiter-workflow-bulk-import.component.css'],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    RecruiterSidebarComponent,
    AlertMessageComponent,
    NotificationBellComponent
  ]
})
export class RecruiterWorkflowBulkImportComponent implements OnInit, OnDestroy {
  // Navigation / Tabs
  activeTab: 'history' | 'upload' | 'live' | 'unmatched' | 'reports' | 'approvals' = 'history';
  historySubTab: 'trackers' | 'resumes' = 'trackers';


  // Loading States
  isLoading: boolean = false;
  isUploadingTracker: boolean = false;
  isUploadingResumes: boolean = false;
  isPreviewingHeaders: boolean = false;
  isProcessing: boolean = false;
  isReconciling: boolean = false;
  isLoadingHistory: boolean = false;
  isLoadingErrors: boolean = false;
  isLoadingUnmatched: boolean = false;
  isResolving: boolean = false;

  // Dual-Dropzone Files
  selectedTrackerFile: File | null = null;
  selectedResumeFiles: File[] = [];
  trackerUploadErrorMsg: string | null = null;
  resumeUploadErrorMsg: string | null = null;
  duplicateTrackerConflict: any = null;
  duplicateResumeConflict: any = null;

  get hasResumeFiles(): boolean {
    return this.selectedResumeFiles.length > 0;
  }

  get totalResumeFilesSize(): number {
    return this.selectedResumeFiles.reduce((acc, f) => acc + f.size, 0);
  }

  get isSingleZip(): boolean {
    return this.selectedResumeFiles.length === 1 && this.selectedResumeFiles[0].name.toLowerCase().endsWith('.zip');
  }

  get resumeFilesSummary(): string {
    if (this.selectedResumeFiles.length === 0) return '';
    if (this.isSingleZip) {
      return this.selectedResumeFiles[0].name;
    }
    if (this.selectedResumeFiles.length === 1) {
      return this.selectedResumeFiles[0].name;
    }
    return `${this.selectedResumeFiles[0].name} and ${this.selectedResumeFiles.length - 1} more file(s)`;
  }

  // Header Mapping Preview State
  showMappingModal: boolean = false;
  previewData: HeaderPreviewResponse | null = null;
  userCustomMapping: Record<string, string> = {};
  canonicalFieldsList: CanonicalFieldMeta[] = [];
  previewReportItems: HeaderResolutionItem[] = [];
  missingRequiredFields: string[] = [];

  // Batch History State
  recentTrackerBatches: UploadBatchDetail[] = [];
  recentResumeBatches: ResumeBatchDetail[] = [];
  searchQuery: string = '';
  statusFilter: string = '';
  historyPage: number = 1;
  historyPageSize: number = 20;
  historyTotalCount: number = 0;
  resumeHistoryTotalCount: number = 0;

  // Live Batch Execution State
  currentTrackerBatch: UploadBatchDetail | null = null;
  currentResumeBatch: ResumeBatchDetail | null = null;
  activeLiveType: 'tracker' | 'resume' = 'tracker';
  private pollingSub: Subscription | null = null;
  private resumePollingSub: Subscription | null = null;

  // Error Logs State
  errorLogs: ErrorLogItem[] = [];
  errorPage: number = 1;
  errorPageSize: number = 20;
  errorTotalCount: number = 0;
  selectedSheetFilter: string = '';

  // Unmatched Resumes Resolver State
  unmatchedResumes: UnmatchedResumeItem[] = [];
  unmatchedPage: number = 1;
  unmatchedPageSize: number = 20;
  unmatchedTotalCount: number = 0;
  selectedUnmatchedBatchFilter: string = '';

  // Manual Resolution Modal & Candidate Lookup State
  showResolveModal: boolean = false;
  activeResolvingResume: UnmatchedResumeItem | null = null;
  candidateSearchTerm: string = '';
  allCandidates: Candidate[] = [];
  filteredCandidates: Candidate[] = [];
  selectedCandidateForResolve: Candidate | null = null;
  isLoadingCandidates: boolean = false;

  // Raw Data Modal
  showRawDataModal: boolean = false;
  selectedRawDataSnippet: any = null;

  // Dynamic Report Generator State
  reportDatePreset: 'last_7_days' | 'last_30_days' | 'this_month' | 'last_month' | 'last_3_months' | 'last_6_months' | 'custom' = 'last_7_days';
  reportDateFrom: string = '';
  reportDateTo: string = '';
  reportFormat: 'xlsx' | 'csv' = 'xlsx';
  reportBatchFilter: string = '';
  reportSourceFilter: string = '';
  availableReportFields: ExportableField[] = [];
  reportCategories: string[] = [];
  selectedReportFields: string[] = [];
  isGeneratingReport: boolean = false;
  isLoadingReportFields: boolean = false;
  reportSuccessMsg: string | null = null;
  reportErrorMsg: string | null = null;

  // Alert State
  showAlert: boolean = false;
  alertMessage: string = '';
  alertButtons: string[] = ['OK'];

  // Report Approval Workflow State
  approvalRequests: ReportApprovalRequest[] = [];
  myApprovalRequests: ReportApprovalRequest[] = [];
  pendingApprovalCount: number = 0;
  isLoadingApprovals: boolean = false;
  isLoadingMyRequests: boolean = false;
  isActingOnApproval: boolean = false;
  approvalStatusFilter: string = '';
  approvalPage: number = 1;
  approvalTotalCount: number = 0;
  showApprovalPendingModal: boolean = false;
  lastApprovalCandidateCount: number = 0;
  lastApprovalThreshold: number = 50;
  private approvalNotificationSub: Subscription | null = null;
  private pendingCountSub: Subscription | null = null;

  // User Authentication & RBAC State
  currentUserId: string | null = null;
  currentUserType: string = 'recruiter';
  isSuperAdmin: boolean = false;

  get isRecruiterRole(): boolean {
    return this.currentUserType === 'recruiter' && !this.isSuperAdmin;
  }

  get todayDateStr(): string {
    return this.formatDateToYMD(new Date());
  }

  get minRecruiterDate(): string {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return this.formatDateToYMD(d);
  }

  get myPendingApprovalCount(): number {
    return this.myApprovalRequests.filter(r => r.status === 'PENDING').length;
  }

  get myApprovedReportCount(): number {
    return this.myApprovalRequests.filter(r => r.status === 'APPROVED').length;
  }

  get filteredMyApprovalRequests(): ReportApprovalRequest[] {
    if (!this.approvalStatusFilter) {
      return this.myApprovalRequests;
    }
    return this.myApprovalRequests.filter(r => r.status === this.approvalStatusFilter);
  }

  constructor(
    private bulkImportService: RecruiterWorkflowBulkImportService,
    private candidateService: RecruiterWorkflowCandidateService,
    private approvalNotificationService: ApprovalNotificationService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.initCurrentUser();
    this.loadBatchHistory();
    this.loadResumeBatches();
    this.loadUnmatchedResumes();
    this.preloadCandidates();
    this.applyDatePreset(this.isRecruiterRole ? 'last_7_days' : 'last_30_days');

    // Handle deep-linked query parameters (e.g. ?tab=approvals)
    this.route.queryParams.subscribe(params => {
      if (params && params['tab']) {
        const tab = params['tab'];
        if (['history', 'upload', 'live', 'unmatched', 'reports', 'approvals'].includes(tab)) {
          this.setTab(tab as any);
        }
      }
    });

    // Real-time Approval Notifications
    if (this.isSuperAdmin) {
      this.loadPendingCount();
      this.approvalNotificationService.startListeningForSuperAdmin();
      this.pendingCountSub = this.approvalNotificationService.pendingCount.subscribe(count => {
        this.pendingApprovalCount = count;
      });
      this.approvalNotificationSub = this.approvalNotificationService.notificationEvents.subscribe(ev => {
        if (ev.type === 'NEW_REQUEST') {
          this.loadPendingCount();
          if (this.activeTab === 'approvals') {
            this.loadApprovalRequests(this.approvalPage);
          }
        }
      });
    } else if (this.isRecruiterRole) {
      this.loadMyApprovalRequests();
      if (this.currentUserId) {
        this.approvalNotificationService.startListeningForRecruiter(this.currentUserId);
        this.approvalNotificationSub = this.approvalNotificationService.notificationEvents.subscribe(ev => {
          if (ev.type === 'STATUS_CHANGE') {
            this.loadMyApprovalRequests();
          }
        });
      }
    }
  }

  initCurrentUser(): void {
    this.currentUserId = localStorage.getItem('user_id') || localStorage.getItem('userId');
    this.currentUserType = (
      localStorage.getItem('userType') ||
      localStorage.getItem('user_type') ||
      localStorage.getItem('user_role') ||
      'recruiter'
    ).toLowerCase();
    this.isSuperAdmin = localStorage.getItem('isSuperUser') === 'true' || this.currentUserType === 'admin';

    // Fallback: Check decoded JWT token if fields missing in localStorage
    if (!this.currentUserId || !this.currentUserType) {
      const token = localStorage.getItem('jwtToken') || localStorage.getItem('token') || localStorage.getItem('auth_token');
      if (token) {
        try {
          const parts = token.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1]));
            if (!this.currentUserId && (payload.user_id || payload.userId || payload.sub)) {
              this.currentUserId = String(payload.user_id || payload.userId || payload.sub);
            }
            if (payload.user_type || payload.role) {
              this.currentUserType = String(payload.user_type || payload.role).toLowerCase();
            }
            if (payload.is_superuser !== undefined) {
              this.isSuperAdmin = payload.is_superuser === true || this.currentUserType === 'admin';
            }
          }
        } catch (e) {
          console.warn('Could not decode auth token for RBAC:', e);
        }
      }
    }
  }

  canDeleteBatch(batch: UploadBatchDetail | ResumeBatchDetail | null | undefined): boolean {
    if (!batch) return false;
    // Admins and Super Admins have universal deletion rights across all uploads
    if (this.currentUserType === 'admin' || this.isSuperAdmin) {
      return true;
    }
    // Recruiters can only delete batches they uploaded themselves
    if (this.currentUserType === 'recruiter') {
      const batchOwnerId = (batch as any).uploaded_by_id;
      return !!this.currentUserId && !!batchOwnerId && String(batchOwnerId) === String(this.currentUserId);
    }
    return false;
  }

  ngOnDestroy(): void {
    this.stopPolling();
    this.stopResumePolling();
    if (this.approvalNotificationSub) {
      this.approvalNotificationSub.unsubscribe();
      this.approvalNotificationSub = null;
    }
    if (this.pendingCountSub) {
      this.pendingCountSub.unsubscribe();
      this.pendingCountSub = null;
    }
  }

  // ==========================================
  // TAB NAVIGATION
  // ==========================================
  setTab(tab: 'history' | 'upload' | 'live' | 'unmatched' | 'reports' | 'approvals'): void {
    this.activeTab = tab;
    if (tab === 'history') {
      this.loadBatchHistory();
      this.loadResumeBatches();
    } else if (tab === 'unmatched') {
      this.loadUnmatchedResumes();
    } else if (tab === 'reports') {
      if (this.availableReportFields.length === 0) {
        this.loadReportFields();
      }
      if (!this.reportDateFrom && !this.reportDateTo) {
        this.applyDatePreset(this.isRecruiterRole ? 'last_7_days' : 'last_30_days');
      }
    } else if (tab === 'approvals') {
      if (this.isSuperAdmin) {
        this.loadApprovalRequests(1);
      } else {
        this.loadMyApprovalRequests();
      }
    }
  }


  setHistorySubTab(subTab: 'trackers' | 'resumes'): void {
    this.historySubTab = subTab;
  }

  // ==========================================
  // STATS GETTERS
  // ==========================================
  get totalBatchesCount(): number {
    return (this.historyTotalCount || this.recentTrackerBatches.length) +
           (this.resumeHistoryTotalCount || this.recentResumeBatches.length);
  }

  get totalImportedCandidates(): number {
    return this.recentTrackerBatches.reduce((acc, b) => acc + (b.success_rows || 0), 0);
  }

  get totalMatchedResumes(): number {
    return this.recentResumeBatches.reduce((acc, b) => acc + (b.matched_files || 0), 0);
  }

  get totalUnmatchedResumesCount(): number {
    return this.unmatchedTotalCount;
  }

  get activeProcessingCount(): number {
    const activeTrackers = this.recentTrackerBatches.filter(
      b => b.status === 'PROCESSING' || b.status === 'PENDING'
    ).length;
    const activeResumes = this.recentResumeBatches.filter(
      b => b.status === 'PROCESSING' || b.status === 'PENDING'
    ).length;
    return activeTrackers + activeResumes;
  }

  getDisplayFileName(filename: string | null | undefined): string {
    if (!filename) return 'Unnamed File';
    const baseName = filename.split('/').pop()?.split('\\').pop() || filename;
    const clean = baseName
      .replace(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}_?/, '')
      .replace(/^[0-9a-fA-F]{32}_?/, '');
    return clean || baseName;
  }

  get filteredTrackerBatches(): UploadBatchDetail[] {
    return this.recentTrackerBatches.filter(b => {
      const displayName = this.getDisplayFileName(b.file_name).toLowerCase();
      const rawName = (b.file_name || '').toLowerCase();
      const query = this.searchQuery.toLowerCase().trim();
      const matchSearch =
        !query ||
        displayName.includes(query) ||
        rawName.includes(query) ||
        b.id.toLowerCase().includes(query);
      const matchStatus =
        !this.statusFilter ||
        b.status.toLowerCase() === this.statusFilter.toLowerCase();
      return matchSearch && matchStatus;
    });
  }

  get filteredResumeBatches(): ResumeBatchDetail[] {
    return this.recentResumeBatches.filter(b => {
      const displayName = this.getDisplayFileName(b.zip_file_name).toLowerCase();
      const rawName = (b.zip_file_name || '').toLowerCase();
      const query = this.searchQuery.toLowerCase().trim();
      const matchSearch =
        !query ||
        displayName.includes(query) ||
        rawName.includes(query) ||
        b.id.toLowerCase().includes(query);
      const matchStatus =
        !this.statusFilter ||
        b.status.toLowerCase() === this.statusFilter.toLowerCase();
      return matchSearch && matchStatus;
    });
  }

  // ==========================================
  // DUAL DROPZONE FILE SELECTION
  // ==========================================
  onTrackerFileSelected(event: any): void {
    const file = event.target.files?.[0];
    if (file) {
      this.selectedTrackerFile = file;
      this.trackerUploadErrorMsg = null;
      this.duplicateTrackerConflict = null;
    }
  }

  onTrackerDrop(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer?.files?.length) {
      this.selectedTrackerFile = event.dataTransfer.files[0];
      this.trackerUploadErrorMsg = null;
      this.duplicateTrackerConflict = null;
    }
  }

  removeTrackerFile(): void {
    this.selectedTrackerFile = null;
    this.trackerUploadErrorMsg = null;
    this.duplicateTrackerConflict = null;
  }

  onZipFileSelected(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.selectedResumeFiles = Array.from(files);
      this.resumeUploadErrorMsg = null;
      this.duplicateResumeConflict = null;
    }
  }

  onZipDrop(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer?.files?.length) {
      this.selectedResumeFiles = Array.from(event.dataTransfer.files);
      this.resumeUploadErrorMsg = null;
      this.duplicateResumeConflict = null;
    }
  }

  removeZipFile(): void {
    this.selectedResumeFiles = [];
    this.resumeUploadErrorMsg = null;
    this.duplicateResumeConflict = null;
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  // ==========================================
  // INGESTION TRIGGER (SINGLE & DUAL)
  // ==========================================
  startCombinedIngestion(): void {
    if (!this.selectedTrackerFile && this.selectedResumeFiles.length === 0) {
      this.trackerUploadErrorMsg = 'Please select at least one file (Tracker or Resumes) to import.';
      return;
    }

    // If tracker spreadsheet is selected -> First run 3-Tier Dynamic Header Preview
    if (this.selectedTrackerFile) {
      this.isPreviewingHeaders = true;
      this.trackerUploadErrorMsg = null;

      this.bulkImportService
        .previewHeaders(this.selectedTrackerFile)
        .pipe(finalize(() => { this.isPreviewingHeaders = false; }))
        .subscribe({
          next: (res: HeaderPreviewResponse) => {
            this.previewData = res;
            this.canonicalFieldsList = res.canonical_fields || [];
            this.previewReportItems = res.resolution_report || [];
            this.missingRequiredFields = res.missing_required || [];
            this.userCustomMapping = { ...res.mapping };

            if (res.needs_review) {
              // Open Column Mapping Preview Modal for user confirmation
              this.showMappingModal = true;
            } else {
              // High confidence resolution & all required present -> Auto-proceed seamlessly!
              this.executeIngestionWithMapping(this.userCustomMapping);
            }
          },
          error: (err: any) => {
            this.trackerUploadErrorMsg = err.error?.error || 'Failed to inspect tracker headers.';
          }
        });
    }
    // Only Resume Files / Archive selected
    else if (this.selectedResumeFiles.length > 0) {
      this.uploadResumeZipArchive();
    }
  }

  executeIngestionWithMapping(mapping?: Record<string, string>): void {
    if (!this.selectedTrackerFile) return;

    this.isUploadingTracker = true;
    this.trackerUploadErrorMsg = null;

    // Scenario A: Both Tracker and Resumes selected
    if (this.selectedTrackerFile && this.selectedResumeFiles.length > 0) {
      this.bulkImportService
        .uploadCandidateFile(this.selectedTrackerFile, false, mapping)
        .subscribe({
          next: (res: any) => {
            this.isUploadingTracker = false;
            const uploadBatchId = res.batch?.id;
            this.currentTrackerBatch = res.batch;
            this.selectedTrackerFile = null;

            // Now upload Resume Files linked with uploadBatchId
            this.uploadResumeZipArchive(uploadBatchId);
          },
          error: (err: any) => {
            this.isUploadingTracker = false;
            this.trackerUploadErrorMsg = err.error?.error || 'Tracker upload failed.';
          }
        });
    }
    // Scenario B: Only Tracker Spreadsheet selected
    else {
      this.bulkImportService
        .uploadCandidateFile(this.selectedTrackerFile, false, mapping)
        .pipe(finalize(() => { this.isUploadingTracker = false; }))
        .subscribe({
          next: (res: any) => {
            if (res.batch?.id) {
              this.selectedTrackerFile = null;
              this.currentTrackerBatch = res.batch;
              this.activeLiveType = 'tracker';
              this.activeTab = 'live';
              this.trackBatchProgress(res.batch.id);
            }
          },
          error: (err: any) => {
            this.trackerUploadErrorMsg = err.error?.error || 'Tracker upload failed.';
          }
        });
    }
  }

  onColumnMappingChange(colIndex: number, newCanonical: string): void {
    this.userCustomMapping[colIndex.toString()] = newCanonical;

    // Update the resolution report item tier to manual override
    const reportItem = this.previewReportItems.find(r => r.column_index === colIndex);
    if (reportItem) {
      reportItem.canonical = newCanonical;
      reportItem.tier = 0;
      reportItem.tier_name = 'Manual Override';
      reportItem.confidence = 100.0;
    }

    // Recheck required fields
    const mappedValues = new Set(Object.values(this.userCustomMapping));
    this.missingRequiredFields = [];
    if (!mappedValues.has('email')) {
      this.missingRequiredFields.push('Email Address');
    }
    if (!mappedValues.has('phone')) {
      this.missingRequiredFields.push('Phone Number');
    }
  }

  confirmCustomMappingAndUpload(): void {
    if (this.missingRequiredFields.length > 0) {
      this.alertMessage = `Please map all required columns before importing. Missing: ${this.missingRequiredFields.join(', ')}`;
      this.showAlert = true;
      return;
    }
    this.showMappingModal = false;
    this.executeIngestionWithMapping(this.userCustomMapping);
  }

  closeMappingModal(): void {
    this.showMappingModal = false;
  }

  getTierBadgeClass(tier: number): string {
    switch (tier) {
      case 0: return 'tier-manual';
      case 1: return 'tier-exact';
      case 2: return 'tier-fuzzy';
      case 3: return 'tier-ai';
      default: return 'tier-unmapped';
    }
  }

  getTierBadgeLabel(tier: number): string {
    switch (tier) {
      case 0: return 'Manual';
      case 1: return 'Exact';
      case 2: return 'Fuzzy';
      case 3: return 'AI Inferred';
      default: return 'Unmapped';
    }
  }

  uploadResumeZipArchive(uploadBatchId?: string): void {
    if (this.selectedResumeFiles.length === 0) return;

    this.isUploadingResumes = true;
    this.resumeUploadErrorMsg = null;

    this.bulkImportService
      .uploadResumeZip(this.selectedResumeFiles, uploadBatchId)
      .pipe(finalize(() => { this.isUploadingResumes = false; }))
      .subscribe({
        next: (res: any) => {
          this.selectedResumeFiles = [];
          if (res.resume_batch?.id) {
            this.currentResumeBatch = res.resume_batch;
            this.activeLiveType = 'resume';
            this.activeTab = 'live';
            this.trackResumeBatchProgress(res.resume_batch.id);
          }
        },
        error: (err: any) => {
          this.resumeUploadErrorMsg = err.error?.error || 'Resume upload failed.';
        }
      });
  }

  // ==========================================
  // BATCH MONITORING & POLLING
  // ==========================================
  trackBatchProgress(batchId: string): void {
    this.isProcessing = true;
    this.stopPolling();

    this.pollingSub = this.bulkImportService
      .pollBatchProgress(batchId, 2000)
      .subscribe({
        next: (batch: UploadBatchDetail) => {
          this.currentTrackerBatch = batch;
          if (
            batch.status === 'COMPLETED' ||
            batch.status === 'COMPLETED_WITH_ERRORS' ||
            batch.status === 'FAILED'
          ) {
            this.isProcessing = false;
            this.loadBatchHistory();
            if (batch.failed_rows > 0) {
              this.loadErrorLogs(1);
            }
          }
        },
        error: (err) => {
          console.error('Polling Error:', err);
          this.isProcessing = false;
        }
      });
  }

  trackResumeBatchProgress(batchId: string): void {
    this.isProcessing = true;
    this.stopResumePolling();

    this.resumePollingSub = this.bulkImportService
      .pollResumeBatchProgress(batchId, 2000)
      .subscribe({
        next: (batch: ResumeBatchDetail) => {
          this.currentResumeBatch = batch;
          if (
            batch.status === 'COMPLETED' ||
            batch.status === 'COMPLETED_WITH_ERRORS' ||
            batch.status === 'FAILED'
          ) {
            this.isProcessing = false;
            this.loadResumeBatches();
            this.loadUnmatchedResumes();
          }
        },
        error: (err) => {
          console.error('Resume Polling Error:', err);
          this.isProcessing = false;
        }
      });
  }

  stopPolling(): void {
    if (this.pollingSub) {
      this.pollingSub.unsubscribe();
      this.pollingSub = null;
    }
  }

  stopResumePolling(): void {
    if (this.resumePollingSub) {
      this.resumePollingSub.unsubscribe();
      this.resumePollingSub = null;
    }
  }

  selectHistoryBatch(batch: UploadBatchDetail): void {
    this.currentTrackerBatch = batch;
    this.activeLiveType = 'tracker';
    this.activeTab = 'live';
    if (batch.status === 'PROCESSING' || batch.status === 'PENDING') {
      this.trackBatchProgress(batch.id);
    } else if (batch.failed_rows > 0) {
      this.loadErrorLogs(1);
    } else {
      this.errorLogs = [];
    }
  }

  selectResumeHistoryBatch(batch: ResumeBatchDetail): void {
    this.currentResumeBatch = batch;
    this.activeLiveType = 'resume';
    this.activeTab = 'live';
    if (batch.status === 'PROCESSING' || batch.status === 'PENDING') {
      this.trackResumeBatchProgress(batch.id);
    }
  }

  deleteTrackerBatchItem(batch: UploadBatchDetail, event: Event): void {
    event.stopPropagation();
    const displayName = this.getDisplayFileName(batch.file_name);
    if (!confirm(`Are you sure you want to delete tracker batch "${displayName}" and its imported candidates?`)) {
      return;
    }
    this.bulkImportService.deleteTrackerBatch(batch.id).subscribe({
      next: () => {
        this.loadBatchHistory();
      },
      error: (err) => {
        console.error('Failed to delete tracker batch:', err);
      }
    });
  }

  deleteResumeBatchItem(batch: ResumeBatchDetail, event: Event): void {
    event.stopPropagation();
    const displayName = this.getDisplayFileName(batch.zip_file_name);
    if (!confirm(`Are you sure you want to delete resume batch "${displayName}"?`)) {
      return;
    }
    this.bulkImportService.deleteResumeBatch(batch.id).subscribe({
      next: () => {
        this.loadResumeBatches();
        this.loadUnmatchedResumes();
      },
      error: (err) => {
        console.error('Failed to delete resume batch:', err);
      }
    });
  }

  // ==========================================
  // UNMATCHED RESUME RESOLVER (PHASE 7)
  // ==========================================
  loadUnmatchedResumes(page: number = 1): void {
    this.isLoadingUnmatched = true;
    this.unmatchedPage = page;

    this.bulkImportService
      .getUnmatchedResumes(this.selectedUnmatchedBatchFilter || undefined, this.unmatchedPage)
      .pipe(finalize(() => { this.isLoadingUnmatched = false; }))
      .subscribe({
        next: (res) => {
          this.unmatchedResumes = res.results;
          this.unmatchedTotalCount = res.count;
        },
        error: (err) => {
          console.error('Failed to load unmatched resumes:', err);
        }
      });
  }

  preloadCandidates(): void {
    this.isLoadingCandidates = true;
    this.candidateService
      .getCandidates(1, false)
      .pipe(finalize(() => { this.isLoadingCandidates = false; }))
      .subscribe({
        next: (res: any) => {
          this.allCandidates = Array.isArray(res) ? res : (res.results || []);
          this.filteredCandidates = [...this.allCandidates];
        },
        error: (err) => {
          console.error('Failed to preload candidates:', err);
        }
      });
  }

  openResolveModal(resume: UnmatchedResumeItem): void {
    this.activeResolvingResume = resume;
    this.selectedCandidateForResolve = null;
    this.candidateSearchTerm = resume.ai_parsed_data?.first_name || '';
    this.filterCandidates();
    this.showResolveModal = true;
  }

  closeResolveModal(): void {
    this.showResolveModal = false;
    this.activeResolvingResume = null;
    this.selectedCandidateForResolve = null;
    this.candidateSearchTerm = '';
  }

  filterCandidates(): void {
    if (!this.candidateSearchTerm.trim()) {
      this.filteredCandidates = this.allCandidates.slice(0, 50);
      return;
    }
    const q = this.candidateSearchTerm.toLowerCase().trim();
    this.filteredCandidates = this.allCandidates
      .filter(c => {
        const full = `${c.first_name || ''} ${c.last_name || ''}`.toLowerCase();
        const email = (c.email || '').toLowerCase();
        const phone = (c.phone_number || '');
        return full.includes(q) || email.includes(q) || phone.includes(q);
      })
      .slice(0, 50);
  }

  selectCandidateForResolve(candidate: Candidate): void {
    this.selectedCandidateForResolve = candidate;
  }

  confirmResolveUnmatched(): void {
    if (!this.activeResolvingResume || !this.selectedCandidateForResolve?.id) return;

    this.isResolving = true;
    this.bulkImportService
      .resolveUnmatchedResume(
        this.activeResolvingResume.id,
        this.selectedCandidateForResolve.id
      )
      .pipe(finalize(() => { this.isResolving = false; }))
      .subscribe({
        next: (res: any) => {
          this.alertMessage = `Resume '${this.activeResolvingResume?.original_filename}' successfully attached to ${this.selectedCandidateForResolve?.first_name} ${this.selectedCandidateForResolve?.last_name || ''}. Vector embeddings enqueued.`;
          this.showAlert = true;
          this.closeResolveModal();
          this.loadUnmatchedResumes();
          this.loadResumeBatches();
        },
        error: (err: any) => {
          this.alertMessage = `Failed to resolve resume: ${err.error?.error || 'Server error'}`;
          this.showAlert = true;
        }
      });
  }

  // ==========================================
  // ERROR LOGS
  // ==========================================
  loadErrorLogs(page: number = 1): void {
    if (!this.currentTrackerBatch) return;

    this.isLoadingErrors = true;
    this.errorPage = page;

    this.bulkImportService
      .getBatchErrors(
        this.currentTrackerBatch.id,
        this.errorPage,
        this.errorPageSize,
        this.selectedSheetFilter || undefined
      )
      .pipe(finalize(() => { this.isLoadingErrors = false; }))
      .subscribe({
        next: (res) => {
          this.errorLogs = res.results;
          this.errorTotalCount = res.count;
        },
        error: (err) => {
          console.error('Failed to load error logs:', err);
        }
      });
  }

  onSheetFilterChange(): void {
    this.loadErrorLogs(1);
  }

  get totalErrorPages(): number {
    return Math.ceil(this.errorTotalCount / this.errorPageSize) || 1;
  }

  // ==========================================
  // BATCH HISTORY
  // ==========================================
  loadBatchHistory(): void {
    this.isLoadingHistory = true;
    this.bulkImportService
      .getBatches(this.statusFilter || undefined, this.historyPage)
      .pipe(finalize(() => { this.isLoadingHistory = false; }))
      .subscribe({
        next: (res) => {
          this.recentTrackerBatches = res.results;
          this.historyTotalCount = res.count;
        },
        error: (err) => {
          console.error('Failed to load tracker batch history:', err);
        }
      });
  }

  loadResumeBatches(): void {
    this.bulkImportService
      .getResumeBatches(this.statusFilter || undefined, this.historyPage)
      .subscribe({
        next: (res) => {
          this.recentResumeBatches = res.results;
          this.resumeHistoryTotalCount = res.count;
        },
        error: (err) => {
          console.error('Failed to load resume batch history:', err);
        }
      });
  }

  // ==========================================
  // SWEEPER RECONCILIATION
  // ==========================================
  reconcileBatches(): void {
    this.isReconciling = true;
    this.bulkImportService
      .reconcileBatches(15)
      .pipe(finalize(() => { this.isReconciling = false; }))
      .subscribe({
        next: (res) => {
          this.alertMessage = `Reconciliation completed: ${res.stats?.stalled_found || 0} stalled batch(es) checked (${res.stats?.reenqueued || 0} re-enqueued).`;
          this.showAlert = true;
          this.loadBatchHistory();
          this.loadResumeBatches();
          this.loadUnmatchedResumes();
        },
        error: (err) => {
          this.alertMessage = `Sweeper reconciliation failed: ${err.error?.error || 'Server error'}`;
          this.showAlert = true;
        }
      });
  }

  closeAlert(): void {
    this.showAlert = false;
  }

  onAlertButtonClick(btn: string): void {
    this.closeAlert();
  }

  // ==========================================
  // RAW DATA MODAL
  // ==========================================
  openRawDataModal(rawData: any): void {
    this.selectedRawDataSnippet = rawData;
    this.showRawDataModal = true;
  }

  closeRawDataModal(): void {
    this.showRawDataModal = false;
    this.selectedRawDataSnippet = null;
  }

  formatRawDataSnippet(rawData: any): string {
    if (!rawData) return '—';
    if (typeof rawData === 'string') return rawData;
    try {
      return JSON.stringify(rawData);
    } catch {
      return String(rawData);
    }
  }

  formatRawDataFormatted(rawData: any): string {
    if (!rawData) return 'No data captured.';
    try {
      return JSON.stringify(rawData, null, 2);
    } catch {
      return String(rawData);
    }
  }

  // ==========================================
  // UTILITIES & NAVIGATION
  // ==========================================
  navigateToCandidates(): void {
    this.router.navigate(['/recruiter-workflow-candidate']);
  }

  getFileExtension(filename: string): string {
    if (!filename) return 'FILE';
    const cleanName = this.getDisplayFileName(filename);
    const parts = cleanName.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : 'FILE';
  }

  formatFileSize(bytes: number): string {
    if (!bytes) return '0 KB';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  getProgressPercentage(batch: UploadBatchDetail | null): number {
    if (!batch) return 0;
    if (batch.progress_percentage !== undefined && batch.progress_percentage !== null) {
      return batch.progress_percentage;
    }
    if (batch.total_rows <= 0) {
      return batch.status === 'COMPLETED' || batch.status === 'COMPLETED_WITH_ERRORS' ? 100 : 0;
    }
    const processed = (batch.success_rows || 0) + (batch.failed_rows || 0);
    return Math.min(100, Math.round((processed / batch.total_rows) * 100));
  }

  getResumeProgressPercentage(batch: ResumeBatchDetail | null): number {
    if (!batch) return 0;
    if (batch.progress_percentage !== undefined && batch.progress_percentage !== null) {
      return batch.progress_percentage;
    }
    if (batch.total_files <= 0) {
      return batch.status === 'COMPLETED' || batch.status === 'COMPLETED_WITH_ERRORS' ? 100 : 0;
    }
    const processed = (batch.matched_files || 0) + (batch.unmatched_files || 0) + (batch.failed_files || 0);
    return Math.min(100, Math.round((processed / batch.total_files) * 100));
  }

  // ==========================================
  // DYNAMIC REPORT GENERATION (PHASE 4)
  // ==========================================
  loadReportFields(): void {
    this.isLoadingReportFields = true;
    this.bulkImportService
      .getReportFields()
      .pipe(finalize(() => { this.isLoadingReportFields = false; }))
      .subscribe({
        next: (res: ReportFieldsResponse) => {
          this.availableReportFields = res.fields || [];
          this.reportCategories = res.categories || [];
          if (this.selectedReportFields.length === 0) {
            this.selectedReportFields = [...(res.default_selection || [])];
          }
        },
        error: (err) => {
          console.error('Failed to load report fields:', err);
          this.reportErrorMsg = 'Failed to load report columns definition.';
        }
      });
  }

  applyDatePreset(preset: string): void {
    if (this.isRecruiterRole && preset !== 'last_7_days' && preset !== 'custom') {
      preset = 'last_7_days';
    }
    this.reportDatePreset = preset as any;
    const now = new Date();
    const todayStr = this.formatDateToYMD(now);

    if (preset === 'last_7_days') {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      this.reportDateFrom = this.formatDateToYMD(d);
      this.reportDateTo = todayStr;
    } else if (preset === 'last_30_days') {
      const d = new Date(now);
      d.setDate(d.getDate() - 30);
      this.reportDateFrom = this.formatDateToYMD(d);
      this.reportDateTo = todayStr;
    } else if (preset === 'this_month') {
      const d = new Date(now.getFullYear(), now.getMonth(), 1);
      this.reportDateFrom = this.formatDateToYMD(d);
      this.reportDateTo = todayStr;
    } else if (preset === 'last_month') {
      const dStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const dEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      this.reportDateFrom = this.formatDateToYMD(dStart);
      this.reportDateTo = this.formatDateToYMD(dEnd);
    } else if (preset === 'last_3_months') {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 3);
      this.reportDateFrom = this.formatDateToYMD(d);
      this.reportDateTo = todayStr;
    } else if (preset === 'last_6_months') {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 6);
      this.reportDateFrom = this.formatDateToYMD(d);
      this.reportDateTo = todayStr;
    } else if (preset === 'custom') {
      // User specifies dates manually in the input fields
      if (this.isRecruiterRole) {
        if (!this.reportDateFrom || this.reportDateFrom < this.minRecruiterDate) {
          this.reportDateFrom = this.minRecruiterDate;
        }
        if (!this.reportDateTo || this.reportDateTo > todayStr) {
          this.reportDateTo = todayStr;
        }
      } else {
        if (this.reportDateTo && this.reportDateTo > todayStr) {
          this.reportDateTo = todayStr;
        }
      }
    }
  }

  onDatePresetChange(preset: string): void {
    this.applyDatePreset(preset);
  }

  onCustomDateInput(): void {
    this.reportDatePreset = 'custom';
    const today = this.todayDateStr;
    let clampedNotice: string | null = null;

    // 1. Universal rule: No future dates allowed for any user
    if (this.reportDateFrom && this.reportDateFrom > today) {
      this.reportDateFrom = today;
      clampedNotice = 'Future dates cannot be selected. "From Date" has been set to today.';
    }
    if (this.reportDateTo && this.reportDateTo > today) {
      this.reportDateTo = today;
      clampedNotice = 'Future dates cannot be selected. "To Date" has been set to today.';
    }

    // 2. Recruiter rule: Must stay within the last 7 days
    if (this.isRecruiterRole) {
      const minDate = this.minRecruiterDate;
      if (this.reportDateFrom && this.reportDateFrom < minDate) {
        this.reportDateFrom = minDate;
        clampedNotice = `Recruiter access is restricted to the last 7 days (${minDate} to ${today}).`;
      }
      if (this.reportDateTo && this.reportDateTo < minDate) {
        this.reportDateTo = minDate;
        clampedNotice = `Recruiter access is restricted to the last 7 days (${minDate} to ${today}).`;
      }
    }

    // 3. Logical sequence: From Date cannot be after To Date
    if (this.reportDateFrom && this.reportDateTo && this.reportDateFrom > this.reportDateTo) {
      this.reportDateTo = this.reportDateFrom;
      clampedNotice = '"To Date" cannot precede "From Date".';
    }

    if (clampedNotice) {
      this.reportErrorMsg = clampedNotice;
    }
  }

  formatDateToYMD(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  isFieldSelected(key: string): boolean {
    return this.selectedReportFields.includes(key);
  }

  toggleReportField(key: string): void {
    const idx = this.selectedReportFields.indexOf(key);
    if (idx > -1) {
      this.selectedReportFields.splice(idx, 1);
    } else {
      this.selectedReportFields.push(key);
    }
  }

  selectAllReportFields(): void {
    this.selectedReportFields = this.availableReportFields.map(f => f.key);
  }

  deselectAllReportFields(): void {
    this.selectedReportFields = [];
  }

  getFieldsByCategory(category: string): ExportableField[] {
    return this.availableReportFields.filter(f => f.category === category);
  }

  isCategoryFullySelected(category: string): boolean {
    const fields = this.getFieldsByCategory(category);
    if (fields.length === 0) return false;
    return fields.every(f => this.selectedReportFields.includes(f.key));
  }

  toggleCategoryFields(category: string): void {
    const fields = this.getFieldsByCategory(category);
    const allSelected = this.isCategoryFullySelected(category);
    if (allSelected) {
      const fieldKeys = new Set(fields.map(f => f.key));
      this.selectedReportFields = this.selectedReportFields.filter(k => !fieldKeys.has(k));
    } else {
      for (const f of fields) {
        if (!this.selectedReportFields.includes(f.key)) {
          this.selectedReportFields.push(f.key);
        }
      }
    }
  }

  generateAndDownloadReport(): void {
    if (this.selectedReportFields.length === 0) {
      this.alertMessage = 'Please select at least one column to include in the report.';
      this.showAlert = true;
      return;
    }

    const today = this.todayDateStr;

    // Universal rule: Future dates cannot be selected
    if ((this.reportDateFrom && this.reportDateFrom > today) || (this.reportDateTo && this.reportDateTo > today)) {
      this.reportErrorMsg = 'Future dates cannot be selected. Please select a valid date range.';
      return;
    }

    // Recruiter rule: Within last 7 days
    if (this.isRecruiterRole) {
      const minDate = this.minRecruiterDate;
      if ((this.reportDateFrom && this.reportDateFrom < minDate) || (this.reportDateTo && this.reportDateTo < minDate)) {
        this.reportErrorMsg = `Recruiters can only generate reports within the last 7 days (${minDate} to ${today}).`;
        return;
      }
    }

    if (this.reportDateFrom && this.reportDateTo && this.reportDateFrom > this.reportDateTo) {
      this.reportErrorMsg = '"From Date" cannot be after "To Date".';
      return;
    }

    this.isGeneratingReport = true;
    this.reportErrorMsg = null;
    this.reportSuccessMsg = null;

    const req: ReportGenerateRequest = {
      format: this.reportFormat,
      fields: this.selectedReportFields,
      date_from: this.reportDateFrom ? `${this.reportDateFrom}T00:00:00` : undefined,
      date_to: this.reportDateTo ? `${this.reportDateTo}T23:59:59` : undefined,
      batch_id: this.reportBatchFilter || undefined,
      source_filter: this.reportSourceFilter || undefined
    };

    this.bulkImportService
      .generateReport(req)
      .pipe(finalize(() => { this.isGeneratingReport = false; }))
      .subscribe({
        next: async (res: HttpResponse<Blob>) => {
          // If status is 202, backend requires Super Admin approval (> threshold candidates)
          if (res.status === 202) {
            try {
              let resJson: any = null;
              if (res.body) {
                const text = await res.body.text();
                resJson = JSON.parse(text);
              }
              this.lastApprovalCandidateCount = resJson?.candidate_count || 0;
              this.lastApprovalThreshold = resJson?.threshold || 50;
              this.showApprovalPendingModal = true;
              this.loadMyApprovalRequests();
            } catch (e) {
              console.warn('Could not parse 202 response:', e);
              this.showApprovalPendingModal = true;
              this.loadMyApprovalRequests();
            }
            return;
          }

          const blob = res.body;
          if (!blob) {
            this.reportErrorMsg = 'Empty report file received from server.';
            return;
          }

          // Determine extension and filename
          const ext = this.reportFormat === 'csv' ? 'csv' : 'xlsx';
          let datePart = 'All_Time';
          if (this.reportDateFrom && this.reportDateTo) {
            datePart = `${this.reportDateFrom}_to_${this.reportDateTo}`;
          } else if (this.reportDateFrom) {
            datePart = `from_${this.reportDateFrom}`;
          } else if (this.reportDateTo) {
            datePart = `up_to_${this.reportDateTo}`;
          }
          const filename = `Candidate_Report_${datePart}.${ext}`;

          // Create temporary download link
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);

          this.reportSuccessMsg = `Report "${filename}" successfully generated and downloaded.`;
        },
        error: async (err) => {
          if (err.status === 202) {
            try {
              let errorJson: any = null;
              if (err.error instanceof Blob) {
                const text = await err.error.text();
                errorJson = JSON.parse(text);
              } else if (typeof err.error === 'object') {
                errorJson = err.error;
              }

              if (errorJson?.approval_required) {
                this.lastApprovalCandidateCount = errorJson.candidate_count || 0;
                this.lastApprovalThreshold = errorJson.threshold || 50;
                this.showApprovalPendingModal = true;
                this.loadMyApprovalRequests();
                return;
              }
            } catch (e) {
              console.warn('Could not parse 202 response:', e);
            }
          }
          console.error('Failed to generate report:', err);
          this.reportErrorMsg = err.error?.error || 'Failed to generate report. Please verify date parameters and try again.';
        }
      });
  }

  // ==========================================
  // REPORT APPROVAL WORKFLOW
  // ==========================================
  loadPendingCount(): void {
    this.bulkImportService.getPendingApprovalCount().subscribe({
      next: (res) => {
        this.pendingApprovalCount = res.count || 0;
      },
      error: (err) => console.warn('Could not fetch pending approval count:', err)
    });
  }

  loadApprovalRequests(page: number = 1): void {
    this.isLoadingApprovals = true;
    this.approvalPage = page;
    this.bulkImportService.getApprovalRequests(this.approvalStatusFilter || undefined, this.approvalPage)
      .pipe(finalize(() => { this.isLoadingApprovals = false; }))
      .subscribe({
        next: (res) => {
          this.approvalRequests = res.results || [];
          this.approvalTotalCount = res.count || 0;
        },
        error: (err) => console.error('Failed to load approval requests:', err)
      });
  }

  onApprovalStatusFilterChange(): void {
    this.loadApprovalRequests(1);
  }

  approveApprovalRequest(reqItem: ReportApprovalRequest): void {
    if (this.isActingOnApproval) return;
    this.isActingOnApproval = true;
    this.bulkImportService.approveReportRequest(reqItem.id)
      .pipe(finalize(() => { this.isActingOnApproval = false; }))
      .subscribe({
        next: (res: any) => {
          this.alertMessage = `Report request approved successfully. Fresh report generated with ${res.candidate_count || reqItem.candidate_count} candidates.`;
          this.showAlert = true;
          this.loadApprovalRequests(this.approvalPage);
          this.loadPendingCount();
        },
        error: (err: any) => {
          this.alertMessage = `Failed to approve request: ${err.error?.error || 'Server error'}`;
          this.showAlert = true;
        }
      });
  }

  rejectApprovalRequest(reqItem: ReportApprovalRequest): void {
    if (this.isActingOnApproval) return;
    this.isActingOnApproval = true;
    this.bulkImportService.rejectReportRequest(reqItem.id)
      .pipe(finalize(() => { this.isActingOnApproval = false; }))
      .subscribe({
        next: () => {
          this.alertMessage = 'Report request has been rejected.';
          this.showAlert = true;
          this.loadApprovalRequests(this.approvalPage);
          this.loadPendingCount();
        },
        error: (err: any) => {
          this.alertMessage = `Failed to reject request: ${err.error?.error || 'Server error'}`;
          this.showAlert = true;
        }
      });
  }

  loadMyApprovalRequests(): void {
    this.isLoadingMyRequests = true;
    this.bulkImportService.getMyApprovalRequests()
      .pipe(finalize(() => { this.isLoadingMyRequests = false; }))
      .subscribe({
        next: (res) => {
          this.myApprovalRequests = res || [];
        },
        error: (err) => console.warn('Could not load my approval requests:', err)
      });
  }

  downloadApprovedReportFile(reqItem: ReportApprovalRequest): void {
    this.bulkImportService.downloadApprovedReport(reqItem.id)
      .subscribe({
        next: (blob: Blob) => {
          const ext = reqItem.report_params?.format === 'csv' ? 'csv' : 'xlsx';
          const filename = `Candidate_Report_${reqItem.id.substring(0, 8)}.${ext}`;
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        },
        error: (err) => {
          this.alertMessage = 'Failed to download approved report.';
          this.showAlert = true;
        }
      });
  }
}


