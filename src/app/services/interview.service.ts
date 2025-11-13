// src/app/services/interview.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// export interface InterviewStageData {
//   stage_name: string;
//   stage_date: string;
//   mode: 'Online' | 'Offline';
//   assigned_to: string;
//   order: number;
// }

export interface InterviewStage {
  id: number; // This is now correctly expected from the API
  stage_name: string;
  stage_date: string;
  mode: string;
  assigned_to: string;
  order: number;
  user_id?: string | null; // Make this optional by adding a '?'
  count?: number; 
}

@Injectable({
  providedIn: 'root'
})
export class InterviewService {

  // CORRECTED: The base URL for this service points to the /api/interview/ path
  private apiUrl = `${environment.apiUrl}api/interview/`;
  private recruiterApiUrl = `${environment.apiUrl}api/recruiter/`; 


  constructor(private http: HttpClient) {}

  getInterviewStages(jobUniqueId: string, token: string): Observable<InterviewStage[]> {
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    const endpoint = `${this.apiUrl}job-post/${jobUniqueId}/stages/`;
    return this.http.get<InterviewStage[]>(endpoint, { headers });
  }

  /**
   * Fetches the full details of the latest assessment for a given job.
   * @param jobId The primary key (ID) of the JobPost.
   * @param token The user's authentication token.
   * @returns An Observable containing the detailed assessment data.
   */
  getAssessmentDetailsForJob(jobId: string, token: string): Observable<any> {
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    // This line has been corrected to use the 'recruiterApiUrl'
    const endpoint = `${this.recruiterApiUrl}jobs/${jobId}/assessment-details/`;
    return this.http.get<any>(endpoint, { headers });
  }

  finalizeJobPost(jobUniqueId: string, stages: InterviewStage[], token: string): Observable<any> {
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    // The URL now correctly builds on the service's apiUrl
    const endpoint = `${this.apiUrl}job-post/${jobUniqueId}/finalize/`;
    return this.http.post(endpoint, stages, { headers });
  }

  saveDraftStages(jobUniqueId: string, stages: InterviewStage[], token: string): Observable<any> {
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    const endpoint = `${this.apiUrl}job-post/${jobUniqueId}/save-draft/`;
    return this.http.post(endpoint, stages, { headers });
  }

  deleteInterviewStage(stageId: number, token: string): Observable<any> {
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    const endpoint = `${this.apiUrl}stages/${stageId}/delete/`;
    return this.http.delete(endpoint, { headers });
  }

  addInterviewStage(jobUniqueId: string, stageData: InterviewStage, token: string): Observable<any> {
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    const endpoint = `${this.apiUrl}job-post/${jobUniqueId}/add-stage/`;
    return this.http.post(endpoint, stageData, { headers });
  }
}