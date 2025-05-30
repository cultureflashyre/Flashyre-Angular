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
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  jobForm: FormGroup;
  private searchTerms = new Subject<string>();
  suggestions: string[] = [];
  isLoading = false;
  showSuggestions = false;
  selectedFile: File | null = null;
  private readonly DEBOUNCE_DELAY = 300;
  currentStep: 'jobPost' | 'assessment' = 'jobPost';
  // Flag to disable submit button during API call
  isSubmitting: boolean = false;

  private jobData: JobDetails | AIJobResponse | null = null;
  private isViewInitialized = false;

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
      min_budget: [null, [Validators.required, Validators.min(0)]], // Changed initial to null for placeholder
      max_budget: [null, [Validators.required, Validators.min(0)]], // Changed initial to null for placeholder
      notice_period: ['', [Validators.required, Validators.maxLength(50)]],
      skills: [[], [Validators.required]],
      job_description: ['', [Validators.maxLength(5000)]], // Not required, but good to have in form
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

    // Check for unique_id in route params (for editing existing job post)
    const uniqueId = this.route.snapshot.paramMap.get('unique_id');
    if (uniqueId) {
      // Fetch existing job post data
    this.jobDescriptionService.getJobPost(uniqueId, this.corporateAuthService.getJWTToken()!).subscribe({
        next: (jobDetails) => {
          this.populateForm(jobDetails);
        },
        error: (error) => {
          this.snackBar.open(`Failed to load job post: ${error.message}`, 'Close', { duration: 5000 });
        }
      });
    }

    if (!this.corporateAuthService.isLoggedIn()) {
      this.snackBar.open('Please log in to create a job post.', 'Close', { duration: 5000 });
      this.router.navigate(['/login-corporate']);
      return;
    }

    this.setupSearch();

    const uniqueIdFromRoute = this.route.snapshot.paramMap.get('unique_id');
    if (uniqueIdFromRoute) {
      const token = this.corporateAuthService.getJWTToken();
      if (token) {
        this.jobDescriptionService.getJobPost(uniqueIdFromRoute, token).subscribe({
          next: (jobPost) => {
            this.jobData = jobPost;
            if (this.isViewInitialized) {
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
    if (min === 0 && max === 0) {
      return [0, 30];
    }
    return [min, max];
  }

  ngAfterViewInit(): void {
    this.isViewInitialized = true;
    if (this.jobData) {
      this.populateForm(this.jobData);
    }
    this.initializeSkillsInput(); // Initialize skills after view is ready
    this.initializeRange('total');
    this.initializeRange('relevant');
    this.updateExperienceUI();

    // Initialize the job description editor script functionality (if any external JS relies on DOM ready)
    // The inline script in HTML for the editor should run on its own.
    // Call checkEmpty to set initial placeholder state for editor
    this.checkEmpty('editor'); 
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

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      const allowedExtensions = ['.pdf', '.docx', '.txt', '.xml', '.csv', '.doc']; // .doc was in original accept
      const ext = this.selectedFile.name.toLowerCase().substring(this.selectedFile.name.lastIndexOf('.'));
      const maxSize = 10 * 1024 * 1024; 
      if (!allowedExtensions.includes(ext)) {
        this.snackBar.open(`Invalid file format. Supported: ${allowedExtensions.join(', ')}`, 'Close', { duration: 5000 });
        this.selectedFile = null;
        input.value = ''; 
      } else if (this.selectedFile.size > maxSize) {
        this.snackBar.open('File size exceeds 10MB limit.', 'Close', { duration: 5000 });
        this.selectedFile = null;
        input.value = '';
      }
    } else {
      this.selectedFile = null;
    }
  }

  private updateExperienceUI(): void {
    this.setExperienceRange('total', this.jobForm.value.total_experience_min, this.jobForm.value.total_experience_max);
    this.setExperienceRange('relevant', this.jobForm.value.relevant_experience_min, this.jobForm.value.relevant_experience_max);
  }

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
        this.jobData = response; 
        this.populateForm(response);
        this.snackBar.open('File uploaded and processed successfully.', 'Close', { duration: 3000 });
      },
      error: (error) => {
        console.error('File upload error:', error);
        this.snackBar.open(`File upload or processing failed: ${error.message || 'Unknown error'}`, 'Close', { duration: 5000 });
      }
    });
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
    let min_budget: number | null; // Allow null for initial state
    let max_budget: number | null; // Allow null for initial state
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
      workplace_type = jobDetails.workplace_type || 'Remote'; // Default if not provided
      [total_experience_min, total_experience_max] = this.adjustExperienceRange(minExp, maxExp);
      [relevant_experience_min, relevant_experience_max] = this.adjustExperienceRange(minExp, maxExp);
      budget_type = jobDetails.budget_type || 'Annually'; // Default if not provided
      min_budget = jobDetails.min_budget || null;
      max_budget = jobDetails.max_budget || null;
      notice_period = jobDetails.notice_period || '30 days'; // Default
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
      skills, // This will be handled by populateSkills for UI, but good to patch form value
      job_description,
      job_description_url: job_description_url_val,
      unique_id: unique_id_val
    });

    // Update UI elements not directly managed by formControlName or needing special handling
    this.populateSkills(skills); // Renders skill tags and syncs form skills
    this.setJobDescription(job_description); // Sets content of the editor
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

    // This ensures the `selectedTags` array within initializeSkillsInput is also in sync
    // if populateSkills is called after initializeSkillsInput has run.
    // However, initializeSkillsInput should derive selectedTags from the form.
    // The main thing is to update the form control.
    this.jobForm.patchValue({ skills: [...skills] }); // Ensure form is up-to-date

    // Then, build the UI from the skills array (which should now match the form)
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
        // Re-sync the internal `selectedTags` in initializeSkillsInput if it's stateful
        // Or, ensure initializeSkillsInput reads from the form upon next interaction
      });

      tag.appendChild(removeBtn);
      tagContainer.insertBefore(tag, tagInput);
    });
  }

  private setJobDescription(description: string): void {
    const editor = document.getElementById('editor') as HTMLDivElement;
    if (editor) {
      editor.innerHTML = description; // Set content
      this.checkEmpty('editor'); // Update placeholder visibility
    }
  }

  // ADDED: Method to update job_description form control from editor
  updateJobDescriptionFromEditor(event: Event): void {
    const editorContent = (event.target as HTMLDivElement).innerHTML;
    this.jobForm.patchValue({ job_description: editorContent });
    this.checkEmpty('editor'); // Also check empty on input
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

      const clampedMin = Math.max(0, Math.min(min, maxYears));
      const clampedMax = Math.max(clampedMin, Math.min(max, maxYears)); // Ensure max is not less than min

      // Adjust for marker width (e.g., 10px or 12px for marker.offsetWidth)
      const markerWidth = markerLeft.offsetWidth || 12; // Default if offsetWidth is 0
      const effectiveWidth = width - markerWidth;


      const minPos = (clampedMin / maxYears) * effectiveWidth;
      const maxPos = (clampedMax / maxYears) * effectiveWidth;

      markerLeft.style.left = `${minPos}px`;
      markerRight.style.left = `${maxPos}px`;
      
      // Adjust label position to be centered with marker
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
    // Use innerHTML for contenteditable to correctly assess emptiness with formatting
    const isEmpty = element.innerHTML.trim() === '' || element.innerHTML.trim() === '<br>';
    element.setAttribute('data-empty', isEmpty ? 'true' : 'false');
    if (isEmpty && element.hasAttribute('data-placeholder')) {
        // Placeholder is handled by CSS pseudo-element :before
    }
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
      return;
    }

    let isDragging = false;
    let currentMarker: HTMLDivElement | null = null;
    const maxYears = 30; 
    const markerWidth = markerLeft.offsetWidth || 12; // Get marker width once

    const updateUIFromMarkers = () => {
        const rect = rangeIndicator.getBoundingClientRect();
        if (rect.width <= 0) return; // Avoid division by zero if not rendered

        const effectiveWidth = rect.width - markerWidth; // Width available for marker centers to travel

        const leftPosPx = parseFloat(markerLeft.style.left) || 0;
        const rightPosPx = parseFloat(markerRight.style.left) || 0;
        
        const minYear = Math.round((leftPosPx / effectiveWidth) * maxYears);
        const maxYear = Math.round((rightPosPx / effectiveWidth) * maxYears);

        // Update form controls
        if (type === 'total') {
            this.jobForm.patchValue({
                total_experience_min: Math.min(minYear, maxYear), // Ensure min is not > max
                total_experience_max: Math.max(minYear, maxYear)
            }, { emitEvent: false });
        } else {
            this.jobForm.patchValue({
                relevant_experience_min: Math.min(minYear, maxYear),
                relevant_experience_max: Math.max(minYear, maxYear)
            }, { emitEvent: false });
        }

        // Update labels and filled segment
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
      let newLeftPx = e.clientX - rect.left - (markerWidth / 2); // Position for marker center

      const minBoundaryPx = 0;
      const maxBoundaryPx = rect.width - markerWidth;

      if (currentMarker === markerLeft) {
        const rightMarkerPosPx = parseFloat(markerRight.style.left) || maxBoundaryPx;
        newLeftPx = Math.max(minBoundaryPx, Math.min(newLeftPx, rightMarkerPosPx - markerWidth)); // Prevent overlap
      } else if (currentMarker === markerRight) {
        const leftMarkerPosPx = parseFloat(markerLeft.style.left) || minBoundaryPx;
        newLeftPx = Math.min(maxBoundaryPx, Math.max(newLeftPx, leftMarkerPosPx + markerWidth)); // Prevent overlap
      }
      
      newLeftPx = Math.max(minBoundaryPx, Math.min(newLeftPx, maxBoundaryPx)); // Clamp within bounds
      currentMarker.style.left = `${newLeftPx}px`;
      updateUIFromMarkers();
    };

    const onMouseUp = () => {
      if (isDragging) {
         updateUIFromMarkers(); // Final update
      }
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

    // Initial UI setup from form values
    if (type === 'total') {
      this.setExperienceRange('total', this.jobForm.value.total_experience_min, this.jobForm.value.total_experience_max);
    } else {
      this.setExperienceRange('relevant', this.jobForm.value.relevant_experience_min, this.jobForm.value.relevant_experience_max);
    }
    updateUIFromMarkers(); // Initial sync
  }

  private parseExperience(exp: string): [number, number] {
    const rangeMatch = exp.match(/(\d+)\s*-\s*(\d+)/); 
    if (rangeMatch) {
      const min = parseInt(rangeMatch[1]);
      const max = parseInt(rangeMatch[2]);
      return [min, max];
    }
    const singleMatch = exp.match(/(\d+)\s*years?/i); 
    if (singleMatch) {
      const singleExp = parseInt(singleMatch[1]);
      return [singleExp, singleExp];
    }
    return [0, 0]; 
  }

  private setupSearch(): void {
    this.searchTerms.pipe(
      debounceTime(this.DEBOUNCE_DELAY),
      distinctUntilChanged(),
      switchMap((query: string) => {
        if (!query) { // Handle empty query
          this.isLoading = false;
          this.showSuggestions = false;
          this.suggestions = [];
          return []; // Return empty observable or similar
        }
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
      this.isLoading = false; // Stop loading if query is cleared
      return;
    }
    this.searchTerms.next(query);
  }

  private async fetchLocationSuggestions(query: string): Promise<string[]> {
    await new Promise(resolve => setTimeout(resolve, 300)); // Shorter delay
    return this.getMockSuggestions(query);
  }

  private getMockSuggestions(query: string): string[] {
    query = query.toLowerCase();
    const cities = [
      'Multiple', 'New York, NY, USA', 'Los Angeles, CA, USA', 'Chicago, IL, USA',
      'Houston, TX, USA', 'Phoenix, AZ, USA', 'Philadelphia, PA, USA', 'San Antonio, TX, USA',
      'San Diego, CA, USA', 'Dallas, TX, USA', 'San Jose, CA, USA', 'London, UK',
      'Paris, France', 'Tokyo, Japan', 'Sydney, Australia', 'Toronto, Canada',
      'Bengaluru, India', 'Mumbai, India', 'Delhi, India', 'Pune, India'
    ];
    return cities.filter(city => city.toLowerCase().includes(query));
  }

  selectSuggestion(location: string): void {
    this.jobForm.patchValue({ location });
    // The input field value will be updated by Angular's form binding
    this.showSuggestions = false;
    this.suggestions = [];
  }

  // Modified to be called on (blur) of the input field
  handleOutsideClick(event: FocusEvent): void {
    // Hide suggestions if the related target (where focus is going)
    // is not within the suggestions container.
    // This is a bit tricky with blur, as click outside is more direct.
    // A simple timeout can often work for blur to allow click on suggestion.
    setTimeout(() => {
        if (this.suggestionsContainer && !this.suggestionsContainer.nativeElement.contains(document.activeElement)) {
            this.showSuggestions = false;
        }
    }, 150);
  }


  private initializeSkillsInput(): void {
    const tagInput = document.getElementById('tagInput') as HTMLInputElement;
    const tagContainer = document.getElementById('tagContainer') as HTMLDivElement;
    // IMPORTANT: Use a unique ID for skills suggestions if it conflicts with location suggestions
    const skillsSuggestionsDiv = document.getElementById('skillsSuggestions') as HTMLDivElement; 

    if (!tagInput || !tagContainer || !skillsSuggestionsDiv) {
      console.warn('Skill input related elements not found in DOM. Ensure "skillsSuggestions" div exists.');
      return;
    }
    
    // `selectedTags` should always reflect the form control's current value
    let selectedTags: string[] = [...(this.jobForm.get('skills')?.value || [])]; 
    let activeSuggestionIndex = -1;

    const availableTags = [ /* ... your extensive list of tags ... */ 
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
      // Update selectedTags from form before filtering, in case it changed programmatically
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
        item.className = 'suggestion-item'; // Ensure CSS for .suggestion-item applies
        item.textContent = suggestion;
        item.addEventListener('click', () => {
          addSkillTag(suggestion); // Renamed to avoid conflict
          tagInput.value = '';
          skillsSuggestionsDiv.style.display = 'none';
          tagInput.focus();
        });
        skillsSuggestionsDiv.appendChild(item);
      });

      skillsSuggestionsDiv.style.display = 'block';
      activeSuggestionIndex = -1;
    };

    const addSkillTag = (text: string) => { // Renamed
      selectedTags = [...(this.jobForm.get('skills')?.value || [])]; // Get current skills from form
      if (!text || selectedTags.includes(text)) return;
      
      selectedTags.push(text);
      this.jobForm.patchValue({ skills: [...selectedTags] }); // Update form

      // UI update (already handled by populateSkills, but this script manages its own tags)
      // This local script's addTag should also create the visual tag if populateSkills isn't called immediately
      const tag = document.createElement('div');
      tag.className = 'tag';
      const tagText = document.createElement('span');
      tagText.textContent = text;
      tag.appendChild(tagText);

      const removeBtn = document.createElement('button');
      removeBtn.textContent = '×';
      removeBtn.addEventListener('click', () => {
        tag.remove();
        // Update form when a tag is removed by its 'x' button
        const currentSkillsFromForm = [...(this.jobForm.get('skills')?.value || [])];
        this.jobForm.patchValue({ skills: currentSkillsFromForm.filter(s => s !== text) });
      });

      tag.appendChild(removeBtn);
      tagContainer.insertBefore(tag, tagInput);
    };

    const navigateAvailableSuggestions = (direction: 'up' | 'down') => { // Renamed
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
          currentSkills.pop(); // Remove last skill from array
          this.jobForm.patchValue({ skills: currentSkills }); // Update form
          // UI removal (the last tag in DOM)
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
    // Initial population of skill tags if form already has skills (e.g., on edit)
    this.populateSkills(this.jobForm.get('skills')?.value || []);
  }


  onSubmit(): void {
    if (this.currentStep === 'jobPost') {
      // Log if the form is valid
    console.log('Is Form Valid?', this.jobForm.valid);
    // Log all form values
    console.log('Form Values:', this.jobForm.value);
    // Log form-level errors (like experience range)
    console.log('Form Errors:', this.jobForm.errors);
    // Log errors for each field
    Object.keys(this.jobForm.controls).forEach(field => {
      const control = this.jobForm.get(field);
      if (control?.invalid) {
        console.log(`Field ${field} is invalid. Errors:`, control.errors);
      }
    });
      if (this.jobForm.invalid) {
        this.snackBar.open('Please fill all required fields correctly before proceeding.', 'Close', { duration: 5000 });
        console.log("Form Errors:", this.jobForm.errors);
        Object.keys(this.jobForm.controls).forEach(key => {
            const controlErrors = this.jobForm.get(key)?.errors;
            if (controlErrors != null) {
                console.log('Key control: ' + key + ', errors: ' + JSON.stringify(controlErrors));
            }
        });
        this.jobForm.markAllAsTouched(); 
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
          this.snackBar.open('Job post saved successfully. Proceeding to assessment setup.', 'Close', { duration: 3000 });
          this.jobForm.patchValue({ unique_id: response.unique_id });
          this.currentStep = 'assessment';
        },
        error: (error) => {
          console.error('Job post saving failed:', error);
          this.snackBar.open(`Job post saving failed: ${error.message || 'Unknown error'}`, 'Close', { duration: 5000 });
        }
      });
    } else if (this.currentStep === 'assessment') {
      this.snackBar.open('Assessment details submitted!', 'Close', { duration: 3000 });
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
      // Provide default values for reset
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

    // Clear UI for skills and job description
    this.populateSkills([]); // Clears skill tags and updates form
    this.setJobDescription('');
    
    this.updateExperienceUI(); // Reset sliders to default

    this.currentStep = 'jobPost';
    this.jobData = null;

    // Re-initialize skills input for a clean state if necessary,
    // though populateSkills([]) should handle the form control and UI.
    // If initializeSkillsInput has internal state not tied to the form, it might need a reset call.
    // For now, assume populateSkills is sufficient for resetting the skills aspect.
  }
}