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
  public isLoading: boolean = false;
  
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

  ngOnInit() {
  this.route.queryParams.subscribe(params => {
    if (params['data']) {
      try {
        this.assessmentData = JSON.parse(params['data']);

        // Extract and assign assessment_id to assessmentId variable
        if (this.assessmentData && this.assessmentData.assessment_id) {
          this.assessmentId = this.assessmentData.assessment_id;
        }

      } catch (e) {
        console.error('Error parsing assessment data', e);
        this.router.navigate(['/candidate-assessment']);
      }
    } else {
      console.error('Rules Card: No assessment data was found. Redirecting.');
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
      alert('Assessment data is not available. Cannot start.');
      return;
    }

    this.isLoading = true;

    try {
      // Step 1: Check if video recording is required based on the assessment rules.
      if (this.assessmentData.video_recording?.toUpperCase() === 'YES') {
        
        console.log("Video recording is required. Checking for camera/mic permissions...");
        const hasPermission = await this.videoRecorderService.checkCameraAndMicrophone();

        // Step 2: If permissions are required but were denied, execute the ORIGINAL redirect.
        if (!hasPermission) {
          // --- THIS BLOCK IS NOW RESTORED TO THE ORIGINAL BEHAVIOR ---
          console.warn(`Camera or microphone not accessible for assessment ${this.assessmentId}. Redirecting to error page.`);
          this.isLoading = false; // Stop the spinner before redirecting
          this.router.navigate(['/error-system-requirement-failed'], { queryParams: { id: this.assessmentId } });
          return; // Stop the function from proceeding further.
          // -------------------------------------------------------------
        }

      } else {
        // If video is not required, we simply log it and continue.
        console.log("Video recording is not required. Skipping permission check.");
      }

      // Step 3: If we reach this point, all checks have passed. Proceed to the assessment.
      console.log(`All checks passed for assessment ${this.assessmentId}. Navigating to test.`);
      this.router.navigate(['/flashyre-assessment11'], { queryParams: { id: this.assessmentId } });

    } catch (error) {
      console.error('An unexpected error occurred during pre-assessment checks:', error);
      this.isLoading = false;
      this.router.navigate(['/error-system-requirement-failed'], { queryParams: { id: this.assessmentId } });
    }
  }

 

  get showProctoredRule(): boolean {
    return this.assessmentData?.proctored?.toUpperCase() === 'YES';
  }

  get showVideoRecordingRule(): boolean {
    return this.assessmentData?.video_recording?.toUpperCase() === 'YES';
  }

  get proctoredRuleNumber(): number {
    // If video recording rule is shown before, proctored is #2 else #1
    return this.showVideoRecordingRule ? 1 : 2;
  }

  get videoRecordingRuleNumber(): number {
    // If proctored rule shown before, video recording is #2 else #1
    return this.showProctoredRule ? 2 : 1;
  }
}