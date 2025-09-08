import { Component, OnInit, ViewChild } from '@angular/core';
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

  constructor(private codingService: CodingAssessmentService) {}

  ngOnInit() {
    this.codingService.getProblem(this.problemId).subscribe({
      next: (data) => {
        this.problem = data.problem || {};
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching problem:', err);
        this.problem = { title: 'Error', description: 'Failed to load problem. Please try again.' };
        this.isLoading = false;
      }
    });
  }

  onRunCode(data: { source_code: string, language_id: number }) {
    this.codingService.submitCode({ problem_id: this.problemId, source_code: data.source_code, language_id: data.language_id }).subscribe({
      next: (response) => {
        this.results = response.results || ['No results available'];
        if (this.testResultsComponent) this.testResultsComponent.toggleVisibility();
      },
      error: (err) => {
        console.error('Error running code:', err);
        this.results = ['Error running code'];
      }
    });
  }

  onSubmitCode(data: { source_code: string, language_id: number }) {
    this.codingService.submitCode({ problem_id: this.problemId, source_code: data.source_code, language_id: data.language_id }).subscribe({
      next: (response) => {
        this.results = response.results || ['No results available'];
        alert(`Submission saved! Score: ${response.score || 0}%`);
        if (this.testResultsComponent) this.testResultsComponent.toggleVisibility();
      },
      error: (err) => {
        console.error('Error submitting code:', err);
        this.results = ['Error submitting code'];
      }
    });
  }
}