import { loadEnvFile } from 'node:process';

try { loadEnvFile('backend/.env'); } catch { /* Values may also come from the server environment. */ }
const missing = [];
const placeholder = value => !value || /CHANGE_ME|YOUR_HOST|YOUR_PROJECT|YOUR_.*KEY/.test(value);
for (const key of ['DATABASE_URL', 'SUPABASE_URL', 'SUPABASE_PUBLISHABLE_KEY', 'SUPABASE_SECRET_KEY']) {
  if (placeholder(process.env[key])) missing.push(key);
}
for (const key of ['DATABASE_URL', 'SUPABASE_URL']) {
  if (missing.includes(key)) continue;
  try {
    const url = new URL(process.env[key]);
    if (key === 'DATABASE_URL' ? !['postgres:', 'postgresql:'].includes(url.protocol) : url.protocol !== 'https:') missing.push(key);
  } catch { missing.push(key); }
}
if (missing.length) {
  console.error(`Complete these settings in backend/.env before starting: ${missing.join(', ')}. Values are not logged.`);
  process.exit(1);
}
console.log('Required server environment settings are present. Database connectivity and credentials still require live verification.');
