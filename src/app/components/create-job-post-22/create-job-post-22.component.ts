
// src/app/components/create-job-post-22/create-job-post-22.component.ts
import { Component, Input, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, Renderer2, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { McqAssessmentService } from '../../services/mcq-assessment.service';
import { JobDescriptionService } from '../../services/job-description.service';
import { JobCreationWorkflowService } from '../../services/job-creation-workflow.service';
import { CorporateAuthService } from '../../services/corporate-auth.service';
import { MCQItem as IMcqItem } from '../../pages/create-job-post-1st-page/types';

// Interface to hold the structured parts of a parsed question
interface ParsedDetails {
  question: string;
  options: string[];
  correctAnswer: string; // 'a', 'b', 'c', or 'd'
  difficulty: string;    // e.g., 'Easy', 'Medium', 'Hard'
}

// The main interface for a question used within this component
interface McqQuestion extends IMcqItem {
  isSelected: boolean;
  isAiGenerated: boolean;
  parsed: ParsedDetails; // Holds the structured question data for display
}

// The main interface for a section/skill tab
interface SkillSection {
  skillName: string;
  questions: McqQuestion[];
  totalCount: number;
  selectedCount: number;
  isAllSelected: boolean;
}

@Component({
  selector: 'create-job-post22',
  templateUrl: 'create-job-post-22.component.html',
  styleUrls: ['create-job-post-22.component.css'],
})
export class CreateJobPost22 implements OnInit, OnDestroy, AfterViewInit { // Implements AfterViewInit 
  // Input property for the unique job identifier
  @Input() jobUniqueId: string;
  @Input() rootClassName: string = '';

  // ViewChild decorators to get references to elements from the template for DOM manipulation 
  @ViewChild('difficultySlider') difficultySlider: ElementRef<HTMLInputElement>;
  @ViewChild('skillViewport') skillViewport: ElementRef<HTMLDivElement>;
  @ViewChild('skillTrack') skillTrack: ElementRef<HTMLDivElement>;

  // Subscription management to prevent memory leaks
  private subscriptions = new Subscription();

  // Stores the ID of the assessment being edited, if applicable
  private currentAssessmentId: string | null = null;

  // Reactive form group for assessment settings
  assessmentForm: FormGroup;

  // Array holding the data for each skill section (tab)
  skillSections: SkillSection[] = [];

  // Index of the currently active skill section
  activeSectionIndex = 0;

  // Loading and submission state flags
  isLoading: boolean = true;
  isSubmitting: boolean = false;

  // Properties for the horizontal skill tab carousel logic
  currentScrollIndex = 0;
  maxScrollIndex = 0;
  private visibleItems = 4; // Default number of visible items
  private readonly skillTabWidth = 130; // From CSS: width
  private readonly skillTabGap = 16;   // From CSS: gap

  /**
   * Constructor for dependency injection
   * @param fb FormBuilder for creating reactive forms
   * @param router Router for navigation
   * @param snackBar MatSnackBar for displaying notifications
   * @param authService CorporateAuthService for handling authentication
   * @param mcqService McqAssessmentService for assessment-related API calls
   * @param jobService JobDescriptionService for job-related API calls
   * @param workflowService JobCreationWorkflowService for managing workflow state
   * @param renderer Renderer2 for safe DOM manipulation 
   */
  constructor(
    private fb: FormBuilder,
    private router: Router,
    private snackBar: MatSnackBar,
    private authService: CorporateAuthService,
    private mcqService: McqAssessmentService,
    private jobService: JobDescriptionService,
    private workflowService: JobCreationWorkflowService,
    private renderer: Renderer2 // Inject Renderer2 for safe DOM manipulation 
  ) {}

  /**
   * HostListener to recalculate the carousel state on window resize for responsiveness 
   */
  @HostListener('window:resize')
  onResize(): void {
    this.calculateCarouselState();
    this.updateScrollPosition();
  }

  /**
   * Lifecycle hook called when the component is initialized 
   * Initializes the form and fetches data based on whether an existing assessment is being edited.
   */
  ngOnInit(): void {
    this.initializeForm();

    // MODIFICATION: Get the current job ID from the workflow service
    // This replaces the @Input for jobUniqueId if workflow is the primary source
    // If jobUniqueId is still passed as input, this will override it.
    // Consider if you want input or workflow to be the source of truth.
    // For now, we'll keep the input but fetch the assessment ID from the workflow.
    // this.jobUniqueId = this.workflowService.getCurrentJobId(); // Uncomment if workflow is the source

    // MODIFICATION: Get the current assessment ID from the workflow
    this.currentAssessmentId = this.workflowService.getCurrentAssessmentId();

    // Ensure job context is available
    if (!this.jobUniqueId) {
      this.snackBar.open('Error: Job context is missing.', 'Close', { duration: 5000 });
      this.isLoading = false;
      return;
    }

    // MODIFICATION: Conditional logic to either load existing data or fetch new data
    if (this.currentAssessmentId) {
      this.loadExistingAssessment(this.currentAssessmentId);
    } else {
      this.fetchNewMcqList(); // This calls the original fetchMcqData logic
    }
  }

  /**
   * Lifecycle hook called after the component's view has been fully initialized 
   * Used to set initial states for UI elements that depend on the view being rendered.
   */
  ngAfterViewInit(): void { // Implements AfterViewInit 
    // Set the initial fill state of the slider after the view is ready.
    this.updateSliderFill();
    // Calculate the initial state of the carousel after the view is rendered.
    this.calculateCarouselState();
  }


  /**
   * Processes raw MCQ items from the API into the internal McqQuestion format.
   * @param mcqItems Array of raw MCQ items from the API.
   * @returns Array of processed McqQuestion objects.
   */
  private processMcqItems(mcqItems: IMcqItem[]): McqQuestion[] {
    return mcqItems.map((item): McqQuestion => {
      const isAiGenerated = item.question_text.includes('✨');
      const cleanedText = item.question_text.replace(/✨/g, '').trim();
      return {
        ...item,
        isSelected: false, // Initially not selected
        isAiGenerated: isAiGenerated,
        parsed: this.parseQuestionText(cleanedText)
      };
    });
  }

  /**
   * Parses the raw question text string into structured components (question, options, answer, difficulty).
   * @param rawText The raw text of the question from the API.
   * @returns A ParsedDetails object containing the structured question data.
   */
  private parseQuestionText(rawText: string): ParsedDetails {
    const lines = rawText.split('\n').filter(line => line.trim() !== '');
    const defaultResult: ParsedDetails = {
      question: rawText,
      options: [],
      correctAnswer: '',
      difficulty: 'Medium',
    };

    try {
      // Find the line that is not an option, answer, or difficulty indicator - assume it's the question
      let questionLine = lines.find(line => !/^[a-d]\)|Correct Answer:|easy|medium|hard/i.test(line.trim()));
      defaultResult.question = questionLine ? questionLine.replace(/^Q\d+\.?\s*/, '').trim() : 'Could not parse question.';

      // Find and extract the options (lines starting with a), b), c), d))
      const optionLines = lines.filter(line => /^[a-d]\)/i.test(line.trim()));
      defaultResult.options = optionLines.map(line => line.trim().substring(3).trim()); // Remove 'a) ' part

      // Find and extract the correct answer
      const answerLine = lines.find(line => /Correct Answer:/i.test(line));
      if (answerLine) {
        const match = answerLine.match(/Correct Answer:\s*([a-d])/i);
        if (match) defaultResult.correctAnswer = match[1].toLowerCase();
      }

      // Determine difficulty based on keywords in the text
      if (rawText.toLowerCase().includes('easy')) defaultResult.difficulty = 'Easy';
      if (rawText.toLowerCase().includes('hard')) defaultResult.difficulty = 'Hard';

      return defaultResult;
    } catch (e) {
      console.error("Failed to parse question text:", rawText, e);
      return defaultResult;
    }
  }

  /**
   * Initializes the reactive form with default values and validators.
   */
  private initializeForm(): void {
    this.assessmentForm = this.fb.group({
      assessmentName: ['', Validators.required],
      shuffleQuestions: [true],
      isProctored: [true],
      allowPhoneAccess: [true],
      allowVideoRecording: [true],
      difficulty: [0.6], // Stored as a decimal (0.0 - 1.0)
      timeLimit: ['01:00', [Validators.required, Validators.pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)]], // HH:MM format
    });
  }

  /**
   * MODIFICATION: Loads data for an existing assessment.
   * Fetches all MCQs for the job, then fetches the specific assessment details to pre-populate the form and select questions.
   * @param assessmentId The ID of the assessment to load.
   */
  private loadExistingAssessment(assessmentId: string): void {
    this.isLoading = true;
    const token = this.authService.getJWTToken();
    if (!token) {
      this.snackBar.open('Authentication error. Please log in again.', 'Close', { duration: 4000 });
      this.router.navigate(['/login-corporate']);
      this.isLoading = false;
      return;
    }

    // First get the list of ALL possible MCQs for the job post
    this.subscriptions.add(this.jobService.job_post_mcqs_list_api(this.jobUniqueId, token).subscribe({
      next: (mcqResponse) => {
        // Populate the skill sections with all questions
        const skillData = mcqResponse.data;
        this.skillSections = Object.keys(skillData).map(skillName => {
            const questions = this.processMcqItems(skillData[skillName].mcq_items);
            return {
              skillName, questions, totalCount: questions.length,
              selectedCount: 0, isAllSelected: false,
            };
        });

        // Now, get the details of the specific assessment to select the correct questions
        this.subscriptions.add(this.mcqService.getAssessmentDetails(assessmentId, token).subscribe({
            next: (assessmentDetails) => {
                // Populate the form fields with assessment settings
                this.assessmentForm.patchValue({
                    assessmentName: assessmentDetails.name,
                    shuffleQuestions: assessmentDetails.shuffle_questions_overall,
                    isProctored: assessmentDetails.is_proctored,
                    allowPhoneAccess: assessmentDetails.allow_phone_access,
                    allowVideoRecording: assessmentDetails.has_video_recording,
                    difficulty: assessmentDetails.difficulty,
                    timeLimit: this.minutesToHHMM(assessmentDetails.time_limit),
                });

                // Get the list of previously selected question IDs into a Set for efficient lookup
                const selectedIds = new Set(assessmentDetails.selected_mcqs.map(q => q.mcq_item_details.id));

                // Iterate through all loaded questions and mark the ones that were previously selected
                this.skillSections.forEach(section => {
                    section.questions.forEach(q => {
                        if (selectedIds.has(q.mcq_item_id)) {
                            q.isSelected = true;
                        }
                    });
                    // Update counts for each section after selection state is set
                    this.updateCountsForSection(section);
                });

                // Update the overall counts
                this.updateCounts();

                this.isLoading = false;
                 // Use setTimeout to ensure the view has updated before calculating carousel state
                 setTimeout(() => this.calculateCarouselState(), 0);
            },
            error: (err) => {
              this.snackBar.open(`Failed to load assessment details: ${err.message}`, 'Close', { duration: 5000 });
              this.isLoading = false;
              // Even if loading details fails, we have the MCQ list, so maybe don't navigate away?
              // Or navigate back? Depends on desired UX.
            }
        }));
      },
      error: (err) => {
        this.snackBar.open(`Failed to load questions: ${err.message}`, 'Close', { duration: 5000 });
        this.isLoading = false;
      }
    }));
  }

  /**
   * MODIFICATION: Renamed version of the original data fetching logic.
   * Fetches the initial list of MCQs for the job post when creating a new assessment.
   */
  private fetchNewMcqList(): void {
    // This contains the original logic from the first version's fetchMcqData method
    this.isLoading = true;
    const token = this.authService.getJWTToken();
    if (!token) {
      this.snackBar.open('Authentication error. Please log in again.', 'Close', { duration: 4000 });
      this.router.navigate(['/login-corporate']);
      this.isLoading = false;
      return;
    }
    this.subscriptions.add(
      this.jobService.job_post_mcqs_list_api(this.jobUniqueId, token).subscribe({
        next: (response) => {
          const skillData = response.data;
          this.skillSections = Object.keys(skillData).map(skillName => {
            const sectionData = skillData[skillName];
            const questions = this.processMcqItems(sectionData.mcq_items);
            return {
              skillName: skillName, questions: questions, totalCount: questions.length,
              selectedCount: 0, isAllSelected: false,
            };
          });
          this.isLoading = false;
           // Use setTimeout to ensure the view has updated before calculating carousel state
           setTimeout(() => this.calculateCarouselState(), 0);
        },
        error: (err) => {
          this.snackBar.open(`Failed to load questions: ${err.message}`, 'Close', { duration: 5000 });
          this.isLoading = false;
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
    const viewportWidth = this.skillViewport.nativeElement.offsetWidth;
    const itemTotalWidth = this.skillTabWidth + this.skillTabGap;
    // Dynamically calculate how many items can fit
    this.visibleItems = Math.floor((viewportWidth + this.skillTabGap) / itemTotalWidth);
    if (this.visibleItems < 1) this.visibleItems = 1;
    const totalItems = this.skillSections.length;
    this.maxScrollIndex = Math.max(0, totalItems - this.visibleItems);
    // Adjust scroll index if it's now out of bounds after resize
    if (this.currentScrollIndex > this.maxScrollIndex) {
      this.currentScrollIndex = this.maxScrollIndex;
    }
  }

  /**
   * Updates the horizontal scroll position of the skill tab carousel track.
   */
  private updateScrollPosition(): void {
    if (this.skillTrack && this.skillTrack.nativeElement) {
      const itemTotalWidth = this.skillTabWidth + this.skillTabGap;
      const newX = -this.currentScrollIndex * itemTotalWidth;
      this.renderer.setStyle(this.skillTrack.nativeElement, 'transform', `translateX(${newX}px)`); // Safe DOM manipulation 
    }
  }

  /**
   * Navigates the skill tab carousel left or right.
   * @param direction 'prev' or 'next'
   */
  navigateCarousel(direction: 'prev' | 'next'): void {
    if (direction === 'next') {
      if (this.currentScrollIndex < this.maxScrollIndex) {
        this.currentScrollIndex++;
      }
    } else { // 'prev'
      if (this.currentScrollIndex > 0) {
        this.currentScrollIndex--;
      }
    }
    this.updateScrollPosition();
  }

  /**
   * Handles changes to the difficulty slider input.
   * Updates the form control value and the visual fill of the slider.
   * @param event The input change event.
   */
  onDifficultyChange(event: Event): void {
    const value = (event.target as HTMLInputElement).valueAsNumber;
    this.assessmentForm.get('difficulty')?.setValue(value / 100); // Convert slider value (0-100) to decimal
    this.updateSliderFill();
  }

  /**
   * Updates the visual fill percentage of the custom difficulty slider using CSS variables.
   */
  private updateSliderFill(): void {
    if (this.difficultySlider && this.difficultySlider.nativeElement) {
      const slider = this.difficultySlider.nativeElement;
      const value = slider.valueAsNumber;
      const min = parseInt(slider.min, 10);
      const max = parseInt(slider.max, 10);
      const percentage = ((value - min) / (max - min)) * 100;
      slider.style.setProperty('--fill-percentage', `${percentage}%`);
    }
  }

  /**
   * Getter for the current difficulty percentage (0-100) for display purposes.
   * @returns The difficulty percentage.
   */
  get difficultyPercentage(): number {
    return (this.assessmentForm.get('difficulty')?.value || 0) * 100;
  }

  /**
   * Toggles selection of all questions within the currently active skill section.
   * @param event The checkbox change event.
   */
  toggleSelectAllForSection(event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    const activeSection = this.skillSections[this.activeSectionIndex];
    if (activeSection) {
      activeSection.isAllSelected = isChecked;
      activeSection.questions.forEach(q => q.isSelected = isChecked);
      this.updateCounts(); // Update global and section counts
    }
  }

  /**
   * Handles individual question selection changes.
   * Updates the 'isAllSelected' state of the active section and global counts.
   */
  onQuestionSelectionChange(): void {
    const activeSection = this.skillSections[this.activeSectionIndex];
    if (activeSection) {
       // Check if all questions in the section are now selected
      activeSection.isAllSelected = activeSection.questions.length > 0 && activeSection.questions.every(q => q.isSelected);
      this.updateCountsForSection(activeSection); // Update count for this section
    }
    this.updateCounts(); // Update global counts
  }

  /**
   * Updates the selected count for a specific section.
   * @param section The SkillSection to update.
   */
  private updateCountsForSection(section: SkillSection): void {
     section.selectedCount = section.questions.filter(q => q.isSelected).length;
  }

  /**
   * Updates the selected counts for all skill sections and the total selected count.
   */
  private updateCounts(): void {
    this.skillSections.forEach(section => {
      this.updateCountsForSection(section); // Update each section's count
    });
    // Note: totalSelectedCount getter recalculates based on section.selectedCount
  }

  /**
   * Getter for the total number of selected questions across all sections.
   * @returns The total selected count.
   */
  get totalSelectedCount(): number {
    if (!this.skillSections) return 0;
    return this.skillSections.reduce((acc, section) => acc + section.selectedCount, 0);
  }

  /**
   * Getter for the total number of questions across all sections.
   * @returns The total question count.
   */
  get totalQuestionCount(): number {
    if (!this.skillSections) return 0;
    return this.skillSections.reduce((acc, section) => acc + section.totalCount, 0);
  }

  /**
   * Sets the active skill section index, changing the displayed questions.
   * @param index The index of the section to activate.
   */
  selectSection(index: number): void {
    this.activeSectionIndex = index;
  }

  /**
   * Adds more AI-generated questions for the currently active skill.
   */
  addMoreAiQuestions(): void {
    if (this.isSubmitting) return; // Prevent multiple clicks
    const activeSection = this.skillSections[this.activeSectionIndex];
    if (!activeSection) return;

    this.isSubmitting = true;
    const token = this.authService.getJWTToken();
    if (!token) {
        this.snackBar.open('Authentication error. Please log in again.', 'Close', { duration: 4000 });
        this.isSubmitting = false;
        return;
    }
    this.subscriptions.add(
      this.jobService.generateMoreMcqsForSkill(this.jobUniqueId, activeSection.skillName, token).subscribe({
        next: (newMcqs) => {
          const newQuestions = this.processMcqItems(newMcqs);
          activeSection.questions.push(...newQuestions);
          activeSection.totalCount = activeSection.questions.length;
          this.onQuestionSelectionChange(); // Re-evaluate section selection state
          // After adding questions, the total number of items might have changed, so recalculate.
          setTimeout(() => this.calculateCarouselState(), 0);
          this.snackBar.open(`Added ${newMcqs.length} new questions for ${activeSection.skillName}`, 'Close', { duration: 3000 });
          this.isSubmitting = false;
        },
        error: (err) => {
          this.snackBar.open(`Failed to generate more questions: ${err.message}`, 'Close', { duration: 5000 });
          this.isSubmitting = false;
        }
      })
    );
  }

  /**
   * Navigates to the previous step in the job creation workflow.
   */
  onPrevious(): void { this.router.navigate(['/create-job-post-21-page']); }

  /**
   * Skips the assessment creation/editing step.
   */
  onSkip(): void { this.router.navigate(['/create-job-post-3rd-page']); }

  /**
   * Cancels the job creation process and navigates to the dashboard.
   */
  onCancel(): void {
    this.workflowService.clearWorkflow();
    this.router.navigate(['/dashboard']);
  }

  /**
   * Helper to convert minutes (from API) to HH:MM string format for the time input.
   * @param minutes The time in minutes.
   * @returns The formatted time string (HH:MM).
   */
  private minutesToHHMM(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  /**
   * Handles the 'Next' button click.
   * Validates the form, constructs the payload, and either creates or updates the assessment.
   */
  onNext(): void {
    this.assessmentForm.markAllAsTouched(); // Mark fields as touched to show validation errors
    if (this.assessmentForm.invalid) {
      this.snackBar.open('Please fill in all required settings (e.g., Assessment Name).', 'Close', { panelClass: ['error-snackbar'], duration: 3000 });
      return;
    }
    if (this.totalSelectedCount === 0) {
      this.snackBar.open('Please select at least one question to proceed.', 'Close', { panelClass: ['error-snackbar'], duration: 3000 });
      return;
    }

    const token = this.authService.getJWTToken();
    if (!token) {
        this.snackBar.open('Authentication error. Please log in again.', 'Close', { duration: 4000 });
        return;
    }

    this.isSubmitting = true;

    // Collect IDs of all selected questions
    const selectedIds = this.skillSections
      .reduce((acc, s) => acc.concat(s.questions), [] as McqQuestion[])
      .filter(q => q.isSelected)
      .map(q => q.mcq_item_id);

    let timeInMinutes = 0;
    try {
        // Parse the HH:MM time limit into total minutes
        const timeParts = this.assessmentForm.get('timeLimit')?.value.split(':');
        const hours = parseInt(timeParts[0], 10);
        const minutes = parseInt(timeParts[1], 10);
        timeInMinutes = (hours * 60) + minutes;
    } catch (e) {
        console.error("Could not parse time limit", this.assessmentForm.get('timeLimit')?.value);
        this.snackBar.open('Invalid time format. Please use HH:MM.', 'Close');
        this.isSubmitting = false;
        return;
    }

    // Construct the payload for the API call
    const payload = {
      job_unique_id: this.jobUniqueId,
      name: this.assessmentForm.get('assessmentName')?.value,
      is_proctored: this.assessmentForm.get('isProctored')?.value,
      has_video_recording: this.assessmentForm.get('allowVideoRecording')?.value,
      allow_phone_access: this.assessmentForm.get('allowPhoneAccess')?.value,
      shuffle_questions_overall: this.assessmentForm.get('shuffleQuestions')?.value,
      selected_mcq_item_ids: selectedIds,
      difficulty: this.assessmentForm.get('difficulty')?.value,
      time_limit: timeInMinutes,
    };


    // MODIFICATION: Conditional create vs. update logic
    if (this.currentAssessmentId) {
        // UPDATE existing assessment
        this.subscriptions.add(
            this.mcqService.updateAssessment(this.currentAssessmentId, payload, token).subscribe({
                next: () => {
                    this.isSubmitting = false;
                    this.snackBar.open('Assessment updated successfully!', 'Close', { duration: 3000 });
                    this.router.navigate(['/create-job-post-3rd-page']);
                },
                error: (err) => {
                  this.isSubmitting = false;
                  const errorDetail = err.error ? (typeof err.error === 'string' ? err.error : JSON.stringify(err.error)) : err.message;
                  this.snackBar.open(`Update failed: ${errorDetail}`, 'Close', { panelClass: ['error-snackbar'], duration: 7000 });
                  console.error("Backend update error:", err);
                }
            })
        );
    } else {
        // CREATE new assessment
        this.subscriptions.add(
            this.mcqService.saveAssessment(payload, token).subscribe({
                next: (response) => {
                    this.isSubmitting = false;
                    // CRITICAL: Save the new assessment ID to the workflow
                    // Assuming the response contains the UUID as `assessment_uuid` or similar.
                    // Adjust the property name based on your actual API response.
                    if (response && response.assessment_uuid) {
                       this.workflowService.setCurrentAssessmentId(response.assessment_uuid);
                    }
                    this.snackBar.open('Assessment saved successfully!', 'Close', { duration: 3000 });
                    this.router.navigate(['/create-job-post-3rd-page']);
                },
                error: (err) => {
                  this.isSubmitting = false;
                  const errorDetail = err.error ? (typeof err.error === 'string' ? err.error : JSON.stringify(err.error)) : err.message;
                  this.snackBar.open(`Save failed: ${errorDetail}`, 'Close', { panelClass: ['error-snackbar'], duration: 7000 });
                  console.error("Backend save error:", err);
                }
            })
        );
    }
  }

  /**
   * Lifecycle hook called when the component is destroyed .
   * Unsubscribes from all active subscriptions to prevent memory leaks.
   */
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}

