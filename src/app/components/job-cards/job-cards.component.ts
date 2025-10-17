import { Component, OnInit, Output, EventEmitter, Input, TemplateRef, OnChanges, SimpleChanges } from '@angular/core';
import { JobsService } from '../../services/job.service'; // Assuming this path is correct
import { ActivatedRoute, Router } from '@angular/router';
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
  
  // --- Inputs from Branch-2 (parent provides data) ---
  @Input() jobsToDisplay: any[] = [];
  @Input() isLoading: boolean = true; // Renamed from 'loading' for clarity with 'jobsToDisplay' context
  @Input() errorMessage: string | null = null;

  // --- Component Outputs ---
  @Output() jobSelected = new EventEmitter<number | undefined>();
  @Output() recommendedJobsCount = new EventEmitter<number>();
  @Output() savedJobsCount = new EventEmitter<number>();


  // --- Public Properties for Template Binding ---
  public jobs: any[] = []; // This will now hold the jobs passed from the parent
  public clickedIndex: number | null = null;

  // --- Private Properties ---
  private jobIdFromUrl: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    // When the parent component gives us a new list of jobs or changes loading/error state
    if (changes['jobsToDisplay'] || changes['isLoading'] || changes['errorMessage']) {
      console.log('[JobCardsComponent] ngOnChanges: jobsToDisplay, isLoading, or errorMessage changed.');
      this.jobs = this.jobsToDisplay; // Update local 'jobs' with the new input
      this.selectFirstJob(); // Re-evaluate selection based on the new list
    }
  }

  ngOnInit(): void {
    console.log('[JobCardsComponent] ngOnInit: Component is initializing.');
    this.route.queryParams.subscribe(params => {
      this.jobIdFromUrl = params['jobId'] ? +params['jobId'] : null;
      if (this.jobIdFromUrl) {
        console.log(`[JobCardsComponent] Found jobId=${this.jobIdFromUrl} in URL parameters.`);
      }
      // Initial selection based on URL and input jobs
      this.selectFirstJob();
    });
  }

  /**
   * Helper function to select the first job in the current list, if available,
   * or a job matching the jobIdFromUrl.
   */
  private selectFirstJob(): void {
    if (this.jobs && this.jobs.length > 0) {
      if (this.jobIdFromUrl && this.jobs.some(job => job.job_id === this.jobIdFromUrl)) {
        // If a jobId is in the URL and exists in the current list, select it.
        const jobToSelect = this.jobs.find(j => j.job_id === this.jobIdFromUrl);
        if (jobToSelect) {
          this.selectJob(jobToSelect);
        }
      } else {
        // Otherwise, select the first job in the list.
        this.selectJob(this.jobs[0]);
      }
    } else {
      // If the list is empty, inform the parent that nothing is selected.
      this.clickedIndex = null;
      this.jobSelected.emit(undefined);
      // Emit counts as 0 if no jobs are available.
      this.recommendedJobsCount.emit(0);
      this.savedJobsCount.emit(0);
    }
  }

  /**
   * Handles the click event on a job card. It sets the highlight and emits the selected job ID to the parent.
   * Also updates URL query parameters.
   * @param job The job object that was clicked.
   */
  public selectJob(job: any): void {
    console.log(`[JobCardsComponent] Selecting job:`, job);
    if (!job || job.job_id === undefined) return; // Ensure job and its ID are valid

    const clickedJobIndex = this.jobs.findIndex(j => j.job_id === job.job_id);
    if (clickedJobIndex !== -1) {
      this.clickedIndex = clickedJobIndex;
    }
    
    // Update the URL's query parameters.
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        jobId: job.job_id,
        score: job.matching_score ?? 0 // Use the score from the job object
      },
      queryParamsHandling: 'merge', // Keep other query params if any
    });

    // We can still emit the ID for other potential listeners.
    this.jobSelected.emit(job.job_id);
  }
}