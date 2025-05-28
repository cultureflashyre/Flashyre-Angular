import { Component, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { JobDescriptionService } from '../../services/job-description.service';
import { CorporateAuthService } from '../../services/corporate-auth.service';
import { JobDetails, AIJobResponse } from './types'; // Ensure these types are correctly defined and imported

@Component({
  selector: 'create-job-post-1st-page',
  templateUrl: './create-job-post-1st-page.component.html',
  styleUrls: ['./create-job-post-1st-page.component.css']
})
export class CreateJobPost1stPageComponent implements OnInit, AfterViewInit {
  @ViewChild('locationInput') locationInput!: ElementRef<HTMLInputElement>;
  @ViewChild('suggestionsContainer') suggestionsContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>; // For file upload

  jobForm: FormGroup;
  private searchTerms = new Subject<string>();
  suggestions: string[] = [];
  isLoading = false;
  showSuggestions = false;
  selectedFile: File | null = null;
  private readonly DEBOUNCE_DELAY = 300;
  // NEW: Property to track the current step of the job posting process
  currentStep: 'jobPost' | 'assessment' = 'jobPost'; // 'jobPost' is the default initial step

  // Properties to store job data for editing, similar to previous version analysis
  private jobData: JobDetails | AIJobResponse | null = null;
  private isViewInitialized = false; // Track view initialization

  constructor(
    private title: Title,
    private meta: Meta,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private jobDescriptionService: JobDescriptionService,
    private corporateAuthService: CorporateAuthService,
    private router: Router,
    private route: ActivatedRoute
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
      min_budget: [0, [Validators.required, Validators.min(0)]],
      max_budget: [0, [Validators.required, Validators.min(0)]],
      notice_period: ['', [Validators.required, Validators.maxLength(50)]],
      skills: [[], [Validators.required]], // Skills array
      job_description: ['', [Validators.maxLength(5000)]],
      job_description_url: ['', [Validators.maxLength(200)]],
      unique_id: [''] // To store the unique_id of the job post
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

    if (!this.corporateAuthService.isLoggedIn()) {
      this.snackBar.open('Please log in to create a job post.', 'Close', { duration: 5000 });
      this.router.navigate(['/login-corporate']);
      return; // Stop further execution if not logged in
    }

    this.setupSearch();

    // Fetch job post data if unique_id is provided (for editing/resuming a post)
    const uniqueIdFromRoute = this.route.snapshot.paramMap.get('unique_id');
    if (uniqueIdFromRoute) {
      const token = this.corporateAuthService.getJWTToken();
      if (token) {
        this.jobDescriptionService.getJobPost(uniqueIdFromRoute, token).subscribe({
          next: (jobPost) => {
            this.jobData = jobPost; // Store job data here
            if (this.isViewInitialized) { // Populate form if view is ready
              this.populateForm(jobPost);
            }
            this.snackBar.open('Job post data loaded successfully.', 'Close', { duration: 3000 });
          },
          error: (error) => {
            this.snackBar.open('Failed to load job post data. Please try again.', 'Close', { duration: 5000 });
            console.error('Error fetching job post:', error);
          }
        });
      } else {
        this.snackBar.open('Authentication required. Please log in.', 'Close', { duration: 5000 });
        this.router.navigate(['/login-corporate']);
      }
    }
  }

  private adjustExperienceRange(min: number, max: number): [number, number] {
    // If both min and max are 0, it means no experience was parsed, default to 0-30 years
    if (min === 0 && max === 0) {
      return [0, 30];
    }
    return [min, max];
  }

  ngAfterViewInit(): void {
    this.isViewInitialized = true; // Set flag when view is initialized
    if (this.jobData) { // If job data was loaded in ngOnInit, populate form now
      this.populateForm(this.jobData);
    }
    this.initializeSkillsInput();
    this.initializeRange('total');
    this.initializeRange('relevant');
    this.updateExperienceUI(); // Update UI based on initial form values
  }

  private experienceRangeValidator(form: FormGroup): { [key: string]: any } | null {
    const totalMin = form.get('total_experience_min')?.value;
    const totalMax = form.get('total_experience_max')?.value;
    const relevantMin = form.get('relevant_experience_min')?.value;
    const relevantMax = form.get('relevant_experience_max')?.value;

    if (totalMin > totalMax) {
      return { invalidTotalExperience: true };
    }
    if (relevantMin > relevantMax) {
      return { invalidRelevantExperience: true };
    }
    return null;
  }

  // Existing onFileSelected method - keeps selected file and performs validation
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      const allowedExtensions = ['.pdf', '.docx', '.txt', '.xml', '.csv'];
      const ext = this.selectedFile.name.toLowerCase().substring(this.selectedFile.name.lastIndexOf('.'));
      const maxSize = 10 * 1024 * 1024; // 10 MB
      if (!allowedExtensions.includes(ext)) {
        this.snackBar.open(`Invalid file format. Supported: ${allowedExtensions.join(', ')}`, 'Close', { duration: 5000 });
        this.selectedFile = null;
        input.value = ''; // Clear file input value
      } else if (this.selectedFile.size > maxSize) {
        this.snackBar.open('File size exceeds 10MB limit.', 'Close', { duration: 5000 });
        this.selectedFile = null;
        input.value = ''; // Clear file input value
      }
    } else {
      this.selectedFile = null;
    }
  }

  private updateExperienceUI(): void {
    this.setExperienceRange('total', this.jobForm.value.total_experience_min, this.jobForm.value.total_experience_max);
    this.setExperienceRange('relevant', this.jobForm.value.relevant_experience_min, this.jobForm.value.relevant_experience_max);
  }

  // Existing uploadFile method - uploads file and populates form from AI response
  uploadFile(): void {
    if (!this.selectedFile) {
      this.snackBar.open('Please select a file to upload.', 'Close', { duration: 5000 });
      return;
    }
    const token = this.corporateAuthService.getJWTToken();
    if (!token) {
      this.snackBar.open('Authentication required. Please log in.', 'Close', { duration: 5000 });
      this.router.navigate(['/login-corporate']);
      return;
    }
    this.jobDescriptionService.uploadFile(this.selectedFile, token).subscribe({
      next: (response) => {
        // Populate form fields based on the AI response, including unique_id and job_description_url
        this.jobData = response; // Store the AI response
        this.populateForm(response);
        this.snackBar.open('File uploaded and processed successfully.', 'Close', { duration: 3000 });
      },
      error: (error) => {
        console.error('File upload error:', error);
        this.snackBar.open(`File upload or processing failed: ${error.message || 'Unknown error'}`, 'Close', { duration: 5000 });
      }
    });
  }

  // Populates the form fields based on fetched JobDetails or AIJobResponse
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
    let min_budget: number;
    let max_budget: number;
    let notice_period: string;
    let skills: string[];
    let job_description: string;
    let unique_id_val: string = '';
    let job_description_url_val: string = '';

    if ('job_details' in jobData) {
      // Handle AIJobResponse (from file upload processing)
      const aiJobData = jobData as AIJobResponse;
      const jobDetails = aiJobData.job_details;
      const [minExp, maxExp] = this.parseExperience(jobDetails.experience?.value || '0-0 years');

      role = jobDetails.job_titles[0]?.value || '';
      location = jobDetails.location || '';
      job_type = this.mapJobType(jobDetails.job_titles[0]?.value || '');
      workplace_type = jobDetails.workplace_type || 'Remote';
      total_experience_min = minExp;
      total_experience_max = maxExp;
      // Adjust total experience if min/max are 0 (no specific exp found)
      [total_experience_min, total_experience_max] = this.adjustExperienceRange(total_experience_min, total_experience_max);
      relevant_experience_min = Math.max(0, minExp); // Relevant experience usually starts from total min or higher
      relevant_experience_max = maxExp; // Relevant experience usually caps at total max
      // Adjust relevant experience if min/max are 0
      [relevant_experience_min, relevant_experience_max] = this.adjustExperienceRange(relevant_experience_min, relevant_experience_max);
      budget_type = jobDetails.budget_type || 'Annually';
      min_budget = jobDetails.min_budget || 0;
      max_budget = jobDetails.max_budget || 0;
      notice_period = jobDetails.notice_period || '30 days';
      skills = [
        ...(jobDetails.skills.primary || []).map(s => s.skill),
        ...(jobDetails.skills.secondary || []).map(s => s.skill)
      ];
      job_description = jobDetails.job_description || '';
      unique_id_val = aiJobData.unique_id || ''; // Get unique_id from AI response
      job_description_url_val = aiJobData.file_url || ''; // Get file_url from AI response
    } else {
      // Handle JobDetails (from fetching an existing job post)
      const jobDetails = jobData as JobDetails;

      role = jobDetails.role;
      location = jobDetails.location;
      job_type = jobDetails.job_type;
      workplace_type = jobDetails.workplace_type;
      total_experience_min = jobDetails.total_experience_min;
      total_experience_max = jobDetails.total_experience_max;
      // Adjust total experience if min/max are 0 (might be saved as 0-0)
      [total_experience_min, total_experience_max] = this.adjustExperienceRange(total_experience_min, total_experience_max);
      relevant_experience_min = jobDetails.relevant_experience_min;
      relevant_experience_max = jobDetails.relevant_experience_max;
      // Adjust relevant experience if min/max are 0
      [relevant_experience_min, relevant_experience_max] = this.adjustExperienceRange(relevant_experience_min, relevant_experience_max);
      budget_type = jobDetails.budget_type;
      min_budget = jobDetails.min_budget;
      max_budget = jobDetails.max_budget;
      notice_period = jobDetails.notice_period;
      // Combine primary and secondary skills into a single array for the form
      skills = [...jobDetails.skills.primary.map(s => s.skill), ...jobDetails.skills.secondary.map(s => s.skill)];
      job_description = jobDetails.job_description;
      unique_id_val = jobDetails.unique_id || ''; // Get unique_id from existing job post
      job_description_url_val = jobDetails.job_description_url || '';
    }

    // Patch form values
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
      skills, // This directly updates the Reactive Form control for skills
      job_description,
      job_description_url: job_description_url_val,
      unique_id: unique_id_val
    });

    // Manually update specific DOM elements not directly bound via formControlName
    this.setInputValue('Role-Input-Field', role);
    this.setInputValue('location', location);
    this.setRadioButton('job_type', job_type);
    this.setRadioButton('workplace_type', workplace_type);
    this.setRadioButton('budget_type', budget_type);
    this.setInputValue('min-budget-input-field', min_budget.toString());
    this.setInputValue('max-budget-input', max_budget.toString());
    this.setInputValue('notice-period-input-filed', notice_period);
    this.populateSkills(skills); // This function renders the skill tags in the UI
    this.setJobDescription(job_description);
    this.setExperienceRange('total', total_experience_min, total_experience_max);
    this.setExperienceRange('relevant', relevant_experience_min, relevant_experience_max);
  }

  // Helper functions to update DOM elements (kept as is)
  private setTextField(id: string, value: string): void {
    const element = document.getElementById(id) as HTMLSpanElement;
    if (element) {
      element.textContent = value;
    }
  }

  private setInputValue(id: string, value: string): void {
    const element = document.getElementById(id) as HTMLInputElement;
    if (element) {
      element.value = value;
    }
  }

  private setRadioButton(groupName: string, value: string): void {
    const radio = document.querySelector(`input[name="${groupName}"][value="${value}"]`) as HTMLInputElement;
    if (radio) {
      radio.checked = true;
    }
  }

  /**
   * Updates the UI to display skill tags based on the provided array of skills.
   * This method manipulates the DOM directly to create/remove tags.
   * It also ensures the form control's `skills` value is synchronized.
   */
  private populateSkills(skills: string[]): void {
    const tagContainer = document.getElementById('tagContainer') as HTMLDivElement;
    const tagInput = document.getElementById('tagInput') as HTMLInputElement;
    if (!tagContainer || !tagInput) {
      console.warn('Skills input or container not found.');
      return;
    }

    // Remove ONLY the existing skill tags (elements with class 'tag'), preserving the input field
    const existingTags = tagContainer.querySelectorAll('.tag');
    existingTags.forEach(tag => tag.remove());

    // Add new skill tags to the UI
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
        // Remove from the form's skills array
        // Use `this.jobForm.get('skills')?.value` to ensure we get the current array state
        const currentFormSkills: string[] = this.jobForm.get('skills')?.value || [];
        const updatedSkills = currentFormSkills.filter(s => s !== skill);
        this.jobForm.patchValue({ skills: updatedSkills });
        // After removing a tag, re-sync the internal `selectedTags` for `initializeSkillsInput`
        this.initializeSkillsInput();
      });

      tag.appendChild(removeBtn);
      // Insert the new tag before the input field
      tagContainer.insertBefore(tag, tagInput);
    });

    // IMPORTANT: Finally, patch the form control with the provided skills array.
    // This ensures the Reactive Form model is in sync with the skills passed to populateSkills.
    this.jobForm.patchValue({ skills });
  }

  private setJobDescription(description: string): void {
    const editor = document.getElementById('editor') as HTMLDivElement;
    if (editor) {
      editor.innerHTML = description;
      this.checkEmpty('editor');
    }
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
      const width = rect.width > 0 ? rect.width : rangeIndicator.offsetWidth; // Fallback for width
      const maxYears = 30; // 0-30 years range

      // Clamp min/max values to ensure they are within 0-30
      const clampedMin = Math.max(0, Math.min(min, maxYears));
      const clampedMax = Math.max(0, Math.min(max, maxYears));

      // Calculate positions, adjusting for marker visual size (approx 10px)
      const minPos = (clampedMin / maxYears) * (width - 10);
      const maxPos = (clampedMax / maxYears) * (width - 10);

      markerLeft.style.left = `${minPos}px`;
      markerRight.style.left = `${maxPos}px`;
      labelLeft.style.left = `${minPos + 5}px`;
      labelLeft.textContent = `${clampedMin}yrs`;
      labelRight.style.left = `${maxPos + 5}px`;
      labelRight.textContent = `${clampedMax}yrs`;
      filledSegment.style.left = `${minPos + 5}px`;
      filledSegment.style.width = `${maxPos - minPos}px`;
    }
  }

  private checkEmpty(id: string): void {
    const element = document.getElementById(id) as HTMLDivElement;
    if (!element) return;
    const isEmpty = element.textContent?.trim() === '';
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

    if (!rangeIndicator || !markerLeft || !markerRight || !labelLeft || !labelRight || !filledSegment) {
      // console.warn(`Missing elements for range initialization for type: ${type}`);
      return; // Exit if elements are not found
    }

    let isDragging = false;
    let currentMarker: HTMLDivElement | null = null;

    const updateFilledSegment = () => {
      const leftPos = parseFloat(markerLeft.style.left);
      const rightPos = parseFloat(markerRight.style.left);
      filledSegment.style.left = `${leftPos + 5}px`; // Adjust by marker half-width
      filledSegment.style.width = `${rightPos - leftPos}px`;
    };

    const updateLabelPosition = (marker: HTMLDivElement, label: HTMLDivElement) => {
      const markerPos = parseFloat(marker.style.left);
      label.style.left = `${markerPos + 5}px`; // Adjust label position
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging || !currentMarker || !rangeIndicator) return;

      const rect = rangeIndicator.getBoundingClientRect();
      // Calculate newLeft, considering the marker's own width to keep its center on the pointer
      let newLeft = e.clientX - rect.left - (currentMarker.offsetWidth / 2);

      const minLeftBoundary = 0;
      const maxRightBoundary = rect.width - currentMarker.offsetWidth;

      if (currentMarker === markerLeft) {
        newLeft = Math.max(minLeftBoundary, Math.min(newLeft, parseFloat(markerRight.style.left) - currentMarker.offsetWidth));
      } else if (currentMarker === markerRight) {
        newLeft = Math.min(maxRightBoundary, Math.max(newLeft, parseFloat(markerLeft.style.left) + currentMarker.offsetWidth));
      }

      currentMarker.style.left = `${newLeft}px`;
      updateFilledSegment();
      updateLabelPosition(currentMarker, currentMarker === markerLeft ? labelLeft : labelRight);

      const trackWidth = rect.width - currentMarker.offsetWidth;
      const maxYears = 30; // The total range (0-30 years)

      // Calculate year values based on position
      const minYear = Math.round((parseFloat(markerLeft.style.left) / trackWidth) * maxYears);
      const maxYear = Math.round((parseFloat(markerRight.style.left) / trackWidth) * maxYears);

      // Update form values
      if (type === 'total') {
        this.jobForm.patchValue({
          total_experience_min: minYear,
          total_experience_max: maxYear
        }, { emitEvent: false }); // Avoid infinite loop with UI update
      } else {
        this.jobForm.patchValue({
          relevant_experience_min: minYear,
          relevant_experience_max: maxYear
        }, { emitEvent: false }); // Avoid infinite loop with UI update
      }
      labelLeft.textContent = `${minYear}yrs`;
      labelRight.textContent = `${maxYear}yrs`;
    };

    const onMouseUp = () => {
      isDragging = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    const onMouseDown = (e: MouseEvent, marker: HTMLDivElement) => {
      e.preventDefault(); // Prevent text selection or other default drag behaviors
      isDragging = true;
      currentMarker = marker;
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    };

    markerLeft.addEventListener('mousedown', (e) => onMouseDown(e, markerLeft));
    markerRight.addEventListener('mousedown', (e) => onMouseDown(e, markerRight));

    // Initial positioning based on current form values
    if (type === 'total') {
      this.setExperienceRange('total', this.jobForm.value.total_experience_min, this.jobForm.value.total_experience_max);
    } else {
      this.setExperienceRange('relevant', this.jobForm.value.relevant_experience_min, this.jobForm.value.relevant_experience_max);
    }
  }

  private parseExperience(exp: string): [number, number] {
    const rangeMatch = exp.match(/(\d+)-(\d+)/); // e.g., "3-5 years"
    if (rangeMatch) {
      const min = parseInt(rangeMatch[1]);
      const max = parseInt(rangeMatch[2]);
      return [min, max];
    }
    const singleMatch = exp.match(/(\d+)\s*years?/i); // e.g., "5 years" or "5year"
    if (singleMatch) {
      const singleExp = parseInt(singleMatch[1]);
      return [singleExp, singleExp];
    }
    return [0, 0]; // Default if no specific experience is found
  }

  private setupSearch(): void {
    this.searchTerms.pipe(
      debounceTime(this.DEBOUNCE_DELAY),
      distinctUntilChanged(),
      switchMap((query: string) => {
        this.isLoading = true;
        return this.fetchLocationSuggestions(query);
      })
    ).subscribe({
      next: (suggestions) => {
        this.suggestions = suggestions;
        this.showSuggestions = suggestions.length > 0;
        this.isLoading = false;
      },
      error: (error) => {
        this.snackBar.open('Failed to fetch location suggestions.', 'Close', { duration: 5000 });
        this.suggestions = [];
        this.showSuggestions = false;
        this.isLoading = false;
      }
    });
  }

  onInput(event: Event): void {
    const query = (event.target as HTMLInputElement).value.trim();
    if (query.length === 0) {
      this.showSuggestions = false;
      this.suggestions = [];
      return;
    }
    this.searchTerms.next(query);
  }

  private async fetchLocationSuggestions(query: string): Promise<string[]> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return this.getMockSuggestions(query);
  }

  private getMockSuggestions(query: string): string[] {
    query = query.toLowerCase();
    const cities = [
      'Multiple', 'New York, NY, USA', 'Los Angeles, CA, USA', 'Chicago, IL, USA',
      'Houston, TX, USA', 'Phoenix, AZ, USA', 'Philadelphia, PA, USA', 'San Antonio, TX, USA',
      'San Diego, CA, USA', 'Dallas, TX, USA', 'San Jose, CA, USA', 'London, UK',
      'Paris, France', 'Tokyo, Japan', 'Sydney, Australia', 'Toronto, Canada'
    ];
    return cities.filter(city => city.toLowerCase().includes(query));
  }

  selectSuggestion(location: string): void {
    this.jobForm.patchValue({ location });
    this.setInputValue('location', location); // Update visible input field
    this.showSuggestions = false;
    this.suggestions = [];
  }

  handleOutsideClick(event: MouseEvent): void {
    const target = event.target as Node;
    if (
      this.suggestionsContainer &&
      !this.suggestionsContainer.nativeElement.contains(target) &&
      this.locationInput && // Ensure locationInput is defined
      target !== this.locationInput.nativeElement
    ) {
      this.showSuggestions = false;
    }
  }

  /**
   * Initializes the skill tag input functionality, including suggestions,
   * adding/removing tags, and keyboard navigation.
   * This is a self-contained unit that directly interacts with the DOM.
   */
  private initializeSkillsInput(): void {
    const tagInput = document.getElementById('tagInput') as HTMLInputElement;
    const tagContainer = document.getElementById('tagContainer') as HTMLDivElement;
    const suggestionsDiv = document.getElementById('suggestions') as HTMLDivElement; // Renamed for clarity to avoid conflict with `suggestions` property

    if (!tagInput || !tagContainer || !suggestionsDiv) {
      console.warn('Skill input related elements not found in DOM.');
      return;
    }

    // Initialize selectedTags with the current form value. This is crucial for editing mode.
    // When populateForm runs, it updates jobForm.skills. Then, when ngAfterViewInit calls
    // initializeSkillsInput, this line ensures selectedTags correctly reflects the loaded data.
    let selectedTags: string[] = [...this.jobForm.value.skills];
    let activeSuggestionIndex = -1;

    const availableTags = [
      'JavaScript', 'HTML', 'CSS', 'React', 'Vue', 'Angular',
      'Node.js', 'TypeScript', 'Python', 'Java', 'PHP', 'Ruby',
      'Swift', 'Kotlin', 'Go', 'Rust', 'C#', 'C++', 'MongoDB',
      'MySQL', 'PostgreSQL', 'Redis', 'GraphQL', 'REST API',
      'Machine Learning', 'Artificial Intelligence', 'Data Science', 'Cloud Computing',
      'AWS', 'Azure', 'Google Cloud Platform', 'DevOps', 'CI/CD',
      'Docker', 'Kubernetes', 'Cybersecurity', 'Blockchain', 'Mobile Development',
      'Frontend Development', 'Backend Development', 'Full-stack Development',
      'UI/UX Design', 'QA Testing', 'Agile Methodologies', 'Scrum', 'Project Management'
    ];

    const filterSuggestions = (input: string) => {
      if (!input) return [];
      const inputLower = input.toLowerCase();
      return availableTags.filter(tag =>
        tag.toLowerCase().includes(inputLower) && !selectedTags.includes(tag)
      );
    };

    const showSuggestions = (filteredSuggestions: string[]) => {
      suggestionsDiv.innerHTML = '';
      if (filteredSuggestions.length === 0) {
        suggestionsDiv.style.display = 'none';
        return;
      }

      filteredSuggestions.forEach((suggestion, index) => {
        const item = document.createElement('div');
        item.className = 'suggestion-item';
        item.textContent = suggestion;
        item.addEventListener('click', () => {
          addTag(suggestion);
          tagInput.value = '';
          suggestionsDiv.style.display = 'none';
          tagInput.focus();
        });
        suggestionsDiv.appendChild(item);
      });

      suggestionsDiv.style.display = 'block';
      activeSuggestionIndex = -1; // Reset active suggestion
    };

    const addTag = (text: string) => {
      if (!text || selectedTags.includes(text)) return;
      selectedTags.push(text);
      this.jobForm.patchValue({ skills: [...selectedTags] }); // Create a new array reference to trigger change detection

      const tag = document.createElement('div');
      tag.className = 'tag';
      const tagText = document.createElement('span');
      tagText.textContent = text;
      tag.appendChild(tagText);

      const removeBtn = document.createElement('button');
      removeBtn.textContent = '×';
      removeBtn.addEventListener('click', () => {
        tag.remove();
        selectedTags = selectedTags.filter(t => t !== text);
        this.jobForm.patchValue({ skills: [...selectedTags] }); // Update form control
      });

      tag.appendChild(removeBtn);
      tagContainer.insertBefore(tag, tagInput);
    };

    const navigateSuggestions = (direction: 'up' | 'down') => {
      const items = suggestionsDiv.querySelectorAll('.suggestion-item');
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
      const filteredSuggestions = filterSuggestions(tagInput.value);
      showSuggestions(filteredSuggestions);
    });

    tagInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const items = suggestionsDiv.querySelectorAll('.suggestion-item');
        if (activeSuggestionIndex >= 0 && activeSuggestionIndex < items.length) {
          addTag(items[activeSuggestionIndex].textContent || '');
        } else if (tagInput.value.trim()) { // Only add if input has non-empty text
          addTag(tagInput.value.trim());
        }
        tagInput.value = '';
        suggestionsDiv.style.display = 'none';
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        navigateSuggestions('down');
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        navigateSuggestions('up');
      } else if (e.key === 'Backspace' && !tagInput.value) {
        const lastIndex = selectedTags.length - 1;
        if (lastIndex >= 0) {
          // No need to use `lastTag` variable here, just pop from `selectedTags`
          selectedTags.pop();
          this.jobForm.patchValue({ skills: [...selectedTags] });
          const tags = tagContainer.querySelectorAll('.tag');
          if (tags.length > 0) {
            tags[tags.length - 1].remove(); // Remove the last visible tag
          }
        }
      } else if (e.key === 'Escape') {
        suggestionsDiv.style.display = 'none';
      }
    });

    document.addEventListener('click', (e) => {
      if (!tagContainer.contains(e.target as Node) && !suggestionsDiv.contains(e.target as Node)) {
        suggestionsDiv.style.display = 'none';
      }
    });

    tagContainer.addEventListener('click', (e) => {
      if (e.target === tagContainer) {
        tagInput.focus();
      }
    });

    // We do NOT call populateSkills here.
    // `populateForm` calls `populateSkills` when data is loaded.
    // `resetForm` calls `initializeSkillsInput` (which sets `selectedTags` based on the form's new `[]` state)
    // and then calls `populateSkills` if needed (though it also clears tags directly).
    // The initial rendering of tags is handled by `populateSkills` triggered by `populateForm`.
  }

  // NEW: Renamed submitJobPost to onSubmit for consistent multi-step handling
  onSubmit(): void {
    if (this.currentStep === 'jobPost') {
      // Logic for submitting the job post details (Step 1)
      if (this.jobForm.invalid) {
        this.snackBar.open('Please fill all required fields correctly before proceeding.', 'Close', { duration: 5000 });
        this.jobForm.markAllAsTouched(); // Mark all controls as touched to show validation errors
        return;
      }

      const token = this.corporateAuthService.getJWTToken();
      if (!token) {
        this.snackBar.open('Authentication required. Please log in.', 'Close', { duration: 5000 });
        this.router.navigate(['/login-corporate']);
        return;
      }

      const formValues = this.jobForm.value;
      const jobDetails: JobDetails = {
        ...formValues,
        skills: {
          // Split skills into primary and secondary as required by the backend
          primary: formValues.skills.slice(0, Math.ceil(formValues.skills.length / 2)).map((skill: string) => ({
            skill,
            skill_confidence: 0.9, // Default confidence
            type_confidence: 0.9 // Default confidence
          })),
          secondary: formValues.skills.slice(Math.ceil(formValues.skills.length / 2)).map((skill: string) => ({
            skill,
            skill_confidence: 0.8, // Default confidence
            type_confidence: 0.8 // Default confidence
          }))
        }
      };

      this.jobDescriptionService.saveJobPost(jobDetails, token).subscribe({
        next: (response) => {
          this.snackBar.open('Job post saved successfully. Proceeding to assessment setup.', 'Close', { duration: 3000 });
          // Ensure unique_id is updated in the form, especially for new posts where the backend assigns it
          this.jobForm.patchValue({ unique_id: response.unique_id });
          this.currentStep = 'assessment'; // Move to the next step: assessment
        },
        error: (error) => {
          console.error('Job post saving failed:', error);
          this.snackBar.open(`Job post saving failed: ${error.message || 'Unknown error'}`, 'Close', { duration: 5000 });
        }
      });
    } else if (this.currentStep === 'assessment') {
      // Logic for submitting assessment details (Step 2)
      // This section would contain calls to an assessment service or direct submission logic
      // For now, it's a placeholder.
      this.snackBar.open('Assessment details submitted!', 'Close', { duration: 3000 });
      // After assessment is submitted, reset the form and navigate to a confirmation page
      this.resetForm();
      this.router.navigate(['/job-posted']); // Navigate to a success/confirmation page
    }
  }

  // NEW: Renamed cancelJobPost to onCancel for consistent multi-step handling
  onCancel(): void {
    if (this.currentStep === 'assessment') {
      // If currently on assessment step, go back to job post form to allow editing
      this.snackBar.open('Returning to job post editing.', 'Close', { duration: 2000 });
      this.currentStep = 'jobPost';
    } else if (this.currentStep === 'jobPost') {
      // If on job post step, cancel the entire process and navigate to dashboard
      this.snackBar.open('Job post creation cancelled.', 'Close', { duration: 3000 });
      this.resetForm(); // Clear the form
      this.router.navigate(['/dashboard']); // Navigate away
    }
  }

  resetForm(): void {
    // Reset the Reactive Form to its initial state
    this.jobForm.reset();
    // Manually set default values for controls that might not reset as expected or need specific defaults
    this.jobForm.patchValue({
      role: '',
      location: '',
      job_type: '',
      workplace_type: '',
      total_experience_min: 0,
      total_experience_max: 30, // Default to full range
      relevant_experience_min: 0,
      relevant_experience_max: 30, // Default to full range
      budget_type: '',
      min_budget: 0,
      max_budget: 0,
      notice_period: '',
      skills: [], // Ensure skills array is empty
      job_description: '',
      job_description_url: '',
      unique_id: ''
    });

    // Clear the selected file and reset the file input element in the DOM
    this.selectedFile = null;
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }

    // Clear any displayed skill tags in the UI
    const tagContainer = document.getElementById('tagContainer') as HTMLDivElement;
    if (tagContainer) {
      const tags = tagContainer.querySelectorAll('.tag');
      tags.forEach(tag => tag.remove());
      // Re-initialize skills input to ensure its internal state (selectedTags array) is also cleared
      // This will set selectedTags inside initializeSkillsInput to an empty array from the form's reset state.
      this.initializeSkillsInput();
    }

    // Reset job description editor
    this.setJobDescription('');

    // Update the experience range UI to reflect the reset values (0-30 years)
    this.updateExperienceUI();

    // Ensure the step is back to 'jobPost' if a full reset happens
    this.currentStep = 'jobPost';

    // Clear any stored job data as the form has been reset
    this.jobData = null;
  }
}