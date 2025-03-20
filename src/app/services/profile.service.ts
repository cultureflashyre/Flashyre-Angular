import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators'; // Import finalize operator
import { BufferService } from './buffer.service'; // Import BufferService
import { NgxSpinnerService } from 'ngx-spinner'; // Import NgxSpinnerService
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private baseUrl = environment.apiUrl;

  constructor(
    private http: HttpClient, 
    private bufferService: BufferService,
    private spinner: NgxSpinnerService
  ) {}

  // Fetch user details
  getUserDetails(): Observable<any> {
    const url = `${this.baseUrl}get-user-details/`;

    // Show buffer before making the request
    //this.bufferService.show();
    this.spinner.show();

    return this.http.get(url, { withCredentials: true }).pipe(
      // Hide buffer after the request completes
      finalize(() => this.spinner.hide())
    );
  }

  // Save profile information with file uploads
  saveProfile(profileData: FormData): Observable<any> {
    const url = `${this.baseUrl}/save-profile-basic-info/`;

    // Show buffer before making the request
    //this.bufferService.show();
    this.spinner.show()

    return this.http.post(url, profileData, { withCredentials: true }).pipe(
      // Hide buffer after the request completes
      finalize(() => this.spinner.hide())
    );
  }
}