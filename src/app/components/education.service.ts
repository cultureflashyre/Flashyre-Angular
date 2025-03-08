import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root', // Makes it available app-wide
})
export class EducationService {
  private apiUrl = 'http://localhost:8000/api/education/';

  constructor(private http: HttpClient) {}

  addEducation(educationData: any): Observable<any> {
    return this.http.post(this.apiUrl, educationData);
  }
}