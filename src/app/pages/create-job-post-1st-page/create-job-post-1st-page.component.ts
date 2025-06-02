import { Component, OnInit, ElementRef, ViewChild, AfterViewInit, NgZone, Renderer2, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Title, Meta } from '@angular/platform-browser';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, Observable, of, fromEvent } from 'rxjs'; // Added fromEvent
import { debounceTime, distinctUntilChanged, switchMap, catchError, map, tap } from 'rxjs/operators'; // Added map, tap
import { JobDescriptionService } from '../../services/job-description.service';
import { CorporateAuthService } from '../../services/corporate-auth.service';
import { JobDetails, AIJobResponse } from './types';

// Ensure @types/google.maps is installed

@Component({
  selector: 'create-job-post-1st-page',
  templateUrl: './create-job-post-1st-page.component.html',
  styleUrls: ['./create-job-post-1st-page.component.css']
})
export class CreateJobPost1stPageComponent implements OnInit, AfterViewInit {
  @ViewChild('locationInput') locationInput!: ElementRef<HTMLInputElement>;
  @ViewChild('suggestionsContainer') suggestionsContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  private readonly googleMapsApiKey: string = 'AIzaSyCYvHT8TXJdvdfr0CBRV62q5MzaD008hAE';
  private googleScriptLoaded: boolean = false;

  jobForm: FormGroup;
  // private searchTerms = new Subject<string>(); // We'll use fromEvent on the input directly
  suggestions: string[] = [];
  isLoading = false;
  showSuggestions = false;
  selectedFile: File | null = null;
  private readonly DEBOUNCE_DELAY = 300;
  currentStep: 'jobPost' | 'assessment' = 'jobPost';
  isSubmitting: boolean = false;

  private jobData: JobDetails | AIJobResponse | null = null;
  private isViewInitialized = false;
  // private placesService?: google.maps.places.AutocompleteService; // DEPRECATED
  private autocomplete?: google.maps.places.Autocomplete; // NEW: Using Autocomplete

  constructor(
    private title: Title,
    private meta: Meta,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private jobDescriptionService: JobDescriptionService,
    private corporateAuthService: CorporateAuthService,
    private router: Router,
    private route: ActivatedRoute,
    private ngZone: NgZone,
    private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document
  ) {
    this.jobForm = this.fb.group({
      role: ['', [Validators.required, Validators.maxLength(100)]],
      location: ['', [Validators.required, Validators.maxLength(200)]],
      job_type: ['', [Validators.required]],
      workplace_type: ['', [Validators.required]],
      total_experience_min: [0, [Validators.required, Validators.min(0), Validators.max(30)]],
      total_experience_max: [30, [Validators.required, Validators.min(0), Validators.max(30)]],
      relevant_experience_min: [0, [Validators.required, Validators.min(0), Validators.max(30)]],
      relevant_experience_max: [30, [Validators.required, Validators.min(0), Validators.max(30)]],
      budget_type: ['', [Validators.required]],
      min_budget: [null, [Validators.required, Validators.min(0)]],
      max_budget: [null, [Validators.required, Validators.min(0)]],
      notice_period: ['', [Validators.required, Validators.maxLength(50)]],
      skills: [[], [Validators.required]],
      job_description: ['', [Validators.maxLength(5000)]],
      job_description_url: ['', [Validators.maxLength(200)]],
      unique_id: ['']
    }, { validators: this.experienceRangeValidator });
  }

  ngOnInit(): void {
    this.title.setTitle('Create Job Post - Flashyre');
    this.meta.addTags([
      { property: 'og:title', content: 'Create Job Post - Flashyre' },
      {
        property: 'og:image',
        content: 'https://aheioqhobo.cloudimg.io/v7/_playground-bucket-v2.teleporthq.io_/8203932d-6f2d-4493-a7b2-7000ee521aa2/9aea8e9c-27ce-4011-a345-94a92ae2dbf8?org_if_sml=1&force_format=original'
      }
    ]);

    this.loadGoogleMapsScript().then(() => {
      // Initialization of Autocomplete is now in ngAfterViewInit
      // because it needs the locationInput ElementRef
      const uniqueId = this.route.snapshot.paramMap.get('unique_id');
      if (uniqueId) {
        // ... your existing logic to load job post
      }
    }).catch(error => {
      console.error('Google Maps script could not be loaded.', error);
      this.snackBar.open('Could not load location services. Please try again later.', 'Close', { duration: 5000 });
    });

    if (!this.corporateAuthService.isLoggedIn()) {
      this.snackBar.open('Please log in to create a job post.', 'Close', { duration: 5000 });
      this.router.navigate(['/login-corporate']);
      return;
    }
  }

  private loadGoogleMapsScript(): Promise<void> {
    // ... (same as before)
    return new Promise((resolve, reject) => {
      if (this.googleScriptLoaded) {
        resolve();
        return;
      }
      if (typeof google !== 'undefined' && google.maps && google.maps.places) {
        this.googleScriptLoaded = true;
        resolve();
        return;
      }

      const script = this.renderer.createElement('script');
      script.type = 'text/javascript';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${this.googleMapsApiKey}&libraries=places`; // Ensure 'places' library is loaded
      script.async = true;
      script.defer = true;
      script.onload = () => {
        this.googleScriptLoaded = true;
        resolve();
      };
      script.onerror = (error: any) => {
        console.error('Error loading Google Maps script:', error);
        reject(error);
      };
      this.renderer.appendChild(this.document.head, script);
    });
  }

  ngAfterViewInit(): void {
    this.isViewInitialized = true;
    if (this.jobData) {
      this.populateForm(this.jobData);
    }
    this.initializeSkillsInput();
    this.initializeRange('total');
    this.initializeRange('relevant');
    this.updateExperienceUI();
    this.checkEmpty('editor');

    if (this.googleScriptLoaded) {
      this.initializeGooglePlacesAutocomplete();
      this.setupLocationInputListener(); // Setup listener after Autocomplete is initialized
    } else {
      // Fallback if script wasn't loaded by ngOnInit (should be rare with the promise)
      this.loadGoogleMapsScript().then(() => {
        this.initializeGooglePlacesAutocomplete();
        this.setupLocationInputListener();
      }).catch(err => console.error("Late script load failed in ngAfterViewInit", err));
    }
  }

  private initializeGooglePlacesAutocomplete(): void {
    if (typeof google !== 'undefined' && google.maps && google.maps.places && this.locationInput) {
      if (!this.autocomplete) {
        this.autocomplete = new google.maps.places.Autocomplete(
          this.locationInput.nativeElement,
          {
            types: ['(cities)'], // Restrict to cities
            // fields: ['place_id', 'name', 'formatted_address', 'geometry'] // Specify fields to return
          }
        );
        console.log('Google Places Autocomplete WIDGET Initialized.');

        // Listen for the 'place_changed' event
        this.autocomplete.addListener('place_changed', () => {
          this.ngZone.run(() => { // Run inside Angular zone
            const place = this.autocomplete!.getPlace();
            if (place && place.formatted_address) {
              this.jobForm.patchValue({ location: place.formatted_address });
              this.suggestions = [];
              this.showSuggestions = false;
              console.log('Place selected:', place.formatted_address);
            } else if (place && place.name) {
                // Fallback if formatted_address is not available but name is
                this.jobForm.patchValue({ location: place.name });
                this.suggestions = [];
                this.showSuggestions = false;
                console.log('Place selected (name only):', place.name);
            } else {
              console.log('Autocomplete.getPlace() did not return a valid place or address.');
              // Optionally clear the input or handle no selection
              // this.jobForm.patchValue({ location: '' });
            }
          });
        });
      }
    } else {
      console.warn('Google Maps API, Places library, or locationInput not available for Autocomplete initialization.');
    }
  }

  // NEW: Setup listener for input changes to manually fetch and display suggestions
  // This is a workaround since Autocomplete widget manages its own dropdown.
  // We are trying to make our custom dropdown work with it.
  private setupLocationInputListener(): void {
    if (!this.locationInput) return;

    fromEvent(this.locationInput.nativeElement, 'input').pipe(
      map(event => (event.target as HTMLInputElement).value),
      debounceTime(this.DEBOUNCE_DELAY),
      distinctUntilChanged(),
      tap(query => {
        if (!query) {
          this.suggestions = [];
          this.showSuggestions = false;
          this.isLoading = false;
        } else {
          this.isLoading = true;
        }
      }),
      // The Autocomplete widget handles predictions internally.
      // To show our custom suggestion box, we'd need to tap into its predictions.
      // This is tricky as the Autocomplete widget is designed to show its own UI.
      // For a fully custom UI, the new Places API's programmatic session token based calls are better.
      // Let's try a simplified approach that might not be ideal but attempts to show *something*.
      // This part is experimental and might not work perfectly with the Autocomplete widget.
      switchMap(query => {
        if (!query || !this.autocomplete) { // ensure autocomplete is initialized
          return of([]);
        }
        // We are essentially re-implementing what AutocompleteService did,
        // but this time we don't have a direct `getPlacePredictions` on the Autocomplete widget itself.
        // The Autocomplete widget handles its own suggestions.
        // For a custom list, we'd typically use the new Text Search (New) or Place Autocomplete (New) programmatic APIs.
        // This is a placeholder, as direct prediction fetching from `google.maps.places.Autocomplete` is not its primary use.
        console.warn("Fetching suggestions manually with Autocomplete widget is not its standard use. Consider Places API (New) for custom UI.");
        // This is a very HACKY way to try and get suggestions if the default dropdown is suppressed or hidden.
        // The proper way is to use the new programmatic APIs.
        // For now, we'll just clear our custom suggestions as the widget handles its own.
        return of([]); // Let the Google Autocomplete widget handle its own dropdown
      })
    ).subscribe({
      next: (manualSuggestions) => { // This will likely be empty based on the switchMap
        this.isLoading = false;
        // this.suggestions = manualSuggestions; // Our custom suggestion box
        // this.showSuggestions = manualSuggestions.length > 0;
        // Since the Autocomplete widget has its own UI, we might not need our custom suggestion box.
        // If you want to hide Google's default suggestions and use your own, it's more complex.
      },
      error: (err) => {
        this.isLoading = false;
        console.error("Error in location input listener:", err);
        this.snackBar.open('Error fetching location suggestions.', 'Close', { duration: 3000 });
      }
    });
  }


  // The onInput for location is now handled by setupLocationInputListener
  onInput(event: Event): void {
    // This method might not be directly needed if using the Autocomplete widget's own input handling
    // and the fromEvent listener.
    // However, if you want to trigger something else on every input, keep it.
    // For now, let's assume the fromEvent listener is primary for suggestions.
    // const query = (event.target as HTMLInputElement).value.trim();
    // if (query.length === 0) {
    //   this.showSuggestions = false;
    //   this.suggestions = [];
    //   this.isLoading = false;
    // }
  }

  // fetchLocationSuggestions is no longer needed if relying on Autocomplete widget's suggestions
  /*
  private fetchLocationSuggestions(query: string): Observable<string[]> {
    // This used the deprecated AutocompleteService.
    // The Autocomplete widget handles its own suggestions.
    // If you need programmatic fetching for a custom UI, you'd use the new Places API.
    return of([]);
  }
  */

  selectSuggestion(location: string): void {
    // This is called when a user clicks on one of OUR custom suggestions.
    // If we are primarily using the Google Autocomplete widget's dropdown,
    // the 'place_changed' event listener in initializeGooglePlacesAutocomplete will handle selection.
    this.jobForm.patchValue({ location });
    this.showSuggestions = false;
    this.suggestions = [];
  }


  // --- Rest of your component code (experienceRangeValidator, file upload, populateForm, etc. remains the same) ---
  private adjustExperienceRange(min: number, max: number): [number, number] {
    if (min === 0 && max === 0) {
      return [0, 30];
    }
    return [min, max];
  }
  private experienceRangeValidator(form: FormGroup): { [key: string]: any } | null {
    const totalMin = form.get('total_experience_min')?.value;
    const totalMax = form.get('total_experience_max')?.value;
    const relevantMin = form.get('relevant_experience_min')?.value;
    const relevantMax = form.get('relevant_experience_max')?.value;
    const minBudget = form.get('min_budget')?.value;
    const maxBudget = form.get('max_budget')?.value;

    if (totalMin > totalMax) {
      return { invalidTotalExperience: true };
    }
    if (relevantMin > relevantMax) {
      return { invalidRelevantExperience: true };
    }
    if (minBudget !== null && maxBudget !== null && minBudget > maxBudget) {
        return { invalidBudgetRange: true };
    }
    return null;
  }
  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const allowedExtensions = ['.pdf', '.docx', '.txt', '.xml', '.csv', '.doc'];
      const ext = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      const maxSize = 10 * 1024 * 1024;

      if (!allowedExtensions.includes(ext)) {
        this.snackBar.open(`Invalid file format. Supported: ${allowedExtensions.join(', ')}`, 'Close', { duration: 5000 });
        this.selectedFile = null;
        input.value = '';
        return;
      }
      if (file.size > maxSize) {
        this.snackBar.open('File size exceeds 10MB limit.', 'Close', { duration: 5000 });
        this.selectedFile = null;
        input.value = '';
        return;
      }
      this.selectedFile = file;
      this._performUpload(this.selectedFile);
    } else {
      this.selectedFile = null;
    }
  }

  private _performUpload(file: File): void {
    if (!file) {
      this.snackBar.open('No file selected for upload.', 'Close', { duration: 5000 });
      return;
    }
    const token = this.corporateAuthService.getJWTToken();
    if (!token) {
      this.snackBar.open('Authentication required. Please log in.', 'Close', { duration: 5000 });
      this.router.navigate(['/login-corporate']);
      return;
    }

    this.isSubmitting = true;
    this.jobDescriptionService.uploadFile(file, token).subscribe({
      next: (response) => {
        this.jobData = response;
        this.populateForm(response);
        this.snackBar.open('File uploaded and processed successfully.', 'Close', { duration: 3000 });
        this.isSubmitting = false;
        if (this.fileInput) this.fileInput.nativeElement.value = '';
        this.selectedFile = null;
      },
      error: (error) => {
        console.error('File upload error:', error);
        this.snackBar.open(`File upload or processing failed: ${error.message || 'Unknown error'}`, 'Close', { duration: 5000 });
        this.isSubmitting = false;
        if (this.fileInput) this.fileInput.nativeElement.value = '';
        this.selectedFile = null;
      }
    });
  }
  private updateExperienceUI(): void {
    this.setExperienceRange('total', this.jobForm.value.total_experience_min, this.jobForm.value.total_experience_max);
    this.setExperienceRange('relevant', this.jobForm.value.relevant_experience_min, this.jobForm.value.relevant_experience_max);
  }

  private populateForm(jobData: JobDetails | AIJobResponse): void {
    let role: string;
    let location: string;
    let job_type: string;
    let workplace_type: string;
    let total_experience_min: number;
    let total_experience_max: number;
    let relevant_experience_min: number;
    let relevant_experience_max: number;
    let budget_type: string;
    let min_budget: number | null;
    let max_budget: number | null;
    let notice_period: string;
    let skills: string[];
    let job_description: string;
    let unique_id_val: string = '';
    let job_description_url_val: string = '';

    if ('job_details' in jobData) {
      const aiJobData = jobData as AIJobResponse;
      const jobDetails = aiJobData.job_details;
      const [minExp, maxExp] = this.parseExperience(jobDetails.experience?.value || '0-0 years');

      role = jobDetails.job_titles[0]?.value || '';
      location = jobDetails.location || '';
      job_type = this.mapJobType(jobDetails.job_titles[0]?.value || '');
      workplace_type = jobDetails.workplace_type || 'Remote';
      [total_experience_min, total_experience_max] = this.adjustExperienceRange(minExp, maxExp);
      [relevant_experience_min, relevant_experience_max] = this.adjustExperienceRange(minExp, maxExp);
      budget_type = jobDetails.budget_type || 'Annually';
      min_budget = jobDetails.min_budget || null;
      max_budget = jobDetails.max_budget || null;
      notice_period = jobDetails.notice_period || '30 days';
      skills = [
        ...(jobDetails.skills.primary || []).map(s => s.skill),
        ...(jobDetails.skills.secondary || []).map(s => s.skill)
      ];
      job_description = jobDetails.job_description || '';
      unique_id_val = aiJobData.unique_id || '';
      job_description_url_val = aiJobData.file_url || '';
    } else {
      const jobDetails = jobData as JobDetails;
      role = jobDetails.role;
      location = jobDetails.location;
      job_type = jobDetails.job_type;
      workplace_type = jobDetails.workplace_type;
      [total_experience_min, total_experience_max] = this.adjustExperienceRange(jobDetails.total_experience_min, jobDetails.total_experience_max);
      [relevant_experience_min, relevant_experience_max] = this.adjustExperienceRange(jobDetails.relevant_experience_min, jobDetails.relevant_experience_max);
      budget_type = jobDetails.budget_type;
      min_budget = jobDetails.min_budget;
      max_budget = jobDetails.max_budget;
      notice_period = jobDetails.notice_period;
      skills = [...(jobDetails.skills.primary || []).map(s => s.skill), ...(jobDetails.skills.secondary || []).map(s => s.skill)];
      job_description = jobDetails.job_description;
      unique_id_val = jobDetails.unique_id || '';
      job_description_url_val = jobDetails.job_description_url || '';
    }

    this.jobForm.patchValue({
      role,
      location,
      job_type,
      workplace_type,
      total_experience_min,
      total_experience_max,
      relevant_experience_min,
      relevant_experience_max,
      budget_type,
      min_budget,
      max_budget,
      notice_period,
      skills,
      job_description,
      job_description_url: job_description_url_val,
      unique_id: unique_id_val
    });

    this.populateSkills(skills);
    this.setJobDescription(job_description);
    this.setExperienceRange('total', total_experience_min, total_experience_max);
    this.setExperienceRange('relevant', relevant_experience_min, relevant_experience_max);
  }

  private populateSkills(skills: string[]): void {
    const tagContainer = document.getElementById('tagContainer') as HTMLDivElement;
    const tagInput = document.getElementById('tagInput') as HTMLInputElement;
    if (!tagContainer || !tagInput) {
      console.warn('Skills input or container not found.');
      return;
    }

    const existingTags = tagContainer.querySelectorAll('.tag');
    existingTags.forEach(tag => tag.remove());
    this.jobForm.patchValue({ skills: [...skills] });

    skills.forEach(skill => {
      const tag = document.createElement('div');
      tag.className = 'tag';
      const tagText = document.createElement('span');
      tagText.textContent = skill;
      tag.appendChild(tagText);
      const removeBtn = document.createElement('button');
      removeBtn.textContent = '×';
      removeBtn.addEventListener('click', () => {
        tag.remove();
        const currentFormSkills: string[] = this.jobForm.get('skills')?.value || [];
        const updatedSkills = currentFormSkills.filter(s => s !== skill);
        this.jobForm.patchValue({ skills: updatedSkills });
      });
      tag.appendChild(removeBtn);
      tagContainer.insertBefore(tag, tagInput);
    });
  }

  private setJobDescription(description: string): void {
    const editor = document.getElementById('editor') as HTMLDivElement;
    if (editor) {
      editor.innerHTML = description;
      this.checkEmpty('editor');
    }
  }

  updateJobDescriptionFromEditor(event: Event): void {
    const editorContent = (event.target as HTMLDivElement).innerHTML;
    this.jobForm.patchValue({ job_description: editorContent });
    this.checkEmpty('editor');
  }

  private setExperienceRange(type: 'total' | 'relevant', min: number, max: number): void {
    const prefix = type === 'total' ? 'total_' : 'relevant_';
    const rangeIndicator = document.getElementById(`${prefix}rangeIndicator`) as HTMLDivElement;
    const markerLeft = document.getElementById(`${prefix}markerLeft`) as HTMLDivElement;
    const markerRight = document.getElementById(`${prefix}markerRight`) as HTMLDivElement;
    const labelLeft = document.getElementById(`${prefix}labelLeft`) as HTMLDivElement;
    const labelRight = document.getElementById(`${prefix}labelRight`) as HTMLDivElement;
    const filledSegment = document.getElementById(`${prefix}filledSegment`) as HTMLDivElement;

    if (rangeIndicator && markerLeft && markerRight && labelLeft && labelRight && filledSegment) {
      const rect = rangeIndicator.getBoundingClientRect();
      const width = rect.width > 0 ? rect.width : rangeIndicator.offsetWidth;
      const maxYears = 30;
      const markerWidth = markerLeft.offsetWidth || 12;
      const effectiveWidth = width - markerWidth;
      const clampedMin = Math.max(0, Math.min(min, maxYears));
      const clampedMax = Math.max(clampedMin, Math.min(max, maxYears));
      const minPos = (clampedMin / maxYears) * effectiveWidth;
      const maxPos = (clampedMax / maxYears) * effectiveWidth;
      markerLeft.style.left = `${minPos}px`;
      markerRight.style.left = `${maxPos}px`;
      labelLeft.style.left = `${minPos + markerWidth / 2}px`;
      labelLeft.textContent = `${clampedMin}yrs`;
      labelRight.style.left = `${maxPos + markerWidth / 2}px`;
      labelRight.textContent = `${clampedMax}yrs`;
      filledSegment.style.left = `${minPos + markerWidth / 2}px`;
      filledSegment.style.width = `${Math.max(0, maxPos - minPos)}px`;
    }
  }

  private checkEmpty(id: string): void {
    const element = document.getElementById(id) as HTMLDivElement;
    if (!element) return;
    const isEmpty = element.innerHTML.trim() === '' || element.innerHTML.trim() === '<br>';
    element.setAttribute('data-empty', isEmpty ? 'true' : 'false');
  }

  private mapJobType(title: string): string {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('intern')) return 'Internship';
    if (lowerTitle.includes('contract')) return 'Contract';
    if (lowerTitle.includes('part-time')) return 'Part-time';
    return 'Permanent';
  }

  private initializeRange(type: 'total' | 'relevant'): void {
    const prefix = type === 'total' ? 'total_' : 'relevant_';
    const rangeIndicator = document.getElementById(`${prefix}rangeIndicator`) as HTMLDivElement;
    const markerLeft = document.getElementById(`${prefix}markerLeft`) as HTMLDivElement;
    const markerRight = document.getElementById(`${prefix}markerRight`) as HTMLDivElement;
    const labelLeft = document.getElementById(`${prefix}labelLeft`) as HTMLDivElement;
    const labelRight = document.getElementById(`${prefix}labelRight`) as HTMLDivElement;
    const filledSegment = document.getElementById(`${prefix}filledSegment`) as HTMLDivElement;

    if (!rangeIndicator || !markerLeft || !markerRight || !labelLeft || !labelRight || !filledSegment) return;
    let isDragging = false;
    let currentMarker: HTMLDivElement | null = null;
    const maxYears = 30;
    const markerWidth = markerLeft.offsetWidth || 12;

    const updateUIFromMarkers = () => {
        const rect = rangeIndicator.getBoundingClientRect();
        if (rect.width <= 0) return;
        const effectiveWidth = rect.width - markerWidth;
        const leftPosPx = parseFloat(markerLeft.style.left) || 0;
        const rightPosPx = parseFloat(markerRight.style.left) || 0;
        const minYear = Math.round((leftPosPx / effectiveWidth) * maxYears);
        const maxYear = Math.round((rightPosPx / effectiveWidth) * maxYears);

        if (type === 'total') {
            this.jobForm.patchValue({
                total_experience_min: Math.min(minYear, maxYear),
                total_experience_max: Math.max(minYear, maxYear)
            }, { emitEvent: false });
        } else {
            this.jobForm.patchValue({
                relevant_experience_min: Math.min(minYear, maxYear),
                relevant_experience_max: Math.max(minYear, maxYear)
            }, { emitEvent: false });
        }
        labelLeft.textContent = `${this.jobForm.value[type + '_experience_min']}yrs`;
        labelRight.textContent = `${this.jobForm.value[type + '_experience_max']}yrs`;
        labelLeft.style.left = `${leftPosPx + markerWidth / 2}px`;
        labelRight.style.left = `${rightPosPx + markerWidth / 2}px`;
        filledSegment.style.left = `${leftPosPx + markerWidth / 2}px`;
        filledSegment.style.width = `${Math.max(0, rightPosPx - leftPosPx)}px`;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging || !currentMarker || !rangeIndicator) return;
      const rect = rangeIndicator.getBoundingClientRect();
      let newLeftPx = e.clientX - rect.left - (markerWidth / 2);
      const minBoundaryPx = 0;
      const maxBoundaryPx = rect.width - markerWidth;
      if (currentMarker === markerLeft) {
        const rightMarkerPosPx = parseFloat(markerRight.style.left) || maxBoundaryPx;
        newLeftPx = Math.max(minBoundaryPx, Math.min(newLeftPx, rightMarkerPosPx - markerWidth));
      } else if (currentMarker === markerRight) {
        const leftMarkerPosPx = parseFloat(markerLeft.style.left) || minBoundaryPx;
        newLeftPx = Math.min(maxBoundaryPx, Math.max(newLeftPx, leftMarkerPosPx + markerWidth));
      }
      newLeftPx = Math.max(minBoundaryPx, Math.min(newLeftPx, maxBoundaryPx));
      currentMarker.style.left = `${newLeftPx}px`;
      updateUIFromMarkers();
    };
    const onMouseUp = () => {
      if (isDragging) updateUIFromMarkers();
      isDragging = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    const onMouseDown = (e: MouseEvent, marker: HTMLDivElement) => {
      e.preventDefault();
      isDragging = true;
      currentMarker = marker;
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    };
    markerLeft.addEventListener('mousedown', (e) => onMouseDown(e, markerLeft));
    markerRight.addEventListener('mousedown', (e) => onMouseDown(e, markerRight));
    if (type === 'total') {
      this.setExperienceRange('total', this.jobForm.value.total_experience_min, this.jobForm.value.total_experience_max);
    } else {
      this.setExperienceRange('relevant', this.jobForm.value.relevant_experience_min, this.jobForm.value.relevant_experience_max);
    }
    updateUIFromMarkers();
  }

  private parseExperience(exp: string): [number, number] {
    const rangeMatch = exp.match(/(\d+)\s*-\s*(\d+)/);
    if (rangeMatch) return [parseInt(rangeMatch[1]), parseInt(rangeMatch[2])];
    const singleMatch = exp.match(/(\d+)\s*years?/i);
    if (singleMatch) { const val = parseInt(singleMatch[1]); return [val, val]; }
    return [0, 0];
  }
  handleOutsideClick(event: FocusEvent): void {
    // If using Google's Autocomplete widget, it handles its own dismissal.
    // This might still be useful if you have other custom popups.
    setTimeout(() => {
        if (this.suggestionsContainer && !this.suggestionsContainer.nativeElement.contains(document.activeElement)) {
             // Check if the active element is part of Google's pac-container
            const pacContainer = document.querySelector('.pac-container');
            if (pacContainer && pacContainer.contains(document.activeElement)) {
                return; // Don't hide if interacting with Google's suggestions
            }
            this.showSuggestions = false; // Hide our custom suggestions
        }
    }, 150);
  }

  private initializeSkillsInput(): void {
    const tagInput = document.getElementById('tagInput') as HTMLInputElement;
    const tagContainer = document.getElementById('tagContainer') as HTMLDivElement;
    const skillsSuggestionsDiv = document.getElementById('skillsSuggestions') as HTMLDivElement;

    if (!tagInput || !tagContainer || !skillsSuggestionsDiv) {
      console.warn('Skill input related elements not found in DOM.');
      return;
    }
    let selectedTags: string[] = [...(this.jobForm.get('skills')?.value || [])];
    let activeSuggestionIndex = -1;
    const availableTags = [
        'JavaScript', 'HTML', 'CSS', 'React', 'Vue', 'Angular', 'Node.js', 'TypeScript', 'Python',
        'Java', 'PHP', 'Ruby', 'Swift', 'Kotlin', 'Go', 'Rust', 'C#', 'C++', 'MongoDB', 'MySQL',
        'PostgreSQL', 'Redis', 'GraphQL', 'REST API', 'Machine Learning', 'Artificial Intelligence',
        'Data Science', 'Cloud Computing', 'AWS', 'Azure', 'Google Cloud Platform', 'DevOps', 'CI/CD',
        'Docker', 'Kubernetes', 'Cybersecurity', 'Blockchain', 'Mobile Development', 'Frontend Development',
        'Backend Development', 'Full-stack Development', 'UI/UX Design', 'QA Testing', 'Agile Methodologies',
        'Scrum', 'Project Management'
    ];
    const filterSuggestions = (input: string) => {
      if (!input) return [];
      const inputLower = input.toLowerCase();
      selectedTags = [...(this.jobForm.get('skills')?.value || [])];
      return availableTags.filter(tag =>
        tag.toLowerCase().includes(inputLower) && !selectedTags.includes(tag)
      );
    };
    const showAvailableSuggestions = (filteredSuggestions: string[]) => {
      skillsSuggestionsDiv.innerHTML = '';
      if (filteredSuggestions.length === 0) {
        skillsSuggestionsDiv.style.display = 'none';
        return;
      }
      filteredSuggestions.forEach((suggestion) => {
        const item = document.createElement('div');
        item.className = 'suggestion-item';
        item.textContent = suggestion;
        item.addEventListener('click', () => {
          addSkillTag(suggestion);
          tagInput.value = '';
          skillsSuggestionsDiv.style.display = 'none';
          tagInput.focus();
        });
        skillsSuggestionsDiv.appendChild(item);
      });
      skillsSuggestionsDiv.style.display = 'block';
      activeSuggestionIndex = -1;
    };
    const addSkillTag = (text: string) => {
      selectedTags = [...(this.jobForm.get('skills')?.value || [])];
      if (!text || selectedTags.includes(text)) return;
      selectedTags.push(text);
      this.jobForm.patchValue({ skills: [...selectedTags] });
      const tag = document.createElement('div');
      tag.className = 'tag';
      const tagText = document.createElement('span');
      tagText.textContent = text;
      tag.appendChild(tagText);
      const removeBtn = document.createElement('button');
      removeBtn.textContent = '×';
      removeBtn.addEventListener('click', () => {
        tag.remove();
        const currentSkillsFromForm = [...(this.jobForm.get('skills')?.value || [])];
        this.jobForm.patchValue({ skills: currentSkillsFromForm.filter(s => s !== text) });
      });
      tag.appendChild(removeBtn);
      tagContainer.insertBefore(tag, tagInput);
    };
    const navigateAvailableSuggestions = (direction: 'up' | 'down') => {
      const items = skillsSuggestionsDiv.querySelectorAll('.suggestion-item');
      if (items.length === 0) return;
      if (activeSuggestionIndex >= 0 && activeSuggestionIndex < items.length) {
        items[activeSuggestionIndex].classList.remove('active-suggestion');
      }
      if (direction === 'down') {
        activeSuggestionIndex = (activeSuggestionIndex + 1) % items.length;
      } else {
        activeSuggestionIndex = activeSuggestionIndex <= 0 ? items.length - 1 : activeSuggestionIndex - 1;
      }
      items[activeSuggestionIndex].classList.add('active-suggestion');
      items[activeSuggestionIndex].scrollIntoView({ block: 'nearest' });
    };
    tagInput.addEventListener('input', () => {
      const filtered = filterSuggestions(tagInput.value);
      showAvailableSuggestions(filtered);
    });
    tagInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const items = skillsSuggestionsDiv.querySelectorAll('.suggestion-item');
        if (activeSuggestionIndex >= 0 && activeSuggestionIndex < items.length) {
          addSkillTag(items[activeSuggestionIndex].textContent || '');
        } else if (tagInput.value.trim()) {
          addSkillTag(tagInput.value.trim());
        }
        tagInput.value = '';
        skillsSuggestionsDiv.style.display = 'none';
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        navigateAvailableSuggestions('down');
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        navigateAvailableSuggestions('up');
      } else if (e.key === 'Backspace' && !tagInput.value) {
        const currentSkills = [...(this.jobForm.get('skills')?.value || [])];
        if (currentSkills.length > 0) {
          currentSkills.pop();
          this.jobForm.patchValue({ skills: currentSkills });
          const tagsInDOM = tagContainer.querySelectorAll('.tag');
          if (tagsInDOM.length > 0) {
            tagsInDOM[tagsInDOM.length - 1].remove();
          }
        }
      } else if (e.key === 'Escape') {
        skillsSuggestionsDiv.style.display = 'none';
      }
    });
    document.addEventListener('click', (e) => {
      if (!tagContainer.contains(e.target as Node) && !skillsSuggestionsDiv.contains(e.target as Node)) {
        skillsSuggestionsDiv.style.display = 'none';
      }
    });
    tagContainer.addEventListener('click', (e) => {
      if (e.target === tagContainer) {
        tagInput.focus();
      }
    });
    this.populateSkills(this.jobForm.get('skills')?.value || []);
  }

  onSubmit(): void {
    if (this.currentStep === 'jobPost') {
      if (this.jobForm.invalid) {
        this.snackBar.open('Please fill all required fields correctly before proceeding.', 'Close', { duration: 5000 });
        this.jobForm.markAllAsTouched();
        Object.keys(this.jobForm.controls).forEach(field => {
            const control = this.jobForm.get(field);
            if (control?.invalid) {
                console.log(`Field ${field} is invalid. Errors:`, control.errors);
            }
        });
        if(this.jobForm.errors) {
            console.log('Form-level errors:', this.jobForm.errors);
        }
        return;
      }

      const token = this.corporateAuthService.getJWTToken();
      if (!token) {
        this.snackBar.open('Authentication required. Please log in.', 'Close', { duration: 5000 });
        this.router.navigate(['/login-corporate']);
        return;
      }

      this.isSubmitting = true;
      const formValues = this.jobForm.value;
      const jobDetails: JobDetails = {
        ...formValues,
        skills: {
          primary: (formValues.skills || []).slice(0, Math.ceil((formValues.skills || []).length / 2)).map((skill: string) => ({
            skill,
            skill_confidence: 0.9,
            type_confidence: 0.9
          })),
          secondary: (formValues.skills || []).slice(Math.ceil((formValues.skills || []).length / 2)).map((skill: string) => ({
            skill,
            skill_confidence: 0.8,
            type_confidence: 0.8
          }))
        }
      };

      this.jobDescriptionService.saveJobPost(jobDetails, token).subscribe({
        next: (response) => {
          this.isSubmitting = false;
          this.snackBar.open('Job post saved successfully. Proceeding to assessment setup.', 'Close', { duration: 3000 });
          this.jobForm.patchValue({ unique_id: response.unique_id });
          this.currentStep = 'assessment';
        },
        error: (error) => {
          this.isSubmitting = false;
          console.error('Job post saving failed:', error);
          this.snackBar.open(`Job post saving failed: ${error.message || 'Unknown error'}`, 'Close', { duration: 5000 });
        }
      });
    } else if (this.currentStep === 'assessment') {
      this.snackBar.open('Assessment details submitted! (Placeholder)', 'Close', { duration: 3000 });
      this.resetForm();
      this.router.navigate(['/job-posted']);
    }
  }

  onCancel(): void {
    if (this.currentStep === 'assessment') {
      this.snackBar.open('Returning to job post editing.', 'Close', { duration: 2000 });
      this.currentStep = 'jobPost';
    } else if (this.currentStep === 'jobPost') {
      this.snackBar.open('Job post creation cancelled.', 'Close', { duration: 3000 });
      this.resetForm();
      this.router.navigate(['/dashboard']);
    }
  }

  resetForm(): void {
    this.jobForm.reset({
      role: '',
      location: '',
      job_type: '',
      workplace_type: '',
      total_experience_min: 0,
      total_experience_max: 30,
      relevant_experience_min: 0,
      relevant_experience_max: 30,
      budget_type: '',
      min_budget: null,
      max_budget: null,
      notice_period: '',
      skills: [],
      job_description: '',
      job_description_url: '',
      unique_id: ''
    });
    this.selectedFile = null;
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
    this.populateSkills([]);
    this.setJobDescription('');
    this.updateExperienceUI();
    this.currentStep = 'jobPost';
    this.jobData = null;
  }
}