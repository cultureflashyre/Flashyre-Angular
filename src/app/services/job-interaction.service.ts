// src/app/services/job-interaction.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

/**
 * This dedicated service handles all user interactions with jobs,
 * such as disliking or saving. It keeps this logic separate from
 * core services like CandidateService and JobsService.
 */
@Injectable({
  providedIn: 'root'
})
export class JobInteractionService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Toggles the 'disliked' status of a job for the authenticated user.
   * The backend identifies the user via the JWT provided by an interceptor.
   * @param jobId The ID of the job to dislike or undislike.
   * @returns An observable containing the new dislike status from the backend.
   */
  toggleDislikeStatus(jobId: string): Observable<{ disliked: boolean }> {
    const url = `${this.apiUrl}api/jobs/${jobId}/toggle-dislike/`;

    // The request body is empty as the backend identifies the user from the token.
    return this.http.post<{ disliked: boolean }>(url, {}).pipe(
      catchError(error => {
        // Provide clear, specific error context for easier debugging.
        console.error(`API Error in JobInteractionService: Failed to toggle dislike for job ${jobId}`, error);
        // Return a user-friendly error message to the component.
        return throwError(() => new Error('Your request to dislike the job could not be completed.'));
      })
    );
  }

  /**
   * Toggles the 'saved' status of a job for the authenticated user.
   * @param jobId The ID of the job to save or unsave.
   * @returns An observable containing the new saved status from the backend.
   */
  toggleSaveStatus(jobId: string): Observable<{ saved: boolean }> {
    const url = `${this.apiUrl}api/jobs/${jobId}/toggle-save/`;

    return this.http.post<{ saved: boolean }>(url, {}).pipe(
      catchError(error => {
        console.error(`API Error in JobInteractionService: Failed to toggle save for job ${jobId}`, error);
        return throwError(() => new Error('Your request to save the job could not be completed.'));
      })
    );
  }
}