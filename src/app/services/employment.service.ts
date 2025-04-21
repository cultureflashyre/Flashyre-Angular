import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, throwError } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { NgxSpinnerService } from 'ngx-spinner';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class EmploymentService {
  private apiUrl = environment.apiUrl + 'api/employment/';

  constructor(private http: HttpClient, private spinner: NgxSpinnerService) {}

  saveEmployment(positions: any[]): Observable<any> {
    if (!positions || positions.length === 0) {
      return throwError(() => new Error('No valid employment data to save'));
    }

    this.spinner.show();
    const requests = positions.map((position) =>
      this.http.post(this.apiUrl, {
        job_title: position.jobTitle,
        company_name: position.companyName,
        start_date: position.startDate,
        end_date: position.endDate || null,
        job_details: position.jobDetails,
      }).pipe(
        catchError((error) => {
          console.error('Error saving employment:', error);
          return throwError(() => new Error(error.error?.detail || 'Failed to save employment'));
        })
      )
    );

    return forkJoin(requests).pipe(
      finalize(() => this.spinner.hide())
    );
  }
}