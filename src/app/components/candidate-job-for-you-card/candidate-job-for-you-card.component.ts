import { Component, OnInit, Input, AfterViewInit, ContentChild, TemplateRef, ElementRef, ViewChild, ChangeDetectorRef, SimpleChanges, OnChanges, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/candidate.service';
import { JobsService } from '../../services/job.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'candidate-job-for-you-card',
  templateUrl: './candidate-job-for-you-card.component.html',
  styleUrls: ['./candidate-job-for-you-card.component.css'],
})
export class CandidateJobForYouCard implements OnInit, AfterViewInit, OnChanges, OnDestroy {

  private destroy$ = new Subject<void>();
  userProfile: any = {};
  defaultProfilePicture: string = "https://storage.googleapis.com/cv-storage-sample1/placeholder_images/profile-placeholder.jpg";
  score: number = 0;
  hasValidScore: boolean = false;
  public avatarBgColor: string = '#6c757d';

  isDisliked: boolean = false;
  isSaved: boolean = false;
  shouldRender: boolean = true;
  private dislikedCacheName = 'disliked-jobs-cache-v1';

  @Input() matchingScore: number | null | undefined;
  @Input() jobId: string = ''; // Initialize to empty string MODIFIED
  @Input() rootClassName: string = '';
  @Input() imageSrc: string =
    'https://s3-alpha-sig.figma.com/img/cb33/d035/72e938963245d419674c3c2e71065794?Expires=1737936000&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4&Signature=q4HKhJijWG7gIkWWgF~7yllDZKHyqxALVLh-VKU~aa6mkzu0y4';
  @Input() imageAlt: string = 'image';
  @Input() companyInitials: string;

  @ViewChild('desktopBar', { static: false }) desktopBar: ElementRef;
  @ViewChild('mobileLoader', { static: false }) mobileLoader: ElementRef;

  @ContentChild('text2') text2: TemplateRef<any>;
  @ContentChild('button') button: TemplateRef<any>;
  @ContentChild('text4') text4: TemplateRef<any>;
  @ContentChild('text1') text1: TemplateRef<any>;
  @ContentChild('text') text: TemplateRef<any>;
  @ContentChild('button1') button1: TemplateRef<any>;
  @ContentChild('text3') text3: TemplateRef<any>;

  constructor(
    private router: Router,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private jobService: JobsService
  ) {}

  async ngOnInit(): Promise<void> {
    this.score = this.matchingScore || 0;
    this.loadUserProfile();
    
    // Ensure jobId is present before attempting to load from cache or API
    if (!this.jobId) {
      await this.loadJobIdFromCache(); // This might set this.jobId from cache
    }
    
    // If jobId is STILL not available, log a warning and exit early.
    if (!this.jobId) {
      console.warn('CandidateJobForYouCard: jobId is not available in ngOnInit. Skipping interaction checks.');
      return;
    }

    this.jobService.jobInteraction$.pipe(takeUntil(this.destroy$)).subscribe(interaction => {
      if (interaction.jobId === this.jobId) {
        if (interaction.type === 'dislike') {
          this.isDisliked = interaction.state;
          this.shouldRender = !this.isDisliked;
        } else if (interaction.type === 'save') {
          this.isSaved = interaction.state;
        }
        this.cdr.detectChanges();
      }
    });

    const userId = localStorage.getItem('user_id');

    if (userId && this.jobId) {
      const cachedDislikedJobs = await this.getDislikedJobsFromCache(userId);
      if (cachedDislikedJobs) {
        console.log('Disliked jobs loaded from cache.');
        this.isDisliked = cachedDislikedJobs.includes(this.jobId);
        this.shouldRender = !this.isDisliked;
        this.cdr.detectChanges();
      }

      this.authService.getDislikedJobs(userId).subscribe({
        next: (response: any) => {
          const dislikedJobs = response.disliked_jobs.map((job: any) => job.job_id?.toString() || ''); // Add optional chaining and fallback
          this.isDisliked = dislikedJobs.includes(this.jobId);
          this.shouldRender = !this.isDisliked;
          this.cacheDislikedJobs(userId, dislikedJobs);
          console.log('Disliked jobs fetched from API and cache updated.');
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error fetching disliked jobs from API:', error);
        },
      });

      this.authService.getSavedJobs(userId).subscribe({
        next: (response: any) => {
          // Ensure savedJobIds are strings for consistent comparison if this.jobId is string
          const savedJobIds = response.saved_jobs.map((id: number) => id.toString()); 
          this.isSaved = savedJobIds.includes(this.jobId);
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error fetching saved jobs:', error);
        },
      });

    } else {
      console.warn('CandidateJobForYouCard: user_id or jobId missing for fetching user interactions', { userId, jobId: this.jobId });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getColorFromString(str: string): string {
    const colors = [
      '#1abc9c', '#3498db', '#9b59b6', '#e67e22', '#e74c3c',
      '#2ecc71', '#34495e', '#16a085', '#27ae60', '#2980b9',
      '#8e44ad', '#d35400', '#c0392b', '#7f8c8d',
      '#474748', '#30B63F', '#F6B85C'
    ];

    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
      hash = hash & hash; // Convert to 32bit integer
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  }

  private processMatchingScore(): void {
  const score = this.matchingScore;
  if (score !== null && score !== undefined && !isNaN(score)) {
    this.score = score;
    this.hasValidScore = true;
  } else {
    this.score = 0; // Default to 0 internally
    this.hasValidScore = false;
  }
}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['matchingScore'] && !changes['matchingScore'].firstChange) {
      this.score = this.matchingScore || 0;
      this.animateProgressBar();
    }
  }

  loadUserProfile(): void {
    const profileData = localStorage.getItem('userProfile');
    if (profileData) {
      this.userProfile = JSON.parse(profileData);
      if (this.userProfile.initials) {
        this.avatarBgColor = this.getColorFromString(this.userProfile.initials);
      }
    } else {
      console.log("User Profile NOT fetched");
    }
  }

  isImage(src: string): boolean {
    // very basic check, you can improve for base64 or remote images
    return src?.startsWith('http') || src?.startsWith('data:image');
  }


// Modified `loadJobIdFromCache` to actually assign the jobId to `this.jobId`
  async loadJobIdFromCache(): Promise<void> {
    if (this.jobId) return; // Only try to load if jobId isn't already set

    try {
      const cache = await caches.open('job-cache');
      const cachedResponse = await cache.match('job-data');
      if (cachedResponse) {
        const jobData = await cachedResponse.json();
        // Ensure job_id is string and assign to this.jobId
        this.jobId = jobData.job_id?.toString() || '';
        if (!this.jobId) {
          console.error('job_id missing in cached job data:', jobData);
        } else {
          console.log('Job ID fetched from cache:', this.jobId);
        }
      } else {
        console.error('No job data found in cache');
      }
    } catch (error) {
      console.error('Error fetching job ID from cache:', error);
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.animateProgressBar();
    }, 0);
  }

  // --- [NEW] Cache API Helper Methods for Disliked Jobs ---

  /**
   * Retrieves the list of disliked jobs from the browser's Cache API.
   * @param userId The ID of the user.
   * @returns A promise that resolves to an array of job IDs or null.
   */
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

  /**
   * Stores the list of disliked jobs in the browser's Cache API.
   * @param userId The ID of the user, used as the cache key.
   * @param dislikedJobs The array of job IDs to cache.
   */
  private async cacheDislikedJobs(userId: string, dislikedJobs: string[]): Promise<void> {
    try {
      const cache = await caches.open(this.dislikedCacheName);
      const response = new Response(JSON.stringify(dislikedJobs));
      await cache.put(userId, response);
    } catch (error) {
      console.error('Error caching disliked jobs:', error);
    }
  }

   /**
   * Updates the disliked jobs cache after an add or remove action.
   * @param userId The ID of the user.
   * @param jobId The job ID to add or remove.
   * @param action The action to perform: 'add' or 'remove'.
   */
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
    console.log(`Cache updated: Job ${jobId} ${action}ed.`);
  }


  // --- Progress Bar Methods (Unchanged) ---

  private getFillColor(value: number): string {
    if (value <= 40) return 'red';
    if (value <= 60) return 'orange';
    if (value <= 75) return '#4D91C6';
    if (value <= 84) return 'lightgreen';
    return 'darkgreen';
  }

  private animateProgressBar(): void {
    const duration = 2000;
    const startTime = Date.now();
    const animate = () => {
      const currentTime = Date.now();
      const elapsedTime = currentTime - startTime;
      const progress = Math.min(elapsedTime / duration, 1);
      const currentPercentage = progress * this.score;
      this.updateProgressBar(currentPercentage);
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }

  private updateProgressBar(percentage: number): void {
    const actualPercentage = Math.min(percentage, this.score);
    if (this.desktopBar && this.desktopBar.nativeElement) {
      this.desktopBar.nativeElement.style.width = `${actualPercentage}%`;
      this.desktopBar.nativeElement.style.backgroundColor = this.getFillColor(actualPercentage);
    }
    if (this.mobileLoader && this.mobileLoader.nativeElement) {
      const radius = 4;
      const circumference = 2 * Math.PI * radius;
      const strokeLength = (actualPercentage / 134) * circumference;
      this.mobileLoader.nativeElement.style.strokeDasharray = `${strokeLength} ${circumference - strokeLength}`;
      this.mobileLoader.nativeElement.style.stroke = this.getFillColor(actualPercentage);
    }
  }

  // --- User Interaction Handlers ---

  onCardClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (
      !target.closest('.candidate-job-for-you-card-button1') &&
      !target.closest('.candidate-job-for-you-card-button2') &&
      !target.closest('.candidate-job-for-you-card-icon14') &&
      !target.closest('.candidate-job-for-you-card-icon16')
    ) {
      // Ensure jobId is available before navigating
      if (this.jobId) {
        this.router.navigate(['/candidate-job-detail-view'], {
          queryParams: {
            jobId: this.jobId,
            score: this.matchingScore || 0 // Branch-1 includes score, Branch-2 removes it. I'll keep it as it adds value.
          }
        });
      } else {
        console.warn('Cannot navigate: jobId is not available for card click.');
      }
    }
  }

  onApply(event: MouseEvent): void {
    event.stopPropagation();
    console.log('Apply button clicked for jobId:', this.jobId);
  }

  onTakeAssessment(event: MouseEvent): void {
    event.stopPropagation();
    console.log('Take Assessment button clicked for jobId:', this.jobId);
  }

  /**
   * --- [MODIFIED] --- 
   * Handles clicks on the Dislike icon. Prevents disliking a saved job and updates Cache API on success.
   */
  onDislike(event: MouseEvent): void {
    event.stopPropagation();
    if (!this.jobId) { // Defensive check
      console.warn('Cannot dislike: jobId is not available.');
      return;
    }
    if (this.isSaved) {
      console.warn('Blocked attempt to dislike a saved job. Job ID:', this.jobId);
      alert('You cannot dislike a job that is saved. Please unsave it first.');
      return;
    }
    const userId = localStorage.getItem('user_id');
    if (!userId) {
      console.error('Cannot dislike: User ID not found.');
      return;
    }

    if (this.isDisliked) {
      this.authService.removeDislikedJob(userId, this.jobId).subscribe({
        next: (response) => {
          this.isDisliked = false;
          this.updateDislikedJobsCache(userId, this.jobId, 'remove');
          this.jobService.notifyJobInteraction(this.jobId, 'dislike', false);
          alert('Dislike removed.');
          this.cdr.detectChanges();
        },
        error: (error) => { console.error('Error removing dislike:', error); },
      });
    } else {
      this.authService.dislikeJob(userId, this.jobId).subscribe({
        next: (response) => {
          this.isDisliked = true;
          this.updateDislikedJobsCache(userId, this.jobId, 'add');
          this.jobService.notifyJobInteraction(this.jobId, 'dislike', true);
          alert('Job disliked successfully.');
          this.cdr.detectChanges();
        },
        error: (error) => { console.error('Error disliking job:', error); },
      });
    }
  }


  /**

   * Handles clicks on the Save icon. (Unchanged)
   */
  onSave(event: MouseEvent): void {
    event.stopPropagation();
    if (!this.jobId) { // Defensive check
      console.warn('Cannot save: jobId is not available.');
      return;
    }
    if (this.isDisliked) {
      console.warn('Blocked attempt to save a disliked job. Job ID:', this.jobId);
      alert('You cannot save a job that is disliked. Please remove dislike first.');
      return;
    }
    const userId = localStorage.getItem('user_id');
    if (!userId) {
      console.error('Cannot save: User ID not found.');
      return;
    }

    if (this.isSaved) {
      this.authService.removeSavedJob(userId, this.jobId).subscribe({
        next: (response) => {
          this.isSaved = false;
          this.jobService.notifyJobInteraction(this.jobId, 'save', false);
          alert('Job unsaved successfully!');
          this.cdr.detectChanges();
        },
        error: (error) => { console.error('Error unsaving job:', error); },
      });
    } else {
      this.authService.saveJob(userId, this.jobId).subscribe({
        next: (response) => {
          this.isSaved = true;
          this.jobService.notifyJobInteraction(this.jobId, 'save', true);
          alert('Job saved successfully!');
          this.cdr.detectChanges();
        },
        error: (error) => { console.error('Error saving job:', error); },
      });
    }
  }
}