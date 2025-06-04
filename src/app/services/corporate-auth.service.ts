import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

interface CorporateSignupData {
  first_name: string;
  last_name: string;
  company_name: string;
  phone_number: string;
  email: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class CorporateAuthService {
  private apiUrl = 'http://localhost:8000/api';

  constructor(private http: HttpClient) {}

  signupCorporate(data: CorporateSignupData): Observable<any> {
    const url = `${this.apiUrl}/signup-corporate/`;
    console.log('Making POST request to:', url);
    console.log('Request data:', data);
    return this.http.post(url, data)
      .pipe(catchError(this.handleError));
  }

  loginCorporate(email: string, password: string): Observable<any> {
    const url = `${this.apiUrl}/login-corporate/`;
    console.log('Making POST request to:', url);
    return this.http.post(url, { email, password })
      .pipe(catchError(this.handleError));
  }

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
}
