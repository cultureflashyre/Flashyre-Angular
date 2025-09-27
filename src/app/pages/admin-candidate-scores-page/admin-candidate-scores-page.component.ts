// src/app/pages/admin-candidate-scores-page/admin-candidate-scores-page.component.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AdminJobCreationWorkflowService } from '../../services/admin-job-creation-workflow.service'; // Use your new workflow service
import { CorporateAuthService } from '../../services/corporate-auth.service';

@Component({
  selector: 'admin-candidate-scores-page',
  templateUrl: './admin-candidate-scores-page.component.html',
  styleUrls: ['./admin-candidate-scores-page.component.css'] // Create this CSS file
})
export class AdminCandidateScoresPageComponent implements OnInit {
  jobUniqueId: string | null = null;

  constructor(
    private workflowService: AdminJobCreationWorkflowService, // Use your new workflow service
    private router: Router,
    private authService: CorporateAuthService
  ) {}

  ngOnInit(): void {
    // Get the job ID from the workflow service
    this.jobUniqueId = this.workflowService.getCurrentJobId();
    if (!this.jobUniqueId) {
      console.error('No active job found in workflow. Redirecting...');
      // Redirect to the first step or an error page
      this.router.navigate(['/admin-create-job-step1']);
      return;
    }
    // Optionally, you could validate here if the job exists via an API call
  }

  // Optional: Add a method to go back to the last step if needed
  onBackToJobSetup(): void {
    this.router.navigate(['/admin-create-job-step4']); // Or wherever it's logical to go back from
  }
}