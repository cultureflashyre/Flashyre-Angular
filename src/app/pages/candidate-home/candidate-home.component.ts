import { Component, OnInit, AfterViewInit, OnDestroy, HostListener } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
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

  // NOTE: This apiUrl is no longer used for fetching jobs directly in this component,
  // which was the source of the error. All calls now go through services.
  private apiUrl = environment.apiUrl + 'api/jobs/';

  constructor(
    private title: Title,
    private meta: Meta,
    private http: HttpClient, // Kept for other potential uses, though not for the job fetch here.
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
          // Pass the cached jobs to be filtered
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
          // Pass the newly fetched jobs to be filtered
          this.filterAndDisplayJobs(jobs);
        },
        error => {
          console.error('Error fetching jobs:', error);
          this.isLoading = false;
        }
      );
  }

  /**
   * Filters out applied-for jobs and then fetches matching scores.
   */
  private filterAndDisplayJobs(jobs: any[]): void {
    // 1. Only fetch the list of applied jobs. This request is authenticated by the HttpInterceptor.
    this.authService.getAppliedJobs().subscribe(
      (appliedJobsResponse) => {
        // 2. Get the array of applied job IDs from the response.
        this.appliedJobIds = appliedJobsResponse.applied_job_ids || [];

        // 3. Filter the *existing* jobs array to exclude those the user has already applied to.
        this.jobs = jobs.filter(job => !this.appliedJobIds.includes(job.job_id));

        // 4. After filtering, fetch the matching scores for the remaining jobs.
        this.fetchAndMergeMatchScores();

        // 5. Reset pagination and load the first page of the filtered jobs.
        this.currentPage = 0;
        this.displayedJobs = [];
        this.loadNextPage();
        this.isLoading = false;
      },
      (error) => {
        // This error handler is for the getAppliedJobs call.
        console.error('Error fetching applied jobs, proceeding without filtering:', error);

        // Fallback: If we can't get the applied jobs list, show all jobs.
        this.jobs = jobs;

        // Also fetch scores in the error case.
        this.fetchAndMergeMatchScores();

        this.currentPage = 0;
        this.displayedJobs = [];
        this.loadNextPage();
        this.isLoading = false;
      }
    );
  }

  /**
   * Extracts job IDs, fetches their match scores, and merges them back into the main job objects.
   */
  private fetchAndMergeMatchScores(): void {
    // 1. Check if there are any jobs to score.
    if (!this.jobs || this.jobs.length === 0) {
      return; // Nothing to do.
    }

    // 2. Extract all job IDs into a new array.
    const jobIds = this.jobs.map(job => job.job_id);

    // 3. Call the service to get the scores.
    this.authService.getMatchScores(jobIds)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (scores) => {
          // 4. Merge the returned scores into the corresponding job objects.
          this.jobs.forEach(job => {
            if (scores[job.job_id] !== undefined) {
              job.matching_score = scores[job.job_id];
            } else {
              job.matching_score = 0; // Default to 0 if no score is returned
            }
          });
          console.log('Successfully fetched and merged match scores.');
        },
        error: (err) => {
          console.error('Could not fetch match scores:', err);
          // Optional: Set a default score for all jobs on error
          this.jobs.forEach(job => job.matching_score = 0);
        }
      });
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

  loadMoreJobs(): void {
    this.loadNextPage();
  }

  loadUserProfile(): void {
    const profileData = localStorage.getItem('userProfile');
    if (profileData) {
      this.userProfile = JSON.parse(profileData);
    } else {
      console.log("User Profile NOT fetched");
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