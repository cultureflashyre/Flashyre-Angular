import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http'; // Import HttpHeaders
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AtsWorkflowService {
  private apiUrl = environment.apiUrl + 'api/ats/pipeline/';

  constructor(private http: HttpClient) {}

  // Helper to get Auth Headers
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('jwtToken');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // Get all candidates for a specific Job
  getPipelineForJob(jobId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}?job_id=${jobId}`, { headers: this.getAuthHeaders() });
  }

  // Add a candidate to this job (Move from pool to Sourced)
  addCandidateToJob(payload: any): Observable<any> {
    // FIX: Attach headers here so backend knows who the user is
    return this.http.post(this.apiUrl, payload, { headers: this.getAuthHeaders() });
  }

  // Move candidate to new stage
  updateStage(applicationId: number, stage: string, metadata: any = {}): Observable<any> {
    return this.http.patch(
      `${this.apiUrl}${applicationId}/update_stage/`, 
      {
        stage: stage,
        ...metadata
      },
      { headers: this.getAuthHeaders() }
    );
  }
}