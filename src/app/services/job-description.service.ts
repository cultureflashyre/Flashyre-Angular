import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment'; // Ensure this path is correct
import { JobDetails, AIJobResponse, PaginatedJobPostResponse } from '../pages/create-job-post-1st-page/types'; // Ensure this path is correct

@Injectable({
  providedIn: 'root'
})
export class JobDescriptionService {
  // Base API URL from environment configuration (e.g., 'http://localhost:8000/api')
  private readonly apiUrl: string = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Uploads a file to Google Cloud Storage, processes it with AI, and saves metadata and draft job post.
   * @param file The file to upload
   * @param token JWT token for authentication
   * @returns Observable with file URL, unique ID, job details, and MCQs
   */
  uploadFile(file: File, token: string): Observable<AIJobResponse & { file_url: string; unique_id: string }> {
    if (!file) {
      console.error('No file provided for upload');
      return throwError(() => new Error('No file selected for upload'));
    }

    if (file.size > 10 * 1024 * 1024) {
      return throwError(() => new Error('File size exceeds 10MB'));
    }

    const allowedExtensions = ['.pdf', '.docx', '.txt', '.xml', '.csv'];
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
      .post<{ status: string; data: AIJobResponse & { file_url: string; unique_id: string } }>(
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

    // Corrected URL construction:
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
        // If status is 'error' but a 2xx response (unlikely but possible)
        if (response.status === 'error' && response.errors) {
            throw new HttpErrorResponse({ error: response, status: 400 }); // Simulate an error
        }
        throw new Error('Unexpected response status or missing data during save job post');
      }),
      catchError(error => this.handleError(error, 'saveJobPost'))
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
    // Corrected URL construction:
    const endpoint = `${this.apiUrl}/job-post/update-status/`;

    return this.http
      .post<{ status: string; data: { message: string; unique_id: string } }>(
        endpoint,
        payload,
        { headers }
      )
      .pipe(
        map(response => {
            if (response.status === 'success' && response.data) {
                return response.data;
            }
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
      'Content-Type': 'application/json' // Django expects body for delete with unique_id
    });

    const payload = { unique_id: uniqueId };
    // Corrected URL construction:
    const endpoint = `${this.apiUrl}/job-post/delete/`;

    return this.http
      .delete<{ status: string; data: { message: string; unique_id: string } }>(
        endpoint,
        { headers, body: payload } // Send payload in body for DELETE
      )
      .pipe(
        map(response => {
            if (response.status === 'success' && response.data) {
                return response.data;
            }
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
      'Content-Type': 'application/json' // Django expects body for delete with unique_id
    });

    const payload = { unique_id: uniqueId };
    // Corrected URL construction:
    const endpoint = `${this.apiUrl}/file-upload/delete/`;

    return this.http
      .delete<{ status: string; data: { message: string; unique_id: string } }>(
        endpoint,
        { headers, body: payload } // Send payload in body for DELETE
      )
      .pipe(
        map(response => {
            if (response.status === 'success' && response.data) {
                return response.data;
            }
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
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    // Corrected URL construction:
    let endpoint = `${this.apiUrl}/job-post/`;
    if (page) {
      endpoint += `?page=${page}`;
    }

    return this.http
      .get<{ status: string; data: PaginatedJobPostResponse }>( // Expecting {status: 'success', data: {...}}
        endpoint,
        { headers }
      )
      .pipe(
        map(response => {
          if (response.status === 'success' && response.data) {
            return response.data;
          }
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
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    // Corrected URL construction:
    const endpoint = `${this.apiUrl}/job-post/${uniqueId}/`;

    return this.http
      .get<{ status: string; data: JobDetails }>( // Expecting {status: 'success', data: {...}}
        endpoint,
        { headers }
      )
      .pipe(
        map(response => {
          if (response.status === 'success' && response.data) {
            return response.data;
          }
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
      // Client-side error (e.g., network issue)
      errorMessage = `Client-side error in ${operation}: ${error.error.message}`;
    } else {
      // Server-side error
      // Backend sends { "status": "error", "message": "...", "errors": {...} } or { "detail": "..." } for DRF defaults
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
                    errorMessage = fieldErrors; // Prioritize specific field errors
                } else if (!serverError.message) {
                    errorMessage = `Validation errors occurred in ${operation}.`;
                }
            } else if (serverError.errors && typeof serverError.errors === 'string') { // Sometimes errors might be a string
                errorMessage = serverError.errors;
            } else if (!serverError.message && !serverError.errors) {
                 // If only status: 'error'
                errorMessage = `An error occurred on the server during ${operation}.`;
            }
        } else if (serverError.detail) { // Standard DRF error
            errorMessage = serverError.detail;
        } else if (typeof serverError === 'string') { // Plain text error response
            errorMessage = serverError;
        } else {
            errorMessage = `Server error ${error.status} in ${operation}: ${error.message || 'No specific message'}`;
        }
      } else {
        // Error object itself might not have 'error' property but status and message
        errorMessage = `HTTP ${error.status} in ${operation}: ${error.statusText || error.message || 'Server error'}`;
      }
    }

    console.error(`Operation: ${operation} failed. Status: ${error.status}. Message: ${errorMessage}. Full Error:`, error);
    return throwError(() => new Error(errorMessage));
  }
}