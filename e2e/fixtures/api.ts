import { APIRequestContext, APIResponse, PlaywrightWorkerArgs } from '@playwright/test';
type Playwright = PlaywrightWorkerArgs['playwright'];
import fs from 'fs';
import { API_URL, Role, statePath } from '../config/env';

export function tokenFromState(role: Role): string | null {
  const f = statePath(role);
  if (!fs.existsSync(f)) return null;
  const st = JSON.parse(fs.readFileSync(f, 'utf8'));
  for (const o of st.origins ?? []) {
    const t = (o.localStorage ?? []).find((x: any) => x.name === 'jwtToken');
    if (t) return t.value;
  }
  return null;
}

/** Thin wrapper over Playwright's request context, authenticated as a QA role (or anonymous). */
export class Api {
  constructor(public ctx: APIRequestContext) {}

  static async create(pw: Playwright, role: Role | null): Promise<Api> {
    const token = role ? tokenFromState(role) : null;
    const ctx = await pw.request.newContext({
      baseURL: API_URL,
      extraHTTPHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      ignoreHTTPSErrors: true,
    });
    return new Api(ctx);
  }

  get(path: string, params?: Record<string, string | number | boolean>) { return this.ctx.get(path, { params }); }
  post(path: string, data?: unknown) { return this.ctx.post(path, { data: data as any }); }
  postForm(path: string, multipart: Record<string, any>) { return this.ctx.post(path, { multipart }); }
  patchForm(path: string, multipart: Record<string, any>) { return this.ctx.patch(path, { multipart }); }
  delete(path: string) { return this.ctx.delete(path); }
  async json<T = any>(r: APIResponse): Promise<T> { try { return await r.json(); } catch { return {} as T; } }
  dispose() { return this.ctx.dispose(); }
}
