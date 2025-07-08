import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class JobCreationWorkflowService {
  private readonly STORAGE_KEY = 'jobCreationUniqueId';
  
  // BehaviorSubject allows components to subscribe to the current ID
  private currentJobId = new BehaviorSubject<string | null>(null);
  public currentJobId$ = this.currentJobId.asObservable();

  constructor() {
    // When the service is instantiated, try to load the ID from session storage.
    // This handles the case where the user refreshes the page.
    const savedId = sessionStorage.getItem(this.STORAGE_KEY);
    if (savedId) {
      this.currentJobId.next(savedId);
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

  /**
   * Clears the workflow state. This should be called when the user
   * cancels, finishes, or saves the draft to exit the flow.
   */
  public clearWorkflow(): void {
    sessionStorage.removeItem(this.STORAGE_KEY);
    this.currentJobId.next(null);
  }
}