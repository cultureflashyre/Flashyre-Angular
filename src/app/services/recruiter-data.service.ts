// src/app/services/recruiter-data.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Define interfaces for the expected data shapes
export interface RecruiterProfile {
  profile_picture_url: string;
  recruiter_name: string;
  company_name: string;
  job_role_of_recruiter: string;
}

export interface JobPost {
  job_id: number;
  company_image_url: string;
  job_role: string;
  experience_location: string;
  number_of_candidates_applied: string;
  created_at: string;
   description: string;
  requirements: string;
  job_type: string;
  experience_required: number;
  location: string;
  company_name: string;
  updated_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class RecruiterDataService {
  // Adjust the base URL to your Django backend's address
  private apiUrl = 'http://127.0.0.1:8000/recruiter';

  constructor(private http: HttpClient) { }

  // Method to get the recruiter's profile
  getRecruiterProfile(recruiterId: string): Observable<RecruiterProfile> {
    return this.http.get<RecruiterProfile>(`${this.apiUrl}/profile/?recruiter_id=${recruiterId}`);
  }

  // Method to get the jobs posted by the recruiter
  getRecruiterJobs(recruiterId: string, page: number): Observable<{ jobs: JobPost[] }> {
    return this.http.get<{ jobs: JobPost[] }>(`${this.apiUrl}/jobs/?recruiter_id=${recruiterId}&page=${page}`);
  }
}