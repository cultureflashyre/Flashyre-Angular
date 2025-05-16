import { Component, Input, OnInit } from '@angular/core';
import { AssessmentTakenService } from '../../services/assessment-taken.service';

@Component({
  selector: 'assessment-attempts-list',
  templateUrl: 'assessment-attempts-list.html',
  styleUrls: ['assessment-attempts-list.css']
})
export class AssessmentAttemptsListComponent implements OnInit {
  @Input() assessmentId!: string;
  assessmentData: any;
  assessment_title: string = '';
  assessment_logo_url: string = '';
  created_by: string = '';
  attempts_remaining: number = 0;
  attempts: any[] = [];
  showDetailView: boolean = false;
  selectedAttempt: any = null;
  loading: boolean = false;
  errorMessage: string = '';

  constructor(private assessmentTakenService: AssessmentTakenService) {}

  ngOnInit() {
    if (this.assessmentId) {
      this.fetchAssessmentData(this.assessmentId);
    } else {
      this.errorMessage = 'No assessment ID provided.';
    }
  }

  fetchAssessmentData(assessmentId: string) {
    this.loading = true;
    this.assessmentTakenService.fetchAssessmentScore(assessmentId).subscribe({
      next: (data) => {
        this.assessmentData = data;
        this.assessment_title = data.assessment_title ?? '';
        this.assessment_logo_url = data.assessment_logo_url ?? '';
        this.created_by = data.created_by ?? '';
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

  getFillColor(value: number): string {
    if (value <= 40) return 'red';
    if (value <= 60) return 'orange';
    if (value <= 75) return '#4D91C6';
    if (value <= 84) return 'lightgreen';
    return 'darkgreen';
  }

  getOrdinal(n: number): string {
    if (n > 3 && n < 21) return 'th';
    switch (n % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  }

  openDetailView(attempt: any) {
    this.selectedAttempt = {
      ...attempt,
      attempts_remaining: this.attempts_remaining,
      created_by: this.created_by,
      assessment_title: this.assessment_title,
      assessment_logo_url: this.assessment_logo_url,
      assessment_id: this.assessmentId
    };
    this.showDetailView = true;
  }

  closeDetailView() {
    this.showDetailView = false;
    this.selectedAttempt = null;
  }

  onReattempt() {
    // Implement re-attempt logic here if needed
  }
}