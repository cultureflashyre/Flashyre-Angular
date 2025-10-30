import { Component, ContentChild, Input, TemplateRef, OnDestroy, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { TrialAssessmentService } from '../../services/trial-assessment.service';
import { Subscription } from 'rxjs';
import { VideoRecorderService } from '../../services/video-recorder.service';
import { ProctoringService } from '../../services/proctoring.service';
import { Router, ActivatedRoute } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { lastValueFrom } from 'rxjs';

// We need to import the CodeEditorComponent to use it with @ViewChild
import { CodeEditorComponent } from '../../components/code-editor/code-editor.component';

interface SelectedAnswer {
  answer: string;
  section_id: number;
  answerValue?: any;
}

@Component({
  selector: 'app-flashyre-assessment11',
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
  
  // NEW: Track which sections have expired
  expiredSections: Set<number> = new Set();
  
  isCodingSection = false;
  results: string[] = [];
  codingSubmissions: { [problem_id: number]: { id: number, score: number } } = {};

  showTestResults = false;

  private timerSubscription: Subscription;
  private sectionTimerInterval: any;
  private timerInterval: any;
  private violationSubscription: Subscription;
  private isCleanedUp = false;

  constructor(
    private title: Title,
    private meta: Meta,
    private trialAssessmentService: TrialAssessmentService,
    private videoRecorder: VideoRecorderService,
    private proctoringService: ProctoringService,
    private router: Router,
    private spinner: NgxSpinnerService,
    private route: ActivatedRoute
  ) {
    this.currentQuestionIndex = 0;
    this.title.setTitle('Flashyre-Assessment11 - Flashyre');
    this.meta.addTags([
      {
        property: 'og:title',
        content: 'Flashyre-Assessment11 - Flashyre',
      },
      {
        property: 'og:image',
        content: 'https://aheioqhobo.cloudimg.io/v7/_playground-bucket-v2.teleporthq.io_/8203932d-6f2d-4493-a7b2-7000ee521aa2/9aea8e9c-27ce-4011-a345-94a92ae2dbf8?org_if_sml=1&force_format=original',
      },
    ]);
  }

  ngAfterViewInit(): void {
    this.scrollToActiveQuestion();
  }

  async ngOnInit(): Promise<void> {
    this.violationSubscription = this.proctoringService.violation$.subscribe(() => {
      this.terminateTest(true);
    });

    const assessmentId = this.route.snapshot.queryParamMap.get('id');
    this.userId = localStorage.getItem('user_id');
    
    if (assessmentId && this.userId) {
      this.fetchAssessmentData(+assessmentId);
      this.startTime = new Date();
    } else {
      console.error('No assessment ID or user ID provided');
      this.router.navigate(['/assessment-error']);
    }
  }

  private async cleanupResources(): Promise<void> {
    if (this.isCleanedUp) return;
    this.isCleanedUp = true;

    try {
      if (this.timerSubscription) {
        this.timerSubscription.unsubscribe();
      }
      clearInterval(this.timerInterval);
      if (this.sectionTimerInterval) {
        clearInterval(this.sectionTimerInterval);
      }
      this.videoPath = await this.videoRecorder.stopRecording();
      this.proctoringService.stopMonitoring();
    } catch (error) {
      console.error('Error during cleanupResources:', error);
    }
  }

  ngOnDestroy(): void {
    if (this.violationSubscription) {
      this.violationSubscription.unsubscribe();
    }
    this.cleanupResources();
  }

  fetchAssessmentData(assessmentId: number): void {
    this.spinner.show();
    this.trialAssessmentService.getAssessmentDetails(assessmentId).subscribe({
      next: async (data) => {
        console.log('Raw API response:', data);
        this.assessmentData = data;
        
        try {
          if (data.proctored?.toUpperCase() === 'YES') {
            console.log("Assessment is Proctored. Starting tab switch monitoring.");
            this.proctoringService.startMonitoring();
          } else {
            console.log("Assessment is NOT Proctored. Tab switching will be allowed.");
          }

          if (data.video_recording?.toUpperCase() === 'YES') {
            console.log("Video recording is required. Starting camera...");
            await this.videoRecorder.startRecording(this.userId, String(assessmentId));
          } else {
            console.log("Video recording is NOT required for this assessment.");
          }

        } catch (error) {
            console.error('Failed to conditionally start assessment services:', error);
        }

        this.sections = [];
        this.processCustomizations(data.sections);
        this.totalSections = this.sections.length;
        this.timer = data.total_assessment_duration * 60;
        this.trialAssessmentService.updateTimer(this.timer);
        this.startTimer();
        this.selectSection(this.sections[0]);
      },
      error: (error) => {
        console.error('Error fetching assessment data:', error);
        this.spinner.hide();
      },
      complete: () => {
        this.spinner.hide();
      }
    });
  }

  processCustomizations(sectionsData: any[]): void {
    for (const section of sectionsData) {
      console.log('Processing section:', section.name);
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
    console.log('Final sections array:', JSON.stringify(this.sections, null, 2));
  }

  startTimer(): void {
    this.timerSubscription = this.trialAssessmentService.timer$.subscribe((time) => {
      this.timer = time;
      if (this.timer <= 0) {
        this.terminateTest();
      }
    });
    this.decrementTimer();
  }

  decrementTimer(): void {
    this.timerInterval = setInterval(() => {
      if (this.timer > 0) {
        this.trialAssessmentService.updateTimer(this.timer - 1);
      } else {
        clearInterval(this.timerInterval);
      }
    }, 1000);
  }

  // UPDATED: Section timer with auto-navigation
  startSectionTimer(): void {
    if (this.sectionTimerInterval) {
      clearInterval(this.sectionTimerInterval);
    }
    this.sectionTimerInterval = setInterval(() => {
      if (this.sectionTimer > 0) {
        this.sectionTimer--;
        // Save the current section's remaining time
        const sectionKey = this.currentSection.section_id || this.currentSection.coding_id_id;
        this.sectionTimers[sectionKey] = this.sectionTimer;
      } else {
        // Section timer expired
        clearInterval(this.sectionTimerInterval);
        this.sectionTimerInterval = null;
        
        // Mark this section as expired
        const sectionKey = this.currentSection.section_id || this.currentSection.coding_id_id;
        this.expiredSections.add(sectionKey);
        
        // Auto-navigate to next section or submit if last section
        if (this.currentSectionIndex < this.totalSections - 1) {
          console.log('Section timer expired, moving to next section');
          this.nextSection();
        } else {
          console.log('Last section timer expired, auto-submitting assessment');
          this.terminateTest();
        }
      }
    }, 1000);
  }

  submitAssessment(): void {
    const responses = this.prepareSubmissionData();
    this.trialAssessmentService.submitAssessment(responses).subscribe({
      next: (response) => {
        console.log('Assessment submitted successfully:', response);
      },
      error: (error) => {
        console.error('Assessment submission failed:', error);
      },
    });
  }

  // UPDATED: Check if section is accessible
  isSectionAccessible(section: any): boolean {
    const sectionKey = section.section_id || section.coding_id_id;
    return !this.expiredSections.has(sectionKey);
  }

  // UPDATED: Select section with timer persistence
  selectSection(section: any): void {
    console.log('Selected section:', JSON.stringify(section, null, 2));
    
    // Check if trying to access an expired section
    const sectionKey = section.section_id || section.coding_id_id;
    if (this.expiredSections.has(sectionKey)) {
      console.warn('Cannot access expired section:', section.name);
      alert('This section time has expired. You cannot return to it.');
      return;
    }
    
    // Save current section's timer before switching
    if (this.currentSection) {
      const currentSectionKey = this.currentSection.section_id || this.currentSection.coding_id_id;
      this.sectionTimers[currentSectionKey] = this.sectionTimer;
      console.log(`Saved timer for section ${this.currentSection.name}: ${this.sectionTimer} seconds`);
    }

    this.currentSection = section;
    this.currentSectionIndex = this.sections.indexOf(section);
    this.isCodingSection = section.type === 'coding';
    
    if (!this.isCodingSection) {
      this.currentQuestions = section.questions;
      this.currentQuestionIndex = 0;
      this.updateCurrentQuestion();
      this.totalQuestionsInSection = this.currentQuestions.length;
    } else {
      this.results = [];
      this.showTestResults = true;
    }

    // FIXED: Restore saved timer or use full duration
    if (this.sectionTimers[sectionKey] !== undefined && this.sectionTimers[sectionKey] > 0) {
      this.sectionTimer = this.sectionTimers[sectionKey];
      console.log(`Restored timer for section ${section.name}: ${this.sectionTimer} seconds`);
    } else {
      this.sectionTimer = section.duration * 60;
      this.sectionTimers[sectionKey] = this.sectionTimer;
      console.log(`Initialized timer for section ${section.name}: ${this.sectionTimer} seconds`);
    }

    clearInterval(this.sectionTimerInterval);
    this.startSectionTimer();
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
    if (this.numbersContainer) {
      this.numbersContainer.nativeElement.scrollBy({
        left: -100,
        behavior: 'smooth'
      });
    }
  }

  scrollRight(): void {
    if (this.numbersContainer) {
      this.numbersContainer.nativeElement.scrollBy({
        left: 100,
        behavior: 'smooth'
      });
    }
  }

  scrollToActiveQuestion(): void {
    if (!this.numbersContainer) return;
    const container = this.numbersContainer.nativeElement;
    const activeButton = container.querySelector('.active') as HTMLElement;
    if (activeButton) {
      const containerRect = container.getBoundingClientRect();
      const activeRect = activeButton.getBoundingClientRect();
      if (activeRect.left < containerRect.left) {
        container.scrollBy({
          left: activeRect.left - containerRect.left - 8,
          behavior: 'smooth'
        });
      } else if (activeRect.right > containerRect.right) {
        container.scrollBy({
          left: activeRect.right - containerRect.right + 8,
          behavior: 'smooth'
        });
      }
    }
  }

  updateCurrentOptions(): void {
    if (this.currentQuestion && this.currentQuestion.options) {
      this.currentOptions = this.getOptions(this.currentQuestion);
    } else {
      this.currentOptions = [];
    }
  }

  checkIfLastQuestionInSection(): void {
    if (this.currentQuestions && this.currentQuestionIndex !== undefined) {
      this.isLastQuestionInSection = this.currentQuestionIndex === this.currentQuestions.length - 1;
    } else {
      this.isLastQuestionInSection = false;
    }
  }

  getOptions(question: any): any[] {
    if (!question || !question.options) return [];
    const options = [];
    for (let i = 1; i <= 4; i++) {
      const key = `option${i}`;
      const imageKey = `q_option${i}_image`;
      if (question.options[key]) {
        options.push({
          key: key,
          text: question.options[key],
          image: question.options[imageKey] || null
        });
      }
    }
    return options;
  }

  markQuestionAsVisited(index: number): void {
    if (!this.questionStates[index]) {
      this.questionStates[index] = 'visited';
    }
  }

  markQuestionAsAnswered(index: number): void {
    if (this.questionStates[index] === 'visited') {
      this.questionStates[index] = 'answered';
    }
  }

  navigateToQuestion(index: number): void {
    if (index >= 0 && index < this.currentQuestions.length) {
      this.currentQuestionIndex = index;
      this.markQuestionAsVisited(index);
      this.updateCurrentQuestion();
    }
  }

  selectOption(questionId: number, sectionId: number, answer: string): void {
    this.selectedAnswers[questionId] = {
      answer: answer,
      section_id: sectionId,
    };
    this.markQuestionAsAnswered(this.currentQuestionIndex);
  }

  onOptionSelected(questionId: number, sectionId: number, answer: string): void {
    const currentQuestion = this.currentQuestions.find(q => q.question_id === questionId);
    if (currentQuestion) {
      const optionText = currentQuestion.options[answer];
      this.selectedAnswers[questionId] = {
        answer: answer,
        answerValue: optionText,
        section_id: sectionId,
      };
    } else {
      this.selectedAnswers[questionId] = {
        answer: answer,
        section_id: sectionId,
      };
    }
    this.markQuestionAsAnswered(this.currentQuestionIndex);
  }

  clearResponse(questionId: number): void {
    if (this.userResponses.hasOwnProperty(questionId)) {
      delete this.userResponses[questionId];
    }
    if (this.selectedAnswers.hasOwnProperty(questionId)) {
      delete this.selectedAnswers[questionId];
    }
    const questionIndex = this.currentQuestions.findIndex(q => q.question_id === questionId);
    if (questionIndex !== -1 && this.questionStates[questionIndex] === 'answered') {
      this.questionStates[questionIndex] = 'visited';
    }
  }

  private isTerminating = false;

  async terminateTest(isViolation = false): Promise<void> {
    if (this.isTerminating) return;
    this.isTerminating = true;

    try {
      await this.cleanupResources();
      const responses = this.prepareSubmissionData();
      const response = await lastValueFrom(this.trialAssessmentService.submitAssessment(responses));
      console.log('Assessment submitted successfully:', response);
      if (isViolation) {
        this.router.navigate(['/assessment-violation-message'], {
          state: { message: "Test submitted automatically due to screen/app switching" }
        });
      } else {
        this.router.navigate(['/assessment-taken-page']);
      }
    } catch (error) {
      console.error('Termination failed:', error);
      this.router.navigate(['/assessment-error']);
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
    return {
      assessmentId: this.assessmentData.assessment_id,
      userId: this.userId,
      responses: Object.keys(this.selectedAnswers).map((questionId) => ({
        questionId: +questionId,
        sectionId: this.selectedAnswers[+questionId].section_id,
        answer: this.selectedAnswers[+questionId].answer,
      })),
      codingSubmissions: Object.keys(this.codingSubmissions).map((problemId) => ({
        problemId: +problemId,
        submissionId: this.codingSubmissions[+problemId].id,
        score: this.codingSubmissions[+problemId].score
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
    }
  }

  nextQuestion(): void {
    if (this.currentQuestionIndex < this.currentQuestions.length - 1) {
      this.currentQuestionIndex++;
      this.updateCurrentQuestion();
    }
  }

  nextSection(): void {
    if (this.currentSectionIndex < this.totalSections - 1) {
      // Find next accessible section
      let nextIndex = this.currentSectionIndex + 1;
      while (nextIndex < this.totalSections) {
        const nextSection = this.sections[nextIndex];
        const nextSectionKey = nextSection.section_id || nextSection.coding_id_id;
        
        if (!this.expiredSections.has(nextSectionKey)) {
          this.currentSectionIndex = nextIndex;
          this.selectSection(this.sections[nextIndex]);
          return;
        }
        nextIndex++;
      }
      
      // If all remaining sections are expired, auto-submit
      console.log('All remaining sections are expired, auto-submitting');
      this.terminateTest();
    }
  }

  hasQuestionImage(question: any): boolean {
    return question && question.question_image && question.question_image.trim() !== '';
  }

  hasOptionImage(option: any): boolean {
    return option && option.image && option.image.trim() !== '';
  }

  isValidImage(url: string): boolean {
    return url && (url.startsWith('http://') || url.startsWith('https://'));
  }

  handleImageError(event: Event): void {
    (event.target as HTMLImageElement).style.display = 'none';
  }

  handleQuestionNavigation(event: { section: any, questionIndex: number }): void {
    const { section, questionIndex } = event;
    if (this.currentSection !== section) {
      this.currentSection = section;
      this.currentQuestions = section.questions;
    }
    this.currentQuestionIndex = questionIndex;
    this.markQuestionAsVisited(questionIndex);
    this.updateCurrentQuestion();
  }

  handleHideResults(): void {
    this.showTestResults = false;
    
    setTimeout(() => {
      if (this.codeEditorComponent) {
        this.codeEditorComponent.onResize();
      }
    }, 10);
  }

  onRunCode(event: { source_code: string, language_id: number }) {
    const data = {
      problem_id: this.currentSection.coding_id_id,
      source_code: event.source_code,
      language_id: event.language_id
    };
    console.log('Sending run code request:', JSON.stringify(data, null, 2));
    this.trialAssessmentService.runCode(data).subscribe({
      next: (response) => {
        console.log('Run code response:', JSON.stringify(response, null, 2));
        this.results = response.results || ['No results available'];
        this.showTestResults = true;
      },
      error: (error) => {
        console.error('Run code error:', error);
        this.results = [`Error running code: ${error.status} ${error.statusText}`];
        this.showTestResults = true;
      }
    });
  }

  onSubmitCode(event: { source_code: string, language_id: number }) {
    const data = {
      problem_id: this.currentSection.coding_id_id,
      source_code: event.source_code,
      language_id: event.language_id
    };
    console.log('Sending submit code request:', JSON.stringify(data, null, 2));
    this.trialAssessmentService.submitCode(data).subscribe({
      next: (response) => {
        console.log('Submit code response:', JSON.stringify(response, null, 2));
        this.results = response.results || ['No results available'];
        this.codingSubmissions[this.currentSection.coding_id_id] = {
          id: response.id,
          score: response.score
        };
        this.showTestResults = true;
      },
      error: (error) => {
        console.error('Submit code error:', error);
        this.results = [`Error submitting code: ${error.status} ${error.statusText}`];
        this.showTestResults = true;
      }
    });
  }
}