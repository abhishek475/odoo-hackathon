import { loadConfig } from '../src/config.js';
import { createDatabase } from '../src/db.js';
import { createClient } from '@supabase/supabase-js';

const config = loadConfig();
const db = createDatabase(config.DATABASE_URL);

const email = (process.argv[2] || 'admin@brightloop.io').trim().toLowerCase();
const password = process.argv[3] || 'Admin@Brightloop2026!';
const name = process.argv[4] || 'Brightloop Administrator';

async function seedAdmin() {
  const auth = createClient(config.SUPABASE_URL, config.SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  console.log(`Seeding example admin account: ${email}...`);

  // Check if user already exists in Supabase Auth
  const { data: users, error: listErr } = await auth.auth.admin.listUsers();
  if (listErr) throw new Error(`Could not query Supabase users: ${listErr.message}`);

  let existing = users?.users?.find(u => u.email?.toLowerCase() === email);
  let userId: string;

  if (existing) {
    userId = existing.id;
    console.log(`Found existing Supabase Auth user (${userId}). Updating credentials...`);
    const { error: updateErr } = await auth.auth.admin.updateUserById(userId, {
      password,
      email_confirm: true,
      user_metadata: { name }
    });
    if (updateErr) throw new Error(`Failed to update Supabase user: ${updateErr.message}`);
  } else {
    console.log('Creating new user in Supabase Auth...');
    const { data: created, error: createErr } = await auth.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name }
    });
    if (createErr || !created.user) {
      throw new Error(`Failed to create Supabase user: ${createErr?.message}`);
    }
    userId = created.user.id;
    console.log(`Created Supabase Auth user (${userId}).`);
  }

  // Upsert into database bl_users
  const existingByEmail = await db.user.findUnique({ where: { email } });
  if (existingByEmail && existingByEmail.id !== userId) {
    await db.user.delete({ where: { id: existingByEmail.id } });
  }

  await db.user.upsert({
    where: { id: userId },
    create: { id: userId, email, name, role: 'ADMIN', active: true },
    update: { email, name, role: 'ADMIN', active: true }
  });

  await db.auditLog.create({
    data: {
      actorId: userId,
      action: 'admin.bootstrap',
      entityType: 'User',
      entityId: userId,
      details: { seededAt: new Date().toISOString() }
    }
  });

  console.log('Successfully seeded admin user in database (bl_users)!');
  console.log('==================================================');
  console.log(`Email:    ${email}`);
  console.log(`Password: ${password}`);
  console.log(`Role:     ADMIN`);
  console.log(`ID:       ${userId}`);
  console.log('==================================================');
}

seedAdmin()
  .catch(err => {
    console.error('Failed to seed admin account:', err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
