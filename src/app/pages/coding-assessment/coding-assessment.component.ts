import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CodingAssessmentService } from '../../services/coding-assessment.service';
import { CodingTestResultsComponent } from '../../components/coding-test-results/coding-test-results.component';

@Component({
  selector: 'app-coding-assessment',
  templateUrl: './coding-assessment.component.html',
  styleUrls: ['./coding-assessment.component.css']
})
export class CodingAssessment implements OnInit {
  @ViewChild(CodingTestResultsComponent) testResultsComponent!: CodingTestResultsComponent;
  problem: any = {
    title: 'Loading...',
    description: 'Please wait...',
    input_format: '',
    output_format: '',
    constraints: '',
    example: ''
  };
  results: string[] = [];
  problemId = 2;
  isLoading = true;

  constructor(private codingService: CodingAssessmentService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.codingService.getProblem(this.problemId).subscribe({
      next: (data) => {
        this.problem = data.problem || {};
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching problem:', JSON.stringify(err, null, 2));
        this.problem = { title: 'Error', description: 'Failed to load problem. Please try again.' };
        this.isLoading = false;
      }
    });
  }

  onRunCode(data: { source_code: string, language_id: number, user_id: number }) {
    this.codingService.submitCode({ problem_id: this.problemId, source_code: data.source_code, language_id: data.language_id, user_id: data.user_id }).subscribe({
      next: (response) => {
        this.results = response.results || ['No results available'];
        console.log('Run code results set:', this.results);
        if (this.testResultsComponent) {
          console.log('Toggling test results visibility');
          this.testResultsComponent.toggleVisibility();
        }
        this.cdr.detectChanges(); // Force change detection
      },
      error: (err) => {
        console.error('Error running code:', JSON.stringify(err, null, 2));
        if (err.status === 400 && err.error) {
          if (err.error.results) {
            this.results = err.error.results; // Handles Language Mismatch
          } else if (err.error.errors) {
            // Handle serializer errors (e.g., {"user_id": ["User does not exist"]})
            this.results = Object.values(err.error.errors).reduce((acc: string[], val) => {
              return acc.concat(Array.isArray(val) ? val : [val]);
            }, []) as string[];
          } else {
            this.results = ['Error running code: Invalid request.'];
          }
        } else if (err.status === 404) {
          this.results = ['Error: Submission endpoint not found. Please check the server configuration.'];
        } else {
          this.results = [`Error running code: ${err.statusText || 'Unable to process the submission.'}`];
        }
        console.log('Error results set:', this.results);
        if (this.testResultsComponent) {
          console.log('Toggling test results visibility on error');
          this.testResultsComponent.toggleVisibility();
        }
        this.cdr.detectChanges(); // Force change detection
      }
    });
  }

  onSubmitCode(data: { source_code: string, language_id: number, user_id: number }) {
    this.codingService.submitCode({ problem_id: this.problemId, source_code: data.source_code, language_id: data.language_id, user_id: data.user_id }).subscribe({
      next: (response) => {
        this.results = response.results || ['No results available'];
        console.log('Submit code results set:', this.results);
        alert(`Submission saved! Score: ${response.score || 0}%`);
        if (this.testResultsComponent) {
          console.log('Toggling test results visibility');
          this.testResultsComponent.toggleVisibility();
        }
        this.cdr.detectChanges(); // Force change detection
      },
      error: (err) => {
        console.error('Error submitting code:', JSON.stringify(err, null, 2));
        if (err.status === 400 && err.error) {
          if (err.error.results) {
            this.results = err.error.results; // Handles Language Mismatch
          } else if (err.error.errors) {
            // Handle serializer errors (e.g., {"user_id": ["User does not exist"]})
            this.results = Object.values(err.error.errors).reduce((acc: string[], val) => {
              return acc.concat(Array.isArray(val) ? val : [val]);
            }, []) as string[];
          } else {
            this.results = ['Error submitting code: Invalid request.'];
          }
        } else if (err.status === 404) {
          this.results = ['Error: Submission endpoint not found. Please check the server configuration.'];
        } else {
          this.results = [`Error submitting code: ${err.statusText || 'Unable to process the submission.'}`];
        }
        console.log('Error results set:', this.results);
        if (this.testResultsComponent) {
          console.log('Toggling test results visibility on error');
          this.testResultsComponent.toggleVisibility();
        }
        this.cdr.detectChanges(); // Force change detection
      }
    });
  }
}