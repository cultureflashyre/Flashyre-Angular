// src/app/pages/create-job-post-3rd-page/create-job-post-3rd-page.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { JobCreationWorkflowService } from '../../services/job-creation-workflow.service';
import { CorporateAuthService } from '../../services/corporate-auth.service';
import { InterviewService, InterviewStage } from '../../services/interview.service';
import { formatDate } from '@angular/common';

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

  onSubmit(): void {
    if (this.interviewForm.invalid) {
      this.snackBar.open('Please fill all required fields correctly.', 'Close', { duration: 4000 });
      // This will trigger validation messages in the template
      this.interviewForm.markAllAsTouched();
      return;
    }

    if (!this.jobUniqueId) {
      this.snackBar.open('Job context is missing. Cannot save.', 'Close');
      return;
    }
    const token = this.authService.getJWTToken();
    if (!token) {
      this.snackBar.open('Authentication error. Please log in again.', 'Close');
      return;
    }
    
    this.isSubmitting = true;

    // Construct the payload
    const formStages = this.stages.value;
    const payload: InterviewStage[] = formStages.map((stage: any, index: number) => ({
      stage_name: stage.stage_name === 'Customize' ? stage.custom_stage_name : stage.stage_name,
      // Format the date to YYYY-MM-DD for the Django backend
      stage_date: formatDate(stage.stage_date, 'yyyy-MM-dd', 'en-US'),
      mode: stage.mode,
      assigned_to: stage.assigned_to,
      order: index + 1
    }));

    this.interviewService.saveInterviewStages(this.jobUniqueId, payload, token).subscribe({
      next: () => {
        this.snackBar.open('Job post and interview stages saved successfully!', 'Close', { duration: 3000 });
        this.workflowService.clearWorkflow(); // End the workflow
        this.router.navigate(['/dashboard']); // Navigate to the final destination
        this.isSubmitting = false;
      },
      error: (err) => {
        this.snackBar.open(`Save failed: ${err.message || 'Unknown error'}`, 'Close', { duration: 5000 });
        this.isSubmitting = false;
      }
    });
  }
}