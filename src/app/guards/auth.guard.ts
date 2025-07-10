// src/app/guards/auth.guard.ts

import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/candidate.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    console.log('AuthGuard#canActivate called');
    console.log('Trying to access route:', state.url);

    const loggedIn = this.authService.isLoggedIn();
    console.log('User logged in status:', loggedIn);

    if (loggedIn) {
      console.log('Access granted to route:', state.url);
      return true; // Allow access if user is logged in
    }

    console.warn('Access denied - User not logged in. Redirecting to /login-candidate');
    this.router.navigate(['/login-candidate'], { queryParams: { returnUrl: state.url } }); // Optionally pass returnUrl
    return false;
  }
}




