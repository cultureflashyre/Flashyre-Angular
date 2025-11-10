import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { Router, ActivatedRoute } from '@angular/router';
import { TrialAssessmentService } from '../../services/trial-assessment.service';
import { VideoRecorderService } from '../../services/video-recorder.service';
// ProctoringService is imported but not used, which is fine.
import { ProctoringService } from '../../services/proctoring.service';

@Component({
  selector: 'flashyre-assessment-rules-card',
  templateUrl: 'flashyre-assessment-rules-card.component.html',
  styleUrls: ['flashyre-assessment-rules-card.component.css'],
})
export class FlashyreAssessmentRulesCard implements OnInit {
  // Assessment data properties
  public assessmentId: number | null = null;
  public assessmentData: any = null;
  public isLoading: boolean = false;
  
  // State management for system check and UI
  public rulesUnderstood: boolean = false;
  public systemRequirementsMet: boolean = false;
  public showSystemCheckOverlay: boolean = false;
  public isCheckingRequirements: boolean = false;

  constructor(
    private title: Title,
    private meta: Meta,
    private router: Router,
    private route: ActivatedRoute,
    private trialAssessmentService: TrialAssessmentService,
    private videoRecorderService: VideoRecorderService,

    private cdr: ChangeDetectorRef
  ) {
    // --- DEBUG: Log component initialization ---
    console.log('[RulesCard] Component constructor called.');
    this.title.setTitle('Assessment Rules - Flashyre');
    this.meta.addTags([
      { property: 'og:title', content: 'Assessment Rules - Flashy' },
    ]);
  }

  // --- DEBUG: Log checkbox state changes ---
  // --- DEBUG: Log checkbox state changes ---
  onCheckboxChange(event: any): void {
    // Get the checked status directly from the event target
    const isChecked = event.target.checked;
    
    // Update the component's property
    this.rulesUnderstood = isChecked;
    
    console.log('[RulesCard] onCheckboxChange triggered. New value of rulesUnderstood:', this.rulesUnderstood);
  }

  onLabelClick(): void {
  console.log('%c[RulesCard] Parent <label> was clicked!', 'color: blue; font-weight: bold;');
}

onInputClick(event: Event): void {
  console.log('%c[RulesCard] The <input> element itself was clicked!', 'color: green; font-weight: bold;');
  // We stop the event from bubbling up to the label to avoid firing both events
  event.stopPropagation(); 
}

  ngOnInit() {
    // --- DEBUG: Log lifecycle hook start ---
    console.log('[RulesCard] ngOnInit lifecycle hook initiated.');
    this.route.queryParams.subscribe(params => {
      // --- DEBUG: Log received URL parameters ---
      console.log('[RulesCard] Query params received:', params);
      
      if (params['data']) {
        console.log("[RulesCard] 'data' parameter found. Attempting to parse...");
        try {
          this.assessmentData = JSON.parse(params['data']);
          // --- DEBUG: Log the parsed data ---
          console.log('[RulesCard] Successfully parsed assessmentData:', this.assessmentData);
          
          if (this.assessmentData?.assessment_id) {
            this.assessmentId = this.assessmentData.assessment_id;
            console.log('[RulesCard] Assessment ID set to:', this.assessmentId);
          }

          // Check if video recording is required and set initial state
          if (this.assessmentData?.video_recording?.toUpperCase() !== 'YES') {
            console.log('[RulesCard] Video recording is NOT required. Setting systemRequirementsMet to true by default.');
            this.systemRequirementsMet = true;
          } else {
            console.log('[RulesCard] Video recording IS required. systemRequirementsMet remains false.');
          }
        } catch (e) {
          console.error('[RulesCard] Critical error parsing assessment data from query params.', e);
          this.router.navigate(['/candidate-assessment']);
        }
      } else {
        const id = params['id'];
        console.warn("[RulesCard] 'data' parameter not found. Checking for 'id' parameter...");
        if (id) {
            console.log(`[RulesCard] Found 'id' parameter: ${id}. Fetching assessment data...`);
            this.fetchAssessmentData(+id);
        } else {
            console.error('[RulesCard] No "data" or "id" parameter found. Cannot proceed. Redirecting.');
            this.router.navigate(['/candidate-assessment']);
        }
      }

      this.cdr.detectChanges();
    });
  }

  fetchAssessmentData(assessmentId: number): void {
    console.log(`[RulesCard] fetchAssessmentData called for ID: ${assessmentId}`);
    this.isLoading = true;
    this.trialAssessmentService.getAssessmentDetails(assessmentId).subscribe({
      next: (data) => {
        console.log('[RulesCard] Successfully fetched assessment data from service:', data);
        if (data?.attempts_allowed > 0 && data?.attempts_remaining < 1) {
          console.warn(`[RulesCard] User has no attempts left for assessment ${assessmentId}. Redirecting.`);
          this.router.navigate(['/assessment-taken-page']);
          return;
        }
        this.assessmentData = data;
        this.assessmentId = data.assessment_id;
        this.isLoading = false;
        console.log('[RulesCard] Component data updated after fetch.', { assessmentData: this.assessmentData, assessmentId: this.assessmentId });
      },
      error: (error) => {
        this.isLoading = false;
        console.error(`[RulesCard] Failed to fetch assessment data for ID: ${assessmentId}.`, error);
        alert('Failed to load assessment details. Please try again later.');
        this.router.navigate(['/candidate-assessment']);
      }
    });
  }

  async checkSystemRequirements(): Promise<void> {
    console.log('[RulesCard] checkSystemRequirements function triggered.');
    console.log('[RulesCard] Current State:', { rulesUnderstood: this.rulesUnderstood, systemRequirementsMet: this.systemRequirementsMet });

    this.isCheckingRequirements = true;
    this.systemRequirementsMet = false; // Always reset status on a new check
    console.log('[RulesCard] State updated: isCheckingRequirements = true, systemRequirementsMet = false');
    
    try {
      console.log('[RulesCard] Calling videoRecorderService.checkCameraAndMicrophone()...');
      const hasPermission = await this.videoRecorderService.checkCameraAndMicrophone();
      console.log(`[RulesCard] Permission check returned: ${hasPermission}`);

      if (hasPermission) {
        this.systemRequirementsMet = true;
        this.showSystemCheckOverlay = false;
        console.log('[RulesCard] SUCCESS: Permissions granted. State updated:', { systemRequirementsMet: this.systemRequirementsMet, showSystemCheckOverlay: this.showSystemCheckOverlay });
      } else {
        this.showSystemCheckOverlay = true;
        console.warn('[RulesCard] FAILURE: Permissions denied. Displaying overlay. State updated:', { showSystemCheckOverlay: this.showSystemCheckOverlay });
      }
    } catch (error) {
      console.error('[RulesCard] An error occurred during system check:', error);
      this.showSystemCheckOverlay = true;
    } finally {
      this.isCheckingRequirements = false;
      console.log('[RulesCard] State updated: isCheckingRequirements = false');

      this.cdr.detectChanges();
    }
  }

  async retrySystemCheck(): Promise<void> {
    console.log('[RulesCard] retrySystemCheck triggered from overlay.');
    this.showSystemCheckOverlay = false;
    await this.checkSystemRequirements(); // Re-run the main check function
  }

  closeOverlay(): void {
    console.log('[RulesCard] closeOverlay triggered from overlay.');
    this.showSystemCheckOverlay = false;
  }

  startAssessment(): void {
    console.log('[RulesCard] startAssessment function triggered.');
    // --- DEBUG: Log the state of the guards right before the check ---
    console.log('[RulesCard] Evaluating start conditions:', {
      assessmentId: this.assessmentId,
      systemRequirementsMet: this.systemRequirementsMet,
      rulesUnderstood: this.rulesUnderstood
    });

    if (!this.assessmentId) {
      console.error('[RulesCard] Start aborted: assessmentId is not available.');
      alert('Assessment data is not available. Cannot start.');
      return;
    }
    if (!this.systemRequirementsMet || !this.rulesUnderstood) {
      console.error('[RulesCard] Start aborted: Pre-requisites not met.');
      alert('Please accept the rules and ensure system requirements are met before starting.');
      return;
    }
    
    console.log(`[RulesCard] All checks passed! Navigating to assessment with ID: ${this.assessmentId}.`);
    this.router.navigate(['/flashyre-assessment11'], { queryParams: { id: this.assessmentId } });
  }

  // --- Getters for template display (no logging needed here) ---
  get showProctoredRule(): boolean {
    return this.assessmentData?.proctored?.toUpperCase() === 'YES';
  }

  get showVideoRecordingRule(): boolean {
    return this.assessmentData?.video_recording?.toUpperCase() === 'YES';
  }

  get sections() {
    return this.assessmentData?.sections || [];
  }
}