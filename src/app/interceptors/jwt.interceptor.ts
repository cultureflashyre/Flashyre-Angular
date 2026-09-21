// src/app/interceptors/jwt.interceptor.ts
import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError, timer } from 'rxjs';
import { catchError, filter, retry, switchMap, take } from 'rxjs/operators';
import { jwtDecode } from 'jwt-decode';
import { clearAllAuthData } from '../utils/auth-utils';

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

const getDeviceId = (): string => {
  let deviceId = localStorage.getItem('device_id');
  if (!deviceId) {
    deviceId = crypto.randomUUID ? crypto.randomUUID() : 'id-' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('device_id', deviceId);
  }
  return deviceId;
};

// --- Main Interceptor Function ---
export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  // Inject dependencies
  const candidateAuthService = inject(AuthService);
  const corporateAuthService = inject(CorporateAuthService);
  const router = inject(Router);

  // Auth endpoints that should NEVER be intercepted for token refresh
  const authEndpoints = [
    'api/auth/login/',
    'api/auth/signup/',
    'api/auth/google/',
    'api/token/refresh/',
    'login-corporate/',
    'login-forgot-password/',
    'login-reset-password/',
    'api/captcha/',
  ];
  const isAuthRequest = authEndpoints.some(endpoint => req.url.includes(endpoint));

  // Determine which service to use based on the request URL
  const authService = req.url.includes('/corporate/') ? corporateAuthService : candidateAuthService;
  const token = authService.getJWTToken();

  console.log(`[JWT Interceptor] Request URL: ${req.url}`);
  console.log(`[JWT Interceptor] Is Auth Request? ${isAuthRequest}`);
  console.log(`[JWT Interceptor] Token present? ${!!token}`);

  // Attach Device ID to all requests
  let authReq = req.clone({
    setHeaders: {
      'X-Device-ID': getDeviceId()
    }
  });

  // If we have a token but it's expired, proactively refresh it
  // BUT skip this for auth endpoints (login, signup, refresh, etc.)
  if (token) {
    const expired = isTokenExpired(token);
    console.log(`[JWT Interceptor] Is Token Expired? ${expired}`);
    if (expired && !isAuthRequest) {
      console.log(`[JWT Interceptor] Proactively triggering handleTokenRefresh`);
      return handleTokenRefresh(authReq, next, authService, router);
    }
  }

  // Do NOT attach the token if this is a login/signup/refresh request.
  // Django REST Framework's JWTAuthentication will reject the request with a 401
  // if an expired token is sent in the header, even for public endpoints like login.
  if (token && !isAuthRequest) {
    authReq = addToken(authReq, token);
  }

  return next(authReq).pipe(
    catchError(error => {
      console.error(`[JWT Interceptor] Request error:`, error);
      if (error instanceof HttpErrorResponse && error.status === 401 && !isAuthRequest) {
        console.log(`[JWT Interceptor] 401 Unauthorized received. Triggering handleTokenRefresh`);
        return handleTokenRefresh(authReq, next, authService, router);
      }
      return throwError(() => error);
    })
  );
};

// --- Token Refresh Logic Helper ---
function handleTokenRefresh(
  request: HttpRequest<any>,
  next: HttpHandlerFn,
  authService: AuthService | CorporateAuthService,
  router: Router
): Observable<HttpEvent<any>> {
  console.log(`[JWT Interceptor] handleTokenRefresh called. isRefreshing: ${isRefreshing}`);
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    const refreshToken = authService.getRefreshToken();
    console.log(`[JWT Interceptor] Calling API to refresh token. Using refresh token: ${!!refreshToken}`);

    return authService.refreshToken().pipe(
      retry({
        count: 3,
        delay: (error: any, retryCount: number) => {
          // Do not retry fatal auth rejections or client configuration failures
          if (
            error?.status === 401 ||
            error?.status === 403 ||
            error?.message === 'No refresh token available'
          ) {
            return throwError(() => error);
          }
          // Exponential backoff: 1000ms * 2^(retryCount - 1) + jitter (0-500ms)
          const baseDelay = 1000 * Math.pow(2, retryCount - 1);
          const jitter = Math.floor(Math.random() * 500);
          const delayMs = baseDelay + jitter;
          console.warn(`[JWT Interceptor] Transient refresh failure (${error?.status || error?.message}). Retrying attempt ${retryCount}/3 in ${delayMs}ms...`);
          return timer(delayMs);
        }
      }),
      catchError(err => {
        console.error(`[JWT Interceptor] Refresh token API failed after retries!`, err);
        isRefreshing = false;

        const status = err?.status;
        // Do not clear tokens or kick user to /login on rate-limiting (429) or transient network/server issues (0, 5xx)
        if (status === 429) {
          console.warn('[JWT Interceptor] Refresh request rate-limited (HTTP 429). Preserving local session.');
          return throwError(() => err);
        }
        if (status === 0 || (status >= 500 && status < 600)) {
          console.warn(`[JWT Interceptor] Transient server/network error (HTTP ${status}) during refresh. Preserving local session.`);
          return throwError(() => err);
        }

        console.log(`[JWT Interceptor] Refresh token invalid or unrecoverable. Clearing session and navigating to /login`);
        
        clearAllAuthData();
        authService.clearTokens();
        router.navigate(['/login']);
        return throwError(() => err);
      }),
      switchMap((tokenResponse: any) => {
        console.log(`[JWT Interceptor] Refresh token API success!`);
        isRefreshing = false;
        const newAccessToken = tokenResponse.access;
        refreshTokenSubject.next(newAccessToken);
        authService.saveTokens(newAccessToken, tokenResponse.refresh || authService.getRefreshToken());
        return next(addToken(request, newAccessToken));
      })
    );
  } else {
    console.log(`[JWT Interceptor] Already refreshing, waiting for new token...`);
    return refreshTokenSubject.pipe(
      filter(token => token !== null),
      take(1),
      switchMap(token => {
        console.log(`[JWT Interceptor] Received new token from subject, retrying request.`);
        return next(addToken(request, token!))
      })
    );
  }
}
