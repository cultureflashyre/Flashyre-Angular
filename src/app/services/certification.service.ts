import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { NgxSpinnerService } from 'ngx-spinner';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CertificationService {
  private baseUrl = environment.apiUrl + 'api/certifications/';

  constructor(
    private http: HttpClient,
    private spinner: NgxSpinnerService
  ) {}

  saveCertification(cert: any): Observable<any> {
    this.spinner.show();
    return this.http.post(this.baseUrl, cert).pipe(
      catchError((error) => {
        console.error('Error saving certification:', error);
        return throwError(() => new Error(error.error?.detail || 'Failed to save certification'));
      }),
      finalize(() => this.spinner.hide())
    );
  }
}