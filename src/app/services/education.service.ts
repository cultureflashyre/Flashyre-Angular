import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';
import { NgxSpinnerService } from 'ngx-spinner';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EducationService {
  private apiUrl = environment.apiUrl + 'api/education/';
  private referenceDataUrl = environment.apiUrl + 'api/reference-data/';

  constructor(
    private http: HttpClient,
    private spinner: NgxSpinnerService
  ) {}

  addEducation(educationData: any): Observable<any> {
    this.spinner.show();
    return this.http.post(this.apiUrl, educationData, { withCredentials: true }).pipe(
      catchError((error) => {
        console.error('Error saving education:', error);
        return throwError(() => new Error(error.error?.detail || 'Failed to save education'));
      }),
      finalize(() => this.spinner.hide())
    );
  }

  getReferenceData(): Observable<any> {
    this.spinner.show();
    const token = localStorage.getItem('jwtToken'); // Changed from 'access_token' to 'jwtToken'
    console.log('JWT Token:', token ? 'Token present' : 'No token found');
    console.log('Request URL:', this.referenceDataUrl);
    if (!token) {
      console.error('No JWT token found in localStorage');
      this.spinner.hide();
      return throwError(() => new Error('Authentication required. Please log in.'));
    }
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.get(this.referenceDataUrl, { headers }).pipe(
      tap(response => console.log('API Response:', response)),
      catchError((error) => {
        console.error('Error fetching reference data. Status:', error.status, 'Error:', error);
        let errorMessage = 'Unknown error occurred while fetching reference data';
        if (error.status === 401) {
          errorMessage = 'Unauthorized: Invalid or expired token. Please log in again.';
        } else if (error.status === 404) {
          errorMessage = 'API endpoint not found. Check backend configuration.';
        } else if (error.status === 0) {
          errorMessage = 'Network error: Is the backend server running at http://localhost:8000/?';
        } else if (error.error?.detail) {
          errorMessage = error.error.detail;
        } else if (error.message) {
          errorMessage = error.message;
        }
        return throwError(() => new Error(errorMessage));
      }),
      finalize(() => this.spinner.hide())
    );
  }
}