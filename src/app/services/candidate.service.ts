import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { Router } from '@angular/router';
import { tap, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Base URL for the API, loaded from the environment configuration.
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient, 
    private router: Router) {}

  /**
   * Creates and returns HttpHeaders with the JWT token for authenticated requests.
   * @returns HttpHeaders object with Authorization token.
   */
  private getAuthHeaders(): HttpHeaders {
    const token = this.getJWTToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : ''
    });
  }

  // --- AUTHENTICATION METHODS ---

  /**
   * Handles candidate login.
   * @param email The candidate's email.
   * @param password The candidate's password.
   * @returns An Observable with the server's response, including the token.
   */
  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}api/auth/login/`, { email, password }).pipe(
      tap(response => {
        if (response.token) {
          localStorage.setItem('jwtToken', response.token);
          // Assuming the user object might be nested, adjust as needed.
          localStorage.setItem('userProfile', JSON.stringify({ user_id: response.user_id, ...response.user }));
        }
      })
    );
  }

  /**
   * Logs the user out by clearing authentication data from localStorage and redirecting.
   */
  logout(): void {
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userProfile');
    localStorage.removeItem('user_id');
    localStorage.removeItem('userType');

    
    this.router.navigate(['/login-candidate']);
  }

  clearTokens(): void {
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userProfile');
    localStorage.removeItem('user_id');
    localStorage.removeItem('userType');
  }

  getMatchScores(jobIds: number[]): Observable<{[key: number]: number}> {
    const url = `${this.apiUrl}api/jobs/get-match-scores/`;
    // The backend expects an object with a 'job_ids' key
    return this.http.post<{[key: number]: number}>(url, { job_ids: jobIds });
  }

  // --- JOB APPLICATION METHODS ---

  // --- MODIFICATION START ---
  /**
   * Applies the current user to a specific job, now including their matching score.
   * @param jobId The ID of the job to apply for.
   * @param matchingScore The calculated matching score for the candidate and job.
   * @returns An Observable of the API response.
   */
  applyForJob(jobId: number, matchingScore: number | null | undefined): Observable<any> {
    const payload = {
      job_post_id: jobId,
      matching_score: matchingScore
    };

    return this.http.post(`${this.apiUrl}api/apply/`, payload, { headers: this.getAuthHeaders() }).pipe(
      catchError(error => {
        console.error('Error in applyForJob:', error);
        return throwError(() => new Error('Failed to apply for job'));
      })
    );
  }
  // --- MODIFICATION END ---

  /**
   * Fetches all jobs the current user has applied for.
   * @returns An Observable with a list of applied jobs.
   */
  getAppliedJobs(): Observable<any> {
    return this.http.get(`${this.apiUrl}api/applied-jobs/`, { headers: this.getAuthHeaders() }).pipe(
      catchError(error => {
        console.error('Error in getAppliedJobs:', error);
        return throwError(() => new Error('Failed to fetch applied jobs'));
      })
    );
  }

  // --- DISLIKED JOB METHODS ---

  /**
   * Marks a job as "disliked" for a specific user.
   * @param userId The ID of the user.
   * @param jobId The ID of the job to dislike.
   * @returns An Observable of the API response.
   */
  dislikeJob(userId: string, jobId: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}dislike/`,
      { user_id: userId, job_post_id: jobId },
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(error => {
        console.error('Error in dislikeJob:', error);
        return throwError(() => new Error('Failed to dislike job'));
      })
    );
  }

  /**
   * Removes a job from the "disliked" list for a specific user.
   * @param userId The ID of the user.
   * @param jobId The ID of the job to remove the dislike from.
   * @returns An Observable of the API response.
   */
  removeDislikedJob(userId: string, jobId: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}remove-dislike/`,
      { user_id: userId, job_post_id: jobId },
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(error => {
        console.error('Error in removeDislikedJob:', error);
        return throwError(() => new Error('Failed to remove disliked job'));
      })
    );
  }

  /**
   * Fetches the list of all jobs a user has disliked.
   * Used to set the initial state of the dislike button on job cards.
   * @param userId The ID of the user.
   * @returns An Observable containing the list of disliked jobs.
   */
  getDislikedJobs(userId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}disliked/${userId}/`, { headers: this.getAuthHeaders() }).pipe(
      catchError(error => {
        console.error('Error in getDislikedJobs:', error);
        return throwError(() => new Error('Failed to fetch disliked jobs'));
      })
    );
  }

  // --- SAVED JOB METHODS (IMPLEMENTING SAVE/UNSAVE) ---

  /**
   * Saves a job for a specific user.
   * This is the "add" part of the save/unsave toggle.
   * @param userId The ID of the user.
   * @param jobId The ID of the job to save.
   * @returns An Observable of the API response.
   */
  saveJob(userId: string, jobId: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}save/`,
      { user_id: userId, job_post_id: jobId },
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(error => {
        console.error('Error in saveJob:', error);
        return throwError(() => new Error('Failed to save job'));
      })
    );
  }

  /**
   * **[NEW]** Removes a job from the "saved" list for a specific user.
   * This is the "remove" part of the save/unsave toggle.
   * @param userId The ID of the user.
   * @param jobId The ID of the job to unsave.
   * @returns An Observable of the API response.
   */
  removeSavedJob(userId: string, jobId: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}remove-saved/`,
      { user_id: userId, job_post_id: jobId },
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(error => {
        console.error('Error in removeSavedJob:', error);
        return throwError(() => new Error('Failed to remove saved job'));
      })
    );
  }

  /**
   * **[NEW]** Fetches the list of all jobs a user has saved.
   * Used to set the initial state of the save button on job cards.
   * @param userId The ID of the user.
   * @returns An Observable containing the list of saved jobs.
   */
  getSavedJobs(userId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}saved/${userId}/`, { headers: this.getAuthHeaders() }).pipe(
      catchError(error => {
        console.error('Error in getSavedJobs:', error);
        return throwError(() => new Error('Failed to fetch saved jobs'));
      })
    );
  }

  // --- TOKEN MANAGEMENT METHODS ---

  /**
   * Retrieves the JWT token from localStorage.
   * @returns The JWT token string or null if not found.
   */
  getJWTToken(): string | null {
    return localStorage.getItem('jwtToken');
  }

  /**
   * Retrieves the refresh token from localStorage.
   * @returns The refresh token string or null if not found.
   */
  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  /**
   * Saves access and refresh tokens to localStorage.
   * @param access The JWT access token.
   * @param refresh The JWT refresh token.
   */
  saveTokens(access: string, refresh: string) {
    localStorage.setItem('jwtToken', access);
    localStorage.setItem('refreshToken', refresh);
  }

  /**
   * Refreshes an expired JWT token using the refresh token.
   * @returns An Observable of the new token pair.
   */
  refreshToken() {
    const refresh = this.getRefreshToken();
    if (!refresh) {
      return throwError(() => new Error('No refresh token available'));
    }
    return this.http.post<any>(`${this.apiUrl}api/token/refresh/`, { refresh });
  }

  /**
   * Checks if a user is currently logged in by verifying the presence of a JWT token.
   * @returns True if a token exists, false otherwise.
   */
  isLoggedIn(): boolean {
    const token = this.getJWTToken();
    return !!token; // Converts the token string (or null) to a boolean.
  }
   /**
   * Revokes a job application for the current user.
   * @param jobId The ID of the job application to revoke.
   * @returns An Observable of the API response.
   */
  revokeApplication(jobId: number): Observable<any> {
    const url = `${this.apiUrl}api/revoke-application/`;
    return this.http.post(url, { job_post_id: jobId }, { headers: this.getAuthHeaders() }).pipe(
      catchError(error => {
        console.error('Error in revokeApplication:', error);
        return throwError(() => new Error('Failed to revoke application'));
      })
    );
  }
}