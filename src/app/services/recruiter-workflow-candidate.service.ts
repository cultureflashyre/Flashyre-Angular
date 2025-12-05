import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment'; // Import the environment file
import { AdbRequirementService } from './adb-requirement.service';

// Define an interface for type safety, matching the Django model
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
}

@Injectable({
  providedIn: 'root'
})
export class RecruiterWorkflowCandidateService {
  // Store the base API URL from the environment file
  private apiUrl = environment.apiUrl;
  private endpoint = 'api/candidates/'; // Define the specific endpoint path
  private atsUrl = environment.apiUrl + 'api/ats/bulk-add/';

  constructor(private http: HttpClient) { }

  /**
   * Fetches the list of all candidates from the backend.
   * @returns An Observable array of Candidates.
   */
  getCandidates(): Observable<Candidate[]> {
    // Construct the full URL inside the method
    return this.http.get<Candidate[]>(`${this.apiUrl}${this.endpoint}`);
  }

  /**
   * Creates a new candidate by sending a POST request to the backend.
   * @param candidate - The candidate data to be created.
   * @returns An Observable of the newly created Candidate.
   */
  createCandidate(candidate: Candidate): Observable<Candidate> {
    // Construct the full URL inside the method
    return this.http.post<Candidate>(`${this.apiUrl}${this.endpoint}`, candidate);
  }
  // --- NEW METHOD: UPDATE ---
  /**
   * Updates an existing candidate by sending a PUT request.
   * @param id - The ID of the candidate to update.
   * @param candidate - The updated candidate data.
   * @returns An Observable of the updated Candidate.
   */
  updateCandidate(id: number, candidate: Candidate): Observable<Candidate> {
    return this.http.put<Candidate>(`${this.apiUrl}${this.endpoint}${id}/`, candidate);
  }

  // --- NEW METHOD: DELETE ---
  /**
   * Deletes a candidate by their ID.
   * @param id - The ID of the candidate to delete.
   * @returns An Observable with an empty response.
   */
  deleteCandidate(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}${this.endpoint}${id}/`);
  }

  /**
   * Bulk add candidates to a specific Job Workflow
   */
  addCandidatesToJob(jobId: number, candidateIds: number[]): Observable<any> {
    return this.http.post(this.atsUrl, {
      job_id: jobId,
      candidate_ids: candidateIds
    });
  }
}