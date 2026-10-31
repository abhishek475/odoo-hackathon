import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Config } from '../config.js';
import { AppError } from '../lib/errors.js';

export interface AuthIdentity { id: string; email: string; name: string; }
export interface AuthService {
  verify(token: string): Promise<AuthIdentity>;
  signup(email: string, password: string, name: string): Promise<unknown>;
  login(email: string, password: string): Promise<unknown>;
  refresh(refreshToken: string): Promise<unknown>;
  logout(token: string): Promise<void>;
  reset(email: string): Promise<void>;
  password(token: string, password: string): Promise<void>;
  invite(email: string, name: string): Promise<AuthIdentity>;
}
export class SupabaseAuth implements AuthService {
  private admin: SupabaseClient;
  constructor(private config: Config) {
    this.admin = createClient(config.SUPABASE_URL, config.SUPABASE_SECRET_KEY, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
  }
  private client(token?: string) {
    // New stateless client for each operation: never share one user's session with another request.
    return createClient(this.config.SUPABASE_URL, this.config.SUPABASE_PUBLISHABLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      ...(token ? { global: { headers: { Authorization: `Bearer ${token}` } } } : {}),
    });
  }
  async verify(token: string) {
    const { data, error } = await this.client().auth.getUser(token);
    if (error || !data.user?.email) throw new AppError(401, 'UNAUTHENTICATED', 'Invalid or expired access token');
    const rawName = data.user.user_metadata?.name;
    return { id: data.user.id, email: data.user.email.toLowerCase(), name: typeof rawName === 'string' ? rawName.slice(0, 120) : data.user.email };
  }
  async signup(email: string, password: string, name: string) {
    const { data, error } = await this.client().auth.signUp({ email, password, options: { data: { name } } });
    if (error) throw new AppError(400, 'SIGNUP_FAILED', 'Unable to create account; check the credentials or try logging in');
    return { session: data.session, requiresEmailConfirmation: !data.session,
      message: 'If registration is available for this address, follow the email instructions or sign in.' };
  }
  async login(email: string, password: string) {
    const { data, error } = await this.client().auth.signInWithPassword({ email, password });
    if (error || !data.session) throw new AppError(401, 'LOGIN_FAILED', 'Invalid credentials or email confirmation required');
    return { session: data.session };
  }
  async refresh(refreshToken: string) {
    const { data, error } = await this.client().auth.refreshSession({ refresh_token: refreshToken });
    if (error || !data.session) throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'Sign in again');
    return { session: data.session };
  }
  async logout(token: string) {
    const { error } = await this.admin.auth.admin.signOut(token, 'local');
    if (error) throw new AppError(400, 'LOGOUT_FAILED', 'Could not revoke the session');
  }
  async reset(email: string) {
    const { error } = await this.client().auth.resetPasswordForEmail(email, { redirectTo: this.config.AUTH_REDIRECT_URL });
    if (error) throw new AppError(503, 'RESET_UNAVAILABLE', 'Password recovery is temporarily unavailable');
  }
  async password(token: string, password: string) {
    const { error } = await this.client(token).auth.updateUser({ password });
    if (error) throw new AppError(400, 'PASSWORD_UPDATE_FAILED', 'Password update failed; sign in or request a new recovery link');
  }
  async invite(email: string, name: string) {
    const { data, error } = await this.admin.auth.admin.inviteUserByEmail(email, {
      data: { name }, redirectTo: this.config.AUTH_REDIRECT_URL,
    });
    if (error || !data.user?.email) throw new AppError(409, 'INVITATION_FAILED', 'Cannot invite this address; check whether it is already registered');
    return { id: data.user.id, email: data.user.email.toLowerCase(), name };
  }
}
