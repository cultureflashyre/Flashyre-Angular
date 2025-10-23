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
  @Input() isLoading: boolean = true;
  @Input() errorMessage: string | null = null;
  @Input() rootClassName: string = '';
  @Input() text: TemplateRef<any> | null = null;
  @Input() text1: TemplateRef<any> | null = null;
  @Input() text2: TemplateRef<any> | null = null;
  @Input() displayMode?: 'recommended' | 'saved';
  @Output() jobSelected = new EventEmitter<number | undefined>();
  @Output() recommendedJobsCount = new EventEmitter<number>();
  @Output() savedJobsCount = new EventEmitter<number>();

  public jobs: any[] = [];
  public selectedJobIdInternal: number | null = null;

  private jobIdFromUrl: number | null = null;

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
        if (this.jobs.length > 0) {
          this.handleSelectionFromUrl();
        }
      }
    });

    if (this.displayMode) {
      this.loadJobs();
    } else {
      this.jobs = this.jobsToDisplay;
      this.handleSelectionFromUrl();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['displayMode']) {
      if (this.displayMode) {
        this.loadJobs();
      }
    }

    if (changes['jobsToDisplay'] && !changes['jobsToDisplay'].firstChange) {
      if (!this.displayMode) {
        this.jobs = changes['jobsToDisplay'].currentValue;
        this.handleSelectionFromUrl();
      }
    }
  }

  private loadJobs(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.jobs = [];

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
    } else {
      this.jobService.clearCache();
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
    } else {
      this.recommendedJobsCount.emit(count);
    }

    this.handleSelectionFromUrl();
  }

  private handleSelectionFromUrl(): void {
    if (this.jobIdFromUrl) {
      const job = this.jobs.find(j => j.job_id === this.jobIdFromUrl);
      if (job) {
        const jobIndex = this.jobs.findIndex(j => j.job_id === this.jobIdFromUrl);
        if (jobIndex > 0) {
          const [selectedJob] = this.jobs.splice(jobIndex, 1);
          this.jobs.unshift(selectedJob);
        }
        this.selectJob(job);
        return;
      }
    }
    this.selectFirstJob();
  }

  private selectFirstJob(): void {
    if (this.jobs && this.jobs.length > 0) {
      this.selectJob(this.jobs[0]);
    } else {
      this.selectedJobIdInternal = null;
      this.jobSelected.emit(undefined);
    }
  }

  public selectJob(job: any): void {
    if (!job || !job.job_id) {
      this.selectedJobIdInternal = null;
      this.jobSelected.emit(undefined);
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { jobId: null, score: null },
        queryParamsHandling: 'merge',
      });
      return;
    }

    this.selectedJobIdInternal = job.job_id;
    this.jobSelected.emit(job.job_id);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        jobId: job.job_id,
        score: job.matching_score ?? 0
      },
      queryParamsHandling: 'merge',
    });
  }
}