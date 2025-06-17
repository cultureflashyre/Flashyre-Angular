import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { JobDetails, AIJobResponse, PaginatedJobPostResponse } from '../pages/create-job-post-1st-page/types';

@Injectable({
  providedIn: 'root'
})
export class JobDescriptionService {
  // Base API URL from environment configuration (e.g., 'http://localhost:8000/api/')
  private readonly apiUrl: string = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Uploads a file to Google Cloud Storage, processes it with AI, and saves metadata and draft job post.
   * @param file The file to upload
   * @param token JWT token for authentication
   * @returns Observable with file URL, unique ID, job details, and MCQs
   */
  uploadFile(file: File, token: string): Observable<AIJobResponse & { file_url: string; unique_id: string }> {
    // Validate file input
    if (!file) {
      console.error('No file provided for upload');
      return throwError(() => new Error('No file selected for upload'));
    }

    // Validate file size (max 10MB, matching Django view)
    if (file.size > 10 * 1024 * 1024) {
      return throwError(() => new Error('File size exceeds 10MB'));
    }

    // Validate file extension
    const allowedExtensions = ['.pdf', '.docx', '.txt', '.xml', '.csv'];
    const ext = file.name.toLowerCase().split('.').pop();
    if (!ext || !allowedExtensions.includes(`.${ext}`)) {
      return throwError(() => new Error(`Invalid file format. Supported: ${allowedExtensions.join(', ')}`));
    }

    // Create FormData for file upload
    const formData = new FormData();
    formData.append('file', file, file.name);

    // Set Authorization header with Bearer token
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http
      .post<{ status: string; data: AIJobResponse & { file_url: string; unique_id: string } }>(
        `${this.apiUrl}file-upload/`, // Endpoint: /api/file-upload/
        formData,
        { headers }
      )
      .pipe(
        map(response => response.data),
        catchError(error => this.handleError(error))
      );
  }

  /**
   * Creates or updates a job post
   * @param jobDetails Job details to save
   * @param token JWT token for authentication
   * @returns Observable with unique_id and success message
   */
  saveJobPost(jobDetails: JobDetails, token: string): Observable<{ message: string; unique_id: string }> {
    // Set headers for JSON request
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http
      .post<{ status: string; data: { message: string; unique_id: string } }>(
        `${this.apiUrl}job-post/`, // Endpoint: /api/job-post/
        jobDetails,
        { headers }
      )
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
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
    // Set headers for JSON request
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    // Prepare payload matching JobPostStatusUpdateSerializer
    const payload = { unique_id: uniqueId, status };

    return this.http
      .post<{ status: string; data: { message: string; unique_id: string } }>(
        `${this.apiUrl}job-post/update-status/`, // Endpoint: /api/job-post/update-status/
        payload,
        { headers }
      )
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  /**
   * Soft deletes a job post
   * @param uniqueId Unique identifier of the job post
   * @param token JWT token for authentication
   * @returns Observable with success message and unique_id
   */
  deleteJobPost(uniqueId: string, token: string): Observable<{ message: string; unique_id: string }> {
    // Set headers for JSON request
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    // Prepare payload matching DeleteSerializer
    const payload = { unique_id: uniqueId };

    return this.http
      .delete<{ status: string; data: { message: string; unique_id: string } }>(
        `${this.apiUrl}job-post/delete/`, // Endpoint: /api/job-post/delete/
        { headers, body: payload }
      )
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  /**
   * Soft deletes an uploaded file
   * @param uniqueId Unique identifier of the file
   * @param token JWT token for authentication
   * @returns Observable with success message and unique_id
   */
  deleteFile(uniqueId: string, token: string): Observable<{ message: string; unique_id: string }> {
    // Set headers for JSON request
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    // Prepare payload matching DeleteSerializer
    const payload = { unique_id: uniqueId };

    return this.http
      .delete<{ status: string; data: { message: string; unique_id: string } }>(
        `${this.apiUrl}file-upload/delete/`, // Endpoint: /api/file-upload/delete/
        { headers, body: payload }
      )
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  /**
   * Lists all job posts for the authenticated user (paginated)
   * @param token JWT token for authentication
   * @param page Page number for pagination (optional)
   * @returns Observable with paginated job posts
   */
  listJobPosts(token: string, page?: number): Observable<PaginatedJobPostResponse> {
    // Set headers for JSON request
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    // Prepare URL with optional page parameter
    let url = `${this.apiUrl}job-post/`;
    if (page) {
      url += `?page=${page}`;
    }

    return this.http
      .get<{ status: string; data: PaginatedJobPostResponse }>(
        url, // Endpoint: /api/job-post/
        { headers }
      )
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  /**
   * Retrieves a single job post by unique_id
   * @param uniqueId Unique identifier of the job post
   * @param token JWT token for authentication
   * @returns Observable with job post details
   */
  getJobPost(uniqueId: string, token: string): Observable<JobDetails> {
    // Set headers for JSON request
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http
      .get<{ status: string; data: JobDetails }>(
        `${this.apiUrl}job-post/${uniqueId}/`, // Endpoint: /api/job-post/<unique_id>/
        { headers }
      )
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  /**
   * Handles HTTP errors and formats error messages
   * @param error HTTP error response
   * @returns Observable with formatted error message
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Client-side error: ${error.error.message}`;
    } else {
      // Server-side error
      if (error.status === 400) {
        if (error.error?.status === 'error') {
          // Handle Django validation errors or specific messages
          errorMessage = error.error.message || 'Invalid request data';
          if (error.error.errors) {
            errorMessage = Object.keys(error.error.errors)
              .map(key => `${key}: ${error.error.errors[key].join(', ')}`)
              .join('; ');
          }
        } else {
          errorMessage = 'Invalid request data';
        }
      } else if (error.status === 401) {
        errorMessage = 'Unauthorized: Please log in again';
      } else if (error.status === 403) {
        errorMessage = 'Forbidden: Invalid unique_id or unauthorized';
      } else if (error.status === 404) {
        errorMessage = 'Not found: Resource does not exist';
      } else if (error.status === 500) {
        errorMessage = `Server error: ${error.error?.message || 'Internal server error'}`;
      } else {
        errorMessage = `Server error: ${error.status} - ${error.message}`;
      }
    }

    // Log error for debugging
    console.error(errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }
}