// src/app/services/job.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthService } from './candidate.service';

@Injectable({
  providedIn: 'root'
})
export class JobsService {
  private apiUrl = environment.apiUrl + 'api/jobs/';
  // [NEW] API URL for the job_saved app
  private savedJobsApiUrl = environment.apiUrl;


  // --- Private State Management ---
  private jobsSubject = new BehaviorSubject<any[]>([]);
  private jobsCache: any[] = [];
  private jobDetailsCache: { [key: number]: any } = {};
  private isFetchingJobs = false;

  /**
   * Public observable stream for components to subscribe to the jobs list.
   */
  public jobs$ = this.jobsSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  /**
   * Constructs the authorization headers for authenticated API requests.
   */
  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getJWTToken();

    if (!token) {
      console.warn('[JobsService] getAuthHeaders: No auth token found via AuthService. Request will be anonymous.');
      return new HttpHeaders({ 'Content-Type': 'application/json' });
    }

    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * Fetches the list of all recommended jobs from the backend. This list is pre-filtered
   * by the backend for authenticated users (excluding applied and disliked jobs).
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
    console.log('%c[JobsService] fetchJobs: Cache is empty. Fetching fresh recommended jobs from API...', 'color: blue; font-weight: bold;');

    return this.http.get<any>(this.apiUrl, { headers: this.getAuthHeaders() }).pipe(
      map(response => Array.isArray(response) ? response : (response.results || [])),
      tap(jobs => {
        console.log(`%c[JobsService] fetchJobs: API call successful. Received ${jobs.length} recommended jobs.`, 'color: green;');
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
   * [NEW] Fetches the details of all jobs a user has saved.
   * This calls the new dedicated endpoint in the job_saved Django app.
   * @param userId The ID of the user whose saved jobs are to be fetched.
   * @returns An observable with an array of full job objects.
   */
  public fetchSavedJobs(userId: string): Observable<any[]> {
    if (!userId) {
      console.error('[JobsService] fetchSavedJobs: userId is missing. Cannot fetch saved jobs.');
      return of([]); // Return an empty array if there's no user ID.
    }

    const url = `${this.savedJobsApiUrl}details/${userId}/`;
    console.log('%c[JobsService] fetchSavedJobs: Fetching saved jobs from API...', 'color: blue; font-weight: bold;');
    
    // Always fetch saved jobs fresh, don't cache them here to ensure the list is always up-to-date.
    return this.http.get<any[]>(url, { headers: this.getAuthHeaders() }).pipe(
      tap(jobs => {
        console.log(`%c[JobsService] fetchSavedJobs: API call successful. Received ${jobs.length} saved jobs.`, 'color: green;');
      }),
      catchError(error => {
        console.error('[JobsService] fetchSavedJobs: API call failed.');
        return this.handleError(error);
      })
    );
  }

   public fetchAppliedJobDetails(): Observable<any[]> {
    // Note: The user ID is sent automatically in the auth token header.
    const url = `${environment.apiUrl}api/applied-job-details/`;
    console.log('%c[JobsService] fetchAppliedJobDetails: Fetching applied jobs from API...', 'color: blue; font-weight: bold;');
    
    return this.http.get<any[]>(url, { headers: this.getAuthHeaders() }).pipe(
      tap(jobs => {
        console.log(`%c[JobsService] fetchAppliedJobDetails: API call successful. Received ${jobs.length} applied jobs.`, 'color: green;');
      }),
      catchError(error => {
        console.error('[JobsService] fetchAppliedJobDetails: API call failed.');
        return this.handleError(error);
      })
    );
  }


  /**
   * Retrieves a single job by its ID, using a cache.
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
   * Clears all cached data for recommended jobs.
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
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    const errorMessage = `API Error (Status: ${error.status}, URL: ${error.url})`;
    console.error(`[JobsService] ${errorMessage}`, error);
    return throwError(() => new Error(`No jobs at the moment. Please try again later.`));
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