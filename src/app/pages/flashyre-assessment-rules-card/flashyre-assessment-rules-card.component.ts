import { Component, OnInit } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { Router, ActivatedRoute } from '@angular/router';
import { TrialAssessmentService } from '../../services/trial-assessment.service';
import { VideoRecorderService } from '../../services/video-recorder.service';
import { ProctoringService } from '../../services/proctoring.service';

@Component({
  selector: 'flashyre-assessment-rules-card',
  templateUrl: 'flashyre-assessment-rules-card.component.html',
  styleUrls: ['flashyre-assessment-rules-card.component.css'],
})
export class FlashyreAssessmentRulesCard implements OnInit {
  // Properties to hold assessment data
  public assessmentId: number | null = null;
  public assessmentData: any = null;
  public attemptsAllowed: number = 0;
  public attemptsRemaining: number = 0;
  public assessmentTitle: string = '';
  public totalAssessmentDuration: number = 0;
  public isLoading: boolean = true;

  constructor(
    private title: Title,
    private meta: Meta,
    private router: Router,
    private route: ActivatedRoute,
    private trialAssessmentService: TrialAssessmentService,
    private videoRecorderService: VideoRecorderService,
    private proctoringService: ProctoringService
  ) {
    this.title.setTitle('Flashyre-Assessment-Rules-Card - Flashyre');
    this.meta.addTags([
      {
        property: 'og:title',
        content: 'Flashyre-Assessment-Rules-Card - Flashyre',
      },
      {
        property: 'og:image',
        content:
          'https://aheioqhobo.cloudimg.io/v7/_playground-bucket-v2.teleporthq.io_/8203932d-6f2d-4493-a7b2-7000ee521aa2/9aea8e9c-27ce-4011-a345-94a92ae2dbf8?org_if_sml=1&force_format=original',
      },
    ]);
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.assessmentId = +id;
        this.fetchAssessmentData(this.assessmentId);
      } else {
        console.error('Rules Card: No assessment ID was found. Redirecting.');
        this.router.navigate(['/candidate-assessment']);
      }
    });
  }

  fetchAssessmentData(assessmentId: number): void {
    this.isLoading = true;
    this.trialAssessmentService.getAssessmentDetails(assessmentId).subscribe({
      next: (data) => {
        console.log('Assessment data fetched:', data);
        const { attempts_allowed, attempts_remaining } = data;
        const hasFiniteAttempts = typeof attempts_allowed === 'number' && attempts_allowed > 0;

        if (hasFiniteAttempts && attempts_remaining < 1) {
          console.warn(`User has no attempts left for assessment ${assessmentId}. Redirecting.`);
          this.router.navigate(['/assessment-taken-page']);
          return;
        }

        this.assessmentData = data;
        this.attemptsAllowed = data.attempts_allowed;
        this.attemptsRemaining = data.attempts_remaining;
        this.assessmentTitle = data.assessment_title;
        this.totalAssessmentDuration = data.total_assessment_duration;
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        console.error(`Rules Card: Failed to fetch assessment data for ID: ${assessmentId}.`, error);
        alert('Failed to load assessment details. Please try again later.');
        this.router.navigate(['/candidate-assessment']);
      }
    });
  }

  /**
   * Starts the assessment after checking camera and microphone access.
   * Redirects to error page if camera/microphone is not accessible.
   */
  async startAssessment(): Promise<void> {
    if (!this.assessmentData || !this.assessmentId) {
      console.error('Error: "Start Assessment" was clicked before assessment data was loaded.');
      alert('Assessment ID is missing!');
      return;
    }

    this.isLoading = true;

    try {
      // Check camera and microphone access
      const hasCameraAndMic = await this.videoRecorderService.checkCameraAndMicrophone();
     
      if (hasCameraAndMic) {
        // Camera and microphone are accessible, proceed to assessment
        console.log(`Camera and microphone accessible for assessment ${this.assessmentId}. Navigating to test.`);
        this.router.navigate(['/flashyre-assessment11'], { queryParams: { id: this.assessmentId } });
      } else {
        // Camera or microphone not accessible, redirect to error page with assessmentId
        console.warn(`Camera or microphone not accessible for assessment ${this.assessmentId}. Redirecting to error page.`);
        this.router.navigate(['/error-system-requirement-failed'], { queryParams: { id: this.assessmentId } });
      }
    } catch (error) {
      console.error('Error checking camera and microphone:', error);
      // Redirect to error page with assessmentId if there's an issue
      this.router.navigate(['/error-system-requirement-failed'], { queryParams: { id: this.assessmentId } });
    }

    this.isLoading = false;
  }
}