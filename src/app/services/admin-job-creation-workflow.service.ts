// src/app/services/admin-job-creation-workflow.service.ts
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AdminJobCreationWorkflowService {
  private readonly JOB_ID_KEY = 'admin_active_job_id';
  private readonly ASSESSMENT_ID_KEY = 'admin_active_assessment_id';

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

  clearWorkflow(): void {
    sessionStorage.removeItem(this.JOB_ID_KEY);
    sessionStorage.removeItem(this.ASSESSMENT_ID_KEY);
  }
}