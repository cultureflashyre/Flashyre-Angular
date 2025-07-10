// src/app/pages/create-job-post-21-page/create-job-post-21-page.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';

import { JobDescriptionService } from '../../services/job-description.service';
import { CorporateAuthService } from '../../services/corporate-auth.service';
import { JobCreationWorkflowService } from '../../services/job-creation-workflow.service';

@Component({
  selector: 'create-job-post21-page',
  templateUrl: 'create-job-post-21-page.component.html',
  styleUrls: ['create-job-post-21-page.component.css'],
})
export class CreateJobPost21Page implements OnInit, OnDestroy {
  
  jobUniqueId: string | null = null;
  isGenerating: boolean = false;
  hasGenerated: boolean = false; // Controls the 'Next' button
  isLoading: boolean = true;
  
  private subscriptions = new Subscription();
  
  // These properties were in the original file. Kept to prevent potential template binding errors from old fragments.
  rawp46g: string = ' '; 
  rawliiy: string = ' '; 

  constructor(
    private title: Title,
    private meta: Meta,
    private router: Router,
    private snackBar: MatSnackBar,
    private jobDescriptionService: JobDescriptionService,
    private corporateAuthService: CorporateAuthService,
    private workflowService: JobCreationWorkflowService
  ) {}

  ngOnInit(): void {
    this.isLoading = true;
    
    // Check for authentication session first
    if (!this.corporateAuthService.isLoggedIn()) {
      this.snackBar.open('Your session has expired. Please log in again.', 'Close', { duration: 5000 });
      this.router.navigate(['/login-candidate']); // or your corporate login route
      return;
    }

    // Get the unique ID from the workflow service
    this.jobUniqueId = this.workflowService.getCurrentJobId();

    // If there is no ID, the user should not be on this page. Redirect them to start the flow.
    if (!this.jobUniqueId) {
      this.snackBar.open('No active job creation flow found. Please start again.', 'Close', { duration: 4000 });
      this.router.navigate(['/create-job-post-1st-page']);
      return;
    }

    // Set page title and meta tags
    this.title.setTitle('Step 2: Generate Assessment - Flashyre');
    this.meta.addTags([
      {
        property: 'og:title',
        content: 'Step 2: Generate Assessment - Flashyre',
      },
      {
        property: 'og:image',
        content:
          'https://aheioqhobo.cloudimg.io/v7/_playground-bucket-v2.teleporthq.io_/8203932d-6f2d-4493-a7b2-7000ee521aa2/9aea8e9c-27ce-4011-a345-94a92ae2dbf8?org_if_sml=1&force_format=original',
      },
    ]);
    this.isLoading = false;
  }

  /**
   * Handles the 'Generate with AI' button click.
   */
  onGenerateAi(): void {
    if (!this.jobUniqueId || this.isGenerating || this.hasGenerated) {
      return;
    }
    const token = this.corporateAuthService.getJWTToken();
    if (!token) {
      this.snackBar.open('Authentication error. Please log in again.', 'Close', { duration: 4000 });
      this.router.navigate(['/login-candidate']);
      return;
    }

    this.isGenerating = true;
    const generateSub = this.jobDescriptionService.generateMcqsForJob(this.jobUniqueId, token).subscribe({
      next: (response) => {
        this.isGenerating = false;
        this.hasGenerated = true; // Enable the 'Next' button
        this.snackBar.open(response.message || 'Assessment questions generated successfully!', 'Close', { duration: 3000 });
      },
      error: (err) => {
        this.isGenerating = false;
        this.snackBar.open(`Error: ${err.message || 'Could not generate questions.'}`, 'Close', { duration: 5000 });
      }
    });
    this.subscriptions.add(generateSub);
  }

  /**
   * Handles the 'Upload Manually' button click.
   * This action also satisfies the condition to proceed to the next step.
   */
  onUploadManually(): void {
    // In a real scenario, this might open a dialog or navigate to another page.
    // For now, it fulfills the requirement of enabling the "Next" button.
    this.snackBar.open('Manual upload selected. You can now proceed.', 'Close', { duration: 3000 });
    this.hasGenerated = true; // Enable the Next button
  }


  /**
   * Handles the 'Previous' button click.
   */
  onPrevious(): void {
    // The workflow service retains the ID, so the first page can reload the data.
    this.router.navigate(['/create-job-post-1st-page']);
  }
  
  /**
   * Handles the 'Skip' button click.
   */
  onSkip(): void {
    if (this.jobUniqueId) {
      // Navigate to the next major step
      this.router.navigate(['/create-job-post-3rd-page']);
    }
  }

  /**
   * Handles the 'Save Draft' button click. Exits the flow.
   */
  onSaveDraft(): void {
    this.snackBar.open('Your draft has been saved. You can continue later from your dashboard.', 'Close', { duration: 3000 });
    this.workflowService.clearWorkflow(); // End the workflow state
    this.router.navigate(['/dashboard']);
  }

  /**
   * Handles the 'Next' button click, which is enabled after a primary action is taken.
   */
  onNext(): void {
    if (this.jobUniqueId && this.hasGenerated) {
      // Navigate to the page for viewing/editing the generated questions.
      this.router.navigate(['/create-job-post-22-page']);
    } else if (!this.hasGenerated) {
        this.snackBar.open('Please generate or upload questions before proceeding.', 'Close', { duration: 3000});
    }
  }

  /**
   * Cleans up subscriptions when the component is destroyed to prevent memory leaks.
   */
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}