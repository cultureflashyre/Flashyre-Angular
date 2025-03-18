import { ContentChild, Input, TemplateRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { AssessmentService } from '../../services/assessment.service';
import { Subscription } from 'rxjs';
import { VideoRecorderService } from '../../services/video-recorder.service';
import { ProctoringService } from '../../services/proctoring.service';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner'; // Import NgxSpinnerService

interface SelectedAnswer {
  answer: string;
  section_id: number;
}

@Component({
  selector: 'flashyre-assessment1',
  templateUrl: 'flashyre-assessment1.component.html',
  styleUrls: ['flashyre-assessment1.component.css'],
})
export class FlashyreAssessment1 implements OnInit, OnDestroy {
    @ContentChild('endTestText')
    endTestText: TemplateRef<any>
    @Input()
    logoSrc: string = '/assets/main-logo/logo%20-%20flashyre(1500px)-200h.png'
    @Input()
    rootClassName: string = ''
    @Input()
    logoAlt: string = 'image'

  totalQuestionsInSection: number;
  isLastSection: boolean;
  currentQuestionIndex: number;
  currentSectionIndex: number;
  totalSections: number;

  assessmentData: any = {};
  sections: any[];
  currentSection: any;
  currentQuestions: any[] = [];
  timer: number;
  userId = 1;
  startTime: Date;
  videoPath: string | null;

  isLastQuestionInSection = false;

  selectedAnswers: { [question_id: number]: SelectedAnswer } = {};

  questionStates: { [key: number]: 'unvisited' | 'visited' | 'answered' } = {};

  private timerSubscription: Subscription;

  constructor(
    private title: Title, 
    private meta: Meta,
    private assessmentService: AssessmentService,
    private videoRecorder: VideoRecorderService,
    private proctoringService: ProctoringService,
    private router: Router,
    private spinner: NgxSpinnerService,
  ) {
    //this.totalQuestionsInSection = 0; // Example initialization
    this.currentQuestionIndex = 0;
    //this.isLastSection = false;
    //this.currentSectionIndex = 0;
    // = this.sections.length;
    

    this.title.setTitle('Flashyre-Assessment1 - Flashyre')
    this.meta.addTags([
      {
        property: 'og:title',
        content: 'Flashyre-Assessment1 - Flashyre',
      },
      {
        property: 'og:image',
        content:
          'https://aheioqhobo.cloudimg.io/v7/_playground-bucket-v2.teleporthq.io_/8203932d-6f2d-4493-a7b2-7000ee521aa2/9aea8e9c-27ce-4011-a345-94a92ae2dbf8?org_if_sml=1&force_format=original',
      },
    ])
  }

  private timerInterval: any;

  async ngOnInit(): Promise<void> {
    const assessmentId = 4; // Replace with actual assessment ID
    
    this.fetchAssessmentData(assessmentId)
    try {
      await this.videoRecorder.startRecording();
      this.proctoringService.startMonitoring();
    } catch (error) {
      console.error('Failed to start assessment:', error);
    } 
   // this.checkLastQuestionAndSection();
  }

  ngOnDestroy(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
    clearInterval(this.timerInterval); // <-- Clear interval on destroy
  }

  fetchAssessmentData(assessmentId: number): void {
    // Show spinner before making the HTTP request
    this.spinner.show();

    this.assessmentService.getAssessmentData(assessmentId).subscribe({
      next: (data) => {
        this.assessmentData = data;
        this.sections = Object.keys(data.sections).map((sectionName) => ({
          name: sectionName,
          ...data.sections[sectionName],
        }));
        this.timer = data.total_assessment_duration * 60; // Convert minutes to seconds
        this.assessmentService.updateTimer(this.timer);
        console.log('timer data in seconds: ', this.timer);
        this.startTimer();
        this.selectSection(this.sections[0]);
      },
      error: (error) => {
        console.error('Error fetching assessment data:', error);
        // Handle error appropriately (e.g., display a message to the user)
      },
      complete: () => {
        // Hide spinner after request completes
        this.spinner.hide();
      }
    });
  }

  startTimer(): void {
    this.timerSubscription = this.assessmentService.timer$.subscribe((time) => {
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
      // <-- Use a class property
      if (this.timer > 0) {
        this.assessmentService.updateTimer(this.timer - 1);
      } else {
        clearInterval(this.timerInterval); // <-- Clean up when done
      }
    }, 1000);
  }

  submitAssessment(): void {
    const responses = this.prepareSubmissionData();
    this.assessmentService.submitAssessment(responses).subscribe({
      next: (response) => {
        console.log('Assessment submitted successfully:', response);
        // Navigate to completion page
      },
      error: (error) => {
        console.error('Assessment submission failed:', error);
        // Handle error
      },
    });
  }

  selectSection(section: any): void {
    this.currentSection = section;
    this.currentQuestions = section.questions;
    this.currentQuestionIndex = 0;
  }

  getOptions(question: any): any[] {
    const options = Object.keys(question.options).map(key => ({ key, value: question.options[key] }));
    return question.option_type === 2 ? options.slice(0, 2) : options.slice(0, 4);
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
    }
  }

  selectOption(questionId: number, sectionId: number, answer: string): void {
    this.selectedAnswers[questionId] = {
      answer: answer,
      section_id: sectionId,
    };
    this.markQuestionAsAnswered(this.currentQuestionIndex);
  }

  // New method to clear the selected answer
  clearResponse(questionId: number): void {
    delete this.selectedAnswers[questionId];
  }

  async terminateTest(): Promise<void> {
    try {
      // 1. Stop recording
      this.videoRecorder.stopRecording();

      // 2. Stop proctoring
      this.proctoringService.stopMonitoring();

      this.videoPath = await this.videoRecorder.getVideoPath();

      // 3. Submit responses
      const responses = this.prepareSubmissionData();
      this.assessmentService.submitAssessment(responses).subscribe({
        next: (response) => {
          console.log('Assessment submitted successfully:', response);
          this.router.navigate(['/candidate-dashboard-main']);
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

  prepareSubmissionData(): any {
    return {
      assessmentId: this.assessmentData.assessment_id,
      userId: this.userId, // Assuming you have the user ID available
      responses: Object.keys(this.selectedAnswers).map((questionId) => ({
        questionId: +questionId,
        sectionId: this.selectedAnswers[+questionId].section_id, // Add sectionId
        answer: this.selectedAnswers[+questionId].answer,
      })),
      startTime: this.startTime, // Start time of the assessment
      endTime: new Date().toISOString(), // End time of the assessment
      submissionType: 'manual', // or 'auto' based on submission type
      videoPath: this.videoPath, // Path to the recorded video
    };
  }

  previousQuestion(): void {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
    }
  }

  nextQuestion(): void {
    if (this.currentQuestionIndex < this.currentQuestions.length - 1) {
      this.currentQuestionIndex++;
    }
  }

}