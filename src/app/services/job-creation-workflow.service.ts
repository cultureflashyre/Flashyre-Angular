import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class JobCreationWorkflowService {
  private readonly STORAGE_KEY = 'jobCreationUniqueId';

  private readonly ASSESSMENT_ID_KEY = 'jobCreationAssessmentId';
  
  // BehaviorSubject allows components to subscribe to the current ID
  private currentJobId = new BehaviorSubject<string | null>(null);
  public currentJobId$ = this.currentJobId.asObservable();

  // MODIFICATION: Add BehaviorSubject for the assessment ID
  private currentAssessmentId = new BehaviorSubject<string | null>(null);
  public currentAssessmentId$ = this.currentAssessmentId.asObservable();

  constructor() {
    // When the service is instantiated, try to load the ID from session storage.
    // This handles the case where the user refreshes the page.
    const savedId = sessionStorage.getItem(this.STORAGE_KEY);
    if (savedId) {
      this.currentJobId.next(savedId);
    }

    // MODIFICATION: Load assessment ID on initialization
    const savedAssessmentId = sessionStorage.getItem(this.ASSESSMENT_ID_KEY);
    if (savedAssessmentId) {
        this.currentAssessmentId.next(savedAssessmentId);
    }

  }

  /**
   * Starts the job creation flow by setting the unique ID.
   * @param uniqueId The ID of the job post created in the first step.
   */
  public startWorkflow(uniqueId: string): void {
    if (!uniqueId) {
      console.error("Workflow cannot be started with a null or empty uniqueId.");
      return;
    }
    sessionStorage.setItem(this.STORAGE_KEY, uniqueId);
    this.currentJobId.next(uniqueId);
  }

  /**
   * Retrieves the current job ID synchronously.
   * @returns The unique ID string or null if not in a workflow.
   */
  public getCurrentJobId(): string | null {
    return this.currentJobId.getValue();
  }

  // MODIFICATION: New methods to manage assessment ID
  public setCurrentAssessmentId(assessmentId: string): void {
    sessionStorage.setItem(this.ASSESSMENT_ID_KEY, assessmentId);
    this.currentAssessmentId.next(assessmentId);
  }

  public getCurrentAssessmentId(): string | null {
    return this.currentAssessmentId.getValue();
  }
  
  private clearCurrentAssessmentId(): void {
    sessionStorage.removeItem(this.ASSESSMENT_ID_KEY);
    this.currentAssessmentId.next(null);
  }



  /**
   * Clears the workflow state. This should be called when the user
   * cancels, finishes, or saves the draft to exit the flow.
   */
  public clearWorkflow(): void {
    sessionStorage.removeItem(this.STORAGE_KEY);
    this.currentJobId.next(null);
    this.clearCurrentAssessmentId(); // Clear the assessment ID as well
  }
}