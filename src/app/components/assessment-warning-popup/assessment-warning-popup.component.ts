import { Component, Input, Output, EventEmitter, AfterViewInit, ViewChild, ElementRef, OnChanges, SimpleChanges, TemplateRef, OnInit, OnDestroy } from '@angular/core';
import { interval, Subscription } from 'rxjs';

interface CodingSubmission {
  id: number;
  score: number;
}

@Component({
  selector: 'assessment-warning-popup',
  templateUrl: 'assessment-warning-popup.component.html',
  styleUrls: ['assessment-warning-popup.component.css'],
})
export class AssessmentWarningPopup implements AfterViewInit, OnChanges, OnInit, OnDestroy {
  @ViewChild('numbersContainer', { read: ElementRef }) numbersContainer: ElementRef<HTMLDivElement>;
  // --- Element Refs for Donut Chart ---
  @ViewChild('attemptedPath') attemptedPath: ElementRef;
  @ViewChild('unattemptedPath') unattemptedPath: ElementRef;
  @ViewChild('markedPath') markedPath: ElementRef;

  // --- Inputs & Outputs ---
  @Input() sections: any[] = [];
  @Input() userResponses: { [key: string]: any } = {};
  @Input() sectionTimers: { [section_id: number]: number } = {};
  // MODIFICATION START: Add a new input to receive coding submission data
  @Input() codingSubmissions: { [problem_id: number]: CodingSubmission } = {};

  @Output() endTestConfirmed = new EventEmitter<void>();
  @Output() closePopup = new EventEmitter<void>();
  @Output() questionNavigate = new EventEmitter<{section: any, questionIndex: number}>();

  // --- Properties for Test Summary ---
  totalQuestions = 0;
  attemptedQuestions = 0;
  unattemptedQuestions = 0;
  attemptedPercentage = '0.0%';
  unattemptedPercentage = '0.0%';

  // Marked for Revisit is not tracked in the current logic, so it's set to 0
  markedForRevisit = 0;
  markedPercentage = '0.0%';

  // --- Customizable Template Inputs ---
  @Input() text: TemplateRef<any>;
  @Input() text1: TemplateRef<any>;
  @Input() text2: TemplateRef<any>;
  @Input() text3: TemplateRef<any>;
  @Input() text4: TemplateRef<any>;
  @Input() text5: TemplateRef<any>;
  @Input() text6: TemplateRef<any>;
  @Input() text8: TemplateRef<any>;
  @Input() text9: TemplateRef<any>;
  @Input() text91: TemplateRef<any>;
  @Input() text92: TemplateRef<any>;
  @Input() text911: TemplateRef<any>;
  @Input() text65: TemplateRef<any>;
  @Input() heading: TemplateRef<any>;
  @Input() button: TemplateRef<any>;
  @Input() button1: TemplateRef<any>;
  @Input() questionNumber1Button: TemplateRef<any>;

  private timerSubscription: Subscription;

  constructor() {}

  ngOnInit(): void {
    // Start countdown timer every second
    this.timerSubscription = interval(1000).subscribe(() => {
      this.countdownTimers();
    });
  }

  ngAfterViewInit(): void {
    this.calculateSummary();
    this.drawChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // MODIFICATION: Rerun summary calculation if codingSubmissions change
    if (changes['sections'] || changes['userResponses'] || changes['codingSubmissions']) {
      this.calculateSummary();
      this.drawChart();
    }
  }

  ngOnDestroy(): void {
    // Cleanup timer subscription to avoid memory leaks
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
  }

  // Decrease each section timer by 1 second if above 0
  countdownTimers(): void {
    if (!this.sectionTimers) return;
    Object.keys(this.sectionTimers).forEach(sectionId => {
      if (this.sectionTimers[sectionId] > 0) {
        this.sectionTimers[sectionId]--;
      }
    });
  }

  // --- Existing methods below ---
  calculateSummary(): void {
    if (!this.sections || this.sections.length === 0) return;

    let total = 0;
    let attempted = 0;

    this.sections.forEach(sec => {
      if (sec.type === 'coding') {
        total++; // Each coding section is one question
        if (this.codingSubmissions.hasOwnProperty(sec.coding_id_id)) {
          attempted++;
        }
      } else {
        total += sec.questions.length;
        sec.questions.forEach((q: { question_id: PropertyKey }) => {
          if (this.userResponses.hasOwnProperty(q.question_id)) {
            attempted++;
          }
        });
      }
    });

    this.totalQuestions = total;
    this.attemptedQuestions = attempted;
    this.unattemptedQuestions = total - attempted;

    if (total > 0) {
      this.attemptedPercentage = ((attempted / total) * 100).toFixed(1) + '%';
      this.unattemptedPercentage = ((this.unattemptedQuestions / total) * 100).toFixed(1) + '%';
    } else {
      this.attemptedPercentage = '0.0%';
      this.unattemptedPercentage = '0.0%';
    }
  }

  drawChart(): void {
    if (!this.attemptedPath || !this.unattemptedPath || this.totalQuestions === 0) {
      return;
    }

    const data = {
      attempted: this.attemptedQuestions,
      markedForRevisit: this.markedForRevisit, // Currently 0
      unattempted: this.unattemptedQuestions,
    };

    const total = data.attempted + data.markedForRevisit + data.unattempted;

    const attemptedAngle = (data.attempted / total) * 360;
    const markedAngle = (data.markedForRevisit / total) * 360;
    const unattemptedAngle = (data.unattempted / total) * 360;

    let currentAngle = 0;

    const attemptedPathD = this.createPath(currentAngle, currentAngle + attemptedAngle);
    this.attemptedPath.nativeElement.setAttribute('d', attemptedPathD);
    currentAngle += attemptedAngle;

    currentAngle += markedAngle; // No change since markedAngle is 0

    const unattemptedPathD = this.createPath(currentAngle, currentAngle + unattemptedAngle);
    this.unattemptedPath.nativeElement.setAttribute('d', unattemptedPathD);
  }

  createPath(startAngle: number, endAngle: number, innerRadius = 60, outerRadius = 100): string {
    const centerX = 120;
    const centerY = 120;

    const polarToCartesian = (angle: number, radius: number) => {
      const angleInRadians = (angle - 90) * Math.PI / 180.0;
      return {
        x: centerX + radius * Math.cos(angleInRadians),
        y: centerY + radius * Math.sin(angleInRadians),
      };
    };

    if (endAngle - startAngle >= 360) {
      endAngle = startAngle + 359.99;
    }

    const start = polarToCartesian(endAngle, outerRadius);
    const end = polarToCartesian(startAngle, outerRadius);
    const innerStart = polarToCartesian(endAngle, innerRadius);
    const innerEnd = polarToCartesian(startAngle, innerRadius);

    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

    return [
      'M', start.x, start.y,
      'A', outerRadius, outerRadius, 0, largeArcFlag, 0, end.x, end.y,
      'L', innerEnd.x, innerEnd.y,
      'A', innerRadius, innerRadius, 0, largeArcFlag, 1, innerStart.x, innerStart.y,
      'Z'
    ].join(' ');
  }

    // MODIFICATION: Renamed for clarity and to handle both types
  isAttempted(section: any, questionId?: string): boolean {
    if (section.type === 'coding') {
      return this.codingSubmissions.hasOwnProperty(section.coding_id_id);
    }
    return questionId ? this.userResponses.hasOwnProperty(questionId) : false;
  }
  
  // MODIFICATION: Use the new `isAttempted` logic
  getUnattemptedCount(section: any): number {
    if (section.type === 'coding') {
      return this.isAttempted(section) ? 0 : 1;
    }
    if (!section || !section.questions) return 0;
    return section.questions.filter((q: { question_id: string }) => !this.isAttempted(section, q.question_id)).length;
  }

  hasAnswered(questionId: string): boolean {
    return this.userResponses.hasOwnProperty(questionId);
  }

  isSectionComplete(section: any): boolean {
    return this.getUnattemptedCount(section) === 0;
  }

  confirmEndTest(): void {
    this.endTestConfirmed.emit();
  }

  goBackToTest(): void {
    this.closePopup.emit();
  }

  scrollLeft(event: Event): void {
  const clickedElement = event.target as HTMLElement;
  const parentContainer = clickedElement.closest('.assessment-warning-popup-question-numbers-main-container');
  const numbersContainer = parentContainer?.querySelector('.assessment-warning-popup-numbers-main-container') as HTMLElement;
  
  if (numbersContainer) {
    numbersContainer.scrollBy({
      left: -100,
      behavior: 'smooth'
    });
  }
}

scrollRight(event: Event): void {
  const clickedElement = event.target as HTMLElement;
  const parentContainer = clickedElement.closest('.assessment-warning-popup-question-numbers-main-container');
  const numbersContainer = parentContainer?.querySelector('.assessment-warning-popup-numbers-main-container') as HTMLElement;
  
  if (numbersContainer) {
    numbersContainer.scrollBy({
      left: 100,
      behavior: 'smooth'
    });
  }
}

  navigateToSectionQuestion(selectedSection: any, questionIndex: number): void {
    this.questionNavigate.emit({
      section: selectedSection,
      questionIndex: questionIndex
    });
    this.closePopup.emit();
  }

}