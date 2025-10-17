// src/app/components/job-cards/job-cards.component.ts

import { Component, OnInit, Output, EventEmitter, Input, TemplateRef, OnChanges, SimpleChanges } from '@angular/core';
import { JobsService } from '../../services/job.service'; // From branch-1
import { ActivatedRoute, Router } from '@angular/router'; // From branch-1
import { Observable } from 'rxjs'; // From branch-1

@Component({
  selector: 'job-cards',
  templateUrl: './job-cards.component.html',
  styleUrls: ['./job-cards.component.css'],
})
export class JobCardsComponent implements OnInit, OnChanges {
  // --- Component Inputs (Combined) ---
  @Input() rootClassName: string = '';
  @Input() text: TemplateRef<any> | null = null;
  @Input() text1: TemplateRef<any> | null = null;
  @Input() text2: TemplateRef<any> | null = null;
  // displayMode from branch-1
  @Input() displayMode: 'recommended' | 'saved' = 'recommended'; 

  // --- Component Outputs (Combined) ---
  @Output() jobSelected = new EventEmitter<number | undefined>();
  // Emitters for reporting job counts from branch-1
  @Output() recommendedJobsCount = new EventEmitter<number>(); 
  @Output() savedJobsCount = new EventEmitter<number>(); 

  // --- Public Properties for Template Binding (Combined) ---
  public loading: boolean = false; // From branch-1 (branch-2 had isLoading input, but branch-1 manages internally)
  public errorMessage: string | null = null; // From branch-1 (branch-2 had errorMessage input, but branch-1 manages internally)
  public jobs: any[] = []; // Managed internally by this component now (from branch-1)
  public clickedIndex: number | null = null;

  // --- Private Properties ---
  private jobIdFromUrl: number | null = null; // From branch-1

  constructor(
    private jobService: JobsService, // From branch-1
    private route: ActivatedRoute, // From branch-1
    private router: Router // From branch-1
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    // Logic from branch-1: respond to displayMode changes
    if (changes['displayMode'] && !changes['displayMode'].firstChange) {
      console.log(`[JobCardsComponent] Display mode changed to: ${this.displayMode}`);
      this.loadJobs();
    }
    // Note: jobsToDisplay, isLoading, errorMessage inputs from branch-2 are removed
    // as this component now handles its own data fetching.
  }

  ngOnInit(): void {
    console.log('[JobCardsComponent] ngOnInit: Component is initializing.');
    // Logic from branch-1: Subscribe to query params for initial job selection
    this.route.queryParams.subscribe(params => {
      this.jobIdFromUrl = params['jobId'] ? +params['jobId'] : null;
      if (this.jobIdFromUrl) {
        console.log(`[JobCardsComponent] Found jobId=${this.jobIdFromUrl} in URL parameters.`);
      }
      // Load jobs after potentially getting a jobId from URL
      this.loadJobs(); 
    });
    // Initial loadJobs call is now moved inside the queryParams subscription to ensure jobIdFromUrl is set.
    // If not, it would load twice.
  }

  /**
   * Centralized data loading logic from branch-1.
   * Now emits the count of loaded jobs after a successful fetch.
   */
  private loadJobs(): void {
    this.loading = true;
    this.errorMessage = null;
    this.jobs = []; // Clear current jobs

    // Logic for cached jobs from branch-1
    if (this.displayMode === 'recommended' && this.jobService.areJobsCached()) {
      console.log('[JobCardsComponent] Loading jobs from cache.');
      const cachedJobs = this.jobService.getCachedJobs();
      this.handleJobData(cachedJobs);
      return; 
    }

    let jobObservable: Observable<any[]>;

    // Logic for fetching saved or recommended jobs from branch-1
    if (this.displayMode === 'saved') {
      const userId = localStorage.getItem('user_id');
      if (userId) {
        jobObservable = this.jobService.fetchSavedJobs(userId);
      } else {
        this.errorMessage = 'Could not find user ID to fetch saved jobs.';
        this.loading = false;
        console.error('[JobCardsComponent] ' + this.errorMessage);
        this.savedJobsCount.emit(0); 
        return;
      }
    } else {
      this.jobService.clearCache();
      jobObservable = this.jobService.fetchJobs();
    }

    jobObservable.subscribe({
      next: (data) => {
        console.log(`[JobCardsComponent] loadJobs: Received ${data.length} jobs.`);
        this.handleJobData(data); // Use the unified handler
      },
      error: (err) => {
        console.error('[JobCardsComponent] loadJobs: An error occurred.', err);
        this.errorMessage = err.message || 'Failed to load jobs. Please try again later.';
        this.jobs = [];
        this.loading = false;
        // Emit 0 on error
        if (this.displayMode === 'saved') {
          this.savedJobsCount.emit(0);
        } else {
          this.recommendedJobsCount.emit(0);
        }
      }
    });
  }

  /**
   * Unified handler for job data, derived from branch-1's private method.
   * Handles setting jobs, emitting counts, and initial selection.
   */
  private handleJobData(data: any[]): void {
    console.log(`[JobCardsComponent] handleJobData: Processing ${data.length} jobs.`);
    this.jobs = data;
    this.loading = false;

    // Emit the count based on the display mode (from branch-1)
    const count = data.length;
    if (this.displayMode === 'saved') {
      this.savedJobsCount.emit(count);
    } else {
      this.recommendedJobsCount.emit(count);
    }

    // Handle pre-selection logic (modified from branch-1 to use a full job object for selectJob)
    if (this.jobIdFromUrl && this.jobs.some(job => job.job_id === this.jobIdFromUrl)) {
      const jobIndex = this.jobs.findIndex(job => job.job_id === this.jobIdFromUrl);
      if (jobIndex > 0) {
        // Move selected job to the front
        const [selectedJob] = this.jobs.splice(jobIndex, 1);
        this.jobs.unshift(selectedJob);
      }
      // Find the full job object to select it
      const jobToSelect = this.jobs.find(j => j.job_id === this.jobIdFromUrl);
      if (jobToSelect) {
        this.selectJob(jobToSelect); // Call selectJob with the full job object
      }
    } else if (this.jobs.length > 0) {
      this.selectJob(this.jobs[0]); // Select the first job if no ID from URL (from branch-2's selectFirstJob logic)
    } else {
      this.clickedIndex = null;
      this.jobSelected.emit(undefined);
    }
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
   * This version is from branch-1, which updates the URL query parameters.
   * @param job The full job object that was clicked.
   */
  public selectJob(job: any): void {
    console.log(`[JobCardsComponent] Selecting job:`, job);
    if (!job || job.job_id === undefined) return; // Ensure job and job_id exist

    const clickedJobIndex = this.jobs.findIndex(j => j.job_id === job.job_id);
    if (clickedJobIndex !== -1) {
      this.clickedIndex = clickedJobIndex;
    }
    
    // Update the URL's query parameters (from branch-1)
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        jobId: job.job_id,
        score: job.matching_score ?? 0 // Use the score from the job object
      },
      queryParamsHandling: 'merge', // Keep other query params if any
    });

    // Emit the ID for other potential listeners (from both branches)
    this.jobSelected.emit(job.job_id);
  }
}