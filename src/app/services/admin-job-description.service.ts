// src/app/services/admin-job-description.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { JobDetails, AIJobResponse } from '../pages/admin-create-job-step1/types';
import { environment } from '../../environments/environment'; // ✅ Import environment

@Injectable({
  providedIn: 'root'
})
export class AdminJobDescriptionService {
  // ✅ Use environment.apiUrl as the base for all admin job post endpoints
  private readonly baseUrl = `${environment.apiUrl}api/admin/job-post`;
  private readonly interviewFinalizeUrl = `${environment.apiUrl}api/job-post`;
  // ✅ Adjusted base URL for mcq-assessment endpoints to match existing backend routes
  private readonly mcqAssessmentBaseUrl = `${environment.apiUrl}api/mcq-assessments`;

  constructor(private http: HttpClient) {}

  /**
   * Uploads a job description file and processes it with AI.
   * @param file The JD file to upload
   * @param token JWT token for authentication
   * @returns Observable of AIJobResponse
   */
  uploadFile(file: File, token: string): Observable<AIJobResponse> {
    const formData = new FormData();
    formData.append('file', file);
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.post<AIJobResponse>(`${this.baseUrl}/file-upload/`, formData, { headers })
      .pipe(
        map(response => response),
        catchError(this.handleError)
      );
  }

  /**
   * Saves a manually created job post.
   * @param jobDetails Job post data
   * @param token JWT token
   * @returns Observable with unique_id inside a nested data object
   */
  saveJobPost(jobDetails: JobDetails, token: string): Observable<{ unique_id: string }> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    // ✅ Expect backend to return { "status": "success", "data": { "unique_id": "..." } }
    return this.http.post<{ status: string; data: { unique_id: string } }>(`${this.baseUrl}/job-post/`, jobDetails, { headers })
      .pipe(
        // ✅ Extract unique_id from the nested data structure
        map(response => {
          if (response.status === 'success' && response.data && response.data.unique_id) {
            return { unique_id: response.data.unique_id };
          } else {
            // This should ideally not happen if the backend is correct
            throw new Error('Backend response format is incorrect or unique_id is missing.');
          }
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Retrieves an existing job post by unique_id.
   * @param uniqueId Job unique ID
   * @param token JWT token
   * @returns Observable of JobDetails
   */
  getJobPost(uniqueId: string, token: string): Observable<JobDetails> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.get<JobDetails>(`${this.baseUrl}/job-post/${uniqueId}/`, { headers })
      .pipe(
        map(response => response),
        catchError(this.handleError)
      );
  }

  /**
   * Generates MCQs for all skills in a job post using AI.
   * @param jobUniqueId Job unique ID
   * @param token JWT token
   * @returns Observable with success message
   */
  generateMcqsForJob(jobUniqueId: string, token: string): Observable<{ message: string }> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.post<{ message: string }>(`${this.baseUrl}/job-post/${jobUniqueId}/generate-mcqs/`, {}, { headers })
      .pipe(
        map(response => response),
        catchError(this.handleError)
      );
  }

  /**
   * Generates additional MCQs for a specific skill.
   * @param jobUniqueId Job unique ID
   * @param skillName Skill name
   * @param token JWT token
   * @returns Observable of new MCQ items
   */
  generateMoreMcqsForSkill(jobUniqueId: string, skillName: string, token: string): Observable<any[]> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    const body = { skill: skillName };
    return this.http.post<any[]>(`${this.baseUrl}/job-post/${jobUniqueId}/generate-more-mcqs/`, body, { headers })
      .pipe(
        map(response => response),
        catchError(this.handleError)
      );
  }

  /**
   * Fetches all MCQs for a job post.
   * @param jobUniqueId Job unique ID
   * @param token JWT token
   * @returns Observable of MCQs by skill
   */
  job_post_mcqs_list_api(jobUniqueId: string, token: string): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.get<any>(`${this.baseUrl}/job-post/${jobUniqueId}/mcqs/`, { headers })
      .pipe(
        map(response => response),
        catchError(this.handleError)
      );
  }

  /**
   * Checks if MCQs exist for a job post.
   * @param jobUniqueId Job unique ID
   * @param token JWT token
   * @returns Observable with has_mcqs boolean
   */
  checkMcqStatus(jobUniqueId: string, token: string): Observable<{ has_mcqs: boolean }> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.get<{ has_mcqs: boolean }>(`${this.baseUrl}/job-post/${jobUniqueId}/mcq-status/`, { headers })
      .pipe(
        map(response => response),
        catchError(this.handleError)
      );
  }

  // --- Assessment API Calls (Reuses mcq_assessment app) ---
  // ✅ URLs adjusted to match existing mcq_assessment/urls.py patterns

  /**
   * Saves a new assessment.
   * @param payload Assessment payload
   * @param token JWT token
   * @returns Observable with assessment UUID
   */
  saveAssessment(payload: any, token: string): Observable<{ assessment_uuid: string }> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    // ✅ Changed URL to match backend: /api/mcq-assessments/create/
    return this.http.post<{ assessment_uuid: string }>(`${this.mcqAssessmentBaseUrl}/create/`, payload, { headers })
      .pipe(
        map(response => response),
        catchError(this.handleError)
      );
  }

  /**
   * Updates an existing assessment.
   * @param assessmentId Assessment UUID
   * @param payload Updated payload
   * @param token JWT token
   * @returns Observable with success response
   */
  updateAssessment(assessmentId: string, payload: any, token: string): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    // ✅ Changed URL to match backend: /api/mcq-assessments/{assessmentId}/
    return this.http.put<any>(`${this.mcqAssessmentBaseUrl}/${assessmentId}/`, payload, { headers })
      .pipe(
        map(response => response),
        catchError(this.handleError)
      );
  }

  /**
   * Fetches assessment details by UUID.
   * @param assessmentId Assessment UUID
   * @param token JWT token
   * @returns Observable of assessment details
   */
  getAssessmentDetails(assessmentId: string, token: string): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    // ✅ Changed URL to match backend: /api/mcq-assessments/{assessmentId}/
    return this.http.get<any>(`${this.mcqAssessmentBaseUrl}/${assessmentId}/`, { headers })
      .pipe(
        map(response => response),
        catchError(this.handleError)
      );
  }

  // --- Interview Finalization (Reuses interview app) ---

  /**
   * Finalizes the job post by creating interview stages and legacy records.
   * @param jobUniqueId Job unique ID
   * @param interviewStages Array of interview stages
   * @param token JWT token
   * @returns Observable with success response
   */
  finalizeJobPost(jobUniqueId: string, interviewStages: any[], token: string): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    return this.http.post<any>(`${this.interviewFinalizeUrl}/${jobUniqueId}/finalize/`, interviewStages, { headers })
      .pipe(
        map(response => response),
        catchError(this.handleError)
      );
  }

  /**
   * Fetches sourced candidates for a job and their AI-calculated matching scores.
   * @param jobUniqueId The unique ID of the job post.
   * @param token JWT token for authentication.
   * @returns Observable of the scored candidate list.
   */
  getSourcedCandidatesWithScores(jobUniqueId: string, token: string, sortBy: string = 'score_desc'): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    // ✅ Call the NEW endpoint in admin_job_post
    return this.http.get<any>(`${this.baseUrl}/job-post/${jobUniqueId}/sourced-candidates-with-scores/?sort_by=${sortBy}`, { headers })
      .pipe(
        map(response => response),
        catchError(this.handleError)
      );
  }

  // --- Error Handling ---

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred';
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Client Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = error.error?.message || `Server Error: ${error.status} - ${error.statusText}`;
    }
    return throwError(() => new Error(errorMessage));
  }
  
}