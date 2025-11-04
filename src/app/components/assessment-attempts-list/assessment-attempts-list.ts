import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router'; // Add this import
import { AssessmentTakenService } from '../../services/assessment-taken.service';
import { JobsService } from '../../services/job.service';

@Component({
  selector: 'assessment-attempts-list',
  templateUrl: 'assessment-attempts-list.html',
  styleUrls: ['assessment-attempts-list.css']
})
export class AssessmentAttemptsListComponent implements OnInit {
  @Input() assessmentId!: string;
  @Output() back = new EventEmitter<void>();
  @Output() loaded = new EventEmitter<void>(); // <-- 1. ADD THIS NEW OUTPUT PROPERTY

  public isReattempting = false;


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

  isLoading: boolean = true;

  constructor(
    private assessmentTakenService: AssessmentTakenService,
    private router: Router, // Inject Router here
     private route: ActivatedRoute,
     private jobsService: JobsService
  ) {}

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
      this.loaded.emit(); // <-- 2. EMIT THE SIGNAL ON SUCCESS

      
      // Add this block to check URL parameters after data loads
      this.route.queryParams.subscribe(params => {
        const attemptIndex = params['attemptIndex'];
        if (attemptIndex !== undefined && this.attempts[attemptIndex]) {
          // We call a modified function to prevent a navigation loop
          this.setDetailView(this.attempts[attemptIndex]);
        }
      });
    },
    error: (error) => {
      this.errorMessage = 'Failed to load assessment data.';
      this.loading = false;
      this.loaded.emit(); // <-- 3. ALSO EMIT THE SIGNAL ON ERROR

    }
  });
}

  setDetailView(attempt: any) {
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

  openDetailView(attempt: any, index: number) { 
  this.setDetailView(attempt); // Use the new helper method to set the state
  this.router.navigate([], {
    relativeTo: this.route,
    queryParams: { attemptIndex: index },
    queryParamsHandling: 'merge'
  });
}

  closeDetailView() {
  this.showDetailView = false;
  this.selectedAttempt = null;
  this.router.navigate([], {
    relativeTo: this.route,
    queryParams: { attemptIndex: null },
    queryParamsHandling: 'merge'
  });
}

  onBackClick() {
  this.back.emit();
}

  onReattempt() {
    if (!this.assessmentId) {
        console.error('Cannot re-attempt: Assessment ID is missing.');
        alert('An error occurred. Missing assessment ID.');
        return;
    }
    
    // --- [CHANGE 1] ---
    // Set loading state to true and disable the button immediately
    this.isReattempting = true;

    const targetAssessmentId = parseInt(this.assessmentId, 10);

    this.jobsService.fetchAssessments().subscribe({
      next: (allAssessments) => {
        const selectedAssessment = allAssessments.find(a => a.assessment_id === targetAssessmentId);

        if (selectedAssessment) {
          const assessmentDataString = JSON.stringify(selectedAssessment);
          this.router.navigate(['/flashyre-assessment-rules-card'], {
            queryParams: { data: assessmentDataString }
          });
          // On successful navigation, the component is destroyed, so no need to reset the flag.
        } else {
          console.error(`Assessment with ID ${targetAssessmentId} not found.`);
          alert('Could not start the assessment. Details not found.');
          this.isReattempting = false; // <-- Reset on failure
        }
      },
      error: (error) => {
        console.error('Failed to fetch the list of assessments for re-attempt:', error);
        alert('An error occurred while fetching assessment data. Please try again later.');
        // --- [CHANGE 2] ---
        // If the API call fails, re-enable the button
        this.isReattempting = false;
      }
    });
  }

  goBack() {
    this.router.navigate(['/assessment-taken-page']);
  }
}