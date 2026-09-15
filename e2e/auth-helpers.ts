import { test as baseTest, expect as baseExpect, Page } from '@playwright/test';

/**
 * ══════════════════════════════════════════════════════════════════════════════
 * Flashyre Centralized Playwright Authentication & JWT Generator System
 * ══════════════════════════════════════════════════════════════════════════════
 * 
 * Provides:
 * 1. Automatic valid JWT token generation with future expiration (year 2038+).
 * 2. Pre-configured tokens: VALID_MOCK_ADMIN_JWT, VALID_MOCK_RECRUITER_JWT, VALID_MOCK_CANDIDATE_JWT.
 * 3. Unified setupAuthenticatedSession() helper injecting all required localStorage keys.
 * 4. Extended test fixtures (adminPage, recruiterPage, candidatePage) for future test files.
 */

export interface MockJwtPayload {
  exp?: number;
  user_id?: number | string;
  user_type?: 'admin' | 'recruiter' | 'candidate' | 'client';
  email?: string;
  first_name?: string;
  last_name?: string;
  [key: string]: any;
}

/**
 * Generates a structurally valid, unexpired base64url JWT token.
 * Compatible with jwtDecode() in Angular's authGuard and HTTP interceptors.
 */
export function generateMockJwt(payload: MockJwtPayload = {}): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  // Year 2038+ future expiration timestamp (253402300799)
  const exp = payload.exp ?? 253402300799;
  const fullPayload = {
    exp,
    user_id: payload.user_id ?? 1,
    user_type: payload.user_type ?? 'admin',
    email: payload.email ?? 'admin@flashyre.com',
    ...payload,
  };
  const b64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
  const b64Payload = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
  return `${b64Header}.${b64Payload}.mock_valid_signature_flashyre_e2e`;
}

// Pre-configured valid JWT constants for the 3 main platform roles
export const VALID_MOCK_ADMIN_JWT = generateMockJwt({
  user_id: 1,
  user_type: 'admin',
  email: 'admin@flashyre.com',
  first_name: 'Super',
  last_name: 'Admin',
});

export const VALID_MOCK_RECRUITER_JWT = generateMockJwt({
  user_id: 102,
  user_type: 'recruiter',
  email: 'recruiter@flashyre.com',
  first_name: 'Alex',
  last_name: 'Recruiter',
});

export const VALID_MOCK_CANDIDATE_JWT = generateMockJwt({
  user_id: 501,
  user_type: 'candidate',
  email: 'candidate@flashyre.com',
  first_name: 'Candidate',
  last_name: 'User',
});

// Backwards-compatible aliases matching older test fixtures
export const MOCK_ADMIN_JWT = VALID_MOCK_ADMIN_JWT;
export const MOCK_RECRUITER_JWT = VALID_MOCK_RECRUITER_JWT;
export const VALID_MOCK_JWT = VALID_MOCK_ADMIN_JWT;

export interface AuthSessionOptions {
  jwt?: string;
  userId?: string | number;
  email?: string;
  firstName?: string;
  lastName?: string;
  isSuperUser?: boolean;
  extraStorage?: Record<string, string>;
}

/**
 * Injects complete, valid authentication state into the browser page's localStorage
 * BEFORE page navigation runs, satisfying authGuard, role guards, and services.
 */
export async function setupAuthenticatedSession(
  page: Page,
  role: 'admin' | 'recruiter' | 'candidate' | 'client' = 'admin',
  options: AuthSessionOptions = {}
): Promise<void> {
  let defaultJwt = VALID_MOCK_ADMIN_JWT;
  let defaultUserId = '1';
  let defaultEmail = 'admin@flashyre.com';
  let defaultFirstName = 'Super';
  let defaultLastName = 'Admin';
  let defaultIsSuper = true;

  if (role === 'recruiter') {
    defaultJwt = VALID_MOCK_RECRUITER_JWT;
    defaultUserId = '102';
    defaultEmail = 'recruiter@flashyre.com';
    defaultFirstName = 'Alex';
    defaultLastName = 'Recruiter';
    defaultIsSuper = false;
  } else if (role === 'candidate') {
    defaultJwt = VALID_MOCK_CANDIDATE_JWT;
    defaultUserId = '501';
    defaultEmail = 'candidate@flashyre.com';
    defaultFirstName = 'Candidate';
    defaultLastName = 'User';
    defaultIsSuper = false;
  }

  const jwt = options.jwt ?? defaultJwt;
  const userId = String(options.userId ?? defaultUserId);
  const email = options.email ?? defaultEmail;
  const firstName = options.firstName ?? defaultFirstName;
  const lastName = options.lastName ?? defaultLastName;
  const isSuperUser = options.isSuperUser !== undefined ? options.isSuperUser : defaultIsSuper;

  await page.addInitScript((data) => {
    localStorage.setItem('auth_token', data.jwt);
    localStorage.setItem('jwtToken', data.jwt);
    localStorage.setItem('token', data.jwt);
    localStorage.setItem('refreshToken', 'mock-valid-refresh-token-session');
    localStorage.setItem('userType', data.role);
    localStorage.setItem('user_type', data.role);
    localStorage.setItem('user_role', data.role);
    localStorage.setItem('userId', data.userId);
    localStorage.setItem('user_id', data.userId);
    localStorage.setItem('isSuperUser', data.isSuperUser ? 'true' : 'false');
    localStorage.setItem('userEmail', data.email);
    localStorage.setItem('email', data.email);
    localStorage.setItem('firstName', data.firstName);
    localStorage.setItem('lastName', data.lastName);

    if (data.extra) {
      for (const [key, value] of Object.entries(data.extra)) {
        localStorage.setItem(key, String(value));
      }
    }
  }, {
    jwt,
    role,
    userId,
    email,
    firstName,
    lastName,
    isSuperUser,
    extra: options.extraStorage,
  });
}

/**
 * Extended Playwright Test Fixture for future and existing test files.
 * Provides pre-authenticated page fixtures (`adminPage`, `recruiterPage`, `candidatePage`).
 * 
 * Usage in future test files:
 * ```typescript
 * import { test, expect } from './auth-helpers'; // or './test-helpers'
 * 
 * test('View Admin Dashboard', async ({ adminPage }) => {
 *   await adminPage.goto('/recruiter-workflow-bulk-import');
 *   // Already fully authenticated with valid JWT!
 * });
 * ```
 */
export const test = baseTest.extend<{
  adminPage: Page;
  recruiterPage: Page;
  candidatePage: Page;
  authedPage: Page;
}>({
  adminPage: async ({ page }, use) => {
    await setupAuthenticatedSession(page, 'admin');
    await use(page);
  },
  recruiterPage: async ({ page }, use) => {
    await setupAuthenticatedSession(page, 'recruiter');
    await use(page);
  },
  candidatePage: async ({ page }, use) => {
    await setupAuthenticatedSession(page, 'candidate');
    await use(page);
  },
  authedPage: async ({ page }, use) => {
    await setupAuthenticatedSession(page, 'admin');
    await use(page);
  },
});

export const expect = baseExpect;
