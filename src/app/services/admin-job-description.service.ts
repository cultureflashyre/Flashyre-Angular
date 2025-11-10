// src/app/services/admin-job-description.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { JobDetails, AIJobResponse } from '../pages/create-job/types';
import { environment } from '../../environments/environment';


// --- MODIFICATION START ---
// Define a more specific type for the upload response
interface ExcelUploadResponse {
  file_url: string;
  unique_id: string;
  uploaded_mcqs: any; // Contains the newly created questions object
}

// NEW INTERFACE: Defines the structure of the detailed MCQ status response.
export interface McqStatusResponse {
  status: 'completed' | 'in_progress' | 'not_started';
  source: 'ai_generated' | 'excel_upload' | 'none';
  filename: string | null;
  skills?: { [key: string]: string }; // Optional skills dictionary for AI source
}
// --- MODIFICATION END ---

@Injectable({ providedIn: 'root' })
export class AdminJobDescriptionService {
  
  private readonly apiUrl: string = environment.apiUrl;
  private readonly baseUrl = `${environment.apiUrl}api/admin/job-post`;
  private readonly interviewFinalizeUrl = `${environment.apiUrl}api/interview/job-post`;
  private readonly mcqAssessmentBaseUrl = `${environment.apiUrl}api/mcq-assessments`;

  constructor(private http: HttpClient) {}

  /* ================================================================= |
  |  Public API – identical to your last working version               |
  | ================================================================= */

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
      // ❌ DO NOT ADD Content-Type here – browser sets multipart boundary
    });

    return this.http.post<{ status: string; data: AIJobResponse }>(
      `${this.baseUrl}/file-upload/`,
      formData,
      { headers }
    ).pipe(
      map(res => {
        if (res.status === 'success' && res.data) return res.data;
        throw new Error('Backend response format is incorrect or data is missing.');
      }),
      catchError(this.handleError)
    );
  }

  saveJobPost(jobDetails: JobDetails, token: string): Observable<{ unique_id: string }> {
    return this.http
      .post<{ status: string; data: { unique_id: string } }>(
        `${this.baseUrl}/job-post/`,
        jobDetails,
        { headers: this.jsonHeaders(token) }
      )
      .pipe(
        map(res => {
          if (res.status === 'success' && res.data?.unique_id) return { unique_id: res.data.unique_id };
          throw new Error('Malformed response');
        }),
        catchError(this.handleError)
      );
  }

  uploadExcelFile(file: File, jobUniqueId:string, token: string): Observable<ExcelUploadResponse> {
    if (!file) {
      console.error('No file provided for upload');
      return throwError(() => new Error('No file selected for upload'));
    }

    if (file.size > 10 * 1024 * 1024) {
      return throwError(() => new Error('File size exceeds 10MB'));
    }

    const allowedExtensions = ['.xlsx', '.xls'];
    const ext = file.name.toLowerCase().split('.').pop();
    if (!ext || !allowedExtensions.includes(`.${ext}`)) {
      return throwError(() => new Error(`Invalid file format. Supported: ${allowedExtensions.join(', ')}`));
    }

    const formData = new FormData();
    formData.append('excel_file', file, file.name); // Use backend expected key
    formData.append('jobUniqueId', jobUniqueId);

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
      // omit content-type for FormData
    });

    const endpoint = `${this.apiUrl}upload-mcq-excel/`; // adjust to your backend URL

    // --- MODIFICATION START ---
    // Adjusted the http.post call to expect the new response structure
    return this.http.post<{ status: string; data: ExcelUploadResponse }>(
      endpoint,
      formData,
      { headers }
    ).pipe(
    // --- MODIFICATION END ---      tap(response => console.log('Raw uploadExcelFile response:', response)),
      map(response => {
        if (response.status === 'success' && response.data) {
          return response.data;
        }
        throw new Error(response.data?.toString() || 'Unexpected response during Excel upload');
      }),
      catchError(error => this.handleError_2(error, 'uploadExcelFile'))
    );

  }

  // --- NEW METHOD 2: Get Uploaded Questions ---
  getUploadedQuestions(jobUniqueId: string, token: string): Observable<any> {
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    const endpoint = `${this.apiUrl}job-post/${jobUniqueId}/uploaded-questions/`;

    return this.http.get<{ status: string; data: any }>(endpoint, { headers }).pipe(
      tap(response => console.log('getUploadedQuestions response:', response)),
      map(response => {
        if (response.status === 'success' && response.data) {
          return response;
        }
        throw new Error('Unexpected response structure in getUploadedQuestions');
      }),
      catchError(error => this.handleError_2(error, 'getUploadedQuestions'))
    );
  }

  updateJobPost(uniqueId: string, jobDetails: JobDetails, token: string): Observable<{ unique_id: string }> {
    return this.http.put<{ status: string; data: { unique_id: string } }>(
      `${this.baseUrl}/job-post/${uniqueId}/`,
      jobDetails,
      { headers: this.jsonHeaders(token) }
    ).pipe(
      map(res => {
        if (res.status === 'success' && res.data?.unique_id) return { unique_id: res.data.unique_id };
        throw new Error('Malformed response on update');
      }),
      catchError(this.handleError)
    );
  }

  getJobPost(uniqueId: string, token: string): Observable<JobDetails> {
    return this.http
      .get<{ status: string; data: JobDetails }>(`${this.baseUrl}/job-post/${uniqueId}/`, { headers: this.bearer(token) })
      .pipe(
        map(response => {
            if (response.status === 'success' && response.data) {
                return response.data;
            }
            throw new Error('Failed to retrieve valid job post data.');
        }),
        catchError(this.handleError)
      );
  }

  deleteJobPost(uniqueId: string, token: string): Observable<void> {
    return this.http.delete<void>(
        `${this.baseUrl}/job-post/${uniqueId}/`,
        { headers: this.bearer(token) }
    ).pipe(catchError(this.handleError));
  }

  generateMcqsForJob(jobUniqueId: string, token: string): Observable<{ message: string }> {
    return this.http
      .post<{ message: string }>(`${this.baseUrl}/job-post/${jobUniqueId}/generate-mcqs/`, {}, { headers: this.bearer(token) })
      .pipe(catchError(this.handleError));
  }

  /**
   * NEW: Triggers generation for a single skill and expects the new questions back.
   */
  generateMcqForSkill(jobUniqueId: string, skillName: string, token: string): Observable<any> {
    return this.http
      .post<any>(`${this.baseUrl}/job-post/${jobUniqueId}/generate-single-skill-mcqs/`, { skill: skillName }, { headers: this.jsonHeaders(token) })
      .pipe(catchError(this.handleError));
  }

  generateMoreMcqsForSkill(jobUniqueId: string, skillName: string, token: string): Observable<any[]> {
    return this.http
      .post<{ status: string, data: any[] }>(`${this.baseUrl}/job-post/${jobUniqueId}/generate-more-mcqs/`, { skill: skillName }, { headers: this.jsonHeaders(token) })
      .pipe(
        // THIS IS THE FIX: We extract the 'data' array from the response object.
        map(response => response.data || []),
        catchError(this.handleError)
      );
  }

  /**
   * MODIFIED: Can now fetch all MCQs or MCQs for a single skill.
   * @param skillName - Optional skill name to fetch questions for.
   */
  job_post_mcqs_list_api(jobUniqueId: string, token: string, skillName?: string): Observable<any> {
    let url = `${this.baseUrl}/job-post/${jobUniqueId}/mcqs/`;
    if (skillName) {
      url += `?skill=${encodeURIComponent(skillName)}`;
    }
    return this.http
      .get<any>(url, { headers: this.bearer(token) })
      .pipe(catchError(this.handleError));
  }

  getAllCodingAssessmentQuestions(token: string): Observable<any> {
    return this.http
      .get<any>(`${this.baseUrl}/get_coding_problems/`, { headers: this.bearer(token) })
      .pipe(catchError(this.handleError));
  }

   // --- MODIFICATION START: Updated method signature ---
  /**
   * Fetches the detailed MCQ generation status, including source and filename.
   */
  checkMcqStatus(jobUniqueId: string, token: string): Observable<McqStatusResponse> {
    return this.http
      .get<{ status: string; data: McqStatusResponse }>(`${this.baseUrl}/job-post/${jobUniqueId}/mcq-status/`, { headers: this.bearer(token) })
      .pipe(
        map(response => response.data), // Extract the inner 'data' object which matches our interface
        catchError(this.handleError)
      );
  }

  saveAssessment(payload: any, token: string): Observable<{ assessment_uuid: string }> {
    return this.http
      .post<{ assessment_uuid: string }>(`${this.mcqAssessmentBaseUrl}/create/`, payload, { headers: this.jsonHeaders(token) })
      .pipe(catchError(this.handleError));
  }

  updateAssessment(assessmentId: string, payload: any, token: string): Observable<any> {
    return this.http
      .put<any>(`${this.mcqAssessmentBaseUrl}/${assessmentId}/`, payload, { headers: this.jsonHeaders(token) })
      .pipe(catchError(this.handleError));
  }

  getAssessmentDetails(assessmentId: string, token: string): Observable<any> {
    return this.http
      .get<any>(`${this.mcqAssessmentBaseUrl}/${assessmentId}/`, { headers: this.bearer(token) })
      .pipe(catchError(this.handleError));
  }

  /**
 * Fetches the latest assessment for a specific job post
 * @param jobUniqueId The unique_id of the JobPost
 * @param token JWT token for authentication
 * @returns Observable of the latest assessment or null
 */
getLatestAssessmentForJob(jobUniqueId: string, token: string): Observable<any> {
  return this.http
    .get<any>(`${this.baseUrl}/job-post/${jobUniqueId}/latest-assessment/`, { headers: this.bearer(token) })
    .pipe(
      map(response => {
        if (response.status === 'success') {
          return response.data; // Could be null or an assessment object
        }
        throw new Error('Failed to fetch latest assessment');
      }),
      catchError(this.handleError)
    );
}

  finalizeJobPost(jobUniqueId: string, interviewStages: any[], token: string): Observable<any> {
    return this.http
      .post<any>(`${this.interviewFinalizeUrl}/${jobUniqueId}/finalize/`, interviewStages, { headers: this.jsonHeaders(token) })
      .pipe(catchError(this.handleError));
  }

  getSourcedCandidatesWithScores(jobUniqueId: string, token: string, sortBy = 'score_desc'): Observable<any> {
    return this.http
      .get<any>(`${this.baseUrl}/job-post/${jobUniqueId}/sourced-candidates-with-scores/?sort_by=${sortBy}`, { headers: this.bearer(token) })
      .pipe(catchError(this.handleError));
  }

  exportSelectedCandidatesCSV(jobId: string, candidateIds: string[], token: string): Observable<Blob> {
    return this.http.post(
      `${this.baseUrl}/job-post/${jobId}/export-candidates-csv/`,
      { candidate_ids: candidateIds },
      { headers: this.jsonHeaders(token), responseType: 'blob' }
    );
  }

  /* ================================================================= |
  |  Private helpers                                                   |
  | ================================================================= */

  private bearer(token: string): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  private jsonHeaders(token: string): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' });
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let msg = 'An unknown error occurred';
    if (error.error instanceof ErrorEvent) {
      msg = `Client Error: ${error.error.message}`;
    } else {
      msg = error.error?.message || `Server Error: ${error.status} – ${error.statusText}`;
    }
    console.error('HTTP Error:', msg);
    return throwError(() => new Error(msg));
  }

    private handleError_2(error: HttpErrorResponse, operation: string = 'operation'): Observable<never> {
    let errorMessage = `An unknown error occurred during ${operation}`;

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Client-side error in ${operation}: ${error.error.message}`;
    } else {
      const serverError = error.error;
      if (serverError) {
        if (serverError.status === 'error') {
            if (serverError.message) {
                errorMessage = serverError.message;
            }
            if (serverError.errors && typeof serverError.errors === 'object') {
                const fieldErrors = Object.keys(serverError.errors)
                .map(key => `${key}: ${Array.isArray(serverError.errors[key]) ? serverError.errors[key].join(', ') : serverError.errors[key]}`)
                .join('; ');
                if (fieldErrors) {
                    errorMessage = fieldErrors;
                } else if (!serverError.message) {
                    errorMessage = `Validation errors occurred in ${operation}.`;
                }
            } else if (serverError.errors && typeof serverError.errors === 'string') {
                errorMessage = serverError.errors;
            } else if (!serverError.message && !serverError.errors) {
                errorMessage = `An error occurred on the server during ${operation}.`;
            }
        } else if (serverError.detail) {
            errorMessage = serverError.detail;
        } else if (typeof serverError === 'string') {
            errorMessage = serverError;
        } else {
            errorMessage = `Server error ${error.status} in ${operation}: ${error.message || 'No specific message'}`;
        }
      } else {
        errorMessage = `HTTP ${error.status} in ${operation}: ${error.statusText || error.message || 'Server error'}`;
      }
    }

    console.error(`Operation: ${operation} failed. Status: ${error.status}. Message: ${errorMessage}. Full Error:`, error);
    return throwError(() => new Error(errorMessage));
  }
}