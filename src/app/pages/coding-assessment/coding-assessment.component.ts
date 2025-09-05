import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { interval, Subscription } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AssessmentService } from '../../services/coding-assessment.service';
import { ApiService } from '../../services/api.service';
import { Problem, ProgrammingLanguage, Submission, TestResult, Assessment, AssessmentAttempt } from './models';

@Component({
  selector: 'app-coding-assessment',
  templateUrl: './coding-assessment.component.html',
  styleUrls: ['./coding-assessment.component.css']
})
export class CodingAssessmentComponent implements OnInit, OnDestroy {
  assessment: Assessment | null = null;
  attempt: AssessmentAttempt | null = null;
  problems: Problem[] = [];
  currentProblem: Problem | null = null;
  languages: ProgrammingLanguage[] = [];
  selectedLanguage: ProgrammingLanguage | null = null;
  code: string = '';
  testResults: TestResult[] = [];
  timerSubscription: Subscription | null = null;
  remainingTime: number = 0;
  isLoading: boolean = false;
  errorMessage: string = '';
  showResults: boolean = false;
  selectedProblemIndex: number = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private assessmentService: AssessmentService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    const rawId = this.route.snapshot.paramMap.get('id');
    console.log('Raw route parameter id:', rawId); // Debug log for raw id
    const assessmentId = 2; // Hardcoded to ID 2 for Array Rotation Assessment
    console.log('Parsed assessment ID:', assessmentId); // Debug log

    // Validate assessmentId
    if (!assessmentId || assessmentId <= 0) {
      this.errorMessage = 'Invalid assessment ID.';
      console.error('Invalid assessment ID:', assessmentId);
      this.snackBar.open(this.errorMessage, 'Close', { duration: 5000 });
      setTimeout(() => {
        this.router.navigate(['/dashboard']);
      }, 5000);
      return;
    }

    this.isLoading = true;
    this.assessmentService.initializeAssessment(assessmentId).subscribe({
      next: ({ assessment, attempt }) => {
        console.log('Initialize assessment success:', { assessment, attempt }); // Debug log
        this.assessment = assessment;
        this.attempt = attempt;
        this.problems = assessment.problems;
        if (this.problems.length > 0) {
          this.currentProblem = this.problems[0];
          this.loadLanguages();
        } else {
          this.errorMessage = 'No problems found in this assessment.';
          this.snackBar.open(this.errorMessage, 'Close', { duration: 5000 });
        }
        this.startTimer();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Initialize assessment failed:', error); // Debug log
        this.errorMessage = error.message || 'Failed to initialize assessment.';
        this.snackBar.open(this.errorMessage, 'Close', { duration: 5000 });
        this.isLoading = false;
        // Delay redirect to ensure error message is visible
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 5000);
      }
    });
  }

  ngOnDestroy(): void {
    this.timerSubscription?.unsubscribe();
    this.removeProctoring();
  }

  startTimer(): void {
    if (this.assessment && this.attempt) {
      const durationMinutes = this.assessment.duration;
      const startTime = new Date(this.attempt.started_at).getTime();
      const endTime = startTime + durationMinutes * 60 * 1000;
      this.timerSubscription = interval(1000).subscribe(() => {
        const now = new Date().getTime();
        this.remainingTime = Math.max(0, Math.floor((endTime - now) / 1000));
        if (this.remainingTime <= 0) {
          this.completeAssessment(true);
        }
      });
      interval(30000).subscribe(() => {
        if (this.attempt) {
          this.assessmentService.checkTimeout(this.attempt.id).subscribe({
            next: (response) => {
              if (response.status === 'timeout') {
                this.completeAssessment(true);
              }
            }
          });
        }
      });
    }
  }

  loadLanguages(): void {
    this.apiService.getLanguages().subscribe({
      next: (languages) => {
        console.log('Languages loaded:', languages); // Debug log
        this.languages = languages;
        this.selectedLanguage = languages[0] || null;
        this.code = this.selectedLanguage?.template_code || '';
        if (!languages.length) {
          this.errorMessage = 'No programming languages available.';
          this.snackBar.open(this.errorMessage, 'Close', { duration: 5000 });
        }
      },
      error: (error) => {
        console.error('Load languages error:', error); // Debug log
        this.errorMessage = 'Failed to load programming languages.';
        this.snackBar.open(this.errorMessage, 'Close', { duration: 5000 });
      }
    });
  }

  onLanguageChange(language: ProgrammingLanguage): void {
    this.selectedLanguage = language;
    this.code = language.template_code || '';
  }

  onCodeChange(code: string): void {
    this.code = code;
  }

  runCode(): void {
    if (!this.currentProblem || !this.selectedLanguage) return;
    this.isLoading = true;
    this.showResults = false;
    this.apiService.getSampleTestCases(this.currentProblem.id).subscribe({
      next: (testCases) => {
        if (testCases.length === 0) {
          this.snackBar.open('No sample test cases available.', 'Close', { duration: 3000 });
          this.isLoading = false;
          return;
        }
        const testCase = testCases[0];
        this.apiService.runCode({
          code: this.code,
          language_id: this.selectedLanguage!.id,
          stdin: testCase.input_data
        }).subscribe({
          next: (result) => {
            this.testResults = [{
              id: 0,
              submission_id: 0,
              test_case: testCase,
              actual_output: result.stdout || result.stderr || result.compile_output || '',
              passed: result.stdout?.trim() === testCase.expected_output.trim(),
              execution_time: result.time || 0,
              memory_used: result.memory || 0
            }];
            this.showResults = true;
            this.isLoading = false;
          },
          error: (error) => {
            this.snackBar.open('Error running code.', 'Close', { duration: 3000 });
            this.isLoading = false;
          }
        });
      },
      error: (error) => {
        this.snackBar.open('Error fetching sample test cases.', 'Close', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  submitCode(): void {
    if (!this.currentProblem || !this.selectedLanguage || !this.attempt) return;
    this.isLoading = true;
    this.showResults = false;
    const submission: Submission = {
      id: 0,
      user_id: this.attempt.user, // Use string user_id from attempt
      problem_id: this.currentProblem.id,
      language_id: this.selectedLanguage.id,
      code: this.code,
      status: 'PENDING',
      submitted_at: new Date().toISOString(),
      execution_time: null,
      memory_used: null,
      error_message: '',
      language_name: this.selectedLanguage.name,
      problem_title: this.currentProblem.title
    };
    this.apiService.submitCode(submission).subscribe({
      next: (submission) => {
        this.pollSubmission(submission.id);
      },
      error: (error) => {
        this.snackBar.open('Error submitting code.', 'Close', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  pollSubmission(submissionId: number): void {
    this.apiService.getSubmission(submissionId).subscribe({
      next: (submission) => {
        if (submission.status !== 'PENDING' && submission.status !== 'PROCESSING') {
          this.apiService.getSubmissionResults(submissionId).subscribe({
            next: (results) => {
              this.testResults = results;
              this.showResults = true;
              this.isLoading = false;
            },
            error: () => {
              this.snackBar.open('Error fetching submission results.', 'Close', { duration: 3000 });
              this.isLoading = false;
            }
          });
        } else {
          setTimeout(() => this.pollSubmission(submissionId), 1000);
        }
      },
      error: () => {
        this.snackBar.open('Error polling submission status.', 'Close', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  completeAssessment(timeout: boolean = false): void {
    if (!this.attempt) return;
    this.isLoading = true;
    this.timerSubscription?.unsubscribe();
    this.assessmentService.completeAssessment(this.attempt.id).subscribe({
      next: () => {
        this.snackBar.open(timeout ? 'Assessment timed out.' : 'Assessment submitted successfully.', 'Close', { duration: 3000 });
        this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.snackBar.open('Error submitting assessment.', 'Close', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  selectProblem(index: number): void {
    this.selectedProblemIndex = index;
    this.currentProblem = this.problems[index];
    this.testResults = [];
    this.showResults = false;
    this.code = this.selectedLanguage?.template_code || '';
  }

  setupProctoring(): void {
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    window.addEventListener('blur', this.handleWindowBlur);
    window.addEventListener('beforeunload', this.handleBeforeUnload);
  }

  removeProctoring(): void {
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    window.removeEventListener('blur', this.handleWindowBlur);
    window.removeEventListener('beforeunload', this.handleBeforeUnload);
  }

  handleVisibilityChange = (): void => {
    if (document.hidden && this.attempt) {
      this.assessmentService.logProctoringEvent(this.attempt.id, 'tab_switch', 'User switched tabs').subscribe({
        next: () => {
          this.snackBar.open('Tab switch detected. Assessment will be submitted.', 'Close', { duration: 3000 });
          this.completeAssessment();
        }
      });
    }
  };

  handleWindowBlur = (): void => {
    if (this.attempt) {
      this.assessmentService.logProctoringEvent(this.attempt.id, 'window_blur', 'User switched applications').subscribe({
        next: () => {
          this.snackBar.open('Application switch detected. Assessment will be submitted.', 'Close', { duration: 3000 });
          this.completeAssessment();
        }
      });
    }
  };

  handleBeforeUnload = (event: BeforeUnloadEvent): void => {
    event.preventDefault();
    event.returnValue = 'Are you sure you want to leave? Your assessment will be submitted.';
  };
}