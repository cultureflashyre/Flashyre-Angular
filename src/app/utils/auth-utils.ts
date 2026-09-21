// src/app/utils/auth-utils.ts
import { jwtDecode } from 'jwt-decode';

export const AUTH_STORAGE_KEYS = [
  'jwtToken',
  'refreshToken',
  'userProfile',
  'user_id',
  'userId',
  'userType',
  'isSuperUser',
  'firstName',
  'lastName',
] as const;

/**
 * Clears all authentication and user identity data from localStorage.
 * Preserves hardware/client identifiers like device_id.
 */
export function clearAllAuthData(): void {
  if (typeof localStorage === 'undefined') return;
  for (const key of AUTH_STORAGE_KEYS) {
    localStorage.removeItem(key);
  }
}

/**
 * Retrieves the currently stored access token.
 */
export function getJWTToken(): string | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem('jwtToken');
}

/**
 * Retrieves the currently stored refresh token.
 */
export function getRefreshToken(): string | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem('refreshToken');
}

/**
 * Checks if the user is authenticated with a valid, non-expired access token.
 */
export function isAuthenticated(): boolean {
  const token = getJWTToken();
  if (!token) return false;
  try {
    const decoded = jwtDecode<{ exp: number }>(token);
    return new Date(decoded.exp * 1000) > new Date();
  } catch {
    return false;
  }
}

/**
 * Checks whether an access token is expired or about to expire within thresholdMs.
 */
export function isTokenExpired(token: string | null, thresholdMs: number = 0): boolean {
  if (!token) return true;
  try {
    const decoded = jwtDecode<{ exp: number }>(token);
    return new Date(decoded.exp * 1000 - thresholdMs) <= new Date();
  } catch {
    return true;
  }
}
