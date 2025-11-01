// src/app/services/job.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError, Subject } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthService } from './candidate.service';

export interface JobInteraction {
  jobId: string;
  type: 'dislike' | 'save';
  state: boolean; // true if liked/saved, false if removed
}

@Injectable({
  providedIn: 'root'
})
export class JobsService {
  private apiUrl = environment.apiUrl + 'api/jobs/';
  private savedJobsApiUrl = environment.apiUrl;

  private jobInteractionSource = new Subject<JobInteraction>();
  public jobInteraction$ = this.jobInteractionSource.asObservable();

  // --- Private State Management ---
  private jobsSubject = new BehaviorSubject<any[]>([]);
  private jobsCache: any[] = [];
  private jobDetailsCache: { [key: number]: any } = {};
  private isFetchingJobs = false;
  
  // [ADDED] Smart cache invalidation flag. Initialized to true to ensure the first load is always fresh.
  private cacheIsDirty = true;

  public jobs$ = this.jobsSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  /**
   * [ADDED] Marks the cache as dirty, forcing a refresh on the next fetchJobs() call.
   * This should be called from any component/service after an action that would stale the job data (e.g., completing an assessment).
   */
  public invalidateCache(): void {
    console.log('%c[JobsService] invalidateCache: Cache marked as dirty.', 'color: orange; font-weight: bold;');
    this.cacheIsDirty = true;
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getJWTToken();
    if (!token) {
      console.warn('[JobsService] getAuthHeaders: No auth token found. Request will be anonymous.');
      return new HttpHeaders({ 'Content-Type': 'application/json' });
    }
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  public fetchJobs(): Observable<any[]> {
    // [MODIFIED] The service now checks if the cache is dirty before returning cached data.
    if (this.jobsCache.length > 0 && !this.cacheIsDirty) {
      console.log(`[JobsService] fetchJobs: Returning ${this.jobsCache.length} jobs from clean cache.`);
      return of(this.jobsCache);
    }

    if (this.isFetchingJobs) {
      console.log('[JobsService] fetchJobs: Fetch already in progress. Returning observable.');
      return this.jobs$;
    }

    this.isFetchingJobs = true;
    console.log('%c[JobsService] fetchJobs: Cache is dirty or empty. Fetching fresh jobs from API...', 'color: blue; font-weight: bold;');

    return this.http.get<any>(this.apiUrl, { headers: this.getAuthHeaders() }).pipe(
      map(response => Array.isArray(response) ? response : (response.results || [])),
      tap(jobs => {
        console.log(`%c[JobsService] fetchJobs: API call successful. Received ${jobs.length} jobs.`, 'color: green;');
        this.jobsCache = jobs;
        this.jobsSubject.next([...this.jobsCache]);
        this.isFetchingJobs = false;
        
        // [ADDED] Reset the dirty flag. The cache is now considered fresh.
        this.cacheIsDirty = false;
      }),
      catchError(error => {
        console.error('[JobsService] fetchJobs: API call failed.');
        this.isFetchingJobs = false;
        return this.handleError(error);
      })
    );
  }

  public fetchSavedJobs(userId: string): Observable<any[]> {
    if (!userId) {
      console.error('[JobsService] fetchSavedJobs: userId is missing.');
      return of([]);
    }
    const url = `${this.savedJobsApiUrl}details/${userId}/`;
    console.log('%c[JobsService] fetchSavedJobs: Fetching saved jobs from API...', 'color: blue; font-weight: bold;');
    return this.http.get<any[]>(url, { headers: this.getAuthHeaders() }).pipe(
      tap(jobs => {
        console.log(`%c[JobsService] fetchSavedJobs: API call successful. Received ${jobs.length} saved jobs.`, 'color: green;');
      }),
      catchError(this.handleError)
    );
  }

  public fetchAppliedJobDetails(): Observable<any[]> {
    const url = `${environment.apiUrl}api/applied-job-details/`;
    console.log('%c[JobsService] fetchAppliedJobDetails: Fetching applied jobs from API...', 'color: blue; font-weight: bold;');
    return this.http.get<any[]>(url, { headers: this.getAuthHeaders() }).pipe(
      tap(jobs => {
        console.log(`%c[JobsService] fetchAppliedJobDetails: API call successful. Received ${jobs.length} applied jobs.`, 'color: green;');
      }),
      catchError(this.handleError)
    );
  }

  public getJobById(jobId: number): Observable<any> {
    if (this.jobDetailsCache[jobId]) {
      return of(this.jobDetailsCache[jobId]);
    }
    const url = `${this.apiUrl}${jobId}/`;
    return this.http.get<any>(url, { headers: this.getAuthHeaders() }).pipe(
      tap(job => this.jobDetailsCache[jobId] = job),
      catchError(this.handleError)
    );
  }

  public clearCache(): void {
    console.log('%c[JobsService] clearCache: Clearing all job and detail caches and marking as dirty.', 'color: red; font-weight: bold;');
    this.jobsCache = [];
    this.jobDetailsCache = {};
    this.jobsSubject.next([]);
    this.isFetchingJobs = false;
    this.cacheIsDirty = true; // [MODIFIED] Ensure cache is marked as dirty when manually cleared.
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    const errorMessage = `API Error (Status: ${error.status}, URL: ${error.url})`;
    console.error(`[JobsService] ${errorMessage}`, error);
    return throwError(() => new Error(`No jobs at the moment. Please try again later.`));
  }

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

  public updateJobsInCache(updatedJobs: any[]): void {
    const jobsMap = new Map(updatedJobs.map(job => [job.job_id, job]));
    this.jobsCache.forEach((job, index) => {
      if (jobsMap.has(job.job_id)) {
        this.jobsCache[index] = jobsMap.get(job.job_id)!;
      }
    });
    this.jobsSubject.next([...this.jobsCache]);
    console.log('[JobsService] Job cache updated with matching scores.');
  }

  public notifyJobInteraction(jobId: string, type: 'dislike' | 'save', state: boolean): void {
    this.jobInteractionSource.next({ jobId, type, state });
  }

  public revokeApplication(jobId: number): Observable<any> {
    const url = `${this.apiUrl}api/revoke-application/`;
    return this.http.post(url, { job_id: jobId }, { headers: this.getAuthHeaders() }).pipe(
      catchError(error => {
        console.error('Error in revokeApplication:', error);
        return throwError(() => new Error('Failed to revoke application'));
      })
    );
  }

  public fetchAssessments(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}api/assessments/assessment-list/`);
  }
}