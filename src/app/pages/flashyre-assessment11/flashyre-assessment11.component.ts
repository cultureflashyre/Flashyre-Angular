import { Component, OnInit } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { TrialAssessmentService } from '../../services/trial-assessment.service';

@Component({
  selector: 'flashyre-assessment11',
  templateUrl: './flashyre-assessment11.component.html',
  styleUrls: ['./flashyre-assessment11.component.css'],
})
export class FlashyreAssessment11 implements OnInit {
  assessment: any;
  sections: any[] = [];
  currentSectionIndex: number = 0;
  currentQuestionIndex: number = 0;
  userResponses: { [questionId: number]: string } = {};
  startTime: string;
  sectionTimer: number = 0; // Timer in seconds
  timerInterval: any;

  constructor(
    private title: Title,
    private meta: Meta,
    private route: ActivatedRoute,
    private assessmentService: TrialAssessmentService
  ) {
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

  ngOnInit() {
    this.startTime = new Date().toISOString();
    const assessmentId = this.route.snapshot.paramMap.get('id');
    if (assessmentId) {
      this.assessmentService.getAssessmentDetails(+assessmentId).subscribe(data => {
        this.assessment = data;
        this.sections = Object.values(data.sections);
        this.startSectionTimer(); // Start timer for the first section
      });
    }
  }

  // Getters for current section, question, and options
  get currentSection() {
    return this.sections[this.currentSectionIndex] || { questions: [] };
  }

  get currentQuestion() {
    return this.currentSection.questions[this.currentQuestionIndex] || {};
  }

  get currentOptions() {
    const question = this.currentQuestion;
    const optionCount = question.option_type === '2' ? 2 : 4;
    const options = [];
    for (let i = 1; i <= optionCount; i++) {
      const textKey = `option${i}`;
      const imageKey = `option${i}_image`;
      options.push({
        key: textKey,
        text: question.options?.[textKey] || '',
        image: question.options?.[imageKey] || ''
      });
    }
    return options;
  }

  // Navigation methods
  goToQuestion(index: number) {
    this.currentQuestionIndex = index;
  }

  nextQuestion() {
    if (this.currentQuestionIndex < this.currentSection.questions.length - 1) {
      this.currentQuestionIndex++;
    } else if (this.currentSectionIndex < this.sections.length - 1) {
      this.currentSectionIndex++;
      this.currentQuestionIndex = 0;
      this.startSectionTimer();
    }
  }

  previousQuestion() {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
    } else if (this.currentSectionIndex > 0) {
      this.currentSectionIndex--;
      this.currentQuestionIndex = this.currentSection.questions.length - 1;
      this.startSectionTimer();
    }
  }

  nextSection() {
    if (this.currentSectionIndex < this.sections.length - 1) {
      this.currentSectionIndex++;
      this.currentQuestionIndex = 0;
      this.startSectionTimer();
    }
  }

  selectSection(index: number) {
    this.currentSectionIndex = index;
    this.currentQuestionIndex = 0;
    this.startSectionTimer();
  }

  // Response handling
  clearResponse() {
    delete this.userResponses[this.currentQuestion.question_id];
  }

  endTest() {
    this.submitAssessment();
  }

  submitAssessment() {
    clearInterval(this.timerInterval);
    const endTime = new Date().toISOString();
    const responses = [];
    for (const section of this.sections) {
      for (const question of section.questions) {
        const answer = this.userResponses[question.question_id] || null;
        responses.push({
          questionId: question.question_id,
          answer: answer,
          sectionId: section.section_id
        });
      }
    }
    const data = {
      assessmentId: this.assessment.assessment_id,
      responses: responses,
      startTime: this.startTime,
      endTime: endTime,
      submissionType: 'manual',
      videoPath: '' // Add video path if implemented
    };
    this.assessmentService.submitAssessment(data).subscribe(response => {
      console.log('Assessment submitted:', response);
      // Optionally navigate to a results page
    });
  }

  // Timer management
  startSectionTimer() {
    clearInterval(this.timerInterval);
    this.sectionTimer = (this.currentSection.duration || 0) * 60; // Convert minutes to seconds
    this.timerInterval = setInterval(() => {
      this.sectionTimer--;
      if (this.sectionTimer <= 0) {
        clearInterval(this.timerInterval);
        this.nextSection(); // Auto-move to next section when time’s up
      }
    }, 1000);
  }

  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}