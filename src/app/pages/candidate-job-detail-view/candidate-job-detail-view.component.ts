import { Component, OnInit } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { JobsService } from '../../services/job.service';
import { ActivatedRoute } from '@angular/router'; // Merged from Branch-2
// import { AuthService } from '../../services/candidate.service'; // Merged from Branch-2 (commented out)
import { forkJoin } from 'rxjs';

@Component({
  selector: 'candidate-job-detail-view',
  templateUrl: './candidate-job-detail-view.component.html',
  styleUrls: ['./candidate-job-detail-view.component.css'],
})
export class CandidateJobDetailView implements OnInit {
  selectedJobId: number | null = null;
  // selectedJobMatchingScore: number | null = null; // Merged from Branch-2 (commented out)
  public activeTab: 'recommended' | 'saved' | 'applied' = 'recommended';

  isLoading: boolean = true;
  errorMessage: string | null = null;

  private masterRecommendedJobs: any[] = [];
  private masterSavedJobs: any[] = [];
  private masterAppliedJobs: any[] = [];

  public jobsToDisplay: any[] = [];

  constructor(
    private title: Title,
    private meta: Meta,
    private route: ActivatedRoute, // Merged from Branch-2
    private jobService: JobsService
    // private authService: AuthService // Merged from Branch-2 (commented out)
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

  private fetchAllJobs(): void {
    this.isLoading = true;
    this.errorMessage = null;

    const userId = localStorage.getItem('user_id');
    if (!userId) {
      this.errorMessage = "User not found. Please log in again.";
      this.isLoading = false;
      // Initialize job lists as empty and counts to 0
      this.masterRecommendedJobs = [];
      this.masterSavedJobs = [];
      this.masterAppliedJobs = [];
      this.updateJobsToDisplay();
      return;
    }

    forkJoin({
      recommended: this.jobService.fetchJobs(),
      saved: this.jobService.fetchSavedJobs(userId),
      applied: this.jobService.fetchAppliedJobDetails()
    }).subscribe({
      next: (results) => {
        this.masterRecommendedJobs = results.recommended;
        this.masterSavedJobs = results.saved;
        this.masterAppliedJobs = results.applied;
        
        console.log('All jobs fetched successfully:', {
          recommended: this.masterRecommendedJobs.length,
          saved: this.masterSavedJobs.length,
          applied: this.masterAppliedJobs.length
        });

        this.updateJobsToDisplay();
        this.setInitialJobSelection(); // Merged from Branch-2
        this.isLoading = false;
        //  this.handleScoreFetchingForReload(); // Merged from Branch-2 (commented out)
      },
      error: (err) => {
        console.error('Failed to fetch all jobs:', err);
        this.errorMessage = 'Failed to load job data. Please try again later.';
        this.isLoading = false;
        // Also set lists to empty on error
        this.masterRecommendedJobs = [];
        this.masterSavedJobs = [];
        this.masterAppliedJobs = [];
        this.updateJobsToDisplay();
      }
    });
  }

  // Merged from Branch-2
  private setInitialJobSelection(): void {
    const jobIdFromUrl = this.route.snapshot.queryParams['jobId'];
    
    if (jobIdFromUrl) {
      const numericJobId = parseInt(jobIdFromUrl, 10);
      
      // Check if the job exists in the currently displayed list.
      const jobExists = this.jobsToDisplay.some(job => job.job_id === numericJobId);
      
      if (jobExists) {
        this.selectedJobId = numericJobId;
        console.log(`Job ID ${numericJobId} from URL has been selected.`);
        return; // Exit after successful selection
      }
    }
    
    // Fallback logic: If no ID in URL or job not found, select the first job.
    if (this.jobsToDisplay.length > 0) {
      this.selectedJobId = this.jobsToDisplay[0].job_id;
    } else {
      this.selectedJobId = null;
    }
  }

  // Merged from Branch-2 (commented out)
  // private handleScoreFetchingForReload(): void {
  //   // Read the jobId directly from the URL snapshot
  //   const jobIdFromUrl = this.route.snapshot.queryParams['jobId'];
  //   if (jobIdFromUrl) {
  //     const numericJobId = parseInt(jobIdFromUrl, 10);

  //     // Find the job in our freshly fetched lists
  //     const job = [...this.masterRecommendedJobs, ...this.masterSavedJobs].find(
  //       j => j.job_id === numericJobId
  //     );

  //     // If we found the job and it doesn't already have a score, fetch it.
  //     if (job && (!job.matching_score || job.matching_score === 0)) {
  //       console.log(`Reload detected. Fetching score for job ID: ${numericJobId}`);
        
  //       this.authService.getMatchScores([numericJobId]).subscribe(scoresMap => {
  //         const score = scoresMap[numericJobId];
  //         if (score !== undefined) {
  //           console.log(`Score found: ${score}. Updating component state.`);
  //           // Update the score on the source object for data consistency
  //           job.matching_score = score;
  //           // Update the property that is passed to the child component
  //           this.selectedJobMatchingScore = score;
  //         }
  //       });
  //     }
  //   }
  // }
  
private updateJobsToDisplay(): void {
  this.selectedJobId = null; 
  // this.selectedJobMatchingScore = null; // Merged from Branch-2 (commented out)
  switch (this.activeTab) {
    case 'recommended':
      // Using the spread operator creates a new array, guaranteeing change detection
      this.jobsToDisplay = [...this.masterRecommendedJobs]; 
      break;
    case 'saved':
      this.jobsToDisplay = [...this.masterSavedJobs];
      break;
    case 'applied':
      this.jobsToDisplay = [...this.masterAppliedJobs];
      break;
  }
  //... rest of function is the same
  if (this.jobsToDisplay.length > 0) {
      this.selectedJobId = this.jobsToDisplay[0].job_id;
    } else {
      this.selectedJobId = null;
    }
  }

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

    // Remove from saved list if it was saved
    this.masterSavedJobs = this.masterSavedJobs.filter(
      (job) => job.job_id !== appliedJob.job_id
    );

    // Add the job to the beginning of the applied list to keep state consistent
    this.masterAppliedJobs.unshift(appliedJob);

    // Refresh the view to make the card disappear/update
    this.updateJobsToDisplay();
  }

  onJobSaved(savedJob: any): void {
  console.log(`Parent notified that job ${savedJob.job_id} was saved.`);
  
  // Remove from recommended list
  this.masterRecommendedJobs = this.masterRecommendedJobs.filter(j => j.job_id !== savedJob.job_id);

  // Add to saved list if it's not already there
  if (!this.masterSavedJobs.some(j => j.job_id === savedJob.job_id)) {
      this.masterSavedJobs.unshift(savedJob);
  }

  this.updateJobsToDisplay();
}

onJobUnsaved(unsavedJob: any): void {
  console.log(`Parent notified that job ${unsavedJob.job_id} was unsaved.`);

  // Remove from saved list
  this.masterSavedJobs = this.masterSavedJobs.filter(j => j.job_id !== unsavedJob.job_id);

  // Add back to recommended list if not already there
  if (!this.masterRecommendedJobs.some(j => j.job_id === unsavedJob.job_id)) {
      this.masterRecommendedJobs.unshift(unsavedJob);
  }

  this.updateJobsToDisplay();
}

onJobDisliked(dislikedJob: any): void {
  console.log(`Parent notified that job ${dislikedJob.job_id} was disliked.`);

  // A disliked job should be removed from all visible lists.
  this.masterRecommendedJobs = this.masterRecommendedJobs.filter(j => j.job_id !== dislikedJob.job_id);
  this.masterSavedJobs = this.masterSavedJobs.filter(j => j.job_id !== dislikedJob.job_id);
  
  this.updateJobsToDisplay();
}

onJobUndisliked(undislikedJob: any): void {
  console.log(`Parent notified that job ${undislikedJob.job_id} dislike was removed.`);
  
  // Add it back to the recommended list if it doesn't exist there already
  if (!this.masterRecommendedJobs.some(j => j.job_id === undislikedJob.job_id)) {
    this.masterRecommendedJobs.unshift(undislikedJob);
  }

  this.updateJobsToDisplay();
}

  get recommendedJobCount(): number | null {
    return this.masterRecommendedJobs?.length ?? null;
  }

  get savedJobCount(): number | null {
    return this.masterSavedJobs?.length ?? null;
  }

  get appliedJobCount(): number | null {
    return this.masterAppliedJobs?.length ?? null;
  }

  onJobSelected(job: any): void { // Merged from Branch-2
    this.selectedJobId = job?.job_id ?? null;
  }

 onApplicationRevoked(revokedJobId: number): void {
  console.log(`Parent component notified that job ${revokedJobId} was revoked.`);

  // Find the job in the applied list
  const revokedJob = this.masterAppliedJobs.find(job => job.job_id === revokedJobId);

  if (revokedJob) {
      // Remove from applied list
      this.masterAppliedJobs = this.masterAppliedJobs.filter(job => job.job_id !== revokedJobId);

      // Add it back to recommended list if it's not already there
      if (!this.masterRecommendedJobs.some(job => job.job_id === revokedJobId)) {
          this.masterRecommendedJobs.unshift(revokedJob);
      }
  }
  
  this.updateJobsToDisplay();
}
}