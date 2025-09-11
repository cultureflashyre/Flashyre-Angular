import { Component, OnInit, AfterViewInit, OnDestroy, HostListener } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../../services/candidate.service';
import { JobsService } from '../../services/job.service';
import { environment } from '../../../environments/environment';
import { trigger, state, style, transition, animate, keyframes } from '@angular/animations';
import { ViewChild, ElementRef } from '@angular/core'; // Add ElementRef if not already

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
  jobs: any[] = []; // Master list of jobs
  filteredJobs: any[] = []; // Jobs after search filters are applied
  displayedJobs: any[] = []; // Paginated jobs for the view
  appliedJobIds: number[] = [];
  
  // Search model properties
  searchJobTitle: string = '';
  searchLocation: string = '';
  searchExperience: string = '';
  
  // Pagination properties
  private currentPage = 0;
  private jobsPerPage = 30;
  private isLoadingMore = false;
  showMoreFilters: boolean = false;
  searchDatePosted: string = '';
  searchExperienceLevel: string = '';
  searchDepartment: string = '';
  searchSalary: string = '';
  // searchLocation already exists, but can override
  searchCompanyName: string = '';
  searchIndustries: string = '';
  searchWorkMode: string = '';
  searchRole: string = '';
  
  // Application state
  processingApplications: { [key: number]: boolean } = {};
  applicationSuccess: { [key: number]: boolean } = {};
  isLoading: boolean = true;
  
  // Intersection Observer
  private observer: IntersectionObserver | null = null;
  private destroy$ = new Subject<void>();

  // Random images for jobs without logos
  images = [
    'src/assets/temp-jobs-icon/1.png',
    'src/assets/temp-jobs-icon/2.png',
    'src/assets/temp-jobs-icon/3.png',
    'src/assets/temp-jobs-icon/4.png',
    'src/assets/temp-jobs-icon/5.png',
    'src/assets/temp-jobs-icon/6.png',
    'src/assets/temp-jobs-icon/7.png',
    'src/assets/temp-jobs-icon/8.png'
  ];
  // Add these properties:
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

  /**
   * Method called when the search button is clicked
   */
  onSearch(): void {
    let tempJobs = [...this.jobs];

    // Filter by Job Title / Keyword from the main search bar
    if (this.searchJobTitle.trim()) {
      const searchTerm = this.searchJobTitle.toLowerCase().trim();
      tempJobs = tempJobs.filter(job => {
        // Check multiple fields for the search term
        return (job.title && job.title.toLowerCase().includes(searchTerm)) ||
               (job.company_name && job.company_name.toLowerCase().includes(searchTerm)) ||
               (job.location && job.location.toLowerCase().includes(searchTerm)) ||
               (job.job_type && job.job_type.toLowerCase().includes(searchTerm)) ||
               (job.description && job.description.toLowerCase().includes(searchTerm));
      });
    }

    // Filter by Location
    if (this.searchLocation.trim()) {
      const searchTerm = this.searchLocation.toLowerCase().trim();
      tempJobs = tempJobs.filter(job => 
        job.location && job.location.toLowerCase().includes(searchTerm)
      );
    }

    // Filter by Experience
    if (this.searchExperience.trim()) {
      const searchExp = parseInt(this.searchExperience, 10);
      if (!isNaN(searchExp)) {
        tempJobs = tempJobs.filter(job => 
          job.experience_required != null && job.experience_required >= searchExp
        );
      }
    }

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
    
    // Reset pagination and display results
    this.currentPage = 0;
    this.displayedJobs = [];
    this.loadNextPage();
    this.setupInfiniteScroll();
  }

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
        jobs => {
          this.filterAndDisplayJobs(jobs);
        },
        error => {
          console.error('Error fetching jobs:', error);
          this.isLoading = false;
        }
      );
  }

  onApplyFilters(filters: any): void {
  this.searchDatePosted = filters.datePosted;
  this.searchExperienceLevel = filters.experienceLevel;
  this.searchDepartment = filters.department;
  this.searchSalary = filters.salary;
  this.searchLocation = filters.location; // Override main search if filled
  this.searchCompanyName = filters.companyName;
  this.searchIndustries = filters.industries;
  this.searchWorkMode = filters.workMode;
  this.searchRole = filters.role;
  // this.searchExperience already exists, but can add level if different
  this.onSearch();
  this.showMoreFilters = false; // Close modal after apply
}

  private filterAndDisplayJobs(jobs: any[]): void {
    this.authService.getAppliedJobs().subscribe(
      (appliedJobsResponse) => {
        this.appliedJobIds = appliedJobsResponse.applied_job_ids || [];
        this.jobs = jobs.filter(job => !this.appliedJobIds.includes(job.job_id));
        this.filteredJobs = [...this.jobs]; // Initialize filtered list
        
        this.currentPage = 0;
        this.displayedJobs = [];
        this.loadNextPage();
        this.isLoading = false;
      },
      (error) => {
        console.error('Error fetching applied jobs, proceeding without filtering:', error);
        this.jobs = jobs;
        this.filteredJobs = [...this.jobs]; // Initialize filtered list
        
        this.currentPage = 0;
        this.displayedJobs = [];
        this.loadNextPage();
        this.isLoading = false;
      }
    );
  }

  private loadNextPage(): void {
    // Logic now works on the filteredJobs array
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
    }
    
    this.isLoadingMore = false;
    
    setTimeout(() => {
      this.setupInfiniteScroll();
    }, 100);
  }

  private setupInfiniteScroll(): void {
    if (this.observer) {
      this.observer.disconnect();
    }

    const loadMoreElement = document.getElementById('load-more');
    if (!loadMoreElement || !this.hasMoreJobs) {
      return;
    }

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
    if (profileData) {
      this.userProfile = JSON.parse(profileData);
    }
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
          console.log('Application successful:', response);
          this.applicationSuccess[jobId] = true;
          this.appliedJobIds.push(jobId);
          
          setTimeout(() => {
            this.jobService.removeJobFromCache(jobId);
            this.jobs = this.jobs.filter(job => job.job_id !== jobId);
            this.displayedJobs = this.displayedJobs.filter(job => job.job_id !== jobId);
          }, 2000);
        },
        (error) => {
          console.error('Application failed:', error);
          this.processingApplications[jobId] = false;
          alert(error.error?.error || 'Failed to apply for this job');
        }
      );
  }

  getRandomImage(): string {
    const randomIndex = Math.floor(Math.random() * this.images.length);
    return this.images[randomIndex];
  }

  refreshJobs(): void {
    this.jobService.clearCache_refresh();
    this.initializeJobs();
  }

  get isLoadingMoreJobs(): boolean {
    return this.isLoadingMore;
  }

  get hasMoreJobs(): boolean {
    return this.displayedJobs.length < this.jobs.length;
  }

  trackByJobId(index: number, job: any): number {
    return job.job_id;
  }

  @HostListener('window:scroll', ['$event'])
  onWindowScroll(event: any): void {
    if (!this.observer) {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;
      
      if ((scrollTop + clientHeight >= scrollHeight - 100) && this.hasMoreJobs && !this.isLoadingMoreJobs) {
        this.loadNextPage();
      }
    }
  }

  retryFetchJobs(): void {
    this.isLoading = true;
    this.fetchJobsFromAPI();
  }

  getLoadingProgress(): number {
    if (this.jobs.length === 0) return 0;
    return Math.round((this.displayedJobs.length / this.jobs.length) * 100);
  }

  scrollToTop(): void {
    const jobContainer = document.getElementById('job-container');
    if (jobContainer) {
      jobContainer.scrollIntoView({ behavior: 'smooth' });
    }
  }

  checkCacheStatus(): void {
    console.log('Cache Status:', {
      isCached: this.jobService.areJobsCached(),
      totalJobs: this.jobs.length,
      displayedJobs: this.displayedJobs.length,
      currentPage: this.currentPage,
      hasMore: this.hasMoreJobs
    });
  }
}