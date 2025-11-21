import { Component, OnInit, Input, AfterViewInit, ContentChild, TemplateRef, ElementRef, ViewChild, ChangeDetectorRef, SimpleChanges, OnChanges, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/candidate.service';
import { JobsService } from '../../services/job.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AlertMessageComponent } from '../alert-message/alert-message.component';
import { NgClass, NgTemplateOutlet } from '@angular/common';

@Component({
    selector: 'candidate-job-for-you-card',
    templateUrl: './candidate-job-for-you-card.component.html',
    styleUrls: ['./candidate-job-for-you-card.component.css'],
    standalone: true,
    imports: [
        AlertMessageComponent,
        NgClass,
        NgTemplateOutlet,
    ],
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
  
  showAlert = false;
  alertMessage = '';
  alertButtons: string[] = [];

  shouldRender: boolean = true;
  private dislikedCacheName = 'disliked-jobs-cache-v1';

  @Input() matchingScore: number | null | undefined;
  @Input() jobId: string = '';
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
    this.processMatchingScore();
    this.loadUserProfile();
    
    if (!this.jobId) {
      await this.loadJobIdFromCache();
    }
    
    if (!this.jobId) {
      console.warn('CandidateJobForYouCard: jobId is not available in ngOnInit. Skipping interaction checks.');
      return;
    }

    this.jobService.jobInteraction$.pipe(takeUntil(this.destroy$)).subscribe(interaction => {
      if (interaction.jobId === this.jobId) {
        if (interaction.type === 'dislike') {
          this.isDisliked = interaction.state;
          // this.shouldRender = !this.isDisliked;
        } else if (interaction.type === 'save') {
          this.isSaved = interaction.state;
        }
        this.cdr.detectChanges();
      }
    });

    const userId = localStorage.getItem('user_id');

    if (userId && this.jobId) {
      // Prioritize cache for faster UI response
      const cachedDislikedJobs = await this.getDislikedJobsFromCache(userId);
      if (cachedDislikedJobs) {
        this.isDisliked = cachedDislikedJobs.includes(this.jobId);
        // this.shouldRender = !this.isDisliked;
        this.cdr.detectChanges();
      }

      // Fetch latest interaction statuses from API
      this.authService.getDislikedJobs(userId).subscribe({
        next: (response: any) => {
          const dislikedJobs = response.disliked_jobs.map((id: number) => id.toString());
          this.isDisliked = dislikedJobs.includes(this.jobId);
          // this.shouldRender = !this.isDisliked;
          this.cacheDislikedJobs(userId, dislikedJobs); // Update cache
          this.cdr.detectChanges();
        },
        error: (error) => console.error('Error fetching disliked jobs from API:', error),
      });

      this.authService.getSavedJobs(userId).subscribe({
        next: (response: any) => {
          const savedJobIds = response.saved_jobs.map((id: number) => id.toString()); 
          this.isSaved = savedJobIds.includes(this.jobId);
          this.cdr.detectChanges();
        },
        error: (error) => console.error('Error fetching saved jobs:', error),
      });

    } else {
      console.warn('CandidateJobForYouCard: user_id or jobId missing for fetching user interactions.', { userId, jobId: this.jobId });
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['matchingScore']) {
      this.processMatchingScore();
      if (!changes['matchingScore'].firstChange) {
        this.animateProgressBar();
      }
    }
  }
  
  ngAfterViewInit(): void {
    setTimeout(() => {
      this.animateProgressBar();
    }, 0);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private processMatchingScore(): void {
    const score = this.matchingScore;
    if (score !== null && score !== undefined && !isNaN(score)) {
      this.score = score;
      this.hasValidScore = true;
    } else {
      this.score = 0;
      this.hasValidScore = false;
    }
  }

  loadUserProfile(): void {
    const profileData = localStorage.getItem('userProfile');
    if (profileData) {
      this.userProfile = JSON.parse(profileData);
      if (this.userProfile.initials) {
        this.avatarBgColor = this.getColorFromString(this.userProfile.initials);
      }
    }
  }
  
  async loadJobIdFromCache(): Promise<void> {
    if (this.jobId) return;

    try {
      const cache = await caches.open('job-cache');
      const cachedResponse = await cache.match('job-data');
      if (cachedResponse) {
        const jobData = await cachedResponse.json();
        this.jobId = jobData.job_id?.toString() || '';
      }
    } catch (error) {
      console.error('Error fetching job ID from cache:', error);
    }
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

  onCardClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    // Prevent navigation if any interactive element (icon or button) is clicked
    if (target.closest('[class*="icon"], [class*="button"]')) {
      return;
    }
  
    if (this.jobId) {
      this.router.navigate(['/candidate-job-detail-view'], {
        queryParams: {
          jobId: this.jobId,
          // score: this.matchingScore || 0 // Pass score for potential use on the details page
        }
      });
    } else {
      console.warn('Cannot navigate: jobId is not available for card click.');
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
  
  onDislike(event: MouseEvent): void {
  event.stopPropagation();
  if (!this.jobId) {
    console.warn('Cannot dislike: jobId is not available.');
    return;
  }
  if (this.isSaved) {
    // Show an informational alert if the job is saved
    this.openAlert('You cannot dislike a job that is saved. Please unsave it first.', ['Close']);
    return;
  }
  const userId = localStorage.getItem('user_id');
  if (!userId) {
    console.error('Cannot dislike: User ID not found.');
    return;
  }

  // Show a confirmation alert based on the current dislike status
  if (this.isDisliked) {
    this.openAlert('Are you sure you want to remove the dislike for this job?', ['Cancel', 'Remove Dislike']);
  } else {
    this.openAlert('Are you sure you want to dislike this job?', ['Cancel', 'Dislike']);
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
        // Do nothing, the popup is already closed.
        break;
    }
  }

  private onDislikeConfirmed(): void {
    const userId = localStorage.getItem('user_id');
    if (!userId || !this.jobId) {
      console.error('User ID or Job ID missing for confirmed dislike.');
      return;
    }

    const action = this.isDisliked
      ? this.authService.removeDislikedJob(userId, this.jobId)
      : this.authService.dislikeJob(userId, this.jobId);

    action.subscribe({
      next: () => {
        const wasDisliked = this.isDisliked;
        this.isDisliked = !wasDisliked;
        this.updateDislikedJobsCache(userId, this.jobId, wasDisliked ? 'remove' : 'add');
        this.jobService.notifyJobInteraction(this.jobId, 'dislike', this.isDisliked);
        this.cdr.detectChanges();
      },
      error: (error) => console.error('Error updating dislike status:', error),
    });
  }

  onSave(event: MouseEvent): void {
  event.stopPropagation();
  if (!this.jobId) {
    console.warn('Cannot save: jobId is not available.');
    return;
  }
  if (this.isDisliked) {
    alert('You cannot save a job that is disliked. Please remove the dislike first.');
    return;
  }
  const userId = localStorage.getItem('user_id');
  if (!userId) {
    console.error('Cannot save: User ID not found.');
    return;
  }

  // The confirmation logic has been removed. The action is now performed directly.
  const action = this.isSaved
    ? this.authService.removeSavedJob(userId, this.jobId)
    : this.authService.saveJob(userId, this.jobId);

  action.subscribe({
    next: () => {
      this.isSaved = !this.isSaved;
      this.jobService.notifyJobInteraction(this.jobId, 'save', this.isSaved);
      this.cdr.detectChanges();
    },
    error: (error) => console.error('Error updating save status:', error),
  });
}
  
  // --- Helper and UI Methods ---
  isImage(src: string): boolean {
    return src?.startsWith('http') || src?.startsWith('data:image');
  }

  getColorFromString(str: string): string {
    const colors = [
      '#1abc9c', '#3498db', '#9b59b6', '#e67e22', '#e74c3c', '#2ecc71', 
      '#34495e', '#16a085', '#27ae60', '#2980b9', '#8e44ad', '#d35400', 
      '#c0392b', '#7f8c8d', '#474748', '#30B63F', '#F6B85C'
    ];
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
      hash = hash & hash;
    }
    return colors[Math.abs(hash) % colors.length];
  }

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
      const elapsedTime = Date.now() - startTime;
      const progress = Math.min(elapsedTime / duration, 1);
      this.updateProgressBar(progress * this.score);
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    if (this.hasValidScore) {
      requestAnimationFrame(animate);
    } else {
      this.updateProgressBar(0); // Show empty bar if no valid score
    }
  }

  private updateProgressBar(percentage: number): void {
    const actualPercentage = Math.min(percentage, this.score);
    const fillColor = this.getFillColor(actualPercentage);

    if (this.desktopBar?.nativeElement) {
      this.desktopBar.nativeElement.style.width = `${actualPercentage}%`;
      this.desktopBar.nativeElement.style.backgroundColor = fillColor;
    }
    if (this.mobileLoader?.nativeElement) {
      const radius = 4;
      const circumference = 2 * Math.PI * radius;
      const strokeLength = (actualPercentage / 134) * circumference;
      this.mobileLoader.nativeElement.style.strokeDasharray = `${strokeLength} ${circumference}`;
      this.mobileLoader.nativeElement.style.stroke = fillColor;
    }
  }
}