import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  info(arg0: string, response: Object) {
    throw new Error('Method not implemented.');
  }
  error(arg0: string, error: any) {
    throw new Error('Method not implemented.');
  }
  debug(arg0: string, data: { email: string; password: string; }) {
    throw new Error('Method not implemented.');
  }
  private apiUrl = 'http://localhost:8000/api/login-candidate/'; // Adjust if necessary

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<any> {
    return this.http.post(this.apiUrl, { email, password });
  }
}