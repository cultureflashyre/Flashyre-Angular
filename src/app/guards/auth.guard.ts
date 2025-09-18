import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/candidate.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService, 
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    console.log('AuthGuard#canActivate called');
    console.log('Attempting to access route URL:', state.url);

    const token = localStorage.getItem('jwtToken');
    const userType = localStorage.getItem('userType');  // e.g., 'candidate', 'admin', 'corporate'

    console.log('Stored token:', token);
    console.log('Stored userType:', userType);

    const expectedRoles: string[] = route.data['roles'];
    console.log('Expected roles for this route:', expectedRoles);

    if (!token) {
      console.log('No token found, user is not logged in.');

      if (expectedRoles && expectedRoles.length === 1) {
        console.log(`Redirecting to login page for role: login-${expectedRoles[0]} with returnUrl: ${state.url}`);
        this.router.navigate([`/login-${expectedRoles[0]}`], { queryParams: { returnUrl: state.url } });
      } else {
        console.log(`Redirecting to default candidate login with returnUrl: ${state.url}`);
        this.router.navigate(['/login-candidate'], { queryParams: { returnUrl: state.url } });
      }
      return false;
    }

    if (expectedRoles && !expectedRoles.includes(userType)) {
      console.log(`Role mismatch: userType=${userType} is not in expected roles [${expectedRoles}]. Redirecting to /forbidden.`);
      this.router.navigate(['/forbidden']);
      return false;
    }

    console.log('All checks passed. Route access granted.');
    return true;
  }
}
