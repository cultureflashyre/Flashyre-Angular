// src/app/services/recruiter-data.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

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
}


@Injectable({
  providedIn: 'root'
})
export class RecruiterDataService {
  private apiUrl = environment.apiUrl + 'recruiter';
  private jobPostApiUrl = environment.apiUrl + 'job-post'; // This URL is correct for job_post app

  constructor(private http: HttpClient) { }

  // Method to get the recruiter's profile
  getRecruiterProfile(recruiterId: string): Observable<any> { // Change RecruiterProfile to any if it's not fully defined
    return this.http.get<any>(`${this.apiUrl}/profile/?recruiter_id=${recruiterId}`);
  }

  // Method to get the jobs posted by the recruiter
  getRecruiterJobs(recruiterId: string | null, page: number): Observable<{ jobs: JobPost[] }> {
    return this.http.get<{ jobs: JobPost[] }>(`${this.apiUrl}/jobs/?recruiter_id=${recruiterId}&page=${page}`);
  }

  updateJobStatus(uniqueId: string, status: 'final' | 'draft' | 'pause' | 'deleted'): Observable<any> {
    return this.http.post(`${this.jobPostApiUrl}/update-status/`, {
      unique_id: uniqueId,
      status: status
    });
  }

  // ADDED: Method to get a single job post's details
  getJobDetails(uniqueId: string): Observable<JobPost> {
    return this.http.get<JobPost>(`${this.jobPostApiUrl}/detail/${uniqueId}/`);
  }
}