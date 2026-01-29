import { Component, OnInit, NgZone, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors, FormsModule } from '@angular/forms';
import { RecruiterWorkflowNavbarComponent } from '../../components/recruiter-workflow-navbar/recruiter-workflow-navbar.component';
import { RecruiterWorkflowCandidateService, Candidate } from '../../services/recruiter-workflow-candidate.service';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin, Subject, of, Observable, Subscription } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs/operators';
import { RelativeDatePipe } from '../../pipe/relative-date.pipe';
import { AlertMessageComponent } from '../../components/alert-message/alert-message.component';
// Added from Parent: Service for fetching Jobs
import { AdbRequirementService } from '../../services/adb-requirement.service';
// Import Google Maps Loader
import { Loader } from '@googlemaps/js-api-loader';
import { environment } from 'src/environments/environment';

// Custom validator
// 1. Existing Min < Max Validator (Refined)
export function minMaxValidator(minControlName: string, maxControlName: string) {
  return (formGroup: AbstractControl): ValidationErrors | null => {
    const minControl = formGroup.get(minControlName);
    const maxControl = formGroup.get(maxControlName);

    if (minControl && maxControl && minControl.value != null && maxControl.value != null) {
      // Parse float to ensure we compare numbers, not strings
      const minVal = parseFloat(minControl.value);
      const maxVal = parseFloat(maxControl.value);

      if (minVal > maxVal) {
        maxControl.setErrors({ ...maxControl.errors, minGreaterThanMax: true });
        return { minGreaterThanMax: true };
      } else {
        // Clean up this specific error if it exists
        if (maxControl.errors && maxControl.errors['minGreaterThanMax']) {
          delete maxControl.errors['minGreaterThanMax'];
          if (Object.keys(maxControl.errors).length === 0) {
            maxControl.setErrors(null);
          }
        }
      }
    }
    return null;
  };
}

// 2. NEW: Relevant <= Total Validator
export function relevantVsTotalValidator(group: AbstractControl): ValidationErrors | null {
  const totalMax = group.get('total_experience_max');
  const relevantMax = group.get('relevant_experience_max');

  if (totalMax && relevantMax && totalMax.value != null && relevantMax.value != null) {
    const totalVal = parseFloat(totalMax.value);
    const relevantVal = parseFloat(relevantMax.value);

    if (relevantVal > totalVal) {
      relevantMax.setErrors({ ...relevantMax.errors, relevantExceedsTotal: true });
      return { relevantExceedsTotal: true };
    } else {
      if (relevantMax.errors && relevantMax.errors['relevantExceedsTotal']) {
        delete relevantMax.errors['relevantExceedsTotal'];
        if (Object.keys(relevantMax.errors).length === 0) {
          relevantMax.setErrors(null);
        }
      }
    }
  }
  return null;
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

  // NEW: Track file validation error state
  showFileError = false;

  isParsingResume = false; // Add this state

  // Add property to class
  stagingId: number | null = null;



  // --- NEW PROPERTIES FOR DETAIL VIEW ---
  showDetailsModal = false;
  selectedCandidateDetails: Candidate | null = null;


  // --- Form Properties ---
  candidateForm!: FormGroup;
  isSubmitting = false;
  submissionSuccess = false;
  submissionError = '';
  formVisible = false;
  editingCandidateId: number | null = null;
  formSource: 'Naukri' | 'External' = 'Naukri';

  // --- Alert State Management (Child's system) ---
  isAlertVisible = false;
  alertMessage = '';
  alertButtons: string[] = [];
  private pendingAction: (() => void) | null = null;
  private isSuccessAlert = false;

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

  // --- Filter Panel Management ---
  isFilterPanelVisible = false;
  filterForm!: FormGroup;

  // --- Skills Management ---
  skills: string[] = [];

  // --- WORKFLOW MODAL PROPERTIES (Added from Parent) ---
  showWorkflowModal = false;
  selectedCandidateCount = 0;
  availableJobs: any[] = [];
  selectedJobId: number | null = null;

  // --- NEW: Loading States (From Child) ---
  isPageLoading: boolean = true;
  isActionLoading: boolean = false;

  // --- NEW: Permission Flag (From Parent) ---
  isSuperUser: boolean = false;

  // --- Dropdown Choices ---
  genderChoices = ['Male', 'Female', 'Others'];
  noticePeriodChoices = ['Immediate', 'Less than 15 Days', 'Less than 30 Days', 'Less than 60 Days', 'Less than 90 days'];
  ctcChoices = ['Fresher','1 LPA - 3 LPA', '4 LPA - 6 LPA', '7 LPA - 10 LPA', '11 LPA - 15 LPA', '16 LPA - 20 LPA', '21 LPA - 25 LPA', '26 LPA - 30 LPA', '30 LPA+'];

  // --- Google Maps Properties ---
  private readonly googleMapsApiKey: string = environment.googleMapsApiKey;
  private loader: Loader;
  private placesService: google.maps.places.AutocompleteService | undefined;
  private sessionToken: google.maps.places.AutocompleteSessionToken | undefined;
  private google: any;

  // Streams for Debouncing Input
  private preferredInput$ = new Subject<string>();
  private currentInput$ = new Subject<string>();
  
  // Suggestions State
  preferredSuggestions: google.maps.places.AutocompletePrediction[] = [];
  currentSuggestions: google.maps.places.AutocompletePrediction[] = [];
  showPreferredSuggestions = false;
  showCurrentSuggestions = false;

  // Selected Data Arrays (for Pills)
  preferredLocationsList: string[] = [];
  currentLocationsList: string[] = [];
  
  private subscriptions = new Subscription();


  constructor(
    private title: Title,
    private meta: Meta,
    private fb: FormBuilder,
    private ngZone: NgZone, // Needed for Google Maps callbacks
    private candidateService: RecruiterWorkflowCandidateService,
    // Added Injection
    private adbRequirementService: AdbRequirementService,
  ) {
    this.title.setTitle('Recruiter-Workflow-Candidate - Flashyre');
    this.initializeForm();
    this.initializeFilterForm();

     // Initialize Google Loader
    this.loader = new Loader({
      apiKey: this.googleMapsApiKey,
      version: 'weekly',
      libraries: ['places']
    });
  }

   openCandidateDetails(candidate: Candidate): void {
    this.selectedCandidateDetails = candidate;
    this.showDetailsModal = true;
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedCandidateDetails = null;
  }

   

  ngOnInit(): void {
    // The key is 'isSuperUser' and the value is the string 'true' (From Parent)
    this.isSuperUser = localStorage.getItem('isSuperUser') === 'true';
    this.loadCandidates();
    this.setupLocationAutocomplete();
  }

  ngAfterViewInit(): void {
    this.initializeGooglePlaces();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  // --- Google Maps Initialization ---
  private async initializeGooglePlaces(): Promise<void> {
    try {
      this.google = await this.loader.load();
      this.placesService = new this.google.maps.places.AutocompleteService();
    } catch (error) {
      console.error('Fatal error: Google Maps script could not be loaded.', error);
    }
  }

  // --- Setup RxJS Streams for Locations ---
  private setupLocationAutocomplete(): void {
    // 1. Preferred Location Stream
    this.subscriptions.add(
      this.preferredInput$.pipe(
        debounceTime(300),
        distinctUntilChanged(),
        tap(() => {
          this.showPreferredSuggestions = true;
          this.initSessionToken();
        }),
        switchMap(term => this.getPlacePredictions(term))
      ).subscribe(suggestions => {
        this.ngZone.run(() => {
          this.preferredSuggestions = suggestions;
        });
      })
    );

    // 2. Current Location Stream
    this.subscriptions.add(
      this.currentInput$.pipe(
        debounceTime(300),
        distinctUntilChanged(),
        tap(() => {
          this.showCurrentSuggestions = true;
          this.initSessionToken();
        }),
        switchMap(term => this.getPlacePredictions(term))
      ).subscribe(suggestions => {
        this.ngZone.run(() => {
          this.currentSuggestions = suggestions;
        });
      })
    );
  }

  private initSessionToken(): void {
    if (this.google && !this.sessionToken) {
      this.sessionToken = new this.google.maps.places.AutocompleteSessionToken();
    }
  }

  private getPlacePredictions(term: string): Observable<google.maps.places.AutocompletePrediction[]> {
    if (!term.trim() || !this.placesService) {
      return of([]);
    }
    
    // Check if sessionToken needs initialization again
    if (!this.sessionToken && this.google) {
      this.sessionToken = new this.google.maps.places.AutocompleteSessionToken();
    }

    return new Observable(observer => {
      const request = {
        input: term,
        types: ['(cities)'], // Filter for cities
        sessionToken: this.sessionToken
      };

      this.placesService!.getPlacePredictions(request, (predictions, status) => {
        this.ngZone.run(() => {
          if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
            observer.next(predictions);
          } else {
            observer.next([]);
          }
          observer.complete();
        });
      });
    });
  }

  // --- HTML Event Handlers ---

  onPreferredLocationInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    
    // SANITIZATION: Allow only Alphabets, Numbers, Spaces, and Hyphens
    // Regex explanation: [^a-zA-Z0-9 \-] matches anything that is NOT a letter, number, space, or hyphen.
    input.value = input.value.replace(/[^a-zA-Z \-]/g, '');

    const term = input.value;
    if (!term.trim()) {
      this.showPreferredSuggestions = false;
      return;
    }
    this.preferredInput$.next(term);
  }

  onCurrentLocationInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    
    // SANITIZATION: Allow only Alphabets, Numbers, Spaces, and Hyphens
    input.value = input.value.replace(/[^a-zA-Z \-]/g, '');

    const term = input.value;
    if (!term.trim()) {
      this.showCurrentSuggestions = false;
      return;
    }
    this.currentInput$.next(term);
  }

  selectPreferredLocation(prediction: google.maps.places.AutocompletePrediction, inputElement: HTMLInputElement): void {
    const locationName = prediction.description; // or structured_formatting.main_text
    if (!this.preferredLocationsList.includes(locationName)) {
      this.preferredLocationsList.push(locationName);
      this.updateLocationControl('preferred_location', this.preferredLocationsList);
    }
    
    inputElement.value = '';
    this.showPreferredSuggestions = false;
    this.preferredSuggestions = [];
    this.sessionToken = undefined; // Reset token after selection
  }

  selectCurrentLocation(prediction: google.maps.places.AutocompletePrediction, inputElement: HTMLInputElement): void {
    const locationName = prediction.description;
    if (!this.currentLocationsList.includes(locationName)) {
      this.currentLocationsList.push(locationName);
      this.updateLocationControl('current_location', this.currentLocationsList);
    }

    inputElement.value = '';
    this.showCurrentSuggestions = false;
    this.currentSuggestions = [];
    this.sessionToken = undefined;
  }

  // Allow manual entry (Enter key) if they type something not in Google Maps
  addManualLocation(event: any, type: 'preferred' | 'current'): void {
    const value = event.target.value.trim();
    if (value) {
      if (type === 'preferred') {
        if (!this.preferredLocationsList.includes(value)) {
          this.preferredLocationsList.push(value);
          this.updateLocationControl('preferred_location', this.preferredLocationsList);
        }
        this.showPreferredSuggestions = false;
      } else {
        if (!this.currentLocationsList.includes(value)) {
          this.currentLocationsList.push(value);
          this.updateLocationControl('current_location', this.currentLocationsList);
        }
        this.showCurrentSuggestions = false;
      }
      event.target.value = '';
    }
    event.preventDefault();
  }

  removeLocation(type: 'preferred' | 'current', index: number): void {
    if (type === 'preferred') {
      this.preferredLocationsList.splice(index, 1);
      this.updateLocationControl('preferred_location', this.preferredLocationsList);
    } else {
      this.currentLocationsList.splice(index, 1);
      this.updateLocationControl('current_location', this.currentLocationsList);
    }
  }

  private updateLocationControl(controlName: string, list: string[]): void {
    this.candidateForm.controls[controlName].setValue(list.join(', '));
  }


   // === NEW METHOD START ===
  openResume(url: string | undefined): void {
    if (!url) {
      this.showAlert('No resume file attached for this candidate.', ['Close']);
      return;
    }
    window.open(url, '_blank');
  }

  private initializeForm(): void {
    const locationPattern = /.*[a-zA-Z].*/;
    this.candidateForm = this.fb.group({
      first_name: ['', [
        Validators.required, 
        Validators.pattern(/^[a-zA-Z\s]*$/), 
        Validators.maxLength(15) 
      ]],
      last_name: ['', [
        Validators.required, 
        Validators.pattern(/^[a-zA-Z\s]*$/), 
        Validators.maxLength(15) 
      ]],
      phone_number: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      email: ['', [Validators.required, Validators.email]],
      total_experience: [null, [Validators.required, Validators.min(0), Validators.max(99)]],
      relevant_experience: [null, [Validators.required, Validators.min(0), Validators.max(99)]],
      expected_ctc_min: [null, [Validators.required, Validators.min(0)]],
      expected_ctc_max: [null, [Validators.required, Validators.min(0)]],
      current_ctc: ['', Validators.required],
      // --- MODIFIED LOCATION VALIDATORS ---
      preferred_location: ['', [Validators.required, Validators.pattern(locationPattern)]],
      current_location: ['', [Validators.required, Validators.pattern(locationPattern)]],
      notice_period: ['', Validators.required],
      gender: ['', Validators.required],
      work_experience: ['', [Validators.required, Validators.maxLength(30)]], // Child had pattern, Parent had required. Keeping required for general use, using method for pattern
      skills: ['', Validators.required,],
    }, {
      validators: [
        minMaxValidator('expected_ctc_min', 'expected_ctc_max'),
        this.singleRelevantVsTotalValidator
      ]
    });
  }

  // 4. NEW VALIDATOR for single fields
  singleRelevantVsTotalValidator(group: AbstractControl): ValidationErrors | null {
    const total = group.get('total_experience');
    const relevant = group.get('relevant_experience');

    if (total && relevant && total.value != null && relevant.value != null) {
      if (parseFloat(relevant.value) > parseFloat(total.value)) {
        relevant.setErrors({ ...relevant.errors, relevantExceedsTotal: true });
        return { relevantExceedsTotal: true };
      } else {
        if (relevant.errors && relevant.errors['relevantExceedsTotal']) {
          delete relevant.errors['relevantExceedsTotal'];
          if (Object.keys(relevant.errors).length === 0) {
            relevant.setErrors(null);
          }
        }
      }
    }
    return null;
  }

  private initializeFilterForm(): void {
    this.filterForm = this.fb.group({
      name: [''],
      location: [''],
      skills: [''],
      current_ctc: [''],
      email: [''],
      phone: [''] // 1. ADDED: Phone Control from Parent
    });
  }

  preventInvalidChars(event: KeyboardEvent): void {
    if (['e', 'E', '+', '-'].includes(event.key)) {
      event.preventDefault();
    }
  }

  // === NEW HELPER: Enforce 2 digits logic on paste or strict typing ===
  enforceTwoDigits(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.value.length > 2) {
      input.value = input.value.slice(0, 2);
      // We must manually trigger the form control update because slicing the value 
      // programmatically might not always trigger Angular's change detection immediately
      const controlName = input.getAttribute('formControlName');
      if (controlName && this.candidateForm.get(controlName)) {
        this.candidateForm.get(controlName)?.setValue(input.value);
      }
    }
  }

  

  loadCandidates(): void {
    // Merged: Using Child's Loading State
    this.isPageLoading = true;
    this.candidateService.getCandidates().subscribe({
      next: (data) => {
        this.masterCandidates = data.map(c => ({ ...c, selected: false }));
        this.applyFiltersAndSort();
        this.isPageLoading = false;
      },
      error: (err) => { 
        console.error("Failed to load candidates.", err); 
        this.isPageLoading = false;
      }
    });
  }

  // --- PARENT FEATURE: Add to Workflow Logic ---
  openAddToWorkflowModal() {
    const selected = this.masterCandidates.filter(c => c.selected);
    if (selected.length === 0) {
      // Using Child's alert system
      this.showAlert("Please select at least one candidate.", ["Close"]);
      return;
    }

    this.selectedCandidateCount = selected.length;
    this.selectedJobId = null; 
    
    // Fetch Jobs for Dropdown
    this.adbRequirementService.getRequirements().subscribe({
      next: (jobs) => {
        this.availableJobs = jobs;
        this.showWorkflowModal = true;
      },
      error: () => this.showAlert("Failed to load job requirements.", ["Close"])
    });
  }

  closeWorkflowModal() {
    this.showWorkflowModal = false;
  }

  confirmAddToWorkflow() {
    if (!this.selectedJobId) return;

    // Merged: Using Child's Loading State
    this.isActionLoading = true;

    const selectedIds = this.masterCandidates
      .filter(c => c.selected && c.id)
      .map(c => c.id!);

    this.candidateService.addCandidatesToJob(this.selectedJobId, selectedIds).subscribe({
      next: (res: any) => {
        this.isActionLoading = false;
        this.closeWorkflowModal();
        
        let msg = '';
        if (res.existing > 0) {
          msg = `Successfully added ${res.added} candidate(s). Note: ${res.existing} candidate(s) were already in this workflow.`;
        } else {
          msg = `Successfully added ${res.added} candidate(s) to the workflow.`;
        }
        
        this.showAlert(msg, ["Close"]);
        
        // Optional: Deselect candidates after adding
        this.masterCandidates.forEach(c => c.selected = false);
        this.updateSelectAllState();
      },
      error: (err) => {
        this.isActionLoading = false;
        this.closeWorkflowModal();
        this.showAlert("Failed to add candidates to workflow.", ["Close"]);
      }
    });
  }
  // ---------------------------------------------

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

    // 2. ADDED: Phone Filtering Logic (From Parent)
    if (filterValues.phone) {
      const phoneFilter = filterValues.phone.trim();
      candidates = candidates.filter(c => c.phone_number.includes(phoneFilter));
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
    // Reset phone as well (From Parent)
    this.filterForm.reset({ name: '', location: '', skills: '', current_ctc: '', email: '', phone: '' });
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

  // --- ALERT HANDLER METHODS ---
  private showAlert(message: string, buttons: string[]): void {
    this.alertMessage = message;
    this.alertButtons = buttons;
    this.isAlertVisible = true;
    this.pendingAction = null;
  }

  handleAlertAction(button: string): void {
    const action = button.toLowerCase();
    if (action === 'delete') {
      if (this.pendingAction) {
        this.pendingAction();
      }
    } else {
      this.closeAlert();
      if (this.isSuccessAlert) {
        this.onCancel();
      }
    }
  }

  closeAlert(): void {
    this.isAlertVisible = false;
    this.pendingAction = null;
    this.isSuccessAlert = false;
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

  // --- SKILLS MANAGEMENT (Merged Logic from Child) ---
  addSkill(event: KeyboardEvent): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.trim();
    // Use Child's strict regex (Only Alphabets)
    value = value.replace(/[^a-zA-Z #+]/g, '');
    if (value) {
      if (!this.skills.includes(value)) {
        this.skills.push(value);
      }
      input.value = '';
      this.updateSkillsFormControl();
    }
    event.preventDefault();
  }

  removeSkill(index: number): void {
    this.skills.splice(index, 1);
    this.updateSkillsFormControl();
  }

  private updateSkillsFormControl(): void {
    this.candidateForm.controls['skills'].setValue(this.skills.join(', '));
  }

  startEdit(candidate: Candidate): void {
    // 1. Get Permissions
    const currentUserId = localStorage.getItem('user_id');
    const isSuperUser = localStorage.getItem('isSuperUser') === 'true';

    // 2. Resolve Creator ID
    // Django returns 'user' as the ID (number). Convert to string for safe comparison.
    const creatorId = candidate.user ? String(candidate.user) : null;

    // 3. Permission Logic
    // Allow if Super User OR if Current User matches Creator
    if (isSuperUser || (currentUserId && creatorId === currentUserId)) {
    if (candidate.id) {
      this.editingCandidateId = candidate.id;
      this.selectedFile = null;
      this.selectedFileName = candidate.resume ? this.getFileNameFromUrl(candidate.resume) : '';
      
      this.candidateForm.patchValue(candidate);
      
      // Parse Arrays
      this.skills = candidate.skills ? candidate.skills.split(',').map(s => s.trim()).filter(Boolean) : [];
      this.preferredLocationsList = candidate.preferred_location 
        ? candidate.preferred_location.split(',').map(s => s.trim()).filter(Boolean) 
        : [];
      this.currentLocationsList = candidate.current_location 
        ? candidate.current_location.split(',').map(s => s.trim()).filter(Boolean) 
        : [];

         this.candidateForm.controls['skills'].setValue(this.skills.join(', '));
        this.candidateForm.controls['preferred_location'].setValue(this.preferredLocationsList.join(', '));
        this.candidateForm.controls['current_location'].setValue(this.currentLocationsList.join(', '));

      // CHECK SOURCE: If candidate.source exists, use it. Otherwise default to 'External'.
      const sourceToOpen = (candidate.source === 'Naukri') ? 'Naukri' : 'External';
      this.showForm(sourceToOpen); 
    }
        } else {
      // 4. Access Denied
      this.showAlert(
        "Access Denied: You do not have permission to edit this candidate. Only the creator or a Super Admin can perform this action.", 
        ['Close']
      );
    }

  }
  
  getFileNameFromUrl(url: string): string {
    try {
      const urlObject = new URL(url);
      const pathSegments = urlObject.pathname.split('/');
      return decodeURIComponent(pathSegments.pop() || '');
    } catch (e) {
      return url;
    }
  }

  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    const file: File | null = (target.files as FileList)[0];
    
    if (!file) { return; }

    // Validation (Keep your existing validation logic here)
    const maxSizeInBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      alert('File is too large. Max 5 MB.');
      target.value = '';
      return;
    }

    // 2. VALIDATION: Empty File (0 Bytes) - Frontend Check
    if (file.size === 0) {
      this.showAlert("The uploaded file is empty (0 bytes). Please upload a valid Resume.", ['Close']);
      target.value = ''; // Clear input
      return;
    }

    this.selectedFile = file;
    this.selectedFileName = file.name;
    
    // Start Parsing
    this.isParsingResume = true;
    this.showFileError = false;

    // Call Service
    this.candidateService.parseResume(file).subscribe({
      next: (response: any) => {
        this.isParsingResume = false;

        console.log("Backend Response:", response); // CHECK CONSOLE LOGS

        // --- 1. HANDLE GENERAL ERRORS (e.g. Empty File) ---
        // If success is false and we have a specific error message but NO validation 'errors' object
        if (!response.success && response.error && !response.errors) {
            this.showAlert(response.error, ['Close']);
            this.onCancel(); // <--- CRITICAL: Reset form and file input immediately
            return;
        }

        // --- 1. CHECK FOR DUPLICATES (Specific Error Handling) ---
        if (response.errors) {
          // Convert error objects to string to check for 'unique' code or message
          const phoneErrStr = response.errors.phone_number ? JSON.stringify(response.errors.phone_number) : '';
          const emailErrStr = response.errors.email ? JSON.stringify(response.errors.email) : '';

          // Check if errors contain "unique" or "already exists"
          const isPhoneDuplicate = phoneErrStr.includes('unique') || phoneErrStr.includes('already exists');
          const isEmailDuplicate = emailErrStr.includes('unique') || emailErrStr.includes('already exists');

          // A. Both Duplicate
          if (isPhoneDuplicate && isEmailDuplicate) {
            this.showAlert("A candidate with this Phone Number and Email ID already exists.", ['Close']);
            this.onCancel(); // Clear form and file input
            return;
          } 
          // B. Phone Duplicate
          else if (isPhoneDuplicate) {
            this.showAlert("A candidate with this Phone Number already exists.", ['Close']);
            this.onCancel(); // Clear form and file input
            return;
          } 
          // C. Email Duplicate
          else if (isEmailDuplicate) {
            this.showAlert("A candidate with this Email ID already exists.", ['Close']);
            this.onCancel(); // Clear form and file input
            return;
          }
        }


        // SUCCESS PATH
            if (response.success && response.staging_id) {
                // 1. Store Staging ID
                this.stagingId = response.staging_id;
                
                // 2. Ensure we are in CREATE mode, not EDIT mode
                this.editingCandidateId = null; 

                // 3. Populate Form
                this.populateFormWithData(response.data);
                
                this.showAlert("Resume parsed! Please review the details and click Submit.", ['Close']);
            }
        },
      error: (err) => {
        this.isParsingResume = false;
        
        if (err.status === 409) {
           // Duplicate Error from Django IntegrityError
           this.showAlert("Candidate with this Email or Phone already exists.", ['Close']);
           // Reset file input
           this.selectedFile = null;
           this.selectedFileName = '';
           target.value = '';
        } else {
           // General Error
           this.showAlert("Could not parse resume automatically. Please fill manually.", ['Close']);
        }
      }
    });
  }

  // 2. Helper to Populate Form (Reused for Edit & Parse)
  populateFormWithData(data: any): void {
    if (!data) return;

    // Handle Skills (Convert String to Array for Pills)
    if (data.skills) {
      // Check if it's already an array or a comma-string
      if (Array.isArray(data.skills)) {
         this.skills = data.skills;
      } else {
         this.skills = data.skills.split(',').map((s: string) => s.trim()).filter(Boolean);
      }
      this.updateSkillsFormControl(); // Updates the hidden form control
    }

    // Handle Preferred Location (Pills)
    if (data.preferred_location) {
      this.preferredLocationsList = data.preferred_location.split(',').map((s: string) => s.trim()).filter(Boolean);
      this.candidateForm.controls['preferred_location'].setValue(this.preferredLocationsList.join(', '));
    }

    // Handle Current Location (Pills)
    if (data.current_location) {
      this.currentLocationsList = data.current_location.split(',').map((s: string) => s.trim()).filter(Boolean);
      this.candidateForm.controls['current_location'].setValue(this.currentLocationsList.join(', '));
    }

    // Patch Standard Fields
    this.candidateForm.patchValue({
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
      phone_number: data.phone_number,
      work_experience: data.work_experience,
      // MAP MIN TO SINGLE FIELD (Since AI usually gives a range, start with min)
      total_experience: data.total_experience_min, 
      relevant_experience: data.relevant_experience_min, 
      expected_ctc_min: data.expected_ctc_min,
      expected_ctc_max: data.expected_ctc_max,
      // Use helper to match dropdowns case-insensitively
      current_ctc: this.matchDropdown(data.current_ctc, this.ctcChoices),
      notice_period: this.matchDropdown(data.notice_period, this.noticePeriodChoices),
      gender: this.matchDropdown(data.gender, this.genderChoices),
    });
  }

  // 3. Helper for Dropdown Matching
  matchDropdown(value: string, options: string[]): string {
    if (!value) return '';
    // Find option that matches closely (ignoring case)
    const match = options.find(opt => opt.toLowerCase() === value.toLowerCase());
    return match || ''; 
  }
  
  deleteCandidate(id: number | undefined): void {
    if (!id) return;
    
    this.alertMessage = 'Are you sure you want to delete this candidate? This action cannot be undone.';
    this.alertButtons = ['Cancel', 'Delete'];

    this.pendingAction = () => {
      this.candidateService.deleteCandidate(id).subscribe({
        next: () => {
          this.masterCandidates = this.masterCandidates.filter(c => c.id !== id);
          this.applyFiltersAndSort();
          this.showAlert('Candidate successfully deleted.', ['Close']);
        },
        error: (err) => {
          console.error('Failed to delete candidate', err);
          this.showAlert('Error: Could not delete the candidate.', ['Close']);
        }
      });
    };
    this.isAlertVisible = true;
  }

  onSubmit(): void {
    this.candidateForm.markAllAsTouched();

    // Check if file is missing
    const isFileMissing = !this.selectedFileName || this.selectedFileName.trim() === '';

    // Set the error flag for HTML to see
    this.showFileError = isFileMissing;

    // Combined Check: Form Invalid OR File Missing
    if (this.candidateForm.invalid || isFileMissing) {
      
      const invalidFields: string[] = [];
      const controls = this.candidateForm.controls;

      if (isFileMissing) {
        invalidFields.push('Resume File');
      }

      for (const name in controls) {
        if (controls[name].invalid) {
          if (name === 'work_experience') {
            invalidFields.push('Role');
          } else if (name === 'current_ctc') {
            invalidFields.push('Current CTC');
          } else {
            const readableName = name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            invalidFields.push(readableName);
          }
        }
      }

      this.showAlert(
        `Please check the following fields: ${invalidFields.join(', ')}`, 
        ['Close']
      );
      return;
    }

    this.isSubmitting = true;
    // ... rest of your existing submission logic (FormData creation, API call) ...
    const formData = new FormData();
    Object.keys(this.candidateForm.controls).forEach(key => {
      const value = this.candidateForm.get(key)?.value;
      // 6. SPECIAL HANDLING: Map single input to DB min/max fields
      if (key === 'total_experience') {
          if (value !== null) {
              formData.append('total_experience_min', value);
              formData.append('total_experience_max', value);
          }
      } 
      else if (key === 'relevant_experience') {
          if (value !== null) {
              formData.append('relevant_experience_min', value);
              formData.append('relevant_experience_max', value);
          }
      } 
      else if (value !== null && value !== undefined) { formData.append(key, value); }
    });

    // CRITICAL: Handle the File
    // Case 1: Manual Upload (User didn't use AI) -> Append selectedFile
    // Case 2: AI Parse (Staging) -> Append staging_id
    
    if (this.stagingId) {
        formData.append('staging_id', this.stagingId.toString());
    } else if (this.selectedFile) {
        formData.append('resume', this.selectedFile);
    }

    const userId = localStorage.getItem('user_id');
    if (userId) { formData.append('user_id', userId); }
    formData.append('source', this.formSource);

    if (this.selectedFile) { formData.append('resume', this.selectedFile, this.selectedFile.name); }

    const handleSuccess = (candidate: Candidate) => {
      if (this.editingCandidateId) {
        const index = this.masterCandidates.findIndex(c => c.id === this.editingCandidateId);
        if (index !== -1) this.masterCandidates[index] = { ...candidate, selected: false };
      } else {
        this.masterCandidates.unshift({ ...candidate, selected: false });
      }
      this.applyFiltersAndSort();
      
      this.isSuccessAlert = true;
      this.showAlert(this.editingCandidateId ? 'Candidate updated successfully!' : 'Candidate created successfully!', ['Close']);
      this.onCancel();
    };

    const handleError = (err: HttpErrorResponse) => {
      let errorMessage = 'An unexpected server error occurred. Please try again later.';
      if (err.status === 400) {
        const errors = err.error;
        const errorMessages = Object.keys(errors).map(field => `${field.replace(/_/g, ' ')}: ${errors[field][0]}`);
        errorMessage = `Submission failed: ${errorMessages.join('; ')}`;
      }
      this.showAlert(errorMessage, ['Close']);
      this.isSubmitting = false;
    };

    if (this.editingCandidateId) {
      this.candidateService.updateCandidate(this.editingCandidateId, formData).subscribe({ next: handleSuccess, error: handleError });
    } else {
      this.candidateService.createCandidate(formData).subscribe({ next: handleSuccess, error: handleError });
    }
  }

  // 3. UPDATE: Reset error on Cancel
  onCancel(): void {
    this.formVisible = false; 
    this.editingCandidateId = null;
    this.candidateForm.reset();
    this.submissionError = '';
    this.selectedFile = null;
    this.selectedFileName = '';
    this.isSubmitting = false;
    this.skills = []; 
    this.preferredLocationsList = [];
    this.currentLocationsList = [];
    this.preferredSuggestions = [];
    this.currentSuggestions = [];
    
    this.showFileError = false; // <--- RESET ERROR HERE
  }

  // --- NEW Helper Methods from Child ---
  
  // 1. For Work Experience: Allows only Letters, Numbers, and Spaces
  allowAlphanumericOnly(event: Event): void {
    const input = event.target as HTMLInputElement;
    // Replace anything that is NOT (a-z, A-Z, 0-9, or space) with empty string
    input.value = input.value.replace(/[^a-zA-Z0-9 ]/g, '');
    
    // Update the form control manually to ensure the model stays in sync
    this.candidateForm.get('work_experience')?.setValue(input.value);
  }

  // 2. For Skills: Allows only Letters and Spaces (No numbers, No special chars)
  allowAlphabetsOnly(event: Event): void {
    const input = event.target as HTMLInputElement;
    // Replace anything that is NOT (a-z, A-Z, or space) with empty string
    input.value = input.value.replace(/[^a-zA-Z #+]/g, '');
  }
}