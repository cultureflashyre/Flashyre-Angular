// src/app/pages/admin-create-job-step2/admin-create-job-step2.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { NgxSpinnerService } from 'ngx-spinner';
import { AdminJobDescriptionService } from '../../services/admin-job-description.service';
import { CorporateAuthService } from '../../services/corporate-auth.service';
import { AdminJobCreationWorkflowService } from '../../services/admin-job-creation-workflow.service';
import { environment } from 'src/environments/environment';
import { AuthService } from 'src/app/services/candidate.service';

@Component({
  selector: 'admin-create-job-step2',
  templateUrl: 'admin-create-job-step2.component.html',
  styleUrls: ['admin-create-job-step2.component.css'],
})
export class AdminCreateJobStep2 implements OnInit, OnDestroy {
  userProfile: any = {};
  jobUniqueId: string | null = null;
  isGenerating: boolean = false;
  hasGenerated: boolean = false; // This flag tracks if MCQs exist for the current job.
  isLoading: boolean = true;
  private subscriptions = new Subscription();
  
  // --- UI State Properties ---
  showPopup: boolean = false;
  popupMessage: string = '';
  popupType: 'success' | 'error' = 'success';

  showAlert = false;
  alertMessage = '';
  alertButtons: string[] = [];
  private actionContext: { action: string } | null = null;

  // --- File Upload Properties ---
  showUploadPopup = false;
  uploadedFileName: string | null = null;
  selectedExcelFile: File | null = null;
  isUploading = false;

  constructor(
    private title: Title,
    private meta: Meta,
    private router: Router,
    private jobDescriptionService: AdminJobDescriptionService,
    private corporateAuthService: CorporateAuthService,
    private workflowService: AdminJobCreationWorkflowService,
    private spinner: NgxSpinnerService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.title.setTitle('Admin Step 2: Assessment Setup - Flashyre');
    this.meta.addTags([
      { property: 'og:title', content: 'Admin Step 2: Assessment Setup - Flashyre' },
    ]);

    if (!this.corporateAuthService.isLoggedIn()) {
      this.showErrorPopup('Your session has expired. Please log in again.');
      this.router.navigate(['/login-corporate']);
      return;
    }

    // This is the key for both "create" and "edit" modes.
    // In "edit" mode, the workflow service must be pre-populated with the job's ID.
    this.jobUniqueId = this.workflowService.getCurrentJobId();

    if (!this.jobUniqueId) {
      this.showErrorPopup('No active job post found. Redirecting to Step 1.');
      this.router.navigate(['/admin-create-job-step1']);
      return;
    }

    // This method enables the "edit" functionality by checking the job's current state.
    this.checkInitialMcqStatus();
    this.loadUserProfile();
  }

  /**
   * Checks if MCQs already exist for the current job when the page loads.
   * This pre-fills the UI state for the edit mode.
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
          // CORRECTED LOGIC:
          // We check the 'status' property from the response. If it's anything
          // other than 'not_started', it means questions exist.
          this.hasGenerated = response.status !== 'not_started';
        },
        error: (err) => {
          this.hasGenerated = false; // Default to 'not generated' on error
          console.error('Failed to check MCQ status:', err);
          this.showErrorPopup('Could not verify existing assessment questions.');
        }
      });
    this.subscriptions.add(sub);
  }

  /**
   * Handles the 'Generate with AI' / 'Regenerate' button click.
   * This logic works for both initial generation and regeneration in edit mode.
   */
  onGenerateAi(): void {
    if (!this.jobUniqueId || this.isGenerating) return;

    const token = this.corporateAuthService.getJWTToken();
    if (!token) {
      this.showErrorPopup('Authentication error. Please log in again.');
      return;
    }

    this.isGenerating = true;
    this.spinner.show('ai-spinner');

    this.jobDescriptionService.generateMcqsForJob(this.jobUniqueId, token)
      .pipe(finalize(() => {
        this.isGenerating = false;
        this.spinner.hide('ai-spinner');
      }))
      .subscribe({
        next: (response) => {
          this.hasGenerated = true; // Update state after successful generation
          this.selectedExcelFile = null; // Clear any selected file to avoid conflicts
          this.uploadedFileName = null;
          this.showSuccessPopup(response.message || 'Assessment questions generated successfully!');
        },
        error: (err) => {
          this.showErrorPopup(`Error: ${err.message || 'Could not generate questions.'}`);
        }
      });
  }
  
  // --- File Upload Logic ---
  openUploadPopup() { this.showUploadPopup = true; }
  closeUploadPopup() { this.showUploadPopup = false; }

  downloadTemplate() {
    const templateUrl = environment.mcq_upload_template;
    const link = document.createElement('a');
    link.href = templateUrl;
    link.download = 'flashyre_mcq_questions_template.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (!file.name.match(/\.(xlsx|xls)$/)) {
        this.showErrorPopup('Invalid file type. Please upload an Excel file (.xlsx, .xls).');
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        this.showErrorPopup('File size exceeds 5MB limit.');
        return;
      }
      this.selectedExcelFile = file;
      this.uploadedFileName = file.name;
      this.hasGenerated = true; // Enable 'Next' as soon as a file is selected
      this.closeUploadPopup();
    }
  }

  // --- Footer Navigation and Action Handling ---
  onPrevious(): void {
    // Navigate back to step 1, preserving the job ID for edit context.
    this.router.navigate(['/admin-create-job-step1', this.jobUniqueId]);
  }

  onNext(): void {
    if (!this.hasGenerated) {
      this.showErrorPopup('Please generate or upload questions before proceeding.');
      return;
    }
    
    // If a file was selected, upload it. Otherwise, proceed directly.
    if (this.selectedExcelFile) {
      this.isUploading = true;
      this.spinner.show('ai-spinner', { template: `<p style='color: white; font-size: 18px;'>Processing your file...</p>` });
      const token = this.corporateAuthService.getJWTToken();

      this.jobDescriptionService.uploadExcelFile(this.selectedExcelFile, this.jobUniqueId!, token)
        .pipe(finalize(() => {
          this.isUploading = false;
          this.spinner.hide('ai-spinner');
        }))
        .subscribe({
          next: () => {
            this.showSuccessPopup('File uploaded and questions processed!');
            this.router.navigate(['/admin-create-job-step3']);
          },
          error: (error) => {
            this.showErrorPopup(`Upload failed: ${error.message || 'Unknown error'}`);
          }
        });

    } else {
      // Path for AI-generated questions or when re-confirming an existing state.
      this.router.navigate(['/admin-create-job-step3']);
    }
  }
  
  onSkip() {
    this.openAlert('Are you sure you want to skip adding an assessment?', ['Cancel', 'Skip']);
  }

  onCancel() {
    this.openAlert('Are you sure you want to cancel? Your changes will not be saved.', ['No', 'Yes, Cancel']);
  }
  
  onSaveDraft() {
    this.openAlert('Do you want to save your progress and exit?', ['Cancel', 'Save & Exit']);
  }

  // --- Alert Handling ---
  private openAlert(message: string, buttons: string[]) {
    this.alertMessage = message;
    this.alertButtons = buttons;
    this.showAlert = true;
  }

  onAlertButtonClicked(action: string) {
    this.showAlert = false;
    switch (action.toLowerCase()) {
      case 'skip':
        this.onSkipConfirmed();
        break;
      case 'yes, cancel':
        this.onCancelConfirmed();
        break;
      case 'save & exit':
        this.onSaveDraftConfirmed();
        break;
    }
  }

  // --- Confirmed Action Handlers ---
  private onSkipConfirmed(): void {
    // In an edit flow, skipping might imply deleting existing questions.
    // For now, we navigate to the next step as requested.
    this.router.navigate(['/admin-create-job-step3']);
  }

  private onCancelConfirmed(): void {
    // In an edit flow, "cancel" should discard changes and navigate back to the job list.
    this.workflowService.clearWorkflow();
    this.showSuccessPopup('Job post editing cancelled.');
    setTimeout(() => this.router.navigate(['/admin-job-posts']), 2000);
  }
  
  private onSaveDraftConfirmed(): void {
    // "Save Draft" means exiting the flow but keeping all data as is.
    this.workflowService.clearWorkflow();
    this.showSuccessPopup('Your draft has been saved.');
    setTimeout(() => this.router.navigate(['/admin-job-posts']), 2000);
  }

  // --- Utility and Lifecycle Methods ---
  showSuccessPopup(message: string) {
    this.popupMessage = message;
    this.popupType = 'success';
    this.showPopup = true;
    setTimeout(() => this.closePopup(), 3000);
  }

  showErrorPopup(message: string) {
    this.popupMessage = message;
    this.popupType = 'error';
    this.showPopup = true;
    setTimeout(() => this.closePopup(), 5000);
  }

  closePopup() {
    this.showPopup = false;
    this.popupMessage = '';
  }

  loadUserProfile(): void {
    const profileData = localStorage.getItem('userProfile');
    if (profileData) this.userProfile = JSON.parse(profileData);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}