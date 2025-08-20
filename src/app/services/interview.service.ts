// src/app/services/interview.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

/**
 * Defines the structure of a single interview stage object that the
 * backend API expects.
 */
export interface InterviewStage {
  stage_name: string;
  stage_date: string; // Must be in 'YYYY-MM-DD' format
  mode: 'Online' | 'Offline';
  assigned_to: string; // Must be a valid email
  order: number;
}

@Injectable({
  providedIn: 'root'
})
export class InterviewService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Sends the complete set of interview stages to the backend to finalize
   * the job post creation workflow.
   * @param jobUniqueId The unique identifier for the parent JobPost.
   * @param stages An array of interview stage objects to be saved.
   * @param token The JWT token for authentication.
   * @returns An Observable of the HTTP response.
   */
  finalizeJobPost(jobUniqueId: string, stages: InterviewStage[], token: string): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    
    // This endpoint orchestrates the finalization of the job post on the backend.
    const endpoint = `${this.apiUrl}api/job-post/${jobUniqueId}/finalize/`;
    
    return this.http.post(endpoint, stages, { headers });
  }
}