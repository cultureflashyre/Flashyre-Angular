import { Component, EventEmitter, Output, Input, ContentChild, TemplateRef, ViewChild, ElementRef, ChangeDetectorRef, OnInit, OnDestroy, NgZone, Inject } from '@angular/core';
import { DOCUMENT, NgClass, NgTemplateOutlet } from '@angular/common';
import { Router } from '@angular/router';
import { EmploymentService } from '../../services/employment.service';
import { Subject, Observable, of, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs/operators';
import { Loader } from '@googlemaps/js-api-loader';
import { environment } from '../../../environments/environment';
import { FormsModule } from '@angular/forms';
import { AlertMessageComponent } from '../alert-message/alert-message.component';


@Component({
    selector: 'profile-employment-component',
    templateUrl: 'profile-employment-component.component.html',
    styleUrls: ['profile-employment-component.component.css'],
    standalone: true,
    imports: [
        NgClass,
        NgTemplateOutlet,
        FormsModule,
        AlertMessageComponent,
    ],
})
export class ProfileEmploymentComponent implements OnInit, OnDestroy {

  public hasPendingDeletions: boolean = false;

  saveAndNext() {
    throw new Error('Method not implemented.');
  }
  @ContentChild('text') text: TemplateRef<any>;
  @ContentChild('text311') text311: TemplateRef<any>;
  @ContentChild('text7') text7: TemplateRef<any>;
  @Input() rootClassName: string = '';
  @ContentChild('text12') text12: TemplateRef<any>;
  @ContentChild('text3') text3: TemplateRef<any>;
  @ContentChild('text111') text111: TemplateRef<any>;
  //@Output() requestDateConfirmation = new EventEmitter<void>();
  @ViewChild('scrollContainer', { static: false }) scrollContainer!: ElementRef;

  positions: any[] = [
    {
        id: null,
        jobTitle: '',
      companyName: '',
      startDate: '',
      endDate: '',
      jobDetails: '',
       errors: {},
    },
  ];

  showRemoveConfirmation = false;
  positionToRemoveIndex: number | null = null;
  private subscriptions = new Subscription();

  private readonly googleMapsApiKey: string = environment.googleMapsApiKey;
  private loader: Loader;
  private placesService: google.maps.places.AutocompleteService | undefined;
  private sessionToken: google.maps.places.AutocompleteSessionToken | undefined;
  private google: any;

  private companyInput$ = new Subject<{ term: string, index: number }>();
  companySuggestions: google.maps.places.AutocompletePrediction[] = [];
  showCompanySuggestions = false;
  isLoadingCompanies = false;
  activeCompanyInputIndex: number | null = null;

  showOverlapAlert = false;
  overlapMessage = '';
  conflictingJobIndices: { job1Index: number, job2Index: number } | null = null;

  showShortTenureAlert = false;
  shortTenureMessage = '';

  constructor(
    private cdr: ChangeDetectorRef,
    private router: Router,
    private employmentService: EmploymentService,
    private ngZone: NgZone, // <-- Inject NgZone
    @Inject(DOCUMENT) private document: Document
  ) {
        // --- Initialize the Google Maps Loader ---
    this.loader = new Loader({
      apiKey: this.googleMapsApiKey,
      version: 'weekly',
      libraries: ['places']
    });
  }

  public sanitizeAlphaNumeric(event: Event, position: any, fieldName: string): void {
    const input = event.target as HTMLInputElement;
    const sanitizedValue = input.value.replace(/[^a-zA-Z0-9 ]/g, '');
    position[fieldName] = sanitizedValue;
    if (input.value !== sanitizedValue) {
      input.value = sanitizedValue;
    }
  }

  ngOnInit(): void {
    this.initializeGooglePlaces();
    this.loadPositionsFromUserProfile();

    // --- Setup the observable pipeline for company name input ---
    this.subscriptions.add(
      this.companyInput$.pipe(
        debounceTime(300),
        distinctUntilChanged((prev, curr) => prev.term === curr.term),
        tap(({ index }) => {
          this.isLoadingCompanies = true;
          this.showCompanySuggestions = true;
          this.activeCompanyInputIndex = index;
          if (this.google && !this.sessionToken) {
            this.sessionToken = new this.google.maps.places.AutocompleteSessionToken();
          }
        }),
        switchMap(({ term }) => this.getCompanyPredictions(term))
      ).subscribe(suggestions => {
        this.isLoadingCompanies = false;
        this.companySuggestions = suggestions;
      })
    );
    
    // Global listener to close suggestions
    this.document.addEventListener('click', this.onDocumentClick.bind(this));
  }

  private async initializeGooglePlaces(): Promise<void> {
    try {
      this.google = await this.loader.load();
      this.placesService = new this.google.maps.places.AutocompleteService();
    } catch (error) {
      console.error('Fatal error: Google Maps script could not be loaded.', error);
    }
  }

  onCompanyInput(event: Event, index: number): void {
    const term = (event.target as HTMLInputElement).value;
    if (!term.trim()) {
      this.showCompanySuggestions = false;
      return;
    }
    this.companyInput$.next({ term, index });
  }

  private getCompanyPredictions(term: string): Observable<google.maps.places.AutocompletePrediction[]> {
    if (!this.placesService || !this.sessionToken) {
      return of([]);
    }
    return new Observable(observer => {
      this.placesService!.getPlacePredictions({
        input: term,
        types: ['establishment'], // This is a general type for businesses, organizations, etc.
        sessionToken: this.sessionToken
      }, (predictions, status) => {
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

  selectCompanySuggestion(suggestion: google.maps.places.AutocompletePrediction, index: number): void {
    const position = this.positions[index];
    if (position) {
      // Directly update the model since we are using ngModel (Template-driven)
      position.companyName = suggestion.description;
    }
    this.showCompanySuggestions = false;
    this.activeCompanyInputIndex = null;
    this.sessionToken = undefined; // IMPORTANT: Reset token for cost saving
  }

  private onDocumentClick(): void {
    if (this.showCompanySuggestions) {
      this.ngZone.run(() => {
        this.showCompanySuggestions = false;
        this.activeCompanyInputIndex = null;
      });
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.sessionToken = undefined;
    this.document.removeEventListener('click', this.onDocumentClick.bind(this));
  }

private loadPositionsFromUserProfile(): void {
  const userProfileString = localStorage.getItem('userProfile');
  if (userProfileString) {
    try {
      const userProfile = JSON.parse(userProfileString);
      if (userProfile.employments && Array.isArray(userProfile.employments) && userProfile.employments.length > 0) {
        this.positions = userProfile.employments.map((emp: any) => ({
          id: emp.id || null, // Map the ID from the profile
          jobTitle: emp.job_title || '',
          companyName: emp.company_name || '',
          startDate: emp.start_date || '',
          endDate: emp.end_date || '',
          jobDetails: emp.job_details || '',
          errors: {},
        }));
      }
    } catch (error) {
      console.warn('Error parsing userProfile from localStorage in employment component', error);
    }
  }
}

  /**
   * Checks a single employment entry for a short duration (less than 6 months)
   * and triggers an alert if the condition is met.
   * This check only runs if both start and end dates are present.
   * @param {number} currentIndex The index of the position to check.
   */
  private checkAndAlertForShortDuration(currentIndex: number): void {
    const position = this.positions[currentIndex];

    // The crucial check: only proceed if both dates are filled.
    if (position.startDate && position.endDate) {
      const startDate = new Date(position.startDate);
      const endDate = new Date(position.endDate);
      
      // Calculate the difference in milliseconds, then convert to days.
      const differenceInMs = endDate.getTime() - startDate.getTime();
      const differenceInDays = Math.round(differenceInMs / (1000 * 60 * 60 * 24));

      // Use ~182 days as the threshold for 6 months.
      const sixMonthsInDays = 182;

      if (differenceInDays >= 0 && differenceInDays < sixMonthsInDays) {
        this.shortTenureMessage = `Short tenure employment detected: ${differenceInDays} days. Are you sure the start and end dates are correct?`;
        this.showShortTenureAlert = true;
      }
    }
  }

// --- MODIFICATION START ---
  /**
   * Checks all positions for short employment durations.
   * @returns {boolean} - True if any position has a duration of less than 90 days.
   */
  public checkForShortEmploymentDurations(): boolean {

    const ninetyDaysInMs = 90 * 24 * 60 * 60 * 1000;
    for (const position of this.positions) {
      if (position.startDate && position.endDate) {
        const start = new Date(position.startDate).getTime();
        const end = new Date(position.endDate).getTime();
        const difference = end - start;
        if (difference >= 0 && difference < ninetyDaysInMs) {
          return true; // Found a short duration
        }
      }
    }
    return false; // No short durations found
  }

  /**
   * Called when a date input changes. Triggers checks for overlaps and short durations.
   * @param {number} currentIndex The index of the position whose date was changed.
   */
  public onDateChange(currentIndex: number): void {
    // First, check for an immediate overlap.
    const position = this.positions[currentIndex];
    // Priority 1: Ensure Start Date is not after End Date. This is a hard error.
    if (position.startDate && position.endDate) {
      if (new Date(position.startDate) > new Date(position.endDate)) {
        // Set the error and stop further date checks.
        position.errors.endDate = 'End Date cannot be earlier than Start Date.';
        return; 
      }
    }
    // If the dates are valid, we must clear any previous error.
    delete position.errors.endDate;

    const overlap = this.checkForInstantOverlap(currentIndex);

    if (overlap) {
      this.conflictingJobIndices = { job1Index: overlap.job1Index, job2Index: overlap.job2Index };
      const { job1, job2 } = overlap;

      const formatDate = (dateStr: string) => dateStr || 'Present';

      this.overlapMessage = `Job ${job1.jobTitle || 'Untitled'} (from ${formatDate(job1.startDate)} to ${formatDate(job1.endDate)}) overlaps with Job ${job2.jobTitle || 'Untitled'} (from ${formatDate(job2.startDate)} to ${formatDate(job2.endDate)}).`;
      
      this.showOverlapAlert = true; // Display the alert immediately.
      return; // Stop further processing.
    }

    // If no overlap, proceed with the short employment duration check.
    this.checkAndAlertForShortDuration(currentIndex);
  }
  // --- MODIFICATION END ---

  handleShortTenureConfirmation(button: string): void {
    // No specific action is needed for "Confirm" vs "Continue", just close the alert.
    this.showShortTenureAlert = false;
    this.shortTenureMessage = '';
  }

  // Add a new empty position and scroll to the bottom
  addPosition() {
    this.positions.push({
      id: null,
      jobTitle: '',
      companyName: '',
      startDate: '',
      endDate: '',
      jobDetails: '',
      errors: {}, 
    });
    // Force change detection and scroll to bottom after DOM update
    this.cdr.detectChanges();
    setTimeout(() => {
      this.scrollToBottom();
    }, 0);
  }

  // Remove a position
 promptRemovePosition(index: number): void {
    this.positionToRemoveIndex = index;
    this.showRemoveConfirmation = true;
  }

  // REMOVE the old `cancelRemovePosition` and `confirmRemovePosition` methods
  // and REPLACE them with these two new methods:

  // This method handles the button click from the alert component
  handleRemoveConfirmation(button: string): void {
    if (button.toLowerCase() === 'remove') {
      if (this.positionToRemoveIndex !== null) {
        this.hasPendingDeletions = true;
        this.positions.splice(this.positionToRemoveIndex, 1);
      }
    }
    // Always close the modal after a button is clicked
    this.closeRemoveConfirmationModal();
  }

  // This method closes the modal and resets the state
  closeRemoveConfirmationModal(): void {
    this.showRemoveConfirmation = false;
    this.positionToRemoveIndex = null;
  }

  // Scroll to the bottom of the component
  scrollToBottom() {
    if (!this.scrollContainer) {
      console.warn('Scroll container not initialized');
      return;
    }
    const container = this.scrollContainer.nativeElement;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;

    console.log('Scroll Height:', scrollHeight, 'Client Height:', clientHeight);

    if (scrollHeight > clientHeight) {
      container.scrollTo({
        top: scrollHeight,
        behavior: 'smooth'
      });
      console.log('Scrolled to bottom:', scrollHeight);
    } else {
      console.log('No scroll needed, content fits within container');
    }
  }

  // Method to get positions data (called by parent)
  getPositions() {
    return this.positions;
  }

  // Reset form after submission
  resetForm() {
    this.positions = [
      {
        id: null,
        jobTitle: '',
        companyName: '',
        startDate: '',
        endDate: '',
        jobDetails: '',
      },
    ];
  }

  // Method to get today's date in YYYY-MM-DD format
  getTodayDate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
    
  }

  public isFormEmpty(): boolean {

    // If there are no position blocks at all, it's empty.
    if (this.positions.length === 0) {
      return true;
    }

    // The form is considered empty if there's only one position block
    // and all its fields are still empty strings.
    if (this.positions.length === 1) {
      const firstPosition = this.positions[0];
      return !firstPosition.jobTitle && !firstPosition.companyName &&
             !firstPosition.startDate && !firstPosition.endDate && !firstPosition.jobDetails;
    }
    // If there is more than one position block, the form is not empty.
    return false;
  }

  public validatePositions(): boolean {
  // If the entire form section is empty, it's valid for skipping.
  if (this.isFormEmpty()) {
    return true;
  }

  let isOverallValid = true;

  for (const position of this.positions) {
    // Reset previous errors for this position
    position.errors = {};

    // If the position is partially filled, all mandatory fields are required
    const isPartiallyFilled = position.jobTitle || position.companyName || position.startDate || position.endDate || position.jobDetails;

    if (isPartiallyFilled) {
      if (!position.jobTitle) {
        position.errors.jobTitle = 'Job Title is mandatory';
        isOverallValid = false;
      }
      if (!position.companyName) {
        position.errors.companyName = 'Company Name is mandatory';
        isOverallValid = false;
      }
      if (!position.startDate) {
        position.errors.startDate = 'Start Date is mandatory';
        isOverallValid = false;
      }
      if (!position.jobDetails) {
        position.errors.jobDetails = 'Job Details are mandatory';
        isOverallValid = false;
      }

      if (position.startDate && position.endDate && new Date(position.startDate) > new Date(position.endDate)) {
        position.errors.endDate = 'End Date cannot be earlier than Start Date.';
        isOverallValid = false;
      }

    }
  }

  return isOverallValid;
}

  /**
   * Checks the currently edited position against all others for date overlaps, instantly.
   * This logic is now corrected to avoid false positives.
   * @param {number} currentIndex - The index of the position being edited.
   * @returns A conflict object if a true overlap is found, otherwise null.
   */
  private checkForInstantOverlap(currentIndex: number): { job1: any, job2: any, job1Index: number, job2Index: number } | null {
    const currentJob = this.positions[currentIndex];

    // Do not proceed if the current job's start date is not set.
    if (!currentJob || !currentJob.startDate) {
      return null;
    }

    for (let i = 0; i < this.positions.length; i++) {
      // Don't compare a job against itself.
      if (i === currentIndex) {
        continue;
      }

      const otherJob = this.positions[i];

      // Don't compare against another record that doesn't have a start date yet.
      if (!otherJob.startDate) {
        continue;
      }

      // --- CORRECTED LOGIC ---

      // Define the range for the 'other' job. An empty end date means it's an active job,
      // so we use a far-future date for a correct comparison.
      const start2 = new Date(otherJob.startDate);
      const end2 = otherJob.endDate ? new Date(otherJob.endDate) : new Date('9999-12-31');

      // Define the range for the 'current' job being edited.
      // THE FIX: If the end date is missing on the *job being edited*, we treat its range
      // as a single day (start date = end date). This is because the user hasn't finished
      // entering the data, and we must not assume it's an "active job" until it is saved.
      const start1 = new Date(currentJob.startDate);
      const end1 = currentJob.endDate ? new Date(currentJob.endDate) : start1; // <-- This line is the critical fix.

      // The standard overlap condition: (StartA <= EndB) and (EndA >= StartB)
      if (start1 <= end2 && end1 >= start2) {
        // A true overlap was found. Return the conflicting jobs.
        return {
          job1: currentJob,
          job2: otherJob,
          job1Index: currentIndex,
          job2Index: i,
        };
      }
    }

    return null; // No overlap was found.
  }

  // --- NEW: Method to check for overlapping employment dates ---
  private checkForOverlappingDates(): { job1: any, job2: any, job1Index: number, job2Index: number } | null {
    const filledPositions = this.positions.filter(p => p.startDate);

    for (let i = 0; i < filledPositions.length; i++) {
      for (let j = i + 1; j < filledPositions.length; j++) {
        const job1 = filledPositions[i];
        const job2 = filledPositions[j];

        const start1 = new Date(job1.startDate);
        // If endDate is null or empty, use a very future date to represent an ongoing job.
        const end1 = job1.endDate ? new Date(job1.endDate) : new Date('9999-12-31');

        const start2 = new Date(job2.startDate);
        const end2 = job2.endDate ? new Date(job2.endDate) : new Date('9999-12-31');

        // The condition for overlap: (StartA <= EndB) and (EndA >= StartB)
        if (start1 <= end2 && end1 >= start2) {
          return {
            job1,
            job2,
            job1Index: this.positions.indexOf(job1),
            job2Index: this.positions.indexOf(job2),
          };
        }
      }
    }
    return null; // No overlap found
  }
  
  // --- NEW: Handler for the overlap alert buttons ---
  handleOverlapAction(button: string): void {
    if (button.toLowerCase() === 'remove the last entered job' && this.conflictingJobIndices) {
      // We assume the "last entered" job is the one with the higher index in the array.
      const indexToRemove = Math.max(this.conflictingJobIndices.job1Index, this.conflictingJobIndices.job2Index);
      
      if (this.positions.length > 1) {
        this.positions.splice(indexToRemove, 1);
      } else {
        // If it's the last remaining position block, just clear its fields
        this.positions[indexToRemove] = { id: null, jobTitle: '', companyName: '', startDate: '', endDate: '', jobDetails: '', errors: {} };
      }
    }

    // For "Continue editing the job" or closing the alert, just hide the modal and reset state.
    this.showOverlapAlert = false;
    this.overlapMessage = '';
    this.conflictingJobIndices = null;
  }

// --- MODIFIED: `saveEmployment` method now includes the overlap check ---
saveEmployment(): Promise<boolean> {
  return new Promise((resolve) => {
    
    if (!this.validatePositions()) {
      console.log('Validation failed for required fields.');
      resolve(false);
      return;
    }

    // --- NEW: Overlap validation check ---
      const overlap = this.checkForOverlappingDates();
      if (overlap) {
        this.conflictingJobIndices = { job1Index: overlap.job1Index, job2Index: overlap.job2Index };
        const { job1, job2 } = overlap;
        const formatDate = (dateStr: string) => dateStr || 'Present';
        this.overlapMessage = `Job ${job1.jobTitle || 'Untitled'} (from ${formatDate(job1.startDate)} to ${formatDate(job1.endDate)}) overlaps with Job ${job2.jobTitle || 'Untitled'} (from ${formatDate(job2.startDate)} to ${formatDate(job2.endDate)}).`;
        this.showOverlapAlert = true;
        resolve(false);
        return;
      }

      // Prepare the payload. Filter out any truly blank new entries.
      // Your backend sync endpoint relies on getting the full, current state.
      const payload = this.positions.filter(p => 
        p.id || p.jobTitle || p.companyName || p.startDate || p.jobDetails
      );

      // THE KEY LOGIC: Skip the API call only if the form is empty AND no deletions are pending.
      if (payload.length === 0 && !this.hasPendingDeletions) {
        console.log('No employment data to save or delete. Skipping.');
        resolve(true);
        return;
      }

    // --- End of overlap check ---

    this.employmentService.saveEmployment(payload).subscribe({
      next: (response) => {
        console.log('Employment data synchronized successfully:', response);
        this.hasPendingDeletions = false; // IMPORTANT: Reset the flag on success.
        resolve(true);
      },
      error: (error) => {
        console.error('Error saving employment:', error);
        alert('Error saving employment: ' + (error.error?.detail || 'An unknown error occurred.'));
        resolve(false);
      }
    });
  });
}

  goToPrevious() {
    this.router.navigate(['/profile-basic-information']);
  }

  skipToEducation() {
    this.router.navigate(['/profile-certification-page']);
  }

}