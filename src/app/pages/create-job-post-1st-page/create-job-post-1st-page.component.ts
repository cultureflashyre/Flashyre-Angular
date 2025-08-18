// src/app/pages/create-job-post-1st-page/create-job-post-1st-page.component.ts

import { Component, OnInit, ElementRef, ViewChild, AfterViewInit, NgZone, Renderer2, Inject, OnDestroy } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Title, Meta } from '@angular/platform-browser';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, Observable, of, fromEvent, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError, map, tap } from 'rxjs/operators';
import { NgxSpinnerService } from 'ngx-spinner';

import { JobDescriptionService } from '../../services/job-description.service';
import { CorporateAuthService } from '../../services/corporate-auth.service';
import { SkillService, ApiSkill } from '../../services/skill.service';
import { JobCreationWorkflowService } from '../../services/job-creation-workflow.service';


import { JobDetails, AIJobResponse } from './types';
import { Loader } from '@googlemaps/js-api-loader';

@Component({
  selector: 'create-job-post-1st-page',
  templateUrl: './create-job-post-1st-page.component.html',
  styleUrls: ['./create-job-post-1st-page.component.css']
})
export class CreateJobPost1stPageComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('locationInput') locationInput!: ElementRef<HTMLInputElement>;

  private readonly googleMapsApiKey: string = 'AIzaSyCYvHT8TXJdvdfr0CBRV62q5MzaD008hAE'; // Replace with your actual key
  
  private loader: Loader;
  private placesService: google.maps.places.AutocompleteService | undefined;
  private sessionToken: google.maps.places.AutocompleteSessionToken | undefined;
  private google: any; // To hold the loaded google object reference

  jobForm: FormGroup;
  
  locationSuggestions: google.maps.places.AutocompletePrediction[] = [];
  showLocationSuggestions = false;
  isLoadingLocations = false;
  private locationInput$ = new Subject<string>();

  selectedFile: File | null = null;
  private readonly SKILL_DEBOUNCE_DELAY = 400;

  currentStep: 'jobPost' | 'assessment' = 'jobPost';
  isSubmitting: boolean = false;
  isFileUploadCompletedSuccessfully: boolean = false;
  displayedFileName: string | null = null;

  private jobData: JobDetails | Omit<AIJobResponse, 'mcqs'> | null = null;
  private isViewInitialized = false;

  isLoadingSkills = false;
  private subscriptions = new Subscription();

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
    private skillService: SkillService,
    private workflowService: JobCreationWorkflowService, // <-- INJECT THE NEW SERVICE
    private spinner: NgxSpinnerService // MODIFICATION: Inject the spinner service
  ) {
    this.jobForm = this.fb.group({
      role: ['', [Validators.required, Validators.maxLength(100)]],
      location: [[], [Validators.required]], // Form stores as array for UI
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
      job_description: ['', [Validators.maxLength(5000), Validators.required]],
      job_description_url: ['', [Validators.maxLength(200)]],
      unique_id: ['']
    }, { validators: this.experienceRangeValidator });

    this.loader = new Loader({
      apiKey: this.googleMapsApiKey,
      version: 'weekly',
      libraries: ['places']
    });
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

    this.subscriptions.add(
      this.locationInput$.pipe(
        debounceTime(300),
        distinctUntilChanged(),
        tap(() => {
          this.isLoadingLocations = true;
          this.showLocationSuggestions = true;
          if (this.google && !this.sessionToken) {
            this.sessionToken = new this.google.maps.places.AutocompleteSessionToken();
          }
        }),
        switchMap(term => this.getPlacePredictions(term))
      ).subscribe(suggestions => {
        this.isLoadingLocations = false;
        this.locationSuggestions = suggestions;
      })
    );

    if (!this.corporateAuthService.isLoggedIn()) {
      this.snackBar.open('Please log in to create a job post.', 'Close', { duration: 5000 });
      this.router.navigate(['/login-corporate']);
      return;
    }
    
  // Check if there's an active workflow ID. This handles the "Previous" button case.
      const workflowId = this.workflowService.getCurrentJobId();
      if (workflowId) {
        console.log('Resuming existing job post with unique_id:', workflowId);
        this.loadJobPostForEditing(workflowId);
      } else {
          // This is a fresh start, so we clear the form to be safe.
          this.resetForm();
      }
  }

  ngAfterViewInit(): void {
    this.isViewInitialized = true;
    this.initializeSkillsInput();
    this.initializeRange('total');
    this.initializeRange('relevant');
    this.checkEmpty('editor');

    if (this.jobData) {
      this.populateForm(this.jobData);
    } else {
      this.updateExperienceUI();
    }
      this.initializeGooglePlaces();

  }

  private loadJobPostForEditing(uniqueId: string): void {
    const token = this.corporateAuthService.getJWTToken();
    if (!token) {
        this.snackBar.open('Authentication error. Please log in.', 'Close', { duration: 4000 });
        this.router.navigate(['/login-corporate']);
        return;
    }

    this.isSubmitting = true; // Use this as a loading indicator for the page
    this.subscriptions.add(
        this.jobDescriptionService.getJobPost(uniqueId, token).subscribe({
            next: (jobDetails) => {
                this.jobData = jobDetails;
                // If the view is already initialized, populate form immediately.
                // Otherwise, it will be populated in ngAfterViewInit.
                if (this.isViewInitialized) {
                    this.populateForm(jobDetails);
                }
                this.isSubmitting = false;
            },
            error: (err) => {
                this.isSubmitting = false;
                this.snackBar.open(`Failed to load existing job data: ${err.message}`, 'Close', { duration: 5000 });
                this.router.navigate(['/dashboard']);
            }
        })
    );
  }

  private async initializeGooglePlaces(): Promise<void> {
    try {
      this.google = await this.loader.load();
      this.placesService = new this.google.maps.places.AutocompleteService();
    } catch (error) {
      console.error('Fatal error: Google Maps script could not be loaded.', error);
      this.snackBar.open('Could not load location services. Please check your connection and try again.', 'Close', { duration: 7000 });
    }
  }

  onLocationInput(event: Event): void {
    const term = (event.target as HTMLInputElement).value;
    if (!term.trim()) {
      this.showLocationSuggestions = false;
      return;
    }
    this.locationInput$.next(term);
  }

  private getPlacePredictions(term: string): Observable<google.maps.places.AutocompletePrediction[]> {
    if (!this.placesService || !this.sessionToken) {
      return of([]);
    }
    return new Observable(observer => {
      this.placesService.getPlacePredictions(
        {
          input: term,
          types: ['(cities)'], // You can restrict to cities, regions, etc.
          sessionToken: this.sessionToken 
        },
        (predictions: google.maps.places.AutocompletePrediction[] | null, status: google.maps.places.PlacesServiceStatus) => {
          this.ngZone.run(() => {
            if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
              observer.next(predictions);
            } else {
              observer.next([]);
            }
            observer.complete();
          });
        }
      );
    });
  }

  selectLocationSuggestion(suggestion: google.maps.places.AutocompletePrediction): void {
    const currentLocations: string[] = this.jobForm.get('location')?.value || [];
    if (!currentLocations.includes(suggestion.description)) {
      this.jobForm.patchValue({
        location: [...currentLocations, suggestion.description]
      });
      this.jobForm.get('location')?.markAsDirty();
    }
    this.locationInput.nativeElement.value = '';
    this.showLocationSuggestions = false;
    this.sessionToken = undefined; // Invalidate session token after selection
  }
  
  removeLocation(index: number): void {
    const currentLocations: string[] = this.jobForm.get('location')?.value || [];
    if (index >= 0 && index < currentLocations.length) {
        currentLocations.splice(index, 1);
        this.jobForm.patchValue({ location: currentLocations });
        this.jobForm.get('location')?.markAsDirty();
    }
  }
  
  onLocationInputKeydown(event: KeyboardEvent): void {
     if (event.key === 'Backspace' && this.locationInput.nativeElement.value === '') {
       const locations = this.jobForm.get('location')?.value;
       if (locations && locations.length > 0) {
           this.removeLocation(locations.length - 1);
       }
     }
  }
  
  experienceRangeValidator(form: FormGroup): { [key: string]: any } | null {
    const totalMin = form.get('total_experience_min')?.value;
    const totalMax = form.get('total_experience_max')?.value;
    const relevantMin = form.get('relevant_experience_min')?.value;
    const relevantMax = form.get('relevant_experience_max')?.value;
    const minBudget = form.get('min_budget')?.value;
    const maxBudget = form.get('max_budget')?.value;
    let errors: { [key: string]: any } = {};
    if (totalMin !== null && totalMax !== null && totalMin > totalMax) errors['invalidTotalExperience'] = true;
    if (relevantMin !== null && relevantMax !== null && relevantMin > relevantMax) errors['invalidRelevantExperience'] = true;
    if (minBudget !== null && maxBudget !== null && minBudget > maxBudget) errors['invalidBudgetRange'] = true;
    return Object.keys(errors).length ? errors : null;
  }

  triggerFileInput(): void {
     if (this.fileInput) this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    this.isFileUploadCompletedSuccessfully = false;
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const allowedExtensions = ['.pdf', '.docx', '.txt', '.xml', '.csv', '.doc'];
      const ext = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      const maxSize = 10 * 1024 * 1024; // 10MB

      if (!allowedExtensions.includes(ext)) {
        this.snackBar.open(`Invalid file format. Supported: ${allowedExtensions.join(', ')}`, 'Close', { duration: 5000 });
        this.clearFileInput(input); return;
      }
      if (file.size > maxSize) {
        this.snackBar.open('File size exceeds 10MB limit.', 'Close', { duration: 5000 });
        this.clearFileInput(input); return;
      }
      this.selectedFile = file;
      this.displayedFileName = file.name;
      this._performUpload(this.selectedFile);
    } else {
      this.selectedFile = null;
    }
  }

  private clearFileInput(inputElement?: HTMLInputElement): void {
    this.selectedFile = null;
    this.displayedFileName = null;
    if (inputElement) {
        inputElement.value = '';
    } else if (this.fileInput && this.fileInput.nativeElement) {
        this.fileInput.nativeElement.value = '';
    }
  }

  private _performUpload(file: File): void {
    if (!file) return;
    const token = this.corporateAuthService.getJWTToken();
    if (!token) {
      this.snackBar.open('Authentication required. Please log in.', 'Close', { duration: 5000 });
      this.router.navigate(['/login-corporate']);
      return;
    }
    this.isSubmitting = true;
    this.isFileUploadCompletedSuccessfully = false;
    const uploadSub = this.jobDescriptionService.uploadFile(file, token).subscribe({
      next: (response) => {
        this.jobData = response; // Store AI response
        this.populateForm(response);
        this.snackBar.open('File uploaded and processed successfully.', 'Close', { duration: 3000 });
        this.isSubmitting = false;
        this.spinner.hide('main-spinner');
        this.isFileUploadCompletedSuccessfully = true;
      },
      error: (error) => {
        console.error('File upload error:', error);
        this.snackBar.open(`File upload or processing failed: ${error?.message || 'Unknown error'}`, 'Close', { duration: 5000 });
        this.isSubmitting = false;
        this.isFileUploadCompletedSuccessfully = false;
      }
    });
    this.subscriptions.add(uploadSub);
  }

  private updateExperienceUI(): void {
    this.setExperienceRange('total', this.jobForm.value.total_experience_min, this.jobForm.value.total_experience_max);
    this.setExperienceRange('relevant', this.jobForm.value.relevant_experience_min, this.jobForm.value.relevant_experience_max);
  }

  private adjustExperienceRange(min: number, max: number): [number, number] {
    return (min === 0 && max === 0) ? [0, 30] : [min, max];
  }

  private populateForm(jobData: JobDetails | Omit<AIJobResponse, 'mcqs'>): void {
    let role: string, locationArray: string[], job_type: string, workplace_type: string;
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
      
      // MODIFIED: Parse location string (potentially comma-separated) from AI into an array for the form
      const aiLocationString = details.location || '';
      locationArray = (typeof aiLocationString === 'string' && aiLocationString.trim() !== '')
                      ? aiLocationString.split(',').map(s => s.trim()).filter(s => s)
                      : [];

      job_type = this.mapJobType(details.job_titles && details.job_titles.length > 0 ? details.job_titles[0]?.value : '');
      workplace_type = details.workplace_type || 'Remote';
      [total_experience_min, total_experience_max] = this.adjustExperienceRange(minExp, maxExp);
      [relevant_experience_min, relevant_experience_max] = this.adjustExperienceRange(minExp, maxExp);
      budget_type = details.budget_type || 'Annually';
      min_budget = details.min_budget || null;
      max_budget = details.max_budget || null;
      notice_period = details.notice_period || '30 days';
      skills = [...(details.skills?.primary || []).map(s => s.skill), ...(details.skills?.secondary || []).map(s => s.skill)];
      job_description = details.job_description || '';
      unique_id_val = aiJobData.unique_id || this.jobForm.get('unique_id')?.value || '';
      job_description_url_val = aiJobData.file_url || '';
    } else { // JobDetails (from existing saved data)
      const details = jobData as JobDetails;
      role = details.role;

      // MODIFIED: Parse location string (comma-separated from DB) into an array for the form
      const dbLocationString = details.location || '';
      locationArray = (typeof dbLocationString === 'string' && dbLocationString.trim() !== '')
                      ? dbLocationString.split(',').map(s => s.trim()).filter(s => s)
                      : [];

      job_type = details.job_type;
      workplace_type = details.workplace_type;
      [total_experience_min, total_experience_max] = this.adjustExperienceRange(details.total_experience_min, details.total_experience_max);
      [relevant_experience_min, relevant_experience_max] = this.adjustExperienceRange(details.relevant_experience_min, details.relevant_experience_max);
      budget_type = details.budget_type;
      min_budget = details.min_budget;
      max_budget = details.max_budget;
      notice_period = details.notice_period;
      let primarySkills = Array.isArray(details.skills?.primary) ? details.skills.primary.map(s => s.skill) : [];
      let secondarySkills = Array.isArray(details.skills?.secondary) ? details.skills.secondary.map(s => s.skill) : [];
      skills = [...primarySkills, ...secondarySkills];
      job_description = details.job_description;
      unique_id_val = details.unique_id || this.jobForm.get('unique_id')?.value || '';
      job_description_url_val = details.job_description_url || '';
    }
    
    this.jobForm.patchValue({
      role, 
      location: locationArray, // Use the parsed array for the form control
      job_type, 
      workplace_type,
      total_experience_min, total_experience_max,
      relevant_experience_min, relevant_experience_max,
      budget_type, min_budget, max_budget,
      notice_period, skills, job_description,
      job_description_url: job_description_url_val, 
      unique_id: unique_id_val
    });
    
    if (this.isViewInitialized) {
        this.populateSkills(skills);
        this.setJobDescription(job_description);
        this.updateExperienceUI();
    }
  }

  private populateSkills(skills: string[]): void {
    const tagContainer = this.document.getElementById('tagContainer') as HTMLDivElement;
    const tagInput = this.document.getElementById('tagInput') as HTMLInputElement;
    if (!tagContainer || !tagInput) {
      if(this.isViewInitialized) console.warn('Skill container or input not found during populateSkills.');
      return;
    }
    const existingTags = tagContainer.querySelectorAll('.tag');
    existingTags.forEach(tag => tag.remove());
    skills.forEach(skillText => {
      if (!skillText.trim()) return;
      const tag = this.renderer.createElement('div'); this.renderer.addClass(tag, 'tag');
      const tagTextSpan = this.renderer.createElement('span'); tagTextSpan.textContent = skillText;
      this.renderer.appendChild(tag, tagTextSpan);
      const removeBtn = this.renderer.createElement('button'); removeBtn.textContent = '×';
      this.renderer.setAttribute(removeBtn, 'type', 'button');
      this.renderer.listen(removeBtn, 'click', () => {
        this.renderer.removeChild(tagContainer, tag);
        const currentSkills: string[] = this.jobForm.get('skills')?.value || [];
        this.jobForm.patchValue({ skills: currentSkills.filter(s => s !== skillText) });
        this.jobForm.get('skills')?.markAsDirty(); this.jobForm.get('skills')?.updateValueAndValidity();
      });
      this.renderer.appendChild(tag, removeBtn);
      this.renderer.insertBefore(tagContainer, tag, tagInput);
    });
  }

  private setJobDescription(description: string): void {
    const editor = this.document.getElementById('editor') as HTMLDivElement;
    if (editor) {
      editor.innerHTML = description;
      this.checkEmpty('editor');
    } else if (this.isViewInitialized) {
        console.warn('Job description editor element not found.');
    }
  }

  updateJobDescriptionFromEditor(event: Event): void {
    const editorContent = (event.target as HTMLDivElement).innerHTML;
    if (this.jobForm.get('job_description')?.value !== editorContent) {
      this.jobForm.patchValue({ job_description: editorContent });
    }
    this.checkEmpty('editor');
  }

  private setExperienceRange(type: 'total' | 'relevant', min: number, max: number): void {
    const prefix = type === 'total' ? 'total_' : 'relevant_';
    const rangeIndicator = this.document.getElementById(`${prefix}rangeIndicator`) as HTMLDivElement;
    const markerLeft = this.document.getElementById(`${prefix}markerLeft`) as HTMLDivElement;
    const markerRight = this.document.getElementById(`${prefix}markerRight`) as HTMLDivElement;
    const labelLeft = this.document.getElementById(`${prefix}labelLeft`) as HTMLDivElement;
    const labelRight = this.document.getElementById(`${prefix}labelRight`) as HTMLDivElement;
    const filledSegment = this.document.getElementById(`${prefix}filledSegment`) as HTMLDivElement;

    if (!rangeIndicator || !markerLeft || !markerRight || !labelLeft || !labelRight || !filledSegment) {
        if(this.isViewInitialized) console.warn(`Experience range UI elements not found for type: ${type}`);
        return;
    }
    const rect = rangeIndicator.getBoundingClientRect();
    const width = rect.width > 0 ? rect.width : rangeIndicator.offsetWidth;
    const maxYears = 30; const markerWidth = markerLeft.offsetWidth || 12;
    const effectiveWidth = Math.max(1, width - markerWidth);
    const clampedMin = Math.max(0, Math.min(min, maxYears));
    const clampedMax = Math.max(clampedMin, Math.min(max, maxYears));
    const minPos = (clampedMin / maxYears) * effectiveWidth;
    const maxPos = (clampedMax / maxYears) * effectiveWidth;
    markerLeft.style.left = `${minPos}px`; markerRight.style.left = `${maxPos}px`;
    labelLeft.style.left = `${minPos + markerWidth / 2}px`; labelLeft.textContent = `${clampedMin}yrs`;
    labelRight.style.left = `${maxPos + markerWidth / 2}px`; labelRight.textContent = `${clampedMax}yrs`;
    filledSegment.style.left = `${minPos + markerWidth / 2}px`;
    filledSegment.style.width = `${Math.max(0, maxPos - minPos)}px`;
  }

  public checkEmpty(id: string): void {
    const element = this.document.getElementById(id) as HTMLDivElement;
    if (!element) return;
    const isEmpty = !element.textContent?.trim() && !element.querySelector('img, li, table');
    element.setAttribute('data-empty', isEmpty ? 'true' : 'false');

    if (id === 'editor' && this.jobForm.get('job_description')?.touched) {
        if (isEmpty) {
            this.jobForm.get('job_description')?.setErrors({ 'required': true });
        } else {
            const currentErrors = this.jobForm.get('job_description')?.errors;
            if (currentErrors && currentErrors['required']) {
                delete currentErrors['required'];
                if (Object.keys(currentErrors).length === 0) {
                    this.jobForm.get('job_description')?.setErrors(null);
                } else {
                    this.jobForm.get('job_description')?.setErrors(currentErrors);
                }
            }
        }
    }
  }

  private mapJobType(title: string): string {
    if (!title) return 'Permanent'; const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('intern')) return 'Internship';
    if (lowerTitle.includes('contract')) return 'Contract';
    if (lowerTitle.includes('part-time') || lowerTitle.includes('part time')) return 'Part-time';
    return 'Permanent';
  }

  private initializeRange(type: 'total' | 'relevant'): void {
    const prefix = type === 'total' ? 'total_' : 'relevant_';
    const rangeIndicator = this.document.getElementById(`${prefix}rangeIndicator`) as HTMLDivElement;
    const markerLeft = this.document.getElementById(`${prefix}markerLeft`) as HTMLDivElement;
    const markerRight = this.document.getElementById(`${prefix}markerRight`) as HTMLDivElement;
    if (!rangeIndicator || !markerLeft || !markerRight) {
      if(this.isViewInitialized) console.warn(`Range indicator elements not found for type: ${type}`);
      return;
    }
    let isDragging = false; let currentMarker: HTMLDivElement | null = null;
    const maxYears = 30; const markerWidth = markerLeft.offsetWidth || 12;

    const updateUIFromMarkers = () => {
      const rect = rangeIndicator.getBoundingClientRect(); if (rect.width <= 0) return;
      const effectiveWidth = rect.width - markerWidth; if (effectiveWidth <= 0) return;
      let leftPosPx = parseFloat(markerLeft.style.left) || 0;
      let rightPosPx = parseFloat(markerRight.style.left) || effectiveWidth;
      leftPosPx = Math.max(0, Math.min(leftPosPx, effectiveWidth));
      rightPosPx = Math.max(0, Math.min(rightPosPx, effectiveWidth));
      if (leftPosPx > rightPosPx) { if (currentMarker === markerLeft) leftPosPx = rightPosPx; else rightPosPx = leftPosPx; }
      const minYearRaw = Math.round((leftPosPx / effectiveWidth) * maxYears);
      const maxYearRaw = Math.round((rightPosPx / effectiveWidth) * maxYears);
      const minYear = Math.min(minYearRaw, maxYearRaw); const maxYear = Math.max(minYearRaw, maxYearRaw);
      this.jobForm.patchValue( type === 'total' ?
          { total_experience_min: minYear, total_experience_max: maxYear } :
          { relevant_experience_min: minYear, relevant_experience_max: maxYear },
        { emitEvent: false }
      );
      this.setExperienceRange(type, this.jobForm.value[`${type}_experience_min`], this.jobForm.value[`${type}_experience_max`]);
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging || !currentMarker) return; e.preventDefault();
      const rect = rangeIndicator.getBoundingClientRect(); let newLeftPx = e.clientX - rect.left - (markerWidth / 2);
      const minBoundaryPx = 0; const maxBoundaryPx = rect.width - markerWidth;
      if (currentMarker === markerLeft) {
        const rightMarkerPos = parseFloat(markerRight.style.left) || maxBoundaryPx;
        newLeftPx = Math.max(minBoundaryPx, Math.min(newLeftPx, rightMarkerPos));
      } else {
        const leftMarkerPos = parseFloat(markerLeft.style.left) || minBoundaryPx;
        newLeftPx = Math.min(maxBoundaryPx, Math.max(newLeftPx, leftMarkerPos));
      }
      currentMarker.style.left = `${newLeftPx}px`; updateUIFromMarkers();
    };
    const onMouseUp = () => {
      if (isDragging) {
        updateUIFromMarkers();
        this.jobForm.get(type === 'total' ? 'total_experience_min' : 'relevant_experience_min')?.markAsDirty();
        this.jobForm.get(type === 'total' ? 'total_experience_max' : 'relevant_experience_max')?.markAsDirty();
        this.jobForm.updateValueAndValidity();
      }
      isDragging = false; currentMarker = null;
      this.document.removeEventListener('mousemove', onMouseMove);
      this.document.removeEventListener('mouseup', onMouseUp);
    };
    const onMouseDown = (e: MouseEvent, marker: HTMLDivElement) => {
      e.preventDefault(); isDragging = true; currentMarker = marker;
      this.document.addEventListener('mousemove', onMouseMove);
      this.document.addEventListener('mouseup', onMouseUp);
    };
    markerLeft.addEventListener('mousedown', (e) => onMouseDown(e, markerLeft as HTMLDivElement));
    markerRight.addEventListener('mousedown', (e) => onMouseDown(e, markerRight as HTMLDivElement));
    this.setExperienceRange(type, this.jobForm.value[`${type}_experience_min`], this.jobForm.value[`${type}_experience_max`]);
  }

  private parseExperience(exp: string): [number, number] {
    if (!exp) return [0, 0]; const rangeMatch = exp.match(/(\d+)\s*-\s*(\d+)/);
    if (rangeMatch) return [parseInt(rangeMatch[1], 10), parseInt(rangeMatch[2], 10)];
    const singleMatchMore = exp.match(/(\d+)\+\s*years?/i) || exp.match(/more than\s*(\d+)\s*years?/i);
    if (singleMatchMore) { const val = parseInt(singleMatchMore[1], 10); return [val, 30]; } // Assuming max 30 for '+'
    const singleMatchLess = exp.match(/less than\s*(\d+)\s*years?/i) || exp.match(/up to\s*(\d+)\s*years?/i);
    if (singleMatchLess) { const val = parseInt(singleMatchLess[1], 10); return [0, val]; }
    const singleMatch = exp.match(/(\d+)\s*years?/i);
    if (singleMatch) { const val = parseInt(singleMatch[1], 10); return [val, val]; }
    return [0, 0];
  }

  private initializeSkillsInput(): void {
    const tagInput = this.document.getElementById('tagInput') as HTMLInputElement;
    const tagContainer = this.document.getElementById('tagContainer') as HTMLDivElement;
    const skillsSuggestionsDiv = this.document.getElementById('skillsSuggestions') as HTMLDivElement;
    if (!tagInput || !tagContainer || !skillsSuggestionsDiv) {
      if(this.isViewInitialized) console.warn('Skill input elements not found!'); return;
    }
    let activeSuggestionIndex = -1;
    const showAvailableSuggestions = (suggestedSkills: string[]) => {
      skillsSuggestionsDiv.innerHTML = '';
      if (this.isLoadingSkills && suggestedSkills.length === 0 && tagInput.value.trim()) {
          const item = this.renderer.createElement('div'); this.renderer.addClass(item, 'suggestion-item');
          this.renderer.addClass(item, 'suggestion-loading'); item.textContent = 'Loading skills...';
          this.renderer.appendChild(skillsSuggestionsDiv, item); skillsSuggestionsDiv.style.display = 'block'; return;
      }
      if (suggestedSkills.length === 0) {
        if (tagInput.value.trim()) {
          const item = this.renderer.createElement('div'); this.renderer.addClass(item, 'no-results'); item.textContent = 'No matching skills found.';
          this.renderer.appendChild(skillsSuggestionsDiv, item); skillsSuggestionsDiv.style.display = 'block';
        } else { skillsSuggestionsDiv.style.display = 'none'; } return;
      }
      suggestedSkills.forEach((skillName) => {
        const item = this.renderer.createElement('div'); this.renderer.addClass(item, 'suggestion-item');
        item.textContent = skillName;
        this.renderer.listen(item, 'click', () => {
          addSkillTag(skillName); tagInput.value = '';
          skillsSuggestionsDiv.style.display = 'none'; tagInput.focus();
        });
        this.renderer.appendChild(skillsSuggestionsDiv, item);
      });
      skillsSuggestionsDiv.style.display = 'block'; activeSuggestionIndex = -1;
    };
    const addSkillTag = (skillName: string) => {
      if (!skillName.trim()) return; let currentSkills: string[] = this.jobForm.get('skills')?.value || [];
      if (currentSkills.includes(skillName)) {
        this.snackBar.open(`Skill "${skillName}" is already added.`, 'Close', { duration: 2000 }); return;
      }
      currentSkills = [...currentSkills, skillName]; this.jobForm.patchValue({ skills: currentSkills });
      this.jobForm.get('skills')?.markAsDirty(); this.jobForm.get('skills')?.updateValueAndValidity();
      const tag = this.renderer.createElement('div'); this.renderer.addClass(tag, 'tag');
      const tagText = this.renderer.createElement('span'); tagText.textContent = skillName;
      this.renderer.appendChild(tag, tagText);
      const removeBtn = this.renderer.createElement('button'); removeBtn.textContent = '×';
      this.renderer.setAttribute(removeBtn, 'type', 'button');
      this.renderer.listen(removeBtn, 'click', () => {
        this.renderer.removeChild(tagContainer, tag);
        let skillsAfterRemove: string[] = this.jobForm.get('skills')?.value || [];
        skillsAfterRemove = skillsAfterRemove.filter(s => s !== skillName);
        this.jobForm.patchValue({ skills: skillsAfterRemove });
        this.jobForm.get('skills')?.markAsDirty(); this.jobForm.get('skills')?.updateValueAndValidity();
      });
      this.renderer.appendChild(tag, removeBtn);
      this.renderer.insertBefore(tagContainer, tag, tagInput);
    };
    const navigateAvailableSuggestions = (direction: 'up' | 'down') => {
      const items = skillsSuggestionsDiv.querySelectorAll('.suggestion-item:not(.suggestion-loading):not(.no-results)') as NodeListOf<HTMLDivElement>;
      if (items.length === 0) return;
      if (activeSuggestionIndex >= 0 && items[activeSuggestionIndex]) this.renderer.removeClass(items[activeSuggestionIndex], 'active-suggestion');
      if (direction === 'down') activeSuggestionIndex = (activeSuggestionIndex + 1) % items.length;
      else activeSuggestionIndex = (activeSuggestionIndex - 1 + items.length) % items.length;
      if (items[activeSuggestionIndex]) {
        this.renderer.addClass(items[activeSuggestionIndex], 'active-suggestion');
        items[activeSuggestionIndex].scrollIntoView({ block: 'nearest', inline: 'nearest' });
      }
    };
    const skillInputSub = fromEvent(tagInput, 'input').pipe(
      map(event => (event.target as HTMLInputElement).value),
      debounceTime(this.SKILL_DEBOUNCE_DELAY), distinctUntilChanged(),
      tap(term => { this.isLoadingSkills = !!term.trim(); if (!term.trim()) showAvailableSuggestions([]); }),
      switchMap(term => {
        if (!term.trim()) return of([]);
        return this.skillService.searchSkills(term).pipe(
          map((apiSkills: ApiSkill[]) => apiSkills.map(s => s.name)),
          catchError(() => { this.isLoadingSkills = false; this.snackBar.open('Error fetching skills.', 'Close', { duration: 3000 }); return of([]); })
        );
      })
    ).subscribe(skillNames => {
      this.isLoadingSkills = false;
      const currentSelectedSkills: string[] = this.jobForm.get('skills')?.value || [];
      const filteredForDisplay = skillNames.filter(name => !currentSelectedSkills.includes(name));
      showAvailableSuggestions(filteredForDisplay.slice(0, 10)); // Show top 10
    });
    this.subscriptions.add(skillInputSub);

    tagInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const activeItem = skillsSuggestionsDiv.querySelector('.suggestion-item.active-suggestion') as HTMLDivElement;
        if (activeItem && activeItem.textContent) addSkillTag(activeItem.textContent);
        else if (tagInput.value.trim()) addSkillTag(tagInput.value.trim());
        tagInput.value = ''; skillsSuggestionsDiv.style.display = 'none'; activeSuggestionIndex = -1;
      } else if (e.key === 'ArrowDown') { e.preventDefault(); navigateAvailableSuggestions('down'); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); navigateAvailableSuggestions('up'); }
      else if (e.key === 'Backspace' && !tagInput.value) {
        const currentSkills: string[] = this.jobForm.get('skills')?.value || [];
        if (currentSkills.length > 0) {
          const tagsInDOM = tagContainer.querySelectorAll('.tag');
          if (tagsInDOM.length > 0) this.renderer.removeChild(tagContainer, tagsInDOM[tagsInDOM.length - 1]);
          currentSkills.pop(); this.jobForm.patchValue({ skills: currentSkills });
          this.jobForm.get('skills')?.markAsDirty(); this.jobForm.get('skills')?.updateValueAndValidity();
        }
      } else if (e.key === 'Escape') { skillsSuggestionsDiv.style.display = 'none'; activeSuggestionIndex = -1; }
    });
    this.document.addEventListener('click', (e) => {
      const target = e.target as Node;
      const skillsContainer = this.document.getElementById('skills-input-container'); // Check this ID matches your HTML
      const locationContainer = this.document.getElementById('location-input-container'); // Check this ID

      if (skillsContainer && !skillsContainer.contains(target)) {
        skillsSuggestionsDiv.style.display = 'none';
      }
      if (locationContainer && !locationContainer.contains(target)) {
          this.showLocationSuggestions = false;
      }
    });
    tagInput.addEventListener('click', (e) => { e.stopPropagation(); /* Prevents document click listener from hiding suggestions immediately */ });
    this.document.getElementById('tagContainer')?.addEventListener('click', () => tagInput.focus()); // Focus input when clicking container
  }

  onSubmit(): void {
    const token = this.corporateAuthService.getJWTToken();
    if (!token) {
      this.snackBar.open('Authentication required. Please log in.', 'Close', { duration: 5000 });
      this.router.navigate(['/login-corporate']); return;
    }

    this.jobForm.markAllAsTouched();
    this.checkEmpty('editor');

    if (this.jobForm.invalid) {
      this.snackBar.open('Please fill all required fields correctly.', 'Close', { duration: 5000, panelClass: ['error-snackbar'] });
      const firstInvalidControl = Object.keys(this.jobForm.controls).find(key => this.jobForm.controls[key].invalid);
      if (firstInvalidControl) {
          let element: HTMLElement | null = this.document.querySelector(`[formControlName="${firstInvalidControl}"]`);
          if (!element) {
              if (firstInvalidControl === 'skills') element = this.document.getElementById('tagInput');
              else if (firstInvalidControl === 'job_description') element = this.document.getElementById('editor');
              else if (firstInvalidControl === 'location') element = this.locationInput.nativeElement;
          }
          element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    this.isSubmitting = true;
    this.spinner.show('main-spinner'); // MODIFICATION: Show spinner after validation passes
    const formValues = this.jobForm.getRawValue();
    const locationString = Array.isArray(formValues.location) ? formValues.location.join(', ') : (typeof formValues.location === 'string' ? formValues.location : '');
    const jobDetails: JobDetails = {
      ...formValues,
      location: locationString,
      skills: {
           primary: (formValues.skills || []).slice(0, Math.ceil((formValues.skills || []).length / 2)).map((s: string) => ({ skill: s, skill_confidence: 0.9, type_confidence: 0.9 })),
           secondary: (formValues.skills || []).slice(Math.ceil((formValues.skills || []).length / 2)).map((s: string) => ({ skill: s, skill_confidence: 0.8, type_confidence: 0.8 }))
      },
      status: 'draft'
    };

    const saveSub = this.jobDescriptionService.saveJobPost(jobDetails, token).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.snackBar.open('Job post saved. Proceeding to assessment setup.', 'Close', { duration: 3000 });
         // <<< MODIFICATION IS HERE >>>
        // 1. Start the workflow with the new ID
        this.workflowService.startWorkflow(response.unique_id);
        this.spinner.hide('main-spinner');
        
        // 2. Navigate to the next page with a clean URL
        this.router.navigate(['/create-job-post-21-page']); 
      },
      error: (error) => {
        this.isSubmitting = false;
        console.error('Job post saving failed:', error);
        this.snackBar.open(`Job post saving failed: ${error.message || 'Unknown error'}`, 'Close', { duration: 5000 });
      }
    });
    this.subscriptions.add(saveSub);
  }

  onCancel(): void {
    if (this.currentStep === 'assessment') {
      this.snackBar.open('Returning to job post editing.', 'Close', { duration: 2000 });
      this.currentStep = 'jobPost';
    } else {
      this.snackBar.open('Job post creation cancelled.', 'Close', { duration: 3000 });
      this.resetForm(); this.router.navigate(['/dashboard']); // Or appropriate route
    }
  }

  resetForm(): void {
    this.jobForm.reset({
      role: '',
      location: [], // Reset to empty array for the form
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

    this.clearFileInput();
    this.isFileUploadCompletedSuccessfully = false;

    if (this.isViewInitialized) { // Ensure view elements are available
        this.populateSkills([]);
        this.setJobDescription('');
        this.updateExperienceUI(); // This will use the reset form values
        if (this.locationInput && this.locationInput.nativeElement) {
            this.locationInput.nativeElement.value = ''; // Clear location text input
        }
    }

    this.currentStep = 'jobPost';
    this.jobData = null; // Clear any loaded job data
    this.isSubmitting = false;
    this.isLoadingSkills = false;
    this.locationSuggestions = [];
    this.showLocationSuggestions = false;
    this.workflowService.clearWorkflow();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.sessionToken = undefined; // Clean up Google Maps session token
  }
}