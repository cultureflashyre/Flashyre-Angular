import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, Subscription, throwError, timer } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { SocialAuthService } from '@abacritt/angularx-social-login';
import { jwtDecode } from 'jwt-decode';
import { clearAllAuthData, isAuthenticated } from '../utils/auth-utils';
import { AuthBroadcastService } from './auth-broadcast.service';

interface CorporateSignupData {
  first_name: string;
  last_name: string;
  company_name: string;
  phone_number: string;
  email: string;
  password: string;
}

interface AuthResponse {
  access: string;
  refresh: string;
  message?: string;
  data?: any;
  user_id?: number | string;
}

@Injectable({
  providedIn: 'root'
})
export class CorporateAuthService {
  private apiUrl = environment.apiUrl; // Adjust the API URL as needed
  private silentRefreshSub: Subscription | null = null;
  private isSilentRefreshing = false;

  constructor(
    private http: HttpClient,
    private router: Router,
    private socialAuthService: SocialAuthService,
    private authBroadcastService: AuthBroadcastService,
  ) {
    this.initBroadcastListeners();
    if (this.isLoggedIn()) {
      this.startSilentRefreshTimer();
    }
  }

  private initBroadcastListeners(): void {
    this.authBroadcastService.messages$.subscribe(msg => {
      if (msg.type === 'TOKEN_REFRESHED' || msg.type === 'LOGIN_SUCCESS') {
        localStorage.setItem('jwtToken', msg.accessToken);
        if (msg.refreshToken) {
          localStorage.setItem('refreshToken', msg.refreshToken);
        }
        this.startSilentRefreshTimer(msg.accessToken, false);
      } else if (msg.type === 'LOGOUT') {
        this.clearTokens(false);
        const currentUrl = this.router.url;
        if (!currentUrl.includes('/login') && !currentUrl.includes('/signup')) {
          this.router.navigate(['/login']);
        }
      }
    });
  }

  loginCorporate(email: string, password: string, captchaId?: string, captchaAnswer?: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}api/auth/login/`, { 
      email, 
      password,
      captcha_id: captchaId,
      captcha_answer: captchaAnswer
    }).pipe(
      tap((response: AuthResponse) => {
        if (response.access && response.refresh) {
          this.saveTokens(response.access, response.refresh);
        }
      }),
      catchError(this.handleError)
    );
  }

  signupCorporate(data: CorporateSignupData): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}api/auth/signup/`, data).pipe(
      tap((response: AuthResponse) => {
        if (response.access && response.refresh) {
          this.saveTokens(response.access, response.refresh);
        }
      }),
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred';
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Client-side error: ${error.error.message}`;
    } else {
      // Server-side error
      if (error.status === 401) {
        errorMessage = error.error?.error || 'Invalid credentials';
      } else if (error.status === 400) {
        errorMessage = error.error?.error || 'Invalid request data';
      } else {
        errorMessage = error.error?.error || `Server error: ${error.status}`;
      }
    }
    return throwError(() => new Error(errorMessage));
  }

  /**
   * Saves access and refresh tokens to localStorage and schedules proactive refresh.
   */
  saveTokens(access: string, refresh: string, shouldBroadcast: boolean = true): void {
    localStorage.setItem('jwtToken', access);
    localStorage.setItem('refreshToken', refresh);
    this.startSilentRefreshTimer(access, shouldBroadcast);
    if (shouldBroadcast) {
      this.authBroadcastService.broadcastTokenRefreshed(access, refresh);
    }
  }

  getJWTToken(): string | null {
    return localStorage.getItem('jwtToken');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  /**
   * Starts a proactive silent refresh timer that executes 2 minutes before the JWT access token expires.
   */
  startSilentRefreshTimer(tokenStr?: string, shouldBroadcast: boolean = true): void {
    this.stopSilentRefreshTimer();

    const token = tokenStr || this.getJWTToken();
    if (!token) return;

    try {
      const decoded = jwtDecode<{ exp: number }>(token);
      const expMs = decoded.exp * 1000;
      const nowMs = Date.now();
      // Proactive refresh target: 2 minutes (120,000 ms) before expiration
      const leadTimeMs = 2 * 60 * 1000;
      const delayMs = Math.max(0, expMs - nowMs - leadTimeMs);

      console.log(`[CorporateAuthService] Proactive silent refresh scheduled in ${(delayMs / 1000).toFixed(0)} seconds.`);

      this.silentRefreshSub = timer(delayMs).subscribe(() => {
        if (this.isSilentRefreshing) return;
        this.isSilentRefreshing = true;

        console.log('[CorporateAuthService] Proactive silent refresh timer fired at T-2min.');
        this.refreshToken().subscribe({
          next: (res: any) => {
            this.isSilentRefreshing = false;
            if (res && res.access) {
              this.saveTokens(res.access, res.refresh || this.getRefreshToken() || '', shouldBroadcast);
            }
          },
          error: (err: any) => {
            this.isSilentRefreshing = false;
            console.warn('[CorporateAuthService] Proactive silent refresh failed (will fallback to interceptor on demand):', err);
          }
        });
      });
    } catch (e) {
      console.warn('[CorporateAuthService] Failed to schedule silent refresh timer:', e);
    }
  }

  /**
   * Cancels active proactive silent refresh timer subscription.
   */
  stopSilentRefreshTimer(): void {
    if (this.silentRefreshSub) {
      this.silentRefreshSub.unsubscribe();
      this.silentRefreshSub = null;
    }
  }

  refreshToken(): Observable<any> {
    const refresh = this.getRefreshToken();
    return this.http.post<any>(
      `${this.apiUrl}api/token/refresh/`,
      refresh ? { refresh } : {},
      { withCredentials: true }
    );
  }

  isLoggedIn(): boolean {
    return isAuthenticated();
  }

async logout(): Promise<void> {
  try {
    // 1. Sign out from the social provider (Google). This will resolve even
    //    if the user was not logged in with a social provider.
    await this.socialAuthService.signOut();
    console.log('User signed out from social provider.');
  } catch (error) {
    console.error('Error signing out from social provider:', error);
  } finally {
    // 2. Clear all application session data and notify other tabs
    this.clearTokens(true);

    // 3. Redirect the user to the login page.
    this.router.navigate(['/login']);
  }
}

  clearTokens(shouldBroadcast: boolean = true): void {
    this.stopSilentRefreshTimer();
    if (shouldBroadcast) {
      this.authBroadcastService.broadcastLogout();
    }
    clearAllAuthData();
  }
  
  // --- NEW METHOD 1: Initial Google Auth Check ---
  googleAuthCheck(idToken: string, selectedUserType: string): Observable<any> {
    // The user type is implicitly 'recruiter' (corporate) when using this service.
    return this.http.post(`${this.apiUrl}api/auth/google/check/`, { idToken, selectedUserType });
  }

  // --- NEW METHOD 2: Complete Google Signup ---
  completeGoogleSignup(userData: {
    email: string;
    first_name: string;
    last_name: string;
    phone_number: string;
  }): Observable<any> {
    const payload = {
      ...userData,
      user_type: 'recruiter' // Hardcoded as 'recruiter' for corporate users
    };
    return this.http.post(`${this.apiUrl}api/auth/google/complete/`, payload);
  }

}
