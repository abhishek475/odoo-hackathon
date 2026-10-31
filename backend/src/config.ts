import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  DATABASE_URL: z.string().min(1),
  SUPABASE_URL: z.string().url(),
  SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  SUPABASE_SECRET_KEY: z.string().min(1),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  AUTH_REDIRECT_URL: z.string().url().default('http://localhost:5173/reset-password'),
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(5).default(0),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().default(587),
  SMTP_SECURE: z.enum(['true', 'false']).default('false').transform(v => v === 'true'),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
});
export type Config = z.infer<typeof schema>;
export function loadConfig(): Config {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) throw new Error(`Invalid configuration: ${parsed.error.issues.map(i => i.path.join('.')).join(', ')}`);
  const config = parsed.data;
  if (config.NODE_ENV === 'production' && !config.FRONTEND_URL.startsWith('https://')) {
    throw new Error('FRONTEND_URL must use HTTPS in production');
  }
  return config;
}
