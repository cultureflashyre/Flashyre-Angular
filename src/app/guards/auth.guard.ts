// src/app/guards/auth.guard.ts
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { jwtDecode } from 'jwt-decode';

interface JwtPayload {
  exp: number;
}

// Helper function to check for token expiration
const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = jwtDecode<JwtPayload>(token);
    return new Date(decoded.exp * 1000) < new Date();
  } catch {
    return true; // Treat a malformed token as expired
  }
};

export const authGuard: CanActivateFn = (route, state) => {
  // Use inject() to get dependencies inside the functional guard
  const router = inject(Router);

  console.log('Functional AuthGuard executing for route:', state.url);

  const token = localStorage.getItem('jwtToken');
  const userType = localStorage.getItem('userType'); // e.g., 'candidate', 'admin', 'recruiter'

  console.log('Stored token:', token);
  console.log('Stored userType:', userType);

  const expectedRoles: string[] = route.data['roles'];
  console.log('Expected roles for this route:', expectedRoles);

  // 1. Check if the user is logged in (token exists and is not expired)
  if (!token || isTokenExpired(token)) {
    console.log('No token found or token is expired. User is not logged in.');

    let roleToRedirect = 'candidate'; // Default redirect
    if (expectedRoles && expectedRoles.length > 0) {
      roleToRedirect = expectedRoles[0] === 'recruiter' ? 'corporate' : expectedRoles[0];
    }

    console.log(`Redirecting to login page for role: login-${roleToRedirect} with returnUrl: ${state.url}`);
    router.navigate([`/login`], { queryParams: { returnUrl: state.url } });
    return false; // Block access
  }

  // 2. Check if the logged-in user has the correct role for the route
  if (expectedRoles && !expectedRoles.includes(userType)) {
    console.log(`Role mismatch: userType=${userType} is not in expected roles [${expectedRoles}]. Redirecting to user-specific home.`);

    // Redirect based on the user's actual role to prevent them from being stuck
    switch (userType) {
      case 'candidate':
        router.navigate(['/candidate-home']);
        break;
      case 'recruiter':
      case 'admin':
        router.navigate(['/job-post-list']);
        break;
      default:
        router.navigate(['/']); // Redirect to a safe default page
        break;
    }
    return false; // Block access
  }

  console.log('All checks passed. Route access granted.');
  return true; // Grant access
};