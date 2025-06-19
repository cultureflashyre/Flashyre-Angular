// src/app/services/mcq-assessment/mcq-assessment.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment'; // Adjust path if needed
import { McqsBySkillResponse, AssessmentPayload, AssessmentSaveResponse } from '../pages/create-job-post-1st-page/types'; // Assuming types are in this path, adjust if necessary

@Injectable({
  providedIn: 'root'
})
export class McqAssessmentService {
  private readonly apiUrlFromEnv = environment.apiUrl; // e.g., 'http://localhost:8000/'

  constructor(private http: HttpClient) {}

  /**
   * Fetches MCQs for a specific job post, grouped by skill.
   * @param jobUniqueId The UUID of the JobPost.
   * @param token JWT token for authentication.
   */
  getMcqsForJobPost(jobUniqueId: string, token: string): Observable<McqsBySkillResponse> {
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    // apiUrlFromEnv is 'http://localhost:8000/'
    // Target URL is 'http://localhost:8000/job-post/<job_unique_id>/mcqs/'
    // This construction is correct given the Django project's root include for job_post.urls.
    const endpointUrl = `${this.apiUrlFromEnv}job-post/${jobUniqueId}/mcqs/`;

    return this.http.get<{ status: string; data: McqsBySkillResponse }>(endpointUrl, { headers }).pipe(
      map(response => {
        if (response.status === 'success' && response.data) {
          return response.data;
        }
        console.error('Failed to fetch MCQs, unexpected response structure:', response);
        throw new Error('Failed to fetch MCQs or unexpected response structure from server.');
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Saves the assessment details.
   * @param payload The assessment data.
   * @param token JWT token for authentication.
   */
  saveAssessment(payload: AssessmentPayload, token: string): Observable<AssessmentSaveResponse> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    // apiUrlFromEnv is 'http://localhost:8000/'
    // Target URL is 'http://localhost:8000/api/mcq-assessments/create/'
    // We need to add 'api/' to the path.
    const endpoint = `${this.apiUrlFromEnv}api/mcq-assessments/create/`;

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
        console.error('Failed to save assessment, unexpected response structure:', response);
        throw new Error('Failed to save assessment or unexpected response structure from server.');
      }),
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
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