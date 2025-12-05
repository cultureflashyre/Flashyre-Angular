import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// Merged Interface: Includes fields from both, prioritizing Child's extended fields (resume, source, etc.)
export interface Candidate {
  id?: number;
  first_name: string;
  last_name: string;
  phone_number: string;
  email: string;
  gender: string;
  work_experience: string;
  skills: string;
  total_experience_min: number;
  total_experience_max: number;
  relevant_experience_min: number;
  relevant_experience_max: number;
  current_ctc: string;
  expected_ctc_min: number;
  expected_ctc_max: number;
  notice_period: string;
  preferred_location: string;
  current_location: string;
  created_at?: string;
  selected?: boolean;
  resume?: string;         // From Child
  recruiter_name?: string; // From Child
  source?: 'Naukri' | 'External'; // From Child
}

@Injectable({
  providedIn: 'root'
})
export class RecruiterWorkflowCandidateService {
  private apiUrl = environment.apiUrl;
  private endpoint = 'api/candidates/';
  // Added from Parent: Endpoint for ATS Workflow
  private atsUrl = environment.apiUrl + 'api/ats/bulk-add/';

  constructor(private http: HttpClient) { }

  /**
   * Fetches the list of all candidates from the backend.
   */
  getCandidates(): Observable<Candidate[]> {
    return this.http.get<Candidate[]>(`${this.apiUrl}${this.endpoint}`);
  }

  /**
   * Creates a new candidate.
   * Merged: Uses FormData (Child) to support file uploads.
   */
  createCandidate(formData: FormData): Observable<Candidate> {
    return this.http.post<Candidate>(`${this.apiUrl}${this.endpoint}`, formData);
  }

  /**
   * Updates an existing candidate.
   * Merged: Uses FormData (Child).
   */
  updateCandidate(id: number, formData: FormData): Observable<Candidate> {
    return this.http.put<Candidate>(`${this.apiUrl}${this.endpoint}${id}/`, formData);
  }

  /**
   * Deletes a candidate by their ID.
   */
  deleteCandidate(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}${this.endpoint}${id}/`);
  }

  /**
   * Bulk add candidates to a specific Job Workflow.
   * Added from Parent.
   */
  addCandidatesToJob(jobId: number, candidateIds: number[]): Observable<any> {
    return this.http.post(this.atsUrl, {
      job_id: jobId,
      candidate_ids: candidateIds
    });
  }
}