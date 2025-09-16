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
 * Represents a candidate object returned by the original CV list component.
 * This interface now includes the batch_date for dynamic filtering.
 */
export interface Candidate {
  candidate_id: number;
  batch_id: number;
  batch_date?: string; // The upload date of the batch
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
 * This is used in the "Candidate Sourced" component.
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
  /**
   * The base URL for the Django API. Using a relative path is best practice,
   * relying on a proxy.conf.json file for local development to avoid CORS issues.
   */
  private apiUrl = environment.apiUrl;

  /**
   * A private BehaviorSubject that holds the currently active JobDescription.
   * Components can subscribe to its public observable counterpart.
   */
  private activeJdSubject = new BehaviorSubject<JobDescription | null>(null);

  /**
   * The public observable that components will subscribe to in order to get
   * updates on the latest active Job Description.
   */
  public activeJd$ = this.activeJdSubject.asObservable();

  constructor(private http: HttpClient) {
    // When the application starts, immediately try to fetch the latest JD
    // to populate the initial state.
    this.getLatestJd().subscribe();
  }

  // ==============================================================================
  // CV WORKFLOW METHODS
  // ==============================================================================
  
  /**
   * Fetches the distinct dates of all CV upload batches.
   * Used to dynamically generate date filter buttons in the UI.
   * @returns An Observable array of date strings (YYYY-MM-DD).
   */
  getBatchDates(): Observable<string[]> {
    console.log("Inside ADMIN SERVICE...getBatchDates() called...");
    return this.http.get<string[]>(`${this.apiUrl}candidates/batch-dates/`);
  }

  /**
   * Uploads an array of CV files to the backend for processing.
   * @param files The array of CV files to upload.
   * @returns An Observable with the backend's success or error response.
   */
  uploadCVs(files: File[]): Observable<any> {
    console.log("Inside ADMIN SERVICE...uploadCVs() called...");
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file, file.name);
    });
    return this.http.post(`${this.apiUrl}candidates/upload-cvs/`, formData);
  }

  /**
   * Fetches a list of raw, unscored candidates for the "Resumes" tab.
   * @param filterDate Optional date string (YYYY-MM-DD) to filter by.
   * @returns An Observable array of Candidate objects.
   */
  getCandidates(filterDate?: string): Observable<Candidate[]> {
    console.log("Inside ADMIN SERVICE...getCandidates() called...");
    let params = new HttpParams();
    if (filterDate) {
      params = params.set('batch_date', filterDate);
    }
    return this.http.get<Candidate[]>(`${this.apiUrl}candidates/draft/`, { params });
  }

  /**
   * Deletes a single candidate from the draft list.
   * @param candidateId The ID of the candidate to delete.
   * @returns An Observable with the backend response.
   */
  deleteCandidate(candidateId: number): Observable<any> {
    console.log("Inside ADMIN SERVICE...deleteCandidate() called...");
    return this.http.delete(`${this.apiUrl}candidates/draft/${candidateId}/`);
  }

  /**
   * Sends registration invites to a list of candidates.
   * @param candidateIds An array of candidate IDs.
   * @returns An Observable with the backend response.
   */
  sendRegistrationInvites(candidateIds: number[]): Observable<any> {
    console.log("Inside ADMIN SERVICE...sendRegistrationInvites() called...");
    return this.http.post(`${this.apiUrl}candidates/send-invites/`, { candidate_ids: candidateIds });
  }

  // ==============================================================================
  // JOB DESCRIPTION (JD) WORKFLOW METHODS
  // ==============================================================================

  /**
   * Fetches the most recently processed Job Description from the backend.
   * On success, it updates the activeJd$ observable.
   * @returns An Observable containing the latest JobDescription.
   */
  getLatestJd(): Observable<JobDescription> {
    console.log("Inside ADMIN SERVICE...getLatestJd() called...");
    return this.http.get<JobDescription>(`${this.apiUrl}jd/latest/`).pipe(
      tap(jd => this.activeJdSubject.next(jd))
    );
  }

  /**
   * Uploads a single Job Description file to the backend for processing.
   * On success, it updates the activeJd$ observable with the new JD data.
   * @param file The JD file to upload.
   * @returns An Observable containing the newly processed JobDescription.
   */
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

  /**
   * Fetches the list of candidates scored against a specific Job Description.
   * Can be optionally filtered by the CV upload date.
   * @param jobId The ID of the job to match against.
   * @param sortBy The sorting preference (e.g., 'score_desc', 'name_asc').
   * @param batchDate Optional date string (e.g., '2025-09-16') or 'all' to filter by.
   * @returns An Observable array of SourcedCandidate objects.
   */
  getSourcedCandidates(jobId: number, sortBy: string, batchDate?: string | null): Observable<SourcedCandidate[]> {
    console.log(`Inside ADMIN SERVICE...getSourcedCandidates() called with jobId: ${jobId}, sortBy: ${sortBy}, batchDate: ${batchDate}`);
    
    let params = new HttpParams()
      .set('job_id', jobId.toString())
      .set('sort_by', sortBy);

    // Conditionally add the batch_date parameter to the request if it is provided and not 'all'
    if (batchDate && batchDate !== 'all') {
      params = params.set('batch_date', batchDate);
    }

    return this.http.get<SourcedCandidate[]>(`${this.apiUrl}candidates/sourced/`, { params });
  }

  /**
   * Fetches a secure, short-lived URL for a CV download from the backend.
   * @param candidateId The ID of the candidate whose CV is to be downloaded.
   * @returns An Observable containing an object with the secure URL.
   */
  getSecureCvUrl(candidateId: number): Observable<{ url: string }> {
    console.log("Inside ADMIN SERVICE...getSecureCvUrl() called...");
    return this.http.get<{ url: string }>(`${this.apiUrl}candidates/${candidateId}/generate-cv-url/`);
  }
  
  /**
   * Downloads an Excel report for specifically selected candidates.
   * @param jobId The ID of the job the report is for.
   * @param candidateIds An array of selected candidate IDs to include in the report.
   * @returns An Observable containing the file data as a Blob.
   */
  downloadSelectedReport(jobId: number, candidateIds: number[]): Observable<Blob> {
    console.log("Inside ADMIN SERVICE...downloadSelectedReport() called...");
    const payload = {
      job_id: jobId,
      candidate_ids: candidateIds
    };
    return this.http.post(`${this.apiUrl}report/download/`, payload, { responseType: 'blob' });
  }

  /**
   * Downloads a full Excel report for all candidates sourced for a given Job Description.
   * @param jobId The ID of the job for which to generate the report.
   * @returns An Observable containing the file data as a Blob.
   */
  downloadCandidateReport(jobId: number): Observable<Blob> {
    console.log("Inside ADMIN SERVICE...downloadCandidateReport() called...");
    const params = new HttpParams().set('job_id', jobId.toString());
    return this.http.get(`${this.apiUrl}report/download/`, { params, responseType: 'blob' });
  }
}