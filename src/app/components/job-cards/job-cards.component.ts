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
  jobs: any[] = [];
  selectedJobId: number | null = null;

  constructor(
    private jobService: JobsService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.jobService.getJobs().subscribe({
      next: (jobs) => {
        this.jobs = jobs;

        // Get jobId from query parameters (from candidate-home navigation)
        const jobId = this.route.snapshot.queryParams['jobId'] ? +this.route.snapshot.queryParams['jobId'] : null;

        if (jobId) {
          // Find and move the selected job to the top of the list
          const jobIndex = this.jobs.findIndex(job => job.job_id === jobId);
          if (jobIndex !== -1) {
            const selectedJob = this.jobs.splice(jobIndex, 1)[0];
            this.jobs.unshift(selectedJob);
            this.selectJob(jobId);
          } else if (this.jobs.length > 0) {
            this.selectJob(this.jobs[0].job_id); // Fallback to first job if jobId not found
          }
        } else if (this.jobs.length > 0) {
          this.selectJob(this.jobs[0].job_id); // Default to first job if no jobId
        }

        this.loading = false;
      },
      error: (err) => {
        console.error('Error getting jobs:', err);
        this.errorMessage = err.message || 'Failed to load jobs. Please try again later.';
        this.loading = false;
      }
    });

    // Remove separate queryParams subscription since we handle it synchronously with snapshot
    if (!this.jobService.areJobsCached()) {
      this.jobService.fetchJobs().subscribe();
    }
  }

  get displayedJobs(): any[] {
    return this.jobs; // Return jobs as is, no reordering on selection
  }

  selectJob(jobId: number): void {
    console.log('Emitting jobId:', jobId);
    this.selectedJobId = jobId;
    this.jobSelected.emit(jobId);
  }

  selectNextJob() {
    if (this.jobs.length > 0) {
      const currentIndex = this.jobs.findIndex(job => job.job_id === this.selectedJobId);
      let nextIndex = currentIndex + 1;
      if (nextIndex >= this.jobs.length) {
        nextIndex = 0;
      }
      this.selectJob(this.jobs[nextIndex].job_id);
    }
  }
}