import { loadConfig } from '../src/config.js';
import { createDatabase } from '../src/db.js';
import { createClient } from '@supabase/supabase-js';

const config = loadConfig(), db = createDatabase(config.DATABASE_URL);
const email = process.argv[2]?.trim().toLowerCase();
if (!email || !email.includes('@')) throw new Error('Usage: npm run admin:bootstrap -- your-email@example.com');
try {
  const auth = createClient(config.SUPABASE_URL, config.SUPABASE_SECRET_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  let found: { id: string; email?: string; email_confirmed_at?: string; user_metadata: Record<string, unknown> } | undefined;
  for (let page = 1; ; page++) {
    const { data, error } = await auth.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error('Could not read Supabase users; check the server credentials');
    found = data.users.find(user => user.email?.toLowerCase() === email);
    if (found || data.users.length < 200) break;
  }
  if (!found) throw new Error('Register this email through signup first, then rerun the command');
  if (!found.email_confirmed_at) throw new Error('Confirm this email before granting admin access');
  const id = found.id, name = typeof found.user_metadata.name === 'string' ? found.user_metadata.name : email;
  await db.$transaction(async tx => {
    await tx.user.upsert({ where: { id }, create: { id, email, name, role: 'ADMIN' }, update: { role: 'ADMIN', active: true } });
    await tx.auditLog.create({ data: { actorId: id, action: 'admin.bootstrap', entityType: 'User', entityId: id } });
  });
  console.log(`Admin access granted to ${email}. Sign in and call GET /api/me.`);
} finally { await db.$disconnect(); }
