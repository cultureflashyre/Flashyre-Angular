
import { Component, Input, OnChanges, SimpleChanges, TemplateRef, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { JobsService } from '../../services/job.service';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/candidate.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'candidate-job-details',
  templateUrl: './candidate-job-details.component.html',
  styleUrls: ['./candidate-job-details.component.css'],
})
export class CandidateJobDetailsComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  @Input() rootClassName: string = 'candidate-default-root';
  @Input() jobId: number | null = null;
  @Input() text: TemplateRef<any> | null = null;
  @Input() text1: TemplateRef<any> | null = null;
  @Input() text2: TemplateRef<any> | null = null;
  @Input() text3: TemplateRef<any> | null = null;
  @Input() button: TemplateRef<any> | null = null;
  @Input() button1: TemplateRef<any> | null = null;
  @Input() activeTab: 'recommended' | 'saved' | 'applied' = 'recommended';
 @Output() applicationRevoked = new EventEmitter<number>();
 @Output() jobAppliedSuccess = new EventEmitter<any>(); // Emits the full job object


  @ViewChild('mobileBar') mobileBar: ElementRef;
  @ViewChild('mobileMatchingBar') mobileMatchingBar: ElementRef;
  @ViewChild('desktopMatchingLoader') desktopMatchingLoader: ElementRef;

  job: any = null;
  userProfile: any = {};
  loading: boolean = false;
  errorMessage: string | null = null;
  progress: number = 0;
  matchingScore: number = 0;
  fillColor: string = '#4D91C6';
  matchingScoreFillColor: string = '#4D91C6';
  matchingScoreStrokeDasharray: string = '0 25.12';
  defaultProfilePicture: string = environment.defaultProfilePicture;
  defaultCompanyIcon: string = environment.defaultCompanyIcon;
  
  isMobile: boolean = window.innerWidth < 767;
  isProcessing: boolean = false;
  isApplied: boolean = false;
  successMessage: string | null = null;
  private destroy$ = new Subject<void>();

  private isViewInitialized = false;
  
  private attemptsFromNavigation: number | null = null;

  isDisliked: boolean = false;
  isSaved: boolean = false;
  // Name for the disliked jobs browser cache.
  private dislikedCacheName = 'disliked-jobs-cache-v1';

  constructor(
    private jobService: JobsService,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {
    window.addEventListener('resize', () => {
      this.isMobile = window.innerWidth < 767;
      this.updateProgressBar(this.matchingScore, this.progress);
    });
  }

  ngOnInit() {
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const jobIdFromUrl = params['jobId'] ? +params['jobId'] : null;
      const scoreFromUrl = params['score'] ? +params['score'] : null;

      this.attemptsFromNavigation = params['attempts'] !== undefined ? +params['attempts'] : null;

      if (scoreFromUrl !== null) {
        this.matchingScore = scoreFromUrl;
        // ---- EDIT: Call the new instant function instead of the animation. ----
        if (this.isViewInitialized) {
          this.setProgressBarState(); 
        } 
      }

      if (jobIdFromUrl) {
        this.jobId = jobIdFromUrl;
        this.fetchJobDetails();
      }
    });
    this.progress = 100.0;
    this.loadUserProfile();

    this.jobService.jobInteraction$.pipe(takeUntil(this.destroy$)).subscribe(interaction => {
      // Check if the event is for the job currently being viewed.
      if (this.jobId && interaction.jobId === this.jobId.toString()) {
        if (interaction.type === 'dislike') {
          this.isDisliked = interaction.state;
        } else if (interaction.type === 'save') {
          this.isSaved = interaction.state;
        }
        this.cdr.detectChanges(); // Manually update the view to reflect the new state.
      }
    });
  }

  ngAfterViewInit() {
    this.isViewInitialized = true;
    this.setProgressBarState();
  }

  navigateToAssessment(assessment: number): void {
    this.router.navigate(['/flashyre-assessment-rules-card'], { queryParams: { id: assessment } });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['jobId'] && this.jobId !== null && changes['jobId'].currentValue !== changes['jobId'].previousValue) {
      this.fetchJobDetails();
    } else if (!this.jobId) {
      this.resetJob();
      this.errorMessage = null;
    }
  }

  private loadUserProfile(): void {
    const profileData = localStorage.getItem('userProfile');
    if (profileData) {
      this.userProfile = JSON.parse(profileData);
    }
  }

  private fetchJobDetails(): void {
    if (!this.jobId) return;
    this.loading = true;
    this.errorMessage = null;
    this.successMessage = null;
    this.isApplied = false;
    this.jobService.getJobById(this.jobId!).subscribe({
      next: (data) => {
        this.job = data;
        this.job.attempts_remaining = data.attempts_remaining ?? this.attemptsFromNavigation;
        this.loading = false;
        this.fetchInteractionStatus();
      },
      error: (err) => {
        this.resetJob();
        this.errorMessage = `Job with ID ${this.jobId} not found. Please select another job.`;
        this.loading = false;
      }
    });
  }

  private async fetchInteractionStatus(): Promise<void> {
    const userId = localStorage.getItem('user_id');
    const jobIdStr = this.jobId?.toString();

    if (!userId || !jobIdStr) {
      return;
    }

    // Check the browser cache first for a faster UI response for disliked status.
    const cachedDisliked = await this.getDislikedJobsFromCache(userId);
    if (cachedDisliked) {
      this.isDisliked = cachedDisliked.includes(jobIdStr);
      this.cdr.detectChanges();
    }
    // Fetch the latest disliked status from the API.
    this.authService.getDislikedJobs(userId).subscribe(response => {
      const dislikedJobs = response.disliked_jobs.map((job: any) => job.job_id.toString());
      this.isDisliked = dislikedJobs.includes(jobIdStr);
      this.cacheDislikedJobs(userId, dislikedJobs); // Update the cache with fresh data.
      this.cdr.detectChanges();
    });

    // Fetch the saved status from the API.
    this.authService.getSavedJobs(userId).subscribe(response => {
      const savedJobIds = response.saved_jobs;
      this.isSaved = savedJobIds.includes(this.jobId);
      this.cdr.detectChanges();
    });
  }

  onDislike(event: MouseEvent): void {
    event.stopPropagation();
    if (this.isSaved) {
      alert('You cannot dislike a job that is saved. Please unsave it first.');
      return;
    }
    const userId = localStorage.getItem('user_id');
    const jobIdStr = this.jobId?.toString();
    if (!userId || !jobIdStr) return;

    const action = this.isDisliked
      ? this.authService.removeDislikedJob(userId, jobIdStr)
      : this.authService.dislikeJob(userId, jobIdStr);

    action.subscribe({
      next: () => {
        this.isDisliked = !this.isDisliked;
        this.updateDislikedJobsCache(userId, jobIdStr, this.isDisliked ? 'add' : 'remove');
        this.jobService.notifyJobInteraction(jobIdStr, 'dislike', this.isDisliked);

        if (this.isDisliked) {
          alert('Job disliked successfully.');
        } else {
          alert('Dislike removed.');
        }
        this.cdr.detectChanges();
      },
      error: (error) => alert('Failed to update dislike status: ' + error.message),
    });
  }

  /**
   * Handles clicks on the Save icon.
   * It toggles the saved state, updates the backend, and notifies other components.
   */
  onSave(event: MouseEvent): void {
    event.stopPropagation();
    if (this.isDisliked) {
      alert('You cannot save a job that is disliked. Please remove the dislike first.');
      return;
    }
    const userId = localStorage.getItem('user_id');
    const jobIdStr = this.jobId?.toString();
    if (!userId || !jobIdStr) return;

    // Determine whether to call the 'save' or 'remove saved' API endpoint.
    const action = this.isSaved
      ? this.authService.removeSavedJob(userId, jobIdStr)
      : this.authService.saveJob(userId, jobIdStr);

    action.subscribe({
      next: () => {
        this.isSaved = !this.isSaved; // Toggle the local state.
        // Broadcast this change to all other components.
        this.jobService.notifyJobInteraction(jobIdStr, 'save', this.isSaved);
        alert(this.isSaved ? 'Job saved successfully!' : 'Job unsaved successfully!');
        this.cdr.detectChanges();
      },
      error: (error) => alert('Failed to update save status: ' + error.message)
    });
  }

  // --- Caching Helper Methods for Disliked Jobs (copied from card component for consistency) ---
  private async getDislikedJobsFromCache(userId: string): Promise<string[] | null> {
    try {
      const cache = await caches.open(this.dislikedCacheName);
      const response = await cache.match(userId);
      if (!response) return null;
      return await response.json();
    } catch (error) {
      console.error('Error getting disliked jobs from cache:', error);
      return null;
    }
  }

  private async cacheDislikedJobs(userId: string, dislikedJobs: string[]): Promise<void> {
    try {
      const cache = await caches.open(this.dislikedCacheName);
      const response = new Response(JSON.stringify(dislikedJobs));
      await cache.put(userId, response);
    } catch (error) {
      console.error('Error caching disliked jobs:', error);
    }
  }

  private async updateDislikedJobsCache(userId: string, jobId: string, action: 'add' | 'remove'): Promise<void> {
    const cachedJobs = await this.getDislikedJobsFromCache(userId) || [];
    const jobExists = cachedJobs.includes(jobId);

    if (action === 'add' && !jobExists) {
      cachedJobs.push(jobId);
    } else if (action === 'remove' && jobExists) {
      const index = cachedJobs.indexOf(jobId);
      cachedJobs.splice(index, 1);
    }
    await this.cacheDislikedJobs(userId, cachedJobs);
  }


  private resetJob(): void {
    this.job = null;
    this.matchingScore = 0;
    this.progress = 0;
  }

  applyForJob(): void {
    if (this.isApplied || !this.job?.job_id) {
      return;
    }
    this.isProcessing = true;
    this.authService.applyForJob(this.job.job_id)
  .pipe(takeUntil(this.destroy$))
  .subscribe({
    next: (response) => {
      console.log('Yay! Application worked:', response);
      this.isProcessing = false;
      this.isApplied = true; // Set to true to show the "Applied ✓" state

      // After a short delay to show the "Applied" message, notify the parent
      setTimeout(() => {
        // Emit the full job object so the parent can add it to the 'Applied' list
        this.jobAppliedSuccess.emit(this.job); 
      }, 3000); // 3-second delay before disappearing
    },
    error: (error) => {
      console.error('Oops! Something went wrong:', error);
      this.isProcessing = false;
      this.isApplied = false;
      alert(error.error?.error || 'Failed to apply for this job');
    }
  });
}

  revokeApplication(): void {
  if (!this.job.job_id) {
    return; // Should not happen, but a good safeguard
  }

  // Use the browser's confirm dialog for the pop-up
  const wantsToRevoke = window.confirm('Do you want to Revoke?');

  if (wantsToRevoke) {
    this.isProcessing = true; // Show a loading state on the button

    this.authService.revokeApplication(this.job.job_id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Application revoked successfully:', response);
          this.isProcessing = false;
          
          // CRITICAL: Clear the jobs cache so the job reappears in other lists
          this.jobService.clearCache();

          // Notify the parent component that a revoke happened
          this.applicationRevoked.emit(this.job.job_id);

          alert('Application revoked successfully!');
        },
        error: (err) => {
          console.error('Failed to revoke application:', err);
          this.isProcessing = false;
          alert(err.error?.error || 'Failed to revoke application');
        }
      });
  }
}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  handleImageError(event: Event): void {
    (event.target as HTMLImageElement).src = this.defaultProfilePicture;
  }

  private getFillColor(value: number): string {
    if (value <= 40) return 'red';
    if (value <= 60) return 'orange';
    if (value <= 75) return '#4D91C6';
    if (value <= 84) return 'lightgreen';
    return 'darkgreen';
  }

  // ---- EDIT: The 'animateProgressBar' function has been replaced with this new 'setProgressBarState' function. ----
  private setProgressBarState(): void {
    if (this.matchingScore === null || typeof this.matchingScore === 'undefined') {
      return;
    }
    // This instantly updates the progress bar to its final values without any animation delay.
    this.updateProgressBar(this.matchingScore, this.progress);
  }

  private updateProgressBar(percentage: number, companyPercentage: number): void {
    const actualMatchingScore = Math.min(percentage, 100);
    const actualProgress = Math.min(companyPercentage, 100);

    this.fillColor = this.getFillColor(actualProgress);
    this.matchingScoreFillColor = this.getFillColor(actualMatchingScore);

    if (this.isMobile) {
      if (this.mobileBar && this.mobileBar.nativeElement) {
        this.mobileBar.nativeElement.style.width = `${actualProgress}%`;
        this.mobileBar.nativeElement.style.backgroundColor = this.fillColor;
      }
      if (this.mobileMatchingBar && this.mobileMatchingBar.nativeElement) {
        this.mobileMatchingBar.nativeElement.style.width = `${actualMatchingScore}%`;
        this.mobileMatchingBar.nativeElement.style.backgroundColor = this.matchingScoreFillColor;
      }
    } else {
      const radius = 4;
      const circumference = 2 * Math.PI * radius;
      if (this.desktopMatchingLoader && this.desktopMatchingLoader.nativeElement) {
        const strokeLength = (actualMatchingScore / 100) * circumference;
        this.matchingScoreStrokeDasharray = `${strokeLength} ${circumference - strokeLength}`;
        this.desktopMatchingLoader.nativeElement.style.stroke = this.matchingScoreFillColor;
      }
    }

    this.progress = Math.round(actualProgress);
    this.matchingScore = Math.round(actualMatchingScore);
  }
}