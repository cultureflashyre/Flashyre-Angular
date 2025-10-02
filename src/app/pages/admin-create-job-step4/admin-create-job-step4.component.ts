// src/app/pages/admin-create-job-step4/admin-create-job-step4.component.ts
import { Component, OnInit, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { formatDate } from '@angular/common';
import { AdminJobCreationWorkflowService } from '../../services/admin-job-creation-workflow.service';
import { CorporateAuthService } from '../../services/corporate-auth.service';
import { AdminJobDescriptionService } from '../../services/admin-job-description.service'; // ← NEW SERVICE

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
  minDate = new Date(); // For the date picker
  minDateString: string; // For HTML5 date input
  // MODIFICATION: Add a new property to control the popup's visibility
  showSuccessPopup = false;
  // --- NEW: Dropdown State ---
  showDropdown = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private workflowService: AdminJobCreationWorkflowService, // ← ADMIN WORKFLOW
    private authService: CorporateAuthService,
    private jobDescriptionService: AdminJobDescriptionService // ← ADMIN SERVICE
  ) {}

  ngOnInit(): void {
    this.jobUniqueId = this.workflowService.getCurrentJobId();
    if (!this.jobUniqueId) {
      alert('No active job creation flow found. Please start again.');
      this.router.navigate(['/admin-create-job-step1']);
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
      alert('You must have at least one interview stage.');
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

  // --- NEW: Dropdown Toggle Method ---
  toggleDropdown(): void {
    // Only allow toggling if the main button is enabled
    if (!(this.isSubmitting || this.interviewForm.invalid)) {
      this.showDropdown = !this.showDropdown;
    }
  }

  // --- NEW: Close Dropdown on Outside Click (Optional but recommended) ---
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    // Close dropdown if clicked outside the dropdown container
    if (!target.closest('.admin-create-job-step4-dropdown-container')) {
      this.showDropdown = false;
    }
  }

  // Footer Event Handlers
  onCancel(): void {
    // Navigate back to dashboard or show confirmation dialog
    if (confirm('Are you sure you want to cancel? All unsaved changes will be lost.')) {
      this.workflowService.clearWorkflow();
      this.router.navigate(['/admin-page1']);
    }
  }

  onPrevious(): void {
    // Navigate to the previous step in the job creation workflow
    this.router.navigate(['/admin-create-job-step3']);
  }

  onSaveDraft(): void {
    // Since you don't want draft functionality, we'll show a message
    alert('Draft functionality is not available. Please complete the form and click Next.');
  }

  onSkip(): void {
    // Skip the interview process and complete job creation
    if (confirm('Are you sure you want to skip the interview process? You can add it later.')) {
      alert('Interview process skipped. Job post created successfully!');
      this.workflowService.clearWorkflow();
      this.router.navigate(['/admin-page1']);
    }
  }

  // --- MODIFIED: onSubmit now calls the specific save method ---
  onSubmit(): void {
    // This can now be an alias or removed if you directly call the specific methods from the dropdown
    // For safety, let's keep it calling the save method
    this.onSaveJobAndAssessment();
  }

  // --- NEW: Specific method for saving job and assessment ---
  onSaveJobAndAssessment(): void {
    // Close the dropdown first
    this.showDropdown = false;

    if (this.interviewForm.invalid) {
      alert('Please fill all required fields correctly.');
      this.interviewForm.markAllAsTouched();
      return;
    }
    if (!this.jobUniqueId) { /* ... guard clauses ... */ return; }
    const token = this.authService.getJWTToken();
    if (!token) { /* ... guard clauses ... */ return; }
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
    console.log("payload: ", payload);

    // MODIFICATION: Call the interview app's finalize endpoint (same as corporate)
    this.jobDescriptionService.finalizeJobPost(this.jobUniqueId, payload, token).subscribe({
      next: () => {
        this.showSuccessPopup = true;
        // 2. Set a 5-second timer to clear the workflow and navigate
        setTimeout(() => {
          this.workflowService.clearWorkflow();
          this.router.navigate(['/admin-page1']);
          // Optional: hide the popup right before navigation
          this.showSuccessPopup = false;
        }, 5000); // 5000 milliseconds = 5 seconds
        // isSubmitting can be set to false immediately or after the timeout
        this.isSubmitting = false;
      },
      error: (err) => {
        alert(`Finalization failed: ${err.message || 'An unknown server error occurred.'}`);
        this.isSubmitting = false;
      }
    });
  }

  // --- NEW: Method for navigating to the view score page ---
  onViewScore(): void {
    // Close the dropdown first
    this.showDropdown = false;

    // Navigate to the new scores page
    this.router.navigate(['/admin-candidate-scores']); // Use the path you defined for the new page
  }
}