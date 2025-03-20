import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private baseUrl = environment.apiUrl+'candidate-profile-basic-information';

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