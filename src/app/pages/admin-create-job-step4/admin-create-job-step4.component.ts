// src/app/pages/admin-create-job-step4/admin-create-job-step4.component.ts

import { Component, OnInit, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { formatDate } from '@angular/common';
import { AdminJobCreationWorkflowService } from '../../services/admin-job-creation-workflow.service';
import { CorporateAuthService } from '../../services/corporate-auth.service';
// MODIFICATION: Import the InterviewService and its data models
import { InterviewService, InterviewStage, InterviewStageData } from '../../services/interview.service';

@Component({
  selector: 'admin-create-job-step4',
  templateUrl: './admin-create-job-step4.component.html',
  styleUrls: ['./admin-create-job-step4.component.css']
})
export class AdminCreateJobStep4Component implements OnInit {
  userProfile: any = {};
  interviewForm: FormGroup;
  jobUniqueId: string | null = null;
  isLoading = true;
  isSubmitting = false;
  minDate = new Date();
  minDateString: string;
  showDropdown = false;
  
  // Alert and Popup properties
  showAlert = false;
  alertMessage = '';
  alertButtons: string[] = [];
  private actionContext: { action: string } | null = null;
  showPopup = false;
  popupMessage = '';
  popupType: 'success' | 'error' = 'success';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private workflowService: AdminJobCreationWorkflowService,
    private authService: CorporateAuthService,
    // MODIFICATION: Replaced AdminJobDescriptionService with InterviewService for consistency
    private interviewService: InterviewService 
  ) {}

  ngOnInit(): void {
    this.jobUniqueId = this.workflowService.getCurrentJobId();
    if (!this.jobUniqueId) {
      this.showErrorPopup('No active job creation flow found. Please start again.');
      this.router.navigate(['/admin-create-job-step1']);
      return;
    }
    const today = new Date();
    this.minDateString = today.toISOString().split('T')[0];
    
    this.interviewForm = this.fb.group({
      stages: this.fb.array([])
    });

    // MODIFICATION: Instead of adding a blank stage, we now load existing stages.
    this.loadInterviewStages();
  }
  
  // --- NEW: Data Loading and Form Population Logic (from Recruiter component) ---

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
            this.showErrorPopup('Could not load existing interview stages.');
            this.addStage(); // Add a default stage on error
            this.isLoading = false;
        }
    });
  }

  // NEW: Helper method to create a form group from existing data
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

    // Add validator and listener logic for the 'Customize' option
    const customNameControl = stageGroup.get('custom_stage_name');
    if (isCustom) {
        customNameControl?.setValidators(Validators.required);
    }
    
    stageGroup.get('stage_name')?.valueChanges.subscribe(value => {
        if (value === 'Customize') {
            customNameControl?.setValidators(Validators.required);
        } else {
            customNameControl?.clearValidators();
        }
        customNameControl?.updateValueAndValidity();
    });

    return stageGroup;
  }

  // --- POPUP AND ALERT HANDLING (Unchanged) ---

  showSuccessPopup(message: string) {
    this.popupMessage = message;
    this.popupType = 'success';
    this.showPopup = true;
    setTimeout(() => this.closePopup(), 5000);
  }

  showErrorPopup(message: string) {
    this.popupMessage = message;
    this.popupType = 'error';
    this.showPopup = true;
    setTimeout(() => this.closePopup(), 5000);
  }

  closePopup() {
    this.showPopup = false;
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
        case 'cancel':
          this.onCancelConfirmed();
          break;
        case 'previous':
          this.onPreviousConfirmed();
          break;
        case 'save':
          this.onSaveJobAndAssessmentConfirmed();
          break;
      }
      this.actionContext = null;
    }
  }
  
  // --- FORM ARRAY MANAGEMENT (Unchanged) ---
  
  get stages(): FormArray {
    return this.interviewForm.get('stages') as FormArray;
  }

  private createStageGroup(): FormGroup {
    const stageGroup = this.fb.group({
      stage_name: ['Screening', Validators.required],
      custom_stage_name: [''],
      stage_date: [null, Validators.required],
      mode: ['Online', Validators.required],
      assigned_to: ['', [Validators.required, Validators.email]]
    });
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

  addStage(): void {
    this.stages.push(this.createStageGroup());
  }

  removeStage(index: number): void {
    if (this.stages.length > 1) {
      this.stages.removeAt(index);
    } else {
      this.showErrorPopup('You must have at least one interview stage.');
    }
  }

  validateDateInput(event: Event, stageControl: AbstractControl) {
    const inputElement = event.target as HTMLInputElement;
    const dateControl = stageControl.get('stage_date');
    if (!dateControl) return;
    if (inputElement.validity.badInput) {
      dateControl.setErrors({ 'invalidDate': true });
    } else if (dateControl.hasError('invalidDate')) {
      dateControl.setErrors(null);
      dateControl.updateValueAndValidity();
    }
  }
  
  // --- UI AND FOOTER ACTIONS (Unchanged) ---

  toggleDropdown(): void {
    if (!(this.isSubmitting || this.interviewForm.invalid)) {
      this.showDropdown = !this.showDropdown;
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.admin-create-job-step4-dropdown-container')) {
      this.showDropdown = false;
    }
  }

  onCancel(): void {
    this.actionContext = { action: 'cancel' };
    this.openAlert('Are you sure you want to cancel? All unsaved changes will be lost.', ['No', 'Yes, Cancel']);
  }

  onPrevious(): void {
    this.actionContext = { action: 'previous' };
    this.openAlert('Do you want to go back to the previous step?', ['Cancel', 'Go Back']);
  }

  onSaveJobAndAssessment(): void {
    this.showDropdown = false;
    if (this.interviewForm.invalid) {
      this.showErrorPopup('Please fill all required fields correctly.');
      this.interviewForm.markAllAsTouched();
      return;
    }
    this.actionContext = { action: 'save' };
    this.openAlert('Are you sure you want to finalize and save this job post?', ['Cancel', 'Save']);
  }
  
  onSubmit(): void {
    this.onSaveJobAndAssessment();
  }

  onCancelConfirmed(): void {
    this.workflowService.clearWorkflow();
    this.router.navigate(['/recruiter-view-3rd-page1']);
  }

  onPreviousConfirmed(): void {
    this.router.navigate(['/admin-create-job-step3']);
  }

  // --- MODIFIED: Save/Submit Logic ---
  onSaveJobAndAssessmentConfirmed(): void {
    if (!this.jobUniqueId) { this.showErrorPopup('Job ID is missing.'); return; }
    const token = this.authService.getJWTToken();
    if (!token) { this.showErrorPopup('Authentication failed.'); return; }

    this.isSubmitting = true;
    const formStages = this.stages.value;
    
    // NOTE: The payload type is now explicitly 'InterviewStage[]' from the imported service
    const payload: InterviewStage[] = formStages.map((stage: any, index: number) => ({
      stage_name: stage.stage_name === 'Customize' ? stage.custom_stage_name : stage.stage_name,
      stage_date: formatDate(stage.stage_date, 'yyyy-MM-dd', 'en-US'),
      mode: stage.mode,
      assigned_to: stage.assigned_to,
      order: index + 1,
      user_id: localStorage.getItem('user_id')
    }));

    // MODIFICATION: Call the finalizeJobPost method from the InterviewService
    this.interviewService.finalizeJobPost(this.jobUniqueId, payload, token).subscribe({
      next: () => {
        this.showSuccessPopup('Successfully Created!');
        setTimeout(() => {
          this.workflowService.clearWorkflow();
          this.router.navigate(['/recruiter-view-3rd-page1']);
          this.closePopup();
        }, 5000);
        this.isSubmitting = false;
      },
      error: (err) => {
        this.showErrorPopup(`Finalization failed: ${err.message || 'An unknown server error occurred.'}`);
        this.isSubmitting = false;
      }
    });
  }
  
  onViewScore(): void {
    this.showDropdown = false;
    this.router.navigate(['/admin-candidate-scores']);
  }
}