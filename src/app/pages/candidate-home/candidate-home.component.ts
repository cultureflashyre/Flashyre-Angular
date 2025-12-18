import { Component, OnInit, AfterViewInit, OnDestroy, HostListener, ViewChild, ElementRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Title, Meta, DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../../services/candidate.service';
import { JobsService } from '../../services/job.service';
import { environment } from '../../../environments/environment';
import { trigger, state, style, transition, animate, keyframes } from '@angular/animations';

import { RouterModule } from '@angular/router'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'

import { MoreFiltersAndPreferenceComponent } from 'src/app/components/more-filters-and-preference-component/more-filters-and-preference-component.component';
import { AlertMessageComponent } from 'src/app/components/alert-message/alert-message.component';
import { NavbarForCandidateView } from 'src/app/components/navbar-for-candidate-view/navbar-for-candidate-view.component';
import { CandidateProfileShort } from 'src/app/components/candidate-profile-short/candidate-profile-short.component';
import { CandidateJobForYouCard } from 'src/app/components/candidate-job-for-you-card/candidate-job-for-you-card.component';


@Component({
  selector: 'candidate-home',
    standalone: true,
  imports: [ RouterModule, FormsModule, CommonModule,
    MoreFiltersAndPreferenceComponent, AlertMessageComponent,
    NavbarForCandidateView, CandidateProfileShort, CandidateJobForYouCard,
  ],
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
  allAssessments: any[] = [];
  
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
  public successMessage: string = '';
  
  // Application state
  processingApplications: { [key: number]: boolean } = {};
  applicationSuccess: { [key: number]: boolean } = {};
  
  showAssessmentAlert = false;
  assessmentAlertMessage = '';
  assessmentAlertButtons: string[] = [];
  private jobToProcess: any = null; // To store job context for the alert

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

  private apiUrl = environment.apiUrl; // removed ( + 'api/jobs/')

  constructor(
    private title: Title,
    private meta: Meta,
    private http: HttpClient,
    private router: Router,
    private authService: AuthService,
    private jobService: JobsService,
    private sanitizer: DomSanitizer
  ) {
    this.title.setTitle('Candidate-Home - Flashyre');
    this.meta.addTags([
      { property: 'og:title', content: 'Candidate-Home - Flashyre' },
      { property: 'og:image', content: 'https://aheioqhobo.cloudimg.io/v7/_playground-bucket-v2.teleporthq.io_/8203932d-6f2d-4493-a7b2-7000ee521aa2/9aea8e9c-27ce-4011-a345-94a92ae2dbf8?org_if_sml=1&force_format=original' },
    ]);
  }

  ngOnInit(): void {
    this.loadUserProfile();
    // this.initializeJobs();
    // this.loadAllAssessments();
    this.loadInitialData();
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

  private loadInitialData(): void {
    this.isLoading = true;

    // Define the two API calls we need to make
    const jobs$ = this.jobService.fetchJobs();
    // const assessments$ = this.http.get<any[]>(`${this.apiUrl}api/assessments/assessment-list/`);
    
    const assessments$ = this.jobService.fetchAssessments();
    
    // Use forkJoin to run them in parallel and wait for both to complete
    forkJoin({
      jobs: jobs$,
      assessments: assessments$
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: ({ jobs, assessments }) => {
        // This code block only runs AFTER both API calls are successful
        this.allAssessments = assessments;
        console.log('Assessments and jobs loaded successfully.');
        
        // Now that we have all the data, proceed with filtering and displaying jobs
        this.filterAndDisplayJobs(jobs);
      },
      error: (error) => {
        console.error('Error fetching initial data (jobs or assessments):', error);
        this.isLoading = false; // Stop loading on error
      }
    });
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

  // This new function acts as a gatekeeper for keyboard input
  onExperienceInput(event: KeyboardEvent): void {
    const input = event.target as HTMLInputElement;
    const key = event.key;

    // Allowed keys: numbers, one decimal point, and control keys
    const isNumber = /[0-9]/.test(key);
    const isControlKey = [
      'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'
    ].includes(key);
    
    // Check for decimal point specifically
    const isDecimal = key === '.';
    const hasDecimalAlready = input.value.includes('.');

    // Allow the key press only if it's a number, a control key,
    // or a decimal point when one doesn't already exist.
    if (isNumber || isControlKey || (isDecimal && !hasDecimalAlready)) {
      // Let the key press go through
      return;
    } else {
      // Block the key press
      event.preventDefault();
    }
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
    console.log('Jobs:', tempJobs);

    // --- MAIN SEARCH BARS (No changes to Keyword and Location) ---
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

    // ---- CORRECTED LOGIC 1: EXPERIENCE FILTER (Main Bar) ----
    // This logic is now copied from the working recruiter view.
    const mainExperience = this.parseFirstNumber(this.searchExperience);
    if (mainExperience !== null) {
        tempJobs = tempJobs.filter(j => 
            j.total_experience_min != null && j.total_experience_max != null &&
            mainExperience >= j.total_experience_min &&
            mainExperience <= j.total_experience_max
        );
    }


    // --- "MORE FILTERS" POPUP LOGIC ---

    // Date Posted Filter (No changes here)
    if (this.searchDatePosted) {
      const now = new Date();
      let cutoffDate = new Date();
      if (this.searchDatePosted === '24h') cutoffDate.setDate(now.getDate() - 1);
      else if (this.searchDatePosted === 'week') cutoffDate.setDate(now.getDate() - 7);
      else if (this.searchDatePosted === 'month') cutoffDate.setMonth(now.getMonth() - 1);
      
      tempJobs = tempJobs.filter(job => job.created_at && new Date(job.created_at) >= cutoffDate);
    }

    // ---- CORRECTED LOGIC 1: EXPERIENCE FILTER (More Filters Popup) ----
    // This logic is now copied from the working recruiter view.
    const popupExperience = this.parseFirstNumber(this.searchExperienceLevel);
    if (popupExperience !== null) {
        tempJobs = tempJobs.filter(j => 
            j.total_experience_min != null && j.total_experience_max != null &&
            popupExperience >= j.total_experience_min &&
            popupExperience <= j.total_experience_max
        );
    }

    // ---- CORRECTED LOGIC 2: COMPANY NAME FILTER ----
    // This logic is now copied from the working recruiter view.
    if (this.searchCompanyName && this.searchCompanyName.trim()) {
        const searchCompany = this.searchCompanyName.toLowerCase().trim();
        tempJobs = tempJobs.filter(j => (j.company_name || '').toLowerCase().includes(searchCompany));
    }
    
    // ---- CORRECTED LOGIC 3: SALARY FILTER ----
    // This logic is now copied from the working recruiter view.
    const searchSal = this.parseFirstNumber(this.searchSalary);
    if (searchSal !== null) {
        tempJobs = tempJobs.filter(j => 
            j.min_budget != null && j.max_budget != null &&
            searchSal >= j.min_budget && searchSal <= j.max_budget
        );
    }

    // ---- CORRECTED LOGIC 4: WORK MODE FILTER ----
    // This logic is now copied from the working recruiter view.
    if (this.searchWorkMode) {
        tempJobs = tempJobs.filter(j => (j.workplace_type || '').toLowerCase() === this.searchWorkMode.toLowerCase());
    }

    // Job Type Filter (No changes here)
    if (this.searchJobType) {
      tempJobs = tempJobs.filter(j => (j.job_type || '').toLowerCase() === this.searchJobType.toLowerCase());
    }

    // Role Filter (No changes here)
    if (this.searchRole && this.searchRole.trim()) {
      const searchRol = this.searchRole.toLowerCase().trim();
      tempJobs = tempJobs.filter(j => (j.title || '').toLowerCase().includes(searchRol));
    }
    
    // --- Finalize and Update UI ---
    this.filteredJobs = tempJobs;
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

  // private loadAllAssessments(): void {
  //   this.http.get<any[]>(`${this.apiUrl}api/assessments/assessment-list/`)
  //     .pipe(takeUntil(this.destroy$))
  //     .subscribe({
  //       next: (data) => {
  //         this.allAssessments = data;
  //         console.log('All assessments loaded for navigation.');
  //       },
  //       error: (error) => {
  //         console.error('Error fetching the list of all assessments:', error);
  //       }
  //     });
  // }

  // private initializeJobs(): void {
  //   this.isLoading = true;
  //   // --- [REMOVED] The problematic call to loadJobsFromCache() was removed ---
  //   // The logic is now streamlined to always fetch fresh data, which is simpler and more reliable.
  //   this.fetchJobsFromAPI();
  // }

  private loadJobsFromCache(): void {
    this.jobService.getJobs()
      .pipe(takeUntil(this.destroy$))
      .subscribe(jobs => {
        if (jobs.length > 0) {
          this.filterAndDisplayJobs(jobs);
        }
      });
  }

  // private fetchJobsFromAPI(): void {
  //   this.jobService.fetchJobs()
  //     .pipe(takeUntil(this.destroy$))
  //     .subscribe(
  //       jobs => this.filterAndDisplayJobs(jobs),
  //       error => {
  //         console.error('Error fetching jobs:', error);
  //         this.isLoading = false;
  //       }
  //     );
  // }

  private parseNumbersFromString(input: string): number[] {
    if (!input || typeof input !== 'string') {
      return [];
    }
    // This regex finds all sequences of digits in a string.
    const matches = input.match(/\d+/g);
    return matches ? matches.map(num => parseInt(num, 10)) : []; 
  }

  // private filterAndDisplayJobs(jobs: any[]): void {
  //   // Diagnostic log to help debug data mismatches
  //   if (jobs && jobs.length > 0) {
  //     console.log('SAMPLE JOB DATA FROM API:', jobs[0]);
  //   }

  //   this.authService.getAppliedJobs().subscribe(
  //     (appliedJobsResponse) => {
  //       this.appliedJobIds = appliedJobsResponse.applied_job_ids || [];
  //       this.jobs = jobs.filter(job => !this.appliedJobIds.includes(job.job_id));
  //       this.filteredJobs = [...this.jobs];
  //       this.currentPage = 0;
  //       this.displayedJobs = [];
  //       this.loadNextPage(); // This will now also trigger score fetching for the first page
  //       this.isLoading = false;
  //     },
  //     (error) => {
  //       console.error('Error fetching applied jobs, proceeding without filtering:', error);
  //       this.jobs = jobs;
  //       this.filteredJobs = [...this.jobs];
  //       this.currentPage = 0;
  //       this.displayedJobs = [];
  //       this.loadNextPage(); // This will now also trigger score fetching for the first page
  //       this.isLoading = false;
  //     }
  //   );
  // }

  private filterAndDisplayJobs(jobs: any[]): void {
    const userId = localStorage.getItem('user_id');
    if (!userId) {
        this.jobs = jobs.filter(job => job.job_id !== undefined && job.job_id !== null); // Add this filter
        this.filteredJobs = [...this.jobs];
        this.loadNextPage();
        this.isLoading = false;
        return;
    }

    forkJoin({
        applied: this.authService.getAppliedJobs(),
        disliked: this.authService.getDislikedJobs(userId) // New API call
    }).pipe(
        takeUntil(this.destroy$)
    ).subscribe({
        next: ({ applied, disliked }) => {
            const appliedJobIds = new Set(applied.applied_job_ids || []);
            // The API now returns a simple array of IDs.
            const dislikedJobIds = new Set(disliked.disliked_jobs || []);

            // Filter the master list of jobs ONCE on page load.
            this.jobs = jobs.filter(job =>
                job.job_id !== undefined &&
                job.job_id !== null &&
                !appliedJobIds.has(job.job_id) &&
                !dislikedJobIds.has(job.job_id) // Filter out disliked jobs
            );

            this.filteredJobs = [...this.jobs];
            this.currentPage = 0;
            this.displayedJobs = [];
            this.loadNextPage();
            this.isLoading = false;
        },
        error: (error) => {
            console.error('Error fetching applied/disliked jobs, showing all jobs as a fallback:', error);
            this.jobs = jobs.filter(job => job.job_id !== undefined && job.job_id !== null);
            this.filteredJobs = [...this.jobs];
            this.currentPage = 0;
            this.displayedJobs = [];
            this.loadNextPage();
            this.isLoading = false;
        }
    });
    // --- MODIFICATION END ---
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
  let nextJobs = sourceList.slice(startIndex, endIndex);
  
  if (nextJobs.length > 0) {
    nextJobs = nextJobs.map(job => ({
      ...job,
      safeDescription: this.sanitizer.bypassSecurityTrustHtml(job.description || '')
    }));
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
    console.log('Attempting to fetch match scores for the following jobs:', jobsToScore);

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

          const scores = new Map(Object.entries(scoresMap).map(([key, value]) => [parseInt(key, 10), value]));
          console.log('Processed scores into a lookup Map:', scores);

          this.displayedJobs.forEach(job => {
            // Add a check here for job.job_id
            if (job.job_id !== undefined && job.job_id !== null && scores.has(job.job_id)) {
              const newScore = scores.get(job.job_id);
              console.log(`Score FOUND for job_id ${job.job_id}. Assigning new score: ${newScore}`);
              job.matching_score = newScore;
            } else {
              //console.log(`No score found for job_id ${job.job_id}, not modifying matching_score.`);
            }
          });
          this.jobService.updateJobsInCache(this.displayedJobs);
        },
        (error) => {
          console.error('Failed to fetch match scores for jobs:', error);
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

  navigateToAssessment(assessmentId: number): void {
    // 1. Find the full assessment object from the list we fetched earlier.
    const selectedAssessment = this.allAssessments.find(a => a.assessment_id === assessmentId);

    // 2. Check if the assessment was found.
    if (!selectedAssessment) {
      console.error("Assessment details not found for id:", assessmentId, "Please ensure the assessment list is loaded.");
      // Optionally, show an alert to the user.
      this.assessmentAlertMessage = "Could not start the assessment. Please try again later.";
      this.assessmentAlertButtons = ['Dismiss'];
      this.showAssessmentAlert = true;
      
      return;
    }

    // 3. Serialize the full object into a JSON string.
    const assessmentDataString = JSON.stringify(selectedAssessment);

    // 4. Navigate to the correct page with the correct query parameter ('data').
    this.router.navigate(['/flashyre-assessment-rules-card'], { 
      queryParams: { data: assessmentDataString } 
    });
  }

  // --- MODIFICATION START ---
/**
   * MODIFIED: This method now applies for the job immediately.
   * After a successful application, it checks if an assessment is associated with the job
   * and, if so, displays a prompt for the user to take it now or later.
   * @param jobId The ID of the job to apply for.
   * @param index The index of the job in the `displayedJobs` array.
   */
  applyForJob(jobId: number, index: number): void {
    this.processingApplications[jobId] = true;
    
    const jobToApply = this.displayedJobs[index];
    if (!jobToApply) {
      console.error(`Could not find job with ID ${jobId} at index ${index} to apply.`);
      this.processingApplications[jobId] = false;
      return;
    }

    // --- The application is now sent immediately and unconditionally ---
    this.authService.applyForJob(jobId, jobToApply.matching_score)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.applicationSuccess[jobId] = true;
          this.appliedJobIds.push(jobId);

          // Show the main success message immediately
          this.successMessage = "You have successfully applied and you will receive an email notification.";
          
          setTimeout(() => {
            this.successMessage = '';
          }, 5000);

          // Schedule the removal of the job card from the UI
          setTimeout(() => {
            this.jobService.removeJobFromCache(jobId);
            this.displayedJobs = this.displayedJobs.filter(job => job.job_id !== jobId);
          }, 2000);

          // --- [NEW LOGIC] After successful application, check if we need to show the assessment prompt ---
          if (jobToApply.assessment != null && (jobToApply.attempts_remaining || 0) > 0) {
            this.jobToProcess = jobToApply; // Store context for the handler
            // Update the message to reflect that the application is complete
            this.assessmentAlertMessage = 'You have successfully applied! Take the assessment now to complete your application.';
            this.assessmentAlertButtons = ['Later', 'Assessment Now'];
            this.showAssessmentAlert = true; // Show the prompt
          }
        },
        error: (error) => {
          this.processingApplications[jobId] = false;
this.assessmentAlertMessage = error.error?.error || 'Failed to apply for this job';
          this.assessmentAlertButtons = ['Dismiss'];
          this.showAssessmentAlert = true;        }
      });
  }

  /**
   * MODIFIED: This method now checks for an assessment before applying.
   * If an assessment is required and attempts are available, it prompts the user.
   * Otherwise, it proceeds with the direct application.
   * @param jobId The ID of the job to apply for.
   * @param index The index of the job in the `displayedJobs` array.
   */
  applyForJob_ALETRNATIVE(jobId: number, index: number): void {
    const jobToApply = this.displayedJobs[index];

    if (!jobToApply) {
      console.error(`Could not find job with ID ${jobId} at index ${index}.`);
      return;
    }

    // --- CONDITIONAL ASSESSMENT CHECK ---
    if (jobToApply.assessment != null && (jobToApply.attempts_remaining || 0) > 0) {
      // The job has an assessment and the user has attempts left.
      this.jobToProcess = jobToApply; // Store the job for the handler
      this.assessmentAlertMessage = 'Take the assessment now to complete your application.';
      this.assessmentAlertButtons = ['Later', 'Assessment Now'];
      this.showAssessmentAlert = true; // Show the alert
    
    } else {
      // --- DIRECT APPLICATION FLOW (No assessment or no attempts left) ---
      this.processingApplications[jobId] = true;

      this.authService.applyForJob(jobId, jobToApply.matching_score)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.applicationSuccess[jobId] = true;
            this.appliedJobIds.push(jobId);
            this.successMessage = "You have successfully applied and you will receive an email notification.";
            
            setTimeout(() => { this.successMessage = ''; }, 5000);

            setTimeout(() => {
              this.jobService.removeJobFromCache(jobId);
              this.displayedJobs = this.displayedJobs.filter(job => job.job_id !== jobId);
            }, 2000);
          },
          error: (error) => {
            this.processingApplications[jobId] = false;
            this.assessmentAlertMessage = error.error?.error || 'Failed to apply for this job';
            this.assessmentAlertButtons = ['Dismiss'];
            this.showAssessmentAlert = true;
          }
        });
    }
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

  handleAssessmentAlertAction(button: string): void {
    this.showAssessmentAlert = false; // Hide the alert regardless of the choice

    if (button.toLowerCase() === 'assessment now' && this.jobToProcess) {
      const assessmentId = this.jobToProcess.assessment;
      // Navigate to the assessment rules page with the assessment_id as a route parameter.
      //is.router.navigate(['/flashyre-assessment-rules-card', assessmentId]);
      this.navigateToAssessment(assessmentId);
    }

    // Reset the context job if the user clicks "Later" or "Assessment Now"
    this.jobToProcess = null;
  }


  getRandomImage(): string {
    return this.images[Math.floor(Math.random() * this.images.length)];
  }

  get isLoadingMoreJobs(): boolean { return this.isLoadingMore; }
  get hasMoreJobs(): boolean { return this.displayedJobs.length < this.filteredJobs.length; }
  trackByJobId(index: number, job: any): number { return job.job_id; }
}