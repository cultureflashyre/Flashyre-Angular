import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AtsWorkflowService {
  private apiUrl = environment.apiUrl + 'api/ats/pipeline/';

  constructor(private http: HttpClient) {}

  // Get all candidates for a specific Job
  getPipelineForJob(jobId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}?job_id=${jobId}`);
  }

  // Add a candidate to this job (Move from pool to Sourced)
  addCandidateToJob(payload: any): Observable<any> {
    return this.http.post(this.apiUrl, payload);
  }

  // Move candidate to new stage
  updateStage(applicationId: number, stage: string, metadata: any = {}): Observable<any> {
    return this.http.patch(`${this.apiUrl}${applicationId}/update_stage/`, {
      stage: stage,
      ...metadata
    });
  }
}