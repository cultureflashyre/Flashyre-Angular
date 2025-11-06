import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/candidate.service';
import { jwtDecode } from 'jwt-decode';

interface JwtPayload {
  exp: number;
}

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

    if (!token || this.isTokenExpired(token)) {
      console.log('No token found, user is not logged in.');

    const expectedRoles: string[] = route.data['roles'];
    console.log('Expected roles for this route:', expectedRoles);

      if (expectedRoles && expectedRoles.length === 1) {
      let roleToRedirect = expectedRoles[0];
        if (roleToRedirect === 'recruiter') {
            roleToRedirect = 'corporate';
        }

        console.log(`Redirecting to login page for role: login-${roleToRedirect} with returnUrl: ${state.url}`);
        this.router.navigate([`/login-${roleToRedirect}`], { queryParams: { returnUrl: state.url } });
      } else {
        console.log(`Redirecting to default candidate login with returnUrl: ${state.url}`);
        this.router.navigate([`/login-${userType || 'candidate'}`], { queryParams: { returnUrl: state.url } });
      }
      return false;
    }

    //if (expectedRoles && !expectedRoles.includes(userType)) {
    //  console.log(`Role mismatch: userType=${userType} is not in expected roles [${expectedRoles}]. Redirecting to /forbidden.`);
    //  this.router.navigate(['/forbidden']);
   //   return false;
   // }

    if (expectedRoles && !expectedRoles.includes(userType)) {
    console.log(`Role mismatch: userType=${userType} is not in expected roles [${expectedRoles}]. Redirecting to userType specific page.`);

    switch(userType) {
        case 'candidate':
            console.log("Inside the SWITCH for ", userType);
        this.router.navigate(['/candidate-home']);
        break;
        case 'recruiter':
                        console.log("Inside the SWITCH for ", userType);
        this.router.navigate(['/job-post-list']);
        break;
        case 'admin':
                        console.log("Inside the SWITCH for ", userType);
        this.router.navigate(['/admin-page1']);
        break;
        default:
                        console.log("Inside the SWITCH for ", userType);
        this.router.navigate(['/forbidden']);
        break;
    }
    return false;
    }


    console.log('All checks passed. Route access granted.');
    return true;
  }

    private isTokenExpired(token: string): boolean {
    try {
        const decoded = jwtDecode<JwtPayload>(token);
        return new Date(decoded.exp * 1000) < new Date();
    } catch {
        return true;
    }
    }
}
