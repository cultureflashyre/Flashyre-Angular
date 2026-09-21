// src/app/interceptors/jwt.interceptor.ts
import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse, HttpRequest, HttpHandlerFn, HttpEvent, HttpContextToken } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, from, throwError, timer } from 'rxjs';
import { catchError, filter, retry, switchMap, take } from 'rxjs/operators';
import { jwtDecode } from 'jwt-decode';
import { clearAllAuthData } from '../utils/auth-utils';
import { DPoPCryptoService } from '../services/dpop-crypto.service';

import { AuthService } from '../services/candidate.service';
import { CorporateAuthService } from '../services/corporate-auth.service';

interface JwtPayload {
  exp: number;
}

// Angular HttpContextToken for tracking retry state purely in-memory (no CORS preflight header)
export const IS_AUTH_RETRIED = new HttpContextToken<boolean>(() => false);

// --- State and Helpers moved to the module scope ---
let isRefreshing = false;
const refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);

// Refresh cooldown: prevent infinite refresh loops from polling services
let lastRefreshFailedAt = 0;
const REFRESH_COOLDOWN_MS = 30_000; // 30 seconds

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
  const dpopCryptoService = inject(DPoPCryptoService);

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

  return from(dpopCryptoService.generateDPoPProof(req.method, req.url)).pipe(
    switchMap(dpopProof => {
      const headers: Record<string, string> = {
        'X-Device-ID': getDeviceId()
      };
      // Only set DPoP header if we have a valid proof (not null, not empty)
      if (dpopProof && dpopProof.trim()) {
        headers['DPoP'] = dpopProof;
      }

      // Attach Device ID, DPoP cryptographic proof, and ensure withCredentials=true for HttpOnly cookies
      let authReq = req.clone({
        setHeaders: headers,
        withCredentials: true
      });

      // If we have a token but it's expired, proactively refresh it
      // BUT skip this for auth endpoints (login, signup, refresh, etc.)
      if (token) {
        const expired = isTokenExpired(token);
        if (expired && !isAuthRequest && !authReq.context.get(IS_AUTH_RETRIED)) {
          // Check cooldown to prevent infinite refresh loops
          if (Date.now() - lastRefreshFailedAt < REFRESH_COOLDOWN_MS) {
            console.warn('[JWT Interceptor] Refresh cooldown active, skipping proactive refresh.');
            return throwError(() => new HttpErrorResponse({ status: 401, statusText: 'Refresh cooldown active' }));
          }
          return handleTokenRefresh(authReq, next, authService, router, dpopCryptoService);
        }
      }

      // Do NOT attach the token if this is a login/signup/refresh request.
      if (token && !isAuthRequest) {
        authReq = addToken(authReq, token);
      }

      return next(authReq).pipe(
        catchError(error => {
          if (
            error instanceof HttpErrorResponse &&
            error.status === 401 &&
            !isAuthRequest &&
            !authReq.context.get(IS_AUTH_RETRIED)
          ) {
            // Check cooldown to prevent infinite refresh loops
            if (Date.now() - lastRefreshFailedAt < REFRESH_COOLDOWN_MS) {
              console.warn('[JWT Interceptor] Refresh cooldown active, not retrying.');
              return throwError(() => error);
            }
            return handleTokenRefresh(authReq, next, authService, router, dpopCryptoService);
          }
          return throwError(() => error);
        })
      );
    })
  );
};

// --- Helper: Retries request with fresh access token and fresh DPoP proof (RFC 9449 anti-replay) ---
function retryWithFreshTokenAndDPoP(
  request: HttpRequest<any>,
  next: HttpHandlerFn,
  newToken: string,
  dpopCryptoService: DPoPCryptoService
): Observable<HttpEvent<any>> {
  return from(dpopCryptoService.generateDPoPProof(request.method, request.url)).pipe(
    switchMap(freshDPoPProof => {
      let headers = request.headers
        .set('Authorization', `Bearer ${newToken}`)
        .set('X-Device-ID', getDeviceId());

      // Only set DPoP header if we have a valid proof; otherwise remove any stale one
      if (freshDPoPProof && freshDPoPProof.trim()) {
        headers = headers.set('DPoP', freshDPoPProof);
      } else {
        headers = headers.delete('DPoP');
      }

      // Mark request context with IS_AUTH_RETRIED to prevent infinite loops,
      // without transmitting any unauthorized custom header over the wire.
      const retriedReq = request.clone({
        headers,
        context: request.context.set(IS_AUTH_RETRIED, true),
        withCredentials: true
      });
      return next(retriedReq);
    })
  );
}

// --- Token Refresh Logic Helper ---
function handleTokenRefresh(
  request: HttpRequest<any>,
  next: HttpHandlerFn,
  authService: AuthService | CorporateAuthService,
  router: Router,
  dpopCryptoService: DPoPCryptoService
): Observable<HttpEvent<any>> {
  if (request.context.get(IS_AUTH_RETRIED) || request.headers.has('X-Auth-Retried')) {
    console.warn('[JWT Interceptor] Request already retried once with fresh token and failed. Halting retry to prevent loop.');
    return throwError(() => new HttpErrorResponse({ status: 401, statusText: 'Unauthorized after retry' }));
  }

  console.log(`[JWT Interceptor] handleTokenRefresh called. isRefreshing: ${isRefreshing}`);
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    console.log(`[JWT Interceptor] Calling API to refresh token. Using HttpOnly cookie (withCredentials).`);

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
        lastRefreshFailedAt = Date.now(); // Set cooldown
        refreshTokenSubject.next('FAILED');

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
        lastRefreshFailedAt = 0; // Reset cooldown on success
        const newAccessToken = tokenResponse.access;
        refreshTokenSubject.next(newAccessToken);
        // Save only the access token; refresh token is managed via HttpOnly cookie
        authService.saveTokens(newAccessToken, tokenResponse.refresh || '');
        return retryWithFreshTokenAndDPoP(request, next, newAccessToken, dpopCryptoService);
      })
    );
  } else {
    console.log(`[JWT Interceptor] Already refreshing, waiting for new token...`);
    return refreshTokenSubject.pipe(
      filter(token => token !== null),
      take(1),
      switchMap(token => {
        if (token === 'FAILED') {
          return throwError(() => new HttpErrorResponse({ status: 401, statusText: 'Token refresh failed' }));
        }
        console.log(`[JWT Interceptor] Received new token from subject, retrying request.`);
        return retryWithFreshTokenAndDPoP(request, next, token!, dpopCryptoService);
      })
    );
  }
}
