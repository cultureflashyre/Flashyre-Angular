import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, finalize, retry } from 'rxjs/operators';
import { NgxSpinnerService } from 'ngx-spinner';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EducationService {
  private apiUrl = `${environment.apiUrl}api/education/`;
  private referenceDataUrl = `${environment.apiUrl}api/reference-data/`;

  constructor(
    private http: HttpClient,
    private spinner: NgxSpinnerService
  ) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('jwtToken');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  addEducation(educationData: any): Observable<any> {
  this.spinner.show();
  return this.http.post(this.apiUrl, educationData, { headers: this.getAuthHeaders() }).pipe(
    retry(1),
    catchError(error => {
      console.error('Full backend error:', error); // Log the entire error object
      const errorMessage = error.error || 'Failed to save education';
      return throwError(() => new Error(JSON.stringify(errorMessage)));
    }),
    finalize(() => this.spinner.hide())
  );
}

  getReferenceData(): Observable<any> {
    this.spinner.show();
    const token = localStorage.getItem('jwtToken');
    if (!token) {
      this.spinner.hide();
      return throwError(() => new Error('Authentication required. Please log in.'));
    }

    return this.http.get(this.referenceDataUrl, { headers: this.getAuthHeaders() }).pipe(
      retry(1),
      catchError(error => {
        let errorMessage = 'Failed to fetch reference data';
        if (error.status === 401) {
          errorMessage = 'Unauthorized: Please log in again.';
        } else if (error.status === 404) {
          errorMessage = 'API endpoint not found.';
        } else if (error.status === 0) {
          errorMessage = 'Network error: Backend server unavailable.';
        } else if (error.error?.detail) {
          errorMessage = error.error.detail;
        }
        return throwError(() => new Error(errorMessage));
      }),
      finalize(() => this.spinner.hide())
    );
  }
}