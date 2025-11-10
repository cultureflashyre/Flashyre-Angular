import { Component, HostListener, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { formatDate } from '@angular/common';
import { AdminJobCreationWorkflowService } from '../../services/admin-job-creation-workflow.service';
import { CorporateAuthService } from '../../services/corporate-auth.service';
import { InterviewService, InterviewStage } from '../../services/interview.service';

@Component({
  selector: 'create-job-step4',
  templateUrl: './create-job-step4.component.html',
  styleUrls: ['./create-job-step4.component.css']
})
export class AdminCreateJobStep4Component implements OnInit {
  interviewForm: FormGroup;
  jobUniqueId: string | null = null;
  isLoading = true;
  isSubmitting = false;
  isEditMode = false; // To track if we are in edit mode
  minDateString: string;

  // Alert and Popup properties
  showAlert = false;
  alertMessage = '';
  alertButtons: string[] = [];
  private pendingAction: string = ''; // To manage which action is pending confirmation
  private stageToRemoveIndex: number | null = null;
  showPopup = false;
  popupMessage = '';
  popupType: 'success' | 'error' = 'success';
  
  // General State management
  recruiterProfile: any = {};
  public isAdmin: boolean = false;
  recruiterId: string | null = null;
  userType: string | null = null;

  showDropdown = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private workflowService: AdminJobCreationWorkflowService,
    private authService: CorporateAuthService,
    private interviewService: InterviewService
  ) {}

  ngOnInit(): void {
        if (typeof window !== 'undefined' && window.localStorage) {
      this.loadUserProfile();

      // <<< MODIFICATION START: Check user role from the loaded profile
      // This assumes the user's role is stored in the profile object.
      this.userType = localStorage.getItem('userType')
      if (this.userType === 'admin') {
          this.isAdmin = true;
      }

      this.recruiterId = localStorage.getItem('user_id');
    }

    this.jobUniqueId = this.workflowService.getCurrentJobId();
    this.isEditMode = this.workflowService.getIsEditMode(); // Check if in edit mode

    if (!this.jobUniqueId) {
      this.showErrorPopup('No active job creation flow found. Please start again.');
      this.router.navigate(['/create-job']);
      return;
    }
    const today = new Date();
    this.minDateString = today.toISOString().split('T')[0];

    this.interviewForm = this.fb.group({
      stages: this.fb.array([])
    });

    // Load existing stages if editing, otherwise add a blank stage
    this.loadInterviewStages();
  }

  loadUserProfile(): void {
    const profileData = localStorage.getItem('userProfile');
    if (profileData) this.recruiterProfile = JSON.parse(profileData);
  }

  // --- START: DATA LOADING LOGIC (from Recruiter component) ---
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
                this.stages.clear();
                stagesData.forEach(stage => {
                    this.stages.push(this.createStageGroupWithData(stage));
                });
            } else {
                this.addStage(); // If no stages exist, add one empty default stage
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

  private createStageGroupWithData(data: InterviewStage): FormGroup {
    const standardStages = ['Screening', 'Technical interview - 1', 'Technical interview - 2', 'HR interview'];
    const isCustom = !standardStages.includes(data.stage_name);

    const stageGroup = this.fb.group({
      stage_name: [isCustom ? 'Customize' : data.stage_name, Validators.required],
      custom_stage_name: [isCustom ? data.stage_name : ''],
      stage_date: [data.stage_date, Validators.required],
      mode: [data.mode, Validators.required],
      assigned_to: [data.assigned_to, [Validators.required, Validators.email]]
    });

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
    if (this.stages.length <= 1) {
      this.showErrorPopup('You must have at least one interview stage.');
      return;
    }
    // Store the index of the stage to be removed
    this.stageToRemoveIndex = index;
    // Set the pending action
    this.pendingAction = 'removeStage';
    // Open the alert with a confirmation message
    this.openAlert('You are about to remove a stage, are you sure?', ['Cancel', 'Remove']);
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

  // --- FOOTER AND ALERT HANDLING ---
  onSubmit(): void {
    this.onSaveJobAndAssessment();
  }

  onCancel(): void {
    this.pendingAction = 'cancel';
    this.openAlert('Are you sure you want to cancel? All unsaved changes will be lost.', ['No', 'Yes, Cancel']);
  }

  onPrevious(): void {
    this.pendingAction = 'previous';
    this.openAlert('Do you want to go back to the previous step?', ['Cancel', 'Go Back']);
  }

  onSaveDraft(): void {
    if (this.interviewForm.invalid) {
      // If the form is invalid, show a specific error message.
      this.showErrorPopup('Please fill out all required fields before saving a draft');
      
      // Mark all form controls as 'touched' to display validation errors in the UI.
      this.interviewForm.markAllAsTouched();
      
      // Halt further execution to prevent the confirmation popup from showing.
      return; 
    }
    this.pendingAction = 'saveDraft';
    this.openAlert('You are about to save this as a draft.', ['Cancel', 'Save Draft']);
  }

  onSkip(): void {
    this.pendingAction = 'skip';
    this.openAlert('You are about to skip the interview process. You can add it later.', ['Cancel', 'Continue']);
  }

  onSaveJobAndAssessment(): void {
    if (this.interviewForm.invalid) {
      this.showErrorPopup('Please fill all required fields correctly.');
      this.interviewForm.markAllAsTouched();
      return;
    }
    this.pendingAction = 'save';
    const message = this.isEditMode ? 'Are you sure you want to update and finalize this job post?' : 'Are you sure you want to finalize and save this job post?';
    this.openAlert(message, ['Cancel', 'Save']);
  }

  onAlertButtonClicked(action: string) {
    this.showAlert = false;
    const confirmed = !['cancel', 'no'].includes(action.toLowerCase());

    if (confirmed) {
        switch (this.pendingAction) {
            case 'cancel': this.onCancelConfirmed(); break;
            case 'previous': this.onPreviousConfirmed(); break;
            case 'saveDraft': this.onSaveDraftConfirmed(); break;
            case 'skip': this.onSkipConfirmed(); break;
            case 'save': this.onSaveJobAndAssessmentConfirmed(); break;
            case 'removeStage': this.onRemoveStageConfirmed(); break;
        }
    }
    this.pendingAction = '';
    if(!confirmed && this.pendingAction === 'removeStage') {
      this.stageToRemoveIndex = null;
    }
  }

  private onRemoveStageConfirmed(): void {
    // Check if the index is valid before removing
    if (this.stageToRemoveIndex !== null && this.stages.length > 1) {
      this.stages.removeAt(this.stageToRemoveIndex);
    }
    // Reset the index
    this.stageToRemoveIndex = null;
  }

  // --- ACTION CONFIRMATION LOGIC ---
  onCancelConfirmed(): void {
    this.workflowService.clearWorkflow();
    this.router.navigate(['/job-post-list']); // Or an admin dashboard route
  }

  onPreviousConfirmed(): void {
    this.router.navigate(['/create-job-step3']);
  }

  onSaveDraftConfirmed(): void {
    if (!this.jobUniqueId || !this.authService.getJWTToken()) {
      this.showErrorPopup('Cannot save draft: Missing Job ID or authentication.');
      return;
    }
    this.isSubmitting = true;
    const payload = this.preparePayload();

    this.interviewService.saveDraftStages(this.jobUniqueId, payload, this.authService.getJWTToken()!).subscribe({
      next: () => {
        this.showSuccessPopup('Draft saved successfully!');
        setTimeout(() => {
          this.workflowService.clearWorkflow();
          this.router.navigate(['/job-post-list']); // Or an admin dashboard route
        }, 3000);
        this.isSubmitting = false;
      },
      error: (err) => {
        this.showErrorPopup(`Draft save failed: ${err.message || 'Server error'}`);
        this.isSubmitting = false;
      }
    });
  }

  onSkipConfirmed(): void {
    if (!this.jobUniqueId || !this.authService.getJWTToken()) {
      this.showErrorPopup('Cannot finalize: Missing Job ID or authentication.');
      return;
    }
    this.isSubmitting = true;
    // An empty array skips the interview process but still finalizes the job
    this.interviewService.finalizeJobPost(this.jobUniqueId, [], this.authService.getJWTToken()!).subscribe({
      next: () => {
        this.showSuccessPopup('Job finalized without interview stages!');
        setTimeout(() => {
          this.workflowService.clearWorkflow();
          this.router.navigate(['/job-post-list']);
        }, 3000);
        this.isSubmitting = false;
      },
      error: (err) => {
        this.showErrorPopup(`Finalization failed: ${err.message || 'Server error'}`);
        this.isSubmitting = false;
      }
    });
  }

  onSaveJobAndAssessmentConfirmed(): void {
    if (!this.jobUniqueId || !this.authService.getJWTToken()) {
      this.showErrorPopup('Cannot save: Missing Job ID or authentication.');
      return;
    }
    this.isSubmitting = true;
    const payload = this.preparePayload();

    this.interviewService.finalizeJobPost(this.jobUniqueId, payload, this.authService.getJWTToken()!).subscribe({
      next: () => {
        const message = this.isEditMode ? 'Job Updated Successfully!' : 'Job Created Successfully!';
        this.showSuccessPopup(message);
        setTimeout(() => {
          this.workflowService.clearWorkflow();
          this.router.navigate(['/job-post-list']);
        }, 3000);
        this.isSubmitting = false;
      },
      error: (err) => {
        this.showErrorPopup(`Finalization failed: ${err.message || 'Server error'}`);
        this.isSubmitting = false;
      }
    });
  }

  private preparePayload(): InterviewStage[] {
    const formStages = this.stages.value;
    return formStages.map((stage: any, index: number) => ({
      stage_name: stage.stage_name === 'Customize' ? stage.custom_stage_name : stage.stage_name,
      stage_date: formatDate(stage.stage_date, 'yyyy-MM-dd', 'en-US'),
      mode: stage.mode,
      assigned_to: stage.assigned_to,
      order: index + 1,
      user_id: localStorage.getItem('user_id')
    }));
  }

  // --- UTILITY METHODS (Popups) ---
  private openAlert(message: string, buttons: string[]) {
    this.alertMessage = message;
    this.alertButtons = buttons;
    this.showAlert = true;
  }

  private showSuccessPopup(message: string) {
    this.popupMessage = message;
    this.popupType = 'success';
    this.showPopup = true;
    setTimeout(() => this.closePopup(), 3000);
  }

  private showErrorPopup(message: string) {
    this.popupMessage = message;
    this.popupType = 'error';
    this.showPopup = true;
    setTimeout(() => this.closePopup(), 5000);
  }

  closePopup() {
    this.showPopup = false;
  }

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

  onViewScore(): void {
    this.showDropdown = false;
    this.router.navigate(['/admin-candidate-scores']);
  }
}