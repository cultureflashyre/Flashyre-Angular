import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { NgxSpinnerService } from 'ngx-spinner'; // Import NgxSpinnerService
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class EmploymentService {
  private apiUrl = environment.apiUrl+'api/employment/';

  constructor(private http: HttpClient, private spinner: NgxSpinnerService) {}

  saveEmployment(positions: any[]): Observable<any> {
    const requests = positions.map((position) =>
      this.http.post(this.apiUrl, {
        job_title: position.jobTitle,
        company_name: position.companyName,
        start_date: position.startDate,
        end_date: position.endDate || null,
        job_details: position.jobDetails,
      })
    );

    // Show spinner before making requests
    this.spinner.show();



    return new Observable((observer) => {
      let completed = 0;
      requests.forEach((request, index) => {
        request.subscribe(
          (response) => {
            completed++;
            if (completed === requests.length) {
              this.spinner.hide();

              observer.next(response);
              observer.complete();
            }
          },
          (error) => {
            // Hide spinner on error
            this.spinner.hide();
            observer.error(error);
          }
        );
      });
    });
  }
}