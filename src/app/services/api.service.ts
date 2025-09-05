import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProgrammingLanguage, Submission, TestCase } from '../pages/coding-assessment/models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl: string;
  private languages: ProgrammingLanguage[] = []; // Cache languages for runCode

  constructor(private http: HttpClient, private snackBar: MatSnackBar) {
    // Normalize apiUrl: remove leading and trailing slashes
    this.apiUrl = 'http://localhost:8000/api'.replace(/^\/+|\/+$/g, '');
    console.log('ApiService apiUrl:', this.apiUrl); // Debug log
  }

  getLanguages(): Observable<ProgrammingLanguage[]> {
    const url = `${this.apiUrl}/languages/`;
    console.log('getLanguages URL:', url); // Debug log
    return this.http.get<ProgrammingLanguage[]>(url).pipe(
      map(response => {
        console.log('GET /languages response:', response); // Debug log
        this.languages = response; // Cache languages
        return response;
      }),
      catchError(error => {
        console.error('GET /languages error:', error); // Debug log
        let message = 'Failed to load programming languages.';
        if (error instanceof HttpErrorResponse) {
          message = `Error ${error.status}: ${error.message || 'Unknown error'}`;
        }
        this.snackBar.open(message, 'Close', { duration: 5000 });
        return of([]);
      })
    );
  }

  getSampleTestCases(problemId: number): Observable<TestCase[]> {
    const url = `${this.apiUrl}/problems/${problemId}/sample_cases/`;
    console.log('getSampleTestCases URL:', url); // Debug log
    return this.http.get<TestCase[]>(url).pipe(
      catchError(() => {
        this.snackBar.open('Error fetching sample test cases.', 'Close', { duration: 3000 });
        return of([]);
      })
    );
  }

  runCode(data: { code: string; language_id: number; stdin: string }): Observable<any> {
    const url = `${this.apiUrl}/submissions/run_code/`; // Backend proxy to Piston
    console.log('runCode URL:', url); // Debug log
    const language = this.languages.find(lang => lang.id === data.language_id);
    if (!language) {
      this.snackBar.open('Language not found.', 'Close', { duration: 3000 });
      return throwError(() => new Error('Language not found.'));
    }
    const pistonData = {
      language: language.piston_name,
      version: language.piston_version,
      files: [{ content: data.code }],
      stdin: data.stdin
    };
    return this.http.post(url, pistonData).pipe(
      map(response => {
        console.log('Piston runCode response:', response); // Debug log
        return {
          stdout: response['run']?.['stdout'] || '',
          stderr: response['run']?.['stderr'] || '',
          compile_output: response['compile']?.['output'] || '',
          time: response['run']?.['signal'] ? 0 : (response['run']?.['time'] * 1000 || 0),
          memory: response['run']?.['memory'] || 0
        };
      }),
      catchError(() => {
        this.snackBar.open('Error running code.', 'Close', { duration: 3000 });
        return throwError(() => new Error('Error running code.'));
      })
    );
  }

  submitCode(submission: Submission): Observable<Submission> {
    const url = `${this.apiUrl}/submissions/`;
    console.log('submitCode URL:', url); // Debug log
    return this.http.post<Submission>(url, submission).pipe(
      catchError(() => {
        this.snackBar.open('Error submitting code.', 'Close', { duration: 3000 });
        return throwError(() => new Error('Error submitting code.'));
      })
    );
  }

  getSubmission(submissionId: number): Observable<Submission> {
    const url = `${this.apiUrl}/submissions/${submissionId}/`;
    console.log('getSubmission URL:', url); // Debug log
    return this.http.get<Submission>(url).pipe(
      catchError(() => {
        this.snackBar.open('Error polling submission status.', 'Close', { duration: 3000 });
        return throwError(() => new Error('Error polling submission status.'));
      })
    );
  }

  getSubmissionResults(submissionId: number): Observable<any[]> {
    const url = `${this.apiUrl}/submissions/${submissionId}/results/`;
    console.log('getSubmissionResults URL:', url); // Debug log
    return this.http.get<any[]>(url).pipe(
      catchError(() => {
        this.snackBar.open('Error fetching submission results.', 'Close', { duration: 3000 });
        return of([]);
      })
    );
  }
}