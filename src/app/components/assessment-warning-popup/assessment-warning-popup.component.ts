import { Component, Input, Output, EventEmitter, AfterViewInit, ViewChild, ElementRef, OnChanges, SimpleChanges, TemplateRef } from '@angular/core';

@Component({
  selector: 'assessment-warning-popup',
  templateUrl: 'assessment-warning-popup.component.html',
  styleUrls: ['assessment-warning-popup.component.css'],
})
export class AssessmentWarningPopup implements AfterViewInit, OnChanges {
  
  // --- Element Refs for Donut Chart ---
  @ViewChild('attemptedPath') attemptedPath: ElementRef;
  @ViewChild('unattemptedPath') unattemptedPath: ElementRef;

  // --- Inputs & Outputs ---
  @Input() sections: any[] = [];
  @Input() userResponses: { [key: string]: any } = {};
  @Input() sectionTimers: { [section_id: number]: number } = {};
  @Output() endTestConfirmed = new EventEmitter<void>();
  @Output() closePopup = new EventEmitter<void>();

  // --- Properties for Test Summary ---
  totalQuestions = 0;
  attemptedQuestions = 0;
  unattemptedQuestions = 0;
  attemptedPercentage = '0.0%';
  unattemptedPercentage = '0.0%';
  
  // Note: Marked for Revisit is not tracked in the current logic, so it's set to 0.
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

  constructor() {}

  // Lifecycle hook to initialize the component
  ngAfterViewInit(): void {
    this.calculateSummary();
    this.drawChart();
  }

  // Lifecycle hook to update on input changes
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['sections'] || changes['userResponses']) {
      this.calculateSummary();
      this.drawChart();
    }
  }

  // Calculate test summary based on sections and user responses
  calculateSummary(): void {
    if (!this.sections || this.sections.length === 0) return;

    let total = 0;
    let attempted = 0;

    this.sections.forEach(sec => {
      total += sec.questions.length;
      sec.questions.forEach(q => {
        if (this.userResponses.hasOwnProperty(q.question_id)) {
          attempted++;
        }
      });
    });

    this.totalQuestions = total;
    this.attemptedQuestions = attempted;
    this.unattemptedQuestions = total - attempted;

    if (total > 0) {
      this.attemptedPercentage = ((attempted / total) * 100).toFixed(1) + '%';
      this.unattemptedPercentage = ((this.unattemptedQuestions / total) * 100).toFixed(1) + '%';
    }
  }

  // Draw the donut chart using SVG paths
  drawChart(): void {
    if (!this.attemptedPath || !this.unattemptedPath || this.totalQuestions === 0) {
      return;
    }

    const data = {
      attempted: this.attemptedQuestions,
      markedForRevisit: 0, // Not implemented, so set to 0
      unattempted: this.unattemptedQuestions,
    };

    const total = data.attempted + data.markedForRevisit + data.unattempted;

    const attemptedAngle = (data.attempted / total) * 360;
    const unattemptedAngle = 360 - attemptedAngle;

    const attemptedPathD = this.createPath(0, attemptedAngle);
    this.attemptedPath.nativeElement.setAttribute('d', attemptedPathD);

    const unattemptedPathD = this.createPath(attemptedAngle, 360);
    this.unattemptedPath.nativeElement.setAttribute('d', unattemptedPathD);
  }

  // Helper function to create SVG donut segment paths
  createPath(startAngle: number, endAngle: number, innerRadius = 60, outerRadius = 100): string {
    const centerX = 120;
    const centerY = 120;

    const polarToCartesian = (angle: number, radius: number) => {
      const angleInRadians = (angle - 90) * Math.PI / 180.0;
      return {
        x: centerX + (radius * Math.cos(angleInRadians)),
        y: centerY + (radius * Math.sin(angleInRadians)),
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

  // Check if a question has been answered
  hasAnswered(questionId: string): boolean {
    return this.userResponses.hasOwnProperty(questionId);
  }

  // Get the number of unattempted questions in a section
  getUnattemptedCount(section: any): number {
    if (!section || !section.questions) return 0;
    return section.questions.filter(q => !this.hasAnswered(q.question_id)).length;
  }

  // Check if a section is fully completed
  isSectionComplete(section: any): boolean {
    return this.getUnattemptedCount(section) === 0;
  }

  // Emit event to confirm ending the test
  confirmEndTest(): void {
    this.endTestConfirmed.emit();
  }

  // Emit event to close the popup and return to the test
  goBackToTest(): void {
    this.closePopup.emit();
  }
}