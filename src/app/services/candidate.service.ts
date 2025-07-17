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
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient, private router: Router) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.getJWTToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : ''
    });
  }

  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}login-candidate/`, { email, password }).pipe(
      tap(response => {
        if (response.token) {
          localStorage.setItem('jwtToken', response.token);
          localStorage.setItem('userProfile', JSON.stringify({ user_id: response.user_id, ...response.user }));
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userProfile');
    
    this.router.navigate(['/login-candidate']);
  }

  applyForJob(jobId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}api/apply/`, { job_id: jobId }, { headers: this.getAuthHeaders() }).pipe(
      catchError(error => {
        console.error('Error in applyForJob:', error);
        return throwError(() => new Error('Failed to apply for job'));
      })
    );
  }

  getAppliedJobs(): Observable<any> {
    return this.http.get(`${this.apiUrl}api/applied-jobs/`, { headers: this.getAuthHeaders() }).pipe(
      catchError(error => {
        console.error('Error in getAppliedJobs:', error);
        return throwError(() => new Error('Failed to fetch applied jobs'));
      })
    );
  }

  dislikeJob(userId: string, jobId: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}api/job_disliked/dislike/`,
      { user_id: userId, job_id: jobId },
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(error => {
        console.error('Error in dislikeJob:', error);
        return throwError(() => new Error('Failed to dislike job'));
      })
    );
  }

  removeDislikedJob(userId: string, jobId: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}api/job_disliked/remove-dislike/`,
      { user_id: userId, job_id: jobId },
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(error => {
        console.error('Error in removeDislikedJob:', error);
        return throwError(() => new Error('Failed to remove disliked job'));
      })
    );
  }

  getDislikedJobs(userId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}api/job_disliked/disliked/${userId}/`, { headers: this.getAuthHeaders() }).pipe(
      catchError(error => {
        console.error('Error in getDislikedJobs:', error);
        return throwError(() => new Error('Failed to fetch disliked jobs'));
      })
    );
  }

  saveJob(userId: string, jobId: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}api/job_saved/save/`,
      { user_id: userId, job_id: jobId },
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(error => {
        console.error('Error in saveJob:', error);
        return throwError(() => new Error('Failed to save job'));
      })
    );
  }

  getJWTToken(): string | null {
    return localStorage.getItem('jwtToken');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  saveTokens(access: string, refresh: string) {
    localStorage.setItem('jwtToken', access);
    localStorage.setItem('refreshToken', refresh);
  }

  refreshToken() {
    const refresh = this.getRefreshToken();
    if (!refresh) {
      return throwError(() => new Error('No refresh token available'));
    }
    return this.http.post<any>(`${this.apiUrl}api/token/refresh/`, { refresh });
  }

  isLoggedIn(): boolean {
    const token = this.getJWTToken();
    return !!token;
  }
}