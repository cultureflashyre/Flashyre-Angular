import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, Subscription, throwError, timer } from 'rxjs';
import { environment } from '../../environments/environment';
import { Router } from '@angular/router';
import { tap, catchError } from 'rxjs/operators';
import { SocialAuthService } from '@abacritt/angularx-social-login';
import { jwtDecode } from 'jwt-decode';
import { clearAllAuthData, isAuthenticated } from '../utils/auth-utils';
import { AuthBroadcastService } from './auth-broadcast.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Base URL for the API, loaded from the environment configuration.
  private apiUrl = environment.apiUrl;
  private silentRefreshSub: Subscription | null = null;
  private isSilentRefreshing = false;

  constructor(
    private http: HttpClient, 
    private router: Router,
    private socialAuthService: SocialAuthService,
    private authBroadcastService: AuthBroadcastService,
  ) {
    this.initBroadcastListeners();
    if (this.isLoggedIn()) {
      this.startSilentRefreshTimer();
    }
  }

  private initBroadcastListeners(): void {
    this.authBroadcastService.messages$.subscribe(msg => {
      if (msg.type === 'TOKEN_REFRESHED' || msg.type === 'LOGIN_SUCCESS') {
        localStorage.setItem('jwtToken', msg.accessToken);
        if (msg.refreshToken) {
          localStorage.setItem('refreshToken', msg.refreshToken);
        }
        this.startSilentRefreshTimer(msg.accessToken, false);
      } else if (msg.type === 'LOGOUT') {
        this.clearTokens(false);
        const currentUrl = this.router.url;
        if (!currentUrl.includes('/login') && !currentUrl.includes('/signup')) {
          this.router.navigate(['/login']);
        }
      }
    });
  }

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
  login(email: string, password: string, captchaId?: string, captchaAnswer?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}api/auth/login/`, { 
      email, 
      password,
      captcha_id: captchaId,
      captcha_answer: captchaAnswer
    }).pipe(
      tap(response => {
        if (response.access && response.refresh) {
          this.saveTokens(response.access, response.refresh);
          localStorage.setItem('userProfile', JSON.stringify({ user_id: response.user_id }));
        }
      })
    );
  }

  /**
   * Logs the user out by clearing authentication data from localStorage and redirecting.
   */
async logout(): Promise<void> {
  try {
    // 1. Sign out from the social provider (Google). This will resolve even
    //    if the user was not logged in with a social provider.
    await this.socialAuthService.signOut();
    console.log('User signed out from social provider.');
  } catch (error) {
    console.error('Error signing out from social provider:', error);
  } finally {
    // 2. Clear all your application's session data and notify other tabs
    this.clearTokens(true);

    // 3. Redirect the user to the login page.
    this.router.navigate(['/login']);
  }
}

  clearTokens(shouldBroadcast: boolean = true): void {
    this.stopSilentRefreshTimer();
    if (shouldBroadcast) {
      this.authBroadcastService.broadcastLogout();
    }
    clearAllAuthData();
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
   * Saves access and refresh tokens to localStorage and schedules proactive refresh.
   * @param access The JWT access token.
   * @param refresh The JWT refresh token.
   * @param shouldBroadcast Whether to synchronize this token across browser tabs.
   */
  saveTokens(access: string, refresh: string, shouldBroadcast: boolean = true): void {
    localStorage.setItem('jwtToken', access);
    localStorage.setItem('refreshToken', refresh);
    this.startSilentRefreshTimer(access, shouldBroadcast);
    if (shouldBroadcast) {
      this.authBroadcastService.broadcastTokenRefreshed(access, refresh);
    }
  }

  /**
   * Starts a proactive silent refresh timer that executes 2 minutes before the JWT access token expires.
   */
  startSilentRefreshTimer(tokenStr?: string, shouldBroadcast: boolean = true): void {
    this.stopSilentRefreshTimer();

    const token = tokenStr || this.getJWTToken();
    if (!token) return;

    try {
      const decoded = jwtDecode<{ exp: number }>(token);
      const expMs = decoded.exp * 1000;
      const nowMs = Date.now();
      // Proactive refresh target: 2 minutes (120,000 ms) before expiration
      const leadTimeMs = 2 * 60 * 1000;
      const delayMs = Math.max(0, expMs - nowMs - leadTimeMs);

      console.log(`[AuthService] Proactive silent refresh scheduled in ${(delayMs / 1000).toFixed(0)} seconds.`);

      this.silentRefreshSub = timer(delayMs).subscribe(() => {
        if (this.isSilentRefreshing) return;
        this.isSilentRefreshing = true;

        console.log('[AuthService] Proactive silent refresh timer fired at T-2min.');
        this.refreshToken().subscribe({
          next: (res: any) => {
            this.isSilentRefreshing = false;
            if (res && res.access) {
              this.saveTokens(res.access, res.refresh || this.getRefreshToken() || '', shouldBroadcast);
            }
          },
          error: (err: any) => {
            this.isSilentRefreshing = false;
            console.warn('[AuthService] Proactive silent refresh failed (will fallback to interceptor on demand):', err);
          }
        });
      });
    } catch (e) {
      console.warn('[AuthService] Failed to schedule silent refresh timer:', e);
    }
  }

  /**
   * Cancels the active proactive silent refresh timer subscription.
   */
  stopSilentRefreshTimer(): void {
    if (this.silentRefreshSub) {
      this.silentRefreshSub.unsubscribe();
      this.silentRefreshSub = null;
    }
  }

  /**
   * Refreshes an expired JWT token using HttpOnly cookie or refresh token fallback.
   * @returns An Observable of the new token pair.
   */
  refreshToken() {
    const refresh = this.getRefreshToken();
    return this.http.post<any>(
      `${this.apiUrl}api/token/refresh/`,
      refresh ? { refresh } : {},
      { withCredentials: true }
    );
  }

  /**
   * Checks if a user is currently logged in by verifying the presence of a valid, unexpired JWT token.
   * @returns True if a valid token exists, false otherwise.
   */
  isLoggedIn(): boolean {
    return isAuthenticated();
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

    // --- NEW METHOD 1: Initial Google Auth Check ---
  googleAuthCheck(idToken: string, selectedUserType: string): Observable<any> {
    // The user type is implicitly 'candidate' when using this service.
    return this.http.post(`${this.apiUrl}api/auth/google/check/`, { idToken, selectedUserType });
  }

  // --- NEW METHOD 2: Complete Google Signup ---
  completeGoogleSignup(userData: {
    email: string;
    first_name: string;
    last_name: string;
    phone_number: string;
  }): Observable<any> {
    const payload = {
      ...userData,
      user_type: 'candidate' // Hardcoded for this service
    };
    return this.http.post(`${this.apiUrl}api/auth/google/complete/`, payload);
  }

  /**
   * Fetches the detailed skill breakdown for a specific job.
   * CORRECTION: URL path updated to match the registered Django pattern.
   */
  getMatchBreakdown(jobId: string): Observable<any> {
    // WAS: ${this.apiUrl}api/resume-analyzer/jobs/... (Caused 404)
    // NOW: ${this.apiUrl}api/jobs/...
    return this.http.get(`${this.apiUrl}api/jobs/${jobId}/match-breakdown/`, { 
      headers: this.getAuthHeaders() 
    }).pipe(
      catchError(error => {
        console.error('Error fetching match breakdown:', error);
        return throwError(() => new Error('Failed to load skill analysis.'));
      })
    );
  }
  
}
