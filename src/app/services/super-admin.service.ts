import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SuperAdminService {
  private apiUrl = environment.apiUrl + 'api/super-admin/';

  constructor(private http: HttpClient) {}

  getAnalytics(filters: any): Observable<any> {
    let params = new HttpParams();
    if (filters.start_date) params = params.set('start_date', filters.start_date);
    if (filters.end_date) params = params.set('end_date', filters.end_date);
    if (filters.recruiter_id) params = params.set('recruiter_id', filters.recruiter_id);
    if (filters.client_name) params = params.set('client_name', filters.client_name);
    if (filters.job_id) params = params.set('job_id', filters.job_id);

    // New Filter
    if (filters.source) params = params.set('source', filters.source);

    return this.http.get(this.apiUrl + 'analytics/', { params });
  }

   // --- NEW METHOD FOR THE TABLE DATA ---
  getPerformanceReport(filters: any): Observable<any[]> {
    let params = this.buildParams(filters);
    return this.http.get<any[]>(this.apiUrl + 'analytics/performance-report/', { params });
  }

  // Helper to avoid code duplication
  private buildParams(filters: any): HttpParams {
    let params = new HttpParams();
    if (filters.start_date) params = params.set('start_date', filters.start_date);
    if (filters.end_date) params = params.set('end_date', filters.end_date);
    if (filters.recruiter_id) params = params.set('recruiter_id', filters.recruiter_id);
    if (filters.job_id) params = params.set('job_id', filters.job_id);
    // Note: client_name filter was removed as it's not a direct filter in the new logic
    return params;
  }
}