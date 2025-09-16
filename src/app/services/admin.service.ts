// src/app/services/admin.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';


// ==============================================================================
// INTERFACES FOR TYPE SAFETY
// ==============================================================================

/**
 * Represents the detailed data structure of a parsed Job Description.
 */
export interface JobDescription {
  job_id: number;
  role: string;
  location: string;
  total_experience_min: string;
  total_experience_max: string;
  relevant_experience_min: string;
  relevant_experience_max: string;
  notice_period: string;
  must_have_skills: string[];
  good_to_have_skills: string[];
  education_requirements: string;
  certification_requirements: string;
  job_description: string;
  created_at: string;
}

/**
 * --- MODIFIED ---
 * Represents a candidate object. Added the new `batch_date` property.
 */
export interface Candidate {
  candidate_id: number;
  batch_id: number;
  batch_date?: string; // --- NEW: To hold the upload date of the batch ---
  full_name: string;
  email: string;
  phone: string;
  total_experience: string;
  relevant_experience: string;
  location: string;
  skills: any;
  education: string;
  certification: string;
  cv_file_path: string;
  has_account: 'Yes' | 'No' | null;
  account_creation_email_sent: 'Yes' | 'No';
  email_sent_date: string | null;
  created_at: string;
  updated_at: string;
  selected?: boolean;
}

/**
 * Represents a candidate object after being scored against a JD.
 */
export interface SourcedCandidate {
  candidate_id: number;
  full_name: string;
  email: string;
  cv_file_path: string;
  job_match_score: number;
}


@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = environment.apiUrl;
  private activeJdSubject = new BehaviorSubject<JobDescription | null>(null);
  public activeJd$ = this.activeJdSubject.asObservable();

  constructor(private http: HttpClient) {
    this.getLatestJd().subscribe();
  }

  // ==============================================================================
  // CV WORKFLOW METHODS
  // ==============================================================================

  /**
   * --- NEW: Fetches the distinct dates of all CV upload batches.
   * @returns An Observable array of date strings (YYYY-MM-DD).
   */
  getBatchDates(): Observable<string[]> {
    console.log("Inside ADMIN SERVICE...getBatchDates() called...");
    return this.http.get<string[]>(`${this.apiUrl}candidates/batch-dates/`);
  }

  uploadCVs(files: File[]): Observable<any> {
    console.log("Inside ADMIN SERVICE...uploadCVs() called...");
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file, file.name);
    });
    return this.http.post(`${this.apiUrl}candidates/upload-cvs/`, formData);
  }

  getCandidates(filterDate?: string): Observable<Candidate[]> {
    console.log("Inside ADMIN SERVICE...getCandidates() called...");
    let params = new HttpParams();
    if (filterDate) {
      params = params.set('batch_date', filterDate);
    }
    return this.http.get<Candidate[]>(`${this.apiUrl}candidates/draft/`, { params });
  }

  deleteCandidate(candidateId: number): Observable<any> {
    console.log("Inside ADMIN SERVICE...deleteCandidate() called...");
    return this.http.delete(`${this.apiUrl}candidates/draft/${candidateId}/`);
  }

  sendRegistrationInvites(candidateIds: number[]): Observable<any> {
    console.log("Inside ADMIN SERVICE...sendRegistrationInvites() called...");
    return this.http.post(`${this.apiUrl}candidates/send-invites/`, { candidate_ids: candidateIds });
  }

  // ==============================================================================
  // JOB DESCRIPTION (JD) WORKFLOW METHODS
  // ==============================================================================

  getLatestJd(): Observable<JobDescription> {
    console.log("Inside ADMIN SERVICE...getLatestJd() called...");
    return this.http.get<JobDescription>(`${this.apiUrl}jd/latest/`).pipe(
      tap(jd => this.activeJdSubject.next(jd))
    );
  }

  uploadJd(file: File): Observable<JobDescription> {
    console.log("Inside ADMIN SERVICE...uploadJd() called...");
    const formData = new FormData();
    formData.append('file', file, file.name);
    return this.http.post<JobDescription>(`${this.apiUrl}jd/upload/`, formData).pipe(
      tap(newJd => this.activeJdSubject.next(newJd))
    );
  }

  // ==============================================================================
  // CANDIDATE SOURCING & REPORTING METHODS
  // ==============================================================================

  getSourcedCandidates(jobId: number, sortBy: string): Observable<SourcedCandidate[]> {
    console.log("Inside ADMIN SERVICE...getSourcedCandidates() called...");
    const params = new HttpParams()
      .set('job_id', jobId.toString())
      .set('sort_by', sortBy);
    return this.http.get<SourcedCandidate[]>(`${this.apiUrl}candidates/sourced/`, { params });
  }

  getSecureCvUrl(candidateId: number): Observable<{ url: string }> {
    console.log("Inside ADMIN SERVICE...getSecureCvUrl() called...");
    return this.http.get<{ url: string }>(`${this.apiUrl}candidates/${candidateId}/generate-cv-url/`);
  }
  
  downloadSelectedReport(jobId: number, candidateIds: number[]): Observable<Blob> {
    console.log("Inside ADMIN SERVICE...downloadSelectedReport() called...");
    const payload = {
      job_id: jobId,
      candidate_ids: candidateIds
    };
    return this.http.post(`${this.apiUrl}report/download/`, payload, { responseType: 'blob' });
  }
  
  downloadCandidateReport(jobId: number): Observable<Blob> {
    console.log("Inside ADMIN SERVICE...downloadCandidateReport() called...");
    const params = new HttpParams().set('job_id', jobId.toString());
    return this.http.get(`${this.apiUrl}report/download/`, { params, responseType: 'blob' });
  }
}