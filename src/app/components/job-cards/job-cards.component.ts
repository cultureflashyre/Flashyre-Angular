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

  /**
   * [NEW] Input to control which jobs to display.
   * Can be 'recommended' or 'saved'. Defaults to 'recommended'.
   */
  @Input() displayMode: 'recommended' | 'saved' = 'recommended';

  // --- Component Outputs ---
  @Output() jobSelected = new EventEmitter<number | undefined>();

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

  /**
   * OnChanges lifecycle hook.
   * This is triggered whenever an @Input() property changes. We use it to detect
   * when the user clicks a different tab in the parent component.
   * @param changes An object containing the changed input properties.
   */
  ngOnChanges(changes: SimpleChanges): void {
    // We check if the 'displayMode' input has changed and if it's not the very first change.
    if (changes['displayMode'] && !changes['displayMode'].firstChange) {
      console.log(`[JobCardsComponent] Display mode changed to: ${this.displayMode}`);
      // When the mode changes, we trigger a fresh data load.
      this.loadJobs();
    }
  }

  /**
   * ngOnInit lifecycle hook.
   * This runs once when the component is initialized. It's used for setup tasks.
   */
  ngOnInit(): void {
    console.log('[JobCardsComponent] ngOnInit: Component is initializing.');

    // We subscribe to the URL query parameters to check if a specific job should be pre-selected on load.
    // This handles deep-linking to a specific job detail view.
    this.route.queryParams.subscribe(params => {
      this.jobIdFromUrl = params['jobId'] ? +params['jobId'] : null;
      if (this.jobIdFromUrl) {
        console.log(`[JobCardsComponent] Found jobId=${this.jobIdFromUrl} in URL parameters.`);
      }
    });

    // We perform the initial data load based on the default displayMode ('recommended').
    this.loadJobs();
  }

  /**
   * [REFACTORED] Centralized data loading logic.
   * This function is now the single source for fetching job data. It determines whether
   * to fetch "recommended" or "saved" jobs based on the current `displayMode`.
   */
  private loadJobs(): void {
    this.loading = true;
    this.errorMessage = null;
    this.jobs = []; // Clear current jobs before loading new ones
    console.log(`[JobCardsComponent] loadJobs: Loading jobs for mode: '${this.displayMode}'`);

    let jobObservable: Observable<any[]>;

    if (this.displayMode === 'saved') {
      const userId = localStorage.getItem('user_id');
      if (userId) {
        // If mode is 'saved', call the new service method.
        jobObservable = this.jobService.fetchSavedJobs(userId);
      } else {
        // Handle the case where the user ID is not available.
        this.errorMessage = 'Could not find user ID to fetch saved jobs.';
        this.loading = false;
        console.error('[JobCardsComponent] ' + this.errorMessage);
        return;
      }
    } else {
      // Default to 'recommended' mode.
      // We clear the cache to ensure the list is fresh if the user toggles back and forth.
      this.jobService.clearCache();
      jobObservable = this.jobService.fetchJobs();
    }

    // We subscribe to the chosen observable to get the job data.
    jobObservable.subscribe({
      next: (data) => {
        console.log(`[JobCardsComponent] loadJobs: Received ${data.length} jobs.`);
        this.jobs = data;
        this.loading = false;

        // After data is loaded, handle pre-selection logic.
        // Check if a job ID from the URL exists in our newly loaded list.
        if (this.jobIdFromUrl && this.jobs.some(job => job.job_id === this.jobIdFromUrl)) {
          console.log(`[JobCardsComponent] Pre-selecting job ${this.jobIdFromUrl} from URL.`);
          const jobIndex = this.jobs.findIndex(job => job.job_id === this.jobIdFromUrl);

          // Move the selected job to the top of the list for better visibility.
          if (jobIndex > 0) {
            const [selectedJob] = this.jobs.splice(jobIndex, 1);
            this.jobs.unshift(selectedJob);
          }
          this.selectJob(this.jobIdFromUrl);

        } else if (this.jobs.length > 0) {
          // If no job is selected via URL, automatically select the first job in the list.
          console.log('[JobCardsComponent] No job pre-selected. Defaulting to the first job.');
          this.selectJob(this.jobs[0].job_id);
        } else {
          // If no jobs are returned, clear any selection.
          this.clickedIndex = null;
          this.jobSelected.emit(undefined); // Notify parent that no job is selected.
          console.log('[JobCardsComponent] loadJobs: Received 0 jobs. Nothing to display or select.');
        }
      },
      error: (err) => {
        console.error('[JobCardsComponent] loadJobs: An error occurred.', err);
        this.errorMessage = err.message || 'Failed to load jobs. Please try again later.';
        this.jobs = []; // Ensure jobs list is empty on error.
        this.loading = false;
      }
    });
  }

  /**
   * Handles the click event on a job card. It sets the highlight style and emits
   * the selected job ID to the parent component (`candidate-job-detail-view`).
   * @param jobId The ID of the job that was clicked.
   */
  public selectJob(jobId: number): void {
    console.log(`[JobCardsComponent] selectJob: Job card with ID ${jobId} was clicked.`);

    // Find the index of the clicked job to apply the 'clicked' class.
    const clickedJobIndex = this.jobs.findIndex(job => job.job_id === jobId);
    if (clickedJobIndex !== -1) {
      this.clickedIndex = clickedJobIndex;
    }

    // Notify the parent component of the selection, so it can update the details view.
    this.jobSelected.emit(jobId);
  }
}