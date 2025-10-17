import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize, tap, catchError } from 'rxjs/operators';
import { NgxSpinnerService } from 'ngx-spinner';
import { environment } from '../../environments/environment';
import { UserProfileService } from './user-profile.service';

@Injectable({
  providedIn: 'root',
})
export class EmploymentService {
  private apiUrl = environment.apiUrl + 'api/employment/sync/';

  constructor(
    private http: HttpClient,
    private spinner: NgxSpinnerService,
    private userProfileService: UserProfileService
  ) {}

  // The entire logic is contained within this single method.
  saveEmployment(positions: any[]): Observable<any> {
    this.spinner.show();

    // 'payload' is defined here, inside the saveEmployment method.
    const payload = positions.map(position => ({
      id: position.id,
      job_title: position.jobTitle,
      company_name: position.companyName,
      start_date: position.startDate || null, // Ensures empty strings become null
      end_date: position.endDate || null,     // Ensures empty strings become null
      job_details: position.jobDetails,
    }));

    // The 'return' statement is also inside the method, so it can access 'payload'.
    return this.http.post(this.apiUrl, payload).pipe(
      tap(() => {
        // After a successful sync, refresh the user profile to get the latest data.
        this.userProfileService.refreshUserProfileValues().subscribe({
          next: () => console.log('User profile refreshed after employment sync'),
          error: err => console.error('Error refreshing user profile', err),
        });
      }),
      finalize(() => this.spinner.hide()),
      catchError(error => {
        this.spinner.hide();
        // Rethrow the error to be caught by the component.
        throw error;
      })
    );
  } // The saveEmployment method ends here.
}