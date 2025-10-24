// src/app/components/job-cards/job-cards.component.ts

import { Component, OnInit, Output, EventEmitter, Input, TemplateRef, OnChanges, SimpleChanges } from '@angular/core';
import { JobsService } from '../../services/job.service'; // Added from branch-2
import { ActivatedRoute, Router } from '@angular/router'; // Added from branch-2
import { Observable } from 'rxjs'; // Added from branch-2

@Component({
  selector: 'job-cards',
  templateUrl: './job-cards.component.html',
  styleUrls: ['./job-cards.component.css'],
})
export class JobCardsComponent implements OnInit, OnChanges {
  @Input() jobsToDisplay: any[] = [];
  @Input() selectedJobId: number | null = null;
  @Input() isLoading: boolean = true;
  @Input() errorMessage: string | null = null;
  @Input() noMatchesFound: boolean = false;
  @Input() rootClassName: string = '';
  @Input() text: TemplateRef<any> | null = null;
  @Input() text1: TemplateRef<any> | null = null;
  @Input() text2: TemplateRef<any> | null = null;
  @Input() displayMode?: 'recommended' | 'saved'; // Added from branch-2
  @Output() jobSelected = new EventEmitter<any>();
  @Output() recommendedJobsCount = new EventEmitter<number>(); // Added from branch-2
  @Output() savedJobsCount = new EventEmitter<number>(); // Added from branch-2

  public jobs: any[] = [];
  // public selectedJobIdInternal: number | null = null;

  private jobIdFromUrl: number | null = null; // Added from branch-2

  constructor(
    private jobService: JobsService, // Added from branch-2
    private route: ActivatedRoute, // Added from branch-2
    private router: Router // Added from branch-2
  ) {}

  ngOnInit(): void {
    // Logic from branch-2 for handling URL params and displayMode
    this.route.queryParams.subscribe(params => {
      const newJobId = params['jobId'] ? +params['jobId'] : null;
      if (newJobId !== this.jobIdFromUrl) {
        this.jobIdFromUrl = newJobId;
        // Only call handleSelectionFromUrl if jobs are already loaded or will be loaded
        if (this.jobs.length > 0 || !this.displayMode) { // Condition to ensure it runs even for jobsToDisplay
          this.handleSelectionFromUrl();
        }
      }
    });

    if (this.displayMode) {
      this.loadJobs();
    } else {
      // Original logic from branch-1, but now calling handleSelectionFromUrl instead of selectFirstJob directly
      this.jobs = this.jobsToDisplay;
      this.handleSelectionFromUrl();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Logic from branch-2 for handling displayMode changes
    if (changes['displayMode']) {
      if (this.displayMode) {
        this.loadJobs();
      } else {
        // If displayMode is removed, revert to jobsToDisplay logic
        this.jobs = this.jobsToDisplay;
        this.handleSelectionFromUrl();
      }
    }

    // Original logic from branch-1 for jobsToDisplay, now conditioned by displayMode
    if (changes['jobsToDisplay'] && !changes['jobsToDisplay'].firstChange) {
      if (!this.displayMode) {
        this.jobs = changes['jobsToDisplay'].currentValue;
        this.handleSelectionFromUrl(); // Use handleSelectionFromUrl
      }
    }
  }

  // Method from branch-2 to load jobs based on displayMode
  private loadJobs(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.jobs = []; // Clear jobs when loading new ones

    // Check cache for recommended jobs
    if (this.displayMode === 'recommended' && this.jobService.areJobsCached()) {
      const cachedJobs = this.jobService.getCachedJobs();
      this.handleJobData(cachedJobs);
      return;
    }

    let jobObservable: Observable<any[]>;

    if (this.displayMode === 'saved') {
      const userId = localStorage.getItem('user_id');
      if (userId) {
        jobObservable = this.jobService.fetchSavedJobs(userId);
      } else {
        this.errorMessage = 'Could not find user ID to fetch saved jobs.';
        this.isLoading = false;
        this.savedJobsCount.emit(0);
        return;
      }
    } else { // 'recommended' or any other default
      this.jobService.clearCache(); // Clear cache for new recommended jobs fetch
      jobObservable = this.jobService.fetchJobs();
    }

    jobObservable.subscribe({
      next: (data) => {
        this.handleJobData(data);
      },
      error: (err) => {
        this.errorMessage = err.message || 'Failed to load jobs. Please try again later.';
        this.jobs = [];
        this.isLoading = false;
        const count = 0;
        if (this.displayMode === 'saved') {
          this.savedJobsCount.emit(count);
        } else {
          this.recommendedJobsCount.emit(count);
        }
      }
    });
  }

  // Method from branch-2 to handle job data after loading
  private handleJobData(data: any[]): void {
    this.jobs = data;
    this.isLoading = false;

    const count = data.length;
    if (this.displayMode === 'saved') {
      this.savedJobsCount.emit(count);
    } else if (this.displayMode === 'recommended') { // Ensure recommended jobs count is also emitted
      this.recommendedJobsCount.emit(count);
    }

    this.handleSelectionFromUrl();
  }

  // Method from branch-2 to handle job selection based on URL parameter
  private handleSelectionFromUrl(): void {
    if (this.jobIdFromUrl) {
      const job = this.jobs.find(j => j.job_id === this.jobIdFromUrl);
      if (job) {
        // Move the selected job to the beginning of the array for better visibility/UX
        // const jobIndex = this.jobs.findIndex(j => j.job_id === this.jobIdFromUrl);
        // if (jobIndex > 0) {
        //   const [selectedJob] = this.jobs.splice(jobIndex, 1);
        //   this.jobs.unshift(selectedJob);
        // }
        this.selectJob(job); // Use selectJob to also update the URL with score
        return;
      }
    }
    // Fallback to selecting the first job if no ID in URL or job not found
    // this.selectFirstJob();
  }

  /**
   * Selects the first available job if jobs exist.
   * This method remains largely the same, but is called by handleSelectionFromUrl
   * and potentially directly if no displayMode is set.
   */
  // private selectFirstJob(): void {
  //   if (this.jobs && this.jobs.length > 0) {
  //     this.selectJob(this.jobs[0]); // Pass the full job object to selectJob
  //   } else {
  //     this.selectedJobIdInternal = null;
  //     this.jobSelected.emit(null);
  //     // Also clear URL params if no jobs are selected
  //     this.router.navigate([], {
  //       relativeTo: this.route,
  //       queryParams: { jobId: null, score: null },
  //       queryParamsHandling: 'merge',
  //     });
  //   }
  // }

  /**
   * Handles the click event on a job card and updates URL.
   * @param job The full job object that was clicked.
   */
  public selectJob(job: any): void {
    if (!job || !job.job_id) {
      this.jobSelected.emit(undefined);
    } else {
      // Just emit the event. The parent will handle the state change.
      this.jobSelected.emit(job);
    }
  }
}