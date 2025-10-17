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
  hasGenerated: boolean = false;
  isLoading: boolean = true;
  private subscriptions = new Subscription();
  showPopup: boolean = false;
  popupMessage: string = '';
  popupType: 'success' | 'error' = 'success';
  rawp46g: string = ' ';
  rawliiy: string = ' ';

  showAlert = false;
  alertMessage = '';
  alertButtons: string[] = [];
  private actionContext: { action: string } | null = null;

  // File Upload variables
  showUploadPopup = false;
  uploadedFileName: string | null = null;
  selectedExcelFile: File | null = null;
  isUploading = false;
  uploadedExcelFileUrl: string | null = null;

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
    this.title.setTitle('Admin Step 2: Generate Assessment - Flashyre');
    this.meta.addTags([
      {
        property: 'og:title',
        content: 'Admin Step 2: Generate Assessment - Flashyre',
      },
      {
        property: 'og:image',
        content:
          'https://aheioqhobo.cloudimg.io/v7/_playground-bucket-v2.teleporthq.io_/8203932d-6f2d-4493-a7b2-7000ee521aa2/9aea8e9c-27ce-4011-a345-94a92ae2dbf8?org_if_sml=1&force_format=original',
      },
    ]);

    if (!this.corporateAuthService.isLoggedIn()) {
      this.showErrorPopup('Your session has expired. Please log in again.');
      this.router.navigate(['/login-corporate']);
      return;
    }

    this.jobUniqueId = this.workflowService.getCurrentJobId();

    if (!this.jobUniqueId || this.jobUniqueId === 'undefined') {
      this.showErrorPopup('No active job post found. Redirecting to Step 1.');
      setTimeout(() => {
        this.router.navigate(['/admin-create-job-step1']);
      }, 1000);
      return;
    }

    this.checkInitialMcqStatus();
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

  /**
   * CORRECTED: This method now correctly checks the new status object.
   */
  private checkInitialMcqStatus(): void {
    if (!this.jobUniqueId || this.jobUniqueId === 'undefined') {
      this.hasGenerated = false;
      this.isLoading = false;
      return;
    }

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
          // Check if the process has started or is completed.
          this.hasGenerated = response.status !== 'not_started';
        },
        error: (err) => {
          this.hasGenerated = false;
          console.error('Failed to check MCQ status:', err);
          this.showErrorPopup('Could not verify existing assessment questions.');
        }
      });
    this.subscriptions.add(sub);
  }

  onGenerateAi(): void {
    if (!this.jobUniqueId || this.jobUniqueId === 'undefined') {
      this.showErrorPopup('Invalid job ID. Please return to Step 1.');
      return;
    }
    if (this.isGenerating) return;

    const token = this.corporateAuthService.getJWTToken();
    if (!token) {
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
          this.hasGenerated = true; 
          this.showSuccessPopup('MCQ generation has started! You can proceed to the next step.');
        },
        error: (err) => {
          this.hasGenerated = false;
          this.showErrorPopup(`Error: ${err.message || 'Could not start question generation.'}`);
        }
      });
    this.subscriptions.add(generateSub);
  }
  
  onUploadManually(): void {
    this.showSuccessPopup('Manual upload is not yet implemented. You can now proceed.');
    this.hasGenerated = true;
  }

  openUploadPopup() {
    this.showUploadPopup = true;
  }

  closeUploadPopup() {
    this.showUploadPopup = false;
  }

  downloadTemplate() {
    const templateUrl = environment.mcq_upload_template;
    const link = document.createElement('a');
    link.href = templateUrl;
    link.download = 'mcq_question_upload_template_flashyre_mcq_questions_template.xlsx';
    link.click();
  }

  onFileSelected(event: Event) {
    this.hasGenerated = true;

    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.uploadedFileName = file.name;
      this.selectedExcelFile = input.files[0];
    }
  }

  onCancel(): void {
    this.actionContext = { action: 'cancel' };
    this.openAlert('Are you sure you want to cancel? This will delete the job post draft.', ['No', 'Yes, Cancel']);
  }

  onPrevious(): void {
    this.actionContext = { action: 'previous' };
    this.openAlert('Do you want to go back to the previous step?', ['Cancel', 'Go Back']);
  }

  onSkip(): void {
    this.actionContext = { action: 'skip' };
    this.openAlert('Are you sure you want to skip adding an assessment?', ['Cancel', 'Skip']);
  }

  onSaveDraft(): void {
    this.actionContext = { action: 'saveDraft' };
    this.openAlert('Do you want to save this as a draft and exit?', ['Cancel', 'Save Draft']);
  }

  onNext(): void {
    if (!this.hasGenerated) {
      this.showErrorPopup('Please generate or upload questions before proceeding.');
      return;
    }
    this.actionContext = { action: 'next' };
    this.openAlert('Proceed to the next step?', ['Cancel', 'Next']);
  }

  onCancelConfirmed(): void {
    this.workflowService.clearWorkflow();
    this.showSuccessPopup('Job post creation cancelled.');
    setTimeout(() => {
        this.router.navigate(['/admin-create-job-step1']);
    }, 3000);
  }

  onPreviousConfirmed(): void {
    this.router.navigate(['/admin-create-job-step1']);
  }

  onSkipConfirmed(): void {
    this.router.navigate(['/admin-create-job-step3']);
  }

  onSaveDraftConfirmed(): void {
    this.workflowService.clearWorkflow();
    this.showSuccessPopup('Your draft has been saved.');
    setTimeout(() => {
        this.router.navigate(['/admin-create-job-step1']);
    }, 3000);
  }

  onNextConfirmed(): void {
    if (this.selectedExcelFile) {
      this.isUploading = true;
      // Show spinner with a specific message for file processing
      this.spinner.show('ai-spinner', {
        bdColor: "rgba(0, 0, 0, 0.8)",
        size: "medium",
        color: "#fff",
        type: "ball-scale-multiple",
        template: "<p style='color: white; font-size: 18px;'>Processing your file...</p>"
      });
      
      const token = this.authService.getJWTToken();

      this.jobDescriptionService.uploadExcelFile(this.selectedExcelFile, this.jobUniqueId!, token)
        .pipe(
          finalize(() => {
            // This ensures spinner is hidden and flags are reset, even on error
            this.isUploading = false;
            this.spinner.hide('ai-spinner');
          })
        )
        .subscribe({
          next: (response) => {
            this.hasGenerated = true; // Mark as generated
            
            // Store the complete MCQ data in the workflow service.
            if (response.uploaded_mcqs) {
              console.log("Storing uploaded MCQs in workflow service:", response.uploaded_mcqs);
              this.workflowService.setUploadedMcqs(response.uploaded_mcqs);
            } else {
              console.warn("Upload successful, but no MCQ data was returned from the backend.");
            }
            
            // Navigate AFTER data has been received and stored.
            this.router.navigate(['/admin-create-job-step3']);
          },
          error: (error) => {
            this.showErrorPopup(`Upload failed: ${error.message || 'Unknown error'}`);
          }
        });

    } else if (this.jobUniqueId && this.hasGenerated) {
      // Handle navigation for AI-generated questions
      this.router.navigate(['/admin-create-job-step3']);
    } else {
      this.showErrorPopup('Please generate or upload questions before proceeding.');
    }
  }

  
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  loadUserProfile(): void {
    const profileData = localStorage.getItem('userProfile');
    if (profileData) this.userProfile = JSON.parse(profileData);
  }

  private openAlert(message: string, buttons: string[]) {
    this.alertMessage = message;
    this.alertButtons = buttons;
    this.showAlert = true;
  }

  onAlertButtonClicked(action: string) {
    this.showAlert = false;
    if (action.toLowerCase() === 'cancel' || action.toLowerCase() === 'no') {
      this.actionContext = null;
      return;
    }
    
    if (this.actionContext) {
      switch (this.actionContext.action) {
        case 'cancel': this.onCancelConfirmed(); break;
        case 'previous': this.onPreviousConfirmed(); break;
        case 'skip': this.onSkipConfirmed(); break;
        case 'saveDraft': this.onSaveDraftConfirmed(); break;
        case 'next': this.onNextConfirmed(); break;
      }
      this.actionContext = null;
    }
  }
}