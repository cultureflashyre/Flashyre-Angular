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

import { RouterModule } from '@angular/router'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'

import { NgxSpinner } from 'ngx-spinner';
import { NavbarForAdminView } from 'src/app/components/navbar-for-admin-view/navbar-for-admin-view.component';
import { AlertMessageComponent } from 'src/app/components/alert-message/alert-message.component';
import { ProgressBar2Code } from 'src/app/components/progress-bar-2-code/progress-bar-2-code.component';
import { CreateJobPostFooter2 } from 'src/app/components/create-job-post-footer-2/create-job-post-footer-2.component';

import { NgxSpinnerModule } from 'ngx-spinner';

@Component({
  selector: 'create-job-step2',
  standalone: true,
  imports: [ RouterModule, FormsModule, CommonModule,
    NavbarForAdminView, AlertMessageComponent,
    ProgressBar2Code, CreateJobPostFooter2, NgxSpinnerModule,
  ],
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

  questionsAreReady: boolean = false;
  aiQuestionsGenerated: boolean = false;

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

  // MODIFICATION: Add a new property to store the original filename from the server.
  // This helps differentiate between a saved state and a new user selection.
  private initialUploadedFileName: string | null = null;

  constructor(
    private title: Title,
    private meta: Meta,
    private router: Router,
    private route: ActivatedRoute,
    private jobDescriptionService: AdminJobDescriptionService,
    private corporateAuthService: CorporateAuthService,
    private workflowService: AdminJobCreationWorkflowService,
    private spinner: NgxSpinnerService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.title.setTitle('Assessment Setup - Flashyre');
    this.meta.addTags([
      { property: 'og:title', content: 'Assessment Setup - Flashyre' },
    ]);

    if (!this.corporateAuthService.isLoggedIn()) {
      this.showErrorPopup('Your session has expired. Please log in again.');
      this.router.navigate(['/login']);
      return;
    }

    const jobIdFromRoute = this.route.snapshot.paramMap.get('jobId');
    const jobIdFromWorkflow = this.workflowService.getCurrentJobId();

    if (jobIdFromRoute) {
      this.jobUniqueId = jobIdFromRoute;
      this.workflowService.startEditWorkflow(this.jobUniqueId);
    } else {
      this.jobUniqueId = jobIdFromWorkflow;
    }

    this.isEditMode = this.workflowService.getIsEditMode();
    
    if (!this.jobUniqueId) {
      this.showErrorPopup('No active job post found. Redirecting to Step 1.');
      this.router.navigate(['/create-job']);
      return;
    }

    this.checkInitialMcqStatus();
    this.loadUserProfile();
  }


  /**
   * Parses a filename to remove the UUID prefix added by the backend.
   * e.g., "8cc50d1f-...._original_name.xlsx" becomes "original_name.xlsx"
   * @param fullFileName The filename returned from the backend.
   * @returns The cleaned, original filename.
   */
  private parseFileName(fullFileName: string): string {
    if (!fullFileName) {
      return '';
    }
    // This regex matches a 36-character UUID followed by an underscore at the start of the string.
    const uuidPrefixRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}_/i;
    if (uuidPrefixRegex.test(fullFileName)) {
      // If the pattern matches, return the substring that comes after the 37-character prefix.
      return fullFileName.substring(37);
    }
    // If the pattern doesn't match, return the original filename as a fallback.
    return fullFileName;
  }

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
          const questionsExist = response.status !== 'not_started';
          this.questionsAreReady = questionsExist;

          if (response.filename) {
            const cleanFileName = this.parseFileName(response.filename);
            this.uploadedFileName = cleanFileName;
            this.initialUploadedFileName = cleanFileName;
            this.aiQuestionsGenerated = false; // Questions came from a file
          } else if (questionsExist) {
            this.aiQuestionsGenerated = true; // Questions exist but no file, so they must be AI-generated
          }
        },
        error: (err) => {
          //this.hasGenerated = false;
          console.error('Failed to check MCQ status:', err);
          this.showErrorPopup('Could not verify existing assessment questions.');
        }
      });
    this.subscriptions.add(sub);
  }


  /**
   * MODIFICATION: New "gatekeeper" method for the Upload button.
   * It checks if a file already exists and shows a confirmation alert before proceeding.
   */
  handleUploadClick(): void {
    if (this.isGenerating) return;

    // If a file was already saved on the server, a confirmation is required.
    if (this.initialUploadedFileName) {
      this.openAlert(
        'Uploading a new file will permanently replace the existing questions. Are you sure you want to proceed?',
        ['Cancel', 'Continue']
      );
    } else {
      // If no file has ever been uploaded, open the popup directly.
      this.openUploadPopup();
    }
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
      this.uploadedFileName = file.name; // Update UI to show the newly selected file name
      // MODIFICATION: Enable 'Next' button, but set AI generation state to false.
      this.questionsAreReady = true; 
      //this.aiQuestionsGenerated = false; // This ensures the AI button label remains "Generate with AI"

      this.closeUploadPopup();
    }
  }

  onPrevious(): void {
    if(this.jobUniqueId) {
        this.router.navigate(['/create-job', this.jobUniqueId]);
    } else {
        this.router.navigate(['/create-job']);
    }
  }

  onNext(): void {
    if (!this.questionsAreReady) {
      this.showErrorPopup('Please generate or upload questions before proceeding.');
      return;
    }
    
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
      // MODIFICATION: Handle the 'Continue' action from the re-upload confirmation.
      case 'continue':
        this.openUploadPopup(); // Opens the upload card after user confirms.
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
    this.workflowService.clearWorkflow();
    this.showSuccessPopup('Your draft has been saved.');
    setTimeout(() => this.router.navigate(['/job-post-list']), 2000);
  }
  
  // --- Unchanged methods from here ---

  onGenerateAi(): void {
    if (!this.jobUniqueId || this.isGenerating) return;
    const token = this.corporateAuthService.getJWTToken();
    if (!token) {
      this.showErrorPopup('Authentication error. Please log in again.');
      this.router.navigate(['/login']);
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
          // MODIFICATION: Set both states to true after successful AI generation.
          this.questionsAreReady = true;
          this.aiQuestionsGenerated = true;

          // MODIFICATION: Clear any previously uploaded file to avoid confusion.
          //this.selectedExcelFile = null;
          //this.uploadedFileName = null;
          //this.initialUploadedFileName = null;

          this.showSuccessPopup(response.message || 'Assessment questions generated successfully!');
        },
        error: (err) => {
          this.showErrorPopup(`Error: ${err.message || 'Could not generate questions.'}`);
        }
      });
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