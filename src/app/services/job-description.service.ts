// src/app/services/job-description.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment'; // Ensure this path is correct
import { JobDetails, AIJobResponse, PaginatedJobPostResponse, MCQItem } from '../pages/create-job-post-1st-page/types'; // Ensure this path is correct

@Injectable({
  providedIn: 'root'
})
export class JobDescriptionService {
  // Base API URL from environment configuration (e.g., 'http://localhost:8000')
  private readonly apiUrl: string = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Uploads a file, processes it with AI for job details (NO MCQs).
   * @param file The file to upload
   * @param token JWT token for authentication
   * @returns Observable with file URL, unique ID, and job details.
   */
  uploadFile(file: File, token: string): Observable<Omit<AIJobResponse, 'mcqs'> & { file_url: string; unique_id: string }> {
    if (!file) {
      console.error('No file provided for upload');
      return throwError(() => new Error('No file selected for upload'));
    }

    if (file.size > 10 * 1024 * 1024) {
      return throwError(() => new Error('File size exceeds 10MB'));
    }

    const allowedExtensions = ['.pdf', '.docx', '.txt', '.xml', '.csv', '.doc'];
    const ext = file.name.toLowerCase().split('.').pop();
    if (!ext || !allowedExtensions.includes(`.${ext}`)) {
      return throwError(() => new Error(`Invalid file format. Supported: ${allowedExtensions.join(', ')}`));
    }

    const formData = new FormData();
    formData.append('file', file, file.name);

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
      // 'Content-Type' is not set for FormData, browser handles it with boundary
    });

    // Corrected URL construction:
    const endpoint = `${this.apiUrl}/file-upload/`;

    return this.http
      .post<{ status: string; data: Omit<AIJobResponse, 'mcqs'> & { file_url: string; unique_id: string } }>(
        endpoint,
        formData,
        { headers }
      )
      .pipe(
        map(response => {
          if (response.status === 'success' && response.data) {
            return response.data;
          }
          throw new Error(response.data?.toString() || 'Unexpected response structure during file upload');
        }),
        catchError(error => this.handleError(error, 'uploadFile'))
      );
  }

  /**
   * Saves or updates a job post by sending a POST request to the backend.
   * @param jobDetails The job post details to save or update.
   * @param token JWT token for authentication.
   * @returns Observable with the response containing unique_id and message.
   */
  saveJobPost(jobDetails: JobDetails, token: string): Observable<{ unique_id: string, message: string }> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    const endpoint = `${this.apiUrl}/job-post/`;

    return this.http.post<{ status: string, data: { message: string, unique_id: string }, errors?: any }>(
      endpoint,
      jobDetails,
      { headers }
    ).pipe(
      map(response => {
        if (response.status === 'success' && response.data) {
          return {
            unique_id: response.data.unique_id,
            message: response.data.message
          };
        }
        if (response.status === 'error' && response.errors) {
            throw new HttpErrorResponse({ error: response, status: 400 }); // Simulate an error
        }
        throw new Error('Unexpected response status or missing data during save job post');
      }),
      catchError(error => this.handleError(error, 'saveJobPost'))
    );
  }

  /**
   * Triggers the backend to generate MCQs for a specific job post.
   * This is for the initial generation step.
   * @param uniqueId The unique ID of the job post.
   * @param token JWT token for authentication.
   */
  generateMcqsForJob(uniqueId: string, token: string): Observable<{ status: string; message: string; }> {
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    const endpoint = `${this.apiUrl}/job-post/${uniqueId}/generate-mcqs/`;

    return this.http.post<{ status: string; message: string; }>(endpoint, {}, { headers }).pipe(
      map(response => {
        if (response.status === 'success') {
          return response;
        }
        throw new Error(response.message || 'Failed to generate MCQs due to an unknown server issue.');
      }),
      catchError(error => this.handleError(error, 'generateMcqsForJob'))
    );
  }

  /**
   * Retrieves all existing MCQs for a given job post.
   * @param uniqueId The unique ID of the job post.
   * @param token JWT token for authentication.
   */
  job_post_mcqs_list_api(uniqueId: string, token: string): Observable<{ status: string; data: { [skill: string]: { mcq_items: MCQItem[] } } }> {
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    const endpoint = `${this.apiUrl}/job-post/${uniqueId}/mcqs/`;
    return this.http.get<{ status: string; data: { [skill: string]: { mcq_items: MCQItem[] } } }>(endpoint, { headers }).pipe(
      catchError(error => this.handleError(error, 'job_post_mcqs_list_api'))
    );
  }

  /**
   * NEW METHOD: Generates more MCQs for a specific skill.
   * @param jobUniqueId The unique identifier of the job post.
   * @param skill The name of the skill to generate questions for.
   * @param token JWT token for authentication.
   * @returns An Observable containing the list of newly generated MCQItems.
   */
  generateMoreMcqsForSkill(jobUniqueId: string, skill: string, token: string): Observable<MCQItem[]> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    const endpoint = `${this.apiUrl}/job-post/${jobUniqueId}/generate-more-mcqs/`;
    const body = { skill };

    return this.http.post<{ status: string; data: MCQItem[] }>(endpoint, body, { headers }).pipe(
      map(response => {
        if (response.status === 'success' && response.data) {
          return response.data;
        }
        throw new Error('Failed to generate more questions or unexpected response structure.');
      }),
      catchError(error => this.handleError(error, 'generateMoreMcqsForSkill'))
    );
  }

  /**
   * Updates the status of a job post
   * @param uniqueId Unique identifier of the job post
   * @param status New status ('draft' or 'final')
   * @param token JWT token for authentication
   * @returns Observable with success message and unique_id
   */
  updateJobPostStatus(uniqueId: string, status: 'draft' | 'final', token: string): Observable<{ message: string; unique_id: string }> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    const payload = { unique_id: uniqueId, status };
    const endpoint = `${this.apiUrl}/job-post/update-status/`;

    return this.http.post<{ status: string; data: { message: string; unique_id: string } }>(endpoint, payload, { headers })
      .pipe(
        map(response => {
            if (response.status === 'success' && response.data) { return response.data; }
            throw new Error('Unexpected response structure during status update');
        }),
        catchError(error => this.handleError(error, 'updateJobPostStatus'))
      );
  }

  /**
   * Soft deletes a job post
   * @param uniqueId Unique identifier of the job post
   * @param token JWT token for authentication
   * @returns Observable with success message and unique_id
   */
  deleteJobPost(uniqueId: string, token: string): Observable<{ message: string; unique_id: string }> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    const payload = { unique_id: uniqueId };
    const endpoint = `${this.apiUrl}/job-post/delete/`;

    return this.http.delete<{ status: string; data: { message: string; unique_id: string } }>(endpoint, { headers, body: payload })
      .pipe(
        map(response => {
            if (response.status === 'success' && response.data) { return response.data; }
            throw new Error('Unexpected response structure during delete job post');
        }),
        catchError(error => this.handleError(error, 'deleteJobPost'))
      );
  }

  /**
   * Soft deletes an uploaded file
   * @param uniqueId Unique identifier of the file
   * @param token JWT token for authentication
   * @returns Observable with success message and unique_id
   */
  deleteFile(uniqueId: string, token: string): Observable<{ message: string; unique_id: string }> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    const payload = { unique_id: uniqueId };
    const endpoint = `${this.apiUrl}/file-upload/delete/`;

    return this.http.delete<{ status: string; data: { message: string; unique_id: string } }>(endpoint, { headers, body: payload })
      .pipe(
        map(response => {
            if (response.status === 'success' && response.data) { return response.data; }
            throw new Error('Unexpected response structure during delete file');
        }),
        catchError(error => this.handleError(error, 'deleteFile'))
      );
  }

  /**
   * Lists all job posts for the authenticated user (paginated)
   * @param token JWT token for authentication
   * @param page Page number for pagination (optional)
   * @returns Observable with paginated job posts
   */
  listJobPosts(token: string, page?: number): Observable<PaginatedJobPostResponse> {
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    let endpoint = `${this.apiUrl}/job-post/`;
    if (page) {
      endpoint += `?page=${page}`;
    }

    return this.http.get<{ status: string; data: PaginatedJobPostResponse }>(endpoint, { headers })
      .pipe(
        map(response => {
          if (response.status === 'success' && response.data) { return response.data; }
          throw new Error('Unexpected response structure when listing job posts');
        }),
        catchError(error => this.handleError(error, 'listJobPosts'))
      );
  }

  /**
   * Retrieves a single job post by unique_id
   * @param uniqueId Unique identifier of the job post
   * @param token JWT token for authentication
   * @returns Observable with job post details
   */
  getJobPost(uniqueId: string, token: string): Observable<JobDetails> {
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    const endpoint = `${this.apiUrl}/job-post/${uniqueId}/`;

    return this.http.get<{ status: string; data: JobDetails }>(endpoint, { headers })
      .pipe(
        map(response => {
          if (response.status === 'success' && response.data) { return response.data; }
          throw new Error('Unexpected response structure when fetching a single job post');
        }),
        catchError(error => this.handleError(error, 'getJobPost'))
      );
  }

  /**
   * Handles HTTP errors and formats error messages for user display.
   * @param error The HTTP error response.
   * @param operation The name of the operation that failed (for logging).
   * @returns Observable that throws a formatted error.
   */
  private handleError(error: HttpErrorResponse, operation: string = 'operation'): Observable<never> {
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