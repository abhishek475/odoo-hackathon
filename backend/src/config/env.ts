import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env
dotenv.config();

export interface AppConfig {
  PORT: number;
  NODE_ENV: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  SUPABASE_ANON_KEY: string;
  JWT_SECRET: string;
  DB_FALLBACK_MODE: boolean;
  CORS_ORIGIN: string;
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
  SUPABASE_URL: supabaseUrl,
  SUPABASE_SERVICE_ROLE_KEY: supabaseKey,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
  JWT_SECRET: process.env.JWT_SECRET || 'brightloop_jwt_secret_dev_2026_super_secure',
  DB_FALLBACK_MODE: !isSupabaseConfigured || process.env.DB_FALLBACK_MODE === 'true',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:3000',
};
