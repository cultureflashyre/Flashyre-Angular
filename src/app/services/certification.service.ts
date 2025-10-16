// services/certification.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { UserProfileService } from './user-profile.service';

@Injectable({ providedIn: 'root' })
export class CertificationService {
    private baseUrl = environment.apiUrl + 'api/certifications/sync/';

    constructor(
        private http: HttpClient,
        private userProfileService: UserProfileService
    ) {}

    saveCertifications(certs: any[]): Observable<any> {
        return this.http.post(this.baseUrl, certs).pipe(
            tap(() => {
                this.userProfileService.refreshUserProfileValues().subscribe({
                    next: () => console.log('User profile refreshed after saving certifications'),
                    error: err => console.error('Error refreshing user profile', err),
                });
            }),
            catchError(error => {
                console.error('Full backend error:', error);
                const errorDetail = error.error;
                let errorMessage = 'Failed to save certifications. Please check your entries.';
                
                if (typeof errorDetail === 'object' && errorDetail !== null) {
                    const errorArrays = Object.values(errorDetail) as string[][];

                    // --- FIX APPLIED HERE ---
                    // Replaced .flat() with the universally compatible .reduce() method.
                    const flattenedErrors = errorArrays.reduce((acc, val) => acc.concat(val), []);
                    
                    errorMessage = flattenedErrors.join(' ');
                } else if (typeof errorDetail === 'string') {
                    errorMessage = errorDetail;
                }
                
                return throwError(() => new Error(errorMessage));
            })
        );
    }
}