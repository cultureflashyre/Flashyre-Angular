// src/app/pages/create-job-post-3rd-page/create-job-post-3rd-page.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { formatDate } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { JobCreationWorkflowService } from '../../services/job-creation-workflow.service';
import { CorporateAuthService } from '../../services/corporate-auth.service';
import { InterviewService, InterviewStage } from '../../services/interview.service';

@Component({
  selector: 'app-create-job-post-3rd-page',
  templateUrl: './create-job-post-3rd-page.component.html',
  styleUrls: ['./create-job-post-3rd-page.component.css']
})
export class CreateJobPost3rdPageComponent implements OnInit {
  interviewForm: FormGroup;
  jobUniqueId: string | null = null;
  isLoading = true;
  isSubmitting = false;
  minDate = new Date(); // For the date picker
  minDateString: string; // For HTML5 date input

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private snackBar: MatSnackBar,
    private workflowService: JobCreationWorkflowService,
    private authService: CorporateAuthService,
    private interviewService: InterviewService
  ) {}

  ngOnInit(): void {
    this.jobUniqueId = this.workflowService.getCurrentJobId();
    if (!this.jobUniqueId) {
      this.snackBar.open('No active job creation flow found. Please start again.', 'Close', { duration: 4000 });
      this.router.navigate(['/create-job-post-1st-page']);
      return;
    }

    // Convert minDate to YYYY-MM-DD format for HTML5 input
    const today = new Date();
    this.minDateString = today.toISOString().split('T')[0];

    this.interviewForm = this.fb.group({
      stages: this.fb.array([])
    });

    this.addStage(); // Start with one default stage
    this.isLoading = false;
  }

  // Getter for easy access to the FormArray in the template
  get stages(): FormArray {
    return this.interviewForm.get('stages') as FormArray;
  }

  // Creates a FormGroup for a single interview stage row
  private createStageGroup(): FormGroup {
    const stageGroup = this.fb.group({
      stage_name: ['Screening', Validators.required],
      custom_stage_name: [''], // Hidden by default
      stage_date: [null, Validators.required],
      mode: ['Online', Validators.required],
      assigned_to: ['', [Validators.required, Validators.email]]
    });

    // Add a listener to handle the "Customize" option
    stageGroup.get('stage_name')?.valueChanges.subscribe(value => {
      const customNameControl = stageGroup.get('custom_stage_name');
      if (value === 'Customize') {
        customNameControl?.setValidators(Validators.required);
      } else {
        customNameControl?.clearValidators();
      }
      customNameControl?.updateValueAndValidity();
    });

    return stageGroup;
  }

  // Adds a new stage to the FormArray
  addStage(): void {
    this.stages.push(this.createStageGroup());
  }

  // Removes a stage from the FormArray at a specific index
  removeStage(index: number): void {
    if (this.stages.length > 1) { // Prevent removing the last stage
      this.stages.removeAt(index);
    } else {
      this.snackBar.open('You must have at least one interview stage.', 'Close', { duration: 3000 });
    }
  }

  // Footer Event Handlers
  onCancel(): void {
    // Navigate back to dashboard or show confirmation dialog
    if (confirm('Are you sure you want to cancel? All unsaved changes will be lost.')) {
      this.workflowService.clearWorkflow();
      this.router.navigate(['/create-job-post-1st-page']);
    }
  }

  onPrevious(): void {
    // Navigate to the previous step in the job creation workflow
    this.router.navigate(['/create-job-post-22-page']);
  }

  onSaveDraft(): void {
    // Since you don't want draft functionality, we'll show a message
    this.snackBar.open('Draft functionality is not available. Please complete the form and click Next.', 'Close', { duration: 4000 });
  }

  onSkip(): void {
    // Skip the interview process and complete job creation
    if (confirm('Are you sure you want to skip the interview process? You can add it later.')) {
      this.snackBar.open('Interview process skipped. Job post created successfully!', 'Close', { duration: 3000 });
      this.workflowService.clearWorkflow();
      this.router.navigate(['/create-job-post-1st-page']);
    }
  }

  onNext(): void {
    // This will be the same as your current onSubmit logic
    this.onSubmit();
  }

  onSubmit(): void {
    if (this.interviewForm.invalid) {
      this.snackBar.open('Please fill all required fields correctly.', 'Close', { duration: 4000 });
      this.interviewForm.markAllAsTouched();
      return;
    }

    if (!this.jobUniqueId) { /* ... guard clauses ... */ return; }
    const token = this.authService.getJWTToken();
    if (!token) { /* ... guard clauses ... */ return; }
    
    this.isSubmitting = true;

    const formStages = this.stages.value;
    const payload: InterviewStage[] = formStages.map((stage: any, index: number) => ({
      stage_name: stage.stage_name === 'Customize' ? stage.custom_stage_name : stage.stage_name,
      stage_date: formatDate(stage.stage_date, 'yyyy-MM-dd', 'en-US'),
      mode: stage.mode,
      assigned_to: stage.assigned_to,
      order: index + 1
    }));

    // MODIFICATION: Call the new finalizeJobPost service method
    this.interviewService.finalizeJobPost(this.jobUniqueId, payload, token).subscribe({
      next: () => {
        this.snackBar.open('Job post has been published successfully!', 'Close', { duration: 4000 });
        this.workflowService.clearWorkflow();
        
        // MODIFICATION: Navigate back to the first page as requested
        this.router.navigate(['/create-job-post-1st-page']);
        this.isSubmitting = false;
      },
      error: (err) => {
        this.snackBar.open(`Finalization failed: ${err.message || 'An unknown server error occurred.'}`, 'Close', { duration: 5000 });
        this.isSubmitting = false;
      }
    });
  }
}