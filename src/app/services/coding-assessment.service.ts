import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CodingAssessmentService {
  private apiUrl = 'http://127.0.0.1:8000/api';

  constructor(private http: HttpClient) {}

  getProblems(): Observable<any> {
    return this.http.get(`${this.apiUrl}/problems/`);
  }

  getProblem(problemId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/problems/${problemId}`);
  }

  runCode(data: { problem_id: number, source_code: string, language_id: number }): Observable<any> {
    return this.http.post(`${this.apiUrl}/run`, data);
  }

  submitCode(data: { problem_id: number, source_code: string, language_id: number }): Observable<any> {
    return this.http.post(`${this.apiUrl}/submissions`, data);
  }
}