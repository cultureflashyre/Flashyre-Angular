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
        if (this.selectedJobId !== null && !this.jobs.some(job => job.job_id === this.selectedJobId)) {
          if (this.jobs.length > 0) {
            this.selectJob(this.jobs[0].job_id);
          } else {
            this.selectedJobId = null;
          }
        } else if (this.jobs.length > 0 && this.selectedJobId === null) {
          this.selectJob(this.jobs[0].job_id);
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error getting jobs:', err);
        this.errorMessage = err.message || 'Failed to load jobs. Please try again later.';
        this.loading = false;
      }
    });

    this.route.queryParams.subscribe(params => {
      const jobId = params['jobId'] ? +params['jobId'] : null;
      if (jobId && this.jobs.length > 0) {
        const jobIndex = this.jobs.findIndex(job => job.job_id === jobId);
        if (jobIndex !== -1) {
          this.selectJob(jobId);
        }
      }
    });

    if (!this.jobService.areJobsCached()) {
      this.jobService.fetchJobs().subscribe();
    }
  }

  get displayedJobs(): any[] {
    if (this.selectedJobId === null) {
      return this.jobs;
    }
    const selectedJob = this.jobs.find(job => job.job_id === this.selectedJobId);
    if (!selectedJob) {
      return this.jobs;
    }
    const otherJobs = this.jobs.filter(job => job.job_id !== this.selectedJobId);
    return [selectedJob, ...otherJobs];
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