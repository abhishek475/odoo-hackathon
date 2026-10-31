import { loadConfig } from './config.js';
import { createDatabase } from './db.js';
import { createApp } from './app.js';
import { SupabaseAuth } from './services/auth.js';
import { createMailer } from './services/mailer.js';
import { ReferenceCoreEngine } from './services/core.js';

const config = loadConfig();
const db = createDatabase(config.DATABASE_URL);
const now = () => new Date();
await db.$connect();
const app = createApp({ db, config, now, auth: new SupabaseAuth(config), mailer: createMailer(config), core: new ReferenceCoreEngine(db, now) });
const server = app.listen(config.PORT, () => console.log(`Brightloop API listening on http://localhost:${config.PORT}`));
let closing = false;
async function shutdown() {
  if (closing) return; closing = true;
  const forceExit = setTimeout(() => process.exit(1), 10000); forceExit.unref();
  server.close(async () => { await db.$disconnect(); clearTimeout(forceExit); process.exit(0); });
}
process.on('SIGINT', shutdown); process.on('SIGTERM', shutdown);
