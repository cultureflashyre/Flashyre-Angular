import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Job {
  job_id: number;
  title: string;
  company_name: string;
  location: string;
  job_type: string;
  description: string;
  requirements: string;
  experience_required: number | null;
  logo: string;
  salary: string | null;
  url: string | null;
  source: string;
  tag: string | null;
  contract_time: string | null;
  contract_type: string | null;
  created_at: string;
  updated_at: string;
}

@Injectable({
  providedIn: 'root',
})
export class JobService {
  private apiUrl = 'http://localhost:8000/api/jobs'; // Replace with your Django API base URL

  constructor(private http: HttpClient) {}

  getJobs(): Observable<Job[]> {
    return this.http.get<Job[]>(`${this.apiUrl}/`);
  }

  getJobById(jobId: number): Observable<Job> {
    return this.http.get<Job>(`${this.apiUrl}/${jobId}/`);
  }
}