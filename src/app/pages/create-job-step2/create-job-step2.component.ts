// src/app/pages/create-job-step2/create-job-step2.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { NgxSpinnerService } from 'ngx-spinner';

import { AdminJobDescriptionService } from '../../services/admin-job-description.service';
import { CorporateAuthService } from '../../services/corporate-auth.service';
import { AdminJobCreationWorkflowService } from '../../services/admin-job-creation-workflow.service';
import { environment } from 'src/environments/environment';
import { AuthService } from 'src/app/services/candidate.service';

@Component({
  selector: 'create-job-step2',
  templateUrl: 'create-job-step2.component.html',
  styleUrls: ['create-job-step2.component.css'],
})
export class AdminCreateJobStep2 implements OnInit, OnDestroy {
  userProfile: any = {};
  jobUniqueId: string | null = null;
  isGenerating: boolean = false;
  hasGenerated: boolean = false;
  isLoading: boolean = true;
  isEditMode: boolean = false;

  private subscriptions = new Subscription();
  
  showPopup: boolean = false;
  popupMessage: string = '';
  popupType: 'success' | 'error' = 'success';

  showAlert = false;
  alertMessage = '';
  alertButtons: string[] = [];

  showUploadPopup = false;
  uploadedFileName: string | null = null;
  selectedExcelFile: File | null = null;
  isUploading = false;

  constructor(
    private title: Title,
    private meta: Meta,
    private router: Router,
    private route: ActivatedRoute,
    private jobDescriptionService: AdminJobDescriptionService,
    private corporateAuthService: CorporateAuthService,
    private workflowService: AdminJobCreationWorkflowService,
    private spinner: NgxSpinnerService,
    private authService: AuthService, // Note: This service was unused in the original admin file. Keeping it for consistency.
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

    // --- REVISED EDITING LOGIC ---
    const jobIdFromRoute = this.route.snapshot.paramMap.get('jobId');
    const jobIdFromWorkflow = this.workflowService.getCurrentJobId();

    if (jobIdFromRoute) {
      // If job ID is in the URL, we are definitely editing.
      // Start or update the workflow to reflect this.
      this.jobUniqueId = jobIdFromRoute;
      this.workflowService.startEditWorkflow(this.jobUniqueId);
    } else {
      // If not in URL, rely on the workflow service.
      this.jobUniqueId = jobIdFromWorkflow;
    }

    // Now, determine the mode from the single source of truth: the workflow service.
    this.isEditMode = this.workflowService.getIsEditMode();
    
    if (!this.jobUniqueId) {
      this.showErrorPopup('No active job post found. Redirecting to Step 1.');
      this.router.navigate(['/create-job']);
      return;
    }

    // For both new and edit modes, check the initial MCQ status.
    // In "new" mode, it will report no questions.
    // In "edit" mode, it will report if questions already exist.
    this.checkInitialMcqStatus();
    
    this.loadUserProfile();
  }

  /**
   * Fetches the MCQ status for the current job.
   * This is the core function that enables pre-filling the UI for editing.
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
          // If the status is anything other than 'not_started', it means an
          // assessment (either from AI or Excel) already exists.
          this.hasGenerated = response.status !== 'not_started';

          // If the source was an Excel upload and a filename is provided,
          // display it in the UI.
          if (response.source === 'excel_upload' && response.filename) {
            this.uploadedFileName = response.filename;
          }
        },
        error: (err) => {
          this.hasGenerated = false; // On error, assume no questions exist.
          console.error('Failed to check MCQ status:', err);
          this.showErrorPopup('Could not verify existing assessment questions.');
        }
      });
    this.subscriptions.add(sub);
  }

  /**
   * Handles the 'Generate with AI' or 'Regenerate' button click.
   * The same logic works for both creating and updating the assessment.
   */
  onGenerateAi(): void {
    if (!this.jobUniqueId || this.isGenerating) return;

    const token = this.corporateAuthService.getJWTToken();
    if (!token) {
      this.showErrorPopup('Authentication error. Please log in again.');
      this.router.navigate(['/login-corporate']);
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
          this.hasGenerated = true; // Update state after generation
          this.selectedExcelFile = null; // Clear any selected file to avoid conflicts
          this.uploadedFileName = null;
          this.showSuccessPopup(response.message || 'Assessment questions generated successfully!');
        },
        error: (err) => {
          this.showErrorPopup(`Error: ${err.message || 'Could not generate questions.'}`);
        }
      });
  }
  
  openUploadPopup() { this.showUploadPopup = true; }
  closeUploadPopup() { this.showUploadPopup = false; }

  downloadTemplate() {
    const link = document.createElement('a');
    link.href = environment.mcq_upload_template;
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

  onPrevious(): void {
    // Navigate back to step 1, passing the job ID to maintain the editing context.
    if(this.jobUniqueId) {
        this.router.navigate(['/create-job', this.jobUniqueId]);
    } else {
        this.router.navigate(['/create-job']);
    }
  }

  onNext(): void {
    if (!this.hasGenerated) {
      this.showErrorPopup('Please generate or upload questions before proceeding.');
      return;
    }
    
    // If a new file was selected, upload it. This will overwrite any previous assessment.
    if (this.selectedExcelFile) {
      this.isUploading = true;
      this.spinner.show('ai-spinner', { template: `<p style='color: white; font-size: 18px;'>Processing your file...</p>` });
      const token = this.corporateAuthService.getJWTToken();

      this.jobDescriptionService.uploadExcelFile(this.selectedExcelFile, this.jobUniqueId!, token!)
        .pipe(finalize(() => {
          this.isUploading = false;
          this.spinner.hide('ai-spinner');
        }))
        .subscribe({
          next: (response) => {
            // New: Pass uploaded MCQs to the next step via the workflow service
            if (response.uploaded_mcqs) {
              this.workflowService.setUploadedMcqs(response.uploaded_mcqs);
            }
            this.showSuccessPopup('File uploaded and questions processed!');
            this.router.navigate(['/create-job-step3']);
          },
          error: (error) => {
            this.showErrorPopup(`Upload failed: ${error.message || 'Unknown error'}`);
          }
        });
    } else {
      // If no new file was chosen, proceed with the existing assessment.
      this.router.navigate(['/create-job-step3']);
    }
  }
  
  onSkip() {
    this.openAlert('Are you sure you want to skip adding an assessment?', ['Cancel', 'Skip']);
  }

  onCancel() {
    const message = this.isEditMode 
      ? 'Are you sure you want to cancel? Your changes will not be saved.' 
      : 'Are you sure you want to cancel this new job post?';
    this.openAlert(message, ['No', 'Yes, Cancel']);
  }
  
  onSaveDraft() {
    this.openAlert('Do you want to save your progress and exit?', ['Cancel', 'Save & Exit']);
  }

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

  private onSkipConfirmed(): void {
    this.router.navigate(['/create-job-step3']);
  }

  private onCancelConfirmed(): void {
    this.workflowService.clearWorkflow();
    const message = this.isEditMode ? 'Job post editing cancelled.' : 'Job post creation cancelled.';
    this.showSuccessPopup(message);
    setTimeout(() => this.router.navigate(['/job-post-list']), 2000);
  }
  
  private onSaveDraftConfirmed(): void {
    // Note: The backend must handle the "draft" status on Step 1.
    // This action simply exits the flow.
    this.workflowService.clearWorkflow();
    this.showSuccessPopup('Your draft has been saved.');
    setTimeout(() => this.router.navigate(['/job-post-list']), 2000);
  }

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