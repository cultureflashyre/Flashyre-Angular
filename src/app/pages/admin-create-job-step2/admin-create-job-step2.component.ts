import { Component, OnInit, OnDestroy } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { NgxSpinnerService } from 'ngx-spinner';
import { AdminJobDescriptionService } from '../../services/admin-job-description.service';
import { CorporateAuthService } from '../../services/corporate-auth.service';
import { AdminJobCreationWorkflowService } from '../../services/admin-job-creation-workflow.service';

@Component({
  selector: 'admin-create-job-step2',
  templateUrl: 'admin-create-job-step2.component.html',
  styleUrls: ['admin-create-job-step2.component.css'],
})
export class AdminCreateJobStep2 implements OnInit, OnDestroy {
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

  constructor(
    private title: Title,
    private meta: Meta,
    private router: Router,
    private jobDescriptionService: AdminJobDescriptionService,
    private corporateAuthService: CorporateAuthService,
    private workflowService: AdminJobCreationWorkflowService,
    private spinner: NgxSpinnerService
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

    // ✅ CRITICAL: Validate jobUniqueId before proceeding
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
          this.hasGenerated = response.has_mcqs;
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
    // ✅ Guard against undefined jobUniqueId
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
          this.showSuccessPopup(response.message || 'Assessment questions have been generated!');
        },
        error: (err) => {
          this.showErrorPopup(`Error: ${err.message || 'Could not generate questions.'}`);
        }
    });
    this.subscriptions.add(generateSub);
  }

  onUploadManually(): void {
    this.showSuccessPopup('Manual upload is not yet implemented. You can now proceed.');
    this.hasGenerated = true;
  }

  onCancel(): void {
    this.workflowService.clearWorkflow();
    this.showSuccessPopup('Job post creation cancelled.');
    setTimeout(() => {
        this.router.navigate(['/admin-page1']);
    }, 3000);
  }

  onPrevious(): void {
    this.router.navigate(['/admin-create-job-step1']);
  }

  onSkip(): void {
    this.router.navigate(['/admin-create-job-step3']);
  }

  onSaveDraft(): void {
    this.workflowService.clearWorkflow();
    this.showSuccessPopup('Your draft has been saved.');
    setTimeout(() => {
        this.router.navigate(['/admin-page1']);
    }, 3000);
  }

  onNext(): void {
    if (this.jobUniqueId && this.hasGenerated) {
      this.router.navigate(['/admin-create-job-step3']);
    } else if (!this.hasGenerated) {
        this.showErrorPopup('Please generate or upload questions before proceeding.');
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}