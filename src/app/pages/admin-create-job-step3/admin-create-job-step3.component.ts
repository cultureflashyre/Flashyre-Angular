// src/app/pages/admin-create-job-step3/admin-create-job-step3.component.ts
import { Component, Input, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, Renderer2, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AdminJobDescriptionService } from '../../services/admin-job-description.service';
import { CorporateAuthService } from '../../services/corporate-auth.service';
import { AdminJobCreationWorkflowService } from '../../services/admin-job-creation-workflow.service';
import { MCQItem as IMcqItem } from '../admin-create-job-step1/types';
import { NgxSpinnerService } from 'ngx-spinner';

// --- INTERFACES ---

/**
 * Interface to hold the structured parts of a parsed question
 */
interface ParsedDetails {
  question: string;
  options: string[];
  correctAnswer: string; // 'a', 'b', 'c', or 'd'
  difficulty: string;    // e.g., 'Easy', 'Medium', 'Hard'
}

/**
 * The main interface for a question used within this component
 */
interface McqQuestion extends IMcqItem {
  isSelected: boolean;
  isAiGenerated: boolean;
  parsed: ParsedDetails; // Holds the structured question data for display
}

/**
 * The main interface for a section/skill tab
 */
interface SkillSection {
  skillName: string;
  questions: McqQuestion[];
  totalCount: number;
  selectedCount: number;
  isAllSelected: boolean;
}

@Component({
  selector: 'admin-create-job-step3',
  templateUrl: 'admin-create-job-step3.component.html',
  styleUrls: ['admin-create-job-step3.component.css'],
})
export class AdminCreateJobStep3 implements OnInit, OnDestroy, AfterViewInit {
  userProfile: any = {};
  @Input() rootClassName: string = '';
  @ViewChild('difficultySlider') difficultySlider: ElementRef<HTMLInputElement>;
  @ViewChild('skillViewport') skillViewport: ElementRef<HTMLDivElement>;
  @ViewChild('skillTrack') skillTrack: ElementRef<HTMLDivElement>;
  
  private subscriptions = new Subscription();
  private jobUniqueId: string;
  private currentAssessmentId: string | null = null;
  
  assessmentForm: FormGroup;
  
  // AI Generated Questions State
  skillSections: SkillSection[] = [];
  activeSectionIndex = 0;
  
  // --- Uploaded Questions State ---
  uploadedSkillSections: SkillSection[] = [];
  activeUploadedSectionIndex = 0;
  
  // --- Tab State ---
  activeTab: 'ai-generated' | 'uploaded' = 'ai-generated';

  isLoading: boolean = true;
  isSubmitting: boolean = false;
  
  showPopup: boolean = false;
  popupMessage: string = '';
  popupType: 'success' | 'error' = 'success';
  
  currentScrollIndex = 0;
  maxScrollIndex = 0;

  showAlert = false;
  alertMessage = '';
  alertButtons: string[] = [];
  private actionContext: { action: string } | null = null;

  /**
   * Constructor for dependency injection
   * @param fb FormBuilder for creating reactive forms
   * @param router Router for navigation
   * @param authService CorporateAuthService for handling authentication
   * @param jobService AdminJobDescriptionService for job-related API calls
   * @param workflowService AdminJobCreationWorkflowService for managing workflow state
   * @param renderer Renderer2 for safe DOM manipulation
   * @param spinner NgxSpinnerService for loading indicators
   */
  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: CorporateAuthService,
    private jobService: AdminJobDescriptionService,
    private workflowService: AdminJobCreationWorkflowService,
    private renderer: Renderer2,
    private spinner: NgxSpinnerService
  ) {}

  /**
   * HostListener to recalculate the carousel state on window resize for responsiveness 
   */
  @HostListener('window:resize')
  onResize(): void {
    setTimeout(() => {
        this.calculateCarouselState();
        this.updateScrollPosition();
    }, 100);
  }

  /**
   * Lifecycle hook called when the component is initialized 
   * Initializes the form and fetches data based on whether an existing assessment is being edited.
   */
  ngOnInit(): void {
    this.spinner.show('main-spinner');
    this.initializeForm();
    this.jobUniqueId = this.workflowService.getCurrentJobId();
    this.currentAssessmentId = this.workflowService.getCurrentAssessmentId();

    if (!this.jobUniqueId) {
      this.showErrorPopup('Error: Job context is missing. Please go back to Step 1.');
      this.isLoading = false;
      this.spinner.hide('main-spinner');
      this.router.navigate(['/admin-create-job-step1']);
      return;
    }

    // Check for existing assessment and load uploaded questions
    this.checkAndLoadAssessment();
    this.fetchUploadedMcqList();
  }
  
  /**
   * Lifecycle hook called after the component's view has been fully initialized 
   * Used to set initial states for UI elements that depend on the view being rendered.
   */
  ngAfterViewInit(): void {
    setTimeout(() => {
      this.updateSliderFill();
      this.calculateCarouselState();
    }, 0);
  }
  
  /**
   * Checks if an assessment exists for the job and loads it, otherwise fetches new MCQs
   */
  private checkAndLoadAssessment(): void {
    const token = this.authService.getJWTToken();
    if (!token) {
      this.showErrorPopup('Authentication error.');
      this.isLoading = false;
      this.spinner.hide('main-spinner');
      return;
    }

    // First, check if there's already an assessment for this job
    this.subscriptions.add(
      this.jobService.getLatestAssessmentForJob(this.jobUniqueId, token).subscribe({
        next: (assessmentData) => {
          if (assessmentData && assessmentData.assessment_uuid) {
            // Assessment exists - load it
            this.currentAssessmentId = assessmentData.assessment_uuid;
            this.workflowService.setCurrentAssessmentId(this.currentAssessmentId);
            this.loadExistingAssessment(this.currentAssessmentId);
          } else {
            // No assessment exists - fetch fresh MCQs
            this.fetchNewMcqList();
          }
        },
        error: (err) => {
          // If there's an error checking, proceed with fresh MCQs
          this.fetchNewMcqList();
          console.error(`Failed to check for latest assessment: ${err.message}`);
        }
      })
    );
  }

  /**
   * Fetches the list of uploaded questions for the current job
   */
  private fetchUploadedMcqList(): void {
    const token = this.authService.getJWTToken();
    if (!token || !this.jobUniqueId) return;

    this.subscriptions.add(
      this.jobService.getUploadedQuestions(this.jobUniqueId, token).subscribe({
        next: (response) => {
          this.uploadedSkillSections = Object.keys(response).map(skillName => ({
            skillName,
            questions: this.processMcqItems(response[skillName].mcq_items),
            totalCount: response[skillName].mcq_items.length,
            selectedCount: 0,
            isAllSelected: false,
          }));
          this.preselectUploadedQuestions();
        },
        error: (err) => {
          console.error(`Failed to load uploaded questions: ${err.message}`);
          // Don't show error popup for uploaded questions as they're optional
        }
      })
    );
  }
  
  /**
   * Pre-selects uploaded questions that were previously selected in the assessment
   */
  private preselectUploadedQuestions(): void {
    const token = this.authService.getJWTToken();
    if (!this.currentAssessmentId || !token || this.uploadedSkillSections.length === 0) return;
  
    this.subscriptions.add(
      this.jobService.getAssessmentDetails(this.currentAssessmentId, token).subscribe({
        next: (assessmentDetails) => {
          const selectedIds = new Set(
            assessmentDetails.selected_mcqs.map((q: any) => q.mcq_item_details.id)
          );
          
          this.uploadedSkillSections.forEach(section => {
            section.questions.forEach(q => {
              if (selectedIds.has(q.mcq_item_id)) {
                q.isSelected = true;
              }
            });
            this.updateCountsForUploadedSection(section);
          });
          this.updateCounts();
        },
        error: (err) => {
          console.error("Could not pre-select uploaded questions:", err.message);
        }
      })
    );
  }

  // --- Popup Handling Methods ---
  
  /**
   * Shows a success popup message
   * @param message The message to display
   */
  showSuccessPopup(message: string) {
    this.popupMessage = message;
    this.popupType = 'success';
    this.showPopup = true;
    setTimeout(() => this.closePopup(), 3000);
  }

  /**
   * Shows an error popup message
   * @param message The message to display
   */
  showErrorPopup(message: string) {
    this.popupMessage = message;
    this.popupType = 'error';
    this.showPopup = true;
    setTimeout(() => this.closePopup(), 5000);
  }

  /**
   * Closes the popup
   */
  closePopup() {
    this.showPopup = false;
    this.popupMessage = '';
  }

  // --- ALERT HANDLING LOGIC ---

  /**
   * Opens an alert dialog with a message and action buttons
   * @param message The alert message
   * @param buttons Array of button labels
   */
  private openAlert(message: string, buttons: string[]) {
    this.alertMessage = message;
    this.alertButtons = buttons;
    this.showAlert = true;
  }

  /**
   * Handles alert button clicks
   * @param action The action performed (button label)
   */
  onAlertButtonClicked(action: string) {
    this.showAlert = false;

    // If the user clicked "Cancel" or "No", stop here
    if (action.toLowerCase() === 'cancel' || action.toLowerCase() === 'no') {
      this.actionContext = null;
      return;
    }
    
    // If the user confirmed, check which action to perform
    if (this.actionContext) {
      switch (this.actionContext.action) {
        case 'saveDraft':
          this.onSaveDraftConfirmed();
          break;
        case 'skip':
          this.onSkipConfirmed();
          break;
        case 'next':
          this.onNextConfirmed();
          break;
        case 'cancel':
          this.onCancelConfirmed();
          break;
        case 'previous':
          this.onPreviousConfirmed();
          break;
      }
      this.actionContext = null;
    }
  }

  /**
   * Processes raw MCQ items from the API into the internal McqQuestion format.
   * @param mcqItems Array of raw MCQ items from the API.
   * @returns Array of processed McqQuestion objects.
   */
  private processMcqItems(mcqItems: IMcqItem[]): McqQuestion[] {
    return mcqItems.map((item): McqQuestion => ({
        ...item,
        isSelected: false,
        isAiGenerated: true,
        parsed: this.parseQuestionText(item.question_text)
    }));
  }

  /**
   * Parses the raw question text string into structured components (question, options, answer, difficulty).
   * @param rawText The raw text of the question from the API.
   * @returns A ParsedDetails object containing the structured question data.
   */
  private parseQuestionText(rawText: string): ParsedDetails {
    const questionMatch = rawText.match(/^(.*?)(?=\s*a\))/is);
    const optionsRegex = /\b([a-d])\)\s*(.*?)(?=\s*[a-d]\)|Correct Answer:|$)/gis;
    const optionsMatch = [];
    let match;
    while ((match = optionsRegex.exec(rawText)) !== null) {
      optionsMatch.push(match);
    }
    const correctMatch = rawText.match(/Correct Answer:\s*([a-d])/i);
    const difficultyMatch = rawText.match(/\(?(Easy|Medium|Hard)\)?$/i);

    return {
      question: questionMatch ? questionMatch[1].replace(/✨/g, '').trim() : 'Could not parse question',
      options: optionsMatch.map(m => m[2].trim()),
      correctAnswer: correctMatch ? correctMatch[1].toLowerCase() : '',
      difficulty: difficultyMatch ? difficultyMatch[1] : 'Medium'
    };
  }

  /**
   * Initializes the reactive form with default values and validators.
   */
  private initializeForm(): void {
    this.assessmentForm = this.fb.group({
      assessmentName: ['', [Validators.required, Validators.maxLength(50), Validators.pattern('^(?=.*[a-zA-Z])[a-zA-Z0-9 ]*$')]],
      shuffleQuestions: [true],
      isProctored: [true],
      allowPhoneAccess: [true],
      allowVideoRecording: [true],
      difficulty: [0.6],
      timeLimit: ['01:00', [Validators.required, Validators.pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)]],
    });
  }
  
  /**
   * Loads data for an existing assessment.
   * Fetches all MCQs for the job, then fetches the specific assessment details to pre-populate the form and select questions.
   * @param assessmentId The ID of the assessment to load.
   */
  private loadExistingAssessment(assessmentId: string): void {
    const token = this.authService.getJWTToken();
    if (!token) {
        this.showErrorPopup('Authentication error.');
        this.isLoading = false;
        this.spinner.hide('main-spinner');
        return;
    }
    
    // First fetch all available MCQs for the job
    this.subscriptions.add(
      this.jobService.job_post_mcqs_list_api(this.jobUniqueId, token).subscribe({
        next: (mcqResponse) => {
            const skillData = mcqResponse.data;
            this.skillSections = Object.keys(skillData).map(skillName => ({
                skillName,
                questions: this.processMcqItems(skillData[skillName].mcq_items),
                totalCount: skillData[skillName].mcq_items.length,
                selectedCount: 0,
                isAllSelected: false,
            }));

            // Then fetch the assessment details to populate form and selections
            this.subscriptions.add(
              this.jobService.getAssessmentDetails(assessmentId, token).subscribe({
                next: (assessmentDetails) => {
                    // Populate form fields
                    this.assessmentForm.patchValue({
                        assessmentName: assessmentDetails.name,
                        shuffleQuestions: assessmentDetails.shuffle_questions_overall,
                        isProctored: assessmentDetails.is_proctored,
                        allowPhoneAccess: assessmentDetails.allow_phone_access,
                        allowVideoRecording: assessmentDetails.has_video_recording,
                        difficulty: assessmentDetails.difficulty,
                        timeLimit: this.minutesToHHMM(assessmentDetails.time_limit),
                    });
                    
                    // Mark previously selected questions
                    const selectedIds = new Set(
                      assessmentDetails.selected_mcqs.map((q: any) => q.mcq_item_details.id)
                    );
                    
                    this.skillSections.forEach(section => {
                        section.questions.forEach(q => {
                            if (selectedIds.has(q.mcq_item_id)) {
                                q.isSelected = true;
                            }
                        });
                        this.updateCountsForSection(section);
                    });
                    
                    this.isLoading = false;
                    this.spinner.hide('main-spinner');
                    setTimeout(() => this.calculateCarouselState(), 0);
                },
                error: (err) => {
                    this.showErrorPopup(`Failed to load assessment details: ${err.message}`);
                    this.isLoading = false;
                    this.spinner.hide('main-spinner');
                }
              })
            );
        },
        error: (err) => {
            this.showErrorPopup(`Failed to load questions: ${err.message}`);
            this.isLoading = false;
            this.spinner.hide('main-spinner');
        }
      })
    );
  }
  
  /**
   * Fetches the initial list of MCQs for the job post when creating a new assessment.
   */
  private fetchNewMcqList(): void {
    const token = this.authService.getJWTToken();
    if (!token) {
        this.showErrorPopup('Authentication error.');
        this.isLoading = false;
        this.spinner.hide('main-spinner');
        return;
    }

    this.subscriptions.add(
      this.jobService.job_post_mcqs_list_api(this.jobUniqueId, token).subscribe({
        next: (response) => {
          const skillData = response.data;
          this.skillSections = Object.keys(skillData).map(skillName => ({
            skillName,
            questions: this.processMcqItems(skillData[skillName].mcq_items),
            totalCount: skillData[skillName].mcq_items.length,
            selectedCount: 0,
            isAllSelected: false,
          }));
          this.isLoading = false;
          this.spinner.hide('main-spinner');
          setTimeout(() => this.calculateCarouselState(), 0);
        },
        error: (err) => {
          this.showErrorPopup(`Failed to load questions: ${err.message}`);
          this.isLoading = false;
          this.spinner.hide('main-spinner');
        }
      })
    );
  }

  /**
   * Calculates the state of the skill tab carousel (number of visible items, max scroll index).
   * Should be called after view init and on window resize.
   */
  private calculateCarouselState(): void {
    if (!this.skillViewport || !this.skillTrack || this.skillSections.length === 0) {
      this.maxScrollIndex = 0;
      return;
    }
    const trackWidth = this.skillTrack.nativeElement.scrollWidth;
    const viewportWidth = this.skillViewport.nativeElement.offsetWidth;
    
    if (trackWidth <= viewportWidth) {
      this.maxScrollIndex = 0;
    } else {
      this.maxScrollIndex = this.skillSections.length - 1;
    }

    if (this.currentScrollIndex > this.maxScrollIndex) {
        this.currentScrollIndex = this.maxScrollIndex;
    }
  }

  /**
   * Updates the horizontal scroll position of the skill tab carousel track.
   */
  private updateScrollPosition(): void {
    if (this.skillTrack && this.skillTrack.nativeElement && this.skillTrack.nativeElement.children.length > this.currentScrollIndex) {
      const targetItem = this.skillTrack.nativeElement.children[this.currentScrollIndex] as HTMLElement;
      if (targetItem) {
        const track = this.skillTrack.nativeElement;
        const viewport = this.skillViewport.nativeElement;
        const maxScroll = track.scrollWidth - viewport.offsetWidth;
        let newX = targetItem.offsetLeft;

        if (newX > maxScroll) {
            newX = maxScroll;
        }

        this.renderer.setStyle(track, 'transform', `translateX(-${newX}px)`);
      }
    }
  }

  /**
   * Navigates the skill tab carousel left or right.
   * @param direction 'prev' or 'next'
   */
  navigateCarousel(direction: 'prev' | 'next'): void {
    const newIndex = direction === 'next' ? this.currentScrollIndex + 1 : this.currentScrollIndex - 1;
    if (newIndex >= 0 && newIndex < this.skillSections.length) {
        this.currentScrollIndex = newIndex;
        this.updateScrollPosition();
    }
  }

  /**
   * Handles changes to the difficulty slider input.
   * Updates the form control value and the visual fill of the slider.
   * @param event The input change event.
   */
  onDifficultyChange(event: Event): void {
    const value = (event.target as HTMLInputElement).valueAsNumber;
    this.assessmentForm.get('difficulty')?.setValue(value / 100);
    this.updateSliderFill();
  }

  /**
   * Updates the visual fill percentage of the custom difficulty slider using CSS variables.
   */
  private updateSliderFill(): void {
    if (this.difficultySlider && this.difficultySlider.nativeElement) {
      const slider = this.difficultySlider.nativeElement;
      const value = slider.valueAsNumber;
      slider.style.setProperty('--fill-percentage', `${value}%`);
    }
  }

  /**
   * Getter for the current difficulty percentage (0-100) for display purposes.
   * @returns The difficulty percentage.
   */
  get difficultyPercentage(): number {
    return (this.assessmentForm.get('difficulty')?.value || 0) * 100;
  }
  
  // --- GETTERS FOR COUNTS ---
  
  /**
   * Getter for the total number of selected questions across all sections (AI + Uploaded).
   * @returns The total selected count.
   */
  get totalSelectedCount(): number {
    const aiSelected = this.skillSections.reduce((acc, section) => acc + section.selectedCount, 0);
    const uploadedSelected = this.uploadedSkillSections.reduce((acc, section) => acc + section.selectedCount, 0);
    return aiSelected + uploadedSelected;
  }

  /**
   * Getter for the total number of questions across all sections (AI + Uploaded).
   * @returns The total question count.
   */
  get totalQuestionCount(): number {
    return this.totalAiQuestionCount + this.totalUploadedQuestionCount;
  }

  /**
   * Getter for the total number of AI-generated questions.
   * @returns The total AI question count.
   */
  get totalAiQuestionCount(): number {
    return this.skillSections.reduce((acc, section) => acc + section.totalCount, 0);
  }

  /**
   * Getter for the total number of uploaded questions.
   * @returns The total uploaded question count.
   */
  get totalUploadedQuestionCount(): number {
    return this.uploadedSkillSections.reduce((acc, section) => acc + section.totalCount, 0);
  }

  // --- SELECTION LOGIC for AI Tab ---

  /**
   * Toggles selection of all questions within the currently active AI skill section.
   * @param event The checkbox change event.
   */
  toggleSelectAllForSection(event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    const activeSection = this.skillSections[this.activeSectionIndex];
    if (activeSection) {
      activeSection.isAllSelected = isChecked;
      activeSection.questions.forEach(q => q.isSelected = isChecked);
      this.updateCounts();
    }
  }

  /**
   * Handles individual AI question selection changes.
   * Updates the 'isAllSelected' state of the active section.
   */
  onQuestionSelectionChange(): void {
    const activeSection = this.skillSections[this.activeSectionIndex];
    if (activeSection) {
      activeSection.isAllSelected = activeSection.questions.length > 0 && activeSection.questions.every(q => q.isSelected);
      this.updateCounts();
    }
  }

  /**
   * Updates the selected count for a specific AI section.
   * @param section The SkillSection to update.
   */
  private updateCountsForSection(section: SkillSection): void {
    section.selectedCount = section.questions.filter(q => q.isSelected).length;
  }

  /**
   * Sets the active AI skill section index, changing the displayed questions.
   * @param index The index of the section to activate.
   */
  selectSection(index: number): void {
    this.activeSectionIndex = index;
  }

  // --- SELECTION LOGIC for Uploaded Tab ---

  /**
   * Sets the active uploaded skill section index.
   * @param index The index of the uploaded section to activate.
   */
  selectUploadedSection(index: number): void {
    this.activeUploadedSectionIndex = index;
  }

  /**
   * Toggles selection of all questions within the currently active uploaded skill section.
   * @param event The checkbox change event.
   */
  toggleSelectAllForUploadedSection(event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    const activeSection = this.uploadedSkillSections[this.activeUploadedSectionIndex];
    if (activeSection) {
      activeSection.isAllSelected = isChecked;
      activeSection.questions.forEach(q => q.isSelected = isChecked);
      this.updateCounts();
    }
  }

  /**
   * Handles individual uploaded question selection changes.
   * Updates the 'isAllSelected' state of the active uploaded section.
   */
  onUploadedQuestionSelectionChange(): void {
    const activeSection = this.uploadedSkillSections[this.activeUploadedSectionIndex];
    if (activeSection) {
      activeSection.isAllSelected = activeSection.questions.length > 0 && activeSection.questions.every(q => q.isSelected);
      this.updateCounts();
    }
  }

  /**
   * Updates the selected count for a specific uploaded section.
   * @param section The SkillSection to update.
   */
  private updateCountsForUploadedSection(section: SkillSection): void {
    section.selectedCount = section.questions.filter(q => q.isSelected).length;
  }

  // --- COMBINED UPDATE COUNTS ---

  /**
   * Updates the selected counts for all skill sections (AI and Uploaded).
   */
  private updateCounts(): void {
    this.skillSections.forEach(section => this.updateCountsForSection(section));
    this.uploadedSkillSections.forEach(section => this.updateCountsForUploadedSection(section));
  }

  /**
   * Adds more AI-generated questions for the currently active skill.
   */
  addMoreAiQuestions(): void {
    if (this.isSubmitting) return;
    
    const activeSection = this.skillSections[this.activeSectionIndex];
    if (!activeSection) return;

    this.isSubmitting = true;
    const token = this.authService.getJWTToken();
    if (!token) {
        this.showErrorPopup('Authentication error.');
        this.isSubmitting = false;
        return;
    }

    this.subscriptions.add(
      this.jobService.generateMoreMcqsForSkill(this.jobUniqueId, activeSection.skillName, token).subscribe({
        next: (newMcqs) => {
          const newQuestions = this.processMcqItems(newMcqs);
          activeSection.questions.push(...newQuestions);
          activeSection.totalCount = activeSection.questions.length;
          this.onQuestionSelectionChange();
          setTimeout(() => this.calculateCarouselState(), 0);
          this.showSuccessPopup(`Added ${newMcqs.length} new questions for ${activeSection.skillName}`);
          this.isSubmitting = false;
        },
        error: (err) => {
          this.showErrorPopup(`Failed to generate more questions: ${err.message}`);
          this.isSubmitting = false;
        }
      })
    );
  }
  
  // --- NAVIGATION AND ACTION HANDLERS ---

  /**
   * Handles the Cancel button click - shows confirmation alert
   */
  onCancel(): void {
    this.actionContext = { action: 'cancel' };
    this.openAlert('Are you sure you want to cancel? The current progress will be lost.', ['No', 'Yes, Cancel']);
  }

  /**
   * Handles the Previous button click - shows confirmation alert
   */
  onPrevious(): void {
    this.actionContext = { action: 'previous' };
    this.openAlert('Do you want to go back to the previous step?', ['Cancel', 'Go Back']);
  }

  /**
   * Handles the Save Draft button click - shows confirmation alert
   */
  onSaveDraft(): void {
    this.assessmentForm.markAllAsTouched();
    if (this.totalSelectedCount === 0) {
      this.showErrorPopup('Please select at least one question before saving.');
      return;
    }
    this.actionContext = { action: 'saveDraft' };
    this.openAlert('Do you want to save this as a draft and exit?', ['Cancel', 'Save Draft']);
  }

  /**
   * Handles the Skip button click - shows confirmation alert
   */
  onSkip(): void {
    this.actionContext = { action: 'skip' };
    this.openAlert('Are you sure you want to skip this step?', ['Cancel', 'Skip']);
  }

  /**
   * Handles the Next button click - shows confirmation alert
   */
  onNext(): void {
    this.assessmentForm.markAllAsTouched();
    if (this.assessmentForm.invalid) {
      this.showErrorPopup('Please fill in all required fields correctly.');
      return;
    }
    if (this.totalSelectedCount === 0) {
      this.showErrorPopup('Please select at least one question.');
      return;
    }
    this.actionContext = { action: 'next' };
    this.openAlert('Are you sure you want to save and proceed?', ['Cancel', 'Save & Next']);
  }

  /**
   * Navigates to the previous step in the job creation workflow.
   */
  onPreviousConfirmed(): void {
    this.router.navigate(['/admin-create-job-step2']);
  }

  /**
   * Skips the assessment creation/editing step and navigates to Step 4.
   */
  onSkipConfirmed(): void {
    this.router.navigate(['/admin-create-job-step4']);
  }

  /**
   * Cancels the job creation process and navigates to the dashboard.
   */
  onCancelConfirmed(): void {
    this.workflowService.clearWorkflow();
    this.showSuccessPopup('Job post creation cancelled.');
    setTimeout(() => {
        this.router.navigate(['/admin-page1']);
    }, 2000);
  }

  /**
   * Helper to convert minutes (from API) to HH:MM string format for the time input.
   * @param minutes The time in minutes.
   * @returns The formatted time string (HH:MM).
   */
  private minutesToHHMM(minutes: number): string {
    if (isNaN(minutes) || minutes < 0) return '00:00';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  /**
   * Builds payload for create/update operations.
   * Combines selected questions from both AI-generated and uploaded sections.
   * @returns The payload object for API submission.
   */
  private buildPayload(): any {
    // Get selected AI-generated question IDs
    const selectedAiIds = this.skillSections
      .reduce((acc, s) => acc.concat(s.questions), [] as McqQuestion[])
      .filter(q => q.isSelected)
      .map(q => q.mcq_item_id);
    
    // Get selected uploaded question IDs
    const selectedUploadedIds = this.uploadedSkillSections
      .reduce((acc, s) => acc.concat(s.questions), [] as McqQuestion[])
      .filter(q => q.isSelected)
      .map(q => q.mcq_item_id);
    
    // Combine and deduplicate IDs
    const allSelectedIds = [...new Set([...selectedAiIds, ...selectedUploadedIds])];
    
    // Convert time limit from HH:MM to minutes
    const timeParts = this.assessmentForm.get('timeLimit')?.value.split(':');
    const timeInMinutes = (parseInt(timeParts[0], 10) * 60) + parseInt(timeParts[1], 10);
    
    return {
      job_unique_id: this.jobUniqueId,
      name: this.assessmentForm.get('assessmentName')?.value,
      is_proctored: this.assessmentForm.get('isProctored')?.value,
      has_video_recording: this.assessmentForm.get('allowVideoRecording')?.value,
      allow_phone_access: this.assessmentForm.get('allowPhoneAccess')?.value,
      shuffle_questions_overall: this.assessmentForm.get('shuffleQuestions')?.value,
      selected_mcq_item_ids: allSelectedIds,
      difficulty: this.assessmentForm.get('difficulty')?.value,
      time_limit: timeInMinutes,
    };
  }

  /**
   * Confirmed action for Save Draft button.
   * Saves the assessment (create or update) and navigates to admin-page1.
   */
  onSaveDraftConfirmed(): void {
    if (this.totalSelectedCount === 0) {
      this.showErrorPopup('Please select at least one question before saving.');
      return;
    }

    const token = this.authService.getJWTToken();
    if (!token) {
      this.showErrorPopup('Authentication error.');
      return;
    }

    this.isSubmitting = true;
    this.spinner.show('main-spinner');

    const payload = this.buildPayload();

    // Determine if we're creating or updating
    const saveOperation = this.currentAssessmentId
      ? this.jobService.updateAssessment(this.currentAssessmentId, payload, token)
      : this.jobService.saveAssessment(payload, token);

    this.subscriptions.add(
      saveOperation.subscribe({
        next: (response: any) => {
          this.isSubmitting = false;
          this.spinner.hide('main-spinner');
          
          // Store the assessment UUID if it's a new creation
          if (response && response.assessment_uuid && !this.currentAssessmentId) {
            this.currentAssessmentId = response.assessment_uuid;
            this.workflowService.setCurrentAssessmentId(response.assessment_uuid);
          }
          
          this.showSuccessPopup('Draft saved successfully!');
          
          // Clear workflow and navigate to admin-page1 after 2 seconds
          this.workflowService.clearWorkflow();
          setTimeout(() => {
            this.router.navigate(['/admin-page1']);
          }, 2000);
        },
        error: (err) => {
          this.isSubmitting = false;
          this.spinner.hide('main-spinner');
          this.showErrorPopup(`Save failed: ${err.message}`);
        }
      })
    );
  }

  /**
   * Confirmed action for Next button.
   * Saves the assessment (create or update) and navigates to Step 4.
   */
  onNextConfirmed(): void {
    if (this.assessmentForm.invalid) {
      this.showErrorPopup('Please fill in all required fields correctly.');
      return;
    }
    
    if (this.totalSelectedCount === 0) {
      this.showErrorPopup('Please select at least one question.');
      return;
    }

    const token = this.authService.getJWTToken();
    if (!token) {
      this.showErrorPopup('Authentication error.');
      return;
    }

    this.isSubmitting = true;
    this.spinner.show('main-spinner');
    
    const payload = this.buildPayload();
    
    // Determine if we're creating or updating
    const saveOperation = this.currentAssessmentId
      ? this.jobService.updateAssessment(this.currentAssessmentId, payload, token)
      : this.jobService.saveAssessment(payload, token);
    
    this.subscriptions.add(
      saveOperation.subscribe({
        next: (response: any) => {
          this.isSubmitting = false;
          this.spinner.hide('main-spinner');
          
          // Store the assessment UUID if it's a new creation
          if (response && response.assessment_uuid && !this.currentAssessmentId) {
            this.currentAssessmentId = response.assessment_uuid;
            this.workflowService.setCurrentAssessmentId(response.assessment_uuid);
          }
          
          this.showSuccessPopup('Assessment saved successfully!');
          
          // Navigate to Step 4 after 2 seconds
          setTimeout(() => {
            this.router.navigate(['/admin-create-job-step4']);
          }, 2000);
        },
        error: (err) => {
          this.isSubmitting = false;
          this.spinner.hide('main-spinner');
          this.showErrorPopup(`Save failed: ${err.message}`);
        }
      })
    );
  }

  /**
   * Lifecycle hook called when the component is destroyed.
   * Unsubscribes from all active subscriptions to prevent memory leaks.
   */
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
  
  /**
   * Loads user profile from localStorage.
   */
  loadUserProfile(): void {
    const profileData = localStorage.getItem('userProfile');
    if (profileData) {
      this.userProfile = JSON.parse(profileData);
    }
  }
}