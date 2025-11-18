import { Component, OnInit, OnDestroy, ViewChildren, QueryList, ElementRef, Input, ContentChild, TemplateRef, NgZone, Inject } from '@angular/core';
import { DOCUMENT, NgClass, NgTemplateOutlet } from '@angular/common';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { EducationService } from '../../services/education.service';
import { forkJoin, Subject, Observable, of, Subscription } from 'rxjs';
import { tap, catchError, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { Loader } from '@googlemaps/js-api-loader';
import { environment } from '../../../environments/environment';
import { AlertMessageComponent } from '../alert-message/alert-message.component';

interface DropdownItem {
  id: number;
  name: string;
  [key: string]: any;
}

interface ReferenceData {
  colleges: DropdownItem[];
  education_levels: DropdownItem[];
  courses: DropdownItem[];
  specializations: DropdownItem[];
}

@Component({
    selector: 'profile-education-component',
    templateUrl: './profile-education-component.component.html',
    styleUrls: ['./profile-education-component.component.css'],
    standalone: true,
    imports: [NgClass, NgTemplateOutlet, FormsModule, ReactiveFormsModule, AlertMessageComponent]
})
export class ProfileEducationComponent implements OnInit, OnDestroy {

  public hasPendingDeletions: boolean = false;

  @ContentChild('text') text: TemplateRef<any>;
  @ContentChild('text1') text1: TemplateRef<any>;
  @ContentChild('text2') text2: TemplateRef<any>;
  @ContentChild('text111') text111: TemplateRef<any>;
  @ContentChild('text112') text112: TemplateRef<any>;
  @ContentChild('text1111') text1111: TemplateRef<any>;
  @ContentChild('text1112') text1112: TemplateRef<any>;

  @Input() rootClassName: string = '';
  @ViewChildren('educationFormInstance') educationFormInstances: QueryList<ElementRef>;

  educationForms: FormGroup[] = [];
  universities: DropdownItem[] = [];
  educationLevels: DropdownItem[] = [];
  courses: DropdownItem[] = [];
  specializations: DropdownItem[] = [];
  todayDate: string = new Date().toISOString().split('T')[0];
  isLoading: boolean = false;
  errorMessage: string | null = null;

  showRemoveConfirmation = false;
  formToRemoveIndex: number | null = null;
  private subscriptions = new Subscription(); 

  private readonly googleMapsApiKey: string = environment.googleMapsApiKey;
  private loader: Loader;
  private placesService: google.maps.places.AutocompleteService | undefined;
  private sessionToken: google.maps.places.AutocompleteSessionToken | undefined;
  private google: any;

  private universityInput$ = new Subject<{ term: string, index: number }>();
  universitySuggestions: google.maps.places.AutocompletePrediction[] = [];
  showUniversitySuggestions = false;
  isLoadingUniversities = false;
  activeUniversityInputIndex: number | null = null;
  
  showDateProximityAlert = false;
  dateProximityMessage = '';

  constructor(
    private fb: FormBuilder,
    private educationService: EducationService,
    private router: Router,
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

  ngOnInit(): void {
    this.isLoading = true;
    this.errorMessage = null;

        // --- Initialize Google Places Autocomplete Service ---
    this.initializeGooglePlaces();

    // --- Setup the observable pipeline for university input ---
    this.subscriptions.add(
      this.universityInput$.pipe(
        debounceTime(300),
        distinctUntilChanged((prev, curr) => prev.term === curr.term),
        tap(({ index }) => {
          this.isLoadingUniversities = true;
          this.showUniversitySuggestions = true;
          this.activeUniversityInputIndex = index; // Keep track of which input is active
          if (this.google && !this.sessionToken) {
            this.sessionToken = new this.google.maps.places.AutocompleteSessionToken();
          }
        }),
        switchMap(({ term }) => this.getUniversityPredictions(term))
      ).subscribe(suggestions => {
        this.isLoadingUniversities = false;
        this.universitySuggestions = suggestions;
      })
    );

    // Global listener to close suggestions when clicking outside
    this.document.addEventListener('click', this.onDocumentClick.bind(this));

    const userProfileString = localStorage.getItem('userProfile');

    // Always fetch reference data first
    this.educationService.getReferenceData().subscribe({
      next: (data: ReferenceData) => {
        this.universities = data.colleges;
        this.educationLevels = data.education_levels;
        this.courses = data.courses;
        this.specializations = data.specializations;

        this.educationForms = []; // Reset forms array

        // Now that we have dropdown data, check for existing user profile data
        if (userProfileString) {
          try {
            const userProfile = JSON.parse(userProfileString);
            if (userProfile.educations && Array.isArray(userProfile.educations) && userProfile.educations.length > 0) {
              userProfile.educations.forEach((edu: any) => {
                const form = this.createEducationForm();
                form.patchValue({
                  id: edu.id || null, // <<< POPULATE THE ID
                  endDate: edu.end_date || '',
                  university: edu.university, 
                  educationLevel: this.getDropdownIdByName(this.educationLevels, edu.education_level),
                  course: this.getDropdownIdByName(this.courses, edu.course),
                  specialization: this.getDropdownIdByName(this.specializations, edu.specialization),
                });
                this.educationForms.push(form);
              });
            } else {
              // If user has a profile but no educations, add one empty form
              this.addNewForm();
            }
          } catch (e) {
            console.warn('Error parsing userProfile from localStorage', e);
            this.addNewForm();
          }
        } else {
          // If no profile exists at all, add one empty form
          this.addNewForm();
        }

        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = 'Failed to load dropdown data. Please try again.';
        this.isLoading = false;
      }
    });
  }
  
  private async initializeGooglePlaces(): Promise<void> {
    try {
      this.google = await this.loader.load();
      this.placesService = new this.google.maps.places.AutocompleteService();
    } catch (error) {
      console.error('Fatal error: Google Maps script could not be loaded.', error);
      this.errorMessage = 'Could not load location services. Please try again.';
    }
  }

  // Called from the template on user input
  onUniversityInput(event: Event, index: number): void {
    const term = (event.target as HTMLInputElement).value;
    if (!term.trim()) {
      this.showUniversitySuggestions = false;
      return;
    }
    this.universityInput$.next({ term, index });
  }

  // Fetches predictions from the Places API
  private getUniversityPredictions(term: string): Observable<google.maps.places.AutocompletePrediction[]> {
    if (!this.placesService || !this.sessionToken) {
      return of([]);
    }
    return new Observable(observer => {
      this.placesService!.getPlacePredictions({
        input: term,
        types: ['university', 'school'], // Filter for educational institutions
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

  // Called when a user clicks a suggestion
  selectUniversitySuggestion(suggestion: google.maps.places.AutocompletePrediction, index: number): void {
    const form = this.educationForms[index];
    if (form) {
      form.patchValue({ university: suggestion.description });
      form.get('university')?.markAsDirty();
    }
    this.showUniversitySuggestions = false;
    this.activeUniversityInputIndex = null;
    this.sessionToken = undefined; // VERY IMPORTANT: Reset token after selection for cost saving.
  }

  private getDropdownIdByName(dropdownList: DropdownItem[], name: string): number | '' {
    if (!name) return '';
    const item = dropdownList.find(d => d.name.toLowerCase() === name.toLowerCase());
    return item ? item.id : '';
  }

  private createEducationForm(): FormGroup {
    // Removed startDate control and the dateRangeValidator.
    return this.fb.group({
      id: [null],
      endDate: [''],
      university: ['', [Validators.required]],
      educationLevel: ['', [Validators.required, Validators.pattern(/^[0-9]+$/)]],
      course: ['', [Validators.required, Validators.pattern(/^[0-9]+$/)]],
      specialization: ['', [Validators.required, Validators.pattern(/^[0-9]+$/)]]
    });
  }

  /**
   * Triggered when the user changes the graduation date input.
   * @param {number} index The index of the form being edited.
   */
  onGraduationDateChange(index: number): void {
    this.checkGraduationDateProximity(index);
  }

  /**
   * Checks if the entered graduation date is within one year of any other entry.
   * If it is, a non-blocking warning is displayed.
   * @param {number} currentIndex The index of the education form to check.
   */
  private checkGraduationDateProximity(currentIndex: number): void {
    const currentForm = this.educationForms[currentIndex];
    const currentGraduationDateValue = currentForm.get('endDate')?.value;

    // Only proceed if the current form has a valid date.
    if (!currentGraduationDateValue) {
      return;
    }

    const currentGraduationTime = new Date(currentGraduationDateValue).getTime();

    // Loop through all other forms to compare dates.
    for (let i = 0; i < this.educationForms.length; i++) {
      // Don't compare the form against itself.
      if (i === currentIndex) {
        continue;
      }

      const otherForm = this.educationForms[i];
      const otherGraduationDateValue = otherForm.get('endDate')?.value;

      // Only compare if the other form also has a valid date.
      if (otherGraduationDateValue) {
        const otherGraduationTime = new Date(otherGraduationDateValue).getTime();
        
        // Calculate the absolute difference in milliseconds, then convert to days.
        const differenceInMs = Math.abs(currentGraduationTime - otherGraduationTime);
        const differenceInDays = differenceInMs / (1000 * 60 * 60 * 24);

        // If the difference is one year (365 days) or less, show the warning.
        if (differenceInDays <= 365) {
          this.dateProximityMessage = 'Warning: The graduation year entered is within one year of another education entry.';
          this.showDateProximityAlert = true;
          return; // Exit after finding the first proximity.
        }
      }
    }
  }

  /**
   * Handles the confirmation from the date proximity alert.
   * Since it's a non-blocking warning, it simply closes the alert.
   */
  handleDateProximityConfirmation(): void {
    this.showDateProximityAlert = false;
    this.dateProximityMessage = '';
  }
  
  private dateRangeValidator(form: FormGroup): { [key: string]: any } | null {
    const startDate = form.get('startDate')?.value;
    const endDate = form.get('endDate')?.value;
    return startDate && endDate && new Date(endDate) < new Date(startDate)
      ? { dateRangeInvalid: true }
      : null;
  }

  public isFormEmpty(): boolean {

    if (this.educationForms.length === 0) {
      return true;
    } 

    // The form is empty if there is only one education form group
    // and all of its fields are empty.
    if (this.educationForms.length === 1) {
      const singleForm = this.educationForms[0];
      const formValues = singleForm.value;
      
      // We check the values directly instead of relying on the pristine state.
      return !formValues.startDate && 
             !formValues.endDate &&
             !formValues.university &&
             !formValues.educationLevel &&
             !formValues.course &&
             !formValues.specialization;
    }
    // If there is more than one form, it's not empty.
    return false;
  }

public validateForms(): boolean {
  let isOverallValid = true;

  for (const form of this.educationForms) {
    const formValues = form.value;
    // Check if any field in the form has a value.
    const isPartiallyFilled = 
      formValues.endDate ||
      formValues.university ||
      formValues.educationLevel ||
      formValues.course ||
      formValues.specialization;

    // A form is considered invalid only if it's partially filled but fails validation.
    // Completely empty forms will be skipped.
    if (isPartiallyFilled && form.invalid) {
      form.markAllAsTouched(); // Show errors only for this specific invalid form.
      isOverallValid = false;
    }
  }

  return isOverallValid;
}

  addNewForm(): void {
    this.educationForms.push(this.createEducationForm());
    setTimeout(() => {
      const lastForm = this.educationFormInstances.last;
      if (lastForm) {
        lastForm.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 0);
  }

  // removeForm(index: number): void {
  //   if (window.confirm('Are you sure to remove')) {
  //     this.educationForms.splice(index, 1);
  //   }
  // }

  promptRemoveForm(index: number): void {
    this.formToRemoveIndex = index;
    this.showRemoveConfirmation = true;
  }

handleRemoveConfirmation(button: string): void {
  if (button.toLowerCase() === 'remove') {
    if (this.formToRemoveIndex !== null) {
      const formToRemove = this.educationForms[this.formToRemoveIndex];
      // If the form being removed was saved (had an ID), we now have a pending deletion.
     // if (formToRemove && formToRemove.get('id')?.value) {
       // this.hasPendingDeletions = true;
      //}
      this.hasPendingDeletions = true;
      this.educationForms.splice(this.formToRemoveIndex, 1);
    }
  }
  this.closeRemoveConfirmationModal();
}

  closeRemoveConfirmationModal(): void {
    this.showRemoveConfirmation = false;
    this.formToRemoveIndex = null;
  }


saveEducation(): Promise<boolean> {
  return new Promise((resolve) => {
    // Step 1: Validate all forms. The updated validateForms() now correctly
    // ignores completely blank forms and only validates partially filled ones.
    if (!this.validateForms()) {
      resolve(false);
      return; // Stop if validation fails on a partially filled form.
    }

    // Step 2: Filter out the completely empty forms so they are not sent to the backend.
    const formsToSave = this.educationForms.filter(form => {
      const formValues = form.value;
      // This condition ensures we only include forms that have some data.
      return formValues.endDate ||
             formValues.university ||
             formValues.educationLevel ||
             formValues.course ||
             formValues.specialization;
    });

    // Step 3: If there are no forms with data, treat it as a successful skip.
    if (formsToSave.length === 0 && !this.hasPendingDeletions) {
      console.log('No education data to save. Skipping.');
      resolve(true);
      return;
    }

    // Step 4: Create the payload using only the valid, non-empty forms.
     // Payload now explicitly sets select_start_date to null.
      const payload = formsToSave.map(form => {
        const formValue = form.value;
        return {
          id: formValue.id,
          select_start_date: null, // Always send null for the hidden start date
          select_end_date: formValue.endDate || null,

          university: formValue.university,
          education_level: this.educationLevels.find(e => e.id === +formValue.educationLevel)?.name,
          course: this.courses.find(c => c.id === +formValue.course)?.name,
          specialization: this.specializations.find(s => s.id === +formValue.specialization)?.name
        };
      });

    console.log('Sending payload to backend:', payload);

    this.educationService.saveEducation(payload).subscribe({
      next: (response) => {
        console.log('All educations saved successfully:', response);
        this.errorMessage = null;
        this.hasPendingDeletions = false;
        resolve(true);
      },
      error: (error) => {
        console.error('Error saving educations:', error);
        this.errorMessage = error.message || 'An unknown error occurred while saving.';
        resolve(false);
      }
    });
  });
}

  private onDocumentClick(): void {
    // Hide suggestions if a click occurs anywhere in the document
    if (this.showUniversitySuggestions) {
      this.ngZone.run(() => {
        this.showUniversitySuggestions = false;
        this.activeUniversityInputIndex = null;
      });
    }
  }

  ngOnDestroy(): void {
    // --- Clean up subscriptions and listeners ---
    this.subscriptions.unsubscribe();
    this.sessionToken = undefined;
    this.document.removeEventListener('click', this.onDocumentClick.bind(this));
  }
  
  goToPrevious(): void {
    this.router.navigate(['/profile-employment-page']);
  }

  skipToNextSection(): void {
    this.router.navigate(['/profile-certification-page']);
  }

  trackById(index: number, item: any): number {
    return item.id || index;
  }
}