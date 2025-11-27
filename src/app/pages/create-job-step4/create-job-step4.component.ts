import { Component, HostListener, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { formatDate } from '@angular/common';
import { AdminJobCreationWorkflowService } from '../../services/admin-job-creation-workflow.service';
import { CorporateAuthService } from '../../services/corporate-auth.service';
import { InterviewService, InterviewStage } from '../../services/interview.service';

import { RouterModule } from '@angular/router'
import { CommonModule } from '@angular/common'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'

import { NgxSpinner } from 'ngx-spinner';
import { NavbarForAdminView } from 'src/app/components/navbar-for-admin-view/navbar-for-admin-view.component';
import { AlertMessageComponent } from 'src/app/components/alert-message/alert-message.component';
import { ProgressBar2Code } from 'src/app/components/progress-bar-2-code/progress-bar-2-code.component';
import { CreateJobPostFooter2 } from 'src/app/components/create-job-post-footer-2/create-job-post-footer-2.component';
import { Title, Meta } from '@angular/platform-browser';

@Component({
  selector: 'create-job-step4',
  standalone: true,
  imports: [ RouterModule, FormsModule, CommonModule,
    NavbarForAdminView, AlertMessageComponent,
    ProgressBar2Code, CreateJobPostFooter2, ReactiveFormsModule,
  ],
  templateUrl: './create-job-step4.component.html',
  styleUrls: ['./create-job-step4.component.css']
})
export class AdminCreateJobStep4Component implements OnInit {
  interviewForm: FormGroup;
  jobUniqueId: string | null = null;
  isLoading = true;
  isSubmitting = false;
  isEditMode = false;
  minDateString: string;

  showAlert = false;
  alertMessage = '';
  alertButtons: string[] = [];
  private pendingAction: string = '';
  private stageToRemoveIndex: number | null = null;
  showPopup = false;
  popupMessage = '';
  popupType: 'success' | 'error' = 'success';
  
  recruiterProfile: any = {};
  public isAdmin: boolean = false;
  recruiterId: string | null = null;
  userType: string | null = null;

  // showDropdown = false;

  constructor(  
    private fb: FormBuilder,
    private router: Router,
    private workflowService: AdminJobCreationWorkflowService,
    private authService: CorporateAuthService,
    private interviewService: InterviewService,
    private title: Title,
    private meta: Meta
  ) {}

  ngOnInit(): void {
    this.title.setTitle('Interview FLow - Flashyre');
    this.meta.addTags([
      { property: 'og:title', content: 'Interview Flow - Flashyre' },
      {
        property: 'og:image',
        content: 'https://aheioqhobo.cloudimg.io/v7/_playground-bucket-v2.teleporthq.io_/8203932d-6f2d-4493-a7b2-7000ee521aa2/9aea8e9c-27ce-4011-a345-94a92ae2dbf8?org_if_sml=1&force_format=original'
      }
    ]);

    if (typeof window !== 'undefined' && window.localStorage) {
      this.loadUserProfile();
      this.userType = localStorage.getItem('userType');
      if (this.userType === 'admin') {
          this.isAdmin = true;
      }
      this.recruiterId = localStorage.getItem('user_id');
    }

    this.jobUniqueId = this.workflowService.getCurrentJobId();
    this.isEditMode = this.workflowService.getIsEditMode();

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

    this.loadInterviewStages();
  }

  loadUserProfile(): void {
    const profileData = localStorage.getItem('userProfile');
    if (profileData) this.recruiterProfile = JSON.parse(profileData);
  }

  private loadInterviewStages(): void {
    const token = this.authService.getJWTToken();
    if (!this.jobUniqueId || !token) {
        this.addStage();
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
                this.addStage();
            }
            this.isLoading = false;
        },
        error: (err) => {
            console.error("Failed to load interview stages:", err);
            this.showErrorPopup('Could not load existing interview stages.');
            this.addStage();
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

  // --- MODIFICATION START ---
  /**
   * MODIFIED: Clears the form row if it's the last one, otherwise prompts for removal.
   */
  removeStage(index: number): void {
    // If it's the last stage, just clear its values instead of removing it.
    if (this.stages.length === 1) {
      const lastStage = this.stages.at(index) as FormGroup;
      // Reset the form group to its initial state.
      lastStage.reset({
        stage_name: 'Screening',
        custom_stage_name: '',
        stage_date: null,
        mode: 'Online',
        assigned_to: ''
      });
      // Mark the form as pristine and untouched to remove any validation error styles.
      lastStage.markAsPristine();
      lastStage.markAsUntouched();
    } else {
      // Original logic for when there are multiple stages: prompt for confirmation.
      this.stageToRemoveIndex = index;
      this.pendingAction = 'removeStage';
      this.openAlert('You are about to remove a stage, are you sure?', ['Cancel', 'Remove']);
    }
  }
  // --- MODIFICATION END ---

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

  onSubmit(): void {
    // This function is linked to the form's (ngSubmit) but we handle submission
    // via button clicks directly. We can keep it pointing to the main save action.
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

  // --- MODIFICATION START ---
  /**
   * MODIFIED: Directly opens a confirmation prompt without checking form validity first.
   */
  onSaveDraft(): void {
    this.pendingAction = 'saveDraft';
    // This message is adjusted for saving a draft with potentially no interview process.
    this.openAlert('Are you sure you want to save the job as a draft without a complete interview process?', ['Cancel', 'Save Draft']);
  }

  /**
   * MODIFIED: Checks form validity to decide which confirmation message to show.
   */
  onSaveJobAndAssessment(): void {
    // this.toggleDropdown(); 

    if (this.interviewForm.invalid) {
      // If the form is invalid or empty, show the specific confirmation prompt.
      this.pendingAction = 'saveEmpty';
      this.openAlert('You are about to save the job without an interview process.', ['Cancel', 'Post Job']);
    } else {
      // If the form is valid, use the standard confirmation prompt.
      this.pendingAction = 'save';
      const message = this.isEditMode ? 'Are you sure you want to update and finalize this job post?' : 'Are you sure you want to finalize and save this job post?';
      this.openAlert(message, ['Cancel', 'Save']);
    }
  }

  /**
   * MODIFIED: Handles the new 'saveEmpty' pending action and 'Post Job' button click.
   */
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
            // New case for when user confirms posting with an empty/invalid form via the 'Post Job' button.
            case 'saveEmpty': this.onSaveJobAndAssessmentConfirmed(); break;
            case 'removeStage': this.onRemoveStageConfirmed(); break;
        }
    }
    this.pendingAction = '';
    if(!confirmed && this.pendingAction === 'removeStage') {
      this.stageToRemoveIndex = null;
    }
  }
  // --- MODIFICATION END ---
  
  private onRemoveStageConfirmed(): void {
    if (this.stageToRemoveIndex !== null && this.stages.length > 1) {
      this.stages.removeAt(this.stageToRemoveIndex);
    }
    this.stageToRemoveIndex = null;
  }

  onCancelConfirmed(): void {
    this.workflowService.clearWorkflow();
    this.router.navigate(['/job-post-list']);
  }

  onPreviousConfirmed(): void {
    this.router.navigate(['/create-job-step3']);
  }

  // --- MODIFICATION START ---
  /**
   * MODIFIED: The payload is now an empty array if the form is invalid.
   */
  onSaveDraftConfirmed(): void {
    if (!this.jobUniqueId || !this.authService.getJWTToken()) {
      this.showErrorPopup('Cannot save draft: Missing Job ID or authentication.');
      return;
    }
    this.isSubmitting = true;
    
    // If the form is invalid (e.g., empty), we save an empty array of stages.
    const payload = this.interviewForm.valid ? this.preparePayload() : [];

    this.interviewService.saveDraftStages(this.jobUniqueId, payload, this.authService.getJWTToken()!).subscribe({
      next: () => {
        this.showSuccessPopup('Draft saved successfully!');
        setTimeout(() => {
          this.workflowService.clearWorkflow();
          this.router.navigate(['/job-post-list']);
        }, 3000);
        this.isSubmitting = false;
      },
      error: (err) => {
        this.showErrorPopup(`Draft save failed: ${err.message || 'Server error'}`);
        this.isSubmitting = false;
      }
    });
  }
  // --- MODIFICATION END ---

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

  // --- MODIFICATION START ---
  /**
   * MODIFIED: If the form is invalid, an empty array is sent as the payload.
   */
  onSaveJobAndAssessmentConfirmed(): void {
    if (!this.jobUniqueId || !this.authService.getJWTToken()) {
      this.showErrorPopup('Cannot save: Missing Job ID or authentication.');
      return;
    }
    this.isSubmitting = true;
    
    // If the form is invalid, we finalize with an empty array of stages.
    // Otherwise, we prepare the payload from the valid form data.
    const payload = this.interviewForm.valid ? this.preparePayload() : [];

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
  // --- MODIFICATION END ---

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

  // toggleDropdown(): void {
  //   if (!this.isSubmitting) {
  //     this.showDropdown = !this.showDropdown;
  //   }
  // }

  // @HostListener('document:click', ['$event'])
  // onDocumentClick(event: Event): void {
  //   const target = event.target as HTMLElement;
  //   if (!target.closest('.admin-create-job-step4-dropdown-container')) {
  //     this.showDropdown = false;
  //   }
  // }

  // onViewScore(): void {
  //   this.showDropdown = false;
  //   this.router.navigate(['/admin-candidate-scores']);
  // }
}