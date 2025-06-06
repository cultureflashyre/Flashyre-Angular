import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { environment } from '../../environments/environment';

import { tap } from 'rxjs/operators';


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

  constructor(private http: HttpClient) {}


loginCorporate(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}login-corporate/`, { email, password }).pipe(
      tap((response: AuthResponse) => {
        if (response.access && response.refresh) {
          this.saveTokens(response.access, response.refresh);
        }
      }),
      catchError(this.handleError)
    );
  }

  signupCorporate(data: CorporateSignupData): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}signup-corporate/`, data).pipe(
      tap((response: AuthResponse) => {
        if (response.access && response.refresh) {
          this.saveTokens(response.access, response.refresh);
        }
      }),
      catchError(this.handleError)
    );


  checkPhone(phone: string): Observable<any> {
    const url = `${this.apiUrl}/check-phone/?phone=${phone}`;
    console.log('Checking phone at:', url);
    return this.http.get(url)
      .pipe(catchError(this.handleError));
  }

  checkEmail(email: string): Observable<any> {
    const url = `${this.apiUrl}/check-email/?email=${email}`;
    console.log('Checking email at:', url);
    return this.http.get(url)
      .pipe(catchError(this.handleError));

  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Client-side error: ${error.error.message}`;
    } else {
      if (error.status === 401) {
        errorMessage = error.error?.error || 'Invalid credentials';
      } else if (error.status === 400) {
        errorMessage = error.error?.error || 'Invalid request data';
      } else if (error.status === 404) {
        errorMessage = 'Service not found. Please check the server configuration.';
      } else {
        errorMessage = error.error?.error || `Server error: ${error.status}`;
      }
    }
    console.error('HTTP error:', error);
    return throwError(() => error);
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
    // Optionally clear other stored corporate user data
  }
  

}

