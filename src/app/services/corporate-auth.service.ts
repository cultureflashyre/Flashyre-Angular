import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
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
  private apiUrl = environment.apiUrl; // Adjust the API URL as needed

  constructor(private http: HttpClient) {}

  signupCorporate(data: CorporateSignupData): Observable<any> {
    return this.http.post(`${this.apiUrl}signup-corporate/`, data)
      .pipe(catchError(this.handleError));
  }

  loginCorporate(email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}login-corporate/`, { email, password })
      .pipe(catchError(this.handleError));
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
}