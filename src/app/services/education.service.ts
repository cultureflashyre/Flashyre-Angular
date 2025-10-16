import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, finalize, retry, tap } from 'rxjs/operators';
import { NgxSpinnerService } from 'ngx-spinner';
import { environment } from '../../environments/environment';
import { UserProfileService } from './user-profile.service';

@Injectable({
  providedIn: 'root'
})
export class EducationService {
  private apiUrl = `${environment.apiUrl}api/education/sync/`;
  private referenceDataUrl = `${environment.apiUrl}api/reference-data/`;

  constructor(
    private http: HttpClient,
    private spinner: NgxSpinnerService,
    private userProfileService: UserProfileService
  ) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('jwtToken');
    return new HttpHeaders({
      'Authorization': `Bearer ${token || ''}`
    });
  }

  saveEducation(educationData: any[]): Observable<any> {
    this.spinner.show();
    
    return this.http.post(this.apiUrl, educationData, { headers: this.getAuthHeaders() }).pipe(
      retry(1),
      tap(() => {
        this.userProfileService.refreshUserProfileValues().subscribe({
          next: () => console.log('User profile refreshed after saving education'),
          error: err => console.error('Error refreshing user profile', err),
        });
      }),
      catchError(error => {
        console.error('Full backend error:', error);
        const errorDetail = error.error;
        let errorMessage = 'Failed to save education data. Please check your entries.';
        
        if (typeof errorDetail === 'object' && errorDetail !== null) {
            const errorArrays = Object.values(errorDetail) as string[][];
            
            // --- FIX APPLIED HERE ---
            // Replaced .flat() with the universally compatible .reduce() method.
            // This flattens the array of arrays into a single array of strings.
            const flattenedErrors = errorArrays.reduce((acc, val) => acc.concat(val), []);

            errorMessage = flattenedErrors.join(' ');
        } else if (typeof errorDetail === 'string') {
            errorMessage = errorDetail;
        }
        
        return throwError(() => new Error(errorMessage));
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