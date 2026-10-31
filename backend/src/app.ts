import { randomUUID } from 'node:crypto';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';
import type { Dependencies } from './types.js';
import { authenticate } from './middleware.js';
import { AppError, errorHandler } from './lib/errors.js';
import { authRoutes, userRoutes } from './routes/auth.js';
import { catalogRoutes } from './routes/catalog.js';
import { subscriptionRoutes } from './routes/subscriptions.js';
import { invoiceRoutes } from './routes/invoices.js';
import { reportRoutes } from './routes/reports.js';

export function createApp(deps: Dependencies) {
  const app = express(); app.disable('x-powered-by');
  if (deps.config.TRUST_PROXY_HOPS > 0) app.set('trust proxy', deps.config.TRUST_PROXY_HOPS);
  app.use((req, res, next) => { req.requestId = randomUUID(); res.setHeader('X-Request-Id', req.requestId); res.setHeader('Cache-Control', 'no-store'); next(); });
  app.use(helmet({ contentSecurityPolicy: { directives: { styleSrc: ["'self'", "'unsafe-inline'"] } } }));
  app.use(cors({ origin: deps.config.FRONTEND_URL, methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'], allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key'] }));
  app.use(express.json({ limit: '256kb' }));
  app.use(rateLimit({ windowMs: 60 * 1000, limit: 300, standardHeaders: 'draft-8', legacyHeaders: false,
    message: { error: { code: 'RATE_LIMIT', message: 'Too many requests; try again later' } } }));
  app.get('/health', (_req, res) => res.json({ data: { status: 'ok', service: 'brightloop-engineer2' } }));
  app.get('/ready', async (_req, res) => {
    await deps.db.$queryRaw`SELECT 1`; res.json({ data: { status: 'ready' } });
  });
  app.use('/api/auth', authRoutes(deps));
  const api = express.Router(); api.use(authenticate(deps));
  api.use(userRoutes(deps)); api.use(catalogRoutes(deps)); api.use(subscriptionRoutes(deps)); api.use(invoiceRoutes(deps)); api.use('/reports', reportRoutes(deps));
  app.use('/api', api);
  app.use((_req, _res) => { throw new AppError(404, 'NOT_FOUND', 'Endpoint not found'); });
  app.use(errorHandler);
  return app;
}
