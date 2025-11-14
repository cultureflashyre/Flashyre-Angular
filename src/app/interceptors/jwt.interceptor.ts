// src/app/interceptors/jwt.interceptor.ts
import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, filter, switchMap, take } from 'rxjs/operators';
import { jwtDecode } from 'jwt-decode';

import { AuthService } from '../services/candidate.service';
import { CorporateAuthService } from '../services/corporate-auth.service';

interface JwtPayload {
  exp: number;
}

// --- State and Helpers moved to the module scope ---
let isRefreshing = false;
const refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);

const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = jwtDecode<JwtPayload>(token);
    return new Date(decoded.exp * 1000) < new Date();
  } catch (e) {
    return true;
  }
};

const addToken = (request: HttpRequest<any>, token: string) => {
  return request.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });
};

// --- Main Interceptor Function ---
export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  // Inject dependencies
  const candidateAuthService = inject(AuthService);
  const corporateAuthService = inject(CorporateAuthService);
  const router = inject(Router);

  // Determine which service to use based on the request URL
  const authService = req.url.includes('/corporate/') ? corporateAuthService : candidateAuthService;
  let token = authService.getJWTToken();

  if (token && isTokenExpired(token)) {
    authService.clearTokens();
    token = null;
  }

  let authReq = req;
  if (token) {
    authReq = addToken(req, token);
  }

  return next(authReq).pipe(
    catchError(error => {
      if (error instanceof HttpErrorResponse && error.status === 401 && !authReq.url.includes('api/auth/login/')) {
        return handle401Error(authReq, next, authService, router);
      }
      return throwError(() => error);
    })
  );
};

// --- Token Refresh Logic Helper ---
function handle401Error(
  request: HttpRequest<any>,
  next: HttpHandlerFn,
  authService: AuthService | CorporateAuthService,
  router: Router
): Observable<HttpEvent<any>> {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    return authService.refreshToken().pipe(
      switchMap((tokenResponse: any) => {
        isRefreshing = false;
        const newAccessToken = tokenResponse.access;
        refreshTokenSubject.next(newAccessToken);
        authService.saveTokens(newAccessToken, tokenResponse.refresh || authService.getRefreshToken());
        return next(addToken(request, newAccessToken));
      }),
      catchError(err => {
        isRefreshing = false;
        authService.logout(); // A single logout method is cleaner
        const loginRoute = authService instanceof CorporateAuthService ? '/login-corporate' : '/login-candidate';
        router.navigate([loginRoute]);
        return throwError(() => err);
      })
    );
  } else {
    return refreshTokenSubject.pipe(
      filter(token => token !== null),
      take(1),
      switchMap(token => next(addToken(request, token!)))
    );
  }
}