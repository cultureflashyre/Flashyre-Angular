// src/app/services/interview.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface InterviewStageData {
  stage_name: string;
  stage_date: string;
  mode: 'Online' | 'Offline';
  assigned_to: string;
  order: number;
}

export interface InterviewStage {
  stage_name: string;
  stage_date: string;
  mode: string;
  assigned_to: string;
  order: number;
  user_id: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class InterviewService {

  // CORRECTED: The base URL for this service points to the /api/interview/ path
  private apiUrl = `${environment.apiUrl}api/interview/`;

  constructor(private http: HttpClient) {}

  getInterviewStages(jobUniqueId: string, token: string): Observable<InterviewStageData[]> {
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    // The URL now correctly builds on the service's apiUrl
    const endpoint = `${this.apiUrl}job-post/${jobUniqueId}/stages/`;
    return this.http.get<InterviewStageData[]>(endpoint, { headers });
  }

  finalizeJobPost(jobUniqueId: string, stages: InterviewStage[], token: string): Observable<any> {
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    // The URL now correctly builds on the service's apiUrl
    const endpoint = `${this.apiUrl}job-post/${jobUniqueId}/finalize/`;
    return this.http.post(endpoint, stages, { headers });
  }
}