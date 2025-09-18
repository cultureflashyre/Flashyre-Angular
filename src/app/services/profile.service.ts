import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize, tap } from 'rxjs/operators'; // Import finalize operator
import { BufferService } from './buffer.service'; // Import BufferService
import { NgxSpinnerService } from 'ngx-spinner'; // Import NgxSpinnerService
import { environment } from '../../environments/environment';
import { UserProfileService } from './user-profile.service';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private baseUrl = environment.apiUrl;

  constructor(
    private http: HttpClient, 
    private bufferService: BufferService,
    private spinner: NgxSpinnerService,
    private userProfileService: UserProfileService,
  ) {}

  // Fetch user details
  getUserDetails(): Observable<any> {
    const url = `${this.baseUrl}get-user-details/`;

    // Show buffer before making the request
    //this.bufferService.show();
    this.spinner.show();

    return this.http.get(url).pipe(
      // Hide buffer after the request completes
      finalize(() => this.spinner.hide())
    );
  }

  // Save profile information with file uploads
saveProfile(profileData: FormData): Observable<any> {
    const url = `${this.baseUrl}save-profile-basic-info/`;

    this.spinner.show();

    return this.http.post(url, profileData).pipe(
      tap(() => {
        // After successful save, refresh user profile asynchronously
        this.userProfileService.refreshUserProfileValues().subscribe({
          next: () => console.log('User profile refreshed after save'),
          error: err => console.error('Error refreshing user profile', err),
        });
      }),
      finalize(() => this.spinner.hide())
    );
  }
  
}