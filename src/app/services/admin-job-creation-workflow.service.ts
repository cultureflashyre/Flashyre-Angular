// src/app/services/admin-job-creation-workflow.service.ts
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AdminJobCreationWorkflowService {
  private readonly JOB_ID_KEY = 'admin_active_job_id';
  private readonly ASSESSMENT_ID_KEY = 'admin_active_assessment_id';
  // NEW: Key for storing uploaded MCQs temporarily
  private readonly UPLOADED_MCQS_KEY = 'admin_temp_uploaded_mcqs';

  startWorkflow(jobUniqueId: string): void {
    sessionStorage.setItem(this.JOB_ID_KEY, jobUniqueId);
  }

  getCurrentJobId(): string | null {
    return sessionStorage.getItem(this.JOB_ID_KEY);
  }

  setCurrentAssessmentId(assessmentId: string): void {
    sessionStorage.setItem(this.ASSESSMENT_ID_KEY, assessmentId);
  }

  getCurrentAssessmentId(): string | null {
    return sessionStorage.getItem(this.ASSESSMENT_ID_KEY);
  }

  // --- MODIFICATION START ---

  /**
   * Stores the newly uploaded MCQ data in session storage.
   * This allows Step 3 to access it immediately without a re-fetch.
   * @param data The MCQ data returned from the upload API call.
   */
  setUploadedMcqs(data: any): void {
    sessionStorage.setItem(this.UPLOADED_MCQS_KEY, JSON.stringify(data));
  }

  /**
   * Retrieves the stored MCQ data.
   * This should be called once by Step 3 upon initialization.
   * @returns The parsed MCQ data or null if not found.
   */
  getUploadedMcqs(): any | null {
    const data = sessionStorage.getItem(this.UPLOADED_MCQS_KEY);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Clears the temporary MCQ data from session storage.
   * This should be called after Step 3 has consumed the data.
   */
  clearUploadedMcqs(): void {
    sessionStorage.removeItem(this.UPLOADED_MCQS_KEY);
  }

  // --- MODIFICATION END ---

  clearWorkflow(): void {
    sessionStorage.removeItem(this.JOB_ID_KEY);
    sessionStorage.removeItem(this.ASSESSMENT_ID_KEY);
    this.clearUploadedMcqs();

  }
}