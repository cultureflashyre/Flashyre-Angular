// src/app/pages/create-job-post-21-page/create-job-post-21-page.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { Router } from '@angular/router';
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
  
  // Properties for the custom alert popup
  showPopup: boolean = false;
  popupMessage: string = '';
  popupType: 'success' | 'error' = 'success';

  // These properties were in the original file. Kept to prevent potential template binding errors from old fragments.
  rawp46g: string = ' '; 
  rawliiy: string = ' '; 

  constructor(
    private title: Title,
    private meta: Meta,
    private router: Router,
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
      // Replaced MatSnackBar with custom popup
      this.showErrorPopup('Your session has expired. Please log in again.');
      this.router.navigate(['/login-corporate']);
      return;
    }

    this.jobUniqueId = this.workflowService.getCurrentJobId();
    if (!this.jobUniqueId) {
      // Replaced MatSnackBar with custom popup
      this.showErrorPopup('No active job creation flow found. Please start again.');
      this.router.navigate(['/create-job-post-1st-page']);
      return;
    }
    
    // Call the method to check the initial state from the backend
    this.checkInitialMcqStatus();
  }

  // --- Popup Handling Methods ---
  showSuccessPopup(message: string) {
    this.popupMessage = message;
    this.popupType = 'success';
    this.showPopup = true;
    setTimeout(() => this.closePopup(), 3000); // Auto-close after 3 seconds
  }

  showErrorPopup(message: string) {
    this.popupMessage = message;
    this.popupType = 'error';
    this.showPopup = true;
    setTimeout(() => this.closePopup(), 5000); // Auto-close after 5 seconds
  }

  closePopup() {
    this.showPopup = false;
    this.popupMessage = '';
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
          // Added error popup for better user feedback
          this.showErrorPopup('Could not verify existing assessment questions.');
        }
      });
    this.subscriptions.add(sub);
  }

  /**
   * Handles the 'Generate with AI' / 'Regenerate' button click.
   */
  onGenerateAi(): void {
    if (!this.jobUniqueId || this.isGenerating) {
      return;
    }
    const token = this.corporateAuthService.getJWTToken();
    if (!token) {
      // Replaced MatSnackBar with custom popup
      this.showErrorPopup('Authentication error. Please log in again.');
      this.router.navigate(['/login-corporate']);
      return;
    }

    this.isGenerating = true;
    this.spinner.show('ai-spinner');

    const generateSub = this.jobDescriptionService.generateMcqsForJob(this.jobUniqueId, token)
      .pipe(
        finalize(() => {
          this.isGenerating = false;
          this.spinner.hide('ai-spinner');
        })
      )
      .subscribe({
        next: (response) => {
          this.hasGenerated = true; // Set state to true after successful generation
          // Replaced MatSnackBar with custom popup
          this.showSuccessPopup(response.message || 'Assessment questions have been generated!');
        },
        error: (err) => {
          // isGenerating and spinner.hide() are handled by the finalize operator
          // Replaced MatSnackBar with custom popup
          this.showErrorPopup(`Error: ${err.message || 'Could not generate questions.'}`);
        }
    });
    this.subscriptions.add(generateSub);
  }

  /**
   * Handles the 'Upload Manually' button click.
   */
  onUploadManually(): void {
    // Replaced MatSnackBar with custom popup
    this.showSuccessPopup('Manual upload is not yet implemented. You can now proceed.');
    this.hasGenerated = true; // Enable the Next button
  }

  /**
   * Handles the 'Cancel' button click in the footer.
   */
  onCancel(): void {
    this.workflowService.clearWorkflow();
    this.showSuccessPopup('Job post creation cancelled.');
    // Added delay for navigation
    setTimeout(() => {
        this.router.navigate(['/recruiter-view-3rd-page1']);
    }, 3000);
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
    this.workflowService.clearWorkflow();
    // Replaced MatSnackBar and added navigation delay
    this.showSuccessPopup('Your draft has been saved.');
    setTimeout(() => {
        this.router.navigate(['/recruiter-view-3rd-page1']);
    }, 3000);
  }

  /**
   * Handles the 'Next' button click in the footer.
   */
  onNext(): void {
    if (this.jobUniqueId && this.hasGenerated) {
      this.router.navigate(['/create-job-post-22-page']);
    } else if (!this.hasGenerated) {
        // Replaced MatSnackBar with custom popup
        this.showErrorPopup('Please generate or upload questions before proceeding.');
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}