import { Component, Input, OnChanges, SimpleChanges, TemplateRef, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { JobsService } from '../../services/job.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/candidate.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'candidate-job-details',
  templateUrl: './candidate-job-details.component.html',
  styleUrls: ['./candidate-job-details.component.css'],
})
export class CandidateJobDetailsComponent implements OnInit, OnChanges, AfterViewInit {
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

  job: any = {
    job_id: null,
    company_name: '',
    logo: '',
    title: '',
    location: '',
    job_type: '',
    created_at: '',
    description: '',
    requirements: '',
    salary: null,
    url: null,
    source: '',
    tag: '',
    contract_time: '',
    contract_type: '',
    external_id: '',
    last_updated: ''
  };
  userProfile: any = {};
  loading: boolean = false;
  errorMessage: string | null = null;
  progress: number = 0;
  matchingScore: number = 0;
  fillColor: string = '#4D91C6';
  matchingScoreFillColor: string = '#4D91C6';
  matchingScoreStrokeDasharray: string = '0 25.12';
  defaultProfilePicture: string = "https://storage.googleapis.com/cv-storage-sample1/placeholder_images/profile-placeholder.jpg";
  isMobile: boolean = window.innerWidth < 767;
  isProcessing: boolean = false;
  isApplied: boolean = false;
  successMessage: string | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private jobService: JobsService,
    private sanitizer: DomSanitizer,
    private route: ActivatedRoute,
    private authService: AuthService
  ) {
    window.addEventListener('resize', () => {
      this.isMobile = window.innerWidth < 767;
      this.updateProgressBar(this.matchingScore, this.progress);
    });
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const jobIdFromUrl = params['jobId'] ? +params['jobId'] : null;
      if (jobIdFromUrl) {
        this.jobId = jobIdFromUrl;
        this.fetchJobDetails();
      }
    });
    this.progress = 100.0;
    this.loadUserProfile();
  }

  ngAfterViewInit() {
    if (this.matchingScore > 0) {
      setTimeout(() => {
        this.animateProgressBar();
      }, 0);
    } else {
      this.fetchJobDetails();
    }
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
    try {
      const profileData = localStorage.getItem('userProfile');
      if (profileData) {
        this.userProfile = JSON.parse(profileData);
        console.log('User profile data from local storage:', this.userProfile);
        if (!this.userProfile.profile_picture_url) {
          console.warn('No profile picture URL found in local storage, using default.');
        }
      } else {
        console.warn('No user profile data found in local storage, using default profile picture.');
        this.userProfile = { profile_picture_url: null };
      }
    } catch (error) {
      console.error('Error parsing user profile data from local storage:', error);
      this.userProfile = { profile_picture_url: null };
    }
  }

  private fetchJobDetails(): void {
    this.loading = true;
    this.errorMessage = null;
    this.successMessage = null; // Reset success message when fetching new job
    this.isApplied = false; // Reset applied status for new job
    this.jobService.getJobById(this.jobId!).subscribe({
      next: (data) => {
        console.log('Job details response:', data);
        this.job = {
          job_id: data.job_id || null,
          company_name: data.company_name || '',
          logo: data.logo || '',
          title: data.title || '',
          location: data.location || '',
          job_type: data.job_type || '',
          created_at: data.created_at || '',
          description: data.description || '',
          requirements: data.requirements || '',
          salary: data.salary || null,
          url: data.url || null,
          source: data.source || '',
          tag: data.tag || '',
          contract_time: data.contract_time || '',
          contract_type: data.contract_type || '',
          external_id: data.external_id || '',
          last_updated: data.last_updated || ''
        };
        this.matchingScore = data.matching_score || 80;
        this.updateProgressBar(this.matchingScore, this.progress);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching job details:', err);
        this.resetJob();
        this.errorMessage = err.message || `Job with ID ${this.jobId} not found. Please select another job.`;
        this.loading = false;
      }
    });
  }

  private resetJob(): void {
    this.job = {
      job_id: null,
      company_name: '',
      logo: '',
      title: '',
      location: '',
      job_type: '',
      created_at: '',
      description: '',
      requirements: '',
      salary: null,
      url: null,
      source: '',
      tag: '',
      contract_time: '',
      contract_type: '',
      external_id: '',
      last_updated: ''
    };
    this.matchingScore = 0;
    this.progress = 0;
  }

  applyForJob(): void {
    if (this.isApplied || !this.job.job_id) {
      return;
    }
    this.isProcessing = true;

    this.authService.applyForJob(this.job.job_id)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (response) => {
          console.log('Yay! Application worked:', response);
          this.isApplied = true;
          this.isProcessing = false;

          setTimeout(() => {
            this.jobService.removeJobFromCache(this.job.job_id);
            this.job = null;
            this.successMessage = 'You have successfully applied for this job!';
          }, 2000);
        },
        (error) => {
          console.error('Oops! Something went wrong:', error);
          this.isProcessing = false;
          alert(error.error?.error || 'Failed to apply for this job');
        }
      );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  handleImageError(event: Event): void {
    console.error('Profile image failed to load:', this.userProfile.profile_picture_url);
    this.userProfile.profile_picture_url = this.defaultProfilePicture;
    (event.target as HTMLImageElement).src = this.defaultProfilePicture;
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
      const currentTime = Date.now();
      const elapsedTime = currentTime - startTime;
      const progress = Math.min(elapsedTime / duration, 1);
      const currentMatchingScore = progress * this.matchingScore;
      const currentCompanyProgress = progress * this.progress;
      this.updateProgressBar(currentMatchingScore, currentCompanyProgress);
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.updateProgressBar(this.matchingScore, this.progress);
      }
    };
    requestAnimationFrame(animate);
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

    this.progress = actualProgress;
    this.matchingScore = actualMatchingScore;
  }
}