import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AdbRequirementService {
  private apiUrl = environment.apiUrl + 'api/job-requirements/'; 

  constructor(private http: HttpClient) { }

  createRequirement(data: any): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }

  // Add this method to fetch the list
  getRequirements(): Observable<any> {
    return this.http.get(this.apiUrl);
  }
  updateRequirement(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}${id}/`, data);
  }
}