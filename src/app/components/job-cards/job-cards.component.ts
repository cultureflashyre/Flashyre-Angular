import { Component, OnInit, Output, EventEmitter, Input, TemplateRef } from '@angular/core';
import { JobsService } from '../../services/job.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'job-cards',
  templateUrl: './job-cards.component.html',
  styleUrls: ['./job-cards.component.css'],
})
export class JobCardsComponent implements OnInit {
  @Input() rootClassName: string = '';
  @Input() text: TemplateRef<any> | null = null;
  @Input() text1: TemplateRef<any> | null = null;
  @Input() text2: TemplateRef<any> | null = null;
  @Output() jobSelected = new EventEmitter<number>();

  public loading: boolean = false;
  public errorMessage: string | null = null;
  @Input() public jobs: any[] = [];
  public clickedIndex: number | null = null;

  constructor(
    private jobService: JobsService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    console.log('[JobCardsComponent] ngOnInit: Component is initializing.');
    
    // CRITICAL DEBUGGING STEP: Clear the cache on component load.
    // This forces the jobService to make a fresh API call every time this component is created,
    // ensuring we don't see stale data from a previous session.
    this.jobService.clearCache();
    
    // Subscribe to URL query parameters to check if a specific job should be pre-selected.
    this.route.queryParams.subscribe(params => {
      const jobIdFromUrl = params['jobId'] ? +params['jobId'] : null;
      if (jobIdFromUrl) {
        console.log(`[JobCardsComponent] Found jobId=${jobIdFromUrl} in URL parameters.`);
      }
      // Trigger the main data fetching logic.
      this.fetchJobs(jobIdFromUrl);
    });
  }

  /**
   * Fetches the list of jobs from the JobsService and updates the component's state.
   * @param selectedJobId An optional job ID to pre-select and move to the top of the list.
   */
  private fetchJobs(selectedJobId: number | null = null): void {
    this.loading = true;
    this.errorMessage = null;
    console.log('[JobCardsComponent] fetchJobs: Calling jobService.fetchJobs().');

    this.jobService.fetchJobs().subscribe({
      next: (data) => {
        console.log(`[JobCardsComponent] fetchJobs: Received ${data.length} jobs from the service.`);
        this.jobs = data;
        this.loading = false;

        // Logic to handle pre-selection from a URL parameter
        if (selectedJobId !== null) {
          const jobIndex = this.jobs.findIndex(job => job.job_id === selectedJobId);
          if (jobIndex !== -1) {
            console.log(`[JobCardsComponent] Moving job ${selectedJobId} to the top of the list.`);
            const [selectedJob] = this.jobs.splice(jobIndex, 1);
            this.jobs.unshift(selectedJob);
            // After moving, the pre-selected job is now at index 0.
            this.clickedIndex = 0;
          }
        } else if (this.jobs.length > 0) {
          // If no job is selected via URL, automatically select the first job in the list.
          console.log('[JobCardsComponent] No job pre-selected. Defaulting to the first job in the list.');
          this.selectJob(this.jobs[0].job_id);
        } else {
          console.log('[JobCardsComponent] fetchJobs: Received 0 jobs. Nothing to display.');
        }
      },
      error: (err) => {
        console.error('[JobCardsComponent] fetchJobs: An error occurred.', err);
        this.errorMessage = err.message || 'Failed to load jobs. Please try again later.';
        this.jobs = []; // Ensure jobs list is empty on error
        this.loading = false;
      }
    });
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

    // Notify the parent component (`candidate-job-detail-view`) of the selection.
    this.jobSelected.emit(jobId);
  }
}