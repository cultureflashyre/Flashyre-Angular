import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { AuthService } from '../services/candidate.service';
import { CorporateAuthService } from '../services/corporate-auth.service'; // Import corporate service

import { catchError, filter, switchMap, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class JwtInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService,
    private corporateAuthService: CorporateAuthService
  ) {}

  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Determine which auth service to use based on request URL
    const authService = this.getAuthService(request.url);
    const token = authService.getJWTToken();

    let authReq = request;

    if (token) {
      authReq = this.addToken(request, token);
    }

    return next.handle(authReq).pipe(
      catchError(error => {
        if (error instanceof HttpErrorResponse && 
          error.status === 401 &&
          !authReq.url.includes('refresh-token')) {
          // Access token might have expired
          return this.handle401Error(authReq, next, authService);
        }
        return throwError(() => error);
      })
    );
  }

  private getAuthService(url: string): AuthService | CorporateAuthService {
    // Check URL to determine service type
    return url.includes('/corporate/') ? this.corporateAuthService : this.authService;
  }

  private addToken(request: HttpRequest<any>, token: string) {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

private handle401Error(request: HttpRequest<any>, next: HttpHandler, authService: AuthService | CorporateAuthService) {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return authService.refreshToken().pipe(
        switchMap((tokenResponse: any) => {
          this.isRefreshing = false;
          const newAccessToken = tokenResponse.access;
          this.refreshTokenSubject.next(newAccessToken);
          authService.saveTokens(newAccessToken, tokenResponse.refresh || authService.getRefreshToken());
          return next.handle(this.addToken(request, newAccessToken));
        }),
        catchError(err => {
          this.isRefreshing = false;
          authService.logout();
          // Redirect to appropriate login
          if (authService instanceof CorporateAuthService) {
            // Add corporate logout navigation if needed
          } else {
            // Existing candidate logout navigation
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