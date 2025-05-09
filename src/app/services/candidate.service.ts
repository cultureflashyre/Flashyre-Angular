import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
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
    return this.http.post(`${this.apiUrl}login-candidate/`, { email, password }).pipe(
      tap(response => {
        if (response.token) {
          localStorage.setItem('jwtToken', response.token); // Store token
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem('jwtToken');
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

  isLoggedIn(): boolean {
    const token = this.getJWTToken();
    return !!token;
  }
}