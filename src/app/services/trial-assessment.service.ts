import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TrialAssessmentService {
  private baseUrl = 'http://localhost:8000/trial_assessments/'; // Adjust this to match your backend URL

  constructor(private http: HttpClient) { }

  getAssessmentDetails(assessmentId: number): Observable<any> {
    const token = localStorage.getItem('token'); // Retrieve JWT token from localStorage
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.get(`${this.baseUrl}assessment-detail/?assessment_id=${assessmentId}`, { headers });
  }

  submitAssessment(data: any): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.post(`${this.baseUrl}submit-assessment/`, data, { headers });
  }
}