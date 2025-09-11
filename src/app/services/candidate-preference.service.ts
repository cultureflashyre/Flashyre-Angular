// src/app/services/candidate-preference.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CandidatePreferenceService {
  private apiUrl = '/api/candidate/preferences/'; // Adjust if your API URL is different

  constructor(private http: HttpClient) { }

  getPreferences(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  savePreference(preferenceData: any): Observable<any> {
    return this.http.post(this.apiUrl, preferenceData);
  }

  updatePreference(id: number, preferenceData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}${id}/`, preferenceData);
  }
}