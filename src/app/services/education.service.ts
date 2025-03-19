import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EducationService {
  private apiUrl = 'http://localhost:8000/api/education/'; // Make sure this URL matches your Django URLs configuration

  constructor(private http: HttpClient) {}

  addEducation(educationData: any[]): Observable<any> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      }),
      withCredentials: true // This is crucial for sending cookies (session data)
    };
    
    return this.http.post<any>(this.apiUrl, educationData, httpOptions);
  }
}