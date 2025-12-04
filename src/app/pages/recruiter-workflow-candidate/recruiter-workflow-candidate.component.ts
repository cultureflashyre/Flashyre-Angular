import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors, FormsModule } from '@angular/forms';
import { RecruiterWorkflowNavbarComponent } from '../../components/recruiter-workflow-navbar/recruiter-workflow-navbar.component';
import { RecruiterWorkflowCandidateService, Candidate } from '../../services/recruiter-workflow-candidate.service';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { RelativeDatePipe } from '../../pipe/relative-date.pipe'; // <-- IMPORT THE NEW PIPE
import { AlertMessageComponent } from '../../components/alert-message/alert-message.component'; // <-- IMPORT ALERT COMPONENT



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
        // If the error was previously set, clear it if the condition is met
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
    RecruiterWorkflowNavbarComponent,
    RelativeDatePipe,
    AlertMessageComponent
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
  formSource: 'Naukri' | 'External' = 'Naukri';

  // --- NEW: ALERT STATE MANAGEMENT ---
  isAlertVisible = false;
  alertMessage = '';
  alertButtons: string[] = [];
  private pendingAction: (() => void) | null = null;


  // --- File Management ---
  selectedFile: File | null = null;
  selectedFileName = '';

  // --- Data Management ---
  masterCandidates: Candidate[] = [];
  displayCandidates: Candidate[] = [];

  // --- List Management Properties ---
  isAllSelected = false;
  isDeleting = false;
  currentSort = 'none';

  // --- FILTER PANEL MANAGEMENT ---
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
    this.initializeFilterForm();
  }

  ngOnInit(): void {
    this.loadCandidates();
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
        this.applyFiltersAndSort();
      },
      error: (err) => { console.error("Failed to load candidates.", err); }
    });
  }

  applyFiltersAndSort(): void {
    let candidates = [...this.masterCandidates];
    const filterValues = this.filterForm.value;

    if (filterValues.name) {
      const nameFilter = filterValues.name.toLowerCase();
      candidates = candidates.filter(c => 
        (c.first_name + ' ' + c.last_name).toLowerCase().includes(nameFilter)
      );
    }

    if (filterValues.location) {
      const locationFilter = filterValues.location.toLowerCase();
      candidates = candidates.filter(c => 
        c.current_location.toLowerCase().includes(locationFilter)
      );
    }

    if (filterValues.skills) {
      const skillFilters = filterValues.skills.toLowerCase().split(',').map((s: string) => s.trim()).filter(Boolean);
      if (skillFilters.length > 0) {
        candidates = candidates.filter(c => {
          const candidateSkills = c.skills.toLowerCase().split(',').map(s => s.trim());
          return skillFilters.some((skillFilter: string) => candidateSkills.includes(skillFilter));
        });
      }
    }

    if (filterValues.current_ctc) {
      candidates = candidates.filter(c => c.current_ctc === filterValues.current_ctc);
    }

    if (filterValues.email) {
      const emailFilter = filterValues.email.toLowerCase();
      candidates = candidates.filter(c => c.email.toLowerCase().includes(emailFilter));
    }

    if (this.currentSort === 'a-z') {
      candidates.sort((a, b) => (a.first_name + ' ' + a.last_name).localeCompare(b.first_name + ' ' + b.last_name));
    } else if (this.currentSort === 'z-a') {
      candidates.sort((a, b) => (b.first_name + ' ' + b.last_name).localeCompare(a.first_name + ' ' + a.last_name));
    }

    this.displayCandidates = candidates;
    this.updateSelectAllState();
  }

  toggleFilterPanel(): void {
    this.isFilterPanelVisible = !this.isFilterPanelVisible;
  }

  applyFiltersFromPanel(): void {
    this.applyFiltersAndSort();
    this.isFilterPanelVisible = false;
  }

  clearFilters(): void {
    this.filterForm.reset({ name: '', location: '', skills: '', current_ctc: '', email: '' });
    this.applyFiltersAndSort();
    this.isFilterPanelVisible = false;
  }

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

  deleteSelected(): void {
    const selectedCandidates = this.masterCandidates.filter(c => c.selected && c.id);
    if (selectedCandidates.length === 0) {
      this.showAlert('Please select at least one candidate to delete.', ['Close']);
      return;
    }

    this.alertMessage = `Are you sure you want to delete ${selectedCandidates.length} selected candidate(s)?`;
    this.alertButtons = ['Cancel', 'Delete'];

    this.pendingAction = () => {
      this.isDeleting = true;
      const deleteRequests = selectedCandidates.map(c => 
        this.candidateService.deleteCandidate(c.id!).pipe(catchError(err => of(c.id)))
      );

      forkJoin(deleteRequests).subscribe(results => {
        const failedIds = results.filter(id => id !== null);
        this.masterCandidates = this.masterCandidates.filter(c => !c.selected || failedIds.includes(c.id));
        this.applyFiltersAndSort();
        this.isDeleting = false;
        
        const successCount = selectedCandidates.length - failedIds.length;
        this.showAlert(`${successCount} candidate(s) successfully deleted.`, ['Close']);
      });
    };

    this.isAlertVisible = true;
  }

  // --- NEW ALERT HANDLER METHODS ---

  private showAlert(message: string, buttons: string[]): void {
    this.alertMessage = message;
    this.alertButtons = buttons;
    this.isAlertVisible = true;
    this.pendingAction = null; // Clear any pending action for info alerts
  }

  handleAlertAction(button: string): void {
    const action = button.toLowerCase();

    if (action === 'delete') {
      if (this.pendingAction) {
        this.pendingAction();
      }
    } else {
      // Any other button ('Cancel', 'Close', etc.) will just close the alert
      this.closeAlert();
    }
  }

   closeAlert(): void {
    this.isAlertVisible = false;
    this.pendingAction = null;
  }



  sortCandidates(event: Event): void {
    this.currentSort = (event.target as HTMLSelectElement).value;
    this.applyFiltersAndSort();
  }

  get f() { return this.candidateForm.controls; }

  showForm(source: 'Naukri' | 'External'): void {
    this.formSource = source;
    this.formVisible = true;
    this.submissionSuccess = false;
    this.submissionError = '';
  }

  startEdit(candidate: Candidate): void {
    if (candidate.id) {
      this.editingCandidateId = candidate.id;
      this.selectedFile = null;
      this.selectedFileName = candidate.resume ? this.getFileNameFromUrl(candidate.resume) : '';
      this.candidateForm.patchValue(candidate);
      this.showForm('External'); // Default to 'External' when editing
    }
  }
  
  getFileNameFromUrl(url: string): string {
    try {
      const urlObject = new URL(url);
      const pathSegments = urlObject.pathname.split('/');
      return decodeURIComponent(pathSegments.pop() || '');
    } catch (e) {
      return url; // Fallback if it's not a full URL
    }
  }

  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    const file: File | null = (target.files as FileList)[0];
    
    if (!file) { return; }

    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const maxSizeInBytes = 5 * 1024 * 1024; // 5 MB

    if (!allowedTypes.includes(file.type)) {
      alert('Invalid file type. Please upload a PDF or Word document.');
      target.value = '';
      return;
    }

    if (file.size > maxSizeInBytes) {
      alert('File is too large. Maximum size is 5 MB.');
      target.value = '';
      return;
    }

    this.selectedFile = file;
    this.selectedFileName = file.name;
  }
  
  deleteCandidate(id: number | undefined): void {
    if (!id) return;
    
    // 1. Set up the confirmation alert
    this.alertMessage = 'Are you sure you want to delete this candidate? This action cannot be undone.';
    this.alertButtons = ['Cancel', 'Delete'];

    // 2. Define what happens if the user confirms
    this.pendingAction = () => {
      this.candidateService.deleteCandidate(id).subscribe({
        next: () => {
          this.masterCandidates = this.masterCandidates.filter(c => c.id !== id);
          this.applyFiltersAndSort();
          // Trigger success alert
          this.showAlert('Candidate successfully deleted.', ['Close']);
        },
        error: (err) => {
          console.error('Failed to delete candidate', err);
          // Trigger error alert
          this.showAlert('Error: Could not delete the candidate.', ['Close']);
        }
      });
    };

    // 3. Show the alert
    this.isAlertVisible = true;
  }

  onSubmit(): void {
    this.submissionError = '';
    this.submissionSuccess = false;
    this.candidateForm.markAllAsTouched();

    if (this.candidateForm.invalid) {
      return;
    }

    this.isSubmitting = true;
    const formData = new FormData();

    Object.keys(this.candidateForm.controls).forEach(key => {
      const value = this.candidateForm.get(key)?.value;
      if (value !== null && value !== undefined) {
        formData.append(key, value);
      }
    });

    const userId = localStorage.getItem('user_id');
    if (userId) {
      formData.append('user_id', userId);
    }

    if (this.selectedFile) {
      formData.append('resume', this.selectedFile, this.selectedFile.name);
    }

    const handleSuccess = (candidate: Candidate) => {
      if (this.editingCandidateId) {
        const index = this.masterCandidates.findIndex(c => c.id === this.editingCandidateId);
        if (index !== -1) this.masterCandidates[index] = { ...candidate, selected: false };
      } else {
        this.masterCandidates.unshift({ ...candidate, selected: false });
      }
      this.applyFiltersAndSort();
      this.submissionSuccess = true;
      this.onCancel(); // Use onCancel to reset everything
    };

    const handleError = (err: HttpErrorResponse) => {
      if (err.status === 400) {
        const errors = err.error;
        const errorMessages = Object.keys(errors).map(field => `${field.replace(/_/g, ' ')}: ${errors[field][0]}`);
        this.submissionError = `Submission failed: ${errorMessages.join('; ')}`;
      } else {
        this.submissionError = 'An unexpected server error occurred. Please try again later.';
      }
      this.isSubmitting = false;
    };

    if (this.editingCandidateId) {
      this.candidateService.updateCandidate(this.editingCandidateId, formData).subscribe({
        next: handleSuccess,
        error: handleError
      });
    } else {
      this.candidateService.createCandidate(formData).subscribe({
        next: handleSuccess,
        error: handleError
      });
    }
  }

  onCancel(): void {
    this.formVisible = false; 
    this.editingCandidateId = null;
    this.candidateForm.reset();
    this.submissionError = '';
    // Do not reset submissionSuccess here so the message can be seen
    this.selectedFile = null;
    this.selectedFileName = '';
    this.isSubmitting = false;
  }
}