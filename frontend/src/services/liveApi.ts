import { apiConfig } from './apiConfig';

export interface Viewer { id: string; name: string; email: string; role: 'ADMIN' | 'STAFF' | 'CUSTOMER' }
export interface Session { access_token: string; refresh_token: string; expires_at?: number }
export interface Page<T> { data: T[]; pagination: { page: number; pageSize: number; total: number; pages: number } }
export type RecordData = { id: string; [key: string]: unknown };
export class ApiError extends Error {
  constructor(message: string, readonly status: number, readonly code: string, readonly requestId?: string) { super(message); }
}

/** One API origin, server-authenticated roles, no demo fallback or privileged browser keys. */
export class LiveApi {
  private session: Session | null = null;
  private refreshing: Promise<void> | null = null;
  constructor(readonly baseUrl = apiConfig.baseUrl ?? '/api', private transport: typeof fetch = fetch) {}
  setSession(session: Session | null) { this.session = session; }
  hasSession() { return Boolean(this.session); }
  async request<T>(path: string, options: RequestInit = {}, retry = true): Promise<T> {
    const headers = new Headers(options.headers);
    if (options.body) headers.set('Content-Type', 'application/json');
    if (this.session) headers.set('Authorization', `Bearer ${this.session.access_token}`);
    let response: Response;
    try { response = await this.transport.call(globalThis, `${this.baseUrl}${path}`, { ...options, headers, signal: options.signal ?? AbortSignal.timeout(15000) }); }
    catch { throw new ApiError('Cannot reach the API. Check that the backend is running and try again.', 0, 'NETWORK_ERROR'); }
    if (response.status === 401 && retry && this.session?.refresh_token && !path.startsWith('/auth/')) {
      this.refreshing ??= this.refresh().finally(() => { this.refreshing = null; });
      await this.refreshing;
      return this.request<T>(path, options, false);
    }
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      const error = body.error;
      const fields = Array.isArray(error?.details) ? error.details.map((d: { field?: string; message?: string }) => `${d.field ?? 'Field'}: ${d.message ?? 'Invalid value'}`).join('; ') : '';
      throw new ApiError(`${error?.message ?? `Request failed (${response.status})`}${fields ? `. ${fields}` : ''}`, response.status, error?.code ?? 'API_ERROR', error?.requestId);
    }
    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
  }
  async refresh() {
    try {
      const result = await this.request<{ data: { session: Session } }>('/auth/refresh', { method: 'POST', body: JSON.stringify({ refreshToken: this.session?.refresh_token }) }, false);
      this.session = result.data.session;
    } catch (error) { this.session = null; throw error; }
  }
  async login(email: string, password: string) {
    const result = await this.post<{ session: Session }>('/auth/login', { email, password });
    this.session = result.session;
    return this.me();
  }
  async me() { return (await this.request<{ data: Viewer }>('/me')).data; }
  async logout() { try { await this.post('/auth/logout', {}); } finally { this.session = null; } }
  async get<T>(path: string) { return (await this.request<{ data: T }>(path)).data; }
  async post<T = unknown>(path: string, body: unknown, headers?: HeadersInit): Promise<T> {
    const result = await this.request<{ data: T } | undefined>(path, { method: 'POST', body: JSON.stringify(body), headers });
    return result?.data as T;
  }
  async patch<T>(path: string, body: unknown) { return (await this.request<{ data: T }>(path, { method: 'PATCH', body: JSON.stringify(body) })).data; }
  async printInvoice(id: string) {
    // Fetch protected HTML with the current bearer token; isolate it from the application origin.
    const html = await this.requestText(`/invoices/${encodeURIComponent(id)}/print`);
    return html;
  }
  private async requestText(path: string): Promise<string> {
    const response = await this.transport.call(globalThis, `${this.baseUrl}${path}`, { headers: { Authorization: `Bearer ${this.session?.access_token ?? ''}` }, signal: AbortSignal.timeout(15000) });
    if (response.status === 401 && this.session?.refresh_token) { await this.refresh(); return this.requestTextOnce(path); }
    if (!response.ok) throw new ApiError(`Invoice export failed (${response.status})`, response.status, 'PRINT_FAILED');
    return response.text();
  }
  private async requestTextOnce(path: string) {
    const response = await this.transport.call(globalThis, `${this.baseUrl}${path}`, { headers: { Authorization: `Bearer ${this.session?.access_token ?? ''}` }, signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new ApiError(`Invoice export failed (${response.status})`, response.status, 'PRINT_FAILED');
    return response.text();
  }
}
export const liveApi = new LiveApi();
