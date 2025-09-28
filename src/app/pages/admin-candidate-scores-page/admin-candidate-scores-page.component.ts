// src/app/pages/admin-candidate-scores-page/admin-candidate-scores-page.component.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AdminJobCreationWorkflowService } from '../../services/admin-job-creation-workflow.service';
import { CorporateAuthService } from '../../services/corporate-auth.service';
import { AdminJobDescriptionService } from '../../services/admin-job-description.service';
import { catchError, tap } from 'rxjs/operators';
import { throwError } from 'rxjs';

@Component({
  selector: 'admin-candidate-scores-page',
  templateUrl: './admin-candidate-scores-page.component.html',
  styleUrls: ['./admin-candidate-scores-page.component.css']
})
export class AdminCandidateScoresPageComponent implements OnInit {
  jobUniqueId: string | null = null; // Store the job unique ID
  candidates: any[] = []; // Store candidate data
  loading: boolean = false; // Loading state for API call
  error: string | null = null; // Error message for API failures

  constructor(
    private workflowService: AdminJobCreationWorkflowService, // Workflow service for job ID
    private router: Router, // Router for navigation
    private authService: CorporateAuthService, // Authentication service
    private jobDescriptionService: AdminJobDescriptionService // Service for job-related API calls
  ) {}

  ngOnInit(): void {
    // Get the job ID from the workflow service
    this.jobUniqueId = this.workflowService.getCurrentJobId();
    if (!this.jobUniqueId) {
      console.error('No active job found in workflow. Redirecting...');
      this.router.navigate(['/admin-create-job-step1']);
      return;
    }
    this.loadCandidates(); // Load candidates for the job
  }

  // Load candidates with scores for the job
  private loadCandidates(): void {
    this.loading = true; // Set loading state
    this.error = null; // Reset error
    // Temporary workaround: Retrieve token from localStorage directly if CorporateAuthService.getToken() is not defined.
    // Best practice: Implement getToken() in CorporateAuthService to manage token securely (e.g., from localStorage or BehaviorSubject).
    // For example, in CorporateAuthService, add: getToken(): string | null { return localStorage.getItem('auth_token'); }
    const token = localStorage.getItem('jwtToken'); // Replace 'auth_token' with the actual key used for storing the JWT token
    if (!token) {
      this.error = 'Authentication token not found.';
      this.loading = false;
      return;
    }

    // Fetch candidates using the correct endpoint
    this.jobDescriptionService.getSourcedCandidatesWithScores(this.jobUniqueId!, token, 'score_desc')
      .pipe(
        tap(response => {
          if (response.status === 'success' && response.data && response.data.candidates) {
            this.candidates = response.data.candidates; // Store candidates
          } else {
            this.error = 'Invalid response format from server.';
          }
          this.loading = false; // Clear loading state
        }),
        catchError(err => {
          this.error = err.message || 'Failed to load candidates.';
          this.loading = false; // Clear loading state
          return throwError(() => new Error(this.error));
        })
      )
      .subscribe(); // Execute the API call
  }

  // Navigate back to job setup (step 4)
  onBackToJobSetup(): void {
    this.router.navigate(['/admin-create-job-step4']);
  }
}