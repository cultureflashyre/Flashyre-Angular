// src/app/pages/create-job-post-21-page/create-job-post-21-page.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { NgxSpinnerService } from 'ngx-spinner';

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
  hasGenerated: boolean = false; // This now represents the state from the backend
  isLoading: boolean = true; // Used for the initial page load check
  
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
    private workflowService: JobCreationWorkflowService,
    private spinner: NgxSpinnerService
  ) {}

  ngOnInit(): void {
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

    if (!this.corporateAuthService.isLoggedIn()) {
      this.snackBar.open('Your session has expired. Please log in again.', 'Close', { duration: 5000 });
      this.router.navigate(['/login-corporate']);
      return;
    }

    this.jobUniqueId = this.workflowService.getCurrentJobId();
    if (!this.jobUniqueId) {
      this.snackBar.open('No active job creation flow found. Please start again.', 'Close', { duration: 4000 });
      this.router.navigate(['/create-job-post-1st-page']);
      return;
    }
    
    // Call the method to check the initial state from the backend
    this.checkInitialMcqStatus();
  }

  /**
   * Checks if MCQs exist for the current job when the page loads to set the initial UI state.
   */
  private checkInitialMcqStatus(): void {
    const token = this.corporateAuthService.getJWTToken();
    if (!this.jobUniqueId || !token) {
        this.isLoading = false;
        return;
    }

    this.isLoading = true;
    const sub = this.jobDescriptionService.checkMcqStatus(this.jobUniqueId, token)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response) => {
          this.hasGenerated = response.has_mcqs;
        },
        error: (err) => {
          // If the check fails for any reason, default to the "not generated" state.
          this.hasGenerated = false;
          console.error('Failed to check MCQ status:', err);
        }
      });
    this.subscriptions.add(sub);
  }

  /**
   * Handles the 'Generate with AI' / 'Regenerate' button click.
   */
  onGenerateAi(): void {
    // Allow regeneration by removing hasGenerated from the guard
    if (!this.jobUniqueId || this.isGenerating) {
      return;
    }
    const token = this.corporateAuthService.getJWTToken();
    if (!token) {
      this.snackBar.open('Authentication error. Please log in again.', 'Close', { duration: 4000 });
      this.router.navigate(['/login-candidate']);
      return;
    }

    this.isGenerating = true;
    this.spinner.show('ai-spinner');

    const generateSub = this.jobDescriptionService.generateMcqsForJob(this.jobUniqueId, token)
      .pipe(
        // Use the finalize operator to guarantee the spinner is hidden
        // This block will run on success, error, or completion.
        finalize(() => {
          this.isGenerating = false;
          this.spinner.hide('ai-spinner');
        })
      )
      .subscribe({
        next: (response) => {
          this.hasGenerated = true; // Set state to true after successful generation
          this.snackBar.open(response.message || 'Assessment questions have been generated!', 'Close', { duration: 3000 });
        },
        error: (err) => {
          // isGenerating and spinner.hide() are handled by the finalize operator
          this.snackBar.open(`Error: ${err.message || 'Could not generate questions.'}`, 'Close', { duration: 5000 });
        }
    });
    this.subscriptions.add(generateSub);
  }

  /**
   * Handles the 'Upload Manually' button click.
   */
  onUploadManually(): void {
    this.snackBar.open('Manual upload is not yet implemented. You can now proceed.', 'Close', { duration: 3000 });
    this.hasGenerated = true; // Enable the Next button
  }

  /**
   * Handles the 'Cancel' button click in the footer.
   */
  onCancel(): void {
    this.workflowService.clearWorkflow();
    this.router.navigate(['/dashboard']);
  }
  
  /**
   * Handles the 'Previous' button click in the footer.
   */
  onPrevious(): void {
    this.router.navigate(['/create-job-post-1st-page']);
  }
  
  /**
   * Handles the 'Skip' button click in the footer.
   */
  onSkip(): void {
    this.router.navigate(['/create-job-post-22-page']);
  }

  /**
   * Handles the 'Save Draft' button click in the footer.
   */
  onSaveDraft(): void {
    this.snackBar.open('Your draft has been saved.', 'Close', { duration: 3000 });
    this.workflowService.clearWorkflow();
    this.router.navigate(['/dashboard']);
  }

  /**
   * Handles the 'Next' button click in the footer.
   */
  onNext(): void {
    if (this.jobUniqueId && this.hasGenerated) {
      this.router.navigate(['/create-job-post-22-page']);
    } else if (!this.hasGenerated) {
        this.snackBar.open('Please generate or upload questions before proceeding.', 'Close', { duration: 3000});
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}