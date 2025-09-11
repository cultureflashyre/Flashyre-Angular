// certification.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize, switchMap, tap, catchError } from 'rxjs/operators';
import { NgxSpinnerService } from 'ngx-spinner'; // Import NgxSpinnerService
import { environment } from '../../environments/environment';
import { UserProfileService } from './user-profile.service';


@Injectable({ providedIn: 'root' })
export class CertificationService {
    private baseUrl = environment.apiUrl+'api/certifications/';

  constructor(
    private http: HttpClient,
    private userProfileService: UserProfileService
) {}

saveCertification(cert: any): Observable<any> {
  return this.http.post(this.baseUrl, cert).pipe(
    tap(() => {
      this.userProfileService.refreshUserProfileValues().subscribe({
        next: () => console.log('User profile refreshed after saving certification'),
        error: err => console.error('Error refreshing user profile', err),
      });
    })
  );
}

}
