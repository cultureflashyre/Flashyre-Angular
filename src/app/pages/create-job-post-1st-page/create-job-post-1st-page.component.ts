// src/app/pages/create-job-post-1st-page/create-job-post-1st-page.component.ts

import { Component, OnInit, ElementRef, ViewChild, AfterViewInit, NgZone, Renderer2, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Title, Meta } from '@angular/platform-browser';
import { FormBuilder, FormGroup, Validators } from '@angular/forms'; // Keep Validators
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, Observable, of, fromEvent } from 'rxjs'; // Keep fromEvent
import { debounceTime, distinctUntilChanged, switchMap, catchError, map, tap } from 'rxjs/operators'; // Keep operators
import { JobDescriptionService } from '../../services/job-description.service';
import { CorporateAuthService } from '../../services/corporate-auth.service';
import { JobDetails, AIJobResponse } from './types';


// Import the new SkillService and ApiSkill interface
import { SkillService, ApiSkill } from '../../services/skill.service'; // Adjust path if necessary



@Component({
  selector: 'create-job-post-1st-page',
  templateUrl: './create-job-post-1st-page.component.html',
  styleUrls: ['./create-job-post-1st-page.component.css']
})
export class CreateJobPost1stPageComponent implements OnInit, AfterViewInit {
  @ViewChild('locationInput') locationInput!: ElementRef<HTMLInputElement>;
  @ViewChild('suggestionsContainer') suggestionsContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  private readonly googleMapsApiKey: string = 'AIzaSyCYvHT8TXJdvdfr0CBRV62q5MzaD008hAE'; // Replace with your actual key or config
  private googleScriptLoaded: boolean = false;

  jobForm: FormGroup;
  // Location suggestions (remains unchanged)
  suggestions: string[] = [];
  isLoading = false; // General loading, can be reused or made specific
  showSuggestions = false; // For location
  
  selectedFile: File | null = null;
  private readonly DEBOUNCE_DELAY = 300; // For location input
  private readonly SKILL_DEBOUNCE_DELAY = 400; // For skill input (API call)

  currentStep: 'jobPost' | 'assessment' = 'jobPost';
  isSubmitting: boolean = false;
  isFileUploadCompletedSuccessfully: boolean = false;
  displayedFileName: string | null = null;

  private jobData: JobDetails | AIJobResponse | null = null;
  private isViewInitialized = false;
  private autocomplete?: google.maps.places.Autocomplete;

  // For skill autocompletion
  isLoadingSkills = false; // Specific loading indicator for skills


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
    @Inject(DOCUMENT) private document: Document,
    private skillService: SkillService // Inject SkillService
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
      skills: [[], [Validators.required]], // Storing array of skill names
      job_description: ['', [Validators.maxLength(5000)]], // Removed Validators.required for now, add back if needed
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
      const uniqueId = this.route.snapshot.paramMap.get('unique_id');
      if (uniqueId) {
        console.log('Editing existing job post with unique_id:', uniqueId);
        // TODO: Add logic to fetch and populate job data if editing
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
      script.src = `https://maps.googleapis.com/maps/api/js?key=${this.googleMapsApiKey}&libraries=places`;
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
    this.initializeSkillsInput(); // Will be refactored
    this.initializeRange('total');
    this.initializeRange('relevant');
    this.updateExperienceUI();
    this.checkEmpty('editor');

    if (this.googleScriptLoaded) {
      this.initializeGooglePlacesAutocomplete();
      this.setupLocationInputListener();
    } else {
      this.loadGoogleMapsScript().then(() => {
        this.initializeGooglePlacesAutocomplete();
        this.setupLocationInputListener();
      }).catch(err => console.error("Late script load failed in ngAfterViewInit", err));
    }
  }

  private initializeGooglePlacesAutocomplete(): void { /* ... (same as before) ... */ 
    if (typeof google !== 'undefined' && google.maps && google.maps.places && this.locationInput) {
      if (!this.autocomplete) {
        this.autocomplete = new google.maps.places.Autocomplete(
          this.locationInput.nativeElement,
          { types: ['(cities)'] } // You can refine types: e.g., '(cities)', 'geocode', 'address', 'establishment'
        );
        this.autocomplete.addListener('place_changed', () => {
          this.ngZone.run(() => { // Run inside NgZone to ensure Angular picks up changes
            const place = this.autocomplete!.getPlace();
            if (place && place.formatted_address) {
              this.jobForm.patchValue({ location: place.formatted_address });
            } else if (place && place.name) { // Fallback if formatted_address is not available
              this.jobForm.patchValue({ location: place.name });
            }
            this.suggestions = []; // Clear manual suggestions if any
            this.showSuggestions = false;
          });
        });
      }
    } else {
      // console.warn('Google Places Autocomplete not initialized. Input or Google object not ready.');
    }
  }
  private setupLocationInputListener(): void { /* ... (same as before) ... */
    if (!this.locationInput) return;
    fromEvent(this.locationInput.nativeElement, 'input').pipe(
      map(event => (event.target as HTMLInputElement).value),
      debounceTime(this.DEBOUNCE_DELAY),
      distinctUntilChanged(),
      tap(query => this.isLoading = !!query), // General loading for location
      // For Google Places Autocomplete, it handles its own suggestions.
      // If you were using a different service, you'd call it here.
      switchMap(query => {
        if (!query || (this.autocomplete && (document.querySelector('.pac-container:visible')))) {
           // If query is empty or Google suggestions are visible, don't fetch manual suggestions
          return of([]);
        }
        // Manual suggestion fetching logic (if not solely relying on Google Places) would go here
        return of([]); // Placeholder for now
      })
    ).subscribe({
      next: (manualSuggestions) => {
        // this.suggestions = manualSuggestions;
        // this.showSuggestions = manualSuggestions.length > 0;
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        console.error("Error in location input listener:", err);
        // this.snackBar.open('Error fetching location suggestions.', 'Close', { duration: 3000 });
      }
    });
  }

  onInput(event: Event): void { /* Now handled by setupLocationInputListener */ }


  selectSuggestion(location: string): void { /* ... (same as before) ... */

    this.jobForm.patchValue({ location });
    this.showSuggestions = false;
    this.suggestions = []; // Clear suggestions
  }

  private adjustExperienceRange(min: number, max: number): [number, number] { /* ... (same as before) ... */
    return (min === 0 && max === 0) ? [0, 30] : [min, max];
  }
  private experienceRangeValidator(form: FormGroup): { [key: string]: any } | null { /* ... (same as before) ... */
    const totalMin = form.get('total_experience_min')?.value;
    const totalMax = form.get('total_experience_max')?.value;
    const relevantMin = form.get('relevant_experience_min')?.value;
    const relevantMax = form.get('relevant_experience_max')?.value;
    const minBudget = form.get('min_budget')?.value;
    const maxBudget = form.get('max_budget')?.value;

    if (totalMin > totalMax && totalMax !== null) return { invalidTotalExperience: true }; // check totalMax not null
    if (relevantMin > relevantMax && relevantMax !== null) return { invalidRelevantExperience: true }; // check relevantMax not null
    if (minBudget !== null && maxBudget !== null && minBudget > maxBudget) return { invalidBudgetRange: true };
    return null;
  }


  triggerFileInput(): void { /* ... (same as before) ... */
     if (this.fileInput) this.fileInput.nativeElement.click();
  }
  onFileSelected(event: Event): void { /* ... (same as before) ... */
    this.isFileUploadCompletedSuccessfully = false; // Reset status

    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const allowedExtensions = ['.pdf', '.docx', '.txt', '.xml', '.csv', '.doc'];
      const ext = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      const maxSize = 10 * 1024 * 1024; // 10MB

      if (!allowedExtensions.includes(ext)) {
        this.snackBar.open(`Invalid file format. Supported: ${allowedExtensions.join(', ')}`, 'Close', { duration: 5000 });
        this.selectedFile = null;
        this.displayedFileName = null;
        if (this.fileInput) input.value = ''; // Clear the input
        return;
      }
      if (file.size > maxSize) {
        this.snackBar.open('File size exceeds 10MB limit.', 'Close', { duration: 5000 });
        this.selectedFile = null;
        this.displayedFileName = null;
        if (this.fileInput) input.value = ''; // Clear the input
        return;
      }
      this.selectedFile = file;
      this.displayedFileName = file.name; // Display name immediately
      this._performUpload(this.selectedFile);
    } else {
      this.selectedFile = null;
      // Don't clear displayedFileName here if you want it to persist until a new file is chosen or upload succeeds/fails
    }
  }

  private _performUpload(file: File): void { /* ... (same as before, ensure jobDescriptionService.uploadFile exists and works) ... */
    if (!file) return;
    const token = this.corporateAuthService.getJWTToken(); // Ensure this service exists and provides token

    if (!token) {
      this.snackBar.open('Authentication required. Please log in.', 'Close', { duration: 5000 });
      this.router.navigate(['/login-corporate']); // Adjust login route
      return;
    }

    this.isSubmitting = true; // Use this for general form submission too, maybe rename if confusing
    this.isFileUploadCompletedSuccessfully = false;

    this.jobDescriptionService.uploadFile(file, token).subscribe({
      next: (response) => { // Assuming response is AIJobResponse
        this.jobData = response;
        this.populateForm(response);
        this.snackBar.open('File uploaded and processed successfully.', 'Close', { duration: 3000 });
        this.isSubmitting = false;
        this.isFileUploadCompletedSuccessfully = true;
        // Do not clear fileInput.nativeElement.value here, as it's a security feature.
        // The browser clears it. If you need to re-upload the same file, the user must re-select.
      },
      error: (error) => {
        console.error('File upload error:', error);
        this.snackBar.open(`File upload or processing failed: ${error?.error?.detail || error.message || 'Unknown error'}`, 'Close', { duration: 5000 });
        this.isSubmitting = false;
        this.isFileUploadCompletedSuccessfully = false;
        // displayedFileName can be kept or cleared based on UX preference on error
        // this.displayedFileName = null;
        // this.selectedFile = null;
      }
    });
  }

  private updateExperienceUI(): void { /* ... (same as before) ... */
    this.setExperienceRange('total', this.jobForm.value.total_experience_min, this.jobForm.value.total_experience_max);
    this.setExperienceRange('relevant', this.jobForm.value.relevant_experience_min, this.jobForm.value.relevant_experience_max);

  }

  private populateForm(jobData: JobDetails | AIJobResponse): void { /* ... (same as before, ensure types are consistent) ... */
    let role: string, location: string, job_type: string, workplace_type: string;
    let total_experience_min: number, total_experience_max: number;
    let relevant_experience_min: number, relevant_experience_max: number;
    let budget_type: string, min_budget: number | null, max_budget: number | null;
    let notice_period: string, skills: string[], job_description: string;
    let unique_id_val: string = '', job_description_url_val: string = '';

    if ('job_details' in jobData) { // AIJobResponse
      const aiJobData = jobData as AIJobResponse;
      const details = aiJobData.job_details;
      const [minExp, maxExp] = this.parseExperience(details.experience?.value || '0-0 years');
      
      role = details.job_titles && details.job_titles.length > 0 ? details.job_titles[0]?.value : '';
      location = details.location || '';
      job_type = this.mapJobType(details.job_titles && details.job_titles.length > 0 ? details.job_titles[0]?.value : '');
      workplace_type = details.workplace_type || 'Remote'; // Default or map
      [total_experience_min, total_experience_max] = this.adjustExperienceRange(minExp, maxExp);
      [relevant_experience_min, relevant_experience_max] = this.adjustExperienceRange(minExp, maxExp); // Assuming relevant is same as total from AI
      budget_type = details.budget_type || 'Annually';
      min_budget = details.min_budget || null;
      max_budget = details.max_budget || null;
      notice_period = details.notice_period || '30 days'; // Default or map
      skills = [...(details.skills?.primary || []).map(s => s.skill), ...(details.skills?.secondary || []).map(s => s.skill)];
      job_description = details.job_description || '';
      unique_id_val = aiJobData.unique_id || this.jobForm.get('unique_id')?.value || ''; // Preserve existing unique_id if any
      job_description_url_val = aiJobData.file_url || '';
    } else { // JobDetails
      const details = jobData as JobDetails;
      role = details.role;
      location = details.location;
      job_type = details.job_type;
      workplace_type = details.workplace_type;
      [total_experience_min, total_experience_max] = this.adjustExperienceRange(details.total_experience_min, details.total_experience_max);
      [relevant_experience_min, relevant_experience_max] = this.adjustExperienceRange(details.relevant_experience_min, details.relevant_experience_max);
      budget_type = details.budget_type;
      min_budget = details.min_budget;
      max_budget = details.max_budget;
      notice_period = details.notice_period;
      // Handle skills structure from JobDetails (might be different from AIJobResponse)
      let primarySkills = Array.isArray(details.skills?.primary) ? details.skills.primary.map(s => s.skill) : [];
      let secondarySkills = Array.isArray(details.skills?.secondary) ? details.skills.secondary.map(s => s.skill) : [];
      skills = [...primarySkills, ...secondarySkills];

      job_description = details.job_description;
      unique_id_val = details.unique_id || this.jobForm.get('unique_id')?.value || '';
      job_description_url_val = details.job_description_url || '';
    }

    this.jobForm.patchValue({
      role, location, job_type, workplace_type,
      total_experience_min, total_experience_max,
      relevant_experience_min, relevant_experience_max,
      budget_type, min_budget, max_budget,
      notice_period, skills, // job_description will be set by setJobDescription
      job_description_url: job_description_url_val, unique_id: unique_id_val
    });

    this.populateSkills(skills); // UI update for skills
    this.setJobDescription(job_description); // UI update for job description editor
    this.updateExperienceUI(); // Update sliders
  }


  private populateSkills(skills: string[]): void { /* ... (same as before) ... */
    const tagContainer = document.getElementById('tagContainer') as HTMLDivElement;
    const tagInput = document.getElementById('tagInput') as HTMLInputElement; // Assuming tagInput is the input field itself

    if (!tagContainer || !tagInput) return;

    // Clear existing skill tags from UI first
    const existingTags = tagContainer.querySelectorAll('.tag');
    existingTags.forEach(tag => tag.remove());

    // Update the form control value
    this.jobForm.patchValue({ skills: [...skills] });

    // Add new skill tags to UI
    skills.forEach(skillText => {
      if (!skillText.trim()) return; // Skip empty skills

      const tag = document.createElement('div');
      tag.className = 'tag';

      const tagTextSpan = document.createElement('span');
      tagTextSpan.textContent = skillText;
      tag.appendChild(tagTextSpan);

      const removeBtn = document.createElement('button');
      removeBtn.textContent = '×';
      removeBtn.type = 'button'; // Important for forms
      removeBtn.addEventListener('click', () => {
        tag.remove();
        const currentSkills: string[] = this.jobForm.get('skills')?.value || [];
        this.jobForm.patchValue({ skills: currentSkills.filter(s => s !== skillText) });
        this.jobForm.get('skills')?.markAsDirty();
        this.jobForm.get('skills')?.updateValueAndValidity();
      });
      tag.appendChild(removeBtn);

      // Insert the new tag before the input field within the container
      tagContainer.insertBefore(tag, tagInput);
    });
  }


  private setJobDescription(description: string): void { /* ... (same as before) ... */
    const editor = document.getElementById('editor') as HTMLDivElement;
    if (editor) {
      editor.innerHTML = description; // Use innerHTML to render HTML content
      this.checkEmpty('editor'); // Update placeholder visibility
      // Also update the form control if this is the initial population
      if (this.jobForm.get('job_description')?.value !== description) {
          this.jobForm.patchValue({ job_description: description}, { emitEvent: false });
      }
    }
}

  updateJobDescriptionFromEditor(event: Event): void { /* ... (same as before) ... */
     const editorContent = (event.target as HTMLDivElement).innerHTML;
    this.jobForm.patchValue({ job_description: editorContent });
    this.checkEmpty('editor'); // Update placeholder based on content
  }

  private setExperienceRange(type: 'total' | 'relevant', min: number, max: number): void { /* ... (same as before) ... */
    const prefix = type === 'total' ? 'total_' : 'relevant_';
    const rangeIndicator = document.getElementById(`${prefix}rangeIndicator`) as HTMLDivElement;
    const markerLeft = document.getElementById(`${prefix}markerLeft`) as HTMLDivElement;
    const markerRight = document.getElementById(`${prefix}markerRight`) as HTMLDivElement;
    const labelLeft = document.getElementById(`${prefix}labelLeft`) as HTMLDivElement;
    const labelRight = document.getElementById(`${prefix}labelRight`) as HTMLDivElement;
    const filledSegment = document.getElementById(`${prefix}filledSegment`) as HTMLDivElement;

    if (rangeIndicator && markerLeft && markerRight && labelLeft && labelRight && filledSegment) {

      const rect = rangeIndicator.getBoundingClientRect();
      const width = rect.width > 0 ? rect.width : rangeIndicator.offsetWidth; // Ensure width is positive
      const maxYears = 30;
      const markerWidth = markerLeft.offsetWidth || 12; // Ensure markerWidth is positive
      const effectiveWidth = Math.max(1, width - markerWidth); // Ensure effectiveWidth is positive

      const clampedMin = Math.max(0, Math.min(min, maxYears));
      const clampedMax = Math.max(clampedMin, Math.min(max, maxYears)); // Max cannot be less than min

      const minPos = (clampedMin / maxYears) * effectiveWidth;
      const maxPos = (clampedMax / maxYears) * effectiveWidth;

      markerLeft.style.left = `${minPos}px`;
      markerRight.style.left = `${maxPos}px`;

      labelLeft.style.left = `${minPos + markerWidth / 2}px`;
      labelLeft.textContent = `${clampedMin}yrs`;

      labelRight.style.left = `${maxPos + markerWidth / 2}px`;
      labelRight.textContent = `${clampedMax}yrs`;

      filledSegment.style.left = `${minPos + markerWidth / 2}px`;
      filledSegment.style.width = `${Math.max(0, maxPos - minPos)}px`; // Ensure width is not negative

    }
  }

  private checkEmpty(id: string): void { /* ... (same as before) ... */
    const element = document.getElementById(id) as HTMLDivElement;
    if (!element) return;
    // Consider empty if it's empty, just <br>, or just placeholder like content
    const isEmpty = !element.textContent?.trim() && !element.querySelector('img, li, table'); // More robust empty check
    element.setAttribute('data-empty', isEmpty ? 'true' : 'false');
}

  private mapJobType(title: string): string { /* ... (same as before) ... */
    if (!title) return 'Permanent'; // Default if title is empty
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('intern')) return 'Internship';
    if (lowerTitle.includes('contract')) return 'Contract';
    if (lowerTitle.includes('part-time') || lowerTitle.includes('part time')) return 'Part-time';
    return 'Permanent';
  }

  private initializeRange(type: 'total' | 'relevant'): void { /* ... (same as before) ... */
    const prefix = type === 'total' ? 'total_' : 'relevant_';
    const rangeIndicator = document.getElementById(`${prefix}rangeIndicator`) as HTMLDivElement;
    const markerLeft = document.getElementById(`${prefix}markerLeft`) as HTMLDivElement;
    const markerRight = document.getElementById(`${prefix}markerRight`) as HTMLDivElement;
    const labelLeft = document.getElementById(`${prefix}labelLeft`) as HTMLDivElement;
    const labelRight = document.getElementById(`${prefix}labelRight`) as HTMLDivElement;
    const filledSegment = document.getElementById(`${prefix}filledSegment`) as HTMLDivElement;

    if (!rangeIndicator || !markerLeft || !markerRight || !labelLeft || !labelRight || !filledSegment) {
      console.warn(`Range indicator elements not found for type: ${type}`);
      return;
    }

    let isDragging = false;
    let currentMarker: HTMLDivElement | null = null;
    const maxYears = 30;

    const markerWidth = markerLeft.offsetWidth || 12; // Default if not rendered yet



    const updateUIFromMarkers = () => {
      const rect = rangeIndicator.getBoundingClientRect();
      if (rect.width <= 0) return; // Not visible or no width

      const effectiveWidth = rect.width - markerWidth;
      if (effectiveWidth <= 0) return; // Not enough space

      let leftPosPx = parseFloat(markerLeft.style.left) || 0;
      let rightPosPx = parseFloat(markerRight.style.left) || effectiveWidth; // Default to full width

      // Ensure positions are within bounds
      leftPosPx = Math.max(0, Math.min(leftPosPx, effectiveWidth));
      rightPosPx = Math.max(0, Math.min(rightPosPx, effectiveWidth));


      // Ensure left marker is not to the right of right marker
      if (leftPosPx > rightPosPx) {
          if (currentMarker === markerLeft) {
              leftPosPx = rightPosPx;
          } else {
              rightPosPx = leftPosPx;
          }
      }


      const minYearRaw = Math.round((leftPosPx / effectiveWidth) * maxYears);
      const maxYearRaw = Math.round((rightPosPx / effectiveWidth) * maxYears);

      // Values from markers, ensure min <= max
      const minYear = Math.min(minYearRaw, maxYearRaw);
      const maxYear = Math.max(minYearRaw, maxYearRaw);


      this.jobForm.patchValue(
        type === 'total' ?
          { total_experience_min: minYear, total_experience_max: maxYear } :
          { relevant_experience_min: minYear, relevant_experience_max: maxYear },
        { emitEvent: false } // Avoid infinite loops if change detection is triggered
      );

      // Update labels and filled segment based on form values (which are now validated min/max)
      const formMin = this.jobForm.value[type + '_experience_min'];
      const formMax = this.jobForm.value[type + '_experience_max'];

      const finalMinPos = (formMin / maxYears) * effectiveWidth;
      const finalMaxPos = (formMax / maxYears) * effectiveWidth;


      labelLeft.textContent = `${formMin}yrs`;
      labelRight.textContent = `${formMax}yrs`;
      
      // Adjust label positions to be centered on markers
      labelLeft.style.left = `${finalMinPos + markerWidth / 2}px`;
      labelRight.style.left = `${finalMaxPos + markerWidth / 2}px`;

      filledSegment.style.left = `${finalMinPos + markerWidth / 2}px`;
      filledSegment.style.width = `${Math.max(0, finalMaxPos - finalMinPos)}px`;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging || !currentMarker) return;
      e.preventDefault(); // Prevent text selection during drag

      const rect = rangeIndicator.getBoundingClientRect();
      let newLeftPx = e.clientX - rect.left - (markerWidth / 2);
      const minBoundaryPx = 0;
      const maxBoundaryPx = rect.width - markerWidth;

      if (currentMarker === markerLeft) {
        const rightMarkerPos = parseFloat(markerRight.style.left) || maxBoundaryPx;
        newLeftPx = Math.max(minBoundaryPx, Math.min(newLeftPx, rightMarkerPos));
      } else { // currentMarker === markerRight
        const leftMarkerPos = parseFloat(markerLeft.style.left) || minBoundaryPx;
        newLeftPx = Math.min(maxBoundaryPx, Math.max(newLeftPx, leftMarkerPos));
      }
      currentMarker.style.left = `${newLeftPx}px`;
      updateUIFromMarkers();
    };

    const onMouseUp = () => {
      if (isDragging) {
        updateUIFromMarkers(); // Final update
        this.jobForm.get(type === 'total' ? 'total_experience_min' : 'relevant_experience_min')?.markAsDirty();
        this.jobForm.get(type === 'total' ? 'total_experience_max' : 'relevant_experience_max')?.markAsDirty();
        this.jobForm.updateValueAndValidity(); // Trigger validation
      }
      isDragging = false;
      currentMarker = null;
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

    // Initial setup from form values
    this.setExperienceRange(type, this.jobForm.value[type + '_experience_min'], this.jobForm.value[type + '_experience_max']);
  }

  private parseExperience(exp: string): [number, number] { /* ... (same as before) ... */
    if (!exp) return [0, 0];
    const rangeMatch = exp.match(/(\d+)\s*-\s*(\d+)/);
    if (rangeMatch) return [parseInt(rangeMatch[1], 10), parseInt(rangeMatch[2], 10)];
    
    const singleMatchMore = exp.match(/(\d+)\+\s*years?/i) || exp.match(/more than\s*(\d+)\s*years?/i);
    if (singleMatchMore) {
        const val = parseInt(singleMatchMore[1], 10);
        return [val, 30]; // Assuming max is 30 for "X+ years"
    }

    const singleMatchLess = exp.match(/less than\s*(\d+)\s*years?/i) || exp.match(/up to\s*(\d+)\s*years?/i);
     if (singleMatchLess) {
        const val = parseInt(singleMatchLess[1], 10);
        return [0, val];
    }

    const singleMatch = exp.match(/(\d+)\s*years?/i);
    if (singleMatch) {
      const val = parseInt(singleMatch[1], 10);
      return [val, val];
    }
    return [0, 0]; // Default if no pattern matches
  }

  handleOutsideClick(event: FocusEvent): void { /* ... (same as before, for location) ... */
    // Use a small timeout to allow click events on suggestions to register
    setTimeout(() => {
      const relatedTarget = event.relatedTarget as HTMLElement;
      // Check if the new focus target is part of the suggestions container or Google's PAC container
      if (
        (this.suggestionsContainer && this.suggestionsContainer.nativeElement.contains(relatedTarget)) ||
        (document.querySelector('.pac-container')?.contains(relatedTarget))
      ) {
        return; // Click was inside suggestions, so don't hide
      }
      this.showSuggestions = false; // Hide manual suggestions
    }, 150);
  }

  // --- REFACTORED Skill Input Handling ---
  private initializeSkillsInput(): void {
    const tagInput = document.getElementById('tagInput') as HTMLInputElement;
    const tagContainer = document.getElementById('tagContainer') as HTMLDivElement;
    const skillsSuggestionsDiv = document.getElementById('skillsSuggestions') as HTMLDivElement;

    if (!tagInput || !tagContainer || !skillsSuggestionsDiv) {
      console.error('Skill input elements not found!');
      return;
    }

    let activeSuggestionIndex = -1;

    const showAvailableSuggestions = (suggestedSkills: string[]) => {
      skillsSuggestionsDiv.innerHTML = ''; // Clear previous suggestions
      if (this.isLoadingSkills && suggestedSkills.length === 0 && tagInput.value.trim()) {
          const item = document.createElement('div');
          item.className = 'suggestion-item suggestion-loading';
          item.textContent = 'Loading skills...';
          skillsSuggestionsDiv.appendChild(item);
          skillsSuggestionsDiv.style.display = 'block';
          return;
      }

      if (suggestedSkills.length === 0) {
        if (tagInput.value.trim()) { // Only show "no suggestions" if user has typed something
          const item = document.createElement('div');
          item.className = 'suggestion-item no-results';
          item.textContent = 'No matching skills found.';
          skillsSuggestionsDiv.appendChild(item);
          skillsSuggestionsDiv.style.display = 'block';
        } else {
          skillsSuggestionsDiv.style.display = 'none'; // Hide if input is empty and no suggestions
        }
        return;
      }

      suggestedSkills.forEach((skillName) => {
        const item = document.createElement('div');
        item.className = 'suggestion-item';
        item.textContent = skillName;
        item.addEventListener('click', () => {
          addSkillTag(skillName);
          tagInput.value = '';
          skillsSuggestionsDiv.style.display = 'none';
          tagInput.focus();
        });
        skillsSuggestionsDiv.appendChild(item);
      });
      skillsSuggestionsDiv.style.display = 'block';
      activeSuggestionIndex = -1; // Reset active suggestion
    };

    const addSkillTag = (skillName: string) => {
      if (!skillName.trim()) return;
      let currentSkills: string[] = this.jobForm.get('skills')?.value || [];
      if (currentSkills.includes(skillName)) {
        this.snackBar.open(`Skill "${skillName}" is already added.`, 'Close', { duration: 2000 });
        return; // Don't add duplicates
      }

      currentSkills = [...currentSkills, skillName];
      this.jobForm.patchValue({ skills: currentSkills });
      this.jobForm.get('skills')?.markAsDirty();
      this.jobForm.get('skills')?.updateValueAndValidity();


      const tag = document.createElement('div');
      tag.className = 'tag';
      const tagText = document.createElement('span');
      tagText.textContent = skillName;
      tag.appendChild(tagText);
      const removeBtn = document.createElement('button');
      removeBtn.textContent = '×';
      removeBtn.type = 'button';
      removeBtn.addEventListener('click', () => {
        tag.remove();
        let skillsAfterRemove: string[] = this.jobForm.get('skills')?.value || [];
        skillsAfterRemove = skillsAfterRemove.filter(s => s !== skillName);
        this.jobForm.patchValue({ skills: skillsAfterRemove });
        this.jobForm.get('skills')?.markAsDirty();
        this.jobForm.get('skills')?.updateValueAndValidity();
      });
      tag.appendChild(removeBtn);
      tagContainer.insertBefore(tag, tagInput); // Insert before the input field
    };

    const navigateAvailableSuggestions = (direction: 'up' | 'down') => {
      const items = skillsSuggestionsDiv.querySelectorAll('.suggestion-item:not(.suggestion-loading):not(.no-results)') as NodeListOf<HTMLDivElement>;
      if (items.length === 0) return;

      if (activeSuggestionIndex >= 0 && items[activeSuggestionIndex]) {
        items[activeSuggestionIndex].classList.remove('active-suggestion');
      }

      if (direction === 'down') {
        activeSuggestionIndex = (activeSuggestionIndex + 1) % items.length;
      } else {
        activeSuggestionIndex = (activeSuggestionIndex - 1 + items.length) % items.length;
      }
      
      if (items[activeSuggestionIndex]) {
        items[activeSuggestionIndex].classList.add('active-suggestion');
        items[activeSuggestionIndex].scrollIntoView({ block: 'nearest', inline: 'nearest' });
      }
    };

    // Listen to input events using RxJS
    fromEvent(tagInput, 'input').pipe(
      map(event => (event.target as HTMLInputElement).value),
      debounceTime(this.SKILL_DEBOUNCE_DELAY),
      distinctUntilChanged(),
      tap(term => {
        this.isLoadingSkills = !!term.trim(); // Show loading if term exists
        if (!term.trim()) { // If term is empty, clear suggestions immediately
            showAvailableSuggestions([]);
        }
      }),
      switchMap(term => {
        if (!term.trim()) {
          return of([]); // No API call for empty search
        }
        return this.skillService.searchSkills(term).pipe(
          map((apiSkills: ApiSkill[]) => apiSkills.map(s => s.name)), // Extract just names
          catchError(() => {
            this.isLoadingSkills = false;
            this.snackBar.open('Error fetching skills.', 'Close', { duration: 3000 });
            return of([]); // Return empty on error
          })
        );
      })
    ).subscribe(skillNames => {
      this.isLoadingSkills = false;
      const currentSelectedSkills: string[] = this.jobForm.get('skills')?.value || [];
      const filteredForDisplay = skillNames.filter(name => !currentSelectedSkills.includes(name));
      showAvailableSuggestions(filteredForDisplay.slice(0, 10)); // Limit to 10 suggestions
    });

    tagInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const activeItem = skillsSuggestionsDiv.querySelector('.suggestion-item.active-suggestion') as HTMLDivElement;
        if (activeItem && activeItem.textContent) {
          addSkillTag(activeItem.textContent);
        } else if (tagInput.value.trim()) {
          // Allow adding custom typed skill if no suggestion selected and input is not empty
          addSkillTag(tagInput.value.trim());
        }
        tagInput.value = '';
        skillsSuggestionsDiv.style.display = 'none';
        activeSuggestionIndex = -1;
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        navigateAvailableSuggestions('down');
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        navigateAvailableSuggestions('up');
      } else if (e.key === 'Backspace' && !tagInput.value) {
        const currentSkills: string[] = this.jobForm.get('skills')?.value || [];
        if (currentSkills.length > 0) {
          // Remove the last tag from UI and form
          const tagsInDOM = tagContainer.querySelectorAll('.tag');
          if (tagsInDOM.length > 0) {
            tagsInDOM[tagsInDOM.length - 1].remove();
          }
          currentSkills.pop();
          this.jobForm.patchValue({ skills: currentSkills });
          this.jobForm.get('skills')?.markAsDirty();
          this.jobForm.get('skills')?.updateValueAndValidity();
        }
      } else if (e.key === 'Escape') {
        skillsSuggestionsDiv.style.display = 'none';
        activeSuggestionIndex = -1;
      }
    });

    // Hide suggestions when clicking outside
    document.addEventListener('click', (e) => {
      const target = e.target as Node;
      if (!tagContainer.contains(target) && !skillsSuggestionsDiv.contains(target)) {
        skillsSuggestionsDiv.style.display = 'none';
      }
    });
    
    // Focus input when clicking on the container (but not on a tag or button)
    tagContainer.addEventListener('click', (e) => {
      if (e.target === tagContainer) {
        tagInput.focus();
      }
    });

    // Populate existing skills if any (e.g., when form is pre-filled)
    this.populateSkills(this.jobForm.get('skills')?.value || []);
  }


  onSubmit(): void {
    if (this.jobForm.invalid) {
      this.jobForm.markAllAsTouched(); // Mark all fields as touched to show errors
      this.snackBar.open('Please fill all required fields correctly.', 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar'] // Optional: for custom styling
      });
      // Find first invalid control and scroll to it
      const firstInvalidControl = Object.keys(this.jobForm.controls).find(key => {
          const control = this.jobForm.controls[key];
          return control.invalid;
      });

      if (firstInvalidControl) {
          const element = this.document.querySelector(`[formControlName="${firstInvalidControl}"]`);
          element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    const token = this.corporateAuthService.getJWTToken();
    if (!token) {
      this.snackBar.open('Authentication required. Please log in.', 'Close', { duration: 5000 });
      this.router.navigate(['/login-corporate']);
      return;
    }

    this.isSubmitting = true; // General submitting flag for buttons

    if (this.currentStep === 'jobPost') {
      const formValues = this.jobForm.getRawValue(); // Use getRawValue if some fields might be disabled
      const jobDetails: JobDetails = {
        ...formValues, // Spread all form values
        // Structure skills as expected by backend if different from just string[]
        // For now, assuming backend can take string[] for skills on save
        // and converts to primary/secondary internally or your `jobDescriptionService.saveJobPost` handles it.
        // If your backend expects the Skill structure {primary: [], secondary: []}, adapt here:
        skills: { // Example adaptation if backend needs this structure
             primary: (formValues.skills || []).slice(0, Math.ceil((formValues.skills || []).length / 2)).map((s: string) => ({ skill: s, skill_confidence: 0.9, type_confidence: 0.9 })),
             secondary: (formValues.skills || []).slice(Math.ceil((formValues.skills || []).length / 2)).map((s: string) => ({ skill: s, skill_confidence: 0.8, type_confidence: 0.8 }))
        },
        status: 'draft' // Or determine status based on action
      };

      // console.log('Submitting job details:', jobDetails);

      this.jobDescriptionService.saveJobPost(jobDetails, token).subscribe({
        next: (response) => { // Assuming response contains unique_id
          this.isSubmitting = false;
          this.snackBar.open('Job post saved. Proceeding to assessment.', 'Close', { duration: 3000 });
          this.jobForm.patchValue({ unique_id: response.unique_id }); // Store unique_id from response
          this.currentStep = 'assessment';
        },
        error: (error) => {
          this.isSubmitting = false;
          console.error('Job post saving failed:', error);
          this.snackBar.open(`Job post saving failed: ${error?.error?.detail || error.message || 'Unknown error'}`, 'Close', { duration: 5000 });
        }
      });
    } else if (this.currentStep === 'assessment') {
      // Simulate assessment submission
      // TODO: Implement actual assessment submission logic
      // console.log('Submitting assessment for job unique_id:', this.jobForm.get('unique_id')?.value);
      setTimeout(() => {
        this.isSubmitting = false;
        this.snackBar.open('Assessment details submitted!', 'Close', { duration: 3000 });
        this.resetForm();
        this.router.navigate(['/job-posted']); // Navigate to a confirmation or list page
      }, 1500);
    }
  }

  onCancel(): void { /* ... (same as before) ... */
    if (this.currentStep === 'assessment') {
      this.snackBar.open('Returning to job post editing.', 'Close', { duration: 2000 });
      this.currentStep = 'jobPost';
    } else {
      this.snackBar.open('Job post creation cancelled.', 'Close', { duration: 3000 });
      this.resetForm();
      this.router.navigate(['/dashboard']); // Or appropriate route
    }
  }

  resetForm(): void { /* ... (same as before) ... */
    this.jobForm.reset({
      role: '', location: '', job_type: '', workplace_type: '',
      total_experience_min: 0, total_experience_max: 30,
      relevant_experience_min: 0, relevant_experience_max: 30,
      budget_type: '', min_budget: null, max_budget: null,
      notice_period: '', skills: [], job_description: '',
      job_description_url: '', unique_id: ''
    });
    this.selectedFile = null;
    if (this.fileInput && this.fileInput.nativeElement) {
         this.fileInput.nativeElement.value = ''; // Clear file input
    }
    this.displayedFileName = null;
    this.isFileUploadCompletedSuccessfully = false;
    
    this.populateSkills([]); // Clear UI for skills
    this.setJobDescription(''); // Clear UI for job description
    this.updateExperienceUI(); // Reset sliders

    this.currentStep = 'jobPost';
    this.jobData = null;
    this.isSubmitting = false;
    this.isLoadingSkills = false;
  }
}