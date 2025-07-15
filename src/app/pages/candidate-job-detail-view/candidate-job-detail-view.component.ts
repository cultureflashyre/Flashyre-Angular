import { Component, OnInit, OnDestroy } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { JobsService } from '../../services/job.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'candidate-job-detail-view',
  templateUrl: './candidate-job-detail-view.component.html',
  styleUrls: ['./candidate-job-detail-view.component.css'],
})
export class CandidateJobDetailViewComponent implements OnInit, OnDestroy {
  selectedJobId: number | null = null; // Tracks the selected job ID
  selectedIndex: number | null = null; // Tracks the index of the selected job
  jobs: any[] = []; // Stores the list of jobs
  private jobsSubscription: Subscription; // For cleaning up the subscription

  constructor(
    private title: Title,
    private meta: Meta,
    private jobService: JobsService
  ) {
    this.title.setTitle('Candidate-Job-Detail-View - Flashyre');
    this.meta.addTags([
      {
        property: 'og:title',
        content: 'Candidate-Job-Detail-View - Flashyre',
      },
      {
        property: 'og:image',
        content:
          'https://aheioqhobo.cloudimg.io/v7/_playground-bucket-v2.teleporthq.io_/8203932d-6f2d-4493-a7b2-7000ee521aa2/9aea8e9c-27ce-4011-a345-94a92ae2dbf8?org_if_sml=1&force_format=original',
      },
    ]);
  }

  ngOnInit() {
    // Subscribe to the job list to get updates
    this.jobsSubscription = this.jobService.getJobs().subscribe(jobs => {
      this.jobs = jobs; // Update the job list
      // If the selected job is no longer in the list (e.g., after applying)
      if (this.selectedJobId && !this.jobs.some(job => job.job_id === this.selectedJobId)) {
        if (this.selectedIndex !== null && this.selectedIndex < this.jobs.length) {
          // Select the job at the same index (now the next job after removal)
          this.selectedJobId = this.jobs[this.selectedIndex].job_id;
        } else if (this.jobs.length > 0) {
          // If index is invalid, select the first job
          this.selectedJobId = this.jobs[0].job_id;
          this.selectedIndex = 0;
        } else {
          // If no jobs remain, clear the selection
          this.selectedJobId = null;
          this.selectedIndex = null;
        }
      }
    });

    // Fetch the initial job list and select the first job by default if available
    this.jobService.fetchJobs().subscribe(() => {
      if (this.jobs.length > 0 && this.selectedJobId === null) {
        this.selectedJobId = this.jobs[0].job_id;
        this.selectedIndex = 0;
      }
    });
  }

  onJobSelected(jobId: number): void {
    this.selectedJobId = jobId;
  }

  onRequestNextJob(): void {
    console.log('Request for next job received');
    
    if (this.jobs.length === 0) {
      console.log('No jobs available');
      this.selectedJobId = null;
      this.selectedIndex = null;
      return;
    }

    // Find the current job index
    const currentIndex = this.jobs.findIndex(job => job.job_id === this.selectedJobId);
    
    if (currentIndex === -1) {
      // Current job not found, select the first available job
      this.selectedJobId = this.jobs[0].job_id;
      this.selectedIndex = 0;
      console.log('Current job not found, selecting first job:', this.selectedJobId);
      return;
    }

    // Move to the next job
    let nextIndex = currentIndex + 1;
    
    // If we've reached the end, loop back to the beginning
    if (nextIndex >= this.jobs.length) {
      nextIndex = 0;
    }
    
    this.selectedJobId = this.jobs[nextIndex].job_id;
    this.selectedIndex = nextIndex;
    
    console.log(`Moving from index ${currentIndex} to ${nextIndex}, new jobId: ${this.selectedJobId}`);
  }

  ngOnDestroy() {
    // Clean up the subscription to avoid memory leaks
    if (this.jobsSubscription) {
      this.jobsSubscription.unsubscribe();
    }
  }
}