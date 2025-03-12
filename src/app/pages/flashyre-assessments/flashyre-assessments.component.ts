import { Component, OnDestroy, OnInit } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { AssessmentService } from '../../services/assessment.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'flashyre-assessments',
  templateUrl: 'flashyre-assessments.component.html',
  styleUrls: ['flashyre-assessments.component.css'],
})
export class FlashyreAssessments implements OnInit, OnDestroy {
  assessmentData: any = {};
  sections: any[] = [];
  currentSection: any;
  currentQuestions: any[] = [];
  currentQuestionIndex = 0;
  timer: number;

  private timerSubscription: Subscription;

  constructor(
    private title: Title,
    private meta: Meta,
    private assessmentService: AssessmentService
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

  async ngOnInit(): Promise<void> {
    const assessmentId = 1; // Replace with actual assessment ID
    this.fetchAssessmentData(assessmentId);
  }

  ngOnDestroy(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
  }

  fetchAssessmentData(assessmentId: number): void {
    this.assessmentService.getAssessmentData(assessmentId).subscribe(data => {
      this.assessmentData = data;
      this.sections = Object.keys(data.sections).map(sectionName => ({
        name: sectionName,
        ...data.sections[sectionName]
      }));
      this.timer = data.total_assessment_duration * 60; // Convert minutes to seconds
      this.startTimer();
      this.selectSection(this.sections[0]);
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

  selectSection(section: any): void {
    this.currentSection = section;
    this.currentQuestions = section.questions;
    this.currentQuestionIndex = 0;
  }

  navigateToQuestion(index: number): void {
    if (index >= 0 && index < this.currentQuestions.length) {
      this.currentQuestionIndex = index;
    }
  }

  terminateTest(): void {
    console.log('Test terminated');
  }

  submitTest(): void {
    console.log('Test submitted');
  }
}
