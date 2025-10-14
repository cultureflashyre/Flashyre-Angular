// candidate-job-details.component.ts

import { Component, Input, OnChanges, SimpleChanges, TemplateRef, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
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

  constructor(
    private jobService: JobsService,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService
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
    this.loading = true;
    this.errorMessage = null;
    this.successMessage = null;
    this.isApplied = false;
    this.jobService.getJobById(this.jobId!).subscribe({
      next: (data) => {
        this.job = data;
        this.job.attempts_remaining = data.attempts_remaining ?? this.attemptsFromNavigation;
        this.loading = false;
      },
      error: (err) => {
        this.resetJob();
        this.errorMessage = `Job with ID ${this.jobId} not found. Please select another job.`;
        this.loading = false;
      }
    });
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
        next: () => {
          this.isApplied = true;
          this.isProcessing = false;
          alert('You have successfully applied for this job!');
          setTimeout(() => {
            this.jobService.removeJobFromCache(this.job.job_id);
            this.job = null;
          }, 2000);
        },
        error: (error) => {
          this.isProcessing = false;
          alert(error.error?.error || 'Failed to apply for this job');
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