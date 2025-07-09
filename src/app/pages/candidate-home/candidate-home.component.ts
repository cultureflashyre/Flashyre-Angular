import { Component, OnInit, AfterViewInit, OnDestroy, HostListener } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../services/candidate.service';
import { JobsService } from '../../services/job.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'candidate-home',
  templateUrl: 'candidate-home.component.html',
  styleUrls: ['candidate-home.component.css'],
})
export class CandidateHome implements OnInit, AfterViewInit, OnDestroy {
  userProfile: any = {};
  defaultProfilePicture: string = "https://storage.googleapis.com/cv-storage-sample1/placeholder_images/profile-placeholder.jpg";
  
  // Job related properties
  jobs: any[] = [];
  displayedJobs: any[] = [];
  appliedJobIds: number[] = [];
  
  // Pagination properties
  private currentPage = 0;
  private jobsPerPage = 30;
  private isLoadingMore = false;
  
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
    // Initialize intersection observer after view is ready
    setTimeout(() => {
      this.setupInfiniteScroll();
    }, 100);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  /**
   * Initialize jobs - check cache first, then fetch if needed
   */
  private initializeJobs(): void {
    this.isLoading = true;
    
    // Check if jobs are already cached
    if (this.jobService.areJobsCached()) {
      console.log('Loading jobs from cache...');
      this.loadJobsFromCache();
    } else {
      console.log('Fetching jobs from API...');
      this.fetchJobsFromAPI();
    }
  }

  /**
   * Load jobs from cache
   */
  private loadJobsFromCache(): void {
    this.jobService.getJobs()
      .pipe(takeUntil(this.destroy$))
      .subscribe(jobs => {
        if (jobs.length > 0) {
          this.filterAndDisplayJobs(jobs);
        }
      });
  }

  /**
   * Fetch jobs from API
   */
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

  /**
   * Filter jobs and set up initial display
   */
  private filterAndDisplayJobs(jobs: any[]): void {
    forkJoin({
      jobs: this.http.get<any[]>(this.apiUrl),
      appliedJobs: this.authService.getAppliedJobs()
    }).subscribe(
      (results) => {
        this.appliedJobIds = results.appliedJobs.applied_job_ids || [];
        this.jobs = results.jobs.filter(job => !this.appliedJobIds.includes(job.job_id));
        this.currentPage = 0;
        this.displayedJobs = [];
        this.loadNextPage();
        this.isLoading = false;
      },
      (error) => {
        console.error('Error fetching data:', error);
        this.jobs = jobs;
        this.currentPage = 0;
        this.displayedJobs = [];
        this.loadNextPage();
        this.isLoading = false;
      }
    );
  }

  /**
   * Load the next page of jobs
   */
  private loadNextPage(): void {
    if (this.isLoadingMore || this.displayedJobs.length >= this.jobs.length) {
      return;
    }

    this.isLoadingMore = true;
    
    const startIndex = this.currentPage * this.jobsPerPage;
    const endIndex = startIndex + this.jobsPerPage;
    const nextJobs = this.jobs.slice(startIndex, endIndex);
    
    if (nextJobs.length > 0) {
      this.displayedJobs = [...this.displayedJobs, ...nextJobs];
      this.currentPage++;
      console.log(`Loaded page ${this.currentPage}, showing ${this.displayedJobs.length} of ${this.jobs.length} jobs`);
    }
    
    this.isLoadingMore = false;
    
    // Re-setup intersection observer after DOM updates
    setTimeout(() => {
      this.setupInfiniteScroll();
    }, 100);
  }

  /**
   * Setup infinite scroll using Intersection Observer
   */
  private setupInfiniteScroll(): void {
    if (this.observer) {
      this.observer.disconnect();
    }

    const loadMoreElement = document.getElementById('load-more');
    if (!loadMoreElement || this.displayedJobs.length >= this.jobs.length) {
      return;
    }

    const options = {
      root: null,
      rootMargin: '100px',
      threshold: 0.1
    };

    this.observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !this.isLoadingMore) {
        this.loadNextPage();
      }
    }, options);

    this.observer.observe(loadMoreElement);
  }

  /**
   * Load more jobs
   */
  loadMoreJobs(): void {
    this.loadNextPage();
  }

  /**
   * Load user profile from localStorage
   */
  loadUserProfile(): void {
    const profileData = localStorage.getItem('userProfile');
    if (profileData) {
      this.userProfile = JSON.parse(profileData);
    } else {
      console.log("User Profile NOT fetched");
    }
  }

  /**
   * Navigate to assessment page
   */
  navigateToAssessment(jobId: number): void {
    this.router.navigate(['/flashyre-assessment11', jobId]);
  }

  /**
   * Apply for a job
   */
  applyForJob(jobId: number, index: number): void {
    this.processingApplications[jobId] = true;
    
    this.authService.applyForJob(jobId)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (response) => {
          console.log('Application successful:', response);
          this.applicationSuccess[jobId] = true;
          this.appliedJobIds.push(jobId);
          
          // Remove job from cache and display after 2 seconds
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

  /**
   * Get random image for jobs without logos
   */
  getRandomImage(): string {
    const randomIndex = Math.floor(Math.random() * this.images.length);
    return this.images[randomIndex];
  }

  /**
   * Refresh jobs (force fetch from API)
   */
  refreshJobs(): void {
    this.jobService.clearCache_refresh();
    this.initializeJobs();
  }

  /**
   * Get loading state for more jobs
   */
  get isLoadingMoreJobs(): boolean {
    return this.isLoadingMore;
  }

  /**
   * Check if there are more jobs to load
   */
  get hasMoreJobs(): boolean {
    return this.displayedJobs.length < this.jobs.length;
  }

  /**
   * TrackBy function for job list
   */
  trackByJobId(index: number, job: any): number {
    return job.job_id;
  }

  /**
   * Check if user has scrolled to bottom manually (fallback for intersection observer)
   */
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

  /**
   * Retry fetching jobs in case of network error
   */
  retryFetchJobs(): void {
    this.isLoading = true;
    this.fetchJobsFromAPI();
  }

  /**
   * Get job loading progress percentage
   */
  getLoadingProgress(): number {
    if (this.jobs.length === 0) return 0;
    return Math.round((this.displayedJobs.length / this.jobs.length) * 100);
  }

  /**
   * Scroll to top of job list
   */
  scrollToTop(): void {
    const jobContainer = document.getElementById('job-container');
    if (jobContainer) {
      jobContainer.scrollIntoView({ behavior: 'smooth' });
    }
  }

  /**
   * Debug method to check cache status
   */
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