import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AdbRequirementService {
  private apiUrl = environment.apiUrl + 'api/job-requirements/';
  private usersUrl = environment.apiUrl + 'api/super-admin/list/';
  private parseJdUrl = environment.apiUrl + 'api/parse-job-description/';
  private locationApiUrl = 'https://nominatim.openstreetmap.org/search?format=json&q=';

  constructor(private http: HttpClient) { }

  createRequirement(data: FormData): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }


  // UPDATE: Add timestamp cache-buster and ensure the URL matches Django correctly
  checkJDStatus(stagingId: number): Observable<any> {
    const timestamp = new Date().getTime();
    // We use environment.apiUrl directly here to ensure the path maps perfectly to 'api/jd-status/'
    return this.http.get(`${environment.apiUrl}api/jd-status/${stagingId}/?t=${timestamp}`);
  }

  // Add this method to fetch the list
  getRequirements(page: number = 1): Observable<any> {
    return this.http.get(`${this.apiUrl}?page=${page}`);
  }
  updateRequirement(id: number, data: FormData): Observable<any> {
    return this.http.put(`${this.apiUrl}${id}/`, data);
  }
  deleteRequirement(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}${id}/`);
  }

  getAllUsers(): Observable<any> {
    return this.http.get(this.usersUrl);
  }

  getClientsForDropdown(): Observable<any> {
    return this.http.get(`${this.apiUrl}client_list/`);
  }

  // 2. Search Location (External API)
  searchLocations(query: string): Observable<any> {
    return this.http.get(`${this.locationApiUrl}${query}`);
  }

  // Add this method
  parseJobDescription(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(this.parseJdUrl, formData);
  }
}