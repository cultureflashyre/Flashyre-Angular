import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AIProcessingService {
  private apiUrl = 'http://localhost:8000/api/process-job-description/';
  private jobPostUrl = 'http://localhost:8000/api/save-job-post/'; // Adjust if different

  constructor(private http: HttpClient) {}

  processJobDescription(fileUrl: string, token: string): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    return this.http.post(this.apiUrl, { file_url: fileUrl }, { headers });
  }

  saveJobPost(jobData: any, token: string): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    return this.http.post(this.jobPostUrl, jobData, { headers });
  }
}