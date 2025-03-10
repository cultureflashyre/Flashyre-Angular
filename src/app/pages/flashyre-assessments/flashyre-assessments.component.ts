
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { AssessmentService } from '../../services/assessment.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'flashyre-assessments',
  templateUrl: 'flashyre-assessments.component.html',
  styleUrls: ['flashyre-assessments.component.css'],
})
export class FlashyreAssessments implements OnInit, OnDestroy  {
  sections: any[] = [];
  questions: any[] = [];
  currentQuestionIndex = 0;
  timer: number;

  currentSection: any;
  currentQuestions: any[] = [];

  private timerSubscription: Subscription;

  selectSection(section: any): void {
    this.currentSection = section;
    this.currentQuestions = section.questions;
    this.currentQuestionIndex = 0;
  }

  constructor(
    private title: Title, 
    private meta: Meta,
    private assessmentService: AssessmentService) {

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

  ngOnInit(): void {
    this.fetchAssessmentData();
    this.fetchTimerDuration();
  }

  ngOnDestroy(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
  }

  fetchAssessmentData(): void {
    this.assessmentService.getAssessmentData().subscribe(data => {
      this.sections = data.sections;
      this.questions = data.questions;
    });
  }

  fetchTimerDuration(): void {
    this.assessmentService.getTimerDuration().subscribe(duration => {
      this.timer = duration;
      this.startTimer();
    });
  }

  startTimer(): void {
    this.timerSubscription = this.assessmentService.timer$.subscribe(time => {
      this.timer = time;
      if (this.timer <= 0) {
        this.terminateTest();
      }
    });
    this.decrementTimer();
  }

  decrementTimer(): void {
    setInterval(() => {
      if (this.timer > 0) {
        this.assessmentService.updateTimer(this.timer - 1);
      }
    }, 1000);
  }

  navigateToQuestion(index: number): void {
    if (index >= 0 && index < this.currentQuestions.length) {
      this.currentQuestionIndex = index;
    }
  }

  terminateTest(): void {
    // Logic to end the test
    console.log('Test terminated');
  }

  submitTest(): void {
    // Logic to submit the test
    console.log('Test submitted');
  }

}
