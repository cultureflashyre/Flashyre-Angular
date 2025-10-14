// src/app/pages/admin-create-job-step4/admin-create-job-step4.component.ts
import { Component, OnInit, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { formatDate } from '@angular/common';
import { AdminJobCreationWorkflowService } from '../../services/admin-job-creation-workflow.service';
import { CorporateAuthService } from '../../services/corporate-auth.service';
import { AdminJobDescriptionService } from '../../services/admin-job-description.service';

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
    private jobDescriptionService: AdminJobDescriptionService
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
    this.addStage();
    this.isLoading = false;
  }

  // --- POPUP AND ALERT HANDLING ---

  showSuccessPopup(message: string) {
    this.popupMessage = message;
    this.popupType = 'success';
    this.showPopup = true;
    setTimeout(() => this.closePopup(), 5000); // Increased duration to see message before redirect
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

  // --- ACTION "ATTEMPT" METHODS (Called from HTML) ---

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

  // --- CONFIRMED ACTION HANDLERS (Original Logic) ---

  onCancelConfirmed(): void {
    this.workflowService.clearWorkflow();
    this.router.navigate(['/admin-create-job-step1']);
  }

  onPreviousConfirmed(): void {
    this.router.navigate(['/admin-create-job-step3']);
  }

  onSaveJobAndAssessmentConfirmed(): void {
    if (!this.jobUniqueId) { this.showErrorPopup('Job ID is missing.'); return; }
    const token = this.authService.getJWTToken();
    if (!token) { this.showErrorPopup('Authentication failed.'); return; }

    this.isSubmitting = true;
    const formStages = this.stages.value;
    const payload = formStages.map((stage: any, index: number) => ({
      stage_name: stage.stage_name === 'Customize' ? stage.custom_stage_name : stage.stage_name,
      stage_date: formatDate(stage.stage_date, 'yyyy-MM-dd', 'en-US'),
      mode: stage.mode,
      assigned_to: stage.assigned_to,
      order: index + 1,
      user_id: localStorage.getItem('user_id')
    }));

    this.jobDescriptionService.finalizeJobPost(this.jobUniqueId, payload, token).subscribe({
      next: () => {
        this.showSuccessPopup('Successfully Created!');
        setTimeout(() => {
          this.workflowService.clearWorkflow();
          this.router.navigate(['/admin-create-job-step1']);
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