// src/app/services/mcq-assessment.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

import {
  McqsBySkillResponse,
  AssessmentPayload,
  AssessmentSaveResponse,
  LegacyAssessmentPayload,
  LegacyAssessmentSaveResponse,
  AssessmentDetailResponse
} from '../pages/create-job-post-1st-page/types';

@Injectable({
  providedIn: 'root'
})
export class McqAssessmentService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getMcqsForJobPost(jobUniqueId: string, token: string): Observable<McqsBySkillResponse> {
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    const endpointUrl = `${this.apiUrl}/job-post/${jobUniqueId}/mcqs/`;

    return this.http.get<{ status: string; data: McqsBySkillResponse }>(endpointUrl, { headers }).pipe(
      map(response => {
        if (response.status === 'success' && response.data) {
          return response.data;
        }
        throw new Error('Failed to fetch MCQs or unexpected response structure from server.');
      }),
      catchError(this.handleError)
    );
  }

  saveAssessment(payload: AssessmentPayload, token: string): Observable<AssessmentSaveResponse> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    const endpoint = `${this.apiUrl}api/mcq-assessments/create/`;

    return this.http.post<{ status: string; data: AssessmentSaveResponse; errors?: any }>(endpoint, payload, { headers }).pipe(
      map(response => {
        if (response.status === 'success' && response.data) {
          return response.data;
        }
        if (response.errors) {
            const allErrorValues: unknown[] = Object.values(response.errors);
            const flattenedErrors: string[] = allErrorValues.reduce<string[]>((acc: string[], val: unknown) => {
                if (Array.isArray(val)) {
                    return acc.concat(val.map(String));
                }
                return acc.concat(String(val));
            }, [] as string[]);
            const errorMessages = flattenedErrors.join(' ');
            throw new Error(errorMessages || 'Assessment saving failed due to validation errors.');
        }
        throw new Error('Failed to save assessment or unexpected response structure from server.');
      }),
      catchError(this.handleError)
    );
  }

  getAssessmentDetails(assessmentId: string, token: string): Observable<AssessmentDetailResponse> {
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    const endpoint = `${this.apiUrl}api/mcq-assessments/${assessmentId}/`;
    return this.http.get<AssessmentDetailResponse>(endpoint, { headers });
  }

  updateAssessment(assessmentId: string, payload: AssessmentPayload, token: string): Observable<AssessmentDetailResponse> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    const endpoint = `${this.apiUrl}api/mcq-assessments/${assessmentId}/`;
    return this.http.put<AssessmentDetailResponse>(endpoint, payload, { headers });
  }
  
  /**
   * THIS IS THE MISSING METHOD - NOW ADDED
   * Fetches the latest assessment for a job. Returns null if none is found (404).
   * @param jobUniqueId The UUID of the JobPost.
   * @param token JWT token.
   */
  getLatestAssessmentForJob_OLD(jobUniqueId: string, token: string): Observable<AssessmentDetailResponse | null> {
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    const endpoint = `${this.apiUrl}api/mcq-assessments/job/${jobUniqueId}/latest/`;
    
    return this.http.get<AssessmentDetailResponse>(endpoint, { headers }).pipe(
        catchError(err => {
            if (err.status === 404) {
                return of(null); // Return null if no assessment is found, this is not an error.
            }
            return throwError(() => err); // Re-throw other errors.
        })
    );
  }

  getLatestAssessmentForJob(jobUniqueId: string, token: string, source: string): Observable<AssessmentDetailResponse | null> {
      const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
      // Append `source` query parameter
      const endpoint = `${this.apiUrl}api/mcq-assessments/job/${jobUniqueId}/latest/?source=${encodeURIComponent(source)}`;

      return this.http.get<AssessmentDetailResponse>(endpoint, { headers }).pipe(
          catchError(err => {
              if (err.status === 404) {
                  return of(null); // No assessment found is not an error
              }
              return throwError(() => err);
          })
      );
  }



  createLegacyAssessment(payload: LegacyAssessmentPayload, token: string): Observable<LegacyAssessmentSaveResponse> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    const endpoint = `${this.apiUrl}api/mcq-assessments/legacy/create/`;

    return this.http.post<{ status: string; data: LegacyAssessmentSaveResponse }>(endpoint, payload, { headers }).pipe(
        map(response => {
            if (response.status === 'success' && response.data) {
                return response.data;
            }
            throw new Error('Failed to save legacy assessment or unexpected response structure.');
        }),
        catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    // ... (This function remains unchanged)
    let errorMessage = 'An unknown error occurred!';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `A client-side error occurred: ${error.error.message}`;
    } else {
      console.error(
        `Backend returned code ${error.status}, ` +
        `body was:`, error.error);

      if (error.status === 0) {
        errorMessage = 'Cannot connect to the server. Please check your network connection or if the server is running.';
      } else if (error.error && typeof error.error === 'string') {
        errorMessage = error.error;
      } else if (error.error && error.error.message && typeof error.error.message === 'string') {
        errorMessage = error.error.message;
      } else if (error.error && error.error.detail && typeof error.error.detail === 'string') {
        errorMessage = error.error.detail;
      } else if (error.error && error.error.errors && typeof error.error.errors === 'object') {
        const errors = error.error.errors;
        const messages = Object.keys(errors)
          .map(key => {
            const errorValue = errors[key];
            const errorText = Array.isArray(errorValue) ? errorValue.join(', ') : String(errorValue);
            return `${key}: ${errorText}`;
          })
          .join('; ');
        errorMessage = messages || `Validation errors occurred (Status: ${error.status})`;
      } else {
        errorMessage = `Server error (Status: ${error.status}). Please try again later.`;
      }
    }
    return throwError(() => new Error(errorMessage));
  }
}