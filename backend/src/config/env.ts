import dotenv from 'dotenv';

// Load environment variables from .env
dotenv.config();

export interface AppConfig {
  PORT: number;
  NODE_ENV: string;
  FRONTEND_URL: string;
  DATABASE_URL: string;
  DIRECT_URL: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_PUBLISHABLE_KEY: string;
  SUPABASE_SECRET_KEY: string;
  JWT_SECRET: string;
  DB_FALLBACK_MODE: boolean;
  CORS_ORIGIN: string;
  AUTH_REDIRECT_URL: string;
  TRUST_PROXY_HOPS: number;
  SMTP_HOST: string;
  SMTP_PORT: number;
  SMTP_SECURE: boolean;
  SMTP_USER: string;
  SMTP_PASS: string;
  EMAIL_FROM: string;
}

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// If Supabase credentials are not provided, gracefully engage fallback mode
const isSupabaseConfigured = Boolean(supabaseUrl.trim() && supabaseKey.trim());

if (!isSupabaseConfigured) {
  console.warn(
    '\x1b[33m%s\x1b[0m',
    '[Brightloop Backend WARNING] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing in environment.'
  );
  console.warn(
    '\x1b[36m%s\x1b[0m',
    '[Brightloop Backend INFO] Seamlessly activating DB_FALLBACK_MODE (In-Memory / Local Repository Store). No crash occurred.'
  );
}

export const env: AppConfig = {
  PORT: Number(process.env.PORT) || 4000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  DATABASE_URL: process.env.DATABASE_URL || '',
  DIRECT_URL: process.env.DIRECT_URL || '',
  SUPABASE_URL: supabaseUrl,
  SUPABASE_SERVICE_ROLE_KEY: supabaseKey,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
  SUPABASE_PUBLISHABLE_KEY: process.env.SUPABASE_PUBLISHABLE_KEY || '',
  SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY || '',
  JWT_SECRET: process.env.JWT_SECRET || 'brightloop_jwt_secret_dev_2026_super_secure',
  DB_FALLBACK_MODE: !isSupabaseConfigured || process.env.DB_FALLBACK_MODE === 'true',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:3000',
  AUTH_REDIRECT_URL: process.env.AUTH_REDIRECT_URL || 'http://localhost:5173/reset-password',
  TRUST_PROXY_HOPS: Number(process.env.TRUST_PROXY_HOPS) || 0,
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: Number(process.env.SMTP_PORT) || 587,
  SMTP_SECURE: process.env.SMTP_SECURE === 'true',
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  EMAIL_FROM: process.env.EMAIL_FROM || '',
};
