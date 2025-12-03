import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors, FormsModule } from '@angular/forms';
import { RecruiterWorkflowNavbarComponent } from '../../components/recruiter-workflow-navbar/recruiter-workflow-navbar.component';
import { RecruiterWorkflowCandidateService, Candidate } from '../../services/recruiter-workflow-candidate.service';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin, catchError, of } from 'rxjs';

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
    ReactiveFormsModule,
    FormsModule,
    RecruiterWorkflowNavbarComponent
  ]
})
export class RecruiterWorkflowCandidate implements OnInit {
  // --- Form Properties ---
  candidateForm!: FormGroup;
  isSubmitting = false;
  submissionSuccess = false;
  submissionError = '';
  formVisible = false;
  editingCandidateId: number | null = null;

  // --- Data Management ---
  masterCandidates: Candidate[] = []; // Single source of truth from the API
  displayCandidates: Candidate[] = []; // The list that is actually shown in the template (can be sorted)

  // --- List Management Properties ---
  isAllSelected = false;
  isDeleting = false;
  currentSort = 'none';

  // --- NEW: FILTER PANEL MANAGEMENT ---
  isFilterPanelVisible = false;
  filterForm!: FormGroup;

  // --- Dropdown Choices ---
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
    this.initializeFilterForm(); // Initialize the new filter form

  }

  ngOnInit(): void {
    this.loadCandidates();
  }

  private initializeFilterForm(): void {
    this.filterForm = this.fb.group({
      name: [''],
      location: [''],
      skills: [''],
      current_ctc: [''],
      email: ['']
    });
  }

  loadCandidates(): void {
    this.candidateService.getCandidates().subscribe({
      next: (data) => {
        this.masterCandidates = data.map(c => ({ ...c, selected: false }));
        this.applySort();
      },
      error: (err) => { console.error("Failed to load candidates.", err); }
    });
  }

  // --- CORE LOGIC: APPLY FILTERS AND SORTING ---
  applyFiltersAndSort(): void {
    let candidates = [...this.masterCandidates];
    const filterValues = this.filterForm.value;

    // 1. Apply Name Filter
    if (filterValues.name) {
      const nameFilter = filterValues.name.toLowerCase();
      candidates = candidates.filter(c => 
        (c.first_name + ' ' + c.last_name).toLowerCase().includes(nameFilter)
      );
    }

    // 2. Apply Location Filter
    if (filterValues.location) {
      const locationFilter = filterValues.location.toLowerCase();
      candidates = candidates.filter(c => 
        c.current_location.toLowerCase().includes(locationFilter)
      );
    }

    // 3. Apply Skills Filter (OR search)
    if (filterValues.skills) {
      const skillFilters = filterValues.skills.toLowerCase().split(',').map((s: string) => s.trim()).filter(Boolean);
      if (skillFilters.length > 0) {
        candidates = candidates.filter(c => {
          const candidateSkills = c.skills.toLowerCase().split(',').map(s => s.trim());
          return skillFilters.some((skillFilter: string) => candidateSkills.includes(skillFilter));
        });
      }
    }

    // 4. Apply CTC Filter
    if (filterValues.current_ctc) {
      candidates = candidates.filter(c => c.current_ctc === filterValues.current_ctc);
    }

    // 5. Apply Email Filter
    if (filterValues.email) {
      const emailFilter = filterValues.email.toLowerCase();
      candidates = candidates.filter(c => c.email.toLowerCase().includes(emailFilter));
    }

    // 6. Apply Sorting
    if (this.currentSort === 'a-z') {
      candidates.sort((a, b) => (a.first_name + ' ' + a.last_name).localeCompare(b.first_name + ' ' + b.last_name));
    } else if (this.currentSort === 'z-a') {
      candidates.sort((a, b) => (b.first_name + ' ' + b.last_name).localeCompare(a.first_name + ' ' + a.last_name));
    }

    this.displayCandidates = candidates;
    this.updateSelectAllState();
  }

    // --- NEW FILTER PANEL METHODS ---
  toggleFilterPanel(): void {
    this.isFilterPanelVisible = !this.isFilterPanelVisible;
  }

  applyFiltersFromPanel(): void {
    this.applyFiltersAndSort();
    this.isFilterPanelVisible = false; // Hide panel after applying
  }

  clearFilters(): void {
    this.filterForm.reset({ name: '', location: '', skills: '', current_ctc: '', email: '' });
    this.applyFiltersAndSort();
    this.isFilterPanelVisible = false;
  }


  // --- CORE LOGIC: APPLY SORTING ---
  applySort(): void {
    let candidates = [...this.masterCandidates];

    if (this.currentSort === 'a-z') {
      candidates.sort((a, b) => (a.first_name + ' ' + a.last_name).localeCompare(b.first_name + ' ' + b.last_name));
    } else if (this.currentSort === 'z-a') {
      candidates.sort((a, b) => (b.first_name + ' ' + b.last_name).localeCompare(a.first_name + ' ' + a.last_name));
    }

    this.displayCandidates = candidates;
    this.updateSelectAllState();
  }

  // --- SELECTION METHODS ---
  toggleSelectAll(event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    this.isAllSelected = isChecked;
    this.displayCandidates.forEach(c => c.selected = isChecked);
  }

  updateSelectAllState(): void {
    if (this.displayCandidates.length === 0) {
      this.isAllSelected = false;
      return;
    }
    this.isAllSelected = this.displayCandidates.every(c => c.selected);
  }

  // --- BULK DELETE ---
  deleteSelected(): void {
    const selectedCandidates = this.masterCandidates.filter(c => c.selected && c.id);
    if (selectedCandidates.length === 0) {
      alert('Please select at least one candidate to delete.');
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${selectedCandidates.length} selected candidate(s)?`)) {
      this.isDeleting = true;
      
      const deleteRequests = selectedCandidates.map(c => 
        this.candidateService.deleteCandidate(c.id!).pipe(
          catchError(err => {
            console.error(`Failed to delete candidate ${c.id}`, err);
            return of(c.id); // On error, return the ID of the failed deletion
          })
        )
      );

      forkJoin(deleteRequests).subscribe(results => {
        const failedIds = results.filter(res => res !== undefined && res !== null);
        
        this.masterCandidates = this.masterCandidates.filter(c => !c.selected || failedIds.includes(c.id));
        
        this.applySort();
        this.isDeleting = false;

        if (failedIds.length > 0) {
          alert(`Could not delete ${failedIds.length} candidate(s). Please try again.`);
        }
      });
    }
  }

  // --- SORTING METHOD ---
  sortCandidates(event: Event): void {
    this.currentSort = (event.target as HTMLSelectElement).value;
    this.applySort();
  }

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

  get f() { return this.candidateForm.controls; }

  showForm(): void {
    this.formVisible = true;
    this.submissionSuccess = false;
    this.submissionError = '';
  }

  startEdit(candidate: Candidate): void {
    if (candidate.id) {
      this.editingCandidateId = candidate.id;
      this.candidateForm.patchValue(candidate);
      this.showForm();
    }
  }

  deleteCandidate(id: number | undefined): void {
    if (!id) return;
    const confirmation = window.confirm('Are you sure you want to delete this candidate?');
    if (confirmation) {
      this.candidateService.deleteCandidate(id).subscribe({
        next: () => {
          this.masterCandidates = this.masterCandidates.filter(c => c.id !== id);
          this.applySort();
        },
        error: (err) => {
          console.error('Failed to delete candidate', err);
          alert('Error: Could not delete the candidate.');
        }
      });
    }
  }

  onSubmit(): void {
    this.submissionError = '';
    this.submissionSuccess = false;
    this.candidateForm.markAllAsTouched();

    if (this.candidateForm.invalid) {
      return;
    }

    this.isSubmitting = true;

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

    if (this.editingCandidateId) {
      this.candidateService.updateCandidate(this.editingCandidateId, payload).subscribe({
        next: (updatedCandidate) => {
          const index = this.masterCandidates.findIndex(c => c.id === this.editingCandidateId);
          if (index !== -1) {
            this.masterCandidates[index] = { ...updatedCandidate, selected: false };
          }
          this.applySort();
          
          this.submissionSuccess = true;
          this.formVisible = false;
          this.isSubmitting = false;
          this.candidateForm.reset();
          this.editingCandidateId = null;
        },
        error: (err: HttpErrorResponse) => {
          console.error('Update failed:', err);
          this.submissionError = 'Failed to update candidate. Please try again.';
          this.isSubmitting = false;
        }
      });
    } else {
      this.candidateService.createCandidate(payload).subscribe({
        next: (newCandidate) => {
          this.masterCandidates.unshift({ ...newCandidate, selected: false });
          this.applySort();
          
          this.submissionSuccess = true;
          this.formVisible = false;
          this.isSubmitting = false;
          this.candidateForm.reset();
        },
        error: (err: HttpErrorResponse) => {
          if (err.status === 400) {
            const errors = err.error;
            console.error('Backend validation failed:', errors); 
            const errorMessages = Object.keys(errors).map(field => {
              const fieldName = field.replace(/_/g, ' ');
              return `${fieldName}: ${errors[field][0]}`;
            });
            this.submissionError = `Submission failed: ${errorMessages.join('; ')}`;
          } else {
            this.submissionError = 'An unexpected server error occurred. Please try again later.';
          }
          this.isSubmitting = false;
        }
      });
    }
  }

  onCancel(): void {
    this.candidateForm.reset();
    this.submissionError = '';
    this.submissionSuccess = false;
    this.formVisible = false; 
    this.editingCandidateId = null;
  }
}