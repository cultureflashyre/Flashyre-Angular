// src/app/services/admin-job-creation-workflow.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdminJobCreationWorkflowService {
  private readonly JOB_ID_KEY = 'admin_active_job_id';
  private readonly ASSESSMENT_ID_KEY = 'admin_active_assessment_id';
  private readonly UPLOADED_MCQS_KEY = 'admin_temp_uploaded_mcqs';
  // --- CHANGE START ---
  // Add a key to explicitly track edit mode.
  private readonly EDIT_MODE_KEY = 'admin_job_edit_mode';
  // --- CHANGE END ---

  // BehaviorSubject allows components to subscribe to the current ID
  private currentJobId = new BehaviorSubject<string | null>(null);
  public currentJobId$ = this.currentJobId.asObservable();

  // MODIFICATION: Add BehaviorSubject for the assessment ID
  private currentAssessmentId = new BehaviorSubject<string | null>(null);
  public currentAssessmentId$ = this.currentAssessmentId.asObservable();

  private isEditMode = new BehaviorSubject<boolean>(false);
  public isEditMode$ = this.isEditMode.asObservable();

  constructor() {
    // When the service is instantiated, try to load the ID from session storage.
    // This handles the case where the user refreshes the page.
    const savedId = sessionStorage.getItem(this.JOB_ID_KEY);
    if (savedId) {
      this.currentJobId.next(savedId);
    }

    // MODIFICATION: Load assessment ID on initialization
    const savedAssessmentId = sessionStorage.getItem(this.ASSESSMENT_ID_KEY);
    if (savedAssessmentId) {
        this.currentAssessmentId.next(savedAssessmentId);
    }

    const savedEditMode = sessionStorage.getItem(this.EDIT_MODE_KEY);
    if (savedEditMode) {
      this.isEditMode.next(savedEditMode === 'true');
    }

  }

  startWorkflow(jobUniqueId: string): void {
    sessionStorage.setItem(this.JOB_ID_KEY, jobUniqueId);
    this.currentJobId.next(jobUniqueId);
    // Ensure edit mode is false for a new job workflow.
    sessionStorage.setItem(this.EDIT_MODE_KEY, 'false');
  }

  // --- CHANGE START ---
  /**
   * Starts or continues an editing workflow.
   * Sets both the job ID and the edit mode flag.
   * @param jobUniqueId The unique ID of the job being edited.
   */
  startEditWorkflow(jobUniqueId: string): void {
    sessionStorage.setItem(this.JOB_ID_KEY, jobUniqueId);
    this.currentJobId.next(jobUniqueId);

    sessionStorage.setItem(this.EDIT_MODE_KEY, 'true');
  }

  /**
   * Checks if the current workflow is in edit mode.
   * @returns `true` if in edit mode, otherwise `false`.
   */
  getIsEditMode(): boolean {
    return sessionStorage.getItem(this.EDIT_MODE_KEY) === 'true';
  }
  // --- CHANGE END ---

  getCurrentJobId(): string | null {
    return sessionStorage.getItem(this.JOB_ID_KEY);
  }

  setCurrentAssessmentId(assessmentId: string): void {
    sessionStorage.setItem(this.ASSESSMENT_ID_KEY, assessmentId);
  }

  getCurrentAssessmentId(): string | null {
    return sessionStorage.getItem(this.ASSESSMENT_ID_KEY);
  }

  setUploadedMcqs(data: any): void {
    sessionStorage.setItem(this.UPLOADED_MCQS_KEY, JSON.stringify(data));
  }

  getUploadedMcqs(): any | null {
    const data = sessionStorage.getItem(this.UPLOADED_MCQS_KEY);
    return data ? JSON.parse(data) : null;
  }

  clearUploadedMcqs(): void {
    sessionStorage.removeItem(this.UPLOADED_MCQS_KEY);
  }

  clearWorkflow(): void {
    sessionStorage.removeItem(this.JOB_ID_KEY);
    sessionStorage.removeItem(this.ASSESSMENT_ID_KEY);
    sessionStorage.removeItem(this.EDIT_MODE_KEY); // Also clear the edit mode flag
    this.clearUploadedMcqs();
  }
}