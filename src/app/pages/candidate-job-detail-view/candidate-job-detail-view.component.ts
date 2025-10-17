import { Component, OnInit } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { JobsService } from '../../services/job.service'; // Assuming this path is correct
import { forkJoin } from 'rxjs';

@Component({
  selector: 'candidate-job-detail-view',
  templateUrl: './candidate-job-detail-view.component.html',
  styleUrls: ['./candidate-job-detail-view.component.css'],
})
export class CandidateJobDetailView implements OnInit {
  // --- State for the selected job and active tab ---
  selectedJobId: number | null = null;
  activeTab: 'recommended' | 'saved' | 'applied' = 'recommended';
  
  // --- State for the UI (loading, errors) ---
  isLoading: boolean = true;
  errorMessage: string | null = null;

  // --- Master lists to hold all job data ---
  private masterRecommendedJobs: any[] = [];
  private masterSavedJobs: any[] = [];
  private masterAppliedJobs: any[] = [];

  // --- The single list that gets passed to the child component ---
  public jobsToDisplay: any[] = [];

  constructor(
    private title: Title,
    private meta: Meta,
    private jobService: JobsService // Inject JobsService
  ) {
    this.title.setTitle('Candidate-Job-Detail-View - Flashyre');
    this.meta.addTags([
      {
        property: 'og:title',
        content: 'Candidate-Job-Detail-View - Flashyre',
      },
    ]);
  }

  ngOnInit(): void {
    this.fetchAllJobs();
  }

  /**
   * This is the "Mega-Fetch" that runs only once on page load.
   */
  private fetchAllJobs(): void {
    this.isLoading = true;
    this.errorMessage = null;

    const userId = localStorage.getItem('user_id');
    if (!userId) {
      this.errorMessage = "User not found. Please log in again.";
      this.isLoading = false;
      return;
    }

    // Use forkJoin to run all three API calls in parallel
    forkJoin({
      recommended: this.jobService.fetchJobs(),
      saved: this.jobService.fetchSavedJobs(userId),
      applied: this.jobService.fetchAppliedJobDetails()
    }).subscribe({
      next: (results) => {
        // Store the results in our master lists
        this.masterRecommendedJobs = results.recommended;
        this.masterSavedJobs = results.saved;
        this.masterAppliedJobs = results.applied;
        
        console.log('All jobs fetched successfully:', {
          recommended: this.masterRecommendedJobs.length,
          saved: this.masterSavedJobs.length,
          applied: this.masterAppliedJobs.length
        });

        // Set the initial list to be displayed
        this.updateJobsToDisplay();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to fetch all jobs:', err);
        this.errorMessage = 'Failed to load job data. Please try again later.';
        this.isLoading = false;
      }
    });
  }
  
  /**
   * A central function to update the displayed list based on the active tab.
   */
  private updateJobsToDisplay(): void {
    this.selectedJobId = null; // Clear old selection
    switch (this.activeTab) {
      case 'recommended':
        this.jobsToDisplay = this.masterRecommendedJobs;
        break;
      case 'saved':
        this.jobsToDisplay = this.masterSavedJobs;
        break;
      case 'applied':
        this.jobsToDisplay = this.masterAppliedJobs;
        break;
    }
  }

  // --- Methods for Tab Clicks ---
  selectRecommendedTab(): void {
    if (this.activeTab !== 'recommended') {
      console.log('Switching to Recommended tab');
      this.activeTab = 'recommended';
      this.updateJobsToDisplay();
    }
  }

  selectSavedTab(): void {
    if (this.activeTab !== 'saved') {
      console.log('Switching to Saved tab');
      this.activeTab = 'saved';
      this.updateJobsToDisplay();
    }
  }

  selectAppliedTab(): void {
    if (this.activeTab !== 'applied') {
      console.log('Switching to Applied tab');
      this.activeTab = 'applied';
      this.updateJobsToDisplay();
    }
  }

  onJobApplied(appliedJob: any): void {
    console.log(`Parent notified that job ${appliedJob.job_id} was applied for.`);

    // Remove the job from the recommended list
    this.masterRecommendedJobs = this.masterRecommendedJobs.filter(
      (job) => job.job_id !== appliedJob.job_id
    );

    // Add the job to the beginning of the applied list to keep state consistent
    this.masterAppliedJobs.unshift(appliedJob);

    // Refresh the view to make the card disappear
    this.updateJobsToDisplay();
  }

  // --- Methods for getting job counts for the UI ---
  get recommendedJobCount(): number {
    return this.masterRecommendedJobs.length;
  }

  get savedJobCount(): number {
    return this.masterSavedJobs.length;
  }

  get appliedJobCount(): number {
    return this.masterAppliedJobs.length;
  }

  // --- Event Handlers from Child Components ---
  onJobSelected(jobId: number | undefined): void {
    this.selectedJobId = jobId ?? null;
  }

  onApplicationRevoked(revokedJobId: number): void {
    console.log(`Parent component notified that job ${revokedJobId} was revoked.`);
    // After a revoke, we must re-fetch all data to ensure everything is in sync.
    this.fetchAllJobs();
  }
}