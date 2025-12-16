import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, ElementRef, ViewChild, NgZone, Renderer2, Inject, OnChanges, SimpleChanges, AfterViewInit } from '@angular/core';
import { DOCUMENT, CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { Subject, Observable, of, Subscription, fromEvent } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError, map, tap } from 'rxjs/operators';
import { NgxSpinnerService, NgxSpinnerModule } from 'ngx-spinner';
import { Loader } from '@googlemaps/js-api-loader';

// Import Services and Types
import { AdminJobDescriptionService } from '../../../../services/admin-job-description.service';
import { CorporateAuthService } from '../../../../services/corporate-auth.service';
import { SkillService, ApiSkill } from '../../../../services/skill.service';
import { AdminJobCreationWorkflowService } from '../../../../services/admin-job-creation-workflow.service';
import { JobDetails, AIJobResponse } from '../../../../pages/create-job/types'; // Adjust path if needed
import { environment } from '../../../../../environments/environment';

// Import Child Components
import { AlertMessageComponent } from '../../../../components/alert-message/alert-message.component';

@Component({
  selector: 'app-job-details-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NgxSpinnerModule,
    AlertMessageComponent
  ],
  templateUrl: './job-details-form.component.html',
  styleUrls: ['./job-details-form.component.css']
})
export class JobDetailsFormComponent implements OnInit, OnDestroy, OnChanges, AfterViewInit {
  @Input() initialData: JobDetails | null = null;
  @Output() dataChanged = new EventEmitter<any>();
  @Output() validityChanged = new EventEmitter<boolean>();
  @Output() jobCreated = new EventEmitter<string>();

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('locationInput') locationInput!: ElementRef<HTMLInputElement>;
  
  jobForm: FormGroup;
  private subscriptions = new Subscription();
  
  isUploadingFile = false;
  isFileUploadSuccess = false;
  displayedFileName: string | null = null;
  
  showPopup = false;
  popupMessage = '';
  popupType: 'success' | 'error' = 'success';
  showAlert = false;
  alertMessage = '';
  alertButtons: string[] = [];

  private google: any;
  private loader: Loader;
  private placesService?: google.maps.places.AutocompleteService;
  private sessionToken?: google.maps.places.AutocompleteSessionToken;
  private locationInput$ = new Subject<string>();
  locationSuggestions: google.maps.places.AutocompletePrediction[] = [];
  showLocationSuggestions = false;
  isLoadingLocations = false;

  isLoadingSkills = false;

  constructor(
    private fb: FormBuilder,
    @Inject(DOCUMENT) private document: Document,
    private renderer: Renderer2,
    private ngZone: NgZone,
    private jobDescriptionService: AdminJobDescriptionService,
    private corporateAuthService: CorporateAuthService,
    private skillService: SkillService,
    private workflowService: AdminJobCreationWorkflowService,
    private spinner: NgxSpinnerService,
  ) {
    this.loader = new Loader({
      apiKey: environment.googleMapsApiKey,
      version: 'weekly',
      libraries: ['places']
    });
    this.buildForm();
  }

  ngOnInit(): void {
    this.initializeGooglePlaces();
    this.setupLocationAutocomplete();
    
    this.subscriptions.add(
        this.jobForm.valueChanges.pipe(debounceTime(300)).subscribe(() => {
            if (this.jobForm.valid) {
                this.dataChanged.emit(this.preparePayload());
            }
        })
    );
    this.subscriptions.add(
        this.jobForm.statusChanges.subscribe(status => {
            this.validityChanged.emit(status === 'VALID');
        })
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
      if (changes.initialData && changes.initialData.currentValue && this.jobForm) {
          this.populateForm(changes.initialData.currentValue);
      }
  }
  
  ngAfterViewInit(): void {
    this.initializeSkillsInput();
    this.initializeRange('total');
    this.initializeRange('relevant');
    this.checkEmpty('editor');
    if (this.initialData) {
        this.populateForm(this.initialData);
    } else {
        this.updateExperienceUI();
    }
  }

  private buildForm(): void {
    const numberValidator = (control: AbstractControl): { [key: string]: any } | null => {
      if (control.value === null || control.value === '') return null;
      const value = String(control.value).trim();
      const isValid = /^\d*\.?\d+$/.test(value) && !isNaN(parseFloat(value)) && parseFloat(value) >= 0;
      return isValid ? null : { invalidNumber: true };
    };

    this.jobForm = this.fb.group({
      role: ['', [Validators.required, Validators.maxLength(100)]],
      location: [[], [Validators.required, Validators.minLength(1)]],
      job_type: ['', Validators.required],
      workplace_type: ['', Validators.required],
      total_experience_min: [0, [Validators.required, Validators.min(0), Validators.max(30)]],
      total_experience_max: [30, [Validators.required, Validators.min(0), Validators.max(30)]],
      relevant_experience_min: [0, [Validators.required, Validators.min(0), Validators.max(30)]],
      relevant_experience_max: [30, [Validators.required, Validators.min(0), Validators.max(30)]],
      budget_type: ['', Validators.required],
      min_budget: [null, [Validators.required, numberValidator]],
      max_budget: [null, [Validators.required, numberValidator]],
      notice_period: ['', Validators.required],
      skills: [[], [Validators.required, Validators.minLength(1)]],
      job_description: ['', [Validators.required, Validators.maxLength(5000)]],
      job_description_url: ['']
    }, { validators: this.rangeValidator.bind(this) });
  }

  rangeValidator(form: FormGroup): { [key: string]: any } | null {
    const totalMin = form.get('total_experience_min')?.value;
    const totalMax = form.get('total_experience_max')?.value;
    const relevantMin = form.get('relevant_experience_min')?.value;
    const relevantMax = form.get('relevant_experience_max')?.value;
    const minBudget = form.get('min_budget')?.value;
    const maxBudget = form.get('max_budget')?.value;
    let errors: { [key: string]: any } = {};

    if (totalMin > totalMax) { errors['invalidTotalExperience'] = true; }
    if (relevantMin > relevantMax) { errors['invalidRelevantExperience'] = true; }
    if (parseFloat(minBudget) > parseFloat(maxBudget)) { errors['invalidBudgetRange'] = true; }
    if (relevantMax > totalMax) { errors['relevantExceedsTotal'] = true; }

    return Object.keys(errors).length ? errors : null;
  }
  
  private preparePayload(): any {
    const formValues = this.jobForm.getRawValue();
    const locationString = Array.isArray(formValues.location) ? formValues.location.join(', ') : '';
    
    const primarySkills = (formValues.skills || []).slice(0, 5);
    const secondarySkills = (formValues.skills || []).slice(5);

    return {
      ...formValues,
      location: locationString,
      skills: {
        primary: primarySkills.map((s: string) => ({ skill: s, skill_confidence: 0.9, type_confidence: 0.9 })),
        secondary: secondarySkills.map((s: string) => ({ skill: s, skill_confidence: 0.8, type_confidence: 0.8 }))
      },
    };
  }

  triggerFileInput(): void { this.fileInput.nativeElement.click(); }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.performUpload(file);
      input.value = '';
    }
  }

  private performUpload(file: File): void {
    const token = this.corporateAuthService.getJWTToken();
    if (!token) { this.showErrorPopup('Authentication error.'); return; }

    this.isUploadingFile = true;
    this.isFileUploadSuccess = false;
    this.spinner.show('file-spinner');

    this.jobDescriptionService.uploadFile(file, token).subscribe({
      next: (response) => {
        this.populateForm(response);
        this.displayedFileName = file.name;
        this.isFileUploadSuccess = true;
        this.showSuccessPopup('File processed successfully!');
        this.jobCreated.emit(response.unique_id);
      },
      error: (err) => {
        this.showErrorPopup(`File upload failed: ${err.message || 'Unknown error'}`);
        this.displayedFileName = null;
      },
      complete: () => {
        this.isUploadingFile = false;
        this.spinner.hide('file-spinner');
      }
    });
  }
  
  private adjustExperienceRange(min: number, max: number): [number, number] {
    return (min === 0 && max === 0) ? [0, 30] : [min, max];
  }
  
  private parseExperience(exp: string): [number, number] {
    if (!exp) return [0, 0];
    const rangeMatch = exp.match(/(\d+)\s*-\s*(\d+)/);
    if (rangeMatch) return [parseInt(rangeMatch[1], 10), parseInt(rangeMatch[2], 10)];
    
    const singleMatchMore = exp.match(/(\d+)\+\s*years?/i) || exp.match(/more than\s*(\d+)\s*years?/i);
    if (singleMatchMore) { const val = parseInt(singleMatchMore[1], 10); return [val, 30]; }
    
    const singleMatchLess = exp.match(/less than\s*(\d+)\s*years?/i) || exp.match(/up to\s*(\d+)\s*years?/i);
    if (singleMatchLess) { const val = parseInt(singleMatchLess[1], 10); return [0, val]; }
    
    const singleMatch = exp.match(/(\d+)\s*years?/i);
    if (singleMatch) { const val = parseInt(singleMatch[1], 10); return [val, val]; }
    
    return [0, 0];
  }

  private mapJobType(title: string): string {
    if (!title) return 'Permanent'; 
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('intern')) return 'Internship';
    if (lowerTitle.includes('contract')) return 'Contract';
    if (lowerTitle.includes('part-time') || lowerTitle.includes('part time')) return 'Part-time';
    return 'Permanent';
  }

  private populateForm(data: JobDetails | AIJobResponse): void {
    let formData: any;
    if ('job_details' in data) { // It's AIJobResponse
        const details = data.job_details;
        const [minExp, maxExp] = this.parseExperience(details.experience?.value || '0-0 years');
        const [total_experience_min, total_experience_max] = this.adjustExperienceRange(minExp, maxExp);
        let [relevant_experience_min, relevant_experience_max] = this.adjustExperienceRange(minExp, maxExp);
        relevant_experience_max = Math.min(relevant_experience_max, total_experience_max);

        formData = {
            role: details.job_titles?.[0]?.value || '',
            location: details.location?.split(',').map(s => s.trim()).filter(Boolean) || [],
            job_type: this.mapJobType(details.job_titles?.[0]?.value || ''),
            workplace_type: details.workplace_type || 'Remote',
            total_experience_min,
            total_experience_max,
            relevant_experience_min,
            relevant_experience_max,
            budget_type: details.budget_type || 'Annually',
            min_budget: details.min_budget || null,
            max_budget: details.max_budget || null,
            notice_period: details.notice_period || '30 days',
            skills: [...(details.skills?.primary || []).map(s => s.skill), ...(details.skills?.secondary || []).map(s => s.skill)],
            job_description: details.job_description || '',
            job_description_url: data.file_url || ''
        };
    } else { // It's JobDetails
        formData = {
            role: data.role,
            location: data.location?.split(',').map(s => s.trim()).filter(Boolean) || [],
            job_type: data.job_type,
            workplace_type: data.workplace_type,
            total_experience_min: data.total_experience_min,
            total_experience_max: data.total_experience_max,
            relevant_experience_min: data.relevant_experience_min,
            relevant_experience_max: data.relevant_experience_max,
            budget_type: data.budget_type,
            min_budget: data.min_budget,
            max_budget: data.max_budget,
            notice_period: data.notice_period,
            skills: [...(data.skills?.primary || []).map(s => s.skill), ...(data.skills?.secondary || []).map(s => s.skill)],
            job_description: data.job_description,
            job_description_url: data.job_description_url
        };
    }
    this.jobForm.patchValue(formData);
    this.updateExperienceUI();
    this.populateSkillsUI(formData.skills);
    this.setJobDescriptionUI(formData.job_description);
  }

  private populateSkillsUI(skills: string[]): void {
    const tagContainer = this.document.getElementById('tagContainer');
    const tagInput = this.document.getElementById('tagInput');
    if (!tagContainer || !tagInput) return;
    
    tagContainer.querySelectorAll('.tag').forEach(tag => tag.remove());
    
    skills.forEach(skillText => this.addSkillTag(skillText, false));
  }

  private setJobDescriptionUI(description: string): void {
      const editor = this.document.getElementById('editor');
      if (editor) {
          editor.innerHTML = description;
          this.checkEmpty('editor');
      }
  }

  updateJobDescriptionFromEditor(event: Event): void {
    const editorContent = (event.target as HTMLDivElement).innerHTML;
    this.jobForm.patchValue({ job_description: editorContent }, { emitEvent: false });
    this.jobForm.markAsDirty();
    this.checkEmpty('editor');
  }

  // --- Location Methods ---
  private async initializeGooglePlaces(): Promise<void> {
    try {
      this.google = await this.loader.load();
      this.placesService = new this.google.maps.places.AutocompleteService();
    } catch (error) { console.error('Google Maps script could not be loaded.', error); }
  }

  private setupLocationAutocomplete(): void {
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
  }

  onLocationInput(event: Event): void {
    const term = (event.target as HTMLInputElement).value;
    if (!term.trim()) { this.showLocationSuggestions = false; return; }
    this.locationInput$.next(term);
  }

  getPlacePredictions(term: string): Observable<google.maps.places.AutocompletePrediction[]> {
    if (!this.placesService || !term) return of([]);
    return new Observable(observer => {
      this.placesService!.getPlacePredictions({ input: term, types: ['(cities)'], sessionToken: this.sessionToken },
        (predictions, status) => {
          this.ngZone.run(() => {
            if (status === 'OK' && predictions) { observer.next(predictions); } 
            else { observer.next([]); }
            observer.complete();
          });
        }
      );
    });
  }

  selectLocationSuggestion(suggestion: google.maps.places.AutocompletePrediction): void {
    const currentLocations: string[] = this.jobForm.get('location')?.value || [];
    if (!currentLocations.includes(suggestion.description)) {
      this.jobForm.patchValue({ location: [...currentLocations, suggestion.description] });
      this.jobForm.get('location')?.markAsDirty();
    }
    this.locationInput.nativeElement.value = '';
    this.showLocationSuggestions = false;
    this.sessionToken = undefined; // Reset token after selection
  }

  removeLocation(index: number): void {
    const currentLocations: string[] = this.jobForm.get('location')?.value || [];
    currentLocations.splice(index, 1);
    this.jobForm.patchValue({ location: currentLocations });
    this.jobForm.get('location')?.markAsDirty();
  }
  
  onLocationInputKeydown(event: KeyboardEvent): void {
      if (event.key === 'Backspace' && this.locationInput.nativeElement.value === '') {
          const locations = this.jobForm.get('location')?.value;
          if (locations && locations.length > 0) {
              this.removeLocation(locations.length - 1);
          }
      }
  }

  // --- Skills Methods ---
  private initializeSkillsInput(): void {
    const tagInput = this.document.getElementById('tagInput') as HTMLInputElement;
    const tagContainer = this.document.getElementById('tagContainer') as HTMLDivElement;
    const skillsSuggestionsDiv = this.document.getElementById('skillsSuggestions') as HTMLDivElement;
    if (!tagInput || !tagContainer || !skillsSuggestionsDiv) return;

    let activeSuggestionIndex = -1;

    const showAvailableSuggestions = (skills: string[]) => {
        skillsSuggestionsDiv.innerHTML = '';
        if (this.isLoadingSkills && skills.length === 0 && tagInput.value.trim()) {
            const item = this.renderer.createElement('div');
            item.textContent = 'Loading...';
            this.renderer.appendChild(skillsSuggestionsDiv, item);
        } else if (skills.length === 0 && tagInput.value.trim()) {
            const item = this.renderer.createElement('div');
            item.textContent = 'No matching skills found.';
            this.renderer.appendChild(skillsSuggestionsDiv, item);
        } else {
            skills.forEach(skillName => {
                const item = this.renderer.createElement('div');
                item.textContent = skillName;
                this.renderer.addClass(item, 'suggestion-item');
                this.renderer.listen(item, 'click', () => {
                    this.addSkillTag(skillName);
                    tagInput.value = '';
                    skillsSuggestionsDiv.style.display = 'none';
                });
                this.renderer.appendChild(skillsSuggestionsDiv, item);
            });
        }
        skillsSuggestionsDiv.style.display = 'block';
        activeSuggestionIndex = -1;
    };

    const navigateSuggestions = (direction: 'up' | 'down') => {
        const items = skillsSuggestionsDiv.querySelectorAll('.suggestion-item') as NodeListOf<HTMLDivElement>;
        if (items.length === 0) return;
        items[activeSuggestionIndex]?.classList.remove('active-suggestion');
        activeSuggestionIndex = (direction === 'down')
            ? (activeSuggestionIndex + 1) % items.length
            : (activeSuggestionIndex - 1 + items.length) % items.length;
        items[activeSuggestionIndex]?.classList.add('active-suggestion');
    };
      
    this.subscriptions.add(fromEvent(tagInput, 'input').pipe(
        map(event => (event.target as HTMLInputElement).value),
        debounceTime(400),
        distinctUntilChanged(),
        tap(term => this.isLoadingSkills = !!term.trim()),
        switchMap(term => term.trim() ? this.skillService.searchSkills(term).pipe(catchError(() => of([]))) : of([]))
      ).subscribe((skills: ApiSkill[]) => {
          this.isLoadingSkills = false;
          const currentSkills = this.jobForm.get('skills')?.value || [];
          const skillNames = skills.map(s => s.name).filter(name => !currentSkills.includes(name));
          showAvailableSuggestions(skillNames.slice(0, 10));
    }));

    tagInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const activeItem = skillsSuggestionsDiv.querySelector('.active-suggestion');
            const skillName = activeItem?.textContent || tagInput.value.trim();
            if (skillName) {
                this.addSkillTag(skillName);
                tagInput.value = '';
                skillsSuggestionsDiv.style.display = 'none';
            }
        } else if (e.key === 'Backspace' && !tagInput.value) {
            this.removeLastSkill();
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            navigateSuggestions('down');
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            navigateSuggestions('up');
        } else if (e.key === 'Escape') {
            skillsSuggestionsDiv.style.display = 'none';
        }
    });

    this.document.addEventListener('click', (e) => {
        if (!tagContainer.contains(e.target as Node)) {
            skillsSuggestionsDiv.style.display = 'none';
        }
    });
  }
  
  addSkillTag(skillName: string, markAsDirty = true): void {
      const currentSkills: string[] = this.jobForm.get('skills')?.value || [];
      if (skillName && !currentSkills.includes(skillName)) {
          this.jobForm.patchValue({ skills: [...currentSkills, skillName] });
          if (markAsDirty) this.jobForm.get('skills')?.markAsDirty();

          const tagContainer = this.document.getElementById('tagContainer');
          const tagInput = this.document.getElementById('tagInput');
          if (tagContainer && tagInput) {
              const tag = this.renderer.createElement('div');
              this.renderer.addClass(tag, 'tag');
              tag.innerHTML = `<span>${skillName}</span><button class="remove-tag-btn" type="button">×</button>`;
              this.renderer.insertBefore(tagContainer, tag, tagInput);
              this.renderer.listen(tag.querySelector('button'), 'click', () => {
                  this.removeSkill(skillName);
              });
          }
      }
  }

  removeSkill(skillName: string): void {
      const currentSkills: string[] = this.jobForm.get('skills')?.value || [];
      this.jobForm.patchValue({ skills: currentSkills.filter(s => s !== skillName) });
      this.jobForm.get('skills')?.markAsDirty();

      const tagContainer = this.document.getElementById('tagContainer');
      if (tagContainer) {
          const tags = Array.from(tagContainer.querySelectorAll('.tag span'));
          const tagToRemove = tags.find(span => span.textContent === skillName)?.closest('.tag');
          if (tagToRemove) {
              this.renderer.removeChild(tagContainer, tagToRemove);
          }
      }
  }

  removeLastSkill(): void {
      const currentSkills: string[] = this.jobForm.get('skills')?.value || [];
      if (currentSkills.length > 0) {
          this.removeSkill(currentSkills[currentSkills.length - 1]);
      }
  }

  // --- Experience Slider Methods ---
  private initializeRange(type: 'total' | 'relevant'): void {
    const prefix = type === 'total' ? 'total_' : 'relevant_';
    const rangeIndicator = this.document.getElementById(`${prefix}rangeIndicator`) as HTMLDivElement;
    const markerLeft = this.document.getElementById(`${prefix}markerLeft`) as HTMLDivElement;
    const markerRight = this.document.getElementById(`${prefix}markerRight`) as HTMLDivElement;
    if (!rangeIndicator || !markerLeft || !markerRight) return;

    let isDragging = false;
    let currentMarker: HTMLDivElement | null = null;
    const markerWidth = markerLeft.offsetWidth || 12;

    const updateUIFromMarkers = () => {
      const rect = rangeIndicator.getBoundingClientRect();
      if (rect.width <= 0) return;
      const effectiveWidth = rect.width - markerWidth;
      
      let leftPx = parseFloat(markerLeft.style.left) || 0;
      let rightPx = parseFloat(markerRight.style.left) || effectiveWidth;
      
      const maxYears = type === 'total' ? 30 : this.jobForm.get('total_experience_max')?.value || 30;
      const minYear = Math.round((leftPx / effectiveWidth) * maxYears);
      const maxYear = Math.round((rightPx / effectiveWidth) * maxYears);

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
        const rightMarkerPos = parseFloat(markerRight.style.left) || (rect.width - markerWidth);
        const leftMarkerPos = parseFloat(markerLeft.style.left) || 0;

        if (currentMarker === markerLeft) {
            newLeftPx = Math.max(0, Math.min(newLeftPx, rightMarkerPos));
        } else {
            newLeftPx = Math.max(leftMarkerPos, Math.min(newLeftPx, rect.width - markerWidth));
        }
        currentMarker.style.left = `${newLeftPx}px`;
        updateUIFromMarkers();
    };

    const onMouseUp = () => {
        if (isDragging) this.jobForm.updateValueAndValidity();
        isDragging = false;
        currentMarker = null;
        this.document.removeEventListener('mousemove', onMouseMove);
        this.document.removeEventListener('mouseup', onMouseUp);
    };

    const onMouseDown = (e: MouseEvent, marker: HTMLDivElement) => {
        isDragging = true;
        currentMarker = marker;
        this.document.addEventListener('mousemove', onMouseMove);
        this.document.addEventListener('mouseup', onMouseUp);
    };

    markerLeft.addEventListener('mousedown', (e) => onMouseDown(e, markerLeft));
    markerRight.addEventListener('mousedown', (e) => onMouseDown(e, markerRight));
  }
  
  private setExperienceRange(type: 'total' | 'relevant', min: number, max: number): void {
    const prefix = type === 'total' ? 'total_' : 'relevant_';
    const rangeIndicator = this.document.getElementById(`${prefix}rangeIndicator`);
    const markerLeft = this.document.getElementById(`${prefix}markerLeft`) as HTMLElement;
    const markerRight = this.document.getElementById(`${prefix}markerRight`) as HTMLElement;
    const labelLeft = this.document.getElementById(`${prefix}labelLeft`) as HTMLElement;
    const labelRight = this.document.getElementById(`${prefix}labelRight`) as HTMLElement;
    const filledSegment = this.document.getElementById(`${prefix}filledSegment`) as HTMLElement;
    
    if (!rangeIndicator || !markerLeft || !markerRight || !labelLeft || !labelRight || !filledSegment) return;
    
    const width = rangeIndicator.offsetWidth;
    const maxYears = type === 'total' ? 30 : this.jobForm.get('total_experience_max')?.value || 30;
    const markerWidth = markerLeft.offsetWidth || 12;
    const effectiveWidth = Math.max(1, width - markerWidth);
    
    const minPos = (Math.max(0, min) / maxYears) * effectiveWidth;
    const maxPos = (Math.min(max, maxYears) / maxYears) * effectiveWidth;

    markerLeft.style.left = `${minPos}px`;
    markerRight.style.left = `${maxPos}px`;
    labelLeft.style.left = `${minPos + markerWidth / 2}px`;
    labelLeft.textContent = `${min}y`;
    labelRight.style.left = `${maxPos + markerWidth / 2}px`;
    labelRight.textContent = `${max}y`;
    filledSegment.style.left = `${minPos + markerWidth / 2}px`;
    filledSegment.style.width = `${Math.max(0, maxPos - minPos)}px`;
  }

  private updateExperienceUI(): void {
    if (this.jobForm) {
      this.setExperienceRange('total', this.jobForm.value.total_experience_min, this.jobForm.value.total_experience_max);
      this.setExperienceRange('relevant', this.jobForm.value.relevant_experience_min, this.jobForm.value.relevant_experience_max);
    }
  }
  
  // --- Rich Text Editor Methods ---
  formatText(command: string): void {
    this.document.execCommand(command, false);
    this.checkEmpty('editor');
  }

  checkEmpty(id: string): void {
    const element = this.document.getElementById(id);
    if (element) {
      const isEmpty = !element.textContent?.trim() && !element.querySelector('img, li, table');
      element.setAttribute('data-empty', isEmpty.toString());
    }
  }

  // --- Popups and Cleanup ---
  showSuccessPopup(message: string) { this.popupMessage = message; this.popupType = 'success'; this.showPopup = true; setTimeout(() => this.closePopup(), 3000); }
  showErrorPopup(message: string) { this.popupMessage = message; this.popupType = 'error'; this.showPopup = true; setTimeout(() => this.closePopup(), 5000); }
  closePopup() { this.showPopup = false; }
  
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.sessionToken = undefined;
  }
}