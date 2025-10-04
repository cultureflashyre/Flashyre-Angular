// src/app/services/admin-job-description.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { JobDetails, AIJobResponse } from '../pages/admin-create-job-step1/types';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AdminJobDescriptionService {
  private readonly baseUrl = `${environment.apiUrl}api/admin/job-post`;
  private readonly interviewFinalizeUrl = `${environment.apiUrl}api/job-post`;
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

  generateMoreMcqsForSkill(jobUniqueId: string, skillName: string, token: string): Observable<any[]> {
    return this.http
      .post<any[]>(`${this.baseUrl}/job-post/${jobUniqueId}/generate-more-mcqs/`, { skill: skillName }, { headers: this.jsonHeaders(token) })
      .pipe(catchError(this.handleError));
  }

  job_post_mcqs_list_api(jobUniqueId: string, token: string): Observable<any> {
    return this.http
      .get<any>(`${this.baseUrl}/job-post/${jobUniqueId}/mcqs/`, { headers: this.bearer(token) })
      .pipe(catchError(this.handleError));
  }

  checkMcqStatus(jobUniqueId: string, token: string): Observable<{ has_mcqs: boolean }> {
    return this.http
      .get<{ has_mcqs: boolean }>(`${this.baseUrl}/job-post/${jobUniqueId}/mcq-status/`, { headers: this.bearer(token) })
      .pipe(catchError(this.handleError));
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
}