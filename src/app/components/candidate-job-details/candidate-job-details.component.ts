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
  @Input() job: any | null = null;
  @Input() text: TemplateRef<any> | null = null;
  @Input() text1: TemplateRef<any> | null = null;
  @Input() text2: TemplateRef<any> | null = null;
  @Input() text3: TemplateRef<any> | null = null;
  @Input() button: TemplateRef<any> | null = null;
  @Input() button1: TemplateRef<any> | null = null;
  @Input() activeTab: 'recommended' | 'saved' | 'applied' = 'recommended';
  @Output() applicationRevoked = new EventEmitter<number>();
  @Output() jobAppliedSuccess = new EventEmitter<any>(); // Emits the full job object
  @Output() jobSaved = new EventEmitter<any>();
  @Output() jobUnsaved = new EventEmitter<any>();
  @Output() jobDisliked = new EventEmitter<any>();
  @Output() jobUndisliked = new EventEmitter<any>();

  @ViewChild('mobileBar') mobileBar: ElementRef;
  @ViewChild('mobileMatchingBar') mobileMatchingBar: ElementRef;
  @ViewChild('desktopMatchingLoader') desktopMatchingLoader: ElementRef;

  // job: any = {
  //   job_id: null,
  //   company_name: '',
  //   logo: '',
  //   title: '',
  //   location: '',
  //   job_type: '',
  //   created_at: '',
  //   description: '',
  //   requirements: '',
  //   salary: null,
  //   url: null,
  //   source: '',
  //   tag: '',
  //   contract_time: '',
  //   contract_type: '',
  //   external_id: '',
  //   last_updated: '',
  //   assessment: null,
  //   attempts_remaining: null,
  //   matching_score: 0 // Initialize for template safety
  // };
  userProfile: any = {};
  loading: boolean = false;
  errorMessage: string | null = null;
  progress: number = 0;
  public matchingScore: number | null = null; // Internal property for matching score
  fillColor: string = '#4D91C6';
  matchingScoreFillColor: string = '#4D91C6';
  matchingScoreStrokeDasharray: string = '0 25.12';
  defaultProfilePicture: string = environment.defaultProfilePicture;
  
  isMobile: boolean = window.innerWidth < 767;
  isProcessing: boolean = false;
  isApplied: boolean = false;
  successMessage: string | null = null;
  private destroy$ = new Subject<void>();

  private isViewInitialized = false;
  private attemptsFromNavigation: number | null = null;

  isProcessingDislike: boolean = false;
  isProcessingSave: boolean = false;

  isDisliked: boolean = false;
  isSaved: boolean = false;
  private dislikedCacheName = 'disliked-jobs-cache-v1';

  showAlert = false;
  alertMessage = '';
  alertButtons: string[] = [];

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

  get dateLabel(): string {
    switch (this.activeTab) {
      case 'applied':
        return 'Applied';
      case 'saved':
        return 'Saved';
      default:
        return 'Posted';
    }
  }

  /**
   * Returns the correct date value from the job object based on the active tab.
   * Assumes job object has 'applied_at' for applied jobs and 'saved_at' for saved jobs.
   */
  get displayDate(): string | null { // The return type now allows null
    switch (this.activeTab) {
      case 'applied':
        // This data now comes directly from the backend API
        return this.job.applied_at;
      case 'saved':
        // Per requirements, do not show any date for saved jobs
        return 'Saved';
      default:
        // For the "recommended" tab, show the original posted date
        return this.job.created_at;
    }
  }

  openAlert(message: string, buttons: string[]) {
    this.alertMessage = message;
    this.alertButtons = buttons;
    this.showAlert = true;
  }

  onAlertButtonClicked(action: string) {
    this.showAlert = false;
    switch(action.toLowerCase()) {
      case 'dislike':
      case 'remove dislike':
        this.onDislikeConfirmed();
        break;
      case 'cancel':
      case 'close':
        // Do nothing
        break;
    }
  }

  private onDislikeConfirmed(): void {
    const userId = localStorage.getItem('user_id');
    const jobIdStr = this.job?.job_id?.toString();
    if (!userId || !jobIdStr || this.isProcessingDislike) return;

    this.isProcessingDislike = true; 

    const action = this.isDisliked
      ? this.authService.removeDislikedJob(userId, jobIdStr)
      : this.authService.dislikeJob(userId, jobIdStr);

    action.subscribe({
      next: () => {
        const wasDisliked = this.isDisliked; 
        this.isDisliked = !wasDisliked; 

        wasDisliked ? this.jobUndisliked.emit(this.job) : this.jobDisliked.emit(this.job);
        
        this.updateDislikedJobsCache(userId, jobIdStr, this.isDisliked ? 'add' : 'remove');
        this.jobService.notifyJobInteraction(jobIdStr, 'dislike', this.isDisliked);

        this.isProcessingDislike = false; 
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.openAlert('Failed to update dislike status: ' + (error.error?.detail || error.message), ['Close']);
        this.isProcessingDislike = false; 
        this.cdr.detectChanges();
      },
    });
  }

  ngOnInit() {
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.attemptsFromNavigation = params['attempts'] !== undefined ? +params['attempts'] : null;
    });

    this.progress = 100.0;
    this.loadUserProfile();

    this.jobService.jobInteraction$.pipe(takeUntil(this.destroy$)).subscribe(interaction => {
      if (this.job && this.job.job_id && interaction.jobId === this.job.job_id.toString()) {
        if (interaction.type === 'dislike') {
          this.isDisliked = interaction.state;
        } else if (interaction.type === 'save') {
          this.isSaved = interaction.state;
        }
        this.cdr.detectChanges();
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
    if (changes['job']) {
      const newJob = changes['job'].currentValue;
      if (newJob) {
        this.loading = true; // Briefly show loading
        this.errorMessage = null;
        this.successMessage = null;
        this.isApplied = false;

        // Directly use the passed job object
        this.matchingScore = null;
        this.fetchMatchingScore(newJob.job_id); // Fetch score for the new job
        this.fetchInteractionStatus(); // Check if disliked/saved
        this.setProgressBarState();
        this.loading = false; // Turn off loading
      } else {
        this.resetJob();
      }
    }
  }

  private fetchMatchingScore(jobId: number): void {
    if (jobId === null || jobId === undefined) return;

    this.authService.getMatchScores([jobId])
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: scoresMap => {
          const fetchedScore = scoresMap[jobId];
          this.matchingScore = fetchedScore !== undefined ? fetchedScore : 0;
          this.setProgressBarState();
          this.cdr.detectChanges();
        },
        error: err => {
          console.error(`Failed to fetch matching score for job ${jobId}:`, err);
          this.matchingScore = 0;
          this.setProgressBarState();
          this.cdr.detectChanges();
        }
      });
  }

  private loadUserProfile(): void {
    try {
      const profileData = localStorage.getItem('userProfile');
      this.userProfile = profileData ? JSON.parse(profileData) : { profile_picture_url: null };
    } catch (error) {
      console.error('Error parsing user profile data from local storage:', error);
      this.userProfile = { profile_picture_url: null };
    }
  }

  // private fetchJobDetails(jobId: number): void {
  //   this.loading = true;
  //   this.errorMessage = null;
  //   this.successMessage = null;
  //   this.isApplied = false;

  //   this.jobService.getJobById(jobId).subscribe({
  //     next: (data) => {
  //       this.job = {
  //         ...this.job, // Retain default structure
  //         ...data,
  //         attempts_remaining: (data.attempts_remaining !== null && data.attempts_remaining !== undefined) 
  //           ? data.attempts_remaining 
  //           : this.attemptsFromNavigation,
  //         matching_score: 0 // Keep as 0, as public matchingScore holds the true value
  //       };
  //       this.loading = false;
        
  //       if (this.activeTab !== 'applied') {
  //         this.fetchInteractionStatus();
  //       } else {
  //         this.isDisliked = false;
  //         this.isSaved = false;
  //       }
  //       this.cdr.detectChanges();
  //     },
  //     error: (err) => {
  //       this.resetJob();
  //       this.errorMessage = `Job with ID ${jobId} not found. Please select another job.`;
  //       this.loading = false;
  //       this.cdr.detectChanges();
  //     }
  //   });
  // }

  private async fetchInteractionStatus(): Promise<void> {
    const userId = localStorage.getItem('user_id');
    const jobIdStr = this.job?.job_id?.toString();

    if (!userId || !jobIdStr) {
      this.isDisliked = false;
      this.isSaved = false;
      return;
    }

    this.isDisliked = false;
    this.isSaved = false;
    
    // Check cache for dislike status
    const cachedDisliked = await this.getDislikedJobsFromCache(userId);
    if (cachedDisliked) {
      this.isDisliked = cachedDisliked.includes(jobIdStr);
      this.cdr.detectChanges();
    }
    
    // Fetch latest dislike status from API
    this.authService.getDislikedJobs(userId).subscribe(response => {
      const dislikedJobs = response.disliked_jobs.map((job: any) => job.job_id.toString());
      this.isDisliked = dislikedJobs.includes(jobIdStr);
      this.cacheDislikedJobs(userId, dislikedJobs);
      this.cdr.detectChanges();
    });

    // Fetch saved status from API
    this.authService.getSavedJobs(userId).subscribe(response => {
      this.isSaved = response.saved_jobs.includes(this.job.job_id);
      this.cdr.detectChanges();
    });
  }

  onDislike(event: MouseEvent): void {
    event.stopPropagation();
    if (this.isProcessingDislike || this.isProcessingSave) {
        return;
    }
    if (this.isSaved) {
      this.openAlert('You cannot dislike a job that is saved. Please unsave it first.', ['Close']);
      return;
    }

    if (this.isDisliked) {
        this.openAlert('Are you sure you want to remove the dislike for this job?', ['Cancel', 'Remove Dislike']);
    } else {
        this.openAlert('Are you sure you want to dislike this job?', ['Cancel', 'Dislike']);
    }
  }


  onSave(event: MouseEvent): void {
    event.stopPropagation();
    if (this.isProcessingSave || this.isProcessingDislike) {
        return;
    }
    if (this.isDisliked) {
      alert('You cannot save a job that is disliked. Please remove the dislike first.');
      return;
    }
    const userId = localStorage.getItem('user_id');
    const jobIdStr = this.job?.job_id?.toString();
    if (!userId || !jobIdStr) return;

    this.isProcessingSave = true; 

    const action = this.isSaved
      ? this.authService.removeSavedJob(userId, jobIdStr)
      : this.authService.saveJob(userId, jobIdStr);

    action.subscribe({
      next: () => {
        const wasSaved = this.isSaved; 
        this.isSaved = !wasSaved; 

        wasSaved ? this.jobUnsaved.emit(this.job) : this.jobSaved.emit(this.job); 
        this.jobService.notifyJobInteraction(jobIdStr, 'save', this.isSaved);
        
        this.isProcessingSave = false; 
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Failed to update save status: ' + (error.error?.detail || error.message)); 
        this.isProcessingSave = false; 
        this.cdr.detectChanges();
      }
    });
  }

  private async getDislikedJobsFromCache(userId: string): Promise<string[] | null> {
    try {
      const cache = await caches.open(this.dislikedCacheName);
      const response = await cache.match(userId);
      return response ? await response.json() : null;
    } catch (error) {
      console.error('Error getting disliked jobs from cache:', error);
      return null;
    }
  }

  private async cacheDislikedJobs(userId: string, dislikedJobs: string[]): Promise<void> {
    try {
      const cache = await caches.open(this.dislikedCacheName);
      await cache.put(userId, new Response(JSON.stringify(dislikedJobs)));
    } catch (error) {
      console.error('Error caching disliked jobs:', error);
    }
  }

  private async updateDislikedJobsCache(userId: string, jobId: string, action: 'add' | 'remove'): Promise<void> {
    const cachedJobs = await this.getDislikedJobsFromCache(userId) || [];
    const index = cachedJobs.indexOf(jobId);

    if (action === 'add' && index === -1) {
      cachedJobs.push(jobId);
    } else if (action === 'remove' && index > -1) {
      cachedJobs.splice(index, 1);
    }
    await this.cacheDislikedJobs(userId, cachedJobs);
  }

  // private resetJob(): void {
  //    this.job = {
  //      job_id: null, company_name: '', logo: '', title: '', location: '',
  //      job_type: '', created_at: '', description: '', requirements: '', salary: null,
  //      url: null, source: '', tag: '', contract_time: '', contract_type: '',
  //      external_id: '', last_updated: '', assessment: null, attempts_remaining: null,
  //      matching_score: 0
  //    };
  //   this.matchingScore = null;
  //   this.progress = 0;
  //   this.errorMessage = null;
  //   this.isApplied = false;
  //   this.isDisliked = false;
  //   this.isSaved = false;
  //   this.loading = false;
  //   this.setProgressBarState();
  //   this.cdr.detectChanges();
  // }

  private resetJob(): void {
  this.job = null; // Clear the input job
  this.matchingScore = null;
  this.progress = 0;
  this.errorMessage = null;
  this.isApplied = false;
  this.isDisliked = false;
  this.isSaved = false;
  this.loading = false;
  this.setProgressBarState();
  this.cdr.detectChanges();
}

  applyForJob(): void {
    if (this.isApplied || !this.job?.job_id) return;
    this.isProcessing = true;
    this.authService.applyForJob(this.job.job_id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
       next: () => {
          this.isApplied = true;
          this.isProcessing = false;
          alert('You have successfully applied for this job!');
          this.jobService.removeJobFromCache(this.job.job_id); 
          this.jobAppliedSuccess.emit(this.job); 
        },
        error: (error) => {
          this.isProcessing = false;
          alert(error.error?.error || 'Failed to apply for this job');
        }
      });
  }

  revokeApplication(): void {
    if (!this.job.job_id || !window.confirm('Do you want to Revoke this application?')) {
      return;
    }

    this.isProcessing = true;
    this.authService.revokeApplication(this.job.job_id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isProcessing = false;
          this.jobService.clearCache();
          this.applicationRevoked.emit(this.job.job_id);
          alert('Application revoked successfully!');
          this.resetJob(); 
        },
        error: (err) => {
          this.isProcessing = false;
          alert(err.error?.error || 'Failed to revoke application');
        }
      });
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

  private setProgressBarState(): void {
    if (this.matchingScore !== null && typeof this.matchingScore !== 'undefined' && this.matchingScore >= 0) { 
      this.updateProgressBar(this.matchingScore, this.progress);
    } else {
      this.updateProgressBar(0, this.progress);
    }
    this.cdr.detectChanges();
  }

  private updateProgressBar(percentage: number | null, companyPercentage: number): void { 
    const actualMatchingScore = Math.min(percentage || 0, 100); 
    const actualProgress = Math.min(companyPercentage, 100);

    this.fillColor = this.getFillColor(actualProgress);
    this.matchingScoreFillColor = this.getFillColor(actualMatchingScore);

    if (this.isMobile) {
      if (this.mobileBar?.nativeElement) {
        this.mobileBar.nativeElement.style.width = `${actualProgress}%`;
        this.mobileBar.nativeElement.style.backgroundColor = this.fillColor;
      }
      if (this.mobileMatchingBar?.nativeElement) {
        this.mobileMatchingBar.nativeElement.style.width = percentage !== null ? `${actualMatchingScore}%` : '0%';
        this.mobileMatchingBar.nativeElement.style.backgroundColor = this.matchingScoreFillColor;
      }
    } else {
      const radius = 4;
      const circumference = 2 * Math.PI * radius;
      if (this.desktopMatchingLoader?.nativeElement) {
         if (percentage !== null) {
            const strokeLength = (actualMatchingScore / 100) * circumference;
            this.matchingScoreStrokeDasharray = `${strokeLength} ${circumference}`;
         } else {
            this.matchingScoreStrokeDasharray = `0 ${circumference}`;
         }
         this.desktopMatchingLoader.nativeElement.style.stroke = this.matchingScoreFillColor;
      }
    }
    this.progress = Math.round(actualProgress);
  }
}