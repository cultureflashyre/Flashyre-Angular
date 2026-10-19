import { test as setup, expect } from '@playwright/test';
import fs from 'fs';
import { API_URL, AUTH_DIR, ROLES, TEST_ENV, creds, statePath } from '../config/env';

/**
 * Logs every QA role in once and saves the browser session for the tests.
 *
 * QA_LOGIN_MODE=api (default): gets tokens from api/auth/token/ and stores them the way the login page does.
 *   The login page is protected by a Cloudflare Turnstile CAPTCHA that a script cannot pass on dev/prod.
 * QA_LOGIN_MODE=ui: types into the real login page. Works locally when Django uses Cloudflare's test keys
 *   (TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA, TURNSTILE_ALLOW_TEST_KEYS=True).
 */
setup.describe.configure({ mode: 'serial' });

setup('prepare auth folder', async () => {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
});

function claims(jwt: string): Record<string, any> {
  return JSON.parse(Buffer.from(jwt.split('.')[1], 'base64url').toString('utf8'));
}

for (const role of ROLES) {
  setup(`login ${role}`, async ({ page, playwright }) => {
    const c = creds(role);
    setup.skip(!c, `No credentials for ${role}: set QA_PASSWORD (or QA_${role.toUpperCase()}_PASSWORD) in e2e/config/.env.${TEST_ENV}`);
    const mode = process.env['QA_LOGIN_MODE'] ?? 'api';

    if (mode === 'ui') {
      await page.goto('/login');
      await page.locator('#login-email-input').fill(c!.email);
      await page.locator('#login-password-input').fill(c!.password);
      await page.locator('#login-button-container').click();
      await expect.poll(() => page.evaluate(() => localStorage.getItem('jwtToken')),
        { message: `login failed for ${c!.email}`, timeout: 30_000 }).toBeTruthy();
      await page.waitForURL(url => !url.pathname.startsWith('/login'), { timeout: 30_000 });
    } else {
      const api = await playwright.request.newContext({ baseURL: API_URL, ignoreHTTPSErrors: true });
      const r = await api.post('api/auth/token/', { data: { email: c!.email, password: c!.password } });
      expect(r.status(), `token request for ${c!.email} returned ${r.status()} ${await r.text()}`).toBe(200);
      const tok = await r.json();
      await api.dispose();
      const cl = claims(tok.access);
      const items: Record<string, string> = {
        jwtToken: tok.access, refreshToken: tok.refresh, userType: cl.role ?? '', user_id: String(cl.user_id ?? ''),
        firstName: 'QA', lastName: role,
      };
      if (role === 'super') items['isSuperUser'] = 'true';
      await page.goto('/');                       // any page of the app, so localStorage belongs to its origin
      await page.evaluate(i => { for (const [k, v] of Object.entries(i)) localStorage.setItem(k, v as string); }, items);
    }
    await page.context().storageState({ path: statePath(role) });
  });
}
