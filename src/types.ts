import type { PrismaClient, User } from './generated/prisma/client.js';
import type { Config } from './config.js';
import type { AuthService } from './services/auth.js';
import type { Mailer } from './services/mailer.js';
import type { CoreEngine } from './services/core.js';

export type Viewer = Pick<User, 'id' | 'email' | 'name' | 'role' | 'active'>;
export interface Dependencies {
  db: PrismaClient;
  auth: AuthService;
  mailer: Mailer;
  core: CoreEngine;
  config: Config;
  now: () => Date;
}
declare global {
  namespace Express {
    interface Request { viewer: Viewer; accessToken: string; requestId: string; }
  }
}
