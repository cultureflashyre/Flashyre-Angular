// src/app/services/candidate-preference.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CandidatePreferenceService {
  private apiUrl = environment.apiUrl+'api/candidate/preferences/';

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    const token = localStorage.getItem('auth_token'); // Adjust based on your auth storage
  
    console.log('In getHeaders(), the token from localStorage is:', token);

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    } else {
      console.warn('No auth token found');
    }
    return headers;
  }

  // UPDATE THIS LINE to expect an array of preferences
  getPreferences(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl, { headers: this.getHeaders() });
  }

  savePreference(preferenceData: any): Observable<any> {
    return this.http.post(this.apiUrl, preferenceData, { headers: this.getHeaders()});
  }
  
  updatePreference(id: number, preferenceData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}${id}/`, preferenceData, { headers: this.getHeaders()});
  }

  // ADD THIS NEW FUNCTION for deleting a preference
  deletePreference(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}${id}/`, { headers: this.getHeaders() });
  }
}