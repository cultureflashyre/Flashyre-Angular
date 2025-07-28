// src/app/services/mcq-assessment.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment'; // Adjust path if needed

import {
  McqsBySkillResponse,
  AssessmentPayload,
  AssessmentSaveResponse,
  LegacyAssessmentPayload, // Import new type
  LegacyAssessmentSaveResponse,
  AssessmentDetailResponse // Import new type
} from '../pages/create-job-post-1st-page/types';

@Injectable({
  providedIn: 'root'
})
export class McqAssessmentService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Fetches MCQs for a specific job post, grouped by skill.
   * @param jobUniqueId The UUID of the JobPost.
   * @param token JWT token for authentication.
   */
  getMcqsForJobPost(jobUniqueId: string, token: string): Observable<McqsBySkillResponse> {
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    // CORRECTED PATH: No leading slash, joins cleanly with apiUrl
    const endpointUrl = `${this.apiUrl}/job-post/${jobUniqueId}/mcqs/`;

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
   * Saves the assessment details to the new system.
   * @param payload The assessment data.
   * @param token JWT token for authentication.
   */
  saveAssessment(payload: AssessmentPayload, token: string): Observable<AssessmentSaveResponse> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    });


    
    // CORRECTED PATH: No leading slash
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
        console.error('Failed to save assessment, unexpected response structure:', response);
        throw new Error('Failed to save assessment or unexpected response structure from server.');
      }),
      catchError(this.handleError)
    );
  }

  getAssessmentDetails(assessmentId: string, token: string): Observable<AssessmentDetailResponse> {
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    const endpoint = `${this.apiUrl}/api/mcq-assessments/${assessmentId}/`;
    return this.http.get<AssessmentDetailResponse>(endpoint, { headers });
  }

  updateAssessment(assessmentId: string, payload: AssessmentPayload, token: string): Observable<AssessmentDetailResponse> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    const endpoint = `${this.apiUrl}/api/mcq-assessments/${assessmentId}/`;
    // Use PUT for a full replacement of data
    return this.http.put<AssessmentDetailResponse>(endpoint, payload, { headers });
  }

  /**
   * NEW METHOD
   * Saves the assessment details to the legacy 'trial_assessments' system.
   * @param payload The data required to create a legacy assessment.
   * @param token JWT token for authentication.
   */
  createLegacyAssessment(payload: LegacyAssessmentPayload, token: string): Observable<LegacyAssessmentSaveResponse> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    
    // === THE FIX IS HERE ===
    // 1. Path changed from '/api/mcq-assessment/...' to '/api/mcq-assessments/...' (plural)
    // 2. Removed the leading slash to prevent the double-slash issue.
    const endpoint = `${this.apiUrl}/api/mcq-assessments/legacy/create/`;

    return this.http.post<{ status: string; data: LegacyAssessmentSaveResponse }>(endpoint, payload, { headers }).pipe(
        map(response => {
            if (response.status === 'success' && response.data) {
                return response.data;
            }
            console.error('Failed to save legacy assessment, unexpected response structure:', response);
            throw new Error('Failed to save legacy assessment or unexpected response structure.');
        }),
        catchError(this.handleError)
    );
  }


  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred!';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `A client-side error occurred: ${error.error.message}`;
    } else {
      // Log the full error response from the backend for better debugging
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
        errorMessage = error.error.detail; // Standard DRF error for Not Found, etc.
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