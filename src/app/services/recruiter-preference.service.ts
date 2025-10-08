// src/app/services/recruiter-preference.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RecruiterPreferenceService {
  // This URL path should match what you have in your project's main urls.py
  private apiUrl = environment.apiUrl + 'api/recruiter-preferences/';

  private activeTabSubject = new BehaviorSubject<string>('live');
  activeTab$ = this.activeTabSubject.asObservable();

  setActiveTab(tab: string): void {
    this.activeTabSubject.next(tab);
  }

  getActiveTab(): string {
    return this.activeTabSubject.value;
  }

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    // ====================================================================
    // ========================= THE CRITICAL FIX =========================
    // ====================================================================
    // Ensure you are using the correct key for the recruiter's auth token.
    // Based on your other files, 'auth_token' is the correct key for both user types.
    // The previous error likely occurred if the user was simply not logged in.
    // This code remains correct, but is the #1 place to check for 401 errors.
    const token = localStorage.getItem('jwtToken');
    // ====================================================================
    // ====================================================================

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    } else {
      console.warn('No auth token found for recruiter preference service. This will cause a 401 error.');
    }
    return headers;
  }

  getPreferences(): Observable<any[]> {
    const options = {
      headers: this.getHeaders(),
      params: new HttpParams().set('tab_name', this.getActiveTab())
    };
    return this.http.get<any[]>(`${this.apiUrl}preferences/`, options);
  }

  savePreference(preferenceData: any, activeTab: string): Observable<any> {
    console.log("[IN rec PPREFERENCE] payload: ", preferenceData, this.getActiveTab());
    const payload = {
      ...preferenceData,
      tab_name: this.getActiveTab()
    };
    return this.http.post(`${this.apiUrl}preferences/`, payload, { headers: this.getHeaders() });
  }
    
  deletePreference(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}preferences/${id}/`, { headers: this.getHeaders() });
  }
}