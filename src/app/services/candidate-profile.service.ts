import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private baseUrl = 'http://localhost:8000/candidate-profile-basic-information';

  constructor(private http: HttpClient) {}

  getUserDetails(): Observable<any> {
    const url = `${this.baseUrl}/get-user-details/`;
    return this.http.get(url, { withCredentials: true });
  }

  saveProfile(profileData: FormData): Observable<any> {
    const url = `${this.baseUrl}/save-profile-basic-info/`;
    return this.http.post(url, profileData, { withCredentials: true });
  }
}