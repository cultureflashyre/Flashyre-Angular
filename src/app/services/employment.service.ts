import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { finalize, switchMap, tap, catchError } from 'rxjs/operators';
import { NgxSpinnerService } from 'ngx-spinner'; // Import NgxSpinnerService
import { environment } from '../../environments/environment';
import { UserProfileService } from './user-profile.service';

@Injectable({
  providedIn: 'root',
})
export class EmploymentService {
  private apiUrl = environment.apiUrl+'api/employment/';

  constructor(
    private http: HttpClient, 
    private spinner: NgxSpinnerService,
    private userProfileService: UserProfileService
) {}

saveEmployment(positions: any[]): Observable<any> {
  this.spinner.show();

  const requests = positions.map(position =>
    this.http.post(this.apiUrl, {
      job_title: position.jobTitle,
      company_name: position.companyName,
      start_date: position.startDate,
      end_date: position.endDate || null,
      job_details: position.jobDetails,
    })
  );

  return forkJoin(requests).pipe(
    tap(() => {
      // After all saves succeed, refresh profile asynchronously
      this.userProfileService.refreshUserProfileValues().subscribe({
        next: () => console.log('User profile refreshed after employment save'),
        error: err => console.error('Error refreshing user profile', err),
      });
    }),
    finalize(() => this.spinner.hide()),
    catchError(error => {
      this.spinner.hide();
      throw error;
    })
  );
}

}