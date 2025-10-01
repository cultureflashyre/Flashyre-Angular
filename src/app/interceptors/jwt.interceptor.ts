// jwt.interceptor.ts (Corrected Version)

import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { AuthService } from '../services/candidate.service';
import { CorporateAuthService } from '../services/corporate-auth.service'; // Import corporate service
import { jwtDecode } from 'jwt-decode';
import { Router } from '@angular/router';
import { catchError, filter, switchMap, take } from 'rxjs/operators';

interface JwtPayload {
  exp: number;
}

@Injectable({
  providedIn: 'root',
})
export class JwtInterceptor implements HttpInterceptor {

  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);
  
constructor(
    private authService: AuthService,
    private corporateAuthService: CorporateAuthService,
    private router: Router,
  ) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const authService = this.getAuthService(request.url);
    let token = authService.getJWTToken();

    if (token && this.isTokenExpired(token)) {
      // Clear expired tokens immediately
      authService.clearTokens();
      token = null;
    }

    let authReq = request;

    if (token) {
      authReq = this.addToken(request, token);
    }

    return next.handle(authReq).pipe(
      catchError(error => {
        // --- START: THIS IS THE REQUIRED CHANGE ---
        //
        // We now check if the error is a 401 AND that the URL is NOT the login URL.
        // This prevents the interceptor from trying to handle a failed login attempt.
        // A failed login should be handled by the login component itself.
        //
        // Your login API path is 'api/auth/login/'.
        if (error instanceof HttpErrorResponse && error.status === 401 && !authReq.url.includes('api/auth/login/')) {
          // Access token might have expired, so we try to refresh it.
          return this.handle401Error(authReq, next, authService);
        }
        // --- END: CHANGE ---

        // For login failures or any other type of error, just pass the error along.
        return throwError(() => error);
      })
    );
  }

  private getAuthService(url: string): AuthService | CorporateAuthService {
    // Check URL to determine service type
    // This logic might need to be more specific if both corporate and candidate URLs are similar
    return url.includes('/corporate/') ? this.corporateAuthService : this.authService;
  }

  private addToken(request: HttpRequest<any>, token: string) {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

    // ✅ Checks token expiry using exp claim
  private isTokenExpired(token: string): boolean {
    try {
      const decoded = jwtDecode<JwtPayload>(token);
      const expiryDate = new Date(decoded.exp * 1000);
      return expiryDate < new Date();
    } catch (e) {
      return true; // treat malformed token as expired
    }
  }

  private handle401Error(request: HttpRequest<any>, next: HttpHandler, authService: AuthService | CorporateAuthService) {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      // Make sure you are using the correct authService to refresh the token
      return authService.refreshToken().pipe(
        switchMap((tokenResponse: any) => {
          this.isRefreshing = false;
          const newAccessToken = tokenResponse.access;
          this.refreshTokenSubject.next(newAccessToken);
          // Ensure refreshToken() returns the new refresh token if it's rotated
          authService.saveTokens(newAccessToken, tokenResponse.refresh || authService.getRefreshToken());
          return next.handle(this.addToken(request, newAccessToken));
        }),
        catchError(err => {
          this.isRefreshing = false;

          authService.clearTokens();
          authService.logout();
          // Redirect to appropriate login
          if (authService instanceof CorporateAuthService) {
            // Add corporate logout navigation if needed, e.g., 
            this.router.navigate(['/login-corporate']);
          } else {
            this.router.navigate(['/login-candidate']);
          }
          return throwError(() => err);
        })
      );
    } else {
      return this.refreshTokenSubject.pipe(
        filter(token => token !== null),
        take(1),
        switchMap(token => next.handle(this.addToken(request, token!)))
      );
    }
  }
}