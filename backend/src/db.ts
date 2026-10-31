import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client.js';

export function createDatabase(connectionString: string, maxConnections = 10) {
  return new PrismaClient({ adapter: new PrismaPg({ connectionString, max: maxConnections, connectionTimeoutMillis: 10000 }) });
}
