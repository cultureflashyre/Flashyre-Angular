
import { Component, OnInit, ViewChild, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CodingAssessmentService } from '../../services/coding-assessment.service';
import { UserProfileService } from '../../services/user-profile.service';
import { Subscription, timer } from 'rxjs';

import { RouterModule } from '@angular/router'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'

import { ProblemDescriptionComponent } from 'src/app/components/problem-description/problem-description.component';
import { CodeEditorComponent } from 'src/app/components/code-editor/code-editor.component';
import { CodingTestResultsComponent } from 'src/app/components/coding-test-results/coding-test-results.component';

@Component({
  selector: 'app-coding-assessment',
  standalone: true,
  imports: [ RouterModule, FormsModule, CommonModule,
    ProblemDescriptionComponent, CodeEditorComponent,
    CodingTestResultsComponent,
  ],
  templateUrl: './coding-assessment.component.html',
  styleUrls: ['./coding-assessment.component.css']
})
export class CodingAssessment implements OnInit, OnDestroy {
  @ViewChild(CodingTestResultsComponent) testResultsComponent!: CodingTestResultsComponent;
  problems: any[] = [];
  problem: any = {
    title: 'Loading...',
    description: 'Please wait...',
    input_format: '',
    output_format: '',
    constraints: '',
    example: '',
    timer: 30
  };
  results: string[] = [];
  problemId: number | null = null;
  isLoading = true;
  remainingTime: string = '30:00';
  private timerSubscription: Subscription | null = null;

  constructor(
    private codingService: CodingAssessmentService,
    private userProfile: UserProfileService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.userProfile.fetchUserProfile().subscribe({
      next: () => {
        console.log('User profile fetched:', this.userProfile.getCurrentUserProfile());
      },
      error: (err) => {
        console.error('Error fetching user profile:', err);
        this.userProfile.clearUserProfile();
      }
    });

    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      this.problemId = id ? parseInt(id, 10) : null;
      if (this.problemId) {
        this.loadProblem(this.problemId);
      } else {
        this.loadProblems();
      }
    });
  }

  ngOnDestroy() {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
  }

  startTimer(minutes: number) {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }

    const totalSeconds = minutes * 60;
    this.timerSubscription = timer(0, 1000).subscribe(seconds => {
      const remainingSeconds = totalSeconds - seconds;
      if (remainingSeconds <= 0) {
        this.remainingTime = '00:00';
        this.timerSubscription?.unsubscribe();
        this.results = ['Error: Time limit exceeded'];
        this.cdr.detectChanges();
        return;
      }
      const minutesLeft = Math.floor(remainingSeconds / 60);
      const secondsLeft = remainingSeconds % 60;
      this.remainingTime = `${minutesLeft.toString().padStart(2, '0')}:${secondsLeft.toString().padStart(2, '0')}`;
      this.cdr.detectChanges();
    });
  }

  loadProblems() {
    this.codingService.getProblems().subscribe({
      next: (data) => {
        this.problems = data.problems || [];
        this.isLoading = false;
        if (this.problems.length > 0 && !this.problemId) {
          this.problemId = this.problems[0].id;
          this.loadProblem(this.problemId);
        } else if (this.problems.length === 0) {
          this.problem = { title: 'No Problems', description: 'No problems available.', timer: 30 };
          this.startTimer(this.problem.timer);
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching problems:', JSON.stringify(err, null, 2));
        this.problems = [];
        this.isLoading = false;
        this.problem = { title: 'Error', description: 'Failed to load problems. Please try again.', timer: 30 };
        this.startTimer(this.problem.timer);
        this.cdr.detectChanges();
      }
    });
  }

  loadProblem(problemId: number) {
    this.isLoading = true;
    this.codingService.getProblem(problemId).subscribe({
      next: (data) => {
        this.problem = data.problem || { timer: 30 };
        this.isLoading = false;
        this.startTimer(this.problem.timer);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching problem:', JSON.stringify(err, null, 2));
        this.problem = { title: 'Error', description: 'Failed to load problem. Please try again.', timer: 30 };
        this.isLoading = false;
        this.startTimer(this.problem.timer);
        this.cdr.detectChanges();
      }
    });
  }

  selectProblem(problemId: number) {
    this.problemId = problemId;
    this.loadProblem(problemId);
  }

  onRunCode(data: { source_code: string, language_id: number }) {
    if (!this.problemId) {
      this.results = ['Error: No problem selected'];
      this.cdr.detectChanges();
      return;
    }
    this.codingService.runCode({ problem_id: this.problemId, source_code: data.source_code, language_id: data.language_id }).subscribe({
      next: (response) => {
        this.results = response.results || ['No results available'];
        console.log('Run code results set:', this.results);
        if (this.testResultsComponent) {
          this.testResultsComponent.toggleVisibility();
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error running code:', JSON.stringify(err, null, 2));
        if (err.status === 400 && err.error) {
          if (err.error.results) {
            this.results = err.error.results;
          } else if (err.error.errors) {
            this.results = Object.values(err.error.errors).reduce((acc: string[], val) => {
              return acc.concat(Array.isArray(val) ? val : [val]);
            }, []) as string[];
          } else {
            this.results = ['Error running code: Invalid request.'];
          }
        } else if (err.status === 404) {
          this.results = ['Error: Run endpoint not found. Please check the server configuration.'];
        } else {
          this.results = [`Error running code: ${err.statusText || 'Unable to process the request.'}`];
        }
        console.log('Error results set:', this.results);
        if (this.testResultsComponent) {
          this.testResultsComponent.toggleVisibility();
        }
        this.cdr.detectChanges();
      }
    });
  }

  onSubmitCode(data: { source_code: string, language_id: number }) {
    if (!this.problemId) {
      this.results = ['Error: No problem selected'];
      this.cdr.detectChanges();
      return;
    }
    if (!this.userProfile.getCurrentUserProfile()) {
      this.results = ['Error: You must be logged in to submit'];
      alert('Please log in to submit your code');
      this.cdr.detectChanges();
      return;
    }
    this.codingService.submitCode({ problem_id: this.problemId, source_code: data.source_code, language_id: data.language_id }).subscribe({
      next: (response) => {
        this.results = response.results || ['No results available'];
        console.log('Submit code results set:', this.results);
        alert(`Submission saved! Score: ${response.score || 0}%`);
        if (this.testResultsComponent) {
          this.testResultsComponent.toggleVisibility();
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error submitting code:', JSON.stringify(err, null, 2));
        if (err.status === 401) {
          this.results = ['Error: You must be logged in to submit'];
          alert('Please log in to submit your code');
        } else if (err.status === 400 && err.error) {
          if (err.error.results) {
            this.results = err.error.results;
          } else if (err.error.errors) {
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
          this.testResultsComponent.toggleVisibility();
        }
        this.cdr.detectChanges();
      }
    });
  }
}
