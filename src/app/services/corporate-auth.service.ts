import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';

interface CorporateSignupData {
  first_name: string;
  last_name: string;
  company_name: string;
  phone_number: string;
  email: string;
  password: string;
}

interface AuthResponse {
  access: string;
  refresh: string;
  message?: string;
  data?: any;
  user_id?: number | string;
}

@Injectable({
  providedIn: 'root'
})

export class CorporateAuthService {
  
  
  private apiUrl = environment.apiUrl; // Adjust the API URL as needed

  constructor(
    private http: HttpClient,
  private router: Router
) {}

loginCorporate(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}api/auth/login/`, { email, password }).pipe(
      tap((response: AuthResponse) => {
        if (response.access && response.refresh) {
          this.saveTokens(response.access, response.refresh);
        }
      }),
      catchError(this.handleError)
    );
  }

  signupCorporate(data: CorporateSignupData): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}api/auth/signup/`, data).pipe(
      tap((response: AuthResponse) => {
        if (response.access && response.refresh) {
          this.saveTokens(response.access, response.refresh);
        }
      }),
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred';
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Client-side error: ${error.error.message}`;
    } else {
      // Server-side error
      if (error.status === 401) {
        errorMessage = error.error?.error || 'Invalid credentials';
      } else if (error.status === 400) {
        errorMessage = error.error?.error || 'Invalid request data';
      } else {
        errorMessage = error.error?.error || `Server error: ${error.status}`;
      }
    }
    return throwError(() => new Error(errorMessage));
  }

  saveTokens(access: string, refresh: string): void {
    localStorage.setItem('jwtToken', access);
    localStorage.setItem('refreshToken', refresh);
  }

  getJWTToken(): string | null {
    return localStorage.getItem('jwtToken');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  refreshToken(): Observable<any> {
    const refresh = this.getRefreshToken();
    if (!refresh) {
      return throwError(() => new Error('No refresh token available'));
    }
    return this.http.post<any>(`${this.apiUrl}api/token/refresh/`, { refresh });
  }

  isLoggedIn(): boolean {
    return !!this.getJWTToken();
  }

  logout(): void {
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userProfile');
    localStorage.removeItem('user_id');
    localStorage.removeItem('userType');
    // Optionally clear other stored corporate user data

    this.router.navigate(['/login-corporate']);
  }

  clearTokens(): void {
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userProfile');
    localStorage.removeItem('user_id');
    localStorage.removeItem('userType');
  }
  

}