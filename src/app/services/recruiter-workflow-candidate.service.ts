import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ActiveApplicationSummary {
  id: number;
  job_id: number;
  job_role: string;
  client_name: string;
  stage: 'Sourced' | 'Screening' | 'Submission' | 'Interview' | 'Offer' | 'Hired' | 'Rejected' | string;
  recruiter_name: string;
  recruiter_id: string | null;
  updated_at: string | null;
}

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
  resume_url?: string;
  resume_filename?: string;
  user?: number;
  recruiter_name?: string;
  sourced_by?: string | number | null;
  sourced_by_id?: string | null;
  sourced_by_name?: string;
  placement_status?: 'Offered' | 'Hired' | null;
  placement_at?: string | null;
  placement_job_title?: string | null;
  placement_client_name?: string | null;
  placed_by?: string | number | null;
  placed_by_id?: string | null;
  placed_by_name?: string | null;
  active_applications?: ActiveApplicationSummary[];
  lead_pipeline?: ActiveApplicationSummary | null;
  source?: string;
  latest_rating_score?: number | null;
  latest_rating_breakdown?: { [key: string]: number } | null;
  source_form?: number | string | null;
  source_form_title?: string;
  // Completeness (set by the server): which of the seven mandatory fields are still missing,
  // and whether AI-parsed values still need a recruiter to verify them.
  missing_fields?: string[];
  legacy_incomplete?: boolean;
  verification_status?: 'verified' | 'ai_unverified';
  ai_filled_fields?: string[];
  latest_education_level?: string | null;
  latest_university?: string | null;
  latest_specialization?: string | null;
  year_of_graduation?: number | null;
  current_job_title?: string | null;
  latest_company?: string | null;
  import_metadata?: {
    client?: string;
    sub_client?: string;
    spoc?: string;
    recruiter?: string;
    status?: string;
    sheet_name?: string;
    row_number?: number;
    l1_date?: string;
    l1_feedback?: string;
    l2_date?: string;
    l2_feedback?: string;
    comments?: string;
    batch_id?: string;
    [key: string]: any;
  } | null;
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
  resume_url?: string;
  resume_filename?: string;
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

/** A person who is still missing one or more of the seven mandatory fields (the "Needs info" inbox). */
export interface IntakePerson {
  id: number;
  uuid: string;
  kind: 'intake';
  status: 'open' | 'promoted';
  promoted_candidate: number | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone_number: string | null;
  gender?: string | null;
  skills: string | null;
  work_experience?: string | null;
  total_experience?: number;
  relevant_experience?: number;
  current_ctc?: string | null;
  notice_period?: string | null;
  preferred_location?: any;
  current_location?: string | null;
  current_job_title?: string | null;
  latest_company?: string | null;
  latest_education_level?: string | null;
  latest_university?: string | null;
  latest_specialization?: string | null;
  year_of_graduation?: number | null;
  missing_fields: string[];
  verification_status: 'verified' | 'ai_unverified';
  ai_filled_fields: string[];
  verified_at?: string | null;
  source: string;
  source_form?: number | null;
  sourced_by: string | null;
  sourced_by_name: string | null;
  resume_filename?: string | null;
  resume_path?: string | null;
  skills_list: string[];
  preferred_locations: { name: string; lat: number | null; lng: number | null }[];
  education: { level: string | null; institution: string | null; specialization: string | null; year: number | null; is_highest: boolean }[];
  submissions: { form: string; form_id: string; status: string; submitted_at: string }[];
  created_at: string;
  updated_at: string;
  // front-end only
  selected?: boolean;
  latest_rating_score?: number | null;
}

export interface IntakeSummary {
  open: number;
  unverified: number;
  missing_by_field: { [field: string]: number };
  legacy_incomplete_candidates: number;
  unverified_candidates: number;
}

export interface IntakeUpdateResult {
  kind: 'candidate' | 'intake';
  id: number;
  uuid?: string;
  missing_fields: string[];
  promoted?: boolean;
  changed?: string[];
  outcome?: string;
  existing?: boolean;
  detail?: string;
}

export interface CandidateNote {
  id: number;
  kind: 'candidate' | 'intake';
  candidate: number | null;
  intake: number | null;
  author: string | null;
  author_name: string | null;
  body: string;
  created_at: string;
}

export interface CandidateRating {
  id?: number;
  candidate: number | null;
  intake?: number | null;
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
    candidate_id?: number;
    intake_id?: number;
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

  // ---- "Needs info" inbox (people missing mandatory fields) ----
  getIntakeList(opts: { page?: number; status?: string; missing?: string; q?: string; formId?: string | null; unverified?: boolean } = {}): Observable<any> {
    const params: string[] = [`page=${opts.page || 1}`];
    if (opts.status) { params.push(`status=${encodeURIComponent(opts.status)}`); }
    if (opts.missing) { params.push(`missing=${encodeURIComponent(opts.missing)}`); }
    if (opts.q) { params.push(`q=${encodeURIComponent(opts.q)}`); }
    if (opts.formId) { params.push(`form_id=${encodeURIComponent(opts.formId)}`); }
    if (opts.unverified) { params.push('unverified=1'); }
    return this.http.get<any>(`${this.apiUrl}api/candidate-intake/?${params.join('&')}`);
  }

  getIntakeSummary(): Observable<IntakeSummary> {
    return this.http.get<IntakeSummary>(`${this.apiUrl}api/candidate-intake/summary/`);
  }

  getIntake(id: number): Observable<IntakePerson> {
    return this.http.get<IntakePerson>(`${this.apiUrl}api/candidate-intake/${id}/`);
  }

  createIntakeDraft(data: any): Observable<IntakeUpdateResult> {
    return this.http.post<IntakeUpdateResult>(`${this.apiUrl}api/candidate-intake/`, data);
  }

  updateIntake(id: number, data: any): Observable<IntakeUpdateResult> {
    return this.http.patch<IntakeUpdateResult>(`${this.apiUrl}api/candidate-intake/${id}/`, data);
  }

  deleteIntake(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}api/candidate-intake/${id}/`);
  }

  verifyIntake(id: number): Observable<IntakePerson> {
    return this.http.post<IntakePerson>(`${this.apiUrl}api/candidate-intake/${id}/verify/`, {});
  }

  verifyCandidate(id: number): Observable<Candidate> {
    return this.http.post<Candidate>(`${this.apiUrl}api/candidates/${id}/verify/`, {});
  }

  addIntakeToJob(jobId: number, intakeIds: number[]): Observable<any> {
    return this.http.post(this.atsUrl, { job_id: jobId, intake_ids: intakeIds });
  }

  getIntakeRatings(intakeId: number): Observable<CandidateRating[]> {
    return this.http.get<CandidateRating[]>(`${this.apiUrl}api/candidate-ratings/?intake_id=${intakeId}`);
  }

  // ---- Notes (candidates and inbox people) ----
  getNotes(kind: 'candidate' | 'intake', id: number): Observable<CandidateNote[]> {
    return this.http.get<CandidateNote[]>(`${this.apiUrl}api/candidate-notes/?${kind}_id=${id}`);
  }

  addNote(kind: 'candidate' | 'intake', id: number, body: string): Observable<CandidateNote> {
    return this.http.post<CandidateNote>(`${this.apiUrl}api/candidate-notes/`, { [`${kind}_id`]: id, body });
  }

  deleteNote(noteId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}api/candidate-notes/${noteId}/`);
  }

  getStatistics(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}api/candidates/statistics/`);
  }

  getSignedUrl(filePath: string): Observable<{ signed_url: string, expires_in: number }> {
    return this.http.get<{ signed_url: string, expires_in: number }>(
      `${this.apiUrl}api/files/signed-url/?file_path=${encodeURIComponent(filePath)}`
    );
  }

  getPlatformSettings(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}api/super-admin/platform-settings/`);
  }
}
