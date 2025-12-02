import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { RecruiterWorkflowNavbarComponent } from '../../components/recruiter-workflow-navbar/recruiter-workflow-navbar.component';
import { RecruiterWorkflowCandidateService, Candidate } from '../../services/recruiter-workflow-candidate.service';
import { HttpErrorResponse } from '@angular/common/http';

// Custom validator to check if min value is less than or equal to max value
export function minMaxValidator(minControlName: string, maxControlName: string) {
  return (formGroup: AbstractControl): ValidationErrors | null => {
    const minControl = formGroup.get(minControlName);
    const maxControl = formGroup.get(maxControlName);

    if (minControl && maxControl && minControl.value != null && maxControl.value != null) {
      if (minControl.value > maxControl.value) {
        maxControl.setErrors({ minGreaterThanMax: true });
        return { minGreaterThanMax: true };
      } else {
        // If the error was previously set, clear it
        if (maxControl.hasError('minGreaterThanMax')) {
          maxControl.setErrors(null);
        }
      }
    }
    return null;
  };
}

@Component({
  standalone: true,
  selector: 'recruiter-workflow-candidate',
  templateUrl: 'recruiter-workflow-candidate.component.html',
  styleUrls: ['recruiter-workflow-candidate.component.css'],
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule, // Import ReactiveFormsModule for form handling
    RecruiterWorkflowNavbarComponent
  ]
})
export class RecruiterWorkflowCandidate implements OnInit {
  candidateForm!: FormGroup;
  isSubmitting = false;
  submissionSuccess = false;
  submissionError = '';
  formVisible = true;
  candidates: Candidate[] = [];
  

  // Hardcoded dropdown options, matching the Django model
  genderChoices = ['Male', 'Female', 'Others'];
  noticePeriodChoices = ['Immediate', 'Less than 15 Days', 'Less than 30 Days', 'Less than 60 Days', 'Less than 90 days'];
  ctcChoices = ['1 LPA - 3 LPA', '4 LPA - 6 LPA', '7 LPA - 10 LPA', '11 LPA - 15 LPA', '16 LPA - 20 LPA', '21 LPA - 25 LPA', '26 LPA - 30 LPA', '30 LPA+'];

  constructor(
    private title: Title,
    private meta: Meta,
    private fb: FormBuilder,
    private candidateService: RecruiterWorkflowCandidateService
  ) {
    this.title.setTitle('Recruiter-Workflow-Candidate - Flashyre');
    this.initializeForm();
  }

  ngOnInit(): void {
    this.loadCandidates();
  }

  // Fetch initial list of candidates
  loadCandidates(): void {
    this.candidateService.getCandidates().subscribe({
      next: (data) => {
        this.candidates = data;
      },
      error: () => {
        // Handle error loading candidates, e.g., show a message
        console.error("Failed to load candidates.");
      }
    });
  }

  // Form initialization with all validators
  private initializeForm(): void {
    this.candidateForm = this.fb.group({
      first_name: ['', [Validators.required, Validators.pattern(/^[a-zA-Z\s]*$/)]],
      last_name: ['', [Validators.required, Validators.pattern(/^[a-zA-Z\s]*$/)]],
      phone_number: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      email: ['', [Validators.required, Validators.email]],
      total_experience_min: [null, [Validators.required, Validators.min(0)]],
      total_experience_max: [null, [Validators.required, Validators.min(0)]],
      relevant_experience_min: [null, [Validators.required, Validators.min(0)]],
      relevant_experience_max: [null, [Validators.required, Validators.min(0)]],
      expected_ctc_min: [null, [Validators.required, Validators.min(0)]],
      expected_ctc_max: [null, [Validators.required, Validators.min(0)]],
      current_ctc: ['', Validators.required],
      preferred_location: ['', Validators.required],
      current_location: ['', Validators.required],
      notice_period: ['', Validators.required],
      gender: ['', Validators.required],
      work_experience: ['', Validators.required],
      skills: ['', Validators.required],
    }, {
      validators: [
        minMaxValidator('total_experience_min', 'total_experience_max'),
        minMaxValidator('relevant_experience_min', 'relevant_experience_max'),
        minMaxValidator('expected_ctc_min', 'expected_ctc_max'),
      ]
    });
  }

  // Convenience getters for easy access in the template
  get f() { return this.candidateForm.controls; }

  onSubmit(): void {
    this.submissionError = '';
    this.submissionSuccess = false;

    // Mark all fields as touched to trigger validation messages
    this.candidateForm.markAllAsTouched();

    if (this.candidateForm.invalid) {
      return; // Stop if the form is invalid
    }

    this.isSubmitting = true;

    // Create a safe payload to send to the backend
    const formValue = this.candidateForm.value;
    const payload: Candidate = {
      ...formValue,
      total_experience_min: formValue.total_experience_min ?? 0,
      total_experience_max: formValue.total_experience_max ?? 0,
      relevant_experience_min: formValue.relevant_experience_min ?? 0,
      relevant_experience_max: formValue.relevant_experience_max ?? 0,
      expected_ctc_min: formValue.expected_ctc_min ?? 0,
      expected_ctc_max: formValue.expected_ctc_max ?? 0,
    };

    // Use the sanitized 'payload' instead of the raw form value
    this.candidateService.createCandidate(payload).subscribe({
      next: (newCandidate) => {
        this.submissionSuccess = true;
        this.formVisible = false;
        this.isSubmitting = false;
        this.candidateForm.reset();
        this.candidates.unshift(newCandidate);
      },
       error: (err: HttpErrorResponse) => {
        if (err.status === 400) {
          const errors = err.error;
          // Log the entire error object from Django to the browser's console.
          console.error('Backend validation failed:', errors); 
          
          // Generate a user-friendly error message.
          let errorMessages = Object.keys(errors).map(field => {
            const fieldName = field.replace(/_/g, ' '); // e.g., 'first_name' -> 'first name'
            return `${fieldName}: ${errors[field][0]}`;
          });
          
          this.submissionError = `Submission failed. Please correct the following errors: ${errorMessages.join('; ')}`;

        } else {
          this.submissionError = 'An unexpected server error occurred. Please try again later.';
        }
        this.isSubmitting = false;
      }
    });
  }
    /**
   * Clears all form fields and resets validation state when the cancel button is clicked.
   */
  onCancel(): void {
    this.candidateForm.reset();
    this.submissionError = ''; // Also clear any error messages
    this.submissionSuccess = false;
  }

}