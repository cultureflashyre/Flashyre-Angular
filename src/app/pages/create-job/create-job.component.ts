import { Component, OnInit, ElementRef, ViewChild, AfterViewInit, NgZone, Renderer2, Inject, OnDestroy } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Title, Meta } from '@angular/platform-browser';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidatorFn } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, Observable, of, fromEvent, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError, map, tap } from 'rxjs/operators';
import { NgxSpinnerService } from 'ngx-spinner';
import { AdminJobDescriptionService } from '../../services/admin-job-description.service';
import { CorporateAuthService } from '../../services/corporate-auth.service';
import { SkillService, ApiSkill } from '../../services/skill.service';
import { AdminJobCreationWorkflowService } from '../../services/admin-job-creation-workflow.service';
import { JobDetails, AIJobResponse } from './types';
import { Loader } from '@googlemaps/js-api-loader';
import { environment } from '../../../environments/environment';

import { RouterModule } from '@angular/router'
import { CommonModule } from '@angular/common'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'

import { NavbarForAdminView } from 'src/app/components/navbar-for-admin-view/navbar-for-admin-view.component';
import { AlertMessageComponent } from 'src/app/components/alert-message/alert-message.component';

import { NgxSpinnerModule } from 'ngx-spinner';


function forbiddenStringValidator(forbiddenString: string): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    const isForbidden = control.value?.toLowerCase().trim() === forbiddenString.toLowerCase();
    return isForbidden ? { forbiddenString: { value: control.value } } : null;
  };
}

function forbiddenLocationValidator(control: AbstractControl): { [key: string]: any } | null {
  const locations = control.value as string[];
  if (locations && locations.length === 1 && locations[0].toLowerCase().trim() === 'not specified') {
    return { forbiddenLocation: true };
  }
  return null;
}




@Component({
  selector: 'create-job',
  standalone: true,
  imports: [ RouterModule, FormsModule, CommonModule, 
    NavbarForAdminView, AlertMessageComponent, ReactiveFormsModule,
    NgxSpinnerModule,
  ],
  templateUrl: './create-job.component.html',
  styleUrls: ['./create-job.component.css']
})
export class AdminCreateJobStep1Component implements OnInit, AfterViewInit, OnDestroy {
  userProfile: any = {};
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('locationInput') locationInput!: ElementRef<HTMLInputElement>;
  private readonly googleMapsApiKey: string = environment.googleMapsApiKey;
  private loader: Loader;
  private placesService: google.maps.places.AutocompleteService | undefined;
  private sessionToken: google.maps.places.AutocompleteSessionToken | undefined;
  private google: any;
  jobForm: FormGroup;
  locationSuggestions: google.maps.places.AutocompletePrediction[] = [];
  showLocationSuggestions = false;
  isLoadingLocations = false;
  private locationInput$ = new Subject<string>();
  selectedFile: File | null = null;
  private readonly SKILL_DEBOUNCE_DELAY = 400;
  isSubmitting: boolean = false;
  isFileUploadCompletedSuccessfully: boolean = false;
  displayedFileName: string | null = null;
  private jobData: JobDetails | Omit<AIJobResponse, 'mcqs'> | null = null;
  private isViewInitialized = false;
  isLoadingSkills = false;
  private subscriptions = new Subscription();
  showPopup: boolean = false;
  popupMessage: string = '';
  popupType: 'success' | 'error' = 'success';

  showAlert = false;
  alertMessage = '';
  alertButtons: string[] = [];
  private actionContext: { action: string } | null = null;

  isEditMode: boolean = false;
  currentJobUniqueId: string | null = null;

  private requiredNonEmptyStringValidator(): ValidatorFn {
  return (control: AbstractControl): {[key:string]:any} | null => {
    const value = control.value;
    if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) {
      return { required: true };
    }
    return null;
  };
}

  constructor(
    private title: Title,
    private meta: Meta,
    private fb: FormBuilder,
    private jobDescriptionService: AdminJobDescriptionService,
    private corporateAuthService: CorporateAuthService,
    private router: Router,
    private route: ActivatedRoute,
    private ngZone: NgZone,
    private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document,
    private skillService: SkillService,
    private workflowService: AdminJobCreationWorkflowService,
    private spinner: NgxSpinnerService,
  ) {
    const numberValidator = (control: import('@angular/forms').AbstractControl): { [key: string]: any } | null => {
      if (control.value === null || control.value === '') return null;
      const value = String(control.value).trim();
      const isValidNumber = /^[0-9]+(\.[0-9]+)?([eE][0-9]+)?$/.test(value) && !isNaN(parseFloat(value)) && parseFloat(value) >= 0 && parseFloat(value) <= Number.MAX_VALUE;
      return isValidNumber ? null : { invalidNumber: true };
    };

    this.jobForm = this.fb.group({
      role: ['', [Validators.required, Validators.maxLength(100), forbiddenStringValidator('Unknown Role')]],
      location: [[], [Validators.required, forbiddenLocationValidator]],
      job_type: ['', [Validators.required]],
      workplace_type: ['', [Validators.required]],
      total_experience_min: [0, [Validators.required, Validators.min(0), Validators.max(30)]],
      total_experience_max: [30, [Validators.required, Validators.min(0), Validators.max(30)]],
      relevant_experience_min: [0, [Validators.required, Validators.min(0), Validators.max(30)]],
      relevant_experience_max: [30, [Validators.required, Validators.min(0), Validators.max(30)]],
      budget_type: ['', [Validators.required]],
      min_budget: [null, [Validators.required, numberValidator]],
      max_budget: [null, [Validators.required, numberValidator]],
      notice_period: ['', [this.requiredNonEmptyStringValidator()]],
      skills: [[], [Validators.required]],
      job_description: ['', [Validators.maxLength(5000), Validators.required]],
      job_description_url: ['', [Validators.maxLength(200)]],
      unique_id: ['']
    }, { validators: this.rangeValidator });
    
    this.loader = new Loader({
      apiKey: this.googleMapsApiKey,
      version: 'weekly',
      libraries: ['places']
    });
  }

  readonly VALID_NOTICE_PERIODS = [
    'Immediate',
    'Less than 15 Days',
    '30 Days',
    '60 Days',
    '90 Days'
  ];

  private _normalizeNoticePeriod(noticePeriodStr: string | null | undefined): string {
    if (!noticePeriodStr) {
      // If the AI provides no value, return an empty string.
      // This will correctly show the "Select Notice Period" placeholder.
      return '';
    }

    const lowerCasePeriod = noticePeriodStr.toLowerCase().trim();
       let mappedValue = '';
    // This checks for common variations the AI might return.
     if (lowerCasePeriod.includes('immediate') || lowerCasePeriod.includes('start')) {
      mappedValue = 'Immediate';
    } else if (lowerCasePeriod.includes('less than 15') || lowerCasePeriod.includes('15 day')) {
      mappedValue = 'Less than 15 Days';
    } else if (lowerCasePeriod.includes('30 day') || lowerCasePeriod.includes('1 month')) {
      mappedValue = '30 Days';
    } else if (lowerCasePeriod.includes('60 day') || lowerCasePeriod.includes('2 month')) {
      mappedValue = '60 Days';
    } else if (lowerCasePeriod.includes('90 day') || lowerCasePeriod.includes('3 month')) {
      mappedValue = '90 Days';
    }
    if (this.VALID_NOTICE_PERIODS.includes(mappedValue)) {
      return mappedValue;
    }

    // If the AI gives a value we don't recognize (e.g., "120 Days"),
    // return an empty string so the user has to select a valid option.
    console.warn(`Unrecognized notice period "${noticePeriodStr}". Resetting to empty.`);
    return '';
  }

   public sanitizeAlphaNumericInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const caretPosition = input.selectionStart;
    const originalValue = input.value;
    const sanitizedValue = originalValue.replace(/[^a-zA-Z0-9 ]/g, '');

    if (originalValue !== sanitizedValue) {
      const diff = originalValue.length - sanitizedValue.length;
      this.jobForm.get('role')?.patchValue(sanitizedValue, { emitEvent: false });
      input.value = sanitizedValue;
      if (caretPosition) {
        input.setSelectionRange(caretPosition - diff, caretPosition - diff);
      }
    }
  }

  showSuccessPopup(message: string) {
    this.popupMessage = message;
    this.popupType = 'success';
    this.showPopup = true;
    setTimeout(() => this.closePopup(), 5000);
  }

  showErrorPopup(message: string) {
    this.popupMessage = message;
    this.popupType = 'error';
    this.showPopup = true;
    setTimeout(() => this.closePopup(), 5000);
  }

  closePopup() {
    this.showPopup = false;
    this.popupMessage = '';
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
      this.showErrorPopup('Please log in to create or edit a job post.');
      this.router.navigate(['/login']);
      return;
    }

    this.currentJobUniqueId = this.route.snapshot.paramMap.get('id');
    if (this.currentJobUniqueId) {
      this.isEditMode = true;
      console.log('Edit mode detected for unique_id:', this.currentJobUniqueId);
      this.loadJobPostForEditing(this.currentJobUniqueId);
    } else {
      const workflowId = this.workflowService.getCurrentJobId();
      if (workflowId) {
        console.log('Resuming existing admin job post with unique_id from workflow service:', workflowId);
        this.loadJobPostForEditing(workflowId);
      } else {
        this.resetForm();
      }
    }

    this.subscriptions.add(
      this.jobForm.get('total_experience_max')!.valueChanges.pipe(
        debounceTime(100)
      ).subscribe(totalMax => {
        const relevantMax = this.jobForm.get('relevant_experience_max')!.value;
        if (relevantMax > totalMax) {
          this.jobForm.patchValue({ relevant_experience_max: totalMax }, { emitEvent: false });
          this.setExperienceRange('relevant', this.jobForm.get('relevant_experience_min')!.value, totalMax);
        }
      })
    );
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
      this.showErrorPopup('Authentication error. Please log in.');
      this.router.navigate(['/login']);
      return;
    }
    this.isSubmitting = true;
    this.spinner.show('main-spinner');
    this.subscriptions.add(
      this.jobDescriptionService.getJobPost(uniqueId, token).subscribe({
        next: (jobDetails: JobDetails) => {
          this.jobData = jobDetails;
          if (this.isViewInitialized) {
            this.populateForm(this.jobData);
          }
          this.isSubmitting = false;
          this.spinner.hide('main-spinner');
        },
        error: (err) => {
          this.isSubmitting = false;
          this.spinner.hide('main-spinner');
          this.showErrorPopup('Failed to load existing job data. Please try again later.');
          console.error(`Failed to load existing job data for ID ${uniqueId}:`, err);
          this.router.navigate(['/job-post-list']);
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
      this.showErrorPopup('Could not load location services. Please check your connection and try again.');
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
      this.placesService!.getPlacePredictions(
        {
          input: term,
          types: ['(cities)'],
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
    this.sessionToken = undefined;
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

  rangeValidator(form: FormGroup): { [key: string]: any } | null {
    const totalMin = form.get('total_experience_min')?.value;
    const totalMax = form.get('total_experience_max')?.value;
    const relevantMin = form.get('relevant_experience_min')?.value;
    const relevantMax = form.get('relevant_experience_max')?.value;
    const minBudget = form.get('min_budget')?.value;
    const maxBudget = form.get('max_budget')?.value;
    let errors: { [key: string]: any } = {};
    if (totalMin !== null && totalMax !== null && totalMin > totalMax) {
      errors['invalidTotalExperience'] = true;
    }
    if (relevantMin !== null && relevantMax !== null && relevantMin > relevantMax) {
      errors['invalidRelevantExperience'] = true;
    }
    if (minBudget !== null && maxBudget !== null && !isNaN(parseFloat(minBudget)) && !isNaN(parseFloat(maxBudget)) && parseFloat(minBudget) > parseFloat(maxBudget)) {
      errors['invalidBudgetRange'] = true;
    }
    if (relevantMax !== null && totalMax !== null && relevantMax > totalMax) {
      errors['relevantExceedsTotal'] = true;
    }
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
      const allowedExtensions = ['.pdf', '.docx', '.txt', '.doc'];
      const ext = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      const maxSize = 5 * 1024 * 1024;
      if (!allowedExtensions.includes(ext)) {
        this.showErrorPopup(`Invalid file format. Supported: ${allowedExtensions.join(', ')}`);
        this.clearFileInput(input); return;
      }
      if (file.size > maxSize) {
        this.showErrorPopup('File size exceeds 5MB limit.');
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

  private checkExperienceRanges(): void {
    const { 
      total_experience_min, total_experience_max,
      relevant_experience_min, relevant_experience_max 
    } = this.jobForm.value;

    if (
      total_experience_min === relevant_experience_min &&
      total_experience_max === relevant_experience_max
    ) {
      this.openAlert(
        'The Total and Relevant Experience ranges are identical. This is valid, but you may want to review it if a distinction is needed.',
        ['Close']
      );
    }
  }

  private _performUpload(file: File): void {
    if (!file) return;
    const token = this.corporateAuthService.getJWTToken();
    if (!token) {
      this.showErrorPopup('Authentication required. Please log in.');
      this.router.navigate(['/login']);
      return;
    }
    this.isSubmitting = true;
    this.isFileUploadCompletedSuccessfully = false;
    this.spinner.show('main-spinner');

    const uploadSub = this.jobDescriptionService.uploadFile(file, token).subscribe({
      next: (response) => {
        this.currentJobUniqueId = response.unique_id;
        this.isEditMode = true;

        this.jobData = { ...response, unique_id: this.currentJobUniqueId! };
        this.populateForm(this.jobData);
        this.showSuccessPopup('File uploaded and processed successfully.');
        this.isSubmitting = false;
        this.spinner.hide('main-spinner');
        this.isFileUploadCompletedSuccessfully = true;
        setTimeout(() => {
          this.checkExperienceRanges();
        }, 100);
      },
      error: (error) => {
        console.error('File upload error:', error);
        // --- MODIFICATION START: Custom error handling for invalid JD ---
        const errorMessage = error?.message || 'An unknown error occurred during file processing.';
        
        // Check for the specific error message from the backend.
        if (errorMessage.includes('Invalid Job Description')) {
            // Use the main alert component as requested.
            this.openAlert('Please upload a valid JD', ['OK']);
            // The action to clear the input is now handled in onAlertButtonClicked.
        } else {
            // Fallback to the original popup for other errors.
            this.showErrorPopup(`File upload failed: ${errorMessage}`);
        }
        // --- MODIFICATION END ---
        
        this.isSubmitting = false;
        this.spinner.hide('main-spinner');
        this.isFileUploadCompletedSuccessfully = false;
        
        // This was already here and is good practice.
        this.clearFileInput();
      }
    });
    this.subscriptions.add(uploadSub);
  }


  private updateExperienceUI(): void {
    this.setExperienceRange('total', this.jobForm.value.total_experience_min, this.jobForm.value.total_experience_max);
    this.setExperienceRange('relevant', this.jobForm.value.relevant_experience_min, Math.min(this.jobForm.value.relevant_experience_max, this.jobForm.value.total_experience_max));
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

    if ('job_details' in jobData) {
      const aiJobData = jobData as Omit<AIJobResponse, 'mcqs'>;
      const details = aiJobData.job_details;
      const [minExp, maxExp] = this.parseExperience(details.experience?.value || '0-0 years');
      role = details.job_titles && details.job_titles.length > 0 ? details.job_titles[0]?.value : '';
      const aiLocationString = details.location || '';
      locationArray = (typeof aiLocationString === 'string' && aiLocationString.trim() !== '')
        ? aiLocationString.split(',').map(s => s.trim()).filter(s => s)
        : [];
      job_type = this.mapJobType(details.job_titles && details.job_titles.length > 0 ? details.job_titles[0]?.value : '');
      workplace_type = details.workplace_type || 'Remote';
      [total_experience_min, total_experience_max] = this.adjustExperienceRange(minExp, maxExp);
      [relevant_experience_min, relevant_experience_max] = this.adjustExperienceRange(minExp, maxExp);
      relevant_experience_max = Math.min(relevant_experience_max, total_experience_max);
      budget_type = details.budget_type || 'Annually';
      min_budget = details.min_budget || null;
      max_budget = details.max_budget || null;
      notice_period = this._normalizeNoticePeriod(details.notice_period);
      skills = [...(details.skills?.primary || []).map(s => s.skill), ...(details.skills?.secondary || []).map(s => s.skill)];
      job_description = this.sanitizeJobDescription(details.job_description || '');
      unique_id_val = aiJobData.unique_id || this.jobForm.get('unique_id')?.value || '';
      //job_description = this.sanitizeJobDescription(details.job_description || '');
      job_description_url_val = aiJobData.file_url || this.jobForm.get('job_description_url')?.value || '';
    } else {
      const details = jobData as JobDetails;
      role = details.role;
      const dbLocationString = details.location || '';
      locationArray = (typeof dbLocationString === 'string' && dbLocationString.trim() !== '')
        ? dbLocationString.split(',').map(s => s.trim()).filter(s => s)
        : [];
      job_type = details.job_type;
      workplace_type = details.workplace_type;
      [total_experience_min, total_experience_max] = this.adjustExperienceRange(details.total_experience_min, details.total_experience_max);
      [relevant_experience_min, relevant_experience_max] = this.adjustExperienceRange(details.relevant_experience_min, details.relevant_experience_max);
      relevant_experience_max = Math.min(relevant_experience_max, total_experience_max);
      budget_type = details.budget_type;
      min_budget = details.min_budget;
      max_budget = details.max_budget;
      notice_period = details.notice_period;
      let primarySkills = Array.isArray(details.skills?.primary) ? details.skills.primary.map(s => s.skill) : [];
      let secondarySkills = Array.isArray(details.skills?.secondary) ? details.skills.secondary.map(s => s.skill) : [];
      skills = [...primarySkills, ...secondarySkills];
      job_description = details.job_description;
      unique_id_val = details.unique_id || this.jobForm.get('unique_id')?.value || '';
      job_description = this.sanitizeJobDescription(details.job_description || '');
      job_description_url_val = details.job_description_url || '';
    }

    this.jobForm.patchValue({
      role,
      location: locationArray,
      job_type,
      workplace_type,
      total_experience_min, total_experience_max,
      relevant_experience_min, relevant_experience_max,
      budget_type, min_budget, max_budget,
      notice_period, skills, job_description,
      job_description_url: job_description_url_val,
      unique_id: unique_id_val
    });

    if (job_description_url_val) {
      try {
        const url = new URL(job_description_url_val);
        const pathnameParts = url.pathname.split('/');
        this.displayedFileName = decodeURIComponent(pathnameParts[pathnameParts.length - 1]);
      } catch (e) {
        const pathParts = job_description_url_val.split('/');
        this.displayedFileName = pathParts[pathParts.length - 1];
      }
      this.isFileUploadCompletedSuccessfully = true;
    } else {
      this.isFileUploadCompletedSuccessfully = false;
    }

    if (this.isViewInitialized) {
      this.populateSkills(skills);
      this.setJobDescription(job_description);
      this.updateExperienceUI();
      this.jobForm.markAsPristine();
      this.jobForm.markAsUntouched();
    }
  }

  private populateSkills(skills: string[]): void {
    const tagContainer = this.document.getElementById('tagContainer') as HTMLDivElement;
    const tagInput = this.document.getElementById('tagInput') as HTMLInputElement;
    if (!tagContainer || !tagInput) {
      if (this.isViewInitialized) console.warn('Skill container or input not found during populateSkills.');
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
      if (this.isViewInitialized) console.warn(`Experience range UI elements not found for type: ${type}`);
      return;
    }
    const rect = rangeIndicator.getBoundingClientRect();
    const width = rect.width > 0 ? rect.width : rangeIndicator.offsetWidth;
    const maxYears = type === 'total' ? 30 : this.jobForm.get('total_experience_max')?.value || 30;
    const markerWidth = markerLeft.offsetWidth || 12;
    const effectiveWidth = Math.max(1, width - markerWidth);
    const clampedMin = Math.max(0, Math.min(min, maxYears));
    const clampedMax = Math.max(clampedMin, Math.min(max, maxYears));
    const minPos = (clampedMin / maxYears) * effectiveWidth;
    const maxPos = (clampedMax / maxYears) * effectiveWidth;
    markerLeft.style.left = `${minPos}px`;
    markerRight.style.left = `${maxPos}px`;
    labelLeft.style.left = `${minPos + markerWidth / 2}px`;
    labelLeft.textContent = `${clampedMin}`;
    labelRight.style.left = `${maxPos + markerWidth / 2}px`;
    labelRight.textContent = `${clampedMax}`;
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
      if (this.isViewInitialized) console.warn(`Range indicator elements not found for type: ${type}`);
      return;
    }
    let isDragging = false; let currentMarker: HTMLDivElement | null = null;
    const markerWidth = markerLeft.offsetWidth || 12;
    const updateUIFromMarkers = () => {
      const rect = rangeIndicator.getBoundingClientRect(); if (rect.width <= 0) return;
      const effectiveWidth = rect.width - markerWidth; if (effectiveWidth <= 0) return;
      let leftPosPx = parseFloat(markerLeft.style.left) || 0;
      let rightPosPx = parseFloat(markerRight.style.left) || effectiveWidth;
      leftPosPx = Math.max(0, Math.min(leftPosPx, effectiveWidth));
      rightPosPx = Math.max(0, Math.min(rightPosPx, effectiveWidth));
      if (leftPosPx > rightPosPx) {
        if (currentMarker === markerLeft) leftPosPx = rightPosPx;
        else rightPosPx = leftPosPx;
      }
      const maxYears = type === 'total' ? 30 : this.jobForm.get('total_experience_max')?.value || 30;
      const minYearRaw = Math.round((leftPosPx / effectiveWidth) * maxYears);
      const maxYearRaw = Math.round((rightPosPx / effectiveWidth) * maxYears);
      const minYear = Math.min(minYearRaw, maxYearRaw);
      const maxYear = Math.max(minYearRaw, maxYearRaw);
      this.jobForm.patchValue(type === 'total' ?
        { total_experience_min: minYear, total_experience_max: maxYear } :
        { relevant_experience_min: minYear, relevant_experience_max: maxYear },
        { emitEvent: false }
      );
      this.setExperienceRange(type, minYear, maxYear);
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging || !currentMarker) return;
      e.preventDefault();
      const rect = rangeIndicator.getBoundingClientRect();
      let newLeftPx = e.clientX - rect.left - (markerWidth / 2);
      const minBoundaryPx = 0;
      const maxBoundaryPx = rect.width - markerWidth;
      if (currentMarker === markerLeft) {
        const rightMarkerPos = parseFloat(markerRight.style.left) || maxBoundaryPx;
        newLeftPx = Math.max(minBoundaryPx, Math.min(newLeftPx, rightMarkerPos));
      } else {
        const leftMarkerPos = parseFloat(markerLeft.style.left) || minBoundaryPx;
        newLeftPx = Math.max(leftMarkerPos, Math.min(newLeftPx, maxBoundaryPx));
      }
      currentMarker.style.left = `${newLeftPx}px`;
      updateUIFromMarkers();
    };
    const onMouseUp = () => {
      if (isDragging) {
        updateUIFromMarkers();
        this.jobForm.get(type === 'total' ? 'total_experience_min' : 'relevant_experience_min')?.markAsDirty();
        this.jobForm.get(type === 'total' ? 'total_experience_max' : 'relevant_experience_max')?.markAsDirty();
        this.jobForm.updateValueAndValidity();
        this.checkExperienceRanges();
      }
      isDragging = false;
      currentMarker = null;
      this.document.removeEventListener('mousemove', onMouseMove);
      this.document.removeEventListener('mouseup', onMouseUp);
    };
    const onMouseDown = (e: MouseEvent, marker: HTMLDivElement) => {
      e.preventDefault();
      isDragging = true;
      currentMarker = marker;
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
    if (singleMatchMore) { const val = parseInt(singleMatchMore[1], 10); return [val, 30]; }
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
      if (this.isViewInitialized) console.warn('Skill input elements not found!');
      return;
    }

    let activeSuggestionIndex = -1;

    const addSkillTag = (skillName: string) => {
      const sanitizedSkill = skillName.replace(/[^a-zA-Z ]/g, '').trim();
      if (!sanitizedSkill) {
        return;
      }

      let currentSkills: string[] = this.jobForm.get('skills')?.value || [];
      if (currentSkills.some(s => s.toLowerCase() === sanitizedSkill.toLowerCase())) {
        this.showErrorPopup(`Skill "${sanitizedSkill}" is already added.`);
        return;
      }

      currentSkills = [...currentSkills, sanitizedSkill];
      this.jobForm.patchValue({ skills: currentSkills });
      this.jobForm.get('skills')?.markAsDirty();
      this.jobForm.get('skills')?.updateValueAndValidity();

      const tag = this.renderer.createElement('div');
      this.renderer.addClass(tag, 'tag');
      const tagText = this.renderer.createElement('span');
      tagText.textContent = sanitizedSkill;
      this.renderer.appendChild(tag, tagText);
      const removeBtn = this.renderer.createElement('button');
      removeBtn.textContent = '×';
      this.renderer.setAttribute(removeBtn, 'type', 'button');
      this.renderer.listen(removeBtn, 'click', () => {
        this.renderer.removeChild(tagContainer, tag);
        let skillsAfterRemove: string[] = this.jobForm.get('skills')?.value || [];
        skillsAfterRemove = skillsAfterRemove.filter(s => s.toLowerCase() !== sanitizedSkill.toLowerCase());
        this.jobForm.patchValue({ skills: skillsAfterRemove });
        this.jobForm.get('skills')?.markAsDirty();
        this.jobForm.get('skills')?.updateValueAndValidity();
      });
      this.renderer.appendChild(tag, removeBtn);
      this.renderer.insertBefore(tagContainer, tag, tagInput);
    };
    
    const processSkillInput = (inputText: string) => {
      inputText.split(',')
        .map(skill => skill.trim())
        .filter(skill => skill)
        .forEach(addSkillTag);
    };

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
      tap(value => {
        if (value.includes(',')) {
          const textToProcess = value.substring(0, value.lastIndexOf(','));
          processSkillInput(textToProcess);
          tagInput.value = value.substring(value.lastIndexOf(',') + 1);
        }
      }),
      map(() => {
        const originalValue = tagInput.value;
        const sanitizedValue = originalValue.replace(/[^a-zA-Z ]/g, '');
        if (originalValue !== sanitizedValue) {
          const caretPosition = tagInput.selectionStart;
          const diff = originalValue.length - sanitizedValue.length;
          tagInput.value = sanitizedValue;
          if (caretPosition) {
            tagInput.setSelectionRange(caretPosition - diff, caretPosition - diff);
          }
        }
        return sanitizedValue;
      }),
      debounceTime(this.SKILL_DEBOUNCE_DELAY),
      distinctUntilChanged(),
      tap(term => { this.isLoadingSkills = !!term.trim(); if (!term.trim()) showAvailableSuggestions([]); }),
      switchMap(term => {
        if (!term.trim()) return of([]);
        return this.skillService.searchSkills(term).pipe(
          map((apiSkills: ApiSkill[]) => apiSkills.map(s => s.name)),
          catchError(() => { this.isLoadingSkills = false; this.showErrorPopup('Error fetching skills.'); return of([]); })
        );
      })
    ).subscribe(skillNames => {
      this.isLoadingSkills = false;
      const currentSelectedSkills: string[] = this.jobForm.get('skills')?.value || [];
      const filteredForDisplay = skillNames.filter(name => !currentSelectedSkills.includes(name));
      showAvailableSuggestions(filteredForDisplay.slice(0, 10));
    });

    this.subscriptions.add(skillInputSub);

    tagInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const activeItem = skillsSuggestionsDiv.querySelector('.suggestion-item.active-suggestion') as HTMLDivElement;
        if (activeItem && activeItem.textContent) {
            addSkillTag(activeItem.textContent);
        } else if (tagInput.value.trim()) {
            processSkillInput(tagInput.value.trim());
        }
        tagInput.value = ''; 
        skillsSuggestionsDiv.style.display = 'none'; 
        activeSuggestionIndex = -1;
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
      const skillsContainer = this.document.getElementById('skills-input-container');
      const locationContainer = this.document.getElementById('location-input-container');
      if (skillsContainer && !skillsContainer.contains(target)) {
        skillsSuggestionsDiv.style.display = 'none';
      }
      if (locationContainer && !locationContainer.contains(target)) {
        this.showLocationSuggestions = false;
      }
    });

    tagInput.addEventListener('click', (e) => { e.stopPropagation(); });
    this.document.getElementById('tagContainer')?.addEventListener('click', () => tagInput.focus());
  }

  onSubmitConfirmed(): void {
    const token = this.corporateAuthService.getJWTToken();
    if (!token) {
      this.showErrorPopup('Authentication required. Please log in.');
      this.router.navigate(['/login']);
      return;
    }
    this.isSubmitting = true;
    this.spinner.show('main-spinner');
    const formValues = this.jobForm.getRawValue();
    const locationString = Array.isArray(formValues.location) ? formValues.location.join(', ') : (typeof formValues.location === 'string' ? formValues.location : '');
    const userProfileString = localStorage.getItem('userProfile');
    let companyName = 'Flashyre';
    if (userProfileString) {
      try {
        const userProfile = JSON.parse(userProfileString);
        if (userProfile.company_name) {
          companyName = userProfile.company_name;
        } else if (userProfile.latest_company_name && userProfile.latest_company_name.trim() !== '') {
          companyName = userProfile.latest_company_name;
        }
      } catch (e) {
        console.error('Failed to parse userProfile from localStorage', e);
      }
      let currentStatus = this.jobData && (this.jobData as JobDetails).status ? (this.jobData as JobDetails).status : 'draft';
    
    if (currentStatus === 'processing') {
        currentStatus = 'draft';
    }
    }
    const jobDetails: JobDetails = {
      ...formValues,
      location: locationString,
      skills: {
        primary: (formValues.skills || []).slice(0, Math.ceil((formValues.skills || []).length / 2)).map((s: string) => ({ skill: s, skill_confidence: 0.9, type_confidence: 0.9 })),
        secondary: (formValues.skills || []).slice(Math.ceil((formValues.skills || []).length / 2)).map((s: string) => ({ skill: s, skill_confidence: 0.8, type_confidence: 0.8 }))
      },
      status: this.jobData && (this.jobData as JobDetails).status ? (this.jobData as JobDetails).status : 'draft',
      company_name: companyName
    };

    let saveOperation: Observable<{ unique_id: string }>;

    if (this.isEditMode && this.currentJobUniqueId) {
      saveOperation = this.jobDescriptionService.updateJobPost(this.currentJobUniqueId, jobDetails, token);
    } else {
      if (jobDetails.unique_id) delete jobDetails.unique_id;
      saveOperation = this.jobDescriptionService.saveJobPost(jobDetails, token);
    }

    const saveSub = saveOperation.subscribe({
      next: (response) => {
        this.isSubmitting = false;

        if (!this.isEditMode) {
          this.currentJobUniqueId = response.unique_id;
          this.isEditMode = true;
        }
        this.showSuccessPopup(`Job post ${this.isEditMode ? 'updated' : 'saved'}. Proceeding to assessment setup.`);
        this.workflowService.startWorkflow(response.unique_id);
        this.spinner.hide('main-spinner');
        this.router.navigate(['/create-job-step2']);
      },
      error: (error) => {
        this.isSubmitting = false;
        this.spinner.hide('main-spinner');
        console.error('Job post saving failed:', error);
        this.showErrorPopup(`Job post saving failed: ${error.message || 'Unknown error'}`);
      }
    });
    this.subscriptions.add(saveSub);
  }

  onCancelConfirmed(): void {
    if (this.isEditMode) {
        this.showSuccessPopup('Job post editing cancelled.');
        setTimeout(() => { this.router.navigate(['/job-post-list']); }, 2000);
        return;
    }

    const token = this.corporateAuthService.getJWTToken();
    const uniqueId = this.jobForm.get('unique_id')?.value;

    if (uniqueId && token) {
      this.spinner.show('main-spinner');
      this.jobDescriptionService.deleteJobPost(uniqueId, token).subscribe({
        next: () => {
          this.spinner.hide('main-spinner');
          this.showSuccessPopup('Job post draft deleted.');
          this.workflowService.clearWorkflow();
          this.resetForm();
        },
        error: (err) => {
          this.spinner.hide('main-spinner');
          console.error('Failed to delete job post draft:', err);
          this.showErrorPopup('Could not delete the draft. Please try again.');
        }
      });
    } else {
      this.showSuccessPopup('Job post creation cancelled.');
      this.workflowService.clearWorkflow();
      this.resetForm();
    }
  }

  resetForm(): void {
    this.jobForm.reset({
      role: '',
      location: [],
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
    if (this.isViewInitialized) {
      this.populateSkills([]);
      this.setJobDescription('');
      this.updateExperienceUI();
      if (this.locationInput && this.locationInput.nativeElement) {
        this.locationInput.nativeElement.value = '';
      }
    }
    this.jobData = null;
    this.isSubmitting = false;
    this.isLoadingSkills = false;
    this.locationSuggestions = [];
    this.showLocationSuggestions = false;
    this.workflowService.clearWorkflow();
    
    this.isEditMode = false;
    this.currentJobUniqueId = null;
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.sessionToken = undefined;
  }

  formatText(command: string, value: string | null = null): void {
    const editor = this.document.getElementById('editor');
    if (!editor || !this.document.queryCommandSupported(command)) {
        return;
    }

    // Special handling for the highlight command to make it a toggle
    if (command === 'hiliteColor') {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
            // If no text is selected, do nothing for highlight
            this.document.execCommand(command, false, value);
            editor.focus();
            return;
        }

        const anchorNode = selection.anchorNode;
        if (anchorNode) {
            // Get the parent element of the selected text
            const parentElement = anchorNode.nodeType === Node.TEXT_NODE ? anchorNode.parentElement : anchorNode as HTMLElement;
            
            if (parentElement) {
                // Get the final, computed background color
                const computedStyle = window.getComputedStyle(parentElement);
                const currentColor = computedStyle.backgroundColor;

                // The standard RGB value for yellow is rgb(255, 255, 0)
                if (currentColor === 'rgb(255, 255, 0)') {
                    // If it's already yellow, remove the highlight by setting a transparent background
                    this.document.execCommand(command, false, 'transparent');
                } else {
                    // Otherwise, apply the yellow highlight
                    this.document.execCommand(command, false, value);
                }
            }
        }
    } else {
        // For all other commands, execute them normally.
        this.document.execCommand(command, false, value);
    }

    editor.focus();

    // Manually trigger updates to ensure Angular's form model is in sync.
    this.updateJobDescriptionFromEditor({ target: editor } as unknown as Event);
    this.checkEmpty('editor');
}

  onLogoutClick() {
    this.corporateAuthService.logout();
  }

  loadUserProfile(): void {
    const profileData = localStorage.getItem('userProfile');
    if (profileData) this.userProfile = JSON.parse(profileData);
  }

  private openAlert(message: string, buttons: string[]) {
    this.alertMessage = message;
    this.alertButtons = buttons;
    this.showAlert = true;
  }

   private onSaveDraftConfirmed(): void {
    const token = this.corporateAuthService.getJWTToken();
    if (!token) {
      this.showErrorPopup('Authentication required. Please log in.');
      this.router.navigate(['/login']);
      return;
    }
    
    this.isSubmitting = true;
    this.spinner.show('main-spinner');

    const rawValues = this.jobForm.getRawValue();
    const draftPayload: { [key: string]: any } = {};

    for (const key in rawValues) {
      const value = rawValues[key];
      if (value !== null && value !== undefined) {
        if (Array.isArray(value) && value.length === 0) {
          continue;
        }
        draftPayload[key] = value;
      }
    }

    if (draftPayload['location']) {
      draftPayload['location'] = Array.isArray(draftPayload['location']) ? draftPayload['location'].join(', ') : draftPayload['location'];
    }

    if (draftPayload['skills']) {
      const skillsArray = draftPayload['skills'];
      draftPayload['skills'] = {
        primary: (skillsArray || []).map((s: string) => ({ skill: s, skill_confidence: 0.9, type_confidence: 0.9 })),
        secondary: []
      };
    }

    // draftPayload['status'] = 'draft';

    // Check the original status of the job post when it was loaded for editing.
const originalStatus = (this.jobData as JobDetails)?.status;

// If the user started editing a job that was already paused, keep the status as 'pause'.
// Otherwise, for new jobs or jobs from other tabs, set the status to 'draft'.
if (this.isEditMode && (originalStatus as string) === 'pause') {
    draftPayload['status'] = 'pause';
} else {
  draftPayload['status'] = 'draft';
}

    const userProfileString = localStorage.getItem('userProfile');
    let companyName = 'Flashyre'; 
    if (userProfileString) {
      try {
        const userProfile = JSON.parse(userProfileString);
        if (userProfile.company_name) {
          companyName = userProfile.company_name;
        }
      } catch (e) { console.error('Failed to parse userProfile from localStorage', e); }
    }
    draftPayload['company_name'] = companyName;

    let saveOperation: Observable<{ unique_id: string }>;

    if (this.isEditMode && this.currentJobUniqueId) {
      saveOperation = this.jobDescriptionService.updateJobPost(this.currentJobUniqueId, draftPayload as JobDetails, token);
    } else {
      if (draftPayload['unique_id']) delete draftPayload['unique_id'];
      saveOperation = this.jobDescriptionService.saveJobPost(draftPayload as JobDetails, token);
    }

    const saveSub = saveOperation.subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.spinner.hide('main-spinner');
        this.showSuccessPopup('Draft saved successfully!');
        
        this.workflowService.clearWorkflow();
        
        setTimeout(() => {
          this.router.navigate(['/job-post-list']);
        }, 2000);
      },
      error: (error) => {
        this.isSubmitting = false;
        this.spinner.hide('main-spinner');
        console.error('Job post draft saving failed:', error);
        this.showErrorPopup(`Draft saving failed: ${error.message || 'Unknown error'}`);
      }
    });
    this.subscriptions.add(saveSub);
  }

  onAlertButtonClicked(action: string) {
    this.showAlert = false;
     // If the alert was for an invalid JD, clear the file input after the user clicks "OK".
    if (this.alertMessage === 'Please upload a valid JD') {
      this.clearFileInput();
    }
    if (action.toLowerCase() === 'cancel' || action.toLowerCase() === 'no') {
      this.actionContext = null;
      return;
    }
    if (this.actionContext) {
      switch (this.actionContext.action) {
        case 'submit':
          this.onSubmitConfirmed();
          break;
        case 'saveDraft':
          this.onSaveDraftConfirmed();
          break;
        case 'cancel':
          this.onCancelConfirmed();
          break;
      }
      this.actionContext = null;
    }
  }
  
  onCancelAttempt(): void {
      this.actionContext = { action: 'cancel' };
      const message = this.isEditMode 
        ? 'Are you sure you want to cancel? Your changes will not be saved.'
        : 'Are you sure you want to cancel? Any unsaved changes will be lost.';
      this.openAlert(message, ['No', 'Yes']);
  }

  onSaveDraftAttempt(): void {
    this.actionContext = { action: 'saveDraft' };
    this.openAlert('Are you sure you want to save this job as a draft?', ['Cancel', 'Save Draft']);
  }

  onSubmitAttempt(): void {
      this.jobForm.markAllAsTouched();
      this.checkEmpty('editor');
  
      if (this.jobForm.invalid) {
        const errorMessages: string[] = [];
        const controls = this.jobForm.controls;
  
        // --- MODIFICATION START ---
        // This map is now comprehensive and includes all required fields.
        const fieldNames: { [key: string]: string } = {
          role: 'Role',
          location: 'Location',
          job_type: 'Job Type',
          workplace_type: 'Workplace Type',
          budget_type: 'Budget Type',
          min_budget: 'Min Budget',
          max_budget: 'Max Budget',
          notice_period: 'Notice Period',
          skills: 'Skills',
          job_description: 'Job Description',
        };
        // --- MODIFICATION END ---
  
        for (const key of Object.keys(fieldNames)) {
          const control = controls[key];
          if (control && control.invalid) {
            if (control.hasError('required')) {
              // A special check for the location array to ensure it's not just empty.
              if (key === 'location' && (!control.value || control.value.length === 0)) {
                errorMessages.push(`• ${fieldNames[key]} is a required field.`);
              } else if (key !== 'location') {
                errorMessages.push(`• ${fieldNames[key]} is a required field.`);
              }
            }
            if (control.hasError('forbiddenString')) {
              errorMessages.push(`• ${fieldNames[key]} cannot be 'Unknown Role'.`);
            }
            if (control.hasError('forbiddenLocation')) {
              errorMessages.push(`• ${fieldNames[key]} cannot be 'Not Specified'.`);
            }
            if (control.hasError('invalidNumber')) {
                errorMessages.push(`• Please enter a valid number for ${fieldNames[key]}.`);
            }
          }
        }

        if (this.jobForm.hasError('invalidBudgetRange')) {
            errorMessages.push('• Min Budget cannot be greater than Max Budget.');
        }
  
        if (errorMessages.length === 0) {
          errorMessages.push('• Please fill all required fields correctly before proceeding.');
        }
  
        this.openAlert("Please fix the following issues:\n\n" + errorMessages.join('\n'), ['OK']);
  
        const firstInvalidControl = Object.keys(controls).find(key => controls[key].invalid);
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
  
      this.actionContext = { action: 'submit' };
      const message = this.isEditMode
        ? 'Do you want to save the changes to this job post and proceed?'
        : 'Do you want to save this job post and proceed?';
      this.openAlert(message, ['Cancel', 'Save & Next']);
  }

  private sanitizeJobDescription(content: string): string {
    if (!content) return '';

    // FIX: Always convert newlines (\n) to <br> tags before processing HTML.
    // This ensures line breaks from the uploaded file are visually rendered in the editor,
    // even if the content contains other HTML tags.
    // We also handle escaped newlines (\\n) just in case the backend sends them that way.
    let formattedContent = content.replace(/\\n/g, '<br>').replace(/\n/g, '<br>');

    // Create a temp div to parse the HTML structure
    const tempDiv = this.document.createElement('div');
    tempDiv.innerHTML = formattedContent;

    // Define tags that are allowed (Basic formatting + Structure)
    // We map 'STRONG' to 'B' and 'EM' to 'I' visually, but keeping them is fine.
    const allowedTags = ['B', 'STRONG', 'I', 'EM', 'U', 'UL', 'OL', 'LI', 'P', 'BR', 'DIV', 'SPAN'];

    const cleanNode = (element: HTMLElement) => {
      // Process children first (Depth-First Traversal)
      const children = Array.from(element.childNodes);
      children.forEach((node) => {
        if (node.nodeType === 1) { // Node.ELEMENT_NODE
          cleanNode(node as HTMLElement);
        }
      });

      // Process the current element (skip the root tempDiv)
      if (element !== tempDiv) {
        const tagName = element.tagName;

        if (!allowedTags.includes(tagName)) {
          // If tag is NOT allowed (e.g., <style>, <script>, <font>), 
          // Unwrap it: Remove the tag but keep the text content/children.
          const parent = element.parentNode;
          while (element.firstChild) {
            parent?.insertBefore(element.firstChild, element);
          }
          parent?.removeChild(element);
        } else {
          // If tag IS allowed, strip all attributes (style="...", class="...")
          // This removes external formatting conflicts but keeps bold/italic/lists.
          while (element.attributes.length > 0) {
            element.removeAttribute(element.attributes[0].name);
          }
        }
      }
    };

    cleanNode(tempDiv);
    return tempDiv.innerHTML;
  }
}