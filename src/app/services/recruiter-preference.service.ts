// src/app/services/recruiter-preference.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RecruiterPreferenceService {
  // This API URL is correct because the backend uses one endpoint for all authenticated users
  private apiUrl = environment.apiUrl + 'api/candidate/preferences/';

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    // The token is for the currently logged-in user (who is a recruiter in this context)
    const token = localStorage.getItem('auth_token');

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    } else {
      console.warn('No auth token found for recruiter preference service');
    }
    return headers;
  }

  getPreferences(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl, { headers: this.getHeaders() });
  }

  savePreference(preferenceData: any): Observable<any> {
    return this.http.post(this.apiUrl, preferenceData, { headers: this.getHeaders() });
  }
    
  deletePreference(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}${id}/`, { headers: this.getHeaders() });
  }
}