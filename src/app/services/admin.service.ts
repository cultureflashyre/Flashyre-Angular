import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';


// Define an interface for the Candidate object for type safety
export interface Candidate {
  candidate_id: number;
  batch_id: number;
  full_name: string;
  email: string;
  phone: string;
  total_experience: string;
  relevant_experience: string;
  location: string;
  skills: any;
  education: string;
  certification: string;
  cv_file_path: string;
  has_account: 'Yes' | 'No' | null;
  account_creation_email_sent: 'Yes' | 'No';
  email_sent_date: string | null;
  created_at: string;
  updated_at: string;
  // Add a property for UI state management (checkbox)
  selected?: boolean;
}


@Injectable({
  providedIn: 'root'
})
export class AdminService {
  // The base URL for your Django API.
  // Using a relative path is best practice for production builds,
  // relying on a proxy configuration for local development.
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  /**
   * Uploads an array of CV files to the backend.
   * @param files The array of files to upload.
   * @returns An Observable with the backend response.
   */
  uploadCVs(files: File[]): Observable<any> {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file, file.name);
    });
    return this.http.post(`${this.apiUrl}/candidates/upload-cvs/`, formData);
  }

  /**
   * Fetches a list of draft candidates.
   * @param filterDate Optional date string (YYYY-MM-DD) to filter candidates by.
   * @returns An Observable array of Candidate objects.
   */
  getCandidates(filterDate?: string): Observable<Candidate[]> {
    let params = new HttpParams();
    if (filterDate) {
      params = params.set('batch_date', filterDate);
    }
    return this.http.get<Candidate[]>(`${this.apiUrl}/candidates/draft/`, { params });
  }

  /**
   * Deletes a candidate from the draft list.
   * @param candidateId The ID of the candidate to delete.
   * @returns An Observable with the backend response.
   */
  deleteCandidate(candidateId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/candidates/draft/${candidateId}/`);
  }

  /**
   * Sends registration invitations to a list of candidates.
   * @param candidateIds An array of candidate IDs to send emails to.
   * @returns An Observable with the backend response.
   */
  sendRegistrationInvites(candidateIds: number[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/candidates/send-invites/`, { candidate_ids: candidateIds });
  }
}