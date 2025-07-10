import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ResetService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  forgotPassword(email: string): Observable<any> {
    console.log('Calling forgotPassword with email:', email);
    return this.http.post(`${this.baseUrl}api/login-forgot-password/`, { email }).pipe(
      catchError((error) => {
        console.error('forgotPassword API error:', {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          errorDetails: error.error
        });
        return throwError(() => ({
          status: error.status,
          message: error.error?.error || 'Failed to process forgot password request'
        }));
      })
    );
  }

  verifyOTP(email: string, otp: string): Observable<any> {
    console.log('Calling verifyOTP with email:', email, 'and OTP:', otp);
    return this.http.post(`${this.baseUrl}api/verify-otp/`, { email, otp }).pipe(
      catchError((error) => {
        console.error('verifyOTP API error:', {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          errorDetails: error.error
        });
        return throwError(() => ({
          status: error.status,
          message: error.error?.error || 'Failed to verify OTP'
        }));
      })
    );
  }

  resetPassword(email: string, otp: string, password: string): Observable<any> {
    console.log('Calling resetPassword with email:', email, 'OTP:', otp);
    return this.http.post(`${this.baseUrl}api/login-reset-password/`, { email, otp, password }).pipe(
      catchError((error) => {
        console.error('resetPassword API error:', {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          errorDetails: error.error
        });
        return throwError(() => ({
          status: error.status,
          message: error.error?.error || 'Failed to reset password'
        }));
      })
    );
  }
}