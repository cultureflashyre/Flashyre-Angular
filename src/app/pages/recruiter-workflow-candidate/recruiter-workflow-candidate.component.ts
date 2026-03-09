import { Component, OnInit, NgZone, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors, FormsModule, FormArray, FormControl } from '@angular/forms';
import { RecruiterWorkflowNavbarComponent } from '../../components/recruiter-workflow-navbar/recruiter-workflow-navbar.component';
import { RecruiterWorkflowCandidateService, Candidate, RegisteredUser } from '../../services/recruiter-workflow-candidate.service';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin, Subject, of, Observable, Subscription, timer } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, switchMap, tap, takeWhile } from 'rxjs/operators';
import { RelativeDatePipe } from '../../pipe/relative-date.pipe';
import { AlertMessageComponent } from '../../components/alert-message/alert-message.component';
import { AdbRequirementService } from '../../services/adb-requirement.service';
import { Loader } from '@googlemaps/js-api-loader';
import { environment } from 'src/environments/environment';
import { PollingService } from '../../services/polling.service'; // Import Polling Service

// Custom Validators
export function minMaxValidator(minControlName: string, maxControlName: string) {
  return (formGroup: AbstractControl): ValidationErrors | null => {
    const minControl = formGroup.get(minControlName);
    const maxControl = formGroup.get(maxControlName);

    if (minControl && maxControl && minControl.value != null && maxControl.value != null) {
      const minVal = parseFloat(minControl.value);
      const maxVal = parseFloat(maxControl.value);

      if (minVal > maxVal) {
        maxControl.setErrors({ ...maxControl.errors, minGreaterThanMax: true });
        return { minGreaterThanMax: true };
      } else {
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
export class RecruiterWorkflowCandidate implements OnInit, OnDestroy {

  // --- TAB STATE MANAGEMENT ---
  activeTab: 'sourced' | 'registered' = 'sourced';
  registeredCandidates: RegisteredUser[] = [];
  displayRegisteredCandidates: RegisteredUser[] = [];

  // --- General State ---
  showFileError = false;
  isParsingResume = false;
  stagingId: number | null = null;
  isSuperUser: boolean = false;
  isRecruiterUser: boolean = false;

  // --- Loading States ---
  isPageLoading: boolean = true;
  isActionLoading: boolean = false;

  // --- Detail Modal ---
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

  // --- Alert State ---
  isAlertVisible = false;
  alertMessage = '';
  alertButtons: string[] = [];
  private pendingAction: (() => void) | null = null;
  private isSuccessAlert = false;

  // --- File Management ---
  selectedFile: File | null = null;
  selectedFileName = '';

  // --- Sourced Candidates Data ---
  masterCandidates: Candidate[] = [];
  displayCandidates: Candidate[] = [];

  // --- List Management ---
  isAllSelected = false;
  isDeleting = false;
  currentSort = 'none';

  // --- Filter Panel ---
  isFilterPanelVisible = false;
  filterForm!: FormGroup;

  // --- Skills ---
  skills: string[] = [];

  // --- Workflow Modal ---
  showWorkflowModal = false;
  selectedCandidateCount = 0;
  availableJobs: any[] = [];
  selectedJobId: number | null = null;

  // --- Dropdown Choices ---
  genderChoices = ['Male', 'Female', 'Others'];
  noticePeriodChoices = ['Immediate', 'Less than 15 Days', 'Less than 30 Days', 'Less than 60 Days', 'Less than 90 days'];
  ctcChoices = ['Fresher', '1 LPA - 3 LPA', '4 LPA - 6 LPA', '7 LPA - 10 LPA', '11 LPA - 15 LPA', '16 LPA - 20 LPA', '21 LPA - 25 LPA', '26 LPA - 30 LPA', '30 LPA+'];

  // --- Google Maps ---
  private readonly googleMapsApiKey: string = environment.googleMapsApiKey;
  private loader: Loader;
  private placesService: google.maps.places.AutocompleteService | undefined;
  private sessionToken: google.maps.places.AutocompleteSessionToken | undefined;
  private google: any;

  private preferredInput$ = new Subject<string>();
  private currentInput$ = new Subject<string>();

  preferredSuggestions: google.maps.places.AutocompletePrediction[] = [];
  currentSuggestions: google.maps.places.AutocompletePrediction[] = [];
  showPreferredSuggestions = false;
  showCurrentSuggestions = false;

  preferredLocationsList: string[] = [];
  currentLocationsList: string[] = [];

  private subscriptions = new Subscription();

  // --- Pagination Properties ---
  currentPage: number = 1;
  totalCount: number = 0;
  totalPages: number = 1;
  nextPageUrl: string | null = null;
  prevPageUrl: string | null = null;

  // --- Structured Location Fields (from Google Places) ---
  selectedCity: string = '';
  selectedState: string = '';
  selectedPlaceId: string = '';

  constructor(
    private title: Title,
    private meta: Meta,
    private fb: FormBuilder,
    private ngZone: NgZone,
    private candidateService: RecruiterWorkflowCandidateService,
    private adbRequirementService: AdbRequirementService,
    private pollingService: PollingService // Inject Polling Service
  ) {
    this.title.setTitle('Recruiter-Workflow-Candidate - Flashyre');
    this.initializeForm();
    this.initializeFilterForm();

    this.loader = new Loader({
      apiKey: this.googleMapsApiKey,
      version: 'weekly',
      libraries: ['places']
    });
  }

  ngOnInit(): void {
    this.isSuperUser = localStorage.getItem('isSuperUser') === 'true';
    this.isRecruiterUser = localStorage.getItem('userType') === 'recruiter';

    // Load both datasets
    this.loadCandidates();
    this.loadRegisteredUsers();

    this.setupLocationAutocomplete();
  }

  private getUserIdFromValue(user: any): string {
    if (!user) return '';
    if (typeof user === 'object') {
      return String(user.user_id || user.id || '').trim();
    }
    return String(user).trim();
  }

  private isUserAuthorizedForJob(job: any): boolean {
    if (this.isSuperUser || !this.isRecruiterUser) return true;

    const currentUserId = String(localStorage.getItem('user_id') || '').trim();
    if (!currentUserId || !job) return false;

    const assignedList = Array.isArray(job.assigned_users_details)
      ? job.assigned_users_details
      : (Array.isArray(job.assigned_users) ? job.assigned_users : []);
    const assignedIds = assignedList.map((user: any) => this.getUserIdFromValue(user)).filter(Boolean);

    return assignedIds.includes(currentUserId);
  }

  ngAfterViewInit(): void {
    this.initializeGooglePlaces();
  }

  ngOnDestroy(): void {
    if (this.subscriptions) {
      this.subscriptions.unsubscribe();
    }
    if (this.pollSubscription) {
      this.pollSubscription.unsubscribe();
    }
  }
  // =========================================================
  // TAB & DATA LOADING LOGIC
  // =========================================================

  setActiveTab(tab: 'sourced' | 'registered'): void {
    this.activeTab = tab;
    // Re-apply filters when switching tabs so view is consistent
    this.applyFiltersAndSort();

    // Optional: Reset selection in Sourced tab to avoid confusion
    if (tab === 'registered') {
      this.isAllSelected = false;
    } else {
      this.updateSelectAllState();
    }
  }

  loadRegisteredUsers(): void {
    // Only show full page loader if initial load
    if (this.masterCandidates.length === 0 && this.registeredCandidates.length === 0) {
      this.isPageLoading = true;
    }

    this.candidateService.getRegisteredCandidates().subscribe({
      next: (data) => {
        // Map to RegisteredUser array
        this.registeredCandidates = data.map(u => ({ ...u, selected: false }));
        // Apply default sort/filter
        this.applyFiltersAndSort();
        this.isPageLoading = false;
      },
      error: (err) => {
        console.error("Failed to load registered users", err);
        this.isPageLoading = false;
      }
    });
  }

  loadCandidates(page: number = 1): void {
    this.isPageLoading = true;
    this.currentPage = page;
    this.candidateService.getCandidates(page).subscribe({
      next: (response: any) => {
        // Handle paginated response
        const data = response.results || response;
        this.totalCount = response.count || data.length;
        this.totalPages = Math.ceil(this.totalCount / 30);
        this.nextPageUrl = response.next;
        this.prevPageUrl = response.previous;

        this.masterCandidates = data.map((c: any) => ({ ...c, selected: false }));
        this.applyFiltersAndSort();
        this.isPageLoading = false;
      },
      error: (err) => {
        console.error("Failed to load candidates.", err);
        this.isPageLoading = false;
      }
    });
  }

  // =========================================================
  // SHARED FILTERING & SORTING LOGIC (UPDATED)
  // =========================================================

  applyFiltersAndSort(): void {
    const filterValues = this.filterForm.value;
    const isSourced = this.activeTab === 'sourced';

    // 1. Select the Source Array
    // We create a copy to avoid mutating the master list
    let candidates: any[] = isSourced ? [...this.masterCandidates] : [...this.registeredCandidates];

    // --- SHARED TEXT FILTERS (SUBSTRING MATCH) ---

    // Name Filter
    if (filterValues.name) {
      const nameFilter = filterValues.name.toLowerCase();
      candidates = candidates.filter(c =>
        (c.first_name + ' ' + c.last_name).toLowerCase().includes(nameFilter)
      );
    }

    // Email Filter
    if (filterValues.email) {
      const emailFilter = filterValues.email.toLowerCase();
      candidates = candidates.filter(c => c.email.toLowerCase().includes(emailFilter));
    }

    // Phone Filter
    if (filterValues.phone) {
      const phoneFilter = filterValues.phone.trim();
      candidates = candidates.filter(c => c.phone_number.includes(phoneFilter));
    }

    // --- COMPLEX FILTERS (DATA SOURCE DIFFERS) ---

    // Location Filter (Dynamic Substring)
    if (filterValues.location) {
      const locFilter = filterValues.location.toLowerCase();
      candidates = candidates.filter(c => {
        const val = isSourced ? c.current_location : (c.sourced_data?.current_location || '');
        // Substring match: "Mountain" matches "Mountain View"
        return val ? val.toLowerCase().includes(locFilter) : false;
      });
    }

    // Skills Filter (Dynamic Substring)
    if (filterValues.skills) {
      // User might enter "java, python"
      const skillFilters = filterValues.skills.toLowerCase().split(',').map((s: string) => s.trim()).filter(Boolean);

      if (skillFilters.length > 0) {
        candidates = candidates.filter(c => {
          // Get raw string (e.g., "html5, css, react")
          const rawSkills = isSourced ? c.skills : (c.sourced_data?.skills || '');
          if (!rawSkills) return false;

          // Split candidate skills into array
          const candidateSkills = rawSkills.toLowerCase().split(',').map((s: string) => s.trim());

          // LOGIC UPDATE:
          // Check if ANY of the user's search terms match ANY of the candidate's skills.
          // "html" (search) -> "html5" (candidate skill) => TRUE
          // "java" (search) -> "javascript" (candidate skill) => TRUE
          return skillFilters.some((skillFilter: string) =>
            candidateSkills.some((skill: string) => skill.includes(skillFilter))
          );
        });
      }
    }

    // CTC Filter (Exact Match retained as CTC is a dropdown)
    if (filterValues.current_ctc) {
      candidates = candidates.filter(c => {
        const val = isSourced ? c.current_ctc : (c.sourced_data?.current_ctc || '');
        return val === filterValues.current_ctc;
      });
    }

    // --- SORTING ---
    if (this.currentSort === 'a-z') {
      candidates.sort((a, b) => (a.first_name + ' ' + a.last_name).localeCompare(b.first_name + ' ' + b.last_name));
    } else if (this.currentSort === 'z-a') {
      candidates.sort((a, b) => (b.first_name + ' ' + b.last_name).localeCompare(a.first_name + ' ' + a.last_name));
    }

    // 2. Assign Back to Display Array
    if (isSourced) {
      this.displayCandidates = candidates;
      this.updateSelectAllState();
    } else {
      this.displayRegisteredCandidates = candidates;
    }
  }

  toggleFilterPanel(): void {
    this.isFilterPanelVisible = !this.isFilterPanelVisible;
  }

  applyFiltersFromPanel(): void {
    this.applyFiltersAndSort();
    this.isFilterPanelVisible = false;
  }

  clearFilters(): void {
    this.filterForm.reset({ name: '', location: '', skills: '', current_ctc: '', email: '', phone: '' });
    this.applyFiltersAndSort();
    this.isFilterPanelVisible = false;
  }

  sortCandidates(event: Event): void {
    this.currentSort = (event.target as HTMLSelectElement).value;
    this.applyFiltersAndSort();
  }

  // =========================================================
  // ACTIONS (Delete, Details, Workflow)
  // =========================================================

  deleteRegisteredUser(userId: string): void {
    if (!userId) return;

    this.alertMessage = 'Are you sure you want to delete this User Account? This will remove their access permanently.';
    this.alertButtons = ['Cancel', 'Delete'];

    this.pendingAction = () => {
      this.isActionLoading = true;
      this.candidateService.deleteRegisteredUser(userId).subscribe({
        next: () => {
          // Remove from master list
          this.registeredCandidates = this.registeredCandidates.filter(u => u.user_id !== userId);
          // Re-apply filter to update display list
          this.applyFiltersAndSort();

          this.isActionLoading = false;
          this.showAlert('User account deleted successfully.', ['Close']);
        },
        error: (err) => {
          this.isActionLoading = false;
          this.showAlert('Error: Could not delete user. Permission denied or server error.', ['Close']);
        }
      });
    };
    this.isAlertVisible = true;
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
        this.isDeleting = false;

        const successCount = selectedCandidates.length - failedIds.length;
        this.showAlert(`${successCount} candidate(s) successfully deleted.`, ['Close']);

        if (this.masterCandidates.length === successCount && this.currentPage > 1) {
          this.loadCandidates(this.currentPage - 1);
        } else {
          this.loadCandidates(this.currentPage);
        }
      });
    };

    this.isAlertVisible = true;
  }

  deleteCandidate(id: number | undefined): void {
    if (!id) return;

    this.alertMessage = 'Are you sure you want to delete this candidate?';
    this.alertButtons = ['Cancel', 'Delete'];

    this.pendingAction = () => {
      this.candidateService.deleteCandidate(id).subscribe({
        next: () => {
          this.showAlert('Candidate successfully deleted.', ['Close']);
          if (this.masterCandidates.length === 1 && this.currentPage > 1) {
            this.loadCandidates(this.currentPage - 1);
          } else {
            this.loadCandidates(this.currentPage);
          }
        },
        error: (err) => {
          console.error('Failed to delete candidate', err);
          this.showAlert('Error: Could not delete the candidate.', ['Close']);
        }
      });
    };
    this.isAlertVisible = true;
  }

  openCandidateDetails(candidate: Candidate): void {
    this.selectedCandidateDetails = candidate;
    this.showDetailsModal = true;
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedCandidateDetails = null;
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

  // =========================================================
  // GOOGLE MAPS AUTOCOMPLETE
  // =========================================================

  private async initializeGooglePlaces(): Promise<void> {
    try {
      this.google = await this.loader.load();
      this.placesService = new this.google.maps.places.AutocompleteService();
    } catch (error) {
      console.error('Fatal error: Google Maps script could not be loaded.', error);
    }
  }

  private setupLocationAutocomplete(): void {
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

    if (!this.sessionToken && this.google) {
      this.sessionToken = new this.google.maps.places.AutocompleteSessionToken();
    }

    return new Observable(observer => {
      const request = {
        input: term,
        types: ['(cities)'],
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

  onPreferredLocationInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/[^a-zA-Z, \-]/g, '');
    const term = input.value;
    if (!term.trim()) {
      this.showPreferredSuggestions = false;
      return;
    }
    this.preferredInput$.next(term);
  }

  onCurrentLocationInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/[^a-zA-Z, \-]/g, '');
    const term = input.value;
    if (!term.trim()) {
      this.showCurrentSuggestions = false;
      return;
    }
    this.currentInput$.next(term);
  }

  selectPreferredLocation(prediction: google.maps.places.AutocompletePrediction, inputElement: HTMLInputElement): void {
    if (prediction.place_id) {
      const placesService = new google.maps.places.PlacesService(
        document.createElement('div')
      );
      placesService.getDetails(
        { placeId: prediction.place_id, fields: ['address_components', 'name'] },
        (place, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && place?.address_components) {
            this.ngZone.run(() => {
              let city = '';
              let district = '';
              let state = '';

              for (const component of place.address_components!) {
                if (component.types.includes('locality')) {
                  city = component.long_name;
                } else if (component.types.includes('administrative_area_level_3') && !district) {
                  district = component.long_name;
                } else if (component.types.includes('administrative_area_level_2') && !district) {
                  district = component.long_name;
                } else if (component.types.includes('administrative_area_level_1')) {
                  state = component.long_name;
                }
              }

              // Fallback if city is missing, use main text from prediction
              if (!city) city = prediction.structured_formatting?.main_text || '';

              const formattedLocation = [city, district, state].filter(Boolean).join(', ');

              if (formattedLocation && !this.preferredLocationsList.includes(formattedLocation)) {
                this.preferredLocationsList.push(formattedLocation);
                this.updateLocationControl('preferred_location', this.preferredLocationsList);
              } else if (!formattedLocation && !this.preferredLocationsList.includes(prediction.description)) {
                this.preferredLocationsList.push(prediction.description);
                this.updateLocationControl('preferred_location', this.preferredLocationsList);
              }

              inputElement.value = '';
              this.showPreferredSuggestions = false;
              this.preferredSuggestions = [];
              this.sessionToken = undefined;
            });
          }
        }
      );
    } else {
      if (!this.preferredLocationsList.includes(prediction.description)) {
        this.preferredLocationsList.push(prediction.description);
        this.updateLocationControl('preferred_location', this.preferredLocationsList);
      }
      inputElement.value = '';
      this.showPreferredSuggestions = false;
      this.preferredSuggestions = [];
      this.sessionToken = undefined;
    }
  }

  selectCurrentLocation(prediction: google.maps.places.AutocompletePrediction, inputElement: HTMLInputElement): void {
    if (prediction.place_id) {
      this.selectedPlaceId = prediction.place_id;

      const placesService = new google.maps.places.PlacesService(
        document.createElement('div')
      );
      placesService.getDetails(
        { placeId: prediction.place_id, fields: ['address_components', 'name'] },
        (place, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && place?.address_components) {
            this.ngZone.run(() => {
              let city = '';
              let district = '';
              let state = '';

              for (const component of place.address_components!) {
                if (component.types.includes('locality')) {
                  city = component.long_name;
                } else if (component.types.includes('administrative_area_level_3') && !district) {
                  district = component.long_name;
                } else if (component.types.includes('administrative_area_level_2') && !district) {
                  district = component.long_name;
                } else if (component.types.includes('administrative_area_level_1')) {
                  state = component.long_name;
                }
              }

              // Fallback if city is missing, use main text from prediction
              if (!city) city = prediction.structured_formatting?.main_text || '';

              // Store extracted values for form submission
              this.selectedCity = city;
              this.selectedState = state;

              const formattedLocation = [city, district, state].filter(Boolean).join(', ');

              if (formattedLocation && !this.currentLocationsList.includes(formattedLocation)) {
                this.currentLocationsList.push(formattedLocation);
                this.updateLocationControl('current_location', this.currentLocationsList);
              } else if (!formattedLocation && !this.currentLocationsList.includes(prediction.description)) {
                this.currentLocationsList.push(prediction.description);
                this.updateLocationControl('current_location', this.currentLocationsList);
              }

              inputElement.value = '';
              this.showCurrentSuggestions = false;
              this.currentSuggestions = [];
              this.sessionToken = undefined;
            });
          }
        }
      );
    } else {
      if (!this.currentLocationsList.includes(prediction.description)) {
        this.currentLocationsList.push(prediction.description);
        this.updateLocationControl('current_location', this.currentLocationsList);
      }
      inputElement.value = '';
      this.showCurrentSuggestions = false;
      this.currentSuggestions = [];
      this.sessionToken = undefined;
    }
  }

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

  // =========================================================
  // FORM & PARSING LOGIC
  // =========================================================

  openResume(url: string | undefined | null): void {
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
      // CHANGED: phone_number is now a FormArray
      phone_numbers: this.fb.array([], [Validators.required, this.minPhoneNumbersValidator]),
      email: ['', [Validators.required, Validators.email]],
      total_experience: [null, [Validators.required, Validators.min(0), Validators.max(99)]],
      relevant_experience: [null, [Validators.required, Validators.min(0), Validators.max(99)]],
      expected_ctc_min: [null, [Validators.required, Validators.min(0)]],
      expected_ctc_max: [null, [Validators.required, Validators.min(0)]],
      current_ctc: ['', Validators.required],
      preferred_location: ['', [Validators.required, Validators.pattern(locationPattern)]],
      current_location: ['', [Validators.required, Validators.pattern(locationPattern)]],
      notice_period: ['', Validators.required],
      gender: ['', Validators.required],
      work_experience: ['', [Validators.required, Validators.maxLength(30)]],
      skills: ['', Validators.required,],
    }, {
      validators: [
        minMaxValidator('expected_ctc_min', 'expected_ctc_max'),
        this.singleRelevantVsTotalValidator
      ]
    });
    // Add the first phone number control initially
    this.addPhoneNumber();
  }

  // Validator to ensure at least one phone number exists
  minPhoneNumbersValidator(array: FormArray): ValidationErrors | null {
    return array.length >= 1 ? null : { minPhoneNumbers: true };
  }

  // Validator for individual phone number (10 digits)
  phoneNumberValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null; // 'required' handles empty
    const cleanValue = value.replace(/\D/g, '');
    if (cleanValue.length !== 10) {
      return { invalidPhone: true };
    }
    return null;
  }

  // Getter for easy access in template
  get phoneNumbersArray(): FormArray {
    return this.candidateForm.get('phone_numbers') as FormArray;
  }

  addPhoneNumber(value: string = ''): void {
    this.phoneNumbersArray.push(new FormControl(value, [Validators.required, this.phoneNumberValidator]));
  }

  removePhoneNumber(index: number): void {
    if (this.phoneNumbersArray.length > 1) {
      this.phoneNumbersArray.removeAt(index);
    }
  }

  // Custom Validator: Duplicate check within the form
  duplicatePhoneValidator(group: FormGroup): ValidationErrors | null {
    const phoneArray = group.get('phone_numbers') as FormArray;
    if (!phoneArray) return null;

    const values = phoneArray.value.map((v: string) => v.replace(/\D/g, '')); // Normalize
    const uniqueValues = new Set(values);

    if (uniqueValues.size !== values.length) {
      // We set an error on the array level so template can show it
      phoneArray.setErrors({ ...phoneArray.errors, duplicate: true });
      return { duplicate: true };
    } else {
      // Clear duplicate error if fixed
      if (phoneArray.errors && phoneArray.errors['duplicate']) {
        delete phoneArray.errors['duplicate'];
        if (Object.keys(phoneArray.errors).length === 0) {
          phoneArray.setErrors(null);
        }
      }
    }
    return null;
  }


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
      phone: ['']
    });
  }

  preventInvalidChars(event: KeyboardEvent): void {
    if (['e', 'E', '+', '-'].includes(event.key)) {
      event.preventDefault();
    }
  }

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

  get f() { return this.candidateForm.controls; }

  showForm(source: 'Naukri' | 'External'): void {
    this.formSource = source;
    this.formVisible = true;
    this.submissionSuccess = false;
    this.submissionError = '';
  }

  addSkill(event: KeyboardEvent): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.trim();
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
    const currentUserId = localStorage.getItem('user_id');
    const isSuperUser = localStorage.getItem('isSuperUser') === 'true';
    const creatorId = candidate.user ? String(candidate.user) : null;

    if (isSuperUser || (currentUserId && creatorId === currentUserId)) {
      if (candidate.id) {
        this.editingCandidateId = candidate.id;
        this.selectedFile = null;
        this.selectedFileName = candidate.resume ? this.getFileNameFromUrl(candidate.resume) : '';

        // Clear skills/location arrays before populating
        this.skills = [];
        this.preferredLocationsList = [];
        this.currentLocationsList = [];

        // Manually handle phone numbers for the FormArray
        const rawPhones = candidate.phone_number || '';
        const phoneList = rawPhones.split(',').map(p => p.trim()).filter(Boolean);

        // Reset array
        while (this.phoneNumbersArray.length !== 0) {
          this.phoneNumbersArray.removeAt(0);
        }

        if (phoneList.length > 0) {
          phoneList.forEach(p => this.addPhoneNumber(p));
        } else {
          this.addPhoneNumber();
        }

        this.candidateForm.patchValue(candidate);

        this.skills = candidate.skills ? candidate.skills.split(',').map(s => s.trim()).filter(Boolean) : [];
        if (candidate.preferred_location) {
          if (Array.isArray(candidate.preferred_location)) {
            this.preferredLocationsList = candidate.preferred_location;
          } else if (typeof candidate.preferred_location === 'string') {
            this.preferredLocationsList = candidate.preferred_location.split(',').map(s => s.trim()).filter(Boolean);
          }
        } else {
          this.preferredLocationsList = [];
        }
        this.currentLocationsList = candidate.current_location
          ? candidate.current_location.split(',').map(s => s.trim()).filter(Boolean)
          : [];

        this.candidateForm.controls['skills'].setValue(this.skills.join(', '));
        this.candidateForm.controls['preferred_location'].setValue(this.preferredLocationsList.join(', '));
        this.candidateForm.controls['current_location'].setValue(this.currentLocationsList.join(', '));

        const sourceToOpen = (candidate.source === 'Naukri') ? 'Naukri' : 'External';
        this.showForm(sourceToOpen);
      }
    } else {
      this.showAlert(
        "Access Denied: You do not have permission to edit this candidate.",
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

    const maxSizeInBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      alert('File is too large. Max 5 MB.');
      target.value = '';
      return;
    }

    if (file.size === 0) {
      this.showAlert("The uploaded file is empty. Please upload a valid Resume.", ['Close']);
      target.value = '';
      return;
    }

    this.selectedFile = file;
    this.selectedFileName = file.name;

    this.isParsingResume = true;
    this.showFileError = false;

    this.candidateService.parseResume(file).subscribe({
      next: (response: any) => {

        // CASE 1: Queued (Production Mode)
        if (response.status === 'PROCESSING' && response.staging_id) {
          this.stagingId = response.staging_id;
          this.startPollingResume(response.staging_id);
        }
        // CASE 2: Sync Success (Local Dev Fallback)
        else if (response.success && response.data) {
          this.stagingId = response.staging_id; // Might be present
          this.handleParsingSuccess(response.data);
        }
        // CASE 3: Immediate Duplicate/Error
        else if (response.errors) {
          const phoneErrStr = response.errors.phone_number ? JSON.stringify(response.errors.phone_number) : '';
          const emailErrStr = response.errors.email ? JSON.stringify(response.errors.email) : '';
          if (phoneErrStr.includes('unique') || emailErrStr.includes('unique')) {
            this.showAlert("Duplicate detected.", ['Close']);
          } else {
            this.showAlert("Validation error.", ['Close']);
          }
          this.isParsingResume = false;
        }
        else {
          // Unknown response structure
          this.isParsingResume = false;
          this.showAlert("Unexpected server response.", ['Close']);
        }
      },
      error: (err) => {
        this.isParsingResume = false;
        if (err.status === 409) {
          this.showAlert("Duplicate Candidate.", ['Close']);
          this.selectedFile = null;
          this.selectedFileName = '';
          target.value = '';
        } else {
          this.showAlert("Upload failed.", ['Close']);
        }
      }
    });
  }

  /**
   * Polls the status endpoint every 3 seconds for up to 1 minute.
   */
  // Add this property near your other state variables at the top of the class
  private pollSubscription?: Subscription;

  // Replace your existing startPollingResume function with this:
  private startPollingResume(stagingId: number): void {
    let attempt = 0;
    const maxAttempts = 125; // 25 attempts * 3 seconds = 75 seconds timeout

    console.log(`[Resume Parse] Starting to poll for staging_id: ${stagingId}`);

    // Native RxJS polling: start at 0ms, ping every 3000ms
    this.pollSubscription = timer(0, 3000).pipe(
      switchMap(() => {
        console.log(`[Resume Parse] Polling attempt ${attempt + 1}/${maxAttempts}...`);
        return this.candidateService.checkResumeStatus(stagingId);
      }),
      takeWhile((res: any) => {
        attempt++;
        console.log(`[Resume Parse] Backend Response:`, res);

        // Stop polling if we hit max attempts
        if (attempt >= maxAttempts) return false;

        // Keep polling if the status is still processing
        return res.status === 'PENDING' || res.status === 'PROCESSING';
      }, true) // 'true' ensures the final COMPLETED/FAILED emission triggers the 'next' block
    ).subscribe({
      next: (res: any) => {
        if (res.status === 'COMPLETED' && res.data) {
          console.log(`[Resume Parse] COMPLETED! Populating form with:`, res.data);

          let parsedData = res.data;

          // Safety Check: If Django sent the dict as a string, parse it
          if (typeof parsedData === 'string') {
            try {
              const cleanStr = parsedData.replace(/'/g, '"');
              parsedData = JSON.parse(cleanStr);
            } catch (e) {
              console.error("[Resume Parse] Failed to parse AI data string:", e);
            }
          }

          // Populate form and kill spinner
          this.handleParsingSuccess(parsedData);

        } else if (res.status === 'FAILED') {
          console.error(`[Resume Parse] FAILED:`, res.error);
          this.isParsingResume = false;
          this.showAlert("Parsing failed: " + (res.error || 'Unknown error'), ['Close']);
        }
      },
      error: (err) => {
        console.error("[Resume Parse] HTTP ERROR:", err);
        this.isParsingResume = false;
        // If this alert shows up, it means the URL is wrong or blocked by CORS
        this.showAlert(`Network error checking status: ${err.statusText}. Open Console (F12) for details.`, ['Close']);
      },
      complete: () => {
        if (this.isParsingResume) {
          console.warn("[Resume Parse] Polling timed out.");
          this.isParsingResume = false;
          this.showAlert("Parsing is taking longer than expected. Please refresh.", ['Close']);
        }
      }
    });
  }

  /**
   * Shared logic to populate the form
   */
  private handleParsingSuccess(data: any): void {
    this.isParsingResume = false; // STOP SPINNER
    this.editingCandidateId = null;

    // Populate logic
    if (data.skills) {
      if (Array.isArray(data.skills)) this.skills = data.skills;
      else this.skills = data.skills.split(',').map((s: string) => s.trim()).filter(Boolean);
      this.updateSkillsFormControl();
    }
    if (data.preferred_location) {
      if (Array.isArray(data.preferred_location)) {
        this.preferredLocationsList = data.preferred_location;
      } else if (typeof data.preferred_location === 'string') {
        this.preferredLocationsList = data.preferred_location.split(',').map((s: string) => s.trim()).filter(Boolean);
      }
      this.candidateForm.controls['preferred_location'].setValue(this.preferredLocationsList.join(', '));
    }
    if (data.current_location) {
      this.currentLocationsList = data.current_location.split(',').map((s: string) => s.trim()).filter(Boolean);
      this.candidateForm.controls['current_location'].setValue(this.currentLocationsList.join(', '));
    }

    // Handle Phone Numbers
    while (this.phoneNumbersArray.length !== 0) this.phoneNumbersArray.removeAt(0);
    const rawPhones = data.phone_number || '';
    const phoneList = rawPhones.split(',').map((p: string) => p.trim()).filter(Boolean);
    if (phoneList.length > 0) phoneList.forEach(p => this.addPhoneNumber(p));
    else this.addPhoneNumber();

    this.candidateForm.patchValue({
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
      work_experience: data.work_experience,
      total_experience: data.total_experience_min || data.total_experience_years,
      relevant_experience: data.relevant_experience_min || data.relevant_experience_years,
      expected_ctc_min: data.expected_ctc_min,
      expected_ctc_max: data.expected_ctc_max,
      current_ctc: this.matchDropdown(data.current_ctc, this.ctcChoices),
      notice_period: this.matchDropdown(data.notice_period, this.noticePeriodChoices),
      gender: this.matchDropdown(data.gender, this.genderChoices),
    });

    this.showAlert("Resume parsed! Please review.", ['Close']);
  }



  populateFormWithData(data: any): void {
    if (!data) return;

    if (data.skills) {
      if (Array.isArray(data.skills)) {
        this.skills = data.skills;
      } else {
        this.skills = data.skills.split(',').map((s: string) => s.trim()).filter(Boolean);
      }
      this.updateSkillsFormControl();
    }

    if (data.preferred_location) {
      if (Array.isArray(data.preferred_location)) {
        this.preferredLocationsList = data.preferred_location;
      } else if (typeof data.preferred_location === 'string') {
        this.preferredLocationsList = data.preferred_location.split(',').map((s: string) => s.trim()).filter(Boolean);
      }
      this.candidateForm.controls['preferred_location'].setValue(this.preferredLocationsList.join(', '));
    }

    if (data.current_location) {
      this.currentLocationsList = data.current_location.split(',').map((s: string) => s.trim()).filter(Boolean);
      this.candidateForm.controls['current_location'].setValue(this.currentLocationsList.join(', '));
    }

    // CHANGED: Handle Phone Numbers
    // Clear existing controls
    while (this.phoneNumbersArray.length !== 0) {
      this.phoneNumbersArray.removeAt(0);
    }

    const rawPhones = data.phone_number || '';
    const phoneList = rawPhones.split(',').map((p: string) => p.trim()).filter(Boolean);

    if (phoneList.length > 0) {
      phoneList.forEach(p => this.addPhoneNumber(p));
    } else {
      this.addPhoneNumber(); // Add at least one
    }


    this.candidateForm.patchValue({
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
      work_experience: data.work_experience,
      total_experience: data.total_experience_min,
      relevant_experience: data.relevant_experience_min,
      expected_ctc_min: data.expected_ctc_min,
      expected_ctc_max: data.expected_ctc_max,
      current_ctc: this.matchDropdown(data.current_ctc, this.ctcChoices),
      notice_period: this.matchDropdown(data.notice_period, this.noticePeriodChoices),
      gender: this.matchDropdown(data.gender, this.genderChoices),
    });
  }

  matchDropdown(value: string, options: string[]): string {
    if (!value) return '';
    const match = options.find(opt => opt.toLowerCase() === value.toLowerCase());
    return match || '';
  }

  onSubmit(): void {
    this.candidateForm.markAllAsTouched();
    this.duplicatePhoneValidator(this.candidateForm); // Check for internal duplicates

    const isFileMissing = !this.selectedFileName || this.selectedFileName.trim() === '';
    this.showFileError = isFileMissing;

    if (this.candidateForm.invalid || isFileMissing || this.phoneNumbersArray.invalid) {
      const invalidFields: string[] = [];
      if (isFileMissing) invalidFields.push('Resume File');

      // Collect errors for alert
      Object.keys(this.candidateForm.controls).forEach(key => {
        if (this.candidateForm.get(key)?.invalid) {
          // Handle FormArray separately for better naming
          if (key === 'phone_numbers') {
            invalidFields.push('Phone Numbers');
          } else {
            invalidFields.push(key.replace(/_/g, ' '));
          }
        }
      });

      if (this.phoneNumbersArray.errors) {
        if (this.phoneNumbersArray.errors['duplicate']) invalidFields.push('Duplicate Phone Numbers');
      }

      this.showAlert(`Please check the following fields: ${invalidFields.join(', ')}`, ['Close']);
      return;
    }

    this.isSubmitting = true;
    const formData = new FormData();

    Object.keys(this.candidateForm.controls).forEach(key => {
      if (key === 'phone_numbers') {
        const phoneValues = this.phoneNumbersArray.value;
        const joinedPhones = phoneValues.join(', ');
        formData.append('phone_number', joinedPhones);
      }
      else if (key === 'preferred_location') {
        formData.append('preferred_location', JSON.stringify(this.preferredLocationsList));
      }
      else if (key === 'total_experience' && this.candidateForm.get(key)?.value !== null) {
        formData.append('total_experience_min', this.candidateForm.get(key)?.value);
        formData.append('total_experience_max', this.candidateForm.get(key)?.value);
      }
      else if (key === 'relevant_experience' && this.candidateForm.get(key)?.value !== null) {
        formData.append('relevant_experience_min', this.candidateForm.get(key)?.value);
        formData.append('relevant_experience_max', this.candidateForm.get(key)?.value);
      }
      else if (this.candidateForm.get(key)?.value !== null && this.candidateForm.get(key)?.value !== undefined) {
        formData.append(key, this.candidateForm.get(key)?.value);
      }
    });

    // Append structured location fields
    if (this.selectedCity) formData.append('city', this.selectedCity);
    if (this.selectedState) formData.append('state', this.selectedState);
    if (this.selectedPlaceId) formData.append('place_id', this.selectedPlaceId);

    if (this.stagingId) {
      formData.append('staging_id', this.stagingId.toString());
    } else if (this.selectedFile) {
      formData.append('resume', this.selectedFile);
    }

    const userId = localStorage.getItem('user_id');
    if (userId) { formData.append('user_id', userId); }
    formData.append('source', this.formSource);

    const handleSuccess = (candidate: Candidate) => {
      if (this.editingCandidateId) {
        const index = this.masterCandidates.findIndex(c => c.id === this.editingCandidateId);
        if (index !== -1) this.masterCandidates[index] = { ...candidate, selected: false };
      } else {
        this.masterCandidates.unshift({ ...candidate, selected: false });
      }
      this.applyFiltersAndSort();
      this.isSuccessAlert = true;
      this.showAlert(this.editingCandidateId ? 'Updated successfully!' : 'Created successfully!', ['Close']);
      this.onCancel();
    };

    // UPDATED ENHANCED ERROR HANDLING
    const handleError = (err: HttpErrorResponse) => {
      this.isSubmitting = false;

      // 1. Handle Backend Validation Errors (Status 400)
      if (err.status === 400 && err.error) {
        const errors = err.error;
        let alertMessages: string[] = [];

        // Check for phone_number errors specifically
        if (errors.phone_number) {
          const msg = Array.isArray(errors.phone_number) ? errors.phone_number[0] : errors.phone_number;

          // Set error on the FormArray so it shows in the UI
          this.phoneNumbersArray.setErrors({ serverError: msg });
          this.phoneNumbersArray.markAsTouched();

          alertMessages.push(msg);
        }

        // Check for email errors
        if (errors.email) {
          const msg = Array.isArray(errors.email) ? errors.email[0] : errors.email;
          this.candidateForm.get('email')?.setErrors({ serverError: msg });
          this.candidateForm.get('email')?.markAsTouched();
          alertMessages.push(msg);
        }

        // Check for non_field_errors or detail
        if (errors.detail || errors.non_field_errors) {
          alertMessages.push(errors.detail || errors.non_field_errors[0]);
        }

        // Show Alert with specific messages
        if (alertMessages.length > 0) {
          this.showAlert(alertMessages.join(' | '), ['Close']);
        } else {
          this.showAlert("Submission failed. Please check the form for errors.", ['Close']);
        }
      } else {
        // Generic server error
        this.showAlert("Server error. Please try again later.", ['Close']);
      }
    };

    if (this.editingCandidateId) {
      this.candidateService.updateCandidate(this.editingCandidateId, formData).subscribe({ next: handleSuccess, error: handleError });
    } else {
      this.candidateService.createCandidate(formData).subscribe({ next: handleSuccess, error: handleError });
    }
  }

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
    this.showFileError = false;
  }

  allowAlphanumericOnly(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/[^a-zA-Z0-9 ]/g, '');
    this.candidateForm.get('work_experience')?.setValue(input.value);
  }

  allowAlphabetsOnly(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/[^a-zA-Z #+]/g, '');
  }

  openAddToWorkflowModal() {
    const selected = this.masterCandidates.filter(c => c.selected);
    if (selected.length === 0) {
      this.showAlert("Please select at least one candidate.", ["Close"]);
      return;
    }

    this.selectedCandidateCount = selected.length;
    this.selectedJobId = null;

    this.adbRequirementService.getRequirements().subscribe({
      next: (jobs: any) => {
        const allJobs = Array.isArray(jobs) ? jobs : (jobs?.results || []);
        this.availableJobs = (this.isRecruiterUser && !this.isSuperUser)
          ? allJobs.filter((job: any) => this.isUserAuthorizedForJob(job))
          : allJobs;

        if (this.availableJobs.length === 0) {
          this.showAlert("No authorized job requirements available for ATS.", ["Close"]);
          return;
        }

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

    this.isActionLoading = true;
    const selectedIds = this.masterCandidates.filter(c => c.selected && c.id).map(c => c.id!);

    this.candidateService.addCandidatesToJob(this.selectedJobId, selectedIds).subscribe({
      next: (res: any) => {
        this.isActionLoading = false;
        this.closeWorkflowModal();

        let msg = '';
        if (res.existing > 0) {
          msg = `Added ${res.added}. Note: ${res.existing} already in workflow.`;
        } else {
          msg = `Successfully added ${res.added} candidate(s).`;
        }

        this.showAlert(msg, ["Close"]);
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

  trackByCandidate(index: number, candidate: any): number {
    return candidate.id;
  }
}
