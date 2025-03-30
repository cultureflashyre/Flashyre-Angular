// In services/user-profile.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface UserProfile {
  first_name: string;
  last_name: string;
  profile_picture_url: string | null;
  company_name: string | null;
  job_title: string | null;
  university: string | null;
  education_level: string | null;
  specialization: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class UserProfileService {
  private apiUrl = environment.apiUrl;
  private userProfileSubject = new BehaviorSubject<UserProfile | null>(null);
  
  userProfile$ = this.userProfileSubject.asObservable();

  constructor(private http: HttpClient) {
    // Try to load profile from local storage on service initialization
    const storedProfile = localStorage.getItem('userProfile');
    if (storedProfile) {
      this.userProfileSubject.next(JSON.parse(storedProfile));
    }
  }

  fetchUserProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}complete-profile/`)
      .pipe(
        tap(profile => {
          // Store in local storage
          localStorage.setItem('userProfile', JSON.stringify(profile));
          // Update the behavior subject
          this.userProfileSubject.next(profile);
        })
      );
  }

  clearUserProfile() {
    localStorage.removeItem('userProfile');
    this.userProfileSubject.next(null);
  }

  getCurrentUserProfile(): UserProfile | null {
    return this.userProfileSubject.value;
  }

  refreshUserProfileValues() {
    return this.fetchUserProfile();
  }
}