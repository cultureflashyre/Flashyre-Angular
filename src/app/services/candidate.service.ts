import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { CanActivate, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient, private router: Router) {}

  login(email: string, password: string): Observable<any> {
    console.log(`Calling login with URL: ${this.apiUrl}login-candidate/`);
    return this.http.post(`${this.apiUrl}login-candidate/`, { email, password })
      .pipe(catchError(this.handleError));
  }

  logout(): void {
    localStorage.removeItem('jwtToken');
    this.router.navigate(['/login-candidate']);
  }

  applyForJob(jobId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}api/apply/`, { job_id: jobId })
      .pipe(catchError(this.handleError));
  }

  getAppliedJobs(): Observable<any> {
    return this.http.get(`${this.apiUrl}api/applied-jobs/`)
      .pipe(catchError(this.handleError));
  }

  getJWTToken(): string | null {
    return localStorage.getItem('jwtToken');
  }

  isLoggedIn(): boolean {
    const token = this.getJWTToken();
    return !!token;
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An error occurred';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Client-side error: ${error.error.message}`;
    } else {
      errorMessage = error.error?.error || `Server error: ${error.status}`;
    }
    console.error('Login error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}