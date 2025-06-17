import { Component, Input, OnInit, ElementRef, ViewChild } from '@angular/core'
import { Title, Meta } from '@angular/platform-browser'
import { ActivatedRoute, Router } from '@angular/router';
import { AssessmentTakenService } from '../../services/assessment-taken.service'; // adjust path accordingly

@Component({
  selector: 'assessment-taken-page2',
  templateUrl: 'assessment-taken-page-2.component.html',
  styleUrls: ['assessment-taken-page-2.component.css'],
})
export class AssessmentTakenPage2 implements OnInit {
  assessmentId!: string;
  assessmentData: any; // define proper interface as needed
  loading = false;
  errorMessage = '';

  @Input() percentage: number = 75;

  @ViewChild('bar', { static: true }) bar!: ElementRef<HTMLDivElement>;
  @ViewChild('score', { static: true }) score!: ElementRef<HTMLSpanElement>;

  assessment_title: string = '';
  assessment_logo_url: string = '';
  created_by: string = '';
  assessment_id: number | string = '';
  attempts_remaining: number = 0;
  attempts: any[] = [];

  constructor(
    private title: Title, 
    private meta: Meta, 
    private route: ActivatedRoute, 
    private router: Router,
    private assessmentTakenService: AssessmentTakenService,
    
  ) {
    console.log('AssessmentTakenPage2 constructor called');

    this.title.setTitle('Assessment-Taken-Page-2 - Flashyre')
    this.meta.addTags([
      {
        property: 'og:title',
        content: 'Assessment-Taken-Page-2 - Flashyre',
      },
      {
        property: 'og:image',
        content:
          'https://aheioqhobo.cloudimg.io/v7/_playground-bucket-v2.teleporthq.io_/8203932d-6f2d-4493-a7b2-7000ee521aa2/9aea8e9c-27ce-4011-a345-94a92ae2dbf8?org_if_sml=1&force_format=original',
      },
    ])

    const nav = this.router.getCurrentNavigation();
    const state = nav?.extras.state as {
      assessment_title?: string,
      assessment_logo_url?: string,
      created_by?: string,
      assessment_id?: number | string,
      attempts_remaining?: number,
      attempts?: any[]
    };

    console.log('Constructor state:', state);

    if (state) {
      this.assessment_title = state.assessment_title ?? '';
      this.assessment_logo_url = state.assessment_logo_url ?? '';
      this.created_by = state.created_by ?? '';
      this.assessment_id = state.assessment_id ?? '';
      this.attempts_remaining = state.attempts_remaining ?? 0;
      this.attempts = state.attempts ?? [];
      console.log('Assigned variables from state in constructor:', {
        assessment_title: this.assessment_title,
        assessment_logo_url: this.assessment_logo_url,
        created_by: this.created_by,
        assessment_id: this.assessment_id,
        attempts_remaining: this.attempts_remaining,
        attempts: this.attempts
      });
    } else {
      // fallback: fetch data from API using assessment_id from route param if needed
      this.assessment_id = this.route.snapshot.paramMap.get('assessmentId') ?? '';
      console.log('No navigation state, assessment_id from param:', this.assessment_id);
    }

  }

  ngOnInit() {

    this.assessmentId = this.route.snapshot.paramMap.get('assessmentId')!;
    if (this.assessmentId) {
      this.fetchAssessmentScore(this.assessmentId);
    } else {
      this.errorMessage = 'No assessment ID provided.';
    }
    
    this.animateProgress(0, this.percentage, 3000);
  }

  getFillColor(value: number): string {
    if (value <= 40) return 'red';
    if (value <= 60) return 'orange';
    if (value <= 75) return '#4D91C6';
    if (value <= 84) return 'lightgreen';
    return 'darkgreen';
  }

  animateProgress(start: number, end: number, duration: number) {
    const startTime = performance.now();
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const value = start + (end - start) * progress;

      // Update bar width and color
      if (this.bar && this.bar.nativeElement) {
        this.bar.nativeElement.style.width = value + '%';
        this.bar.nativeElement.style.backgroundColor = this.getFillColor(value);
      }

      // Update score text
      if (this.score && this.score.nativeElement) {
        this.score.nativeElement.textContent = Math.round(value) + '%';
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }

  getOrdinal(n: number): string {
    if (n > 3 && n < 21) return 'th';
    switch (n % 10) {
      case 1:  return 'st';
      case 2:  return 'nd';
      case 3:  return 'rd';
      default: return 'th';
    }
  }

  fetchAssessmentScore(assessmentId: string) {
    this.loading = true;
    this.assessmentTakenService.fetchAssessmentScore(assessmentId).subscribe({
      next: (data) => {
        this.assessmentData = data;

        // Extract individual variables safely with fallback defaults
        this.assessment_title = data.assessment_title ?? '';
        this.assessment_logo_url = data.assessment_logo_url ?? '';
        this.created_by = data.created_by ?? '';
        this.assessment_id = data.assessment_id ?? '';
        this.attempts_remaining = data.attempts_remaining ?? 0;
        this.attempts = Array.isArray(data.attempts) ? data.attempts : [];
        
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = 'Failed to load assessment data.';
        this.loading = false;
      }
    });
  }

  onReattempt() {
  // Your logic for handling re-attempt
  }
}
