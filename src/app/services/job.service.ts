import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
 
@Injectable({
  providedIn: 'root'
})
export class JobsService {
  private apiUrl = environment.apiUrl + 'api/jobs/';
  private jobsSubject = new BehaviorSubject<any[]>([]);
  private jobsCache: any[] = [];
  private jobDetailsCache: { [key: number]: any } = {};
  private isJobsFetched = false;
  private isFetchingJobs = false;
 
  jobs$ = this.jobsSubject.asObservable();
 
  constructor(private http: HttpClient) {}
 
  private getAuthHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }
 
  /**
   * Fetch all jobs (with caching and reactive stream)
   */
  fetchJobs(): Observable<any[]> {
    if (this.isJobsFetched && this.jobsCache.length > 0) {
      console.log('[fetchJobs] Returning from cache');
      return of(this.jobsCache);
    }
 
    if (this.isFetchingJobs) {
      console.log('[fetchJobs] Already fetching');
      return this.jobs$;
    }
 
    this.isFetchingJobs = true;
    console.log('[fetchJobs] Fetching from API...');
 
    return this.http.get<any>(this.apiUrl, { headers: this.getAuthHeaders() }).pipe(
      tap(response => {
        const jobs = response.results || response;
        console.log('[fetchJobs] Jobs fetched:', jobs);
        this.jobsCache = jobs;
        this.isJobsFetched = true;
        this.isFetchingJobs = false;
        this.jobsSubject.next(jobs);
      }),
      catchError(error => {
        this.isFetchingJobs = false;
        return this.handleError(error);
      })
    );
  }
 
  /**
   * Get observable stream of jobs (reactive)
   */
  getJobs(): Observable<any[]> {
    return this.jobs$;
  }
 
  /**
   * Get cached jobs synchronously
   */
  getCachedJobs(): any[] {
    return this.jobsCache;
  }

  areJobsCached(): boolean {
    return this.isJobsFetched && this.jobsCache.length > 0;
  }
  
  clearCache_refresh(): void {
    this.jobsCache = [];
    this.isJobsFetched = false;
    this.jobsSubject.next([]);
  }


  /**
   * Get job by ID with caching
   */
  getJobById(jobId: number): Observable<any> {
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
   * Update a specific job in cache
   */
  updateJobInCache(jobId: number, updates: any): void {
    const index = this.jobsCache.findIndex(job => job.job_id === jobId);
    if (index !== -1) {
      this.jobsCache[index] = { ...this.jobsCache[index], ...updates };
      this.jobsSubject.next(this.jobsCache);
    }
 
    if (this.jobDetailsCache[jobId]) {
      this.jobDetailsCache[jobId] = { ...this.jobDetailsCache[jobId], ...updates };
    }
  }
 
  /**
   * Remove job from cache
   */
  removeJobFromCache(jobId: number): void {
    this.jobsCache = this.jobsCache.filter(job => job.job_id !== jobId);
    delete this.jobDetailsCache[jobId];
    this.jobsSubject.next(this.jobsCache);
  }
 
  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.jobsCache = [];
    this.jobDetailsCache = {};
    this.isJobsFetched = false;
    this.jobsSubject.next([]);
    console.log('Cache cleared');
  }
 
  /**
   * Handle API error and format it properly
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred';
    if (error.status === 401) {
      errorMessage = 'Unauthorized: Please log in or provide a valid token';
    } else if (error.status === 404) {
      errorMessage = `Job not found: ${error.url}`;
    } else if (error.status === 0) {
      errorMessage = `Network error: Cannot reach server at ${error.url}`;
    } else {
      errorMessage = `Error ${error.status}: ${error.message}`;
    }
    console.error('API error:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }
}