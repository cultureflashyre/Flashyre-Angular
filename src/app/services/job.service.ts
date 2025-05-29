import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class JobsService {
  private apiUrl = 'http://localhost:8000/api/jobs';
  private cachedJobs: any[] | null = null; // Cache for job list
  private cachedJobDetails: { [key: number]: any } = {}; // Cache for individual job details

  constructor(private http: HttpClient) {}

  // Helper method to get JWT token from localStorage
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('jwt_token');
    return new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    });
  }

  // Fetch all jobs, return cached data if available
  getJobs(): Observable<any[]> {
    if (this.cachedJobs) {
      console.log('Returning cached jobs');
      return of(this.cachedJobs); // Return cached data as Observable
    }

    const url = `${this.apiUrl}/`;
    console.log('Fetching jobs from:', url);
    return this.http.get<any[]>(url, { headers: this.getAuthHeaders() }).pipe(
      catchError(this.handleError),
      // Cache the response before returning
      (source) => {
        return source.pipe(
          catchError((error) => {
            return throwError(() => error);
          }),
          (obs) => {
            obs.subscribe((data) => {
              this.cachedJobs = data; // Store in cache
            });
            return obs;
          }
        );
      }
    );
  }

  // Fetch job by ID, return cached data if available
  getJobById(jobId: number): Observable<any> {
    if (this.cachedJobDetails[jobId]) {
      console.log(`Returning cached job details for jobId: ${jobId}`);
      return of(this.cachedJobDetails[jobId]); // Return cached job
    }

    const url = `${this.apiUrl}/${jobId}/`;
    console.log('Fetching job details from:', url);
    return this.http.get<any>(url, { headers: this.getAuthHeaders() }).pipe(
      catchError(this.handleError),
      // Cache the response before returning
      (source) => {
        return source.pipe(
          catchError((error) => {
            return throwError(() => error);
          }),
          (obs) => {
            obs.subscribe((data) => {
              this.cachedJobDetails[jobId] = data; // Store in cache
            });
            return obs;
          }
        );
      }
    );
  }

  // Optional: Method to clear cache (e.g., on logout or refresh)
  clearCache(): void {
    this.cachedJobs = null;
    this.cachedJobDetails = {};
    console.log('Cache cleared');
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred';
    if (error.status === 401) {
      errorMessage = 'Unauthorized: Please log in or provide a valid token';
    } else if (error.status === 404) {
      errorMessage = `Job not found: ${error.url}`;
    } else if (error.status === 0) {
      errorMessage = `Network error: Unable to reach server at ${error.url}. Ensure backend is running.`;
    } else {
      errorMessage = `Error ${error.status}: ${error.message}`;
    }
    console.error('API error:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }
}