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
  @Input() displayMode: 'recommended' | 'saved' = 'recommended';

  // --- Component Outputs ---
  @Output() jobSelected = new EventEmitter<number | undefined>();
  // --- [NEW] Emitters for reporting job counts ---
  @Output() recommendedJobsCount = new EventEmitter<number>();
  @Output() savedJobsCount = new EventEmitter<number>();


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
   * Now emits the count of loaded jobs after a successful fetch.
   */
  private loadJobs(): void {
    this.loading = true;
    this.errorMessage = null;
    this.jobs = [];
    console.log(`[JobCardsComponent] loadJobs: Loading jobs for mode: '${this.displayMode}'`);

    let jobObservable: Observable<any[]>;

    if (this.displayMode === 'saved') {
      const userId = localStorage.getItem('user_id');
      if (userId) {
        jobObservable = this.jobService.fetchSavedJobs(userId);
      } else {
        this.errorMessage = 'Could not find user ID to fetch saved jobs.';
        this.loading = false;
        console.error('[JobCardsComponent] ' + this.errorMessage);
        this.savedJobsCount.emit(0); // Emit 0 if there's an error
        return;
      }
    } else {
      this.jobService.clearCache();
      jobObservable = this.jobService.fetchJobs();
    }

    jobObservable.subscribe({
      next: (data) => {
        console.log(`[JobCardsComponent] loadJobs: Received ${data.length} jobs.`);
        this.jobs = data;
        this.loading = false;

        // --- [NEW] Emit the count based on the display mode ---
        const count = data.length;
        if (this.displayMode === 'saved') {
          this.savedJobsCount.emit(count);
        } else {
          this.recommendedJobsCount.emit(count);
        }

        // Handle pre-selection logic
        if (this.jobIdFromUrl && this.jobs.some(job => job.job_id === this.jobIdFromUrl)) {
          const jobIndex = this.jobs.findIndex(job => job.job_id === this.jobIdFromUrl);
          if (jobIndex > 0) {
            const [selectedJob] = this.jobs.splice(jobIndex, 1);
            this.jobs.unshift(selectedJob);
          }
          this.selectJob(this.jobIdFromUrl);
        } else if (this.jobs.length > 0) {
          this.selectJob(this.jobs[0].job_id);
        } else {
          this.clickedIndex = null;
          this.jobSelected.emit(undefined);
        }
      },
      error: (err) => {
        console.error('[JobCardsComponent] loadJobs: An error occurred.', err);
        this.errorMessage = err.message || 'Failed to load jobs. Please try again later.';
        this.jobs = [];
        this.loading = false;
        // --- [NEW] Emit 0 on error ---
        if (this.displayMode === 'saved') {
          this.savedJobsCount.emit(0);
        } else {
          this.recommendedJobsCount.emit(0);
        }
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