// src/app/components/job-cards/job-cards.component.ts

import { Component, OnInit, Output, EventEmitter, Input, TemplateRef, OnChanges, SimpleChanges } from '@angular/core';
import { JobsService } from '../../services/job.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';

@Component({
  selector: 'job-cards',
  templateUrl: './job-cards.component.html',
  styleUrls: ['./job-cards.component.css'],
})
export class JobCardsComponent implements OnInit, OnChanges {
  @Input() jobsToDisplay: any[] = [];
  @Input() selectedJobId: number | null = null; // From Branch-2, will be the primary source for selection
  @Input() isLoading: boolean = true;
  @Input() errorMessage: string | null = null;
  @Input() rootClassName: string = '';
  @Input() text: TemplateRef<any> | null = null;
  @Input() text1: TemplateRef<any> | null = null;
  @Input() text2: TemplateRef<any> | null = null;
  @Input() displayMode?: 'recommended' | 'saved'; // From Branch-2
  @Output() jobSelected = new EventEmitter<number | undefined>(); // Changed to emit number|undefined for compatibility

  // Outputs from Branch-2
  @Output() recommendedJobsCount = new EventEmitter<number>();
  @Output() savedJobsCount = new EventEmitter<number>();

  public jobs: any[] = [];
  // selectedJobIdInternal is no longer needed as `selectedJobId` @Input will serve this purpose.
  // The component will either use the `selectedJobId` input or determine it internally when `displayMode` is active.

  private jobIdFromUrl: number | null = null; // From Branch-2

  constructor(
    private jobService: JobsService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const newJobId = params['jobId'] ? +params['jobId'] : null;
      if (newJobId !== this.jobIdFromUrl) {
        this.jobIdFromUrl = newJobId;
        // Only call handleSelectionFromUrl if jobs are already loaded or will be loaded
        // This condition is important: if displayMode is present, jobs will be loaded via loadJobs().
        // If not, jobs come from jobsToDisplay. So we want to call handleSelectionFromUrl
        // whenever the jobs array is expected to be populated.
        if (this.jobs.length > 0 || this.displayMode || this.jobsToDisplay.length > 0) {
          this.handleSelectionFromUrl();
        }
      }
    });

    if (this.displayMode) {
      this.loadJobs();
    } else {
      // Original logic from branch-1, but now calling handleSelectionFromUrl instead of selectFirstJob directly
      // This path is for when jobs are passed via @Input jobsToDisplay
      this.jobs = this.jobsToDisplay;
      this.handleSelectionFromUrl();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Handle displayMode changes (from Branch-2)
    if (changes['displayMode']) {
      if (this.displayMode) {
        this.loadJobs();
      } else {
        // If displayMode is removed, revert to jobsToDisplay logic
        this.jobs = this.jobsToDisplay;
        this.handleSelectionFromUrl();
      }
    }

    // Handle jobsToDisplay changes (from Branch-1), now conditioned by displayMode
    // Only update if not in displayMode, as displayMode will load its own jobs.
    if (changes['jobsToDisplay'] && !changes['jobsToDisplay'].firstChange && !this.displayMode) {
      this.jobs = changes['jobsToDisplay'].currentValue;
      this.handleSelectionFromUrl(); // Use handleSelectionFromUrl
    }

    // Choke Point: How to handle selectedJobId input changes
    // If selectedJobId changes, and we are not in displayMode (where component manages its own selection),
    // we should update the URL to reflect the new selectedJobId.
    if (changes['selectedJobId'] && !changes['selectedJobId'].firstChange && !this.displayMode) {
      // Only navigate if the input selectedJobId is different from the current jobId in the URL
      // This prevents unnecessary router navigations
      if (this.selectedJobId !== this.jobIdFromUrl) {
         // Find the job to get its score if available, or default to 0
        const job = this.jobs.find(j => j.job_id === this.selectedJobId);
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: {
            jobId: this.selectedJobId,
            score: job?.matching_score ?? null // Only update score if a job is found
          },
          queryParamsHandling: 'merge',
        });
      }
    }
  }

  private loadJobs(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.jobs = []; // Clear jobs when loading new ones

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

  private handleJobData(data: any[]): void {
    this.jobs = data;
    this.isLoading = false;

    const count = data.length;
    if (this.displayMode === 'saved') {
      this.savedJobsCount.emit(count);
    } else if (this.displayMode === 'recommended') {
      this.recommendedJobsCount.emit(count);
    }

    this.handleSelectionFromUrl();
  }

  private handleSelectionFromUrl(): void {
    // If a jobId is in the URL, try to select that job.
    if (this.jobIdFromUrl) {
      const job = this.jobs.find(j => j.job_id === this.jobIdFromUrl);
      if (job) {
        // Reintroduce the logic to move the selected job to the beginning of the array for better visibility/UX (from Branch-1)
        const jobIndex = this.jobs.findIndex(j => j.job_id === this.jobIdFromUrl);
        if (jobIndex > 0) {
          const [selectedJob] = this.jobs.splice(jobIndex, 1);
          this.jobs.unshift(selectedJob);
        }
        // Use selectJob to update both the internal selectedJobId and the URL (if applicable)
        this.selectJob(job);
        return; // If job from URL is found and selected, don't fall through to selectFirstJob
      }
    }

    // Choke Point: Should we always select the first job if no ID in URL or job not found?
    // Branch-1 did this, Branch-2 commented it out.
    // If displayMode is active, the component is responsible for its own selection, so selectFirstJob makes sense.
    // If displayMode is NOT active, the parent typically controls selection via `selectedJobId` input.
    // However, if `jobsToDisplay` is provided and no `selectedJobId` is specified via input or URL,
    // selecting the first job provides a good default UX.
    // Let's keep it, but make sure it plays nicely with the `@Input selectedJobId`.

    // Only select the first job if no specific job has been selected (either from URL or input)
    // and if we have jobs to display.
    if (!this.selectedJobId && this.jobs.length > 0) {
      this.selectFirstJob();
    } else if (this.selectedJobId && !this.jobs.find(j => j.job_id === this.selectedJobId)) {
        // If selectedJobId input is present but the job is not in the current list,
        // we might want to clear the selection or re-select the first valid job.
        // For now, let's fall back to selecting the first job if the input selectedJobId is not found.
        this.selectFirstJob();
    }
  }

  /**
   * Selects the first available job if jobs exist. (Reintroduced from Branch-1)
   * This method remains largely the same, but is called by handleSelectionFromUrl.
   */
  private selectFirstJob(): void {
    if (this.jobs && this.jobs.length > 0) {
      this.selectJob(this.jobs[0]); // Pass the full job object to selectJob
    } else {
      // If no jobs, clear selection
      this.selectedJobId = null; // Update the @Input property to reflect no selection
      this.jobSelected.emit(undefined);
      // Also clear URL params if no jobs are selected
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { jobId: null, score: null },
        queryParamsHandling: 'merge',
      });
    }
  }

  /**
   * Handles the click event on a job card and updates URL.
   * @param job The full job object that was clicked.
   */
  public selectJob(job: any): void {
    if (!job || !job.job_id) {
      this.selectedJobId = null;
      this.jobSelected.emit(undefined);
      // Clear jobId and score from URL if no job is selected
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { jobId: null, score: null },
        queryParamsHandling: 'merge',
      });
      return;
    }

    // Update the internal state for selectedJobId (which is also an @Input)
    // This allows the template to react to clicks immediately, even if the parent doesn't propagate it back instantly.
    this.selectedJobId = job.job_id;
    this.jobSelected.emit(job.job_id); // Emit the job_id (as per Branch-1 output type)

    // Navigate to update URL with job_id and matching_score (Reintroduced from Branch-1)
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        jobId: job.job_id,
        score: job.matching_score ?? null // Use nullish coalescing for score, can be null if not present
      },
      queryParamsHandling: 'merge',
    });
  }
}