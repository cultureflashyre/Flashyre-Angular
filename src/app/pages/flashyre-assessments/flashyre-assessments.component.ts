import { ContentChild, Input, Component, TemplateRef, OnDestroy, OnInit } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { AssessmentService } from '../../services/assessment.service';
import { Subscription } from 'rxjs';
import { VideoRecorderService } from '../../services/video-recorder.service';
import { ProctoringService } from '../../services/proctoring.service';
import { Router } from '@angular/router';

@Component({
  selector: 'flashyre-assessments',
  templateUrl: 'flashyre-assessments.component.html',
  styleUrls: ['flashyre-assessments.component.css'],
})
export class FlashyreAssessments implements OnInit, OnDestroy {

  @ContentChild('endTestText')
  endTestText: TemplateRef<any>
  @Input()
  logoSrc: string = '/assets/main-logo/logo%20-%20flashyre(1500px)-200h.png'
  @Input()
  rootClassName: string = ''
  @Input()
  logoAlt: string = 'image'
  
  assessmentData: any = {};
  sections: any[] = [];
  currentSection: any;
  currentQuestions: any[] = [];
  currentQuestionIndex = 0;
  timer: number;
  userId = 1;
  startTime: Date;
  videoPath: string | null;

  isLastQuestionInSection = false;
  isLastSection = false;
  selectedAnswers: { [key: number]: string } = {};

  questionStates: { [key: number]: 'unvisited' | 'visited' | 'answered' } = {};

  private timerSubscription: Subscription;

  constructor(
    
    private title: Title,
    private meta: Meta,
    private assessmentService: AssessmentService,
    private videoRecorder: VideoRecorderService,
    private proctoringService: ProctoringService,
    private router: Router,
  ) {
    
    this.title.setTitle('Flashyre-Assessments - Flashyre')
    this.meta.addTags([
      {
        property: 'og:title',
        content: 'Flashyre-Assessments - Flashyre',
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
    const assessmentId = 1; // Replace with actual assessment ID
    this.fetchAssessmentData(assessmentId);
    try {
      await this.videoRecorder.startRecording();
      this.proctoringService.startMonitoring();
    } catch (error) {
      console.error('Failed to start assessment:', error);
    }

    this.checkLastQuestionAndSection();
  }

  ngOnDestroy(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
    clearInterval(this.timerInterval);  // <-- Clear interval on destroy
  }

  fetchAssessmentData(assessmentId: number): void {
    this.assessmentService.getAssessmentData(assessmentId).subscribe(data => {
      this.assessmentData = data;
      this.sections = Object.keys(data.sections).map(sectionName => ({
        name: sectionName,
        ...data.sections[sectionName]
      }));
      this.timer = data.total_assessment_duration * 60; // Convert minutes to seconds
      this.assessmentService.updateTimer(this.timer);
      console.log("timer data in seconds: ", this.timer);
      this.startTimer();
      this.selectSection(this.sections[0]);
      this.startTime = new Date();
    });
  }

  startTimer(): void {
    this.timerSubscription = this.assessmentService.timer$.subscribe(time => {
      this.timer = time;
      console.log("timer data in startTimer(): ", this.timer);
      if (this.timer <= 0) {
        this.terminateTest();
      }
    });
    this.decrementTimer();
  }

  decrementTimer(): void {
    this.timerInterval = setInterval(() => {  // <-- Use a class property
      if (this.timer > 0) {
        this.assessmentService.updateTimer(this.timer - 1);
      } else {
        clearInterval(this.timerInterval);  // <-- Clean up when done
      }
    }, 1000);
  }



  checkLastQuestionAndSection(): void {
    this.isLastQuestionInSection = this.currentQuestionIndex === this.currentQuestions.length - 1;
    this.isLastSection = this.sections.indexOf(this.currentSection) === this.sections.length - 1;
  }

  navigateToNextSection(): void {
    const nextSectionIndex = this.sections.indexOf(this.currentSection) + 1;
    if (nextSectionIndex < this.sections.length) {
      this.selectSection(this.sections[nextSectionIndex]);
    }
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
      }
    });
  }


  selectSection(section: any): void {
    this.currentSection = section;
    this.currentQuestions = section.questions;
    this.currentQuestionIndex = 0;
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

  selectOption(index: number): void {
    const checkedInput = document.querySelector(`input[name="question${index}"]:checked`) as HTMLInputElement | null;
    const selectedAnswer = checkedInput?.value;
    this.selectedAnswers[index] = selectedAnswer;
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
          this.router.navigate(['/assessment-complete']);
        },
        error: (error) => {
          console.error('Assessment submission failed:', error);
          this.router.navigate(['/assessment-error']);
        }
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
      responses: Object.keys(this.selectedAnswers).map((questionIndex) => ({
        questionId: this.currentQuestions[+questionIndex].question_id,
        answer: this.selectedAnswers[+questionIndex]
      })),
      startTime: this.startTime, // Start time of the assessment
      endTime: new Date().toISOString(), // End time of the assessment
      submissionType: 'manual', // or 'auto' based on submission type
      videoPath: this.videoPath // Path to the recorded video
    };
  }
  

}
