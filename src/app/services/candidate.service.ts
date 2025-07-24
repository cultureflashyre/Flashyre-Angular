import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { CanActivate, Router } from '@angular/router';
import { tap } from 'rxjs/operators'; // Import tap for side effects

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient, private router: Router) {}

  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}api/auth/login/`, { email, password }).pipe(
      tap(response => {
        if (response.token) {
          localStorage.setItem('jwtToken', response.token); // Store token
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
    return this.http.post(`${this.apiUrl}api/apply/`, { job_id: jobId });
  }

  getAppliedJobs(): Observable<any> {
    return this.http.get(`${this.apiUrl}api/applied-jobs/`);
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