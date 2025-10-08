// src/app/components/job-cards/job-cards.component.ts

import { Component, OnInit, Output, EventEmitter, Input, TemplateRef, OnChanges, SimpleChanges } from '@angular/core';
import { JobsService } from '../../services/job.service';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';

@Component({
  selector: 'job-cards',
  templateUrl: './job-cards.component.html',
  styleUrls: ['./job-cards.component.css'],
})
export class JobCardsComponent implements OnInit, OnChanges {
  // --- Component Inputs ---
  @Input() rootClassName: string = '';
  @Input() text: TemplateRef<any> | null = null;
  @Input() text1: TemplateRef<any> | null = null;
  @Input() text2: TemplateRef<any> | null = null;
  // --- [MODIFIED] Added 'applied' to the possible display modes ---
  @Input() displayMode: 'recommended' | 'saved' | 'applied' = 'recommended';

  // --- Component Outputs ---
  @Output() jobSelected = new EventEmitter<number | undefined>();
  // --- [MODIFIED] Emitters for reporting job counts for all tabs ---
  @Output() recommendedJobsCount = new EventEmitter<number>();
  @Output() savedJobsCount = new EventEmitter<number>();
  @Output() appliedJobsCount = new EventEmitter<number>();


  // --- Public Properties for Template Binding ---
  public loading: boolean = false;
  public errorMessage: string | null = null;
  public jobs: any[] = [];
  public clickedIndex: number | null = null;

  // --- Private Properties ---
  private jobIdFromUrl: number | null = null;

  constructor(
    private jobService: JobsService,
    private route: ActivatedRoute
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['displayMode'] && !changes['displayMode'].firstChange) {
      console.log(`[JobCardsComponent] Display mode changed to: ${this.displayMode}`);
      // When switching tabs, clear the URL job ID context to prevent it from
      // interfering with the default selection of the new list.
      this.jobIdFromUrl = null;
      this.loadJobs();
    }
  }

  ngOnInit(): void {
    console.log('[JobCardsComponent] ngOnInit: Component is initializing.');
    this.route.queryParams.subscribe(params => {
      this.jobIdFromUrl = params['jobId'] ? +params['jobId'] : null;
      if (this.jobIdFromUrl) {
        console.log(`[JobCardsComponent] Found jobId=${this.jobIdFromUrl} in URL parameters.`);
      }
    });
    this.loadJobs();
  }

  /**
   * [MODIFIED] Centralized data loading logic.
   * Now handles 'recommended', 'saved', and 'applied' modes,
   * and emits the count of loaded jobs after a successful fetch for each mode.
   */
  private loadJobs(): void {
    this.loading = true;
    this.errorMessage = null;
    this.jobs = [];
    console.log(`[JobCardsComponent] loadJobs: Loading jobs for mode: '${this.displayMode}'`);

    let jobObservable: Observable<any[]>;
    const userId = localStorage.getItem('user_id');

    if (this.displayMode === 'saved') {
      if (!userId) {
        this.errorMessage = 'Could not find user ID to fetch saved jobs.';
        this.loading = false;
        this.savedJobsCount.emit(0);
        this.jobSelected.emit(undefined); // Ensure details panel is cleared
        return;
      }
      jobObservable = this.jobService.fetchSavedJobs(userId);
    } else if (this.displayMode === 'applied') {
        if (!userId) {
            this.errorMessage = 'Could not find user ID to fetch applied jobs.';
            this.loading = false;
            this.appliedJobsCount.emit(0);
            this.jobSelected.emit(undefined); // Ensure details panel is cleared
            return;
        }
        jobObservable = this.jobService.fetchAppliedJobDetails();
    } else {
      this.jobService.clearCache();
      jobObservable = this.jobService.fetchJobs();
    }

    jobObservable.subscribe({
      next: (data) => {
        console.log(`[JobCardsComponent] loadJobs: Received ${data.length} jobs.`);
        this.jobs = data;
        this.loading = false;

        const count = data.length;
        if (this.displayMode === 'saved') {
          this.savedJobsCount.emit(count);
        } else if (this.displayMode === 'applied') {
          this.appliedJobsCount.emit(count);
        } else {
          this.recommendedJobsCount.emit(count);
        }

        // --- [RESTORED] Original, correct job selection logic ---
        // This handles all cases correctly.
        if (this.jobIdFromUrl && this.jobs.some(job => job.job_id === this.jobIdFromUrl)) {
          // Case 1: A specific job ID from the URL is present in our list. Select it.
          const jobIndex = this.jobs.findIndex(job => job.job_id === this.jobIdFromUrl);
          if (jobIndex > 0) {
            const [selectedJob] = this.jobs.splice(jobIndex, 1);
            this.jobs.unshift(selectedJob);
          }
          this.selectJob(this.jobIdFromUrl);
        } else if (this.jobs.length > 0) {
          // Case 2: The list is not empty. Select the first job by default.
          this.selectJob(this.jobs[0].job_id);
        } else {
          // Case 3: The list is empty. Select nothing and inform the parent.
          // This allows the "No jobs available" message to be shown.
          this.clickedIndex = null;
          this.jobSelected.emit(undefined);
        }
      },
      error: (err) => {
        console.error('[JobCardsComponent] loadJobs: An error occurred.', err);
        this.errorMessage = err.message || 'Failed to load jobs. Please try again later.';
        this.jobs = [];
        this.loading = false;

        if (this.displayMode === 'saved') {
          this.savedJobsCount.emit(0);
        } else if (this.displayMode === 'applied') {
          this.appliedJobsCount.emit(0);
        } else {
          this.recommendedJobsCount.emit(0);
        }
        // Also inform parent that nothing is selected on error
        this.jobSelected.emit(undefined);
      }
    });
  }


  get selectedJobId(): number | null {
  return this.clickedIndex !== null && this.jobs[this.clickedIndex] 
    ? this.jobs[this.clickedIndex].job_id 
    : null;
}

  get displayedJobs() {
  return this.jobs;
}

  /**
   * Handles the click event on a job card. It sets the highlight and emits the selected job ID to the parent.
   * @param jobId The ID of the job that was clicked.
   */

public selectJob(jobId: number): void {
    console.log(`[JobCardsComponent] selectJob: Job card with ID ${jobId} was clicked.`);
    const clickedJobIndex = this.jobs.findIndex(job => job.job_id === jobId);
    if (clickedJobIndex !== -1) {
      this.clickedIndex = clickedJobIndex;
    }
    this.jobSelected.emit(jobId);
  }
}