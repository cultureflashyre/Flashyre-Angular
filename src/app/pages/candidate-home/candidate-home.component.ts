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

  /**
   * The single, definitive function that applies ALL active filters.
   * This prevents conflicts and ensures consistent search results.
   */
  private runFilterPipeline(): void {
    let tempJobs = [...this.jobs];
    const mainKeywordTerm = this.searchJobTitle.toLowerCase().trim();

    // --- Filter 1: Main Keyword Search (Robust Version) ---
    if (mainKeywordTerm) {
      tempJobs = tempJobs.filter(job => {
        // Combine all searchable text fields from a job into one string.
        // This makes the search powerful and resilient to missing data.
        const searchableFields = [
          job.title,
          job.company_name,
          job.description,
          job.location,
          job.job_type,
          job.role,
          // Add any other text fields you want to search here, e.g., job.skills
        ];
        
        // We join all fields with a space and search within the resulting string.
        return (searchableFields.join(' ').toLowerCase()).includes(mainKeywordTerm);
      });
    }

    // --- Filter 2: Main Location Search Bar ---
    if (this.searchLocation.trim()) {
      const searchLoc = this.searchLocation.toLowerCase().trim();
      tempJobs = tempJobs.filter(job => (job.location || '').toLowerCase().includes(searchLoc));
    }

    // --- Filter 3: Main Experience Search Bar ---
    if (this.searchExperience.trim()) {
      const searchExp = parseInt(this.searchExperience, 10);
      if (!isNaN(searchExp)) {
        tempJobs = tempJobs.filter(job => job.experience_required != null && job.experience_required >= searchExp);
      }
    }
    
    // --- Filters 4-11: Advanced "More Filters" ---
    if (this.searchDatePosted) {
      const now = new Date();
      let cutoff: Date;
      if (this.searchDatePosted === '24h') {
        cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      } else if (this.searchDatePosted === 'week') {
        cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (this.searchDatePosted === 'month') {
        cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      } else {
        cutoff = new Date(0); // Any
      }
      tempJobs = tempJobs.filter(job => new Date(job.posted_date) > cutoff);
    }

    if (this.searchExperienceLevel) {
      tempJobs = tempJobs.filter(job => job.experience_level?.toLowerCase() === this.searchExperienceLevel.toLowerCase());
    }

    if (this.searchDepartment) {
      tempJobs = tempJobs.filter(job => job.department?.toLowerCase().includes(this.searchDepartment.toLowerCase()));
    }

    if (this.searchSalary) {
      // Assume salary_range like '0-5', parse and filter
      tempJobs = tempJobs.filter(job => job.salary_range === this.searchSalary);
    }

    if (this.searchCompanyName?.trim()) {
      const searchTerm = this.searchCompanyName.toLowerCase().trim();
      tempJobs = tempJobs.filter(job => job.company_name?.toLowerCase().includes(searchTerm));
    }

    if (this.searchIndustries) {
      tempJobs = tempJobs.filter(job => job.industries?.includes(this.searchIndustries));
    }

    if (this.searchWorkMode) {
      tempJobs = tempJobs.filter(job => job.work_mode?.toLowerCase() === this.searchWorkMode.toLowerCase());
    }

    if (this.searchRole) {
      tempJobs = tempJobs.filter(job => job.role?.toLowerCase().includes(this.searchRole.toLowerCase()));
    }

    // Existing job_type filter if needed
    if (this.searchJobTitle) {
      tempJobs = tempJobs.filter(job => job.job_type?.toLowerCase() === this.searchJobTitle.toLowerCase());
    }

    this.filteredJobs = tempJobs;
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
    if (this.isLoadingMore || this.displayedJobs.length >= this.filteredJobs.length) {
      return;
    }
    this.isLoadingMore = true;
    const startIndex = this.currentPage * this.jobsPerPage;
    const endIndex = startIndex + this.jobsPerPage;
    const nextJobs = this.filteredJobs.slice(startIndex, endIndex);
    
    if (nextJobs.length > 0) {
      this.displayedJobs = [...this.displayedJobs, ...nextJobs];
      this.currentPage++;
      // --- [NEW] Fetch scores for the newly loaded jobs ---
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
    const jobIds = jobsToScore.map(job => job.job_id).filter(id => id != null);

    if (jobIds.length === 0) {
      return; // No jobs to score
    }

    this.authService.getMatchScores(jobIds)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (scoresMap) => {
          // Create a map for efficient lookup
          const scores = new Map(Object.entries(scoresMap).map(([k, v]) => [parseInt(k, 10), v]));

          // Assign scores to the jobs in the main displayedJobs array
          this.displayedJobs.forEach(job => {
            if (scores.has(job.job_id)) {
              job.matching_score = scores.get(job.job_id);
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



  getRandomImage(): string {
    return this.images[Math.floor(Math.random() * this.images.length)];
  }

  get isLoadingMoreJobs(): boolean { return this.isLoadingMore; }
  get hasMoreJobs(): boolean { return this.displayedJobs.length < this.filteredJobs.length; }
  trackByJobId(index: number, job: any): number { return job.job_id; }
}