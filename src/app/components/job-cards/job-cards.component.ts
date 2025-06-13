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
  
  loading: boolean = false;
  errorMessage: string | null = null;
  @Input() jobs: any[] = [];
  clickedIndex: number | null = null;

  constructor(
    private jobService: JobsService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Clear the jobs cache to ensure a fresh list
    this.jobService.clearCache();
    // Get jobId from URL query parameters and fetch jobs
    this.route.queryParams.subscribe(params => {
      const jobId = params['jobId'] ? +params['jobId'] : null;
      this.fetchJobs(jobId);
    });
  }

  private fetchJobs(selectedJobId: number | null = null): void {
    this.loading = true;
    this.errorMessage = null;
    this.jobService.fetchJobs().subscribe({
      next: (data) => {
        console.log('Jobs fetched:', data);
        console.log('Available job IDs:', data.map(job => job.job_id));
        this.jobs = data;
        // Reorder if a jobId is provided (from URL)
        if (selectedJobId !== null) {
          const jobIndex = this.jobs.findIndex(job => job.job_id === selectedJobId);
          if (jobIndex !== -1) {
            const [selectedJob] = this.jobs.splice(jobIndex, 1);
            this.jobs.unshift(selectedJob);
            this.clickedIndex = 0;
            console.log(`Reordered jobs with jobId ${selectedJobId} to top`);
          }
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching jobs:', err);
        this.errorMessage = err.message || 'Failed to load jobs. Please try again later.';
        this.jobs = [];
        this.loading = false;
      }
    });
  }

  selectJob(jobId: number): void {
    console.log('Emitting jobId:', jobId);
    // Find the clicked job
    const clickedJobIndex = this.jobs.findIndex(job => job.job_id === jobId);
    if (clickedJobIndex !== -1) {
      // Set clickedIndex for highlighting without reordering
      this.clickedIndex = clickedJobIndex;
    }
    // Emit the jobId to the parent component
    this.jobSelected.emit(jobId);
  }
}