// src/app/services/recruiter-data.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http'; // <-- MODIFIED: Imported HttpHeaders
import { Observable, of } from 'rxjs'; // <-- MODIFIED: Imported 'of' for error handling
import { environment } from '../../environments/environment';
import { CorporateAuthService } from './corporate-auth.service'; // <-- ADDED: Import your auth service

// Make sure JobPost interface includes all fields from your backend's JobPost model
export interface JobPost {

  job_id?: number; // Optional as it might be 'id' in backend
  unique_id: string; // Crucial for editing
  company_image_url: string; // If this comes from backend
  job_role: string; // Frontend uses `job_role`, backend `role`
  experience_location: string;
  number_of_candidates_applied: string;
  created_at: string;
  status: 'final' | 'draft' | 'pause' | 'deleted';

  // Add all fields from backend JobPost model here for editing
  role: string; // matches backend
  location: string; // backend stores as string, frontend as array

  job_type: string;
  workplace_type: string;
  total_experience_min: number; 
  total_experience_max: number;
  relevant_experience_min: number;
  relevant_experience_max: number;
  budget_type: string;
  min_budget: number;
  max_budget: number;
  notice_period: string;
  skills: { primary: { skill: string, skill_confidence: number, type_confidence: number }[], secondary: { skill: string, skill_confidence: number, type_confidence: number }[] }; // JSONField
  job_description: string;
  job_description_url: string;
  company_name: string; // matches backend
  updated_at?: string;
  is_deleted?: boolean;
  description: string;
  requirements: string;
  experience_required: number;
}


@Injectable({
  providedIn: 'root'
})
export class RecruiterDataService {
  private apiUrl = environment.apiUrl + 'recruiter';
  private jobPostApiUrl = environment.apiUrl + 'job-post';

  // MODIFIED: Injected the CorporateAuthService
  constructor(
    private http: HttpClient,
    private corporateAuthService: CorporateAuthService
  ) { }

  // ADDED: A private helper function to get authenticated headers
  private getAuthHeaders(): HttpHeaders | null {
    const token = this.corporateAuthService.getJWTToken();
    if (!token) {
      console.error("Authentication token not found!");
      return null;
    }
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  getRecruiterProfile(recruiterId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    if (!headers) return of(null); // Return empty observable if no token
    return this.http.get<any>(`${this.apiUrl}/profile/?recruiter_id=${recruiterId}`, { headers });
  }

  getRecruiterJobs(recruiterId: string | null, page: number): Observable<{ jobs: JobPost[] }> {
    const headers = this.getAuthHeaders();
    if (!headers) return of({ jobs: [] }); // Return empty job list if no token
    return this.http.get<{ jobs: JobPost[] }>(`${this.apiUrl}/jobs/?recruiter_id=${recruiterId}&page=${page}`, { headers });
  }

  updateJobStatus(uniqueId: string, status: 'final' | 'draft' | 'pause' | 'deleted'): Observable<any> {
    const headers = this.getAuthHeaders();
    if (!headers) return of(null);
    const body = {
      unique_id: uniqueId,
      status: status
    };
    return this.http.post(`${this.jobPostApiUrl}/update-status/`, body, { headers });
  }

  // MODIFIED: This function now includes the Authorization header and has no trailing slash.
  getJobDetails(uniqueId: string): Observable<JobPost> {
    const headers = this.getAuthHeaders();
    if (!headers) {
      return new Observable(observer => observer.error('No authentication token found'));
    }
    // Corrected URL without trailing slash and with headers object
    return this.http.get<JobPost>(
      `${this.jobPostApiUrl}/detail/${uniqueId}`, // No trailing slash
      { headers: headers } // Pass the headers here
    );
  }
}