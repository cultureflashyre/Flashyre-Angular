import { ContentChild, Input, TemplateRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { TrialAssessmentService } from '../../services/trial-assessment.service';
import { Subscription } from 'rxjs';
import { VideoRecorderService } from '../../services/video-recorder.service';
import { ProctoringService } from '../../services/proctoring.service';
import { Router, ActivatedRoute } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { SharedPipesModule } from '../../shared/shared-pipes.module';

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
export class FlashyreAssessment11 implements OnInit, OnDestroy {
  @ContentChild('endTestText')
  endTestText: TemplateRef<any>;
  @Input()
  logoSrc: string = '/assets/main-logo/logo%20-%20flashyre(1500px)-200h.png';
  @Input()
  rootClassName: string = '';
  @Input()
  logoAlt: string = 'image';

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
  userId = 1;
  startTime: Date;
  videoPath: string | null;
  sectionTimer: number = 0;
  currentQuestion: any = {};
  userResponses: {[key: string]: any} = {};
  currentOptions: any[] = [];

  isLastQuestionInSection = false;

  selectedAnswers: { [question_id: number]: SelectedAnswer } = {};
  questionStates: { [key: number]: 'unvisited' | 'visited' | 'answered' } = {};

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

  async ngOnInit(): Promise<void> {
    // Extract assessmentId from query parameters
    const assessmentId = this.route.snapshot.queryParamMap.get('id');
    
    if (assessmentId) {
      this.fetchAssessmentData(+assessmentId); // Convert to number and fetch data
      this.startTime = new Date(); // Record start time when assessment begins
      this.proctoringService.startMonitoring();
      try {
        await this.videoRecorder.startRecording();
      } catch (error) {
        console.error('Failed to start assessment:', error);
      }
    } else {
      console.error('No assessment ID provided in route');
      this.router.navigate(['/assessment-error']); // Redirect if no ID
    }
  }

  ngOnDestroy(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
    clearInterval(this.timerInterval);
    clearInterval(this.sectionTimerInterval);
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
      console.log('timer data in startTimer(): ', this.timer);
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
    this.currentSection = section;
    this.currentSectionIndex = this.sections.indexOf(section);
    this.currentQuestions = section.questions;
    this.currentQuestionIndex = 0;
    this.updateCurrentQuestion(); // This will call checkIfLastQuestionInSection
    this.totalQuestionsInSection = this.currentQuestions.length;
    this.sectionTimer = section.duration * 60;
    clearInterval(this.sectionTimerInterval);
    this.startSectionTimer();
  }

  updateCurrentQuestion(): void {
    if (this.currentQuestions && this.currentQuestions.length > 0) {
      this.currentQuestion = this.currentQuestions[this.currentQuestionIndex];
      this.updateCurrentOptions();
      this.checkIfLastQuestionInSection(); // Add this line
    } else {
      this.currentQuestion = { question: 'No questions available' };
      this.currentOptions = [];
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
    // Update section data, reset totalQuestionsInSection, etc.
    this.totalQuestionsInSection = this.currentQuestions.length;
  }

  checkIfLastQuestionInSection(): void {
    if (this.currentQuestions && this.currentQuestionIndex !== undefined) {
      this.isLastQuestionInSection = this.currentQuestionIndex === this.currentQuestions.length - 1;
      console.log('Is last question in section:', this.isLastQuestionInSection);
      console.log('Current index:', this.currentQuestionIndex);
      console.log('Total questions:', this.currentQuestions.length);
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
      this.updateCurrentQuestion(); // This will call checkIfLastQuestionInSection
    }
  }
  
  // Method referenced in template
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
    console.log("Question ID:", questionId);
    console.log("Section ID:", sectionId);
    console.log("Selected answer (key):", answer);
    
    // Find the full option object to get its value
    const currentQuestion = this.currentQuestions.find(q => q.question_id === questionId);
    if (currentQuestion) {
    // The answer is in the format "option1", "option2", etc.
    // Get the actual text value from the question options
    const optionText = currentQuestion.options[answer];
    
    console.log("Selected option in object format:", answer);
    console.log("Option text value:", optionText);
      
  // Store both key and text value
  this.selectedAnswers[questionId] = {
    answer: answer,
    answerValue: optionText, // Store the text value
    section_id: sectionId,
  };
  } else {
  console.log("Question not found!");
  this.selectedAnswers[questionId] = {
    answer: answer,
    section_id: sectionId,
  };
  }
    
    console.log("Updated selectedAnswers object:", this.selectedAnswers);
    this.markQuestionAsAnswered(this.currentQuestionIndex);
  }

  clearResponse(questionId: number): void {
    // Clear the response from userResponses (bound to UI via ngModel)
    if (this.userResponses.hasOwnProperty(questionId)) {
      delete this.userResponses[questionId];
    }
  
    // Clear the response from selectedAnswers (used for submission)
    if (this.selectedAnswers.hasOwnProperty(questionId)) {
      delete this.selectedAnswers[questionId];
    }
  
    // Optional: Update question state (e.g., from 'answered' to 'visited')
    const questionIndex = this.currentQuestions.findIndex(q => q.question_id === questionId);
    if (questionIndex !== -1 && this.questionStates[questionIndex] === 'answered') {
      this.questionStates[questionIndex] = 'visited';
    }
  }

  async terminateTest(): Promise<void> {
    try {
      this.videoRecorder.stopRecording();
      this.proctoringService.stopMonitoring();
      this.videoPath = await this.videoRecorder.getVideoPath();

      const responses = this.prepareSubmissionData();
      this.trialassessmentService.submitAssessment(responses).subscribe({
        next: (response) => {
          console.log('Assessment submitted successfully:', response);
          this.router.navigate(['/assessment-taken-page']);
        },
        error: (error) => {
          console.error('Assessment submission failed:', error);
          this.router.navigate(['/assessment-error']);
        },
      });
    } catch (error) {
      console.error('Termination failed:', error);
      this.router.navigate(['/assessment-error']);
    }
  }
  
  // Method referenced in template
  endTest(): void {
    this.terminateTest();
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
      this.updateCurrentQuestion(); // This will call checkIfLastQuestionInSection
    }
  }

  nextQuestion(): void {
  if (this.currentQuestionIndex < this.currentQuestions.length - 1) {
    this.currentQuestionIndex++;
    this.updateCurrentQuestion(); // This will call checkIfLastQuestionInSection
  }
}
  
  nextSection(): void {
    if (this.currentSectionIndex < this.totalSections - 1) {
      this.currentSectionIndex++;
      this.selectSection(this.sections[this.currentSectionIndex]);
    }
  }
  
  // Helper method to check if question has an image
  hasQuestionImage(question: any): boolean {
    return question && question.question_image && question.question_image.trim() !== '';
  }
  
  // Helper method to check if option has an image
  hasOptionImage(option: any): boolean {
    return option && option.image && option.image.trim() !== '';
  }

  isValidImage(url: string): boolean {
    return url && (url.startsWith('http://') || url.startsWith('https://'));
}

handleImageError(event: Event): void {
    console.warn('Image failed to load:', (event.target as HTMLImageElement).src);
    (event.target as HTMLImageElement).style.display = 'none'; // Hide broken image
}
}