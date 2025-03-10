import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class EmploymentService {
  private apiUrl = 'http://localhost:8000/api/employment/';

  constructor(private http: HttpClient) {}

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
    return new Observable((observer) => {
      let completed = 0;
      requests.forEach((request, index) => {
        request.subscribe(
          (response) => {
            completed++;
            if (completed === requests.length) {
              observer.next(response);
              observer.complete();
            }
          },
          (error) => observer.error(error)
        );
      });
    });
  }
}