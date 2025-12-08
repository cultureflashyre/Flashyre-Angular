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

  private locationApiUrl = 'https://nominatim.openstreetmap.org/search?format=json&q=';

  constructor(private http: HttpClient) { }

  createRequirement(data: FormData): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }

  // Add this method to fetch the list
  getRequirements(): Observable<any> {
    return this.http.get(this.apiUrl);
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
}