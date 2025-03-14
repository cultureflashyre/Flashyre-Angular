import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8000'; // Base URL

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/login-candidate/`, { email, password }, { withCredentials: true })
      .pipe(
        tap(response => {
          if (response && response.user_id) {
            // Store user_id in local storage
            localStorage.setItem('user_id', response.user_id);
          }
        })
      );
  }

  logout(): void {
    localStorage.removeItem('user_id');
    // You can add an API call here to clear the session on the server side if needed
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('user_id');
  }

  getUserId(): string | null {
    return localStorage.getItem('user_id');
  }
}