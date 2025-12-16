import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

// Import all new child components and services
import { ProgressBarComponent } from './components/create-job-progress-bar/create-job-progress-bar.component';
import { JobDetailsFormComponent } from './components/job-details-form/job-details-form.component';
import { AssessmentSetupComponent } from './components/assessment-setup/assessment-setup.component';
import { InterviewFlowComponent } from './components/interview-flow/interview-flow.component';
import { AdminJobCreationWorkflowService } from '../../services/admin-job-creation-workflow.service';
import { AdminJobDescriptionService } from '../../services/admin-job-description.service';
import { InterviewService } from '../../services/interview.service';
import { CorporateAuthService } from '../../services/corporate-auth.service';
import { NgxSpinnerService, NgxSpinnerModule } from 'ngx-spinner';

@Component({
  selector: 'app-job-posting-workflow',
  standalone: true,
  imports: [
    CommonModule, NgxSpinnerModule,
    ProgressBarComponent, JobDetailsFormComponent, AssessmentSetupComponent, InterviewFlowComponent
  ],
  templateUrl: './job-posting-workflow.component.html',
  styleUrls: ['./job-posting-workflow.component.css']
})
export class JobPostingWorkflowComponent implements OnInit {
  currentStep = 1;
  stepLabels = ['Job Details', 'Assessment Setup', 'Interview Flow'];
  totalSteps = this.stepLabels.length;

  jobUniqueId: string | null = null;
  isEditMode = false;
  isSubmitting = false;

  // Data from child components
  jobDetailsData: any = null;
  assessmentData: any = null;
  interviewData: any[] = [];

  // Validity status from child components
  isStep1Valid = false;
  isStep2Valid = false;
  isStep3Valid = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private workflowService: AdminJobCreationWorkflowService,
    private jobService: AdminJobDescriptionService,
    private interviewService: InterviewService,
    private authService: CorporateAuthService,
    private spinner: NgxSpinnerService
  ) {}

  ngOnInit(): void {
    const idFromRoute = this.route.snapshot.paramMap.get('id');
    if (idFromRoute) {
      this.isEditMode = true;
      this.jobUniqueId = idFromRoute;
      this.workflowService.startEditWorkflow(this.jobUniqueId);
    } else {
        this.workflowService.clearWorkflow();
    }
  }

  // --- Step Navigation ---
  goToNextStep(): void {
    if (this.currentStep === 1 && !this.isStep1Valid) return;
    if (this.currentStep === 2 && !this.isStep2Valid) return;

    if (this.currentStep < this.totalSteps) {
        if (this.currentStep === 1) {
            this.saveStep1AndProceed();
        } else if (this.currentStep === 2) {
            this.saveStep2AndProceed();
        }
    }
  }

  goToPreviousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  // --- Data and Validity Handlers from Children ---
  handleJobDetailsUpdate(data: any) { this.jobDetailsData = data; }
  handleJobDetailsValidity(isValid: boolean) { this.isStep1Valid = isValid; }
  handleAssessmentUpdate(data: any) { this.assessmentData = data; }
  handleAssessmentValidity(isValid: boolean) { this.isStep2Valid = isValid; }
  handleInterviewUpdate(data: any[]) { this.interviewData = data; }
  handleInterviewValidity(isValid: boolean) { this.isStep3Valid = isValid; }

  // --- API Actions ---
  saveStep1AndProceed(): void {
    if (!this.isStep1Valid) return;
    this.isSubmitting = true;
    this.spinner.show();

    const token = this.authService.getJWTToken();
    if (!token) { this.spinner.hide(); return; }

    const operation = this.jobUniqueId
      ? this.jobService.updateJobPost(this.jobUniqueId, this.jobDetailsData, token)
      : this.jobService.saveJobPost(this.jobDetailsData, token);

    operation.subscribe({
      next: (res) => {
        if (!this.jobUniqueId) {
          this.jobUniqueId = res.unique_id;
          this.isEditMode = true;
          this.workflowService.startWorkflow(this.jobUniqueId);
        }
        this.currentStep++;
      },
      error: (err) => console.error("Failed to save job details", err),
      complete: () => {
        this.isSubmitting = false;
        this.spinner.hide();
      }
    });
  }
  
  saveStep2AndProceed(): void {
    console.log("Saving Assessment Data:", this.assessmentData);
    // In a real app, you would have an API call here to save assessment data
    this.currentStep++;
  }

  onSaveDraft(): void {
    this.isSubmitting = true;
    this.spinner.show();
    console.log("Saving workflow as draft...");
    // This would gather all data (jobDetails, assessment, interview) and send to a draft endpoint
    setTimeout(() => {
      this.isSubmitting = false;
      this.spinner.hide();
      this.router.navigate(['/job-post-list']);
    }, 1500);
  }

  onFinalizeJob(): void {
    if (!this.isStep3Valid) {
        console.error("Cannot finalize: Interview form is invalid.");
        return;
    }
    this.isSubmitting = true;
    this.spinner.show();
    
    const token = this.authService.getJWTToken();
    if (!token) { this.spinner.hide(); return; }

    this.interviewService.finalizeJobPost(this.jobUniqueId!, this.interviewData, token).subscribe({
      next: () => {
        this.workflowService.clearWorkflow();
        // Optionally show a success message before navigating
        this.router.navigate(['/job-post-list']);
      },
      error: (err) => console.error("Failed to finalize job", err),
      complete: () => {
        this.isSubmitting = false;
        this.spinner.hide();
      }
    });
  }
}