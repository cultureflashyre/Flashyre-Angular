// src/app/pages/create-job-post-3rd-page/create-job-post-3rd-page.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { formatDate } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { JobCreationWorkflowService } from '../../services/job-creation-workflow.service';
import { CorporateAuthService } from '../../services/corporate-auth.service';
import { InterviewService, InterviewStage, InterviewStageData } from '../../services/interview.service';

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

  // MODIFICATION: Add a new property to control the popup's visibility
  showSuccessPopup = false;

    // State for alert-message component
  showAlert = false;
  alertMessage = '';
  alertButtons: string[] = []; // e.g., ['yes', 'no'], ['cancel', 'continue'], etc.
  private pendingAction: string = '';

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

    // MODIFIED: Call a new method to load data
    this.loadInterviewStages();
  }

  private loadInterviewStages(): void {
    const token = this.authService.getJWTToken();
    if (!this.jobUniqueId || !token) {
        this.addStage(); // Add one empty stage if we can't load
        this.isLoading = false;
        return;
    }

    this.isLoading = true;
    this.interviewService.getInterviewStages(this.jobUniqueId, token).subscribe({
        next: (stagesData) => {
            if (stagesData && stagesData.length > 0) {
                // Clear any default stages
                this.stages.clear();
                // Populate the form array with data from the backend
                stagesData.forEach(stage => {
                    this.stages.push(this.createStageGroupWithData(stage));
                });
            } else {
                // If no stages exist, add one empty default stage
                this.addStage();
            }
            this.isLoading = false;
        },
        error: (err) => {
            console.error("Failed to load interview stages:", err);
            this.snackBar.open('Could not load existing interview stages.', 'Close', { duration: 3000 });
            this.addStage(); // Add a default stage on error
            this.isLoading = false;
        }
    });
  }

  // ADD THIS NEW HELPER METHOD
  private createStageGroupWithData(data: InterviewStageData): FormGroup {
    // Determine if the stage name is a standard one or custom
    const standardStages = ['Screening', 'Technical interview - 1', 'Technical interview - 2', 'HR interview'];
    const isCustom = !standardStages.includes(data.stage_name);

    const stageGroup = this.fb.group({
      stage_name: [isCustom ? 'Customize' : data.stage_name, Validators.required],
      custom_stage_name: [isCustom ? data.stage_name : ''],
      stage_date: [data.stage_date, Validators.required],
      mode: [data.mode, Validators.required],
      assigned_to: [data.assigned_to, [Validators.required, Validators.email]]
    });

    // Set up the listener for the 'Customize' option
    if (isCustom) {
        stageGroup.get('custom_stage_name')?.setValidators(Validators.required);
    }
    stageGroup.get('stage_name')?.valueChanges.subscribe(value => {
        // ... (existing listener logic from createStageGroup)
    });

    return stageGroup;
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

  validateDateInput(event: Event, stageControl: AbstractControl) {
    const inputElement = event.target as HTMLInputElement;
    const dateControl = stageControl.get('stage_date');

    if (!dateControl) {
      return;
    }

    // The browser's `validity.badInput` is true for malformed/invalid values
    if (inputElement.validity.badInput) {
      // Manually set a custom error to distinguish from a simple 'required' error
      dateControl.setErrors({ 'invalidDate': true });
    } else if (dateControl.hasError('invalidDate')) {
      // If the input is no longer bad (e.g., user corrected it or deleted it),
      // we must clear our custom error to let other validators work correctly.
      dateControl.setErrors(null);
      dateControl.updateValueAndValidity(); // Re-run other validators like 'required'
    }
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
      order: index + 1,
      user_id: localStorage.getItem('user_id')
    }));

    console.log("payload: ", payload);

    // MODIFICATION: Call the new finalizeJobPost service method
    this.interviewService.finalizeJobPost(this.jobUniqueId, payload, token).subscribe({
      next: () => {
        this.showSuccessPopup = true;

        // 2. Set a 5-second timer to clear the workflow and navigate
        setTimeout(() => {
          this.workflowService.clearWorkflow();
          this.router.navigate(['/recruiter-view-3rd-page1']);
          // Optional: hide the popup right before navigation
          this.showSuccessPopup = false; 
        }, 5000); // 5000 milliseconds = 5 seconds

        // isSubmitting can be set to false immediately or after the timeout
        this.isSubmitting = false;
      },
      error: (err) => {
        this.snackBar.open(`Finalization failed: ${err.message || 'An unknown server error occurred.'}`, 'Close', { duration: 5000 });
        this.isSubmitting = false;
      }
    });
  }


  // Footer button handlers:
  onCancel(): void {
    this.openAlert('You are about to Cancel this action. All unsaved changes will be lost.', ['Cancel', 'Yes']);
    this.pendingAction = 'cancel';
  }

  onPrevious(): void {
    this.openAlert('Are you sure you want to go to the previous step?', ['Cancel', 'Continue']);
    this.pendingAction = 'previous';
  }

  onSaveDraft(): void {
    this.openAlert('You are about to save this as a draft.', ['Cancel', 'Save Draft']);
    this.pendingAction = 'saveDraft';
  }

  onSkip(): void {
    this.openAlert('You are about to skip the interview process. You can add it later.', ['Cancel', 'Continue']);
    this.pendingAction = 'skip';
  }

  onNext(): void {
    // For safety, add a confirmation as well (adapt as desired):
    this.openAlert('Are you sure you want to save the interview process?', ['Cancel', 'Save']);
    this.pendingAction = 'next';
  }

  // Alert button handling:
  onAlertButtonClicked(action: string) {
    this.showAlert = false;

    switch (this.pendingAction) {
      case 'cancel':
        if (action.toLowerCase() === 'yes') {
          this.onCancelConfirmed();
        }
        break;

      case 'previous':
        if (action.toLowerCase() === 'continue') {
          this.router.navigate(['/create-job-post-22-page']);
        }
        break;

      case 'saveDraft':
        if (action.toLowerCase() === 'save draft') {
          this.onSaveDraftConfirmed();
        }
        break;

      case 'skip':
        if (action.toLowerCase() === 'continue') {
          this.onSkipConfirmed();
        }
        break;

      case 'next':
        if (action.toLowerCase() === 'save') {
          this.onSubmit(); // submit form
        }
        break;
      default:
        break;
    }
    // Cancel, No, or dismissal does nothing further.
    this.pendingAction = '';
  }

  onCancelConfirmed() {
    this.workflowService.clearWorkflow();
    this.router.navigate(['/create-job-post-1st-page']);
  }

 // onSaveDraftConfirmed() {
  //  this.snackBar.open('Draft functionality is not available. Please complete the form and click Next.', 'Close', { duration: 4000 });
  //}

  onSaveDraftConfirmed(): void {
    // Mark all fields as touched to show validation errors on fields that are filled incorrectly.
    this.interviewForm.markAllAsTouched();
    if (this.interviewForm.invalid) {
      this.snackBar.open('Please correct the errors before saving a draft.', 'Close', { duration: 4000 });
      return;
    }

    if (!this.jobUniqueId) {
      this.snackBar.open('Cannot save draft: Job ID is missing.', 'Close', { duration: 4000 });
      return;
    }
    const token = this.authService.getJWTToken();
    if (!token) {
      this.snackBar.open('Cannot save draft: Authentication token is missing.', 'Close', { duration: 4000 });
      return;
    }

    this.isSubmitting = true; // Disable buttons during the save operation

    const formStages = this.stages.value;
    const payload: InterviewStage[] = formStages.map((stage: any, index: number) => ({
      stage_name: stage.stage_name === 'Customize' ? stage.custom_stage_name : stage.stage_name,
      stage_date: formatDate(stage.stage_date, 'yyyy-MM-dd', 'en-US'),
      mode: stage.mode,
      assigned_to: stage.assigned_to,
      order: index + 1,
      user_id: localStorage.getItem('user_id')
    }));
    
    // Call the new service method
    this.interviewService.saveDraftStages(this.jobUniqueId, payload, token).subscribe({
      next: () => {
        this.snackBar.open('Draft saved successfully!', 'Close', { duration: 3000 });
        this.isSubmitting = false;
        // Mark the form as pristine again after a successful save
        this.interviewForm.markAsPristine();
      },
      error: (err) => {
        this.snackBar.open(`Draft save failed: ${err.message || 'An unknown server error occurred.'}`, 'Close', { duration: 5000 });
        this.isSubmitting = false;
      }
    });
  }

 // onSkipConfirmed() {
   // this.snackBar.open('Interview process skipped. Job post created successfully!', 'Close', { duration: 3000 });
    //this.workflowService.clearWorkflow();
    //this.router.navigate(['/create-job-post-1st-page']);
  //}


  onSkipConfirmed() {
    if (!this.jobUniqueId) {
      this.snackBar.open('No job ID found. Please start again.', 'Close', { duration: 4000 });
      this.router.navigate(['/create-job-post-1st-page']);
      return;
    }
    const token = this.authService.getJWTToken();
    if (!token) {
      this.snackBar.open('Authentication error. Please log in again.', 'Close', { duration: 4000 });
      this.router.navigate(['/login-corporate']);
      return;
    }
    this.isSubmitting = true;

    // Send an empty array for stages or a minimal valid payload
    const payload: InterviewStage[] = [];

    this.interviewService.finalizeJobPost(this.jobUniqueId, payload, token).subscribe({
      next: () => {
        this.showSuccessPopup = true;
        setTimeout(() => {
          this.workflowService.clearWorkflow();
          this.router.navigate(['/recruiter-view-3rd-page1']);
          this.showSuccessPopup = false;
        }, 5000);
        this.isSubmitting = false;
      },
      error: (err) => {
        this.snackBar.open(`Finalization failed: ${err.message || 'An unknown server error occurred.'}`, 'Close', { duration: 5000 });
        this.isSubmitting = false;
      }
    });
  }


  
  // Method to open alert with message and buttons
  openAlert(message: string, buttons: string[]) {
    this.alertMessage = message;
    this.alertButtons = buttons;
    this.showAlert = true;
  }


}