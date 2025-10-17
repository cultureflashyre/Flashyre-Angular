// src/app/pages/admin-create-job-step3/admin-create-job-step3.component.ts
import { Component, Input, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, Renderer2, HostListener,ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AdminJobDescriptionService } from '../../services/admin-job-description.service';
import { CorporateAuthService } from '../../services/corporate-auth.service';
import { SkillService, ApiSkill } from '../../services/skill.service';
import { AdminJobCreationWorkflowService } from '../../services/admin-job-creation-workflow.service';
import { MCQItem as IMcqItem } from '../admin-create-job-step1/types';
import { NgxSpinnerService } from 'ngx-spinner';
import { McqAssessmentService } from 'src/app/services/mcq-assessment.service';

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
  generationStatus: 'pending' | 'loading' | 'completed' | 'failed';
}

interface UploadedQuestion {
  id: number;               // unique question id
  question: string;
  options: string[];
  correctAnswer: string;
  marks: number;
  difficulty: string;
  isSelected: boolean;
}
interface UploadedSkillSection {
  skillName: string;
  questions: UploadedQuestion[];
  isAllSelected: boolean;
  totalCount: number;
  selectedCount: number;
}

interface CodingTestCase {
  id: number;
  input: string;
  expected_output: string;
}

interface CodingProblem {
  id: number;
  title: string;
  description: string;
  input_format: string;
  output_format: string;
  constraints: string;
  example: string;
  test_cases: CodingTestCase[];
  isSelected: boolean;
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
  skillSections: SkillSection[] = [];
  activeSectionIndex = 0;

  activeTab: 'ai-generated' | 'uploaded' | 'coding-problem' = 'ai-generated';
  
  isLoading: boolean = true;
  isSubmitting: boolean = false;
  
  showPopup: boolean = false;
  popupMessage: string = '';
  popupType: 'success' | 'error' = 'success';
  
  currentScrollIndex = 0;
  maxScrollIndex = 0;

  // properties for upload section
  uploadedSkillSections: UploadedSkillSection[] = [];
  activeUploadedSectionIndex: number = 0;

  showAlert = false;
  alertMessage = '';
  alertButtons: string[] = [];
  private actionContext: { action: string } | null = null;

  // Coding problem section
  codingProblems: CodingProblem[] = [];
  isAllCodingSelected: boolean = false;
  codingProblemsSelectedCount: number = 0;  // Declare this property

   // NEW: Flag to prevent multiple sequential generation loops
  private isGeneratingSequentially = false;

  /**
   * Constructor for dependency injection
   * @param fb FormBuilder for creating reactive forms
   * @param router Router for navigation
   * @param authService CorporateAuthService for handling authentication
   * @param jobService AdminJobDescriptionService for job-related API calls
   * @param workflowService AdminJobCreationWorkflowService for managing workflow state
   * @param renderer Renderer2 for safe DOM manipulation
   * @param skillService SkillService for skill suggestions
   * @param spinner NgxSpinnerService for loading indicators
   */
  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: CorporateAuthService,
    private jobService: AdminJobDescriptionService,
    private workflowService: AdminJobCreationWorkflowService,
    private renderer: Renderer2,
    private mcqService: McqAssessmentService,
    private skillService: SkillService,
    private spinner: NgxSpinnerService,
    private cdr: ChangeDetectorRef
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
    this.initializeForm();
    this.jobUniqueId = this.workflowService.getCurrentJobId();
    this.currentAssessmentId = this.workflowService.getCurrentAssessmentId();

    if (!this.jobUniqueId) {
      this.showErrorPopup('Error: Job context is missing. Redirecting...');
      this.router.navigate(['/admin-create-job-step1']);
      return;
    }

    // --- CORRECTED ngOnInit ---
    // Only these three calls should be here.
    this.loadInitialData();
    this.loadExistingExcelUploadQuestions();
    this.fetchCodingProblems();
  }

   /**
   * NEW: Orchestrates the initial loading of the component.
   * 1. Fetches the status of all skills.
   * 2. Initializes the UI with correct loading/completed states.
   * 3. Fetches data for skills that are already done.
   * 4. Kicks off the sequential background generation for pending skills.
   */
  private loadInitialData(): void {
    const token = this.authService.getJWTToken();
    if (!token) {
      this.showErrorPopup('Authentication error.');
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.subscriptions.add(
      this.jobService.checkMcqStatus(this.jobUniqueId, token).subscribe({
        next: (statusResponse) => {
          this.skillSections = Object.keys(statusResponse.skills).map(skillName => ({
            skillName,
            questions: [],
            totalCount: 0,
            selectedCount: 0,
            isAllSelected: false,
            generationStatus: statusResponse.skills[skillName] as 'pending' | 'loading' | 'completed' | 'failed',
          }));

          this.subscriptions.add(
            this.jobService.job_post_mcqs_list_api(this.jobUniqueId, token).subscribe({
              next: (mcqResponse) => {
                const completedSkillData = mcqResponse.data;
                this.skillSections.forEach(section => {
                  if (completedSkillData[section.skillName]) {
                    const processedQuestions = this.processMcqItems(completedSkillData[section.skillName].mcq_items);
                    section.questions = processedQuestions;
                    section.totalCount = processedQuestions.length;
                  }
                });

                this.loadAndApplyExistingAssessment();
                this.isLoading = false;
                this.generateRemainingSkillsSequentially();
              },
              error: (err) => {
                 this.showErrorPopup(`Failed to load initial questions: ${err.message}`);
                 this.isLoading = false;
              }
            })
          );
        },
        error: (err) => {
          this.showErrorPopup(`Failed to get MCQ generation status: ${err.message}`);
          this.isLoading = false;
        }
      })
    );
  }
  
  /**
   * NEW: Helper function to load and apply details from a previously saved assessment.
   */
private loadAndApplyExistingAssessment(): void {
    const token = this.authService.getJWTToken();
    if (!token) return;

    const assessmentId = this.workflowService.getCurrentAssessmentId();
    if (assessmentId) {
      this.subscriptions.add(this.jobService.getAssessmentDetails(assessmentId, token).subscribe({
        next: (assessmentDetails) => {
          if (!assessmentDetails) return;
          
          this.assessmentForm.patchValue({
              assessmentName: assessmentDetails.name,
              shuffleQuestions: assessmentDetails.shuffle_questions_overall,
              isProctored: assessmentDetails.is_proctored,
              allowPhoneAccess: assessmentDetails.allow_phone_access,
              allowVideoRecording: assessmentDetails.has_video_recording,
              difficulty: assessmentDetails.difficulty,
              timeLimit: this.minutesToHHMM(assessmentDetails.time_limit),
          });

          // Pre-select MCQs (existing logic)
          const selectedMcqIds = new Set(assessmentDetails.selected_mcqs.map((q: any) => q.mcq_item_details.id));
          this.skillSections.forEach(section => {
              section.questions.forEach(q => {
                  if (selectedMcqIds.has(q.mcq_item_id)) {
                      q.isSelected = true;
                  }
              });
              this.updateCountsForSection(section);
          });
          
          // THIS IS THE NEW LOGIC TO ADD for pre-selecting coding problems
          if (assessmentDetails.selected_coding_problems && this.codingProblems.length > 0) {
            const selectedCodingIds = new Set(assessmentDetails.selected_coding_problems.map((p: any) => p.coding_problem_details.id));
            
            this.codingProblems.forEach(problem => {
              if (selectedCodingIds.has(problem.id)) {
                problem.isSelected = true;
              }
            });
            this.onCodingProblemSelectionChange(); // Update counts and 'select all' state
          }
        },
        error: (err) => console.warn("Could not load details for existing assessment.", err)
      }));
    }
  }
  
  /**
   * NEW: Asynchronously generates MCQs for all pending skills, one by one.
   * Updates the UI in real-time as each skill's questions are fetched.
   */
   private async generateRemainingSkillsSequentially(): Promise<void> {
    if (this.isGeneratingSequentially) return;
    this.isGeneratingSequentially = true;

    const token = this.authService.getJWTToken();
    if (!token) {
      this.showErrorPopup('Authentication error while generating questions.');
      this.isGeneratingSequentially = false;
      return;
    }

    for (const section of this.skillSections) {
      if (section.generationStatus === 'pending') {
        try {
          section.generationStatus = 'loading';
          const response = await this.jobService.generateMcqForSkill(this.jobUniqueId, section.skillName, token).toPromise();
          const newQuestions = this.processMcqItems(response.data);
          section.questions = [...section.questions, ...newQuestions];
          section.totalCount = section.questions.length;
          section.generationStatus = 'completed';
          this.cdr.detectChanges();
        } catch (error) {
          section.generationStatus = 'failed';
          console.error(`Failed to generate questions for ${section.skillName}:`, error);
          this.cdr.detectChanges();
        }
      }
    }
    this.isGeneratingSequentially = false;
  }
  
  
  ///////////////////////////////////////////////////////////

  /**
   * Helper function to extract options from the full question text.
   * Assumes the format where options follow the question text.
   */
  private extractOptionsFromQuestionText(questionText: string): string[] {
    console.log('[extractOptionsFromQuestionText] Input questionText:', questionText);

    const options: string[] = [];
    const optionLabels = ['a)', 'b)', 'c)', 'd)'];
    let remainingText = questionText.toLowerCase();

    for (let i = 0; i < optionLabels.length; i++) {
      const start = remainingText.indexOf(optionLabels[i]);
      if (start < 0) {
        console.log(`[extractOptionsFromQuestionText] No option "${optionLabels[i]}" found, breaking.`);
        break; // no more options
      }
      let end = remainingText.length;
      for (let j = i + 1; j < optionLabels.length; j++) {
        const idx = remainingText.indexOf(optionLabels[j]);
        if (idx > start) {
          end = idx;
          break;
        }
      }
      const optionText = questionText.substring(start, end).trim();
      if (optionText) {
        console.log(`[extractOptionsFromQuestionText] Extracted option: "${optionText}"`);
        options.push(optionText);
      }
    }

    console.log('[extractOptionsFromQuestionText] Final options array:', options);
    return options.length ? options : [];
  }

  /**
   * Helper to extract the 'Correct: x)' answer from question text.
   */
  private extractCorrectAnswerFromQuestionText(questionText: string): string {
    console.log('[extractCorrectAnswerFromQuestionText] Input questionText:', questionText);
    const correctIndex = questionText.indexOf('correct:');
    if (correctIndex < 0) {
      console.log('[extractCorrectAnswerFromQuestionText] "Correct:" not found in question text.');
      return '';
    }
    let correctPart = questionText.substring(correctIndex + 8).trim();
    const match = correctPart.match(/[a-d]\)?/i);
    const answer = match ? match[0] : correctPart;
    console.log(`[extractCorrectAnswerFromQuestionText] Parsed answer: "${answer}"`);
    return answer;
  }

  private parseUploadedQuestionText(rawText: string): ParsedDetails {
    // Extract the question text before first option (like 'a)')
    const questionMatch = rawText.match(/^([\s\S]*?)(?=\na\))/i);
    
    // Extract options marked like 'a) option text'
    const optionsRegex = /^([a-d])\)\s*([\s\S]*?)(?=\n[a-d]\)|\nCorrect Answer:|$)/gmi;
    const optionsMatch = [];
    let match;
    while ((match = optionsRegex.exec(rawText)) !== null) {
      optionsMatch.push(match);
    }

    // Extract correct answer e.g. 'Correct Answer: b' ignoring case and spaces
    const correctMatch = rawText.match(/Correct Answer:\s*([a-d])/i);

    // Extract difficulty if available (optional)
    const difficultyMatch = rawText.match(/\(?\b(Easy|Medium|Hard)\b\)?$/i);

    return {
      question: questionMatch ? questionMatch[1].replace(/✨/g, '').trim() : 'Could not parse question',
      options: optionsMatch.map(m => m[2].trim()),
      correctAnswer: correctMatch ? correctMatch[1].toLowerCase() : '',
      difficulty: difficultyMatch ? difficultyMatch[1] : 'Medium'
    };
  }


  private loadExistingExcelUploadQuestions(): void {
    this.isLoading = true;
    const token = this.authService.getJWTToken();
    if (!token) {
      console.error('JWT token missing. Cannot load uploaded questions.');
      return;
    }

    this.subscriptions.add(this.jobService.getUploadedQuestions(this.jobUniqueId, token).subscribe({
      next: (mcqResponse) => {
        console.log('[IN ADMIN] Received response from getUploadedQuestions:', mcqResponse);
        const skillData = mcqResponse.data;

        if (!skillData || Object.keys(skillData).length === 0) {
          console.warn('[IN ADMIN] No skill data found in response.');
          this.uploadedSkillSections = [];
        } else {
          console.log(`[IN ADMIN] Processing skill data for ${Object.keys(skillData).length} skills.`);
          this.uploadedSkillSections = Object.keys(skillData).map(skillName => {
            const mcqItems = skillData[skillName].mcq_items;
            console.log(`[IN ADMIN] Mapping ${mcqItems.length} MCQs for skill: ${skillName}`);

            const questions = mcqItems.map((q: any) => {
              // Use the new parseQuestionText which returns ParsedDetails object
              const parsed: ParsedDetails = this.parseUploadedQuestionText(q.question_text);
              console.log(`[IN ADMIN] Question ID: ${q.mcq_item_id} | Parsed question: "${parsed.question}" | Options: ${parsed.options.join(', ')} | Correct answer: ${parsed.correctAnswer} | Difficulty: ${parsed.difficulty}`);

              return {
                id: q.mcq_item_id,
                question: parsed.question,
                options: parsed.options,
                correctAnswer: parsed.correctAnswer,
                marks: 2,               // default or adjust if you get marks info
                difficulty: parsed.difficulty,
                isSelected: false,
              };
            });

            return {
              skillName,
              questions,
              totalCount: questions.length,
              selectedCount: 0,
              isAllSelected: false,
            };
          });

          console.log('[IN ADMIN] Constructed uploadedSkillSections:', this.uploadedSkillSections);
        }

        // Fetch latest assessment info to pre-select questions etc.
        this.subscriptions.add(this.mcqService.getLatestAssessmentForJob(this.jobUniqueId, token, 'excel_upload').subscribe({
          next: (assessmentDetails) => {
            if (assessmentDetails) {
              console.log('[IN ADMIN] Assessment details received:', assessmentDetails);
              this.currentAssessmentId = assessmentDetails.assessment_uuid;
              this.workflowService.setCurrentAssessmentId(this.currentAssessmentId);

              this.assessmentForm.patchValue({
                assessmentName: assessmentDetails.name,
                shuffleQuestions: assessmentDetails.shuffle_questions_overall,
                isProctored: assessmentDetails.is_proctored,
                allowPhoneAccess: assessmentDetails.allow_phone_access,
                allowVideoRecording: assessmentDetails.has_video_recording,
                difficulty: assessmentDetails.difficulty,
                timeLimit: this.minutesToHHMM(assessmentDetails.time_limit),
              });

              const selectedIds = new Set(assessmentDetails.selected_mcqs.map((q: any) => q.mcq_item_details.id));
              console.log(`[IN ADMIN] Selected MCQ IDs in assessment:`, Array.from(selectedIds));

              this.uploadedSkillSections.forEach(section => {
                section.questions.forEach(q => {
                  if (selectedIds.has(q.id)) {
                    q.isSelected = true;
                    console.log(`[IN ADMIN] Marking question ID ${q.id} as selected.`);
                  }
                });
                this.updateCountsForUploadedSection(section);
              });
              this.updateCounts();
            } else {
              console.warn('[IN ADMIN] No assessment details found.');
            }
            this.isLoading = false;
            setTimeout(() => {
              this.calculateCarouselState();
              this.updateSliderFill();
            }, 0);
          },
          error: (err) => {
            console.warn("No existing assessment found, starting fresh.", err);
            this.isLoading = false;
            setTimeout(() => this.calculateCarouselState(), 0);
          }
        }));

      },
      error: (err) => {
        console.error(`Failed to load uploaded questions: ${err.message}`, err);
        this.showErrorPopup(`Failed to load uploaded questions: ${err.message}`);
        this.isLoading = false;
      }
    }));
  }

////////////////////////////////////////////////////////////////

  toggleSelectAllForUploadedSection(event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    const section = this.uploadedSkillSections[this.activeUploadedSectionIndex];

    if (section) {
      section.isAllSelected = isChecked;
      section.questions.forEach(q => q.isSelected = isChecked);
      this.updateCounts(); // Update global and section counts
    }
  }

  onUploadedQuestionSelectionChange(): void {
    // Also update uploaded active section counts
    const activeUploadedSection = this.uploadedSkillSections[this.activeUploadedSectionIndex];
    if (activeUploadedSection) {
      activeUploadedSection.isAllSelected = activeUploadedSection.questions.length > 0 && activeUploadedSection.questions.every(q => q.isSelected);
      this.updateCountsForUploadedSection(activeUploadedSection);
    }
    this.updateCounts(); // Update global counts
  }

  /**
   * NEW METHOD: Checks if an AI MCQ assessment exists and loads it, otherwise fetches newly generated AI MCQs
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
          this.showErrorPopup(`Failed to check assessment status: ${err.message}`);
          this.isLoading = false;
          this.spinner.hide('main-spinner');
        }
      })
    );
  }

  /**
   * Fetch coding problems from the service and initialize their selection states.
   */
  fetchCodingProblems(): void {
    const token = this.authService.getJWTToken();
    if (!token) {
      this.showErrorPopup('Authentication error.');
      return;
    }

    this.subscriptions.add(
      this.jobService.getAllCodingAssessmentQuestions(token).subscribe({
        next: (response) => {
          // Assuming response.problems is the array of coding questions
          this.codingProblems = response.problems.map(problem => ({
            ...problem,
            isSelected: false
          }));
          this.isAllCodingSelected = false; // reset select all
          this.updateCodingSelectedCount();
        },
        error: (err) => {
          this.showErrorPopup(`Failed to load coding problems: ${err.message}`);
        }
      })
    );
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

  // --- Popup Handling Methods ---
  showSuccessPopup(message: string) {
    this.popupMessage = message;
    this.popupType = 'success';
    this.showPopup = true;
    setTimeout(() => this.closePopup(), 3000);
  }
  showErrorPopup(message: string) {
    this.popupMessage = message;
    this.popupType = 'error';
    this.showPopup = true;
    setTimeout(() => this.closePopup(), 5000);
  }
  closePopup() {
    this.showPopup = false;
    this.popupMessage = '';
  }

  // --- ALERT HANDLING LOGIC ---

private openAlert(message: string, buttons: string[]) {
  this.alertMessage = message;
  this.alertButtons = buttons;
  this.showAlert = true;
}

onAlertButtonClicked(action: string) {
  this.showAlert = false; // Always hide the alert after a button is clicked

  // If the user clicked "Cancel" or "No", we stop here
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
    this.actionContext = null; // Clear the context after handling
  }
}

  /**
   * Processes raw MCQ items from the API into the internal McqQuestion format.
   * @param mcqItems Array of raw MCQ items from the API.
   * @returns Array of processed McqQuestion objects.
   */
  private processMcqItems(mcqItems: IMcqItem[]): McqQuestion[] {
    if (!mcqItems) return [];
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
    const questionMatch = rawText.match(/^([\s\S]*?)(?=\s*a\))/i);
    const optionsRegex = /\b([a-d])\)\s*([\s\S]*?)(?=\s*[a-d]\)|Correct:|$)/gi;
    const optionsMatch: any[] = [];
    let match;
    while ((match = optionsRegex.exec(rawText)) !== null) {
      optionsMatch.push(match);
    }
    const correctMatch = rawText.match(/Correct:\s*([a-d])/i);
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
   * MODIFICATION: Loads data for an existing assessment.
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
    
    this.subscriptions.add(this.jobService.job_post_mcqs_list_api(this.jobUniqueId, token).subscribe({
        next: (mcqResponse) => {
            const skillData = mcqResponse.data;
            this.skillSections = Object.keys(skillData).map(skillName => ({
                skillName,
                questions: this.processMcqItems(skillData[skillName].mcq_items),
                totalCount: skillData[skillName].mcq_items.length,
                selectedCount: 0,
                isAllSelected: false,
                generationStatus: 'completed', // Questions are loaded, so status is 'completed'
            }));

            this.subscriptions.add(this.jobService.getAssessmentDetails(assessmentId, token).subscribe({
                next: (assessmentDetails) => {
                    this.assessmentForm.patchValue({
                        assessmentName: assessmentDetails.name,
                        shuffleQuestions: assessmentDetails.shuffle_questions_overall,
                        isProctored: assessmentDetails.is_proctored,
                        allowPhoneAccess: assessmentDetails.allow_phone_access,
                        allowVideoRecording: assessmentDetails.has_video_recording,
                        difficulty: assessmentDetails.difficulty,
                        timeLimit: this.minutesToHHMM(assessmentDetails.time_limit),
                    });
                    const selectedIds = new Set(assessmentDetails.selected_mcqs.map(q => q.mcq_item_details.id));
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
                error: (err) => { this.showErrorPopup(`Failed to load assessment details: ${err.message}`); this.isLoading = false; this.spinner.hide('main-spinner'); }
            }));
        },
        error: (err) => { this.showErrorPopup(`Failed to load questions: ${err.message}`); this.isLoading = false; this.spinner.hide('main-spinner'); }
    }));
  }

  /**
   * MODIFICATION: Renamed version of the original data fetching logic.
   * Fetches the initial list of MCQs for the job post when creating a new assessment.
   */
  private fetchNewMcqList(): void {
    const token = this.authService.getJWTToken();
    console.log('JWT Token:', token); // Log token

    if (!token) {
      this.showErrorPopup('Authentication error.');
      this.isLoading = false;
      this.spinner.hide('main-spinner');
      return;
    }
    this.subscriptions.add(this.jobService.job_post_mcqs_list_api(this.jobUniqueId, token).subscribe({
        next: (response) => {
          const skillData = response.data;
          this.skillSections = Object.keys(skillData).map(skillName => ({
            skillName,
            questions: this.processMcqItems(skillData[skillName].mcq_items),
            totalCount: skillData[skillName].mcq_items.length,
            selectedCount: 0,
            isAllSelected: false,
            generationStatus: 'completed', // Questions are loaded, so status is 'completed'
          }));
          this.isLoading = false;
          this.spinner.hide('main-spinner');
          this.spinner.hide('main-spinner');
          setTimeout(() => this.calculateCarouselState(), 0);
        },
        error: (err) => { this.showErrorPopup(`Failed to load questions: ${err.message}`); this.isLoading = false; this.spinner.hide('main-spinner'); }
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
      this.updateCounts();
    }
  }

    /**
   * Toggle select-all checkbox for coding problems.
   */
  toggleSelectAllCoding(event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    this.isAllCodingSelected = isChecked;
    this.codingProblems.forEach(problem => problem.isSelected = isChecked);
    this.updateCodingSelectedCount();
  }

  /**
   * Called on individual coding problem checkbox change.
   */
  onCodingProblemSelectionChange(): void {
    this.isAllCodingSelected = this.codingProblems.length > 0 && this.codingProblems.every(p => p.isSelected);
    this.updateCodingSelectedCount();
  }

  /**
   * Updates internal count of selected coding problems.
   */


  /**
   * Gets count of selected coding problems.
   */
  getSelectedCodingCount(): number {
    return this.codingProblems.filter(p => p.isSelected).length;
  }

  /**
   * Handles individual question selection changes.
   * Updates the 'isAllSelected' state of the active section and global counts.
   */
  onQuestionSelectionChange(): void {
    const activeSection = this.skillSections[this.activeSectionIndex];
    if (activeSection) {
      activeSection.isAllSelected = activeSection.questions.length > 0 && activeSection.questions.every(q => q.isSelected);
      this.updateCountsForSection(activeSection);
    }
    this.updateCounts();
  }

  /**
   * Updates the selected count for a specific section.
   * @param section The SkillSection to update.
   */
  private updateCountsForSection(section: SkillSection): void {
     section.selectedCount = section.questions.filter(q => q.isSelected).length;
  }

  private updateCountsForUploadedSection(section: UploadedSkillSection): void {
    section.selectedCount = section.questions.filter(q => q.isSelected).length;
  }

  private updateCodingSelectedCount(): void {
    // This can be bound to display count in template
    this.codingProblemsSelectedCount = this.codingProblems.filter(p => p.isSelected).length;
  }

  /**
   * Updates the selected counts for all skill sections and the total selected count.
   */

  private updateCounts(): void {
    this.skillSections.forEach(section => this.updateCountsForSection(section));
    this.uploadedSkillSections.forEach(section => this.updateCountsForUploadedSection(section));
    // totalSelectedCount getter will compute combined counts dynamically
  }

  /**
   * Getter for the total number of selected questions across all sections.
   * @returns The total selected count.
   */
  get totalSelectedCount(): number {
    const aiSelectedCount = this.skillSections?.reduce((acc, section) => acc + section.selectedCount, 0) || 0;
    const uploadedSelectedCount = this.uploadedSkillSections?.reduce((acc, section) => acc + section.selectedCount, 0) || 0;
    const codingSelectedCount = this.codingProblems?.filter(p => p.isSelected).length || 0;
    return aiSelectedCount + uploadedSelectedCount + codingSelectedCount;
  }

  /**
   * Getter for the total number of questions across all sections.
   * @returns The total question count.
   */
  get totalAIQuestionCount(): number {
    if (!this.skillSections) return 0;
    return this.skillSections.reduce((acc, section) => acc + section.totalCount, 0);
  }   

  get uploadedQuestionCount(): number {
    if (!this.uploadedSkillSections) return 0;
    return this.uploadedSkillSections.reduce((acc, section) => acc + section.totalCount, 0);
  }  

  get totalQuestionCount(): number {
    const aiCount = this.skillSections?.reduce((acc, section) => acc + section.totalCount, 0) || 0;
    const uploadedCount = this.uploadedSkillSections?.reduce((acc, section) => acc + section.totalCount, 0) || 0;
    return aiCount + uploadedCount;
  }

  /**
   * Sets the active skill section index, changing the displayed questions.
   * @param index The index of the section to activate.
   */
  selectSection(index: number) {
    if (this.activeTab === 'ai-generated') {
      this.activeSectionIndex = index;
    } else {
      this.activeUploadedSectionIndex = index;
    }
  }

  selectUploadedSection(index: number) {
    this.activeUploadedSectionIndex = index;
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
          activeSection.questions = [...activeSection.questions, ...newQuestions];  
          activeSection.totalCount = activeSection.questions.length;
          this.onQuestionSelectionChange();
          setTimeout(() => this.calculateCarouselState(), 0);
          this.showSuccessPopup(`Added ${newMcqs.length} new questions for ${activeSection.skillName}`);
          this.isSubmitting = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.showErrorPopup(`Failed to generate more questions: ${err.message}`);
          this.isSubmitting = false;
        }
      })
    );
  }

  onCancel(): void {
  this.actionContext = { action: 'cancel' };
  this.openAlert('Are you sure you want to cancel? The current progress will be lost.', ['No', 'Yes, Cancel']);
}

onPrevious(): void {
  this.actionContext = { action: 'previous' };
  this.openAlert('Do you want to go back to the previous step?', ['Cancel', 'Go Back']);
}

onSaveDraft(): void {
  this.assessmentForm.markAllAsTouched();
  if (this.totalSelectedCount === 0) {
    this.showErrorPopup('Please select at least one question before saving.');
    return;
  }
  this.actionContext = { action: 'saveDraft' };
  this.openAlert('Do you want to save this as a draft and exit?', ['Cancel', 'Save Draft']);
}

onSkip(): void {
  this.actionContext = { action: 'skip' };
  this.openAlert('Are you sure you want to skip this step?', ['Cancel', 'Skip']);
}

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
  onPreviousConfirmed(): void { this.router.navigate(['/admin-create-job-step2']); }

  /**
   * Skips the assessment creation/editing step.
   */
  onSkipConfirmed(): void { this.router.navigate(['/admin-create-job-step4']); }

  /**
   * Cancels the job creation process and navigates to the dashboard.
   */
  onCancelConfirmed(): void {
    this.workflowService.clearWorkflow();
    this.showSuccessPopup('Job post creation cancelled.');
    setTimeout(() => {
        this.router.navigate(['/admin-create-job-step1']);
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
   * MODIFIED: Builds payload for create/update operations
   */
  private buildPayload(): any {
    const selectedIds = this.skillSections
      .reduce((acc, s) => acc.concat(s.questions), [] as McqQuestion[])
      .filter(q => q.isSelected)
      .map(q => q.mcq_item_id);

    // Collect selected uploaded question IDs
    const selectedUploadedIds = this.uploadedSkillSections
      .reduce((acc, s) => acc.concat(s.questions), [] as UploadedQuestion[])
      .filter(q => q.isSelected)
      .map(q => q.id);

      // Coding problem selected IDs
    const selectedCodingProblemIds = this.codingProblems
      .filter(p => p.isSelected)
      .map(p => p.id);

          // Debug logs
    console.log('Selected AI-generated question IDs:', selectedIds);
    console.log('Selected Uploaded question IDs:', selectedUploadedIds);
    console.log('Selected Uploaded question IDs:', selectedCodingProblemIds);

        // Combine all selected question IDs
    const selectedAllIds = [...selectedIds, ...selectedUploadedIds];
    
    console.log('Combined selected question IDs:', selectedIds);

    const timeParts = this.assessmentForm.get('timeLimit')?.value.split(':');
    const timeInMinutes = (parseInt(timeParts[0], 10) * 60) + parseInt(timeParts[1], 10);
    
    return {
      job_unique_id: this.jobUniqueId,
      name: this.assessmentForm.get('assessmentName')?.value,
      is_proctored: this.assessmentForm.get('isProctored')?.value,
      has_video_recording: this.assessmentForm.get('allowVideoRecording')?.value,
      allow_phone_access: this.assessmentForm.get('allowPhoneAccess')?.value,
      shuffle_questions_overall: this.assessmentForm.get('shuffleQuestions')?.value,
      selected_mcq_item_ids: selectedAllIds,
      selected_coding_problem_ids: selectedCodingProblemIds,
      difficulty: this.assessmentForm.get('difficulty')?.value,
      time_limit: timeInMinutes,
    };
  }

  /**
   * MODIFIED: Save Draft - saves and navigates to admin-page1
   */
  onSaveDraftConfirmed(): void {
    this.assessmentForm.markAllAsTouched();
    
    // Allow saving draft even with incomplete data (remove validation)
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
          
          // Navigate to admin-page1 after 2 seconds
          setTimeout(() => {
            this.router.navigate(['/admin-create-job-step1']);
          }, 2000);
        },
        error: (err) => {
          this.isSubmitting = false;
          this.spinner.hide('main-spinner');
          this.showErrorPopup(`Save failed: ${err.message}`);
        }
      })
    );
    this.workflowService.clearWorkflow();
  }

  /**
   * MODIFIED: Next button - saves and navigates to Step 4
   */
  onNextConfirmed(): void {
    this.assessmentForm.markAllAsTouched();
    
    // Validate form
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
  
  loadUserProfile(): void {
    const profileData = localStorage.getItem('userProfile');
    if (profileData) this.userProfile = JSON.parse(profileData);
  }
}