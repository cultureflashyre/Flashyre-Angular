import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Router } from '@angular/router';

import { clearAllAuthData } from '../utils/auth-utils';
import { AuthBroadcastService } from './auth-broadcast.service';

@Injectable({
  providedIn: 'root'
})
export class AdminAuthService {

  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private router: Router,
    private authBroadcastService: AuthBroadcastService
  ) {}

  /**
   * Registers a new admin user by posting to the generic signup endpoint.
   * @param adminData The form data for the new admin.
   * @returns An Observable with the server's response.
   */
  signupAdmin(adminData: any): Observable<any> {
    // Ensure the user_type is explicitly set to 'admin' before sending
    const data = { ...adminData, user_type: 'admin' };
    const targetUrl = `${this.apiUrl}api/auth/signup/`;

    // Log the URL being called for debugging
    console.log(`--- [Frontend Service Log] Calling API URL: ${targetUrl} ---`);
    
    return this.http.post(targetUrl, data);
  }

  logout(): void {
    this.authBroadcastService.broadcastLogout();
    clearAllAuthData();
    this.router.navigate(['/login']);
  }
}
