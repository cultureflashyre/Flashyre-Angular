import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthService } from './candidate.service'; // <--- STEP 1: IMPORT THE AUTH SERVICE

@Injectable({
  providedIn: 'root'
})
export class JobsService {
  private apiUrl = environment.apiUrl + 'api/jobs/';

  // --- Private State Management ---
  private jobsSubject = new BehaviorSubject<any[]>([]);
  private jobsCache: any[] = [];
  private jobDetailsCache: { [key: number]: any } = {};
  private isFetchingJobs = false;

  /**
   * Public observable stream for components to subscribe to the jobs list.
   */
  public jobs$ = this.jobsSubject.asObservable();

  // --- STEP 2: INJECT THE AUTH SERVICE IN THE CONSTRUCTOR ---
  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  /**
   * Constructs the authorization headers for authenticated API requests.
   * This now uses the injected AuthService to get the token.
   */
  private getAuthHeaders(): HttpHeaders {
    // --- STEP 3: USE THE AUTH SERVICE'S METHOD TO GET THE TOKEN ---
    const token = this.authService.getJWTToken();

    if (!token) {
      console.warn('[JobsService] getAuthHeaders: No auth token found via AuthService. Request will be anonymous.');
      return new HttpHeaders({ 'Content-Type': 'application/json' });
    }

    console.log('[JobsService] getAuthHeaders: Auth token found via AuthService. Attaching to headers.');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // Assuming your backend expects a 'Bearer' token
    });
  }

  /**
   * Fetches the list of jobs from the backend. This list is pre-filtered
   * by the backend for authenticated users.
   */
  public fetchJobs(): Observable<any[]> {
    if (this.jobsCache.length > 0) {
      console.log(`[JobsService] fetchJobs: Returning ${this.jobsCache.length} jobs from cache.`);
      return of(this.jobsCache);
    }

    if (this.isFetchingJobs) {
      console.log('[JobsService] fetchJobs: Fetch already in progress. Returning observable.');
      return this.jobs$;
    }

    this.isFetchingJobs = true;
    console.log('%c[JobsService] fetchJobs: Cache is empty. Fetching fresh jobs from API...', 'color: blue; font-weight: bold;');

    return this.http.get<any>(this.apiUrl, { headers: this.getAuthHeaders() }).pipe(
      map(response => Array.isArray(response) ? response : (response.results || [])),
      tap(jobs => {
        console.log(`%c[JobsService] fetchJobs: API call successful. Received ${jobs.length} jobs.`, 'color: green;');
        this.jobsCache = jobs;
        this.jobsSubject.next([...this.jobsCache]);
        this.isFetchingJobs = false;
      }),
      catchError(error => {
        console.error('[JobsService] fetchJobs: API call failed.');
        this.isFetchingJobs = false;
        return this.handleError(error);
      })
    );
  }

  /**
   * Retrieves a single job by its ID, using a cache.
   * @param jobId The ID of the job to retrieve.
   */
  public getJobById(jobId: number): Observable<any> {
    if (this.jobDetailsCache[jobId]) {
      return of(this.jobDetailsCache[jobId]);
    }

    const url = `${this.apiUrl}${jobId}/`;
    return this.http.get<any>(url, { headers: this.getAuthHeaders() }).pipe(
      tap(job => {
        this.jobDetailsCache[jobId] = job;
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Clears all cached data.
   */
  public clearCache(): void {
    console.log('%c[JobsService] clearCache: Clearing all job and detail caches.', 'color: red; font-weight: bold;');
    this.jobsCache = [];
    this.jobDetailsCache = {};
    this.jobsSubject.next([]);
    this.isFetchingJobs = false;
  }

  /**
   * Centralized error handler for all HTTP requests in this service.
   * @param error The HttpErrorResponse object.
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    const errorMessage = `API Error (Status: ${error.status}, URL: ${error.url})`;
    console.error(`[JobsService] ${errorMessage}`, error);
    return throwError(() => new Error(`Failed to communicate with the server. Please try again later. Error: ${error.status}`));
  }

  // --- Methods from your original service file to maintain compatibility ---
  public getJobs(): Observable<any[]> { return this.jobs$; }
  public getCachedJobs(): any[] { return this.jobsCache; }
  public areJobsCached(): boolean { return this.jobsCache.length > 0; }
  public clearCache_refresh(): void { this.clearCache(); }
  public updateJobInCache(jobId: number, updates: any): void {
    const index = this.jobsCache.findIndex(job => job.job_id === jobId);
    if (index !== -1) {
      this.jobsCache[index] = { ...this.jobsCache[index], ...updates };
      this.jobsSubject.next([...this.jobsCache]);
    }
    if (this.jobDetailsCache[jobId]) {
      this.jobDetailsCache[jobId] = { ...this.jobDetailsCache[jobId], ...updates };
    }
  }
  public removeJobFromCache(jobId: number): void {
    this.jobsCache = this.jobsCache.filter(job => job.job_id !== jobId);
    delete this.jobDetailsCache[jobId];
    this.jobsSubject.next([...this.jobsCache]);
  }
}