import { ContentChild, Input, TemplateRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ViewChild, ElementRef, AfterViewInit } from '@angular/core';

import { Title, Meta } from '@angular/platform-browser';
import { TrialAssessmentService } from '../../services/trial-assessment.service';
import { Subscription } from 'rxjs';
import { VideoRecorderService } from '../../services/video-recorder.service';
import { ProctoringService } from '../../services/proctoring.service';
import { Router, ActivatedRoute } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { SharedPipesModule } from '../../shared/shared-pipes.module';
import { lastValueFrom } from 'rxjs';

interface SelectedAnswer {
  answer: string;
  section_id: number;
  answerValue?: any; // Add this optional property
}

@Component({
  selector: 'flashyre-assessment11',
  templateUrl: 'flashyre-assessment11.component.html',
  styleUrls: ['flashyre-assessment11.component.css'],
})
export class FlashyreAssessment11 implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('numbersContainer', { read: ElementRef }) numbersContainer: ElementRef<HTMLDivElement>;

  @ContentChild('endTestText')
  endTestText: TemplateRef<any>;
  @Input()
  logoSrc: string = '/assets/main-logo/logo%20-%20flashyre(1500px)-200h.png';
  @Input()
  rootClassName: string = '';
  @Input()
  logoAlt: string = 'image';

  // New property to control popup visibility
  showWarningPopup = false;

  ngAfterViewInit(): void {
    // Scroll to active question on init
    this.scrollToActiveQuestion();
  }

  totalQuestionsInSection: number;
  isLastSection: boolean;
  currentQuestionIndex: number = 0;
  currentSectionIndex: number = 0;
  totalSections: number;

  assessmentData: any = {};
  sections: any[];
  currentSection: any;
  currentQuestions: any[] = [];
  timer: number;
  userId: string | null;
  startTime: Date;
  videoPath: string | null;
  sectionTimer: number = 0;
  currentQuestion: any = {};
  userResponses: {[key: string]: any} = {};
  currentOptions: any[] = [];

  isLastQuestionInSection = false;
  hasQuestions: boolean = false;

  selectedAnswers: { [question_id: number]: SelectedAnswer } = {};
  questionStates: { [key: number]: 'unvisited' | 'visited' | 'answered' } = {};
  
  // New property to store remaining time for each section
  sectionTimers: { [section_id: number]: number } = {};

  private timerSubscription: Subscription;
  private sectionTimerInterval: any;

  constructor(
    private title: Title,
    private meta: Meta,
    private trialassessmentService: TrialAssessmentService,
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
        content:
          'https://aheioqhobo.cloudimg.io/v7/_playground-bucket-v2.teleporthq.io_/8203932d-6f2d-4493-a7b2-7000ee521aa2/9aea8e9c-27ce-4011-a345-94a92ae2dbf8?org_if_sml=1&force_format=original',
      },
    ]);
  }

  private timerInterval: any;
  private violationSubscription: Subscription;
  private isCleanedUp = false;

  async ngOnInit(): Promise<void> {

    this.violationSubscription = this.proctoringService.violation$.subscribe(() => {
      this.terminateTest(true); // Pass a flag if you want to distinguish violation termination
    });

    // Extract assessmentId from query parameters
    const assessmentId = this.route.snapshot.queryParamMap.get('id');
    this.userId = localStorage.getItem('user_id');
    
    if (assessmentId && this.userId) {   // <-- Ensure both are present
    this.fetchAssessmentData(+assessmentId);
    this.startTime = new Date();
    try {
      await this.videoRecorder.startRecording(this.userId, assessmentId); // <-- Pass both arguments
      this.proctoringService.startMonitoring();
    } catch (error) {
      console.error('Failed to start assessment:', error);
    }
  } else {
      console.error('No assessment ID or user ID provided');
      this.router.navigate(['/assessment-error']); // Redirect if no ID
    }
  }

  private async cleanupResources(): Promise<void> {
    console.log('cleanupResources called');

    if (this.isCleanedUp) return;
    this.isCleanedUp = true;

    try {
      if (this.timerSubscription) {
        this.timerSubscription.unsubscribe();
        console.log('Unsubscribed timerSubscription');
      }
      
      clearInterval(this.timerInterval);

      if (this.sectionTimerInterval) {
        clearInterval(this.sectionTimerInterval);
        console.log('Cleared sectionTimerInterval');
      }

      // Await stopRecording to ensure video is stopped and path is retrieved
      this.videoPath = await this.videoRecorder.stopRecording();
      console.log("Inside cleanupResources...Video PATH url: ", this.videoPath);

      this.proctoringService.stopMonitoring();

      // Any other cleanup logic here

    } catch (error) {
      console.error('Error during cleanupResources:', error);
      // Handle less fatal errors here if needed, e.g., continue cleanup despite error
    }
  }

  ngOnDestroy(): void {
  if (this.violationSubscription) {
    this.violationSubscription.unsubscribe();
  }
  // this.cleanupResources();
}

  fetchAssessmentData(assessmentId: number): void {
    this.spinner.show();
    this.trialassessmentService.getAssessmentDetails(assessmentId).subscribe({
      next: (data) => {
        console.log('Raw API response:', data);
        this.assessmentData = data;
        this.sections = Object.keys(data.sections).map((sectionName) => ({
          name: sectionName,
          ...data.sections[sectionName],
        }));
        console.log('Processed sections:', this.sections);
        console.log('First section questions:', this.sections[0]?.questions);
        this.totalSections = this.sections.length;
        this.timer = data.total_assessment_duration * 60;
        this.trialassessmentService.updateTimer(this.timer);
        this.startTimer();
        this.selectSection(this.sections[0]);
      },
      error: (error) => {
        console.error('Error fetching assessment data:', error);
      },
      complete: () => {
        this.spinner.hide();
      }
    });
  }

  startTimer(): void {
    this.timerSubscription = this.trialassessmentService.timer$.subscribe((time) => {
      this.timer = time;
      //console.log('timer data in startTimer(): ', this.timer);
      if (this.timer <= 0) {
        this.terminateTest();
      }
    });
    this.decrementTimer();
  }

  decrementTimer(): void {
    this.timerInterval = setInterval(() => {
      if (this.timer > 0) {
        this.trialassessmentService.updateTimer(this.timer - 1 );
      } else {
        clearInterval(this.timerInterval);
      }
    }, 1000);
  }

  startSectionTimer(): void {
    if (this.sectionTimerInterval) {
      clearInterval(this.sectionTimerInterval);
    }
    this.sectionTimerInterval = setInterval(() => {
      if (this.sectionTimer > 0) {
        this.sectionTimer--;
      } else {
        clearInterval(this.sectionTimerInterval);
        this.sectionTimerInterval = null;
        // Optional: Auto-move to next section or end test
      }
    }, 1000);
  }

  submitAssessment(): void {
    const responses = this.prepareSubmissionData();
    this.trialassessmentService.submitAssessment(responses).subscribe({
      next: (response) => {
        console.log('Assessment submitted successfully:', response);
      },
      error: (error) => {
        console.error('Assessment submission failed:', error);
      },
    });
  }

  selectSection(section: any): void {
    // Before switching, save the remaining time of the current section
    if (this.currentSection) {
      this.sectionTimers[this.currentSection.section_id] = this.sectionTimer;
    }

    this.currentSection = section;
    this.currentSectionIndex = this.sections.indexOf(section);
    this.currentQuestions = section.questions;
    this.currentQuestionIndex = 0;
    this.updateCurrentQuestion();
    this.totalQuestionsInSection = this.currentQuestions.length;

    // Set the timer for the new section
    this.sectionTimer = this.sectionTimers[section.section_id] !== undefined 
      ? this.sectionTimers[section.section_id] 
      : section.duration * 60;

    clearInterval(this.sectionTimerInterval);
    this.startSectionTimer();
  }

  updateCurrentQuestion(): void {
  if (this.currentQuestions && this.currentQuestions.length > 0) {
    this.currentQuestion = this.currentQuestions[this.currentQuestionIndex];
    this.updateCurrentOptions();
    this.checkIfLastQuestionInSection();
    this.scrollToActiveQuestion();
    this.hasQuestions = true; // Set to true when questions are available
  } else {
    this.currentQuestion = { question: 'No questions available' };
    this.currentOptions = [];
    this.hasQuestions = false; // Set to false when no questions are available
  }
}

  
  scrollLeft(): void {
    if (this.numbersContainer) {
      this.numbersContainer.nativeElement.scrollBy({
        left: -100, // scroll left by 100px
        behavior: 'smooth'
      });
    }
  }

  scrollRight(): void {
    if (this.numbersContainer) {
      this.numbersContainer.nativeElement.scrollBy({
        left: 100, // scroll right by 100px
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
      }
      else if (activeRect.right > containerRect.right) {
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

  updateCurrentSection(): void {
    this.totalQuestionsInSection = this.currentQuestions.length;
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
      const imageKey = `option${i}_image`;
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

  goToQuestion(index: number): void {
    this.navigateToQuestion(index);
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
    if (this.isTerminating) {
        return;
    }
    this.isTerminating = true;

    try {
      await this.cleanupResources();
      const responses = this.prepareSubmissionData();
      const response = await lastValueFrom(this.trialassessmentService.submitAssessment(responses));
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

  // New method to show the warning popup
  showEndTestWarning(): void {
    // Store the final time for the current section before showing the popup
    if (this.currentSection) {
      this.sectionTimers[this.currentSection.section_id] = this.sectionTimer;
    }
    this.showWarningPopup = true;
  }

  // New method to handle closing the popup
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
      this.currentSectionIndex++;
      this.selectSection(this.sections[this.currentSectionIndex]);
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

  handleQuestionNavigation(event: {section: any, questionIndex: number}): void {
  const { section, questionIndex } = event;
  
  // Check if we need to switch to a different section
  if (this.currentSection !== section) {
    // Switch to the selected section
    this.currentSection = section;
    // Update current questions array to match the new section
    this.currentQuestions = section.questions;
  }

  // Navigate to the specific question within the section
  this.currentQuestionIndex = questionIndex;
  this.markQuestionAsVisited(questionIndex);
  this.updateCurrentQuestion();
}
}