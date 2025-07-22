import { Component, OnInit, Input, AfterViewInit, ContentChild, TemplateRef, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/candidate.service';

@Component({
  selector: 'candidate-job-for-you-card',
  templateUrl: './candidate-job-for-you-card.component.html',
  styleUrls: ['./candidate-job-for-you-card.component.css'],
})
export class CandidateJobForYouCard implements OnInit, AfterViewInit {
  // --- Component Properties ---
  userProfile: any = {};
  defaultProfilePicture: string = "https://storage.googleapis.com/cv-storage-sample1/placeholder_images/profile-placeholder.jpg";
  score: number = 0;
  isDisliked: boolean = false;
  isSaved: boolean = false;
  shouldRender: boolean = true; // Added to control rendering

  // State booleans for the dislike and save buttons.

  // --- Angular Decorators ---
  @Input() matchingScore: number = 80;
  @Input() jobId: string;
  @Input() rootClassName: string = '';
  @Input() imageSrc: string =
    'https://s3-alpha-sig.figma.com/img/cb33/d035/72e938963245d419674c3c2e71065794?Expires=1737936000&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4&Signature=q4HKhJijWG7gIkWWgF~7yllDZKHyqxALVLh-VKU~aa6mkzu0y4';
  @Input() imageAlt: string = 'image';

  @ViewChild('desktopBar') desktopBar: ElementRef;
  @ViewChild('mobileLoader') mobileLoader: ElementRef;

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
    private cdr: ChangeDetectorRef
  ) {}

  /**
   * Component lifecycle hook.
   * Fetches the initial state for both dislike and save buttons, and sets shouldRender.
   */
  async ngOnInit(): Promise<void> {
    this.score = this.matchingScore;
    this.loadUserProfile();
    await this.loadJobIdFromCache();
    
    const userId = localStorage.getItem('user_id');

    if (userId && this.jobId) {
      // --- Fetch disliked jobs to set initial state ---
      this.authService.getDislikedJobs(userId).subscribe({
        next: (response: any) => {
          const dislikedJobs = response.disliked_jobs.map((job: any) => job.job_id.toString());
          this.isDisliked = dislikedJobs.includes(this.jobId);
          this.shouldRender = !this.isDisliked; // Set rendering based on initial dislike state
          console.log('Disliked jobs fetched:', dislikedJobs, 'isDisliked:', this.isDisliked, 'shouldRender:', this.shouldRender);
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error fetching disliked jobs:', error);
          const cachedDislikedJobs = localStorage.getItem('disliked_jobs');
          if (cachedDislikedJobs) {
            const dislikedJobs = JSON.parse(cachedDislikedJobs);
            this.isDisliked = dislikedJobs.includes(this.jobId);
            this.shouldRender = !this.isDisliked; // Use cached data for rendering
            this.cdr.detectChanges();
          }
        },
      });

      // --- Fetch saved jobs ---
      this.authService.getSavedJobs(userId).subscribe({
        next: (response: any) => {
          const savedJobIds = response.saved_jobs;
          this.isSaved = savedJobIds.includes(parseInt(this.jobId, 10));
          this.cdr.detectChanges(); // Update the save button's UI.
        },
        error: (error) => {
          console.error('Error fetching saved jobs:', error);
        },
      });

    } else {
      console.warn('user_id or jobId missing for fetching user interactions', { userId, jobId: this.jobId });
    }
  }

  loadUserProfile(): void {
    const profileData = localStorage.getItem('userProfile');
    if (profileData) {
      this.userProfile = JSON.parse(profileData);
      console.log('User profile loaded:', this.userProfile);
    } else {
      console.log('User Profile NOT fetched');
    }
  }

  async loadJobIdFromCache(): Promise<void> {
    if (!this.jobId) {
      try {
        const cache = await caches.open('job-cache');
        const cachedResponse = await cache.match('job-data');
        if (cachedResponse) {
          const jobData = await cachedResponse.json();
          this.jobId = jobData.job_id?.toString();
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
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.animateProgressBar();
    }, 0);
  }

  // --- Progress Bar Methods ---

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
    animate();
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
      this.router.navigate(['/candidate-job-detail-view'], {
        queryParams: { jobId: this.jobId },
      });
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
   * Handles clicks on the Dislike icon.
   */
  onDislike(event: MouseEvent): void {
    event.stopPropagation();
    const userId = localStorage.getItem('user_id');
    if (!userId || !this.jobId) {
      console.error('user_id or job_id missing for dislike action', { userId, jobId: this.jobId });
      alert('Unable to dislike job: User or job information is missing.');
      return;
    }

    if (this.isDisliked) {
      // Remove dislike
      this.authService.removeDislikedJob(userId, this.jobId).subscribe({
        next: (response) => {
          this.isDisliked = false;
          console.log('Job dislike removed successfully:', response);
          alert('Job dislike removed successfully!');
          this.cdr.detectChanges();
          // Update localStorage cache
          const cachedDislikedJobs = localStorage.getItem('disliked_jobs');
          if (cachedDislikedJobs) {
            let dislikedJobs = JSON.parse(cachedDislikedJobs);
            dislikedJobs = dislikedJobs.filter((id: string) => id !== this.jobId);
            localStorage.setItem('disliked_jobs', JSON.stringify(dislikedJobs));
          }
        },
        error: (error) => {
          console.error('Error removing disliked job:', error);
          alert('Failed to remove dislike: ' + error.message);
        },
      });
    } else {
      // Add dislike
      this.authService.dislikeJob(userId, this.jobId).subscribe({
        next: (response) => {
          this.isDisliked = true;
          console.log('Job disliked successfully:', response);
          alert('Job disliked successfully!');
          this.cdr.detectChanges();
          // Update localStorage cache
          const cachedDislikedJobs = localStorage.getItem('disliked_jobs');
          let dislikedJobs = cachedDislikedJobs ? JSON.parse(cachedDislikedJobs) : [];
          if (!dislikedJobs.includes(this.jobId)) {
            dislikedJobs.push(this.jobId);
            localStorage.setItem('disliked_jobs', JSON.stringify(dislikedJobs));
          }
        },
        error: (error) => {
          console.error('Error disliking job:', error);
          alert('Failed to dislike job: ' + error.message);
        },
      });
    }
  }

  /**
   * Handles clicks on the Save icon. Toggles the saved state.
   */
  onSave(event: MouseEvent): void {
    event.stopPropagation();
    const userId = localStorage.getItem('user_id');
    if (!userId || !this.jobId) {
      console.error('user_id or job_id missing for save action', { userId, jobId: this.jobId });
      alert('Unable to save job: User or job information is missing.');
      return;
    }

    if (this.isSaved) {
      // --- If already saved, call the REMOVE method ---
      this.authService.removeSavedJob(userId, this.jobId).subscribe({
        next: (response) => {
          this.isSaved = false; // Toggle the state to false.
          console.log('Job unsaved successfully:', response);
          alert('Job unsaved successfully!');
          this.cdr.detectChanges(); // Update the UI.
        },
        error: (error) => {
          console.error('Error unsaving job:', error);
          alert('Failed to unsave job: ' + error.message);
        },
      });
    } else {
      // --- If not saved, call the ADD method ---
      this.authService.saveJob(userId, this.jobId).subscribe({
        next: (response) => {
          this.isSaved = true; // Toggle the state to true.
          console.log('Job saved successfully:', response);
          alert('Job saved successfully!');
          this.cdr.detectChanges(); // Update the UI.
        },
        error: (error) => {
          console.error('Error saving job:', error);
          alert('Failed to save job: ' + error.message);
        },
      });
    }
  }
}