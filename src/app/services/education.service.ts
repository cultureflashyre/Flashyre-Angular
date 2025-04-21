import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { NgxSpinnerService } from 'ngx-spinner';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EducationService {
  private apiUrl = environment.apiUrl + 'api/education/';

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
}