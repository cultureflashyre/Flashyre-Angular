import { Component, OnInit, AfterViewInit, OnDestroy, HostListener, ViewChild, ElementRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../../services/candidate.service';
import { JobsService } from '../../services/job.service';
import { environment } from '../../../environments/environment';
import { trigger, state, style, transition, animate, keyframes } from '@angular/animations';

@Component({
  selector: 'candidate-home',
  templateUrl: 'candidate-home.component.html',
  styleUrls: ['candidate-home.component.css'],
  animations: [
    trigger('popupAnimation', [
      state('void', style({
        opacity: 0,
        transform: 'scale(0.3) translateY(-10px)',
      })),
      transition(':enter', [
        animate('300ms ease-out', keyframes([
          style({ opacity: 0, transform: 'scale(0.3) translateY(-10px)', offset: 0 }),
          style({ opacity: 0.5, transform: 'scale(0.8) translateY(0px)', offset: 0.3 }),
          style({ opacity: 1, transform: 'scale(1) translateY(0px)', offset: 1 }),
        ]))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({
          opacity: 0,
          transform: 'scale(0.8) translateY(-10px)',
        }))
      ])
    ])
  ]
})
export class CandidateHome implements OnInit, AfterViewInit, OnDestroy {
  userProfile: any = {};
  defaultProfilePicture: string = "https://storage.googleapis.com/cv-storage-sample1/placeholder_images/profile-placeholder.jpg";
  
  // Job related properties
  // --- MODIFIED: Job objects will now have an optional 'matching_score' property
  jobs: any[] = []; // Master list of jobs
  filteredJobs: any[] = []; // Jobs after search filters are applied
  displayedJobs: any[] = []; // Paginated jobs for the view
  appliedJobIds: number[] = [];
  
  // Main search bar models
  searchJobTitle: string = '';
  searchLocation: string = '';
  searchExperience: string = '';
  
  // "More Filters" popup models
  searchDatePosted: string = '';
  searchExperienceLevel: string = '';
  searchDepartment: string = '';
  searchSalary: string = '';
  searchCompanyName: string = '';
  searchIndustries: string = '';
  searchWorkMode: string = '';
  searchRole: string = '';
  searchJobType: string = '';
  
  // Pagination properties
  private currentPage = 0;
  private jobsPerPage = 30;
  private isLoadingMore = false;
  noMatchesFound: boolean = false;
  
  // UI State
  showMoreFilters: boolean = false;
  public initialFilterTab: 'filters' | 'preferences' = 'filters';
  isLoading: boolean = true;
  
  // Application state
  processingApplications: { [key: number]: boolean } = {};
  applicationSuccess: { [key: number]: boolean } = {};
  
  // RxJS & Observer
  private observer: IntersectionObserver | null = null;
  private destroy$ = new Subject<void>();

  // Assets
  images = [
    'src/assets/temp-jobs-icon/1.png', 'src/assets/temp-jobs-icon/2.png',
    'src/assets/temp-jobs-icon/3.png', 'src/assets/temp-jobs-icon/4.png',
    'src/assets/temp-jobs-icon/5.png', 'src/assets/temp-jobs-icon/6.png',
    'src/assets/temp-jobs-icon/7.png', 'src/assets/temp-jobs-icon/8.png'
  ];

  @ViewChild('filterIcon', { static: false }) filterIcon!: ElementRef;
  filterPosition = { top: 0, left: 0 };

  private apiUrl = environment.apiUrl + 'api/jobs/';

  constructor(
    private title: Title,
    private meta: Meta,
    private http: HttpClient,
    private router: Router,
    private authService: AuthService,
    private jobService: JobsService
  ) {
    this.title.setTitle('Candidate-Home - Flashyre');
    this.meta.addTags([
      { property: 'og:title', content: 'Candidate-Home - Flashyre' },
      { property: 'og:image', content: 'https://aheioqhobo.cloudimg.io/v7/_playground-bucket-v2.teleporthq.io_/8203932d-6f2d-4493-a7b2-7000ee521aa2/9aea8e9c-27ce-4011-a345-94a92ae2dbf8?org_if_sml=1&force_format=original' },
    ]);
  }

  ngOnInit(): void {
    this.loadUserProfile();
    this.initializeJobs();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.setupInfiniteScroll();

      this.updateFilterPosition(); // Call to get initial position
    }, 100);
  }

  updateFilterPosition(): void {
    if (this.filterIcon && this.filterIcon.nativeElement) {
      const rect = this.filterIcon.nativeElement.getBoundingClientRect();
      this.filterPosition = {
        top: rect.bottom + window.scrollY + 10, // 10px below icon (adjust if needed)
        left: rect.left + window.scrollX + (rect.width / 2) - 450 // Center modal (460px width / 2 = 230px)
      };
    }
  }

  @HostListener('window:scroll', ['$event'])
  @HostListener('window:resize', ['$event'])
  onWindowScrollOrResize(): void {
    this.updateFilterPosition();

  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  // ==============================================================================
  // ==================== CORE FILTERING & UI LOGIC (REVISED) =====================
  // ==============================================================================

  /**
   * Clears ONLY the advanced filters that come from the popup.
   * This is crucial for preventing state conflicts ("Ghost Filters").
   */
  private resetMoreFilters(): void {
    this.searchDatePosted = '';
    this.searchExperienceLevel = '';
    this.searchDepartment = '';
    this.searchSalary = '';
    this.searchCompanyName = '';
    this.searchIndustries = '';
    this.searchWorkMode = '';
    this.searchRole = '';
    this.searchJobType = '';
  }

  /**
   * Triggered by the main "Search" button.
   * Resets advanced filters and then runs the full filtering pipeline.
   */
  onSearch(): void {
    this.resetMoreFilters();
    this.runFilterPipeline();
  }

  /**
   * Triggered by the "Apply Filters" button in the popup.
   * It populates the advanced filter properties and runs the pipeline.
   */
  onApplyFilters(filters: any): void {
    this.searchDatePosted = filters.datePosted;
    this.searchExperienceLevel = filters.experienceLevel;
    this.searchDepartment = filters.department;
    this.searchSalary = filters.salary;
    this.searchLocation = filters.location || this.searchLocation; // Keep main bar value if popup field is empty
    this.searchCompanyName = filters.companyName;
    this.searchIndustries = filters.industries;
    this.searchWorkMode = filters.workMode;
    this.searchRole = filters.role;
    this.searchJobType = filters.jobType;
    
    this.showMoreFilters = false;
    this.runFilterPipeline();
  }

  private parseFirstNumber(input: string): number | null {
    if (!input || typeof input !== 'string') {
      return null;
    }
    // This regex finds the first sequence of digits in a string.
    const match = input.match(/\d+/);
    return match ? parseInt(match[0], 10) : null;
  }

  getImageOrInitials(job: any): string {
    if (job.logo) {
      return job.logo;
    }
    // Fallback: Use initials (you may want to format as data URL for text rendering, but here just pass initials)
    return job.initials;
  }


  /**
   * The single, definitive function that applies ALL active filters.
   * This prevents conflicts and ensures consistent search results.
   */
  private runFilterPipeline(): void {
  let tempJobs = [...this.jobs];

  // --- RESTORED: Logic for the 3 main search bars ---
  const mainKeyword = this.searchJobTitle.toLowerCase().trim();
  if (mainKeyword) {
    tempJobs = tempJobs.filter(job => 
      (job.title || '').toLowerCase().includes(mainKeyword) ||
      (job.description || '').toLowerCase().includes(mainKeyword) ||
      (job.company_name || '').toLowerCase().includes(mainKeyword)
    );
  }

  const mainLocation = this.searchLocation.toLowerCase().trim();
  if (mainLocation) {
    tempJobs = tempJobs.filter(job => (job.location || '').toLowerCase().includes(mainLocation));
  }

  const mainExperience = this.searchExperience.trim();
  if (mainExperience) {
    const candidateExp = this.parseFirstNumber(mainExperience);
    if (candidateExp !== null) {
      tempJobs = tempJobs.filter(j => j.experience_required != null && candidateExp >= j.experience_required);
    }
  }

  // --- "More Filters" Popup Logic ---

  // Date Posted Filter
  if (this.searchDatePosted) {
    const now = new Date();
    let cutoffDate = new Date();
    if (this.searchDatePosted === '24h') cutoffDate.setDate(now.getDate() - 1);
    else if (this.searchDatePosted === 'week') cutoffDate.setDate(now.getDate() - 7);
    else if (this.searchDatePosted === 'month') cutoffDate.setMonth(now.getMonth() - 1);
    
    tempJobs = tempJobs.filter(job => job.created_at && new Date(job.created_at) >= cutoffDate);
  }

  // Experience Filter (from popup)
  if (this.searchExperienceLevel && this.searchExperienceLevel.trim()) {
    const candidateExp = this.parseFirstNumber(this.searchExperienceLevel);
    if (candidateExp !== null) {
      tempJobs = tempJobs.filter(j => j.experience_required != null && candidateExp >= j.experience_required);
    }
  }

  // Job Type Filter
  if (this.searchJobType) {
    tempJobs = tempJobs.filter(j => (j.job_type || '').toLowerCase() === this.searchJobType.toLowerCase());
  }

  // Role Filter
  if (this.searchRole && this.searchRole.trim()) {
    const searchRol = this.searchRole.toLowerCase().trim();
    tempJobs = tempJobs.filter(j => (j.title || '').toLowerCase().includes(searchRol));
  }
  
  // NOTE: Salary and Work Mode filters for candidate are still placeholders
  // as per the previous discussion, pending backend data.

  // --- Finalize and Update UI ---
  this.filteredJobs = tempJobs;
  // ... (rest of the method remains the same)
  const activeFilter = this.searchJobTitle || this.searchLocation || this.searchExperience || this.searchDatePosted || this.searchExperienceLevel || this.searchSalary || this.searchCompanyName || this.searchWorkMode || this.searchRole || this.searchJobType;
  this.noMatchesFound = tempJobs.length === 0 && !!activeFilter;

  this.currentPage = 0;
  this.displayedJobs = [];
  this.loadNextPage();
  this.setupInfiniteScroll();
}
  
  /**
   * Handles opening the filter popup and setting its initial tab.
   * This is called by both the filter icon and the preference button.
   */
  openFiltersPopup(initialTab: 'filters' | 'preferences'): void {
    this.initialFilterTab = initialTab;
    this.showMoreFilters = true;
    this.updateFilterPosition();
  }

  // ==============================================================================
  // ==================== DATA LOADING & UTILITY METHODS ==========================
  // ==============================================================================

  private initializeJobs(): void {
    this.isLoading = true;
    if (this.jobService.areJobsCached()) {
      this.loadJobsFromCache();
    } else {
      this.fetchJobsFromAPI();
    }
  }

  private loadJobsFromCache(): void {
    this.jobService.getJobs()
      .pipe(takeUntil(this.destroy$))
      .subscribe(jobs => {
        if (jobs.length > 0) {
          this.filterAndDisplayJobs(jobs);
        }
      });
  }

  private fetchJobsFromAPI(): void {
    this.jobService.fetchJobs()
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        jobs => this.filterAndDisplayJobs(jobs),
        error => {
          console.error('Error fetching jobs:', error);
          this.isLoading = false;
        }
      );
  }

  private parseNumbersFromString(input: string): number[] {
    if (!input || typeof input !== 'string') {
      return [];
    }
    // This regex finds all sequences of digits in a string.
    const matches = input.match(/\d+/g);
    return matches ? matches.map(num => parseInt(num, 10)) : []; 
  }

  private filterAndDisplayJobs(jobs: any[]): void {
    // Diagnostic log to help debug data mismatches
    if (jobs && jobs.length > 0) {
      console.log('SAMPLE JOB DATA FROM API:', jobs[0]);
    }

    this.authService.getAppliedJobs().subscribe(
      (appliedJobsResponse) => {
        this.appliedJobIds = appliedJobsResponse.applied_job_ids || [];
        this.jobs = jobs.filter(job => !this.appliedJobIds.includes(job.job_id));
        this.filteredJobs = [...this.jobs];
        this.currentPage = 0;
        this.displayedJobs = [];
        this.loadNextPage(); // This will now also trigger score fetching for the first page
        this.isLoading = false;
      },
      (error) => {
        console.error('Error fetching applied jobs, proceeding without filtering:', error);
        this.jobs = jobs;
        this.filteredJobs = [...this.jobs];
        this.currentPage = 0;
        this.displayedJobs = [];
        this.loadNextPage(); // This will now also trigger score fetching for the first page
        this.isLoading = false;
      }
    );
  }

  private loadNextPage(): void {
  // Determine which list to paginate from
  const sourceList = this.noMatchesFound ? this.jobs : this.filteredJobs;

  if (this.isLoadingMore || this.displayedJobs.length >= sourceList.length) {
    return;
  }
  this.isLoadingMore = true;
  const startIndex = this.currentPage * this.jobsPerPage;
  const endIndex = startIndex + this.jobsPerPage;
  const nextJobs = sourceList.slice(startIndex, endIndex);
  
  if (nextJobs.length > 0) {
    this.displayedJobs = [...this.displayedJobs, ...nextJobs];
    this.currentPage++;
    this.fetchAndAssignMatchScores(nextJobs);
  }
  this.isLoadingMore = false;
  setTimeout(() => this.setupInfiniteScroll(), 100);
}

  /**
   * --- [NEW] Fetches scores for a batch of jobs and assigns them to the objects in the displayedJobs array. ---
   * @param jobsToScore The array of job objects for which to fetch scores.
   */


  private fetchAndAssignMatchScores(jobsToScore: any[]): void {
  console.log('fetchAndAssignMatchScores called with jobsToScore:', jobsToScore);

  const jobIds = jobsToScore.map(job => job.job_id).filter(id => id != null);
  console.log('Filtered jobIds to score:', jobIds);

  if (jobIds.length === 0) {
    console.log('No jobIds to score. Exiting function early.');
    return; // No jobs to score
  }

  this.authService.getMatchScores(jobIds)
    .pipe(takeUntil(this.destroy$))
    .subscribe(
      (scoresMap) => {
        console.log('Received scoresMap from getMatchScores:', scoresMap);

        // Create a map for efficient lookup
        const scores = new Map(Object.entries(scoresMap).map(([k, v]) => [parseInt(k, 10), v]));
        console.log('Converted scores Map:', scores);

        // Assign scores to the jobs in the main displayedJobs array
        this.displayedJobs.forEach(job => {
          if (scores.has(job.job_id)) {
            console.log(`Assigning matching_score to job_id ${job.job_id}:`, scores.get(job.job_id));
            job.matching_score = scores.get(job.job_id);
          } else {
            console.log(`No score found for job_id ${job.job_id}, not modifying matching_score.`);
          }
        });
      },
      (error) => {
        console.error('Failed to fetch match scores for jobs:', error);
        // Gracefully handle the error, jobs will just show a 0% score.
      }
    );
}

  private setupInfiniteScroll(): void {
    if (this.observer) this.observer.disconnect();
    const loadMoreElement = document.getElementById('load-more');
    if (!loadMoreElement || !this.hasMoreJobs) return;

    const options = { root: null, rootMargin: '100px', threshold: 0.1 };
    this.observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !this.isLoadingMore) {
        this.loadNextPage();
      }
    }, options);
    this.observer.observe(loadMoreElement);
  }

  loadUserProfile(): void {
    const profileData = localStorage.getItem('userProfile');
    if (profileData) this.userProfile = JSON.parse(profileData);
  }

  navigateToAssessment(assessment: number): void {
    this.router.navigate(['/flashyre-assessment-rules-card'], { queryParams: { id: assessment } });
  }

  applyForJob(jobId: number, index: number): void {
    this.processingApplications[jobId] = true;
    this.authService.applyForJob(jobId)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (response) => {
          this.applicationSuccess[jobId] = true;
          this.appliedJobIds.push(jobId);
          setTimeout(() => {
            this.jobService.removeJobFromCache(jobId);
            this.jobs = this.jobs.filter(job => job.job_id !== jobId);
            this.filteredJobs = this.filteredJobs.filter(job => job.job_id !== jobId); // Also remove from filtered list
            this.displayedJobs = this.displayedJobs.filter(job => job.job_id !== jobId);
          }, 2000);
        },
        (error) => {
          this.processingApplications[jobId] = false;
          alert(error.error?.error || 'Failed to apply for this job');
        }
      );
  }

  private parseNumericFilter(input: string): number | null {
    if (!input || typeof input !== 'string') {
      return null;
    }
    // Extracts the first sequence of digits from the string.
    const match = input.match(/\d+/);
    if (match) {
      return parseInt(match[0], 10);
    }
    return null;
  }



  getRandomImage(): string {
    return this.images[Math.floor(Math.random() * this.images.length)];
  }

  get isLoadingMoreJobs(): boolean { return this.isLoadingMore; }
  get hasMoreJobs(): boolean { return this.displayedJobs.length < this.filteredJobs.length; }
  trackByJobId(index: number, job: any): number { return job.job_id; }
}