import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class EducationService {
  private apiUrl = 'http://localhost:8000/api/education/'; // Django backend URL

  constructor(private http: HttpClient) {}

  addEducation(educationData: any): Observable<any> {
    return this.http.post(this.apiUrl, educationData, { withCredentials: true });
  }
}