// src/app/guards/auth.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  private authCheckUrl = environment.apiUrl+'check-auth/'; // New endpoint to check auth status

  constructor(private http: HttpClient, private router: Router) {}

  canActivate(): Observable<boolean> | boolean {
    return this.http.get(this.authCheckUrl, { withCredentials: true }).pipe(
      map((response: any) => {
        if (response.is_authenticated) {
          return true; // User is authenticated
        } else {
          this.router.navigate(['/login-candidate']); // Redirect to login if not authenticated
          return false;
        }
      }),
      catchError(() => {
        this.router.navigate(['/login-candidate']); // Redirect on error (e.g., network failure)
        return of(false);
      })
    );
  }
}