import { Component, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { JobDescriptionService } from '../../services/job-description.service';
import { CorporateAuthService } from '../../services/corporate-auth.service';
import { JobDetails, AIJobResponse } from './types';


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
  private jobData: JobDetails | AIJobResponse | null = null; // Store job data
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

  if (!this.corporateAuthService.isLoggedIn()) {
    this.snackBar.open('Please log in to create a job post.', 'Close', { duration: 5000 });
    this.router.navigate(['/login-corporate']);
  }

  this.setupSearch();

  const uniqueId = this.route.snapshot.paramMap.get('unique_id');
  if (uniqueId) {
    const token = this.corporateAuthService.getJWTToken();
    if (token) {
      this.jobDescriptionService.getJobPost(uniqueId, token).subscribe({
        next: (jobPost) => {
          this.jobData = jobPost;
          if (this.isViewInitialized) {
            this.populateForm(jobPost);
          }
        },
        error: (error) => {
          this.snackBar.open('Failed to load job post data.', 'Close', { duration: 5000 });
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
  this.initializeSkillsInput();
  this.initializeRange('total');
  this.initializeRange('relevant');
  this.updateExperienceUI();
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

  formatText(type: string) {
    const editor = document.getElementById('editor');
    if (editor) {
        editor.focus();
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
            const selectedText = selection.toString();
            if (type === 'list' || selectedText.length > 0) {
                switch (type) {
                    case 'bold': document.execCommand('bold', false, null); break;
                    case 'italic': document.execCommand('italic', false, null); break;
                    case 'underline': document.execCommand('underline', false, null); break;
                    case 'list': document.execCommand('insertUnorderedList', false, null); break;
                    case 'highlight': document.execCommand('backColor', false, '#fff3cd'); break;
                }
            }
        }
    }
}
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      const allowedExtensions = ['.pdf', '.docx', '.txt', '.xml', '.csv'];
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

//   testExperienceRange(totalMin: number, totalMax: number, relevantMin: number, relevantMax: number): void {
//   const mockJobData: JobDetails = {
//     role: 'Test Role',
//     location: 'Test Location',
//     job_type: 'Permanent',
//     workplace_type: 'Remote',
//     total_experience_min: totalMin,
//     total_experience_max: totalMax,
//     relevant_experience_min: relevantMin,
//     relevant_experience_max: relevantMax,
//     budget_type: 'Annually',
//     min_budget: 0,
//     max_budget: 0,
//     notice_period: '30 days',
//     skills: {
//   primary: [
//     { skill: 'JavaScript', skill_confidence: 0.9, type_confidence: 0.9 },
//     { skill: 'Python', skill_confidence: 0.9, type_confidence: 0.9 }
//   ],
//   secondary: [
//     { skill: 'HTML', skill_confidence: 0.8, type_confidence: 0.8 },
//     { skill: 'CSS', skill_confidence: 0.8, type_confidence: 0.8 }
//   ]
// },
//     job_description: 'Test description',
//     unique_id: 'test-unique-id',
//     job_description_url: '',
//     status: 'draft'
//   };
//   this.populateForm(mockJobData);
// }

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
        this.jobForm.patchValue({ job_description_url: response.file_url, unique_id: response.unique_id });
        this.populateForm(response);
        this.snackBar.open('File uploaded and processed successfully.', 'Close', { duration: 3000 });
      },
      error: (error) => {
        console.error('File upload error:', error);
        this.snackBar.open(`File upload or processing failed: ${error.message}`, 'Close', { duration: 5000 });
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
  let min_budget: number;
  let max_budget: number;
  let notice_period: string;
  let skills: string[];
  let job_description: string;

  if ('job_details' in jobData) {
    // Handle AIJobResponse
    const aiJobData = jobData as AIJobResponse;
    const jobDetails = aiJobData.job_details;
    const [minExp, maxExp] = this.parseExperience(jobDetails.experience?.value || '0-0 years');
    role = jobDetails.job_titles[0]?.value || 'Unknown';
    location = jobDetails.location || 'Unknown';
    job_type = this.mapJobType(jobDetails.job_titles[0]?.value || '');
    workplace_type = jobDetails.workplace_type || 'Remote';
    total_experience_min = minExp;
    total_experience_max = maxExp;
    // Adjust total experience if both min and max are 0
    [total_experience_min, total_experience_max] = this.adjustExperienceRange(total_experience_min, total_experience_max);
    relevant_experience_min = Math.max(0, minExp - 1);
    relevant_experience_max = Math.min(maxExp, minExp + 2);
    // Adjust relevant experience if both min and max are 0
    [relevant_experience_min, relevant_experience_max] = this.adjustExperienceRange(relevant_experience_min, relevant_experience_max);
    budget_type = jobDetails.budget_type || 'Annually';
    min_budget = jobDetails.min_budget || 0;
    max_budget = jobDetails.max_budget || 0;
    notice_period = jobDetails.notice_period || '30 days';
    skills = jobDetails.skills.primary.map(s => s.skill).concat(jobDetails.skills.secondary.map(s => s.skill));
    job_description = jobDetails.job_description || '';
  } else {
    // Handle JobDetails
    const jobDetails = jobData as JobDetails;
    role = jobDetails.role;
    location = jobDetails.location;
    job_type = jobDetails.job_type;
    workplace_type = jobDetails.workplace_type;
    total_experience_min = jobDetails.total_experience_min;
    total_experience_max = jobDetails.total_experience_max;
    // Adjust total experience if both min and max are 0
    [total_experience_min, total_experience_max] = this.adjustExperienceRange(total_experience_min, total_experience_max);
    relevant_experience_min = jobDetails.relevant_experience_min;
    relevant_experience_max = jobDetails.relevant_experience_max;
    // Adjust relevant experience if both min and max are 0
    [relevant_experience_min, relevant_experience_max] = this.adjustExperienceRange(relevant_experience_min, relevant_experience_max);
    budget_type = jobDetails.budget_type;
    min_budget = jobDetails.min_budget;
    max_budget = jobDetails.max_budget;
    notice_period = jobDetails.notice_period;
    skills = jobDetails.skills.primary.map(s => s.skill).concat(jobDetails.skills.secondary.map(s => s.skill));
    job_description = jobDetails.job_description;
  }

  // Populate form fields
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
    unique_id: 'unique_id' in jobData ? (jobData as AIJobResponse).unique_id : (jobData as JobDetails).unique_id
  });

  // Update DOM elements
  this.setInputValue('Role-Input-Field', role);
  this.setInputValue('location', location);
  this.setRadioButton('job_type', job_type);
  this.setRadioButton('workplace_type', workplace_type);
  this.setRadioButton('budget_type', budget_type);
  this.setInputValue('min-budget-input-field', min_budget.toString());
  this.setInputValue('max-budget-input', max_budget.toString());
  this.setInputValue('notice-period-input-filed', notice_period);
  this.populateSkills(skills);
  this.setJobDescription(job_description);
  this.setExperienceRange('total', total_experience_min, total_experience_max);
  this.setExperienceRange('relevant', relevant_experience_min, relevant_experience_max);
}

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

private populateSkills(skills: string[]): void {
  const tagContainer = document.getElementById('tagContainer') as HTMLDivElement;
  const tagInput = document.getElementById('tagInput') as HTMLInputElement;
  if (!tagContainer || !tagInput) return;

  // Remove only the existing skill tags (elements with class 'tag')
  const existingTags = tagContainer.querySelectorAll('.tag');
  existingTags.forEach(tag => tag.remove());

  // Add new skill tags
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
      const updatedSkills = this.jobForm.value.skills.filter(s => s !== skill);
      this.jobForm.patchValue({ skills: updatedSkills });
    });
    tag.appendChild(removeBtn);
    // Insert the new tag before the input field
    tagContainer.insertBefore(tag, tagInput);
  });
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
        const width = rect.width;
        const maxYears = 30; // 0-30 years range
        const minPos = (min / maxYears) * (width - 10);
        const maxPos = (max / maxYears) * (width - 10);

        markerLeft.style.left = `${minPos}px`;
        markerRight.style.left = `${maxPos}px`;
        labelLeft.style.left = `${minPos + 5}px`;
        labelLeft.textContent = `${min}`;
        labelRight.style.left = `${maxPos + 5}px`;
        labelRight.textContent = `${max}`;
        filledSegment.style.left = `${minPos + 5}px`;
        filledSegment.style.width = `${maxPos - minPos}px`;
    }
}

  private checkEmpty(id: string): void {
    const element = document.getElementById(id) as HTMLDivElement;
    if (!element) return;
    const isEmpty = element.textContent.trim() === '';
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

  let isDragging = false;
  let currentMarker: HTMLDivElement | null = null;

  const updateFilledSegment = () => {
    const leftPos = parseFloat(markerLeft.style.left);
    const rightPos = parseFloat(markerRight.style.left);
    filledSegment.style.left = `${leftPos + 5}px`;
    filledSegment.style.width = `${rightPos - leftPos}px`;
  };

  const updateLabelPosition = (marker: HTMLDivElement, label: HTMLDivElement) => {
    const markerPos = parseFloat(marker.style.left);
    label.style.left = `${markerPos + 5}px`;
  };

  const onMouseMove = (e: MouseEvent) => {
    if (!isDragging || !currentMarker || !rangeIndicator) return;

    const rect = rangeIndicator.getBoundingClientRect();
    let newLeft = e.clientX - rect.left - 5;

    const minLeft = 0;
    const maxLeft = rect.width - 10;

    if (currentMarker === markerLeft) {
      newLeft = Math.max(minLeft, Math.min(newLeft, parseFloat(markerRight.style.left) - 10));
    } else if (currentMarker === markerRight) {
      newLeft = Math.min(maxLeft, Math.max(newLeft, parseFloat(markerLeft.style.left) + 10));
    }

    currentMarker.style.left = `${newLeft}px`;
    updateFilledSegment();
    updateLabelPosition(currentMarker, currentMarker === markerLeft ? labelLeft : labelRight);

    const width = rect.width - 10;
    const maxYears = 30;
    const minYear = Math.round((parseFloat(markerLeft.style.left) / width) * maxYears);
    const maxYear = Math.round((parseFloat(markerRight.style.left) / width) * maxYears);

    if (type === 'total') {
      this.jobForm.patchValue({
        total_experience_min: minYear,
        total_experience_max: maxYear
      });
    } else {
      this.jobForm.patchValue({
        relevant_experience_min: minYear,
        relevant_experience_max: maxYear
      });
    }
    labelLeft.textContent = `${minYear}`;
    labelRight.textContent = `${maxYear}`;
  };

  const onMouseUp = () => {
    isDragging = false;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  };

  const onMouseDown = (e: MouseEvent, marker: HTMLDivElement) => {
    isDragging = true;
    currentMarker = marker;
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  markerLeft.addEventListener('mousedown', (e) => onMouseDown(e, markerLeft));
  markerRight.addEventListener('mousedown', (e) => onMouseDown(e, markerRight));

  updateFilledSegment();
}

  private parseExperience(exp: string): [number, number] {
    const match = exp.match(/(\d+)-(\d+)/);
    return match ? [parseInt(match[1]), parseInt(match[2])] : [0, 0];
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
    await new Promise(resolve => setTimeout(resolve, 500));
    return this.getMockSuggestions(query);
  }

  private getMockSuggestions(query: string): string[] {
    query = query.toLowerCase();
    const cities = [
      'Multiple',
      'New York, NY, USA',
      'Los Angeles, CA, USA',
      'Chicago, IL, USA',
      'Houston, TX, USA',
      'Phoenix, AZ, USA',
      'Philadelphia, PA, USA',
      'San Antonio, TX, USA',
      'San Diego, CA, USA',
      'Dallas, TX, USA',
      'San Jose, CA, USA',
      'London, UK',
      'Paris, France',
      'Tokyo, Japan',
      'Sydney, Australia',
      'Toronto, Canada'
    ];
    return cities.filter(city => city.toLowerCase().includes(query));
  }

  selectSuggestion(location: string): void {
    this.jobForm.patchValue({ location });
    this.showSuggestions = false;
    this.suggestions = [];
  }

  handleOutsideClick(event: MouseEvent): void {
    const target = event.target as Node;
    if (
      this.suggestionsContainer &&
      !this.suggestionsContainer.nativeElement.contains(target) &&
      target !== this.locationInput.nativeElement
    ) {
      this.showSuggestions = false;
    }
  }

  private initializeSkillsInput(): void {
    const tagInput = document.getElementById('tagInput') as HTMLInputElement;
    const tagContainer = document.getElementById('tagContainer') as HTMLDivElement;
    const suggestions = document.getElementById('suggestions') as HTMLDivElement;

    let selectedTags: string[] = [];
    let activeSuggestionIndex = -1;

    const availableTags = [
      'JavaScript', 'HTML', 'CSS', 'React', 'Vue', 'Angular',
      'Node.js', 'TypeScript', 'Python', 'Java', 'PHP Ascendantframeworks', 'PHP', 'Ruby',
      'Swift', 'Kotlin', 'Go', 'Rust', 'C#', 'C++', 'MongoDB',
      'MySQL', 'PostgreSQL', 'Redis', 'GraphQL', 'REST API'
    ];

    const filterSuggestions = (input: string) => {
      if (!input) return [];
      const inputLower = input.toLowerCase();
      return availableTags.filter(tag =>
        tag.toLowerCase().includes(inputLower) && !selectedTags.includes(tag)
      );
    };

    const showSuggestions = (filteredSuggestions: string[]) => {
      suggestions.innerHTML = '';
      if (filteredSuggestions.length === 0) {
        suggestions.style.display = 'none';
        return;
      }

      filteredSuggestions.forEach((suggestion, index) => {
        const item = document.createElement('div');
        item.className = 'suggestion-item';
        item.textContent = suggestion;
        item.addEventListener('click', () => {
          addTag(suggestion);
          tagInput.value = '';
          suggestions.style.display = 'none';
          tagInput.focus();
        });
        suggestions.appendChild(item);
      });

      suggestions.style.display = 'block';
      activeSuggestionIndex = -1;
    };

    const addTag = (text: string) => {
      if (!text || selectedTags.includes(text)) return;
      selectedTags.push(text);
      this.jobForm.patchValue({ skills: selectedTags });

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
        this.jobForm.patchValue({ skills: selectedTags });
      });

      tag.appendChild(removeBtn);
      tagContainer.insertBefore(tag, tagInput);
    };

    const navigateSuggestions = (direction: 'up' | 'down') => {
      const items = suggestions.querySelectorAll('.suggestion-item');
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
        const items = suggestions.querySelectorAll('.suggestion-item');
        if (activeSuggestionIndex >= 0 && activeSuggestionIndex < items.length) {
          addTag(items[activeSuggestionIndex].textContent || '');
        } else if (tagInput.value) {
          addTag(tagInput.value);
        }
        tagInput.value = '';
        suggestions.style.display = 'none';
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        navigateSuggestions('down');
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        navigateSuggestions('up');
      } else if (e.key === 'Backspace' && !tagInput.value) {
        const lastIndex = selectedTags.length - 1;
        if (lastIndex >= 0) {
          const lastTag = selectedTags[lastIndex];
          selectedTags.pop();
          this.jobForm.patchValue({ skills: selectedTags });
          const tags = tagContainer.querySelectorAll('.tag');
          tags[tags.length - 1].remove();
        }
      } else if (e.key === 'Escape') {
        suggestions.style.display = 'none';
      }
    });

    document.addEventListener('click', (e) => {
      if (!tagContainer.contains(e.target as Node) && !suggestions.contains(e.target as Node)) {
        suggestions.style.display = 'none';
      }
    });

    tagContainer.addEventListener('click', (e) => {
      if (e.target === tagContainer) {
        tagInput.focus();
      }
    });
  }

  submitJobPost(): void {
    if (this.jobForm.invalid) {
      this.snackBar.open('Please fill all required fields correctly.', 'Close', { duration: 5000 });
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
        primary: formValues.skills.slice(0, Math.ceil(formValues.skills.length / 2)).map(skill => ({
          skill,
          skill_confidence: 0.9,
          type_confidence: 0.9
        })),
        secondary: formValues.skills.slice(Math.ceil(formValues.skills.length / 2)).map(skill => ({
          skill,
          skill_confidence: 0.8,
          type_confidence: 0.8
        }))
      }
    };

    this.jobDescriptionService.saveJobPost(jobDetails, token).subscribe({
      next: () => {
        this.snackBar.open('Job post created successfully.', 'Close', { duration: 3000 });
        this.resetForm();
        this.router.navigate(['/job-posted']);
      },
      error: (error) => {
        this.snackBar.open(`Job post creation failed: ${error.message || 'Unknown error'}`, 'Close', { duration: 5000 });
      }
    });
  }

  cancelJobPost(): void {
    this.resetForm();
    this.router.navigate(['/dashboard']);
  }

  resetForm(): void {
    this.jobForm.reset({
      role: '',
      location: '',
      job_type: '',
      workplace_type: '',
      total_experience_min: 0,
      total_experience_max: 0,
      relevant_experience_min: 0,
      relevant_experience_max: 0,
      budget_type: '',
      min_budget: 0,
      max_budget: 0,
      notice_period: '',
      skills: [],
      job_description: '',
      job_description_url: '',
      unique_id: ''
    });
    this.jobForm.reset(); // Resets to initial values: 0-30 for experience ranges
  this.selectedFile = null;
  if (this.fileInput) {
    this.fileInput.nativeElement.value = '';
  }
  const tagContainer = document.getElementById('tagContainer') as HTMLDivElement;
  const tags = tagContainer.querySelectorAll('.tag');
  tags.forEach(tag => tag.remove());
  this.updateExperienceUI(); // Sync UI with reset form values
  }
  
}