import { Component, ContentChild, Input, TemplateRef, OnDestroy, OnInit, ViewChild, ElementRef, AfterViewInit, Inject } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { TrialAssessmentService } from '../../services/trial-assessment.service';
import { Subscription } from 'rxjs';
import { VideoRecorderService } from '../../services/video-recorder.service';
import { ProctoringService } from '../../services/proctoring.service';
import { Router, ActivatedRoute } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { lastValueFrom } from 'rxjs';
import { DOCUMENT } from '@angular/common';

import { RouterModule } from '@angular/router'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'

import { AlertMessageComponent } from 'src/app/components/alert-message/alert-message.component';
import { AssessmentWarningPopup } from 'src/app/components/assessment-warning-popup/assessment-warning-popup.component';
import { ProblemDescriptionComponent } from 'src/app/components/problem-description/problem-description.component';
import { CodeEditorComponent } from '../../components/code-editor/code-editor.component';
import { CodingTestResultsComponent } from 'src/app/components/coding-test-results/coding-test-results.component';

import { TimerFormatPipe } from 'src/app/pipe/timer-format.pipe';

interface SelectedAnswer {
  answer: string;
  section_id: number;
  answerValue?: any;
}

interface CodingSolution {
  code: string;
  language: { name: string; id: number; mode: string };
}

// MODIFICATION START: Define a more flexible type for coding submissions
interface CodingSubmission {
  id: number;
  score: number;
  source_code?: string; // Optional: for auto-submission
  language_id?: number; // Optional: for auto-submission
}
// MODIFICATION END

@Component({
  selector: 'app-flashyre-assessment11',
  standalone: true,
  imports: [ RouterModule, FormsModule, CommonModule,
    AlertMessageComponent, AssessmentWarningPopup, 
    ProblemDescriptionComponent, CodeEditorComponent, CodingTestResultsComponent,
    TimerFormatPipe,
  ],
  templateUrl: './flashyre-assessment11.component.html',
  styleUrls: ['./flashyre-assessment11.component.css'],
})
export class FlashyreAssessment11 implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('numbersContainer', { read: ElementRef }) numbersContainer: ElementRef<HTMLDivElement>;
  @ViewChild(CodeEditorComponent) private codeEditorComponent: CodeEditorComponent;
  @ContentChild('endTestText') endTestText: TemplateRef<any>;
  @Input() logoSrc: string = '/assets/main-logo/logo%20-%20flashyre(1500px)-200h.png';
  @Input() rootClassName: string = '';
  @Input() logoAlt: string = 'image';

  // ### MODIFICATION START: New properties for loading and alert state ###
  isLoading = true; // Used to hide the assessment UI until data is successfully fetched
  showNoAttemptsAlert = false;
  showErrorRedirectAlert = false;
  alertMessage = '';
  showAlertButtons: string[] = [];
  // ### MODIFICATION END ###

  // ### MODIFICATION START ###
  showSuccessPopup = false;
  successPopupMessage = '';
  private successPopupTimeout: any;

  private assessmentEndTime: number;
  // ### MODIFICATION END ###

  showWarningPopup = false;
  totalQuestionsInSection: number;
  isLastSection: boolean;
  currentQuestionIndex: number = 0;
  currentSectionIndex: number = 0;
  totalSections: number;
  assessmentData: any = {};
  sections: any[] = [];
  currentSection: any;
  currentQuestions: any[] = [];
  timer: number;
  userId: string | null;
  startTime: Date;
  videoPath: string | null;
  sectionTimer: number = 0;
  currentQuestion: any = {};
  userResponses: { [key: string]: any } = {};
  currentOptions: any[] = [];
  isLastQuestionInSection = false;
  hasQuestions: boolean = false;

  selectedAnswers: { [question_id: number]: SelectedAnswer } = {};
  questionStates: { [key: number]: 'unvisited' | 'visited' | 'answered' } = {};
  sectionTimers: { [section_id: number]: number } = {};
  
  expiredSections: Set<number> = new Set();

  // NEW: Add a dictionary to store test results for each problem
  private codingResults: { [problemId: number]: string[] } = {};

  isCodingSection = false;
  results: string[] = [];
  
  // MODIFICATION: Use the new CodingSubmission interface
  codingSubmissions: { [problem_id: number]: CodingSubmission } = {};
  codingSolutions: { [problemId: number]: CodingSolution } = {};

  showTestResults = false;

  private timerSubscription: Subscription;
  private sectionTimerInterval: any;
  private timerInterval: any;
  private violationSubscription: Subscription;
  private isCleanedUp = false;

  elem: any;

  constructor(
    private title: Title,
    private meta: Meta,
    private trialAssessmentService: TrialAssessmentService,
    private videoRecorder: VideoRecorderService,
    private proctoringService: ProctoringService,
    private router: Router,
    private spinner: NgxSpinnerService,
    private route: ActivatedRoute,
    @Inject(DOCUMENT) private document: any
  ) {
    this.currentQuestionIndex = 0;
    this.title.setTitle('Flashyre-Assessment11 - Flashyre');
    this.meta.addTags([
      {
        property: 'og:title',
        content: 'Flashyre-Assessment11 - Flashyre',
      },
    ]);
  }


  /**
   * Displays a user-friendly message for 3 seconds and then redirects to the home page.
   * This is used for unrecoverable errors.
   * @param logMessage A detailed message to log to the console for debugging.
   */
  private handleFatalErrorAndRedirect(logMessage: string): void {
    console.error(logMessage); // Log the specific error for debugging.

    // Ensure all other popups are hidden to avoid overlap.
    this.isLoading = false;
    this.showNoAttemptsAlert = false;
    this.showWarningPopup = false;
    this.showSuccessPopup = false;
    
    // Set the message and show the new alert.
    this.alertMessage = 'Something went wrong, your data is safe, redirecting you to home page';
    this.showAlertButtons = []; // No buttons needed for a timed alert.
    this.showErrorRedirectAlert = true;

    // Redirect the user after 3 seconds.
    setTimeout(() => {
      this.router.navigate(['/candidate-home']);
    }, 3000);
  }


  ngAfterViewInit(): void {
    this.scrollToActiveQuestion();
  }

  async ngOnInit(): Promise<void> {
    this.elem = document.documentElement;
    this.violationSubscription = this.proctoringService.violation$.subscribe(() => {
      this.terminateTest(true);
    });

    const assessmentId = this.route.snapshot.queryParamMap.get('id');
    this.userId = localStorage.getItem('user_id');
    
    if (assessmentId && this.userId) {
      this.fetchAssessmentData(+assessmentId);
      this.startTime = new Date();
    } else {
      this.handleFatalErrorAndRedirect('No assessment ID or user ID provided in ngOnInit.');
    }
  }

  private async cleanupResources(): Promise<void> {
    if (this.isCleanedUp) return;
    this.isCleanedUp = true;

    try {
      if (this.timerSubscription) this.timerSubscription.unsubscribe();
      clearInterval(this.timerInterval);
      if (this.sectionTimerInterval) clearInterval(this.sectionTimerInterval);
      this.videoPath = await this.videoRecorder.stopRecording();
      this.proctoringService.stopMonitoring();
    } catch (error) {
      console.error('Error during cleanupResources:', error);
    }
  }

  ngOnDestroy(): void {
    if (this.violationSubscription) this.violationSubscription.unsubscribe();
    this.cleanupResources();
    this.closeFullscreen();
    if (this.successPopupTimeout) {
      clearTimeout(this.successPopupTimeout);
    }
  }

// In flashyre-assessment11.component.ts

fetchAssessmentData(assessmentId: number): void {
  console.log(`DEBUG: [Component] fetchAssessmentData called for ID: ${assessmentId}`);
  
  this.trialAssessmentService.getAssessmentDetails(assessmentId).subscribe({
    next: async (response: any) => {
      console.log('DEBUG: [Component] Entered SUBSCRIBE "next" block. Raw response:', response);
      this.isLoading = false;

      // It's safer to check if response exists before accessing properties
      if (!response || !response.status) {
        console.error("DEBUG: [Component] Response is invalid or has no 'status' property. Navigating to error page.", response);
        this.handleFatalErrorAndRedirect('Error fetching assessment data from service. Try again after sometime');
        return; // Stop execution
      }

      console.log(`DEBUG: [Component] Response has a status property: '${response.status}'`);

      if (response.status === 'NO_ATTEMPTS_REMAINING') {
        console.log("DEBUG: [Component] Condition MET: response.status is 'NO_ATTEMPTS_REMAINING'.");
        this.alertMessage = 'You have exhausted the maximum attempts for this assessment. You can no longer take this assessment.';
        this.showAlertButtons = [];
        this.showNoAttemptsAlert = true;
        console.log("DEBUG: [Component] showNoAttemptsAlert set to true. Alert should be visible.");

        setTimeout(() => {
          console.log("DEBUG: [Component] 5-second timer finished. Navigating to /candidate-assessment.");
          this.router.navigate(['/candidate-assessment']);
        }, 5000);

      } else if (response.status === 'SUCCESS') {
        console.log("DEBUG: [Component] Condition MET: response.status is 'SUCCESS'.");
        this.assessmentData = response;

        const savedState = this.loadState();
        
        // ... (rest of your success logic)
        try {
          if (response.proctored?.toUpperCase() === 'YES') {
            this.proctoringService.startMonitoring();
            this.openFullscreen();
          }
          if (response.video_recording?.toUpperCase() === 'YES') {
            await this.videoRecorder.startRecording(this.userId, String(assessmentId));
          }
        } catch (error) {
            console.error('[Component] Error during proctoring/video setup:', error);
        }
        this.sections = [];
        this.processCustomizations(response.sections);

        this.sections.forEach(section => {
          if (section.type === 'coding') {
            const problemId = section.coding_id_id;
            const key = `flashyre-code-${this.userId}-${this.assessmentData.assessment_id}-${problemId}`;
            const savedData = localStorage.getItem(key);

            if (savedData) {
              try {
                const parsedData = JSON.parse(savedData);
                // Pre-populate the solutions state with the saved code and language
                this.codingSolutions[problemId] = {
                  code: parsedData.code,
                  language: parsedData.language
                };
                console.log(`[Persistence] Loaded saved code for problem ${problemId}.`);
              } catch (e) {
                console.error(`[Persistence] Failed to parse saved data for problem ${problemId}.`, e);
              }
            }
          }
        });

        this.sections.forEach(section => {
          const sectionKey = section.section_id || section.coding_id_id;
          if (sectionKey) {
            // Initialize the timer for this section.
            this.sectionTimers[sectionKey] = section.duration * 60;
          }
        });

        this.totalSections = this.sections.length;
        this.timer = response.total_assessment_duration * 60;
    if (savedState && savedState.assessmentEndTime) {
      this.assessmentEndTime = savedState.assessmentEndTime;
      const remainingTime = Math.max(0, Math.floor((this.assessmentEndTime - Date.now()) / 1000));
      this.trialAssessmentService.updateTimer(remainingTime);
    } else {
      this.assessmentEndTime = Date.now() + (this.timer * 1000);
      this.trialAssessmentService.updateTimer(this.timer);
    }

    if (savedState) {
      // Restore the state as before
      this.userResponses = savedState.userResponses || {};
      this.selectedAnswers = savedState.selectedAnswers || {};
      this.expiredSections = new Set(savedState.expiredSections || []);
      this.currentSectionIndex = savedState.currentSectionIndex || 0;
      this.currentQuestionIndex = savedState.currentQuestionIndex || 0;

      // Restore the remaining time for each section
      this.sectionTimers = savedState.sectionTimers || {};
    } else {
      // If no saved state, initialize section timers with their full duration
      this.sections.forEach(section => {
        const sectionKey = section.section_id || section.coding_id_id;
        if (sectionKey) {
          this.sectionTimers[sectionKey] = section.duration * 60;
        }
      });
    }

    this.startTimer();
    
    this.selectSection(this.sections[this.currentSectionIndex]);
    if (this.sections[this.currentSectionIndex]?.type === 'mcq') {
      this.navigateToQuestion(this.currentQuestionIndex);
    }

      } else {
        // This is the catch-all that is likely being triggered
        console.error(`DEBUG: [Component] Condition FAILED: response.status was neither 'NO_ATTEMPTS_REMAINING' nor 'SUCCESS'. It was '${response.status}'.`);
        console.error("DEBUG: [Component] Navigating to /assessment-error due to unexpected status.");
        this.handleFatalErrorAndRedirect('Error fetching assessment data from service. Try again after sometime');
      }
    },
    error: (error) => {
      console.error('DEBUG: [Component] Entered SUBSCRIBE "error" block. This should only happen on 4xx/5xx errors.');
      console.error('DEBUG: [Component] Full error object:', error);
      this.isLoading = false;
      this.handleFatalErrorAndRedirect('Error fetching assessment data from service. Try again after sometime');
    }
  });
}

  
  openFullscreen() {
    if (this.elem.requestFullscreen) this.elem.requestFullscreen();
    else if (this.elem.mozRequestFullScreen) this.elem.mozRequestFullScreen();
    else if (this.elem.webkitRequestFullscreen) this.elem.webkitRequestFullscreen();
    else if (this.elem.msRequestFullscreen) this.elem.msRequestFullscreen();
  }

  closeFullscreen() {
    if (this.document.exitFullscreen) this.document.exitFullscreen();
    else if (this.document.mozCancelFullScreen) this.document.mozCancelFullScreen();
    else if (this.document.webkitExitFullscreen) this.document.webkitExitFullscreen();
    else if (this.document.msExitFullscreen) this.document.msExitFullscreen();
  }

  processCustomizations(sectionsData: any[]): void {
    for (const section of sectionsData) {
      const sectionEntry = {
        name: section.name,
        section_id: section.section ? section.section.section_id : null,
        duration: section.duration_per_section,
        questions: section.questions || [],
        coding_problem: section.coding_problem,
        type: section.coding_problem ? 'coding' : 'mcq',
        coding_id_id: section.coding_problem?.id,
        problemData: section.coding_problem
      };
      this.sections.push(sectionEntry);
    }
  }

  startTimer(): void {
    this.timerSubscription = this.trialAssessmentService.timer$.subscribe((time) => {
      this.timer = time;
      if (this.timer <= 0) this.terminateTest();
    });
    this.decrementTimer();
  }

  decrementTimer(): void {
  this.timerInterval = setInterval(() => {
    const remainingTime = Math.max(0, Math.floor((this.assessmentEndTime - Date.now()) / 1000));
    this.trialAssessmentService.updateTimer(remainingTime);

    // Periodically save state to keep timers in sync
    if (this.timer > 0 && this.timer % 15 === 0) {
        this.saveState();
    }

    if (remainingTime <= 0) {
      clearInterval(this.timerInterval);
    }
  }, 1000);
}


  startSectionTimer(): void {
  // Clear any existing timer to ensure only one is running
  if (this.sectionTimerInterval) clearInterval(this.sectionTimerInterval);

  this.sectionTimerInterval = setInterval(() => {
    if (this.sectionTimer > 0) {
      // Decrement the timer by one second
      this.sectionTimer--;

      // Update the stored value for this section
      const sectionKey = this.currentSection.section_id || this.currentSection.coding_id_id;
      if(sectionKey) {
        this.sectionTimers[sectionKey] = this.sectionTimer;
      }
      
    } else {
      // Time for this section has run out
      clearInterval(this.sectionTimerInterval);
      this.sectionTimerInterval = null;
      
      const sectionKey = this.currentSection.section_id || this.currentSection.coding_id_id;
      this.expiredSections.add(sectionKey);
      this.saveState(); // Save the state now that the section has expired

      if (this.currentSectionIndex < this.totalSections - 1) {
        this.nextSection();
      } else {
        this.terminateTest();
      }
    }
  }, 1000);
}

  isSectionAccessible(section: any): boolean {
    const sectionKey = section.section_id || section.coding_id_id;
    return !this.expiredSections.has(sectionKey);
  }

  selectSection(section: any): void {
  const sectionKeyToTest = section.section_id || section.coding_id_id;
  if (this.expiredSections.has(sectionKeyToTest)) {
    alert('This section time has expired. You cannot return to it.');
    return;
  }
  
  if (this.sectionTimerInterval) {
    clearInterval(this.sectionTimerInterval);
  }

  this.currentSection = section;
  this.currentSectionIndex = this.sections.indexOf(section);
  this.isCodingSection = section.type === 'coding';
  this.showTestResults = false; 

  if (!this.isCodingSection) {
    this.currentQuestions = section.questions;
    // On section change, default to the first question unless state is restored elsewhere
    this.currentQuestionIndex = (this.currentSectionIndex === this.sections.indexOf(section)) ? this.currentQuestionIndex : 0;
    this.updateCurrentQuestion();
    this.totalQuestionsInSection = this.currentQuestions.length;
  } else {
      this.results = this.codingResults[this.currentSection.coding_id_id] || [];
      if (this.results.length > 0) {
          this.showTestResults = true;
      }
  }

  // ### MODIFICATION START: Section timer persistence logic ###
  const sectionKey = section.section_id || section.coding_id_id;

  // Set the active timer to the remaining seconds for the new section
  if (this.sectionTimers[sectionKey] !== undefined && this.sectionTimers[sectionKey] > 0) {
    this.sectionTimer = this.sectionTimers[sectionKey];
  } else {
    // This handles both expired sections (0) and unvisited sections
    this.sectionTimer = this.sectionTimers[sectionKey] || 0;
  }
  
  // Start the countdown for the newly selected section
  this.startSectionTimer();
  this.saveState(); // Save state on every section change
  // ### MODIFICATION END ###
}

  updateCurrentQuestion(): void {
    if (this.currentQuestions && this.currentQuestions.length > 0) {
      this.currentQuestion = this.currentQuestions[this.currentQuestionIndex];
      this.updateCurrentOptions();
      this.checkIfLastQuestionInSection();
      this.scrollToActiveQuestion();
      this.hasQuestions = true;
    } else {
      this.currentQuestion = { question: 'No questions available' };
      this.currentOptions = [];
      this.hasQuestions = false;
    }
  }

  scrollLeft(): void {
    if (this.numbersContainer) this.numbersContainer.nativeElement.scrollBy({ left: -100, behavior: 'smooth' });
  }

  scrollRight(): void {
    if (this.numbersContainer) this.numbersContainer.nativeElement.scrollBy({ left: 100, behavior: 'smooth' });
  }

  scrollToActiveQuestion(): void {
    if (!this.numbersContainer) return;
    const container = this.numbersContainer.nativeElement;
    const activeButton = container.querySelector('.active') as HTMLElement;
    if (activeButton) {
      const containerRect = container.getBoundingClientRect();
      const activeRect = activeButton.getBoundingClientRect();
      if (activeRect.left < containerRect.left) container.scrollBy({ left: activeRect.left - containerRect.left - 8, behavior: 'smooth' });
      else if (activeRect.right > containerRect.right) container.scrollBy({ left: activeRect.right - containerRect.right + 8, behavior: 'smooth' });
    }
  }

  updateCurrentOptions(): void {
    this.currentOptions = this.currentQuestion?.options ? this.getOptions(this.currentQuestion) : [];
  }

  checkIfLastQuestionInSection(): void {
    this.isLastQuestionInSection = this.currentQuestions ? this.currentQuestionIndex === this.currentQuestions.length - 1 : false;
  }

  getOptions(question: any): any[] {
    if (!question?.options) return [];
    const options = [];
    for (let i = 1; i <= 4; i++) {
      const key = `option${i}`;
      if (question.options[key]) {
        options.push({ key, text: question.options[key], image: question.options[`q_${key}_image`] || null });
      }
    }
    return options;
  }

  navigateToQuestion(index: number): void {
    if (index >= 0 && index < this.currentQuestions.length) {
      this.currentQuestionIndex = index;
      this.updateCurrentQuestion();
      this.saveState();
    }
  }

  onOptionSelected(questionId: number, sectionId: number, answer: string): void {
    this.selectedAnswers[questionId] = { answer, section_id: sectionId };
    this.saveState();
  }

  clearResponse(questionId: number): void {
    delete this.userResponses[questionId];
    delete this.selectedAnswers[questionId];
    this.saveState();
  }

  private isTerminating = false;

  async terminateTest(isViolation = false): Promise<void> {
    if (this.isTerminating) return;
    this.isTerminating = true;

    try {
      const key = this.getAssessmentStateKey();
      if (key) {
      localStorage.removeItem(key);
      }
      await this.cleanupResources();
      const submissionData = this.prepareSubmissionData();
      await lastValueFrom(this.trialAssessmentService.submitAssessment(submissionData));
      this.sections.forEach(section => {
      if (section.type === 'coding') {
        const problemId = section.coding_id_id;
        const key = `flashyre-code-${this.userId}-${this.assessmentData.assessment_id}-${problemId}`;
        localStorage.removeItem(key);
        console.log(`[Persistence] Cleaned up saved code for problem ${problemId}.`);
      }
    });
      if (isViolation) {
        this.router.navigate(['/assessment-violation-message'], {
          state: { message: "Test submitted automatically due to screen/app switching" }
        });
      } else {
        this.router.navigate(['/assessment-taken-page']);
      }
    } catch (error) {
      console.error('Termination failed:', error);
      this.handleFatalErrorAndRedirect('Your Assessment has been submitted, redirecting to home page.');
    }
  }

  showEndTestWarning(): void {
    if (this.currentSection) {
      const sectionKey = this.currentSection.section_id || this.currentSection.coding_id_id;
      this.sectionTimers[sectionKey] = this.sectionTimer;
    }
    this.showWarningPopup = true;
  }

  handleCloseWarningPopup(): void {
    this.showWarningPopup = false;
  }

  prepareSubmissionData(): any {
    // MODIFICATION: Explicitly type this object to match the CodingSubmission interface
    const finalCodingSubmissions: { [problemId: string]: CodingSubmission } = { ...this.codingSubmissions };

    for (const problemId in this.codingSolutions) {
        if (this.codingSolutions.hasOwnProperty(problemId)) {
            const solution = this.codingSolutions[problemId];
            if (solution.code && !finalCodingSubmissions[problemId]) {
                finalCodingSubmissions[problemId] = {
                    id: 0, // Placeholder for auto-submission
                    score: 0,
                    source_code: solution.code,
                    language_id: solution.language.id
                };
            }
        }
    }

    return {
      assessmentId: this.assessmentData.assessment_id,
      userId: this.userId,
      responses: Object.keys(this.selectedAnswers).map((questionId) => ({
        questionId: +questionId,
        sectionId: this.selectedAnswers[+questionId].section_id,
        answer: this.selectedAnswers[+questionId].answer,
      })),
      codingSubmissions: Object.keys(finalCodingSubmissions).map((problemId) => ({
        problemId: +problemId,
        submissionId: finalCodingSubmissions[problemId].id,
        score: finalCodingSubmissions[problemId].score,
        // The properties now exist on the type, so the errors are gone.
        source_code: finalCodingSubmissions[problemId].source_code, 
        language_id: finalCodingSubmissions[problemId].language_id
      })),
      startTime: this.startTime,
      endTime: new Date().toISOString(),
      submissionType: 'manual',
      videoPath: this.videoPath,
    };
  }

  previousQuestion(): void {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
      this.updateCurrentQuestion();
      this.saveState();
    }
  }

  nextQuestion(): void {
    if (this.currentQuestionIndex < this.currentQuestions.length - 1) {
      this.currentQuestionIndex++;
      this.updateCurrentQuestion();
      this.saveState();
    }
  }

  previousSection(): void {
    if (this.currentSectionIndex > 0) {
      let prevIndex = this.currentSectionIndex - 1;
      while (prevIndex >= 0) {
        const prevSection = this.sections[prevIndex];
        if (this.isSectionAccessible(prevSection)) {
          this.selectSection(prevSection);
          return;
        }
        prevIndex--;
      }
    }
  }

  nextSection(): void {
    if (this.currentSectionIndex < this.totalSections - 1) {
      let nextIndex = this.currentSectionIndex + 1;
      while (nextIndex < this.totalSections) {
        const nextSection = this.sections[nextIndex];
        if (this.isSectionAccessible(nextSection)) {
          this.selectSection(nextSection);
          return;
        }
        nextIndex++;
      }
      this.terminateTest();
    }
  }

  handleQuestionNavigation(event: { section: any, questionIndex: number }): void {
    const { section, questionIndex } = event;
    const sectionIndex = this.sections.findIndex(s => 
        (s.section_id && s.section_id === section.section_id) || 
        (s.coding_id_id && s.coding_id_id === section.coding_id_id)
    );

    if (sectionIndex !== -1) {
        this.selectSection(this.sections[sectionIndex]);
        if (this.sections[sectionIndex].type === 'mcq') {
            this.navigateToQuestion(questionIndex);
        }
    }
    this.showWarningPopup = false;
  }

  handleHideResults(): void {
    this.showTestResults = false;
    setTimeout(() => this.codeEditorComponent?.onResize(), 10);
  }

  onCodeChange(event: { code: string; language: any }) {
  if (this.currentSection && this.isCodingSection) {
    const problemId = this.currentSection.coding_id_id;
    // Update the in-memory state
    this.codingSolutions[problemId] = {
      code: event.code,
      language: event.language,
    };
    
    // ### MODIFICATION START: Save code to localStorage ###
    try {
      const key = `flashyre-code-${this.userId}-${this.assessmentData.assessment_id}-${problemId}`;
      const dataToSave = JSON.stringify({
        code: event.code,
        language: event.language
      });
      localStorage.setItem(key, dataToSave);
    } catch (e) {
      console.error("[Persistence] Failed to save code to localStorage.", e);
    }
    // ### MODIFICATION END ###
  }
}

  onRunCode(event: { source_code: string, language_id: number }) {
    const problemId = this.currentSection.coding_id_id;
    const data = {
      problem_id: problemId,
      source_code: event.source_code,
      language_id: event.language_id
    };
    this.spinner.show();

    // Step 1: Perform the original "Run Code" action to get immediate feedback for the user.
    this.trialAssessmentService.runCode(data).subscribe({
      next: (runResponse) => {
        // This is the original functionality and remains unchanged for the user.
        // The user sees the spinner stop and the test results appear.
        const currentResults = runResponse.results || ['No results available'];
        this.results = currentResults;
        this.codingResults[problemId] = currentResults;
        this.showTestResults = true;
        this.spinner.hide();

        // Step 2: Chain a second, "fire-and-forget" call to submit the code silently in the background.
        this.trialAssessmentService.submitCode(data).subscribe({
          next: (submitResponse) => {
            // This is the NEW, silent part. We update our component's state with the
            // permanent submission record, ensuring the user's work is saved.
            // NO UI popups are triggered here.
            console.log(`Background submission successful for problem ${problemId}. ID: ${submitResponse.id}`);
            this.codingSubmissions[problemId] = {
              id: submitResponse.id,
              score: submitResponse.score
            };
          },
          error: (submitError) => {
            // If the background save fails, we only log it to the console.
            // We do not show an error to the user, as their primary "Run Code" action was successful.
            console.error(`Background submission failed silently for problem ${problemId}:`, submitError);
          }
        });
      },
      error: (runError) => {
        // This is the original error handling if the primary "Run Code" action fails.
        const errorResults = [`Error running code: ${runError.status} ${runError.statusText}`];
        this.results = errorResults;
        this.codingResults[problemId] = errorResults;
        this.showTestResults = true;
        this.spinner.hide();
      }
    });
  }

  onSubmitCode(event: { source_code: string, language_id: number }) {
    const problemId = this.currentSection.coding_id_id;
    const data = {
      problem_id: problemId,
      source_code: event.source_code,
      language_id: event.language_id
    };
    this.spinner.show();
    this.trialAssessmentService.submitCode(data).subscribe({
      next: (response) => {
        const currentResults = response.results || ['No results available'];
        this.results = currentResults; // Update the view
        
        // MODIFICATION: Save the results to our state dictionary
        this.codingResults[problemId] = currentResults;

        this.codingSubmissions[problemId] = {
          id: response.id,
          score: response.score
        };
        this.showTestResults = true;
        this.spinner.hide();
// Clear any previous timeout to reset the timer
        if (this.successPopupTimeout) {
          clearTimeout(this.successPopupTimeout);
        }

        // Set message and show the custom popup
        this.successPopupMessage = 'Code submitted successfully! Your score has been saved.';
        this.showSuccessPopup = true;

        // Hide the popup after 5 seconds
        this.successPopupTimeout = setTimeout(() => {
          this.showSuccessPopup = false;
        }, 5000);
      },
      error: (error) => {
        const errorResults = [`Error submitting code: ${error.status} ${error.statusText}`];
        this.results = errorResults; // Update the view

        // MODIFICATION: Save the error results to our state dictionary
        this.codingResults[problemId] = errorResults;

        this.showTestResults = true;
        this.spinner.hide();
      }
    });
  }

  private getAssessmentStateKey(): string | null {
  if (this.userId && this.assessmentData?.assessment_id) {
    return `flashyre-assessment-state-${this.userId}-${this.assessmentData.assessment_id}`;
  }
  return null;
}

private saveState(): void {
  const key = this.getAssessmentStateKey();
  if (!key) return;

  // We are saving all crucial information needed to restore the session
  const stateToSave = {
    currentSectionIndex: this.currentSectionIndex,
    currentQuestionIndex: this.currentQuestionIndex,
    userResponses: this.userResponses,
    selectedAnswers: this.selectedAnswers,
    assessmentEndTime: this.assessmentEndTime,
    sectionTimers: this.sectionTimers,
    expiredSections: Array.from(this.expiredSections), // Convert Set to Array for JSON
  };

  localStorage.setItem(key, JSON.stringify(stateToSave));
  console.log('[Persistence] Assessment state saved.');
}

private loadState(): any | null {
  const key = this.getAssessmentStateKey();
  if (!key) return null;

  const savedState = localStorage.getItem(key);
  if (savedState) {
    console.log('[Persistence] Found and loaded a saved assessment state.');
    return JSON.parse(savedState);
  }
  return null;
}
}