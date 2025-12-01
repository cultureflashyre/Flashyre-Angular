import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'candidate-input-form', // Using the selector from the parent HTML
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './recruiter-workflow-input-form.component.html',
  styleUrls: ['./recruiter-workflow-input-form.component.css'],
})
export class CandidateInputFormComponent implements OnInit {
  // Event emitter to notify the parent component on successful submission
  @Output() formSubmittedSuccess = new EventEmitter<void>();

  candidateForm!: FormGroup;

  // Dropdown options
  genderChoices = ['Male', 'Female', 'Others'];
  noticePeriodChoices = [
    'Immediate',
    'Less than 15 Days',
    'Less than 30 Days',
    'Less than 60 Days',
    'Less than 90 days',
  ];
  ctcChoices = [
    '1 LPA - 3 LPA', '4 LPA - 6 LPA', '7 LPA - 10 LPA',
    '11 LPA - 15 LPA', '16 LPA - 20 LPA', '21 LPA - 25 LPA',
    '26 LPA - 30 LPA', '30 LPA+',
  ];

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    // Initialize the form with controls and validators
    this.candidateForm = this.fb.group({
      first_name: ['', [Validators.required, Validators.pattern('^[a-zA-Z\\s]+$')]],
      last_name: ['', [Validators.required, Validators.pattern('^[a-zA-Z\\s]+$')]],
      phone_number: ['', [Validators.required, Validators.pattern('^\\d{10}$')]],
      email: ['', [Validators.required, Validators.email]],
      gender: ['', Validators.required],
      work_experience: [''],
      skills: ['', Validators.required],
      total_experience_min: [0, [Validators.required, Validators.min(0)]],
      total_experience_max: [0, [Validators.required, Validators.min(0)]],
      relevant_experience_min: [0, [Validators.required, Validators.min(0)]],
      relevant_experience_max: [0, [Validators.required, Validators.min(0)]],
      current_ctc: ['', Validators.required],
      expected_ctc_min: [null, [Validators.required, Validators.min(0)]],
      expected_ctc_max: [null, [Validators.required, Validators.min(0)]],
      notice_period: ['', Validators.required],
      preferred_location: ['', Validators.required],
      current_location: ['', Validators.required],
    });
  }

  // Helper getter for easy access to form controls in the template
  get f() {
    return this.candidateForm.controls;
  }

  // Handle form submission
  onSubmit(): void {
    // If the form is invalid, mark all fields as touched to display validation errors
    if (this.candidateForm.invalid) {
      this.candidateForm.markAllAsTouched();
      return;
    }

    // For now, we just log the data. In the next step, this will call the API service.
    console.log('Form is valid. Submitting data:', this.candidateForm.value);

    // In a real scenario, after a successful API call, we would emit the event.
    // this.formSubmittedSuccess.emit(); 
  }
}