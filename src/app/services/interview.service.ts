// src/app/services/interview.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface InterviewStage {
  stage_name: string;
  stage_date: string; // Format as YYYY-MM-DD
  mode: 'Online' | 'Offline';
  assigned_to: string;
  order: number;
}

@Injectable({
  providedIn: 'root'
})
export class InterviewService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  saveInterviewStages(jobUniqueId: string, stages: InterviewStage[], token: string): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    const endpoint = `${this.apiUrl}/job-post/${jobUniqueId}/stages/`;
    return this.http.post(endpoint, stages, { headers });
  }
}