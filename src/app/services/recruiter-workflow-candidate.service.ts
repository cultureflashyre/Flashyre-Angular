import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Candidate {
  id?: number;
  first_name: string;
  last_name: string;
  phone_number: string;
  email: string;
  gender: string;
  work_experience: string;
  skills: string;
  total_experience: number;
  relevant_experience: number;
  current_ctc: string;
  expected_ctc_min: number;
  expected_ctc_max: number;
  notice_period: string;
  preferred_location: string;
  current_location: string;
  created_at?: string;
  selected?: boolean;
  resume?: string;
  user?: number;
  recruiter_name?: string;
  source?: string;
  latest_rating_score?: number | null;
  latest_rating_breakdown?: { [key: string]: number } | null;
  source_form?: number | string | null;
  source_form_title?: string;
}

// --- VERIFY THIS INTERFACE ---
export interface RegisteredUser {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  created_at: string;
  sourced_by_recruiter: string; // <-- Ensure this line exists
  sourced_role: string;          // <-- Ensure this line exists for the optional field
  selected?: boolean;
}

// Add this interface above RegisteredUser
export interface SourcedData {
  id?: number;
  work_experience?: number;
  skills?: string;
  current_location?: string;
  preferred_location?: any;
  current_ctc?: string;
  total_experience?: number;
  relevant_experience?: number;
  source?: string;
  resume?: string;
  latest_rating_score?: number | null;
  latest_rating_breakdown?: { [key: string]: number } | null;
}

// Update RegisteredUser
export interface RegisteredUser {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  created_at: string;
  sourced_by_recruiter: string;
  sourced_data?: SourcedData | null; // <--- NEW FIELD
  selected?: boolean;
}

export interface PollStatusResponse {
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  data?: any;
  error?: string;
}

export interface RatingCriteria {
  id?: number;
  category: string;
  criterion_key: string;
  criterion_label: string;
  label_preset: 'standard' | 'communication' | 'proficiency';
  display_order: number;
  is_active?: boolean;
}

export interface RatingScore {
  criterion_key: string;
  criterion_label: string;
  score: number;
  score_label: string;
}

export interface CandidateRating {
  id?: number;
  candidate: number;
  job_requirement?: number;
  rated_by?: number;
  rated_by_name: string;
  rating_category: string;
  overall_score: number;
  notes?: string;
  scores: RatingScore[];
  job_title: string;
  created_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class RecruiterWorkflowCandidateService {
  private apiUrl = environment.apiUrl;
  private parseUrl = environment.apiUrl + 'api/parse-resume/';
  private endpoint = 'api/candidates/';
  private atsUrl = environment.apiUrl + 'api/ats/bulk-add/';
  private registeredUsersUrl = environment.apiUrl + 'api/auth/registered-candidates/';
  private deleteUserUrl = environment.apiUrl + 'api/auth/delete-user/';

  constructor(private http: HttpClient) { }

  // NEW: Check Resume Status with Cache Buster and Correct URL
  checkResumeStatus(stagingId: number): Observable<PollStatusResponse> {
    // Add a timestamp to bypass aggressive browser caching on GET requests
    const timestamp = new Date().getTime();

    // Add the missing 'api/' prefix to match your Django urls.py mapping
    return this.http.get<PollStatusResponse>(`${this.apiUrl}api/resume-status/${stagingId}/?t=${timestamp}`);
  }

  getCandidates(page: number = 1, paginate: boolean = true, formId?: string | null): Observable<any> {
    let url = paginate 
      ? `${this.apiUrl}${this.endpoint}?page=${page}`
      : `${this.apiUrl}${this.endpoint}?paginate=false`;
    if (formId) {
      url += `&form_id=${formId}`;
    }
    return this.http.get<any>(url);
  }

  parseResume(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(this.parseUrl, formData);
  }

  createCandidate(formData: FormData): Observable<Candidate> {
    return this.http.post<Candidate>(`${this.apiUrl}${this.endpoint}`, formData);
  }

  updateCandidate(id: number, formData: FormData): Observable<Candidate> {
    return this.http.put<Candidate>(`${this.apiUrl}${this.endpoint}${id}/`, formData);
  }

  deleteCandidate(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}${this.endpoint}${id}/`);
  }

  addCandidatesToJob(jobId: number, candidateIds: number[]): Observable<any> {
    const userId = localStorage.getItem('user_id');
    return this.http.post(this.atsUrl, {
      job_id: jobId,
      candidate_ids: candidateIds,
      user_id: userId
    });
  }

  getRegisteredCandidates(): Observable<RegisteredUser[]> {
    return this.http.get<RegisteredUser[]>(this.registeredUsersUrl);
  }

  deleteRegisteredUser(userId: string): Observable<void> {
    return this.http.delete<void>(`${this.deleteUserUrl}${userId}/`);
  }

  getRatingCriteria(category?: string): Observable<RatingCriteria[]> {
    const url = category
      ? `${this.apiUrl}api/rating-criteria/?category=${category}`
      : `${this.apiUrl}api/rating-criteria/`;
    return this.http.get<RatingCriteria[]>(url);
  }

  submitRating(payload: {
    candidate_id: number;
    job_requirement_id?: number | null;
    rating_category: string;
    notes?: string;
    scores: { criterion_key: string; score: number }[];
  }): Observable<CandidateRating> {
    return this.http.post<CandidateRating>(`${this.apiUrl}api/candidate-ratings/`, payload);
  }

  getCandidateRatings(candidateId: number): Observable<CandidateRating[]> {
    return this.http.get<CandidateRating[]>(`${this.apiUrl}api/candidate-ratings/?candidate_id=${candidateId}`);
  }

  deleteRating(ratingId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}api/candidate-ratings/${ratingId}/`);
  }

  getStatistics(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}api/candidates/statistics/`);
  }

  getSignedUrl(filePath: string): Observable<{ signed_url: string, expires_in: number }> {
    return this.http.get<{ signed_url: string, expires_in: number }>(
      `${this.apiUrl}api/files/signed-url/?file_path=${encodeURIComponent(filePath)}`
    );
  }
}
