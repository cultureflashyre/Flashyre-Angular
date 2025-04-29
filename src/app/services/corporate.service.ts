import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class CorporateService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient, private router: Router) {}

  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}login-corporate/`, { email, password }).pipe(
      catchError((err) => {
        console.error('Corporate login error:', err);
        return throwError(err); // Propagate error to component
      })
    );
  }

  logout(): void {
    localStorage.removeItem('jwtToken');
    this.router.navigate(['/login-corporate']);
  }

  postJob(jobData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}jobs/`, jobData);
  }

  getPostedJobs(): Observable<any> {
    return this.http.get(`${this.apiUrl}jobs/`);
  }

  getJWTToken(): string | null {
    return localStorage.getItem('jwtToken');
  }

  isLoggedIn(): boolean {
    const token = this.getJWTToken();
    return !!token;
  }
}