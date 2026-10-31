import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from './env.js';

let supabaseAdmin: SupabaseClient | null = null;
let supabaseAnon: SupabaseClient | null = null;

const isTestEnv = process.env.NODE_ENV === 'test' || Boolean(process.env.VITEST);

if (!isTestEnv && !env.DB_FALLBACK_MODE && env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
  try {
    supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    if (env.SUPABASE_ANON_KEY) {
      supabaseAnon = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
    }
  } catch (error) {
    console.error('[Supabase Init Error] Failed to initialize Supabase client:', error);
    supabaseAdmin = null;
    supabaseAnon = null;
  }
}

export { supabaseAdmin, supabaseAnon };
