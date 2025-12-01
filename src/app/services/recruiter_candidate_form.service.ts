import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RecruiterCandidateFormService {
  // Update this URL based on your Django local server (usually port 8000)
  private apiUrl = 'http://localhost:8000/api/candidates/';

  constructor(private http: HttpClient) { }

  // POST: Add a new candidate
  addCandidate(candidateData: any): Observable<any> {
    return this.http.post(this.apiUrl, candidateData);
  }

  // GET: Retrieve all candidates
  getCandidates(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }
}