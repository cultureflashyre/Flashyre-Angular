import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8000/';

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}login-candidate/`, 
      { email, password }, 
      { withCredentials: true }
    );
  }

  applyForJob(jobId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}api/apply/`, 
      { job_id: jobId }, 
      { withCredentials: true }
    );
  }

  getAppliedJobs(): Observable<any> {
    return this.http.get(`${this.apiUrl}api/applied-jobs/`, 
      { withCredentials: true }
    );
  }
}