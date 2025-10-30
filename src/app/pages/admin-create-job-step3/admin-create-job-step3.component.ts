//sample-3




import { Component, Input, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, Renderer2, HostListener, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription, forkJoin, of, Observable } from 'rxjs'; // Import Observable
import { switchMap, tap, finalize, catchError, map } from 'rxjs/operators'; // Import map
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

/**
 * Custom validator to check if the time value is not '00:00'.
 * @param control The form control to validate.
 * @returns A validation error object if the time is '00:00', otherwise null.
 */
export function timeNotZeroValidator(control: AbstractControl): ValidationErrors | null {
  if (control.value && control.value === '00:00') {
    return { timeIsZero: true }; // Return a specific error key
  }
  return null;
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
  codingProblemsSelectedCount: number = 0;

   // === NEW PROPERTIES FOR ADD SKILL POPUP ===
  showAddSkillPopup: boolean = false;
  newSkillName: string = ''; // This will now hold a comma-separated string
  isAddingNewSkill: boolean = false;
  // === END OF NEW PROPERTIES ===  

   // NEW: Flag to prevent multiple sequential generation loops
  private isGeneratingSequentially = false;

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

  @HostListener('window:resize')
  onResize(): void {
    // Debounce resize events to prevent excessive calls
    setTimeout(() => {
        this.calculateCarouselState();
        this.updateScrollPosition();
        this.cdr.detectChanges(); // Ensure UI updates
    }, 100);
  }

  ngOnInit(): void {
    this.initializeForm();
    this.jobUniqueId = this.workflowService.getCurrentJobId();
    this.currentAssessmentId = this.workflowService.getCurrentAssessmentId();

    if (!this.jobUniqueId) {
      this.showErrorPopup('Error: Job context is missing. Redirecting...');
      this.router.navigate(['/admin-create-job-step1']);
      return;
    }

    this.isLoading = true; // Ensure isLoading is true before any async operations start
    this.spinner.show('main-spinner'); // Show spinner immediately
    
    // Orchestrate all initial data loading
    this.loadAllInitialData();
  }

  /**
   * NEW: Orchestrates all initial data loading to ensure proper sequence and UI updates.
   */
  private loadAllInitialData(): void {
    const token = this.authService.getJWTToken();
    if (!token) {
      this.showErrorPopup('Authentication error.');
      this.isLoading = false;
      this.spinner.hide('main-spinner');
      this.cdr.detectChanges(); // Update view with error state
      return;
    }

    // --- MODIFICATION START ---
    // Check for pre-loaded data from Step 2 to avoid race condition
    const preloadedUploadedMcqs = this.workflowService.getUploadedMcqs();
    if (preloadedUploadedMcqs) {
      console.log("Found pre-loaded uploaded MCQs from workflow service.", preloadedUploadedMcqs);
      this.workflowService.clearUploadedMcqs(); // Consume the data
    }
    // --- MODIFICATION END ---

    // Define observables for initial data fetches
    const mcqStatus$ = this.jobService.checkMcqStatus(this.jobUniqueId, token).pipe(
      catchError(err => {
        console.error('Failed to get MCQ generation status from DB:', err);
        return of({ skills: {} }); // Default empty structure
      })
    );

    // --- MODIFICATION START ---
    // If we have pre-loaded data, use it. Otherwise, fetch from API.
    const uploadedQuestions$ = preloadedUploadedMcqs 
      ? of({ data: preloadedUploadedMcqs }) // Wrap pre-loaded data in an observable
      : this.jobService.getUploadedQuestions(this.jobUniqueId, token).pipe(
          catchError(err => {
            console.error('Failed to load uploaded questions:', err);
            return of({ data: {} });
          })
        );
    // --- MODIFICATION END ---

    const codingProblems$ = this.jobService.getAllCodingAssessmentQuestions(token).pipe(
      catchError(err => {
        console.error('Failed to load coding problems:', err);
        return of({ problems: [] }); // Provide a default empty structure
      })
    );

    // Combine initial fetches
    this.subscriptions.add(
      forkJoin({
        mcqStatus: mcqStatus$,
        uploadedQuestions: uploadedQuestions$,
        codingProblems: codingProblems$
      }).pipe(
        // Process results from parallel fetches
        tap(({ mcqStatus, uploadedQuestions, codingProblems }) => {
          // Initialize skillSections based on status
          if (mcqStatus && mcqStatus.skills) {
            this.skillSections = Object.keys(mcqStatus.skills).map(skillName => ({
              skillName,
              questions: [], // Will be filled later
              totalCount: 0,
              selectedCount: 0,
              isAllSelected: false,
              generationStatus: mcqStatus.skills[skillName] as 'pending' | 'loading' | 'completed' | 'failed',
            }));
          } else {
            this.skillSections = [];
          }

          // Process uploaded questions
          if (uploadedQuestions && uploadedQuestions.data && Object.keys(uploadedQuestions.data).length > 0) {
            this.uploadedSkillSections = Object.keys(uploadedQuestions.data).map(skillName => {
              const mcqItems = uploadedQuestions.data[skillName].mcq_items;
              const questions = mcqItems ? mcqItems.map((q: any) => {
                const parsed: ParsedDetails = this.parseUploadedQuestionText(q.question_text);
                return {
                  id: q.mcq_item_id,
                  question: parsed.question,
                  options: parsed.options,
                  correctAnswer: parsed.correctAnswer,
                  marks: 2,
                  difficulty: parsed.difficulty,
                  isSelected: false,
                };
              }) : [];
              return {
                skillName,
                questions,
                totalCount: questions.length,
                selectedCount: 0,
                isAllSelected: false,
              };
            });
          } else {
            this.uploadedSkillSections = [];
          }

          // Process coding problems
          if (codingProblems && codingProblems.problems) {
            this.codingProblems = codingProblems.problems.map(problem => ({
              ...problem,
              isSelected: false
            }));
            this.updateCodingSelectedCount(); // Update count
          } else {
            this.codingProblems = [];
          }
          this.cdr.detectChanges(); // Update UI after initial data population
        }),
        // Now, get existing assessment details or the latest one
        switchMap(() => {
          let assessmentFetch$: Observable<any>;
          if (this.currentAssessmentId) {
            assessmentFetch$ = this.jobService.getAssessmentDetails(this.currentAssessmentId, token);
          } else {
            // If no currentAssessmentId, check for the latest AI assessment
            assessmentFetch$ = this.mcqService.getLatestAssessmentForJob(this.jobUniqueId, token, 'ai_generated');
          }
          return assessmentFetch$.pipe(
            catchError(err => {
              console.warn("Could not load details for existing assessment or latest AI assessment.", err);
              // It's fine if there's no existing assessment, so return null
              return of(null);
            })
          );
        }),
        // Apply assessment details if found
        switchMap(assessmentDetails => {
          if (assessmentDetails) {
            this.currentAssessmentId = assessmentDetails.assessment_uuid;
            this.workflowService.setCurrentAssessmentId(this.currentAssessmentId);
            this.applyAssessmentDetails(assessmentDetails);
          }

          // Fetch *all* existing AI MCQs for the job, as assessmentDetails only contains *selected* ones.
          // This is crucial to populate `section.questions` for all skills.
          return this.jobService.job_post_mcqs_list_api(this.jobUniqueId, token).pipe(
            tap(mcqResponse => {
              const skillData = mcqResponse.data;
              this.skillSections.forEach(section => {
                if (skillData[section.skillName]) {
                  const processedQuestions = this.processMcqItems(skillData[section.skillName].mcq_items);
                  section.questions = processedQuestions;
                  section.totalCount = processedQuestions.length;
                  // If assessment details were applied, re-apply selections to these newly loaded questions
                  if (assessmentDetails && assessmentDetails.selected_mcqs) {
                      const selectedMcqIds = new Set(assessmentDetails.selected_mcqs.map((q: any) => q.mcq_item_details.id));
                      section.questions.forEach(q => {
                          if (selectedMcqIds.has(q.mcq_item_id)) {
                              q.isSelected = true;
                          }
                      });
                  }
                  this.updateCountsForSection(section);
                }
              });
              this.cdr.detectChanges(); // Update UI after populating all AI questions
            }),
            catchError(err => {
              console.error('Failed to load initial AI questions:', err);
              this.showErrorPopup(`Failed to load initial AI questions: ${err.message}`);
              return of(null);
            }),
            map(() => assessmentDetails) // Pass assessmentDetails to the next tap for final processing
          );
        }),
        // Final updates after all data and selections are processed
        tap(assessmentDetails => {
            // This tap ensures selection counts are up-to-date across all tabs
            this.updateCounts();
            this.cdr.detectChanges(); // Final UI update after all selections and counts
        }),
        finalize(() => {
          this.isLoading = false;
          this.spinner.hide('main-spinner');
          this.cdr.detectChanges(); // Ensure final UI update after spinner hides
          this.generateRemainingSkillsSequentially(); // Start generating pending skills in background
          
          // Small delay for DOM to settle before calculating carousel state
          setTimeout(() => {
            this.calculateCarouselState();
            this.updateSliderFill();
            this.cdr.detectChanges(); // Final UI update after carousel calculations
          }, 50);
        })
      ).subscribe({
        error: (err) => {
          console.error('Error in main data loading pipeline:', err);
          this.showErrorPopup(`An error occurred during data loading: ${err.message}`);
          this.isLoading = false;
          this.spinner.hide('main-spinner');
          this.cdr.detectChanges(); // Update UI with error state
        }
      })
    );
  }

  /**
   * Opens the 'Add New Skill' popup.
   */
  openAddSkillPopup(): void {
    this.newSkillName = ''; // Reset input field
    this.showAddSkillPopup = true;
  }

  /**
   * Closes the 'Add New Skill' popup.
   */
  closeAddSkillPopup(): void {
    if (this.isAddingNewSkill) return; // Prevent closing while processing
    this.showAddSkillPopup = false;
  }

   /**
   * MODIFIED: Handles the submission of new skills from the popup.
   * It now adds all skill tabs to the UI at once before starting the sequential generation.
   */
  onAddNewSkillSubmit(): void {
    if (this.isAddingNewSkill) return;

    // 1. Parse and Validate the input string (same as before)
    const skillNames = this.newSkillName
      .split(',')
      .map(skill => skill.trim())
      .filter(skill => skill.length > 0);

    if (skillNames.length === 0) {
      this.showErrorPopup('Please enter at least one valid skill name.');
      return;
    }

    const existingSkillNames = new Set(this.skillSections.map(s => s.skillName.toLowerCase()));
    const newValidSkills = [];
    for (const skill of skillNames) {
      if (existingSkillNames.has(skill.toLowerCase())) {
        this.showErrorPopup(`The skill "${skill}" already exists.`);
        return;
      }
      newValidSkills.push(skill);
    }

    // 2. === NEW LOGIC: Add ALL new skill tabs to the UI at once ===
    const firstNewSkillIndex = this.skillSections.length;

    for (const skillName of newValidSkills) {
      const newSection: SkillSection = {
        skillName,
        questions: [],
        totalCount: 0,
        selectedCount: 0,
        isAllSelected: false,
        generationStatus: 'loading', // Set status to 'loading' immediately
      };
      this.skillSections.push(newSection);
    }

    // 3. Update the UI to show all new tabs with spinners
    this.closeAddSkillPopup();
    setTimeout(() => {
      this.calculateCarouselState();
      // Scroll to the first of the newly added tabs
      if (this.skillTrack?.nativeElement) {
          const firstNewTabElement = this.skillTrack.nativeElement.children[firstNewSkillIndex] as HTMLElement;
          if (firstNewTabElement) {
              const newScrollPosition = firstNewTabElement.offsetLeft;
              this.renderer.setStyle(this.skillTrack.nativeElement, 'transform', `translateX(-${newScrollPosition}px)`);
          }
      }
      this.activeSectionIndex = firstNewSkillIndex; // Select the first new skill tab
      this.cdr.detectChanges();
    }, 100);

    // 4. Start the background processing for the list of skills
    this.processNewSkillsSequentially(newValidSkills);
  }

  /**
   * MODIFIED: Processes a list of new skills one by one.
   * This function NO LONGER adds tabs to the UI. It only finds the existing placeholder tabs and updates them.
   * @param skillsToProcess An array of validated, non-duplicate skill names.
   */
  private async processNewSkillsSequentially(skillsToProcess: string[]): Promise<void> {
    this.isAddingNewSkill = true;
    const token = this.authService.getJWTToken();
    if (!token) {
      this.showErrorPopup('Authentication error.');
      this.isAddingNewSkill = false;
      return;
    }

    console.log(`Starting background generation for: ${skillsToProcess.join(', ')}`);

    for (const skillName of skillsToProcess) {
      // Find the placeholder section that we already created in the UI
      const sectionToUpdate = this.skillSections.find(
        s => s.skillName === skillName && s.generationStatus === 'loading'
      );
      
      // Safety check in case the section is not found
      if (!sectionToUpdate) {
        console.warn(`Could not find placeholder for skill "${skillName}". Skipping.`);
        continue;
      }

      try {
        // Await the API call for the current skill in the loop
        const response = await this.jobService.generateMcqForSkill(this.jobUniqueId, skillName, token).toPromise();
        
        const newQuestions = this.processMcqItems(response.data);
        
        // Update the existing section with the results
        sectionToUpdate.questions = newQuestions;
        sectionToUpdate.totalCount = newQuestions.length;
        sectionToUpdate.generationStatus = 'completed'; // Change status
        this.updateCounts();
        this.cdr.detectChanges(); // Refresh the UI for this specific tab

      } catch (err: any) {
        console.error(`Failed to generate questions for new skill: ${skillName}`, err);
        this.showErrorPopup(`Error for skill "${skillName}": ${err.message}`);
        
        // Update status to 'failed' on error
        sectionToUpdate.generationStatus = 'failed';
        this.cdr.detectChanges(); // Refresh the UI for this specific tab
      }
    }

    this.isAddingNewSkill = false;
    console.log("Finished background generation for all new skills.");
  }
  
  /**
   * NEW: Applies assessment details to the form and pre-selects questions.
   * This is a unified method to be called after any assessment details are fetched (either initial or latest).
   */
  private applyAssessmentDetails(assessmentDetails: any): void {
      if (!assessmentDetails) {
        console.log("No assessment details to apply.");
        return;
      }
      
      console.log("Applying assessment details:", assessmentDetails);

      this.assessmentForm.patchValue({
          assessmentName: assessmentDetails.name,
          shuffleQuestions: assessmentDetails.shuffle_questions_overall,
          isProctored: assessmentDetails.is_proctored,
          allowPhoneAccess: assessmentDetails.allow_phone_access,
          allowVideoRecording: assessmentDetails.has_video_recording,
          difficulty: assessmentDetails.difficulty,
          timeLimit: this.minutesToHHMM(assessmentDetails.time_limit),
      }, { emitEvent: false }); // Prevent infinite loops if form control value changes trigger other logic
      this.cdr.detectChanges(); // Update UI with form values


      // Pre-select Uploaded MCQs
      if (assessmentDetails.selected_mcqs && this.uploadedSkillSections.length > 0) {
          const selectedUploadedIds = new Set(assessmentDetails.selected_mcqs.map((q: any) => q.mcq_item_details.id));
          this.uploadedSkillSections.forEach(section => {
              section.questions.forEach(q => {
                  if (selectedUploadedIds.has(q.id)) {
                      q.isSelected = true;
                  }
              });
              this.updateCountsForUploadedSection(section);
          });
          this.cdr.detectChanges();
      }
      
      // Pre-select Coding Problems
      if (assessmentDetails.selected_coding_problems && this.codingProblems.length > 0) {
        const selectedCodingIds = new Set(assessmentDetails.selected_coding_problems.map((p: any) => p.coding_problem_details.id));
        
        this.codingProblems.forEach(problem => {
          if (selectedCodingIds.has(problem.id)) {
            problem.isSelected = true;
          }
        });
        this.onCodingProblemSelectionChange(); // Update counts and 'select all' state
        this.cdr.detectChanges();
      }
      this.updateCounts(); // Update all combined counts
      this.cdr.detectChanges(); // Explicitly detect changes after selections are applied
  }
  
  /**
   * NEW: Asynchronously generates MCQs for all pending skills, one by one.
   * Updates the UI in real-time as each skill's questions are fetched.
   */
    private async generateRemainingSkillsSequentially(): Promise<void> {
    if (this.isGeneratingSequentially) {
      console.log("Sequential generation is already in progress. Skipping.");
      return;
    }
    this.isGeneratingSequentially = true;
    console.log("Starting sequential generation for skills in 'pending' state.");

    const token = this.authService.getJWTToken();
    if (!token) {
      this.showErrorPopup('Authentication error while generating questions.');
      this.isGeneratingSequentially = false;
      return;
    }

    // Filter for skills that are genuinely pending
    const pendingSections = this.skillSections.filter(s => s.generationStatus === 'pending');
    console.log(`Found ${pendingSections.length} skills to process.`);

    for (const section of pendingSections) {
      try {
        console.log(`Generating questions for skill: ${section.skillName}`);
        section.generationStatus = 'loading';
        this.cdr.detectChanges(); // Update UI to show spinner for this tab
        
        // This service call now returns the new questions in the response
        const response = await this.jobService.generateMcqForSkill(this.jobUniqueId, section.skillName, token).toPromise();
        
        // **CRUCIAL UPDATE**: Process the returned data
        const newQuestions = this.processMcqItems(response.data);
        
        // Append new questions to the section
        section.questions = [...section.questions, ...newQuestions];
        section.totalCount = section.questions.length;
        section.generationStatus = 'completed'; // Mark as complete
        this.updateCountsForSection(section);
        this.updateCounts(); // Update total counts
        this.cdr.detectChanges(); // Refresh UI with new questions
        console.log(`SUCCESS: Completed generation for '${section.skillName}'. Added ${newQuestions.length} questions.`);

      } catch (error: any) {
        section.generationStatus = 'failed';
        console.error(`FAILED to generate questions for '${section.skillName}':`, error);
        this.showErrorPopup(`Could not generate questions for ${section.skillName}: ${error.message || 'Server error'}`);
        this.cdr.detectChanges(); // Update UI to show failure icon
      }
    }
    
    this.isGeneratingSequentially = false;
    console.log("Finished sequential generation process.");
  }
  
  // ... (rest of the component code, largely unchanged)

  // Example of using cdr.detectChanges() in a setter if you had one
  // set activeTab(value: 'ai-generated' | 'uploaded' | 'coding-problem') {
  //   this._activeTab = value;
  //   this.cdr.detectChanges();
  // }
  // get activeTab() { return this._activeTab; }


  /**
   * Helper function to extract options from the full question text.
   * Assumes the format where options follow the question text.
   */
  private extractOptionsFromQuestionText(questionText: string): string[] {
    // console.log('[extractOptionsFromQuestionText] Input questionText:', questionText); // Too verbose, uncomment for debug

    const options: string[] = [];
    const optionLabels = ['a)', 'b)', 'c)', 'd)'];
    let remainingText = questionText.toLowerCase();

    for (let i = 0; i < optionLabels.length; i++) {
      const start = remainingText.indexOf(optionLabels[i]);
      if (start < 0) {
        // console.log(`[extractOptionsFromQuestionText] No option "${optionLabels[i]}" found, breaking.`); // Too verbose
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
        // console.log(`[extractOptionsFromQuestionText] Extracted option: "${optionText}"`); // Too verbose
        options.push(optionText);
      }
    }

    // console.log('[extractOptionsFromQuestionText] Final options array:', options); // Too verbose
    return options.length ? options : [];
  }

  /**
   * Helper to extract the 'Correct: x)' answer from question text.
   */
  private extractCorrectAnswerFromQuestionText(questionText: string): string {
    // console.log('[extractCorrectAnswerFromQuestionText] Input questionText:', questionText); // Too verbose
    const correctIndex = questionText.indexOf('correct:');
    if (correctIndex < 0) {
      // console.log('[extractCorrectAnswerFromQuestionText] "Correct:" not found in question text.'); // Too verbose
      return '';
    }
    let correctPart = questionText.substring(correctIndex + 8).trim();
    const match = correctPart.match(/[a-d]\)?/i);
    const answer = match ? match[0] : correctPart;
    // console.log(`[extractCorrectAnswerFromQuestionText] Parsed answer: "${answer}"`); // Too verbose
    return answer;
  }

  private parseUploadedQuestionText(rawText: string): ParsedDetails {
    const questionMatch = rawText.match(/^([\s\S]*?)(?=\na\))/i);
    
    const optionsRegex = /^([a-d])\)\s*([\s\S]*?)(?=\n[a-d]\)|\nCorrect Answer:|$)/gmi;
    const optionsMatch = [];
    let match;
    while ((match = optionsRegex.exec(rawText)) !== null) {
      optionsMatch.push(match);
    }

    const correctMatch = rawText.match(/Correct Answer:\s*([a-d])/i);

    const difficultyMatch = rawText.match(/\(?\b(Easy|Medium|Hard)\b\)?$/i);

    return {
      question: questionMatch ? questionMatch[1].replace(/✨/g, '').trim() : 'Could not parse question',
      options: optionsMatch.map(m => m[2].trim()),
      correctAnswer: correctMatch ? correctMatch[1].toLowerCase() : '',
      difficulty: difficultyMatch ? difficultyMatch[1] : 'Medium'
    };
  }

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
     * Parses the raw question text from the database into a structured object by first removing metadata.
     * @param rawText The full string containing the question, options, answer, and difficulty.
     * @returns A `ParsedDetails` object with clean data.
     */
    private parseQuestionText(rawText: string): ParsedDetails {
        if (!rawText) {
            return { question: 'Error: Empty question text.', options: [], correctAnswer: '', difficulty: 'Medium' };
        }

        let textToParse = rawText;

        // 1. Find and extract the correct answer letter.
        let correctAnswer = '';
        const answerMatch = textToParse.match(/Correct Answer:\s*([a-d])/i);
        if (answerMatch) {
            correctAnswer = answerMatch[1].toLowerCase();
            // IMPORTANT: Remove the "Correct Answer" part from the string to prevent it from being included in the last option.
            textToParse = textToParse.substring(0, answerMatch.index).trim();
        }

        // 2. Find and extract difficulty.
        let difficulty = 'Medium'; // Default
        const difficultyMatch = textToParse.match(/\s*\((Easy|Medium|Hard)\)$/i); // Look for (Difficulty) at the very end
        if (difficultyMatch) {
            difficulty = difficultyMatch[1].charAt(0).toUpperCase() + difficultyMatch[1].slice(1).toLowerCase();
            // Remove the difficulty part from the string.
            textToParse = textToParse.substring(0, difficultyMatch.index).trim();
        }

        // `textToParse` is now clean and should only contain the question and options.

        // 3. Extract the main question. It's everything before the first option marker 'a)'.
        let question = `Question could not be parsed: ${rawText.substring(0, 50)}...`;
        const firstOptionIndex = textToParse.toLowerCase().indexOf('a)');
        
        if (firstOptionIndex !== -1) {
            question = textToParse.substring(0, firstOptionIndex).replace(/^Q\d+\.\s*/, '').trim();
        } else {
             // Fallback if 'a)' is somehow missing
            question = textToParse.trim();
        }

        // 4. Extract the options from the now-clean string.
        const options: string[] = [];
        // This regex is safer now because "Correct Answer" is gone. It will find text between option markers.
        const optionsRegex = /\b([a-d])\)\s*([\s\S]*?)(?=\s*[a-d]\)|$)/gi;
        let optionParseResult;
        const tempOptions: { [key: string]: string } = {};

        while ((optionParseResult = optionsRegex.exec(textToParse)) !== null) {
            const letter = optionParseResult[1].toLowerCase();
            const text = optionParseResult[2].trim();
            tempOptions[letter] = text;
        }
        
        // Ensure options are always returned in order a, b, c, d
        for (const letter of ['a', 'b', 'c', 'd']) {
            options.push(tempOptions[letter] || '');
        }

        return {
            question,
            options,
            correctAnswer,
            difficulty
        };
    }


  private initializeForm(): void {
    this.assessmentForm = this.fb.group({
      assessmentName: ['', 
        [Validators.required, Validators.maxLength(50), Validators.pattern('^(?=.*[a-zA-Z])[a-zA-Z0-9 ]*$')]],
      shuffleQuestions: [true],
      isProctored: [true],
      allowPhoneAccess: [true],
      allowVideoRecording: [true],
      difficulty: [0.6],
      timeLimit: ['01:00', 
        [Validators.required, 
          Validators.pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
          timeNotZeroValidator 
        ]],
    });
  }

  /**
   * NEW: Generates a detailed error message string from form validation errors.
   * @returns A string listing all current validation errors.
   */
  private getFormValidationErrors(): string {
    const errors: string[] = [];
    const controls = this.assessmentForm.controls;
  
    if (controls.assessmentName.errors) {
      if (controls.assessmentName.errors.required) {
        errors.push('Assessment Name is required.');
      }
      if (controls.assessmentName.errors.pattern) {
        errors.push('Please enter a correct Assessment name (letters and numbers only).');
      }
    }
  
    if (controls.timeLimit.errors) {
      if (controls.timeLimit.errors.required) {
        errors.push('Time Limit is required.');
      }
      if (controls.timeLimit.errors.pattern) {
        errors.push('Time Limit must be in HH:MM format.');
      }
      if (controls.timeLimit.errors.timeIsZero) { // Check for the custom error key
        errors.push('Time Limit cannot be 00:00.');
      }
    }
  
    return errors.join(' \n'); // Join with a newline for better readability in the popup
  }

  // loadExistingAssessment and fetchNewMcqList are less critical now with loadAllInitialData
  // They are only called by checkAndLoadAssessment, which is itself largely superseded
  private loadExistingAssessment(assessmentId: string): void {
    // This method's core logic is now largely integrated into loadAllInitialData
    // and applyAssessmentDetails. This version might be redundant or require re-thinking
    // its purpose if it's meant to *replace* the initial load.
    console.warn("loadExistingAssessment is called, consider if it's redundant with loadAllInitialData.");
    // For now, it will simply re-call the main orchestration if needed or rely on it.
    this.loadAllInitialData();
  }

  private fetchNewMcqList(): void {
    // This method's core logic is now largely integrated into loadAllInitialData
    console.warn("fetchNewMcqList is called, consider if it's redundant with loadAllInitialData.");
    // For now, it will simply re-call the main orchestration if needed or rely on it.
    this.loadAllInitialData();
  }


  ngAfterViewInit(): void {
    // These calls are also handled in finalize of loadAllInitialData,
    // but a slight delay here can help if browser rendering is slow
    setTimeout(() => {
      this.updateSliderFill();
      this.calculateCarouselState();
      this.cdr.detectChanges(); 
    }, 100);
  }

  showSuccessPopup(message: string) {
    this.popupMessage = message;
    this.popupType = 'success';
    this.showPopup = true;
    this.cdr.detectChanges();
    setTimeout(() => this.closePopup(), 3000);
  }
  showErrorPopup(message: string) {
    this.popupMessage = message;
    this.popupType = 'error';
    this.showPopup = true;
    this.cdr.detectChanges();
    setTimeout(() => this.closePopup(), 5000);
  }
  closePopup() {
    this.showPopup = false;
    this.popupMessage = '';
    this.cdr.detectChanges();
  }

private openAlert(message: string, buttons: string[]) {
  this.alertMessage = message;
  this.alertButtons = buttons;
  this.showAlert = true;
  this.cdr.detectChanges();
}

onAlertButtonClicked(action: string) {
  this.showAlert = false;
  this.cdr.detectChanges();

  if (action.toLowerCase() === 'cancel' || action.toLowerCase() === 'no') {
    this.actionContext = null;
    return;
  }
  
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

  toggleSelectAllForUploadedSection(event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    const section = this.uploadedSkillSections[this.activeUploadedSectionIndex];

    if (section) {
      section.isAllSelected = isChecked;
      section.questions.forEach(q => q.isSelected = isChecked);
      this.updateCounts();
    }
  }

  onUploadedQuestionSelectionChange(): void {
    const activeUploadedSection = this.uploadedSkillSections[this.activeUploadedSectionIndex];
    if (activeUploadedSection) {
      activeUploadedSection.isAllSelected = activeUploadedSection.questions.length > 0 && activeUploadedSection.questions.every(q => q.isSelected);
      this.updateCountsForUploadedSection(activeUploadedSection);
    }
    this.updateCounts();
  }

  private checkAndLoadAssessment(): void {
    // This method is now likely redundant as loadAllInitialData covers its concerns.
    console.warn("checkAndLoadAssessment is called, consider if it's redundant with loadAllInitialData.");
    this.loadAllInitialData(); // Fallback to main orchestration
  }

  private calculateCarouselState(): void {
    if (!this.skillViewport || !this.skillTrack || this.skillSections.length === 0) {
      this.maxScrollIndex = 0;
      this.cdr.detectChanges();
      return;
    }
    if (!this.skillViewport.nativeElement || !this.skillTrack.nativeElement) {
      this.maxScrollIndex = 0;
      this.cdr.detectChanges();
      return;
    }

    const trackWidth = this.skillTrack.nativeElement.scrollWidth;
    const viewportWidth = this.skillViewport.nativeElement.offsetWidth;
    
    if (trackWidth <= viewportWidth) {
      this.maxScrollIndex = 0;
    } else {
      // Corrected line: Cast firstElementChild to HTMLElement
      const firstChildElement = this.skillTrack.nativeElement.firstElementChild as HTMLElement;
      const firstChildWidth = firstChildElement?.offsetWidth || 1; // Use optional chaining for safety
      
      this.maxScrollIndex = this.skillSections.length - Math.floor(viewportWidth / firstChildWidth);
      if (this.maxScrollIndex < 0) this.maxScrollIndex = 0;
    }

    if (this.currentScrollIndex > this.maxScrollIndex) {
        this.currentScrollIndex = this.maxScrollIndex;
    }
    this.cdr.detectChanges();
  }

  private updateScrollPosition(): void {
    if (this.skillTrack?.nativeElement && this.skillTrack.nativeElement.children.length > 0) {
      const targetItem = this.skillTrack.nativeElement.children[this.currentScrollIndex] as HTMLElement;
      if (targetItem) {
        const track = this.skillTrack.nativeElement;
        const viewport = this.skillViewport.nativeElement;
        const maxScrollLeft = Math.max(0, track.scrollWidth - viewport.offsetWidth);
        let newX = targetItem.offsetLeft;

        if (newX > maxScrollLeft) {
            newX = maxScrollLeft;
        }

        this.renderer.setStyle(track, 'transform', `translateX(-${newX}px)`);
        this.cdr.detectChanges();
      }
    }
  }

  navigateCarousel(direction: 'prev' | 'next'): void {
    const newIndex = direction === 'next' ? this.currentScrollIndex + 1 : this.currentScrollIndex - 1;
    if (newIndex >= 0 && newIndex <= this.maxScrollIndex) {
        this.currentScrollIndex = newIndex;
        this.updateScrollPosition();
    }
  }

  onDifficultyChange(event: Event): void {
    const value = (event.target as HTMLInputElement).valueAsNumber;
    this.assessmentForm.get('difficulty')?.setValue(value / 100);
    this.updateSliderFill();
  }

  private updateSliderFill(): void {
    if (this.difficultySlider?.nativeElement) {
      const slider = this.difficultySlider.nativeElement;
      const value = slider.valueAsNumber;
      slider.style.setProperty('--fill-percentage', `${value}%`);
      this.cdr.detectChanges();
    }
  }

  get difficultyPercentage(): number {
    return (this.assessmentForm.get('difficulty')?.value || 0) * 100;
  }

  toggleSelectAllForSection(event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    const activeSection = this.skillSections[this.activeSectionIndex];
    if (activeSection) {
      activeSection.isAllSelected = isChecked;
      activeSection.questions.forEach(q => q.isSelected = isChecked);
      this.updateCounts();
    }
  }

  toggleSelectAllCoding(event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    this.isAllCodingSelected = isChecked;
    this.codingProblems.forEach(problem => problem.isSelected = isChecked);
    this.updateCodingSelectedCount();
  }

  onCodingProblemSelectionChange(): void {
    this.isAllCodingSelected = this.codingProblems.length > 0 && this.codingProblems.every(p => p.isSelected);
    this.updateCodingSelectedCount();
  }

  private updateCodingSelectedCount(): void {
    this.codingProblemsSelectedCount = this.codingProblems.filter(p => p.isSelected).length;
    this.cdr.detectChanges();
  }

  getSelectedCodingCount(): number {
    return this.codingProblems.filter(p => p.isSelected).length;
  }

  onQuestionSelectionChange(): void {
    const activeSection = this.skillSections[this.activeSectionIndex];
    if (activeSection) {
      activeSection.isAllSelected = activeSection.questions.length > 0 && activeSection.questions.every(q => q.isSelected);
      this.updateCountsForSection(activeSection);
    }
    this.updateCounts();
  }

  private updateCountsForSection(section: SkillSection): void {
     section.selectedCount = section.questions.filter(q => q.isSelected).length;
     this.cdr.detectChanges();
  }

  private updateCountsForUploadedSection(section: UploadedSkillSection): void {
    section.selectedCount = section.questions.filter(q => q.isSelected).length;
    this.cdr.detectChanges();
  }

  private updateCounts(): void {
    this.skillSections.forEach(section => this.updateCountsForSection(section));
    this.uploadedSkillSections.forEach(section => this.updateCountsForUploadedSection(section));
    this.cdr.detectChanges();
  }

  get totalSelectedCount(): number {
    const aiSelectedCount = this.skillSections?.reduce((acc, section) => acc + section.selectedCount, 0) || 0;
    const uploadedSelectedCount = this.uploadedSkillSections?.reduce((acc, section) => acc + section.selectedCount, 0) || 0;
    const codingSelectedCount = this.codingProblems?.filter(p => p.isSelected).length || 0;
    return aiSelectedCount + uploadedSelectedCount + codingSelectedCount;
  }

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

  selectSection(index: number) {
    if (this.activeTab === 'ai-generated') {
      this.activeSectionIndex = index;
    } else {
      this.activeUploadedSectionIndex = index; // This path might be wrong for selectSection
    }
    this.cdr.detectChanges();
  }

  selectUploadedSection(index: number) {
    this.activeUploadedSectionIndex = index;
    this.cdr.detectChanges();
  }

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

    if (this.assessmentForm.invalid) {
      // MODIFICATION: Also use the dynamic error message for saving drafts
      const errorMessages = this.getFormValidationErrors();
      this.showErrorPopup(errorMessages || 'Please fill in all required fields correctly.');
      return;
    }

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
      // MODIFICATION: Call the new helper to get specific error messages
      const errorMessages = this.getFormValidationErrors();
      this.showErrorPopup(errorMessages || 'Please fill in all required fields correctly.');
      return;
    }
    if (this.totalSelectedCount === 0) {
      this.showErrorPopup('Please select at least one question.');
      return;
    }
    this.actionContext = { action: 'next' };
    this.openAlert('Are you sure you want to save and proceed?', ['Cancel', 'Save & Next']);
  }

  onPreviousConfirmed(): void { this.router.navigate(['/admin-create-job-step2']); }

  onSkipConfirmed(): void { this.router.navigate(['/admin-create-job-step4']); }

  onCancelConfirmed(): void {
    this.workflowService.clearWorkflow();
    this.showSuccessPopup('Job post creation cancelled.');
    setTimeout(() => {
        this.router.navigate(['/admin-create-job-step1']);
    }, 2000);
  }

  private minutesToHHMM(minutes: number): string {
    if (isNaN(minutes) || minutes < 0) return '00:00';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  private buildPayload(): any {
    const selectedIds = this.skillSections
      .reduce((acc, s) => acc.concat(s.questions), [] as McqQuestion[])
      .filter(q => q.isSelected)
      .map(q => q.mcq_item_id);

    const selectedUploadedIds = this.uploadedSkillSections
      .reduce((acc, s) => acc.concat(s.questions), [] as UploadedQuestion[])
      .filter(q => q.isSelected)
      .map(q => q.id);

    const selectedCodingProblemIds = this.codingProblems
      .filter(p => p.isSelected)
      .map(p => p.id);

    const selectedAllIds = [...selectedIds, ...selectedUploadedIds];
    
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

  onSaveDraftConfirmed(): void {
    this.assessmentForm.markAllAsTouched();
    
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

    const saveOperation = this.currentAssessmentId
      ? this.jobService.updateAssessment(this.currentAssessmentId, payload, token)
      : this.jobService.saveAssessment(payload, token);

    this.subscriptions.add(
      saveOperation.pipe(
        finalize(() => {
            this.isSubmitting = false;
            this.spinner.hide('main-spinner');
        })
      ).subscribe({
        next: (response: any) => {
          if (response && response.assessment_uuid && !this.currentAssessmentId) {
            this.currentAssessmentId = response.assessment_uuid;
            this.workflowService.setCurrentAssessmentId(response.assessment_uuid);
          }
          
          this.showSuccessPopup('Draft saved successfully!');
          
          setTimeout(() => {
            this.router.navigate(['/admin-create-job-step1']);
          }, 2000);
        },
        error: (err) => {
          this.showErrorPopup(`Save failed: ${err.message}`);
        }
      })
    );
  }

  onNextConfirmed(): void {
    this.assessmentForm.markAllAsTouched();
    
    if (this.assessmentForm.invalid) {
      // MODIFICATION: Call the new helper to get specific error messages
      const errorMessages = this.getFormValidationErrors();
      this.showErrorPopup(errorMessages || 'Please fill in all required fields correctly.');
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
    
    const saveOperation = this.currentAssessmentId
      ? this.jobService.updateAssessment(this.currentAssessmentId, payload, token)
      : this.jobService.saveAssessment(payload, token);
    
    this.subscriptions.add(
      saveOperation.pipe(
        finalize(() => {
            this.isSubmitting = false;
            this.spinner.hide('main-spinner');
        })
      ).subscribe({
        next: (response: any) => {
          if (response && response.assessment_uuid && !this.currentAssessmentId) {
            this.currentAssessmentId = response.assessment_uuid;
            this.workflowService.setCurrentAssessmentId(response.assessment_uuid);
          }
          
          this.showSuccessPopup('Assessment saved successfully!');
          
          setTimeout(() => {
            this.router.navigate(['/admin-create-job-step4']);
          }, 2000);
        },
        error: (err) => {
          this.showErrorPopup(`Save failed: ${err.message}`);
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
  
  loadUserProfile(): void {
    const profileData = localStorage.getItem('userProfile');
    if (profileData) this.userProfile = JSON.parse(profileData);
  }
}