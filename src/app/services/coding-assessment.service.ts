import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Assessment, AssessmentAttempt } from '../pages/coding-assessment/models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AssessmentService {
  private apiUrl: string;

  constructor(private http: HttpClient, private snackBar: MatSnackBar) {
    // Normalize apiUrl: remove leading and trailing slashes
    this.apiUrl = 'http://localhost:8000/api'.replace(/^\/+|\/+$/g, '');
    console.log('AssessmentService apiUrl:', this.apiUrl); // Debug log
  }

  // Initialize assessment by fetching data and starting attempt
  initializeAssessment(assessmentId: number): Observable<{ assessment: Assessment, attempt: AssessmentAttempt }> {
    return this.getAssessment(assessmentId).pipe(
      switchMap(assessment => {
        console.log('Assessment fetched:', assessment); // Debug log
        if (!assessment.is_active) {
          console.error('Assessment is not active:', assessmentId);
          throw new Error(`Assessment ${assessmentId} is not active.`);
        }
        return this.startAssessment(assessmentId).pipe(
          map(attempt => {
            console.log('Attempt created:', attempt); // Debug log
            return { assessment, attempt };
          })
        );
      }),
      catchError(error => {
        console.error('Initialize assessment error:', error); // Debug log
        let message = 'Failed to initialize assessment.';
        if (error instanceof HttpErrorResponse) {
          message = `Error ${error.status}: ${error.message || 'Unknown error'} for assessment ${assessmentId}`;
        }
        this.snackBar.open(message, 'Close', { duration: 5000 });
        return throwError(() => new Error(message));
      })
    );
  }

  getAssessment(assessmentId: number): Observable<Assessment> {
    const url = `${this.apiUrl}/assessments/${assessmentId}/`;
    console.log('getAssessment URL:', url); // Debug log
    return this.http.get<Assessment>(url).pipe(
      map(response => {
        console.log('GET /assessments response:', response); // Debug log
        return response;
      }),
      catchError(error => {
        console.error('GET /assessments error:', error); // Debug log
        let message = `Failed to load assessment ${assessmentId}.`;
        if (error instanceof HttpErrorResponse) {
          message = `Error ${error.status}: ${error.message || 'Unknown error'}`;
        }
        return throwError(() => new Error(message));
      })
    );
  }

  startAssessment(assessmentId: number): Observable<AssessmentAttempt> {
    const url = `${this.apiUrl}/assessments/${assessmentId}/start_attempt/`;
    console.log('startAssessment URL:', url); // Debug log
    return this.http.post<AssessmentAttempt>(url, {}).pipe(
      map(response => {
        console.log('POST /start_attempt response:', response); // Debug log
        return response;
      }),
      catchError(error => {
        console.error('POST /start_attempt error:', error); // Debug log
        let message = `Failed to start assessment ${assessmentId}.`;
        if (error instanceof HttpErrorResponse) {
          message = `Error ${error.status}: ${error.message || 'Unknown error'}`;
        }
        return throwError(() => new Error(message));
      })
    );
  }

  completeAssessment(attemptId: number): Observable<AssessmentAttempt> {
    const url = `${this.apiUrl}/attempts/${attemptId}/complete/`;
    console.log('completeAssessment URL:', url); // Debug log
    return this.http.post<AssessmentAttempt>(url, {}).pipe(
      catchError(() => {
        return throwError(() => new Error('Failed to complete assessment.'));
      })
    );
  }

  checkTimeout(attemptId: number): Observable<{ status: string }> {
    const url = `${this.apiUrl}/attempts/${attemptId}/check_timeout/`;
    console.log('checkTimeout URL:', url); // Debug log
    return this.http.get<{ status: string }>(url).pipe(
      catchError(() => {
        return throwError(() => new Error('Failed to check timeout.'));
      })
    );
  }

  logProctoringEvent(attemptId: number, eventType: string, description: string): Observable<any> {
    const url = `${this.apiUrl}/assessments/${attemptId}/proctoring_event/`;
    console.log('logProctoringEvent URL:', url); // Debug log
    return this.http.post(url, {
      event_type: eventType,
      description
    }).pipe(
      catchError(() => {
        return throwError(() => new Error('Failed to log proctoring event.'));
      })
    );
  }
}