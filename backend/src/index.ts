import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { authenticateToken } from './middleware/authMiddleware.js';

import authRoutes from './routes/auth.routes.js';
import catalogRoutes from './routes/catalog.routes.js';
import subscriptionRoutes from './routes/subscription.routes.js';
import billingRoutes from './routes/billing.routes.js';
import discountRoutes from './routes/discount.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';

const app = express();

// Middleware
const allowedOrigins = env.CORS_ORIGIN.split(',').map(o => o.trim());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, or same-origin)
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        callback(null, true);
      } else {
        callback(null, true); // Dev-friendly permissive CORS
      }
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(authenticateToken);

// Healthcheck
app.get(['/health', '/api/v1/health'], (_req: Request, res: Response) => {
  res.json({
    status: 'HEALTHY',
    service: 'Brightloop Subscription & Billing API Engine',
    version: '1.0.0',
    mode: env.DB_FALLBACK_MODE ? 'LOCAL_IN_MEMORY_FALLBACK' : 'SUPABASE_POSTGRES',
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes (Direct 1:1 match with Frontend apiAdapter hooks)
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1', catalogRoutes); // /api/v1/products, /api/v1/plans
app.use('/api/v1', subscriptionRoutes); // /api/v1/subscriptions, /api/v1/templates
app.use('/api/v1/billing', billingRoutes); // /api/v1/billing/batch-run
app.use('/api/v1', billingRoutes); // /api/v1/invoices
app.use('/api/v1', discountRoutes); // /api/v1/discounts
app.use('/api/v1', paymentRoutes); // /api/v1/payments
app.use('/api/v1/analytics', analyticsRoutes); // /api/v1/analytics/finance-metrics

// Global 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Unhandled Server Error]', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error occurred',
  });
});

// Start Server if not imported by test runner
if (process.env.NODE_ENV !== 'test') {
  app.listen(env.PORT, () => {
    console.log(
      '\x1b[32m%s\x1b[0m',
      `🚀 Brightloop Backend Engine running on http://localhost:${env.PORT}`
    );
    console.log(
      '\x1b[36m%s\x1b[0m',
      `📊 Operating Mode: ${env.DB_FALLBACK_MODE ? 'LOCAL IN-MEMORY REPOSITORY (Active)' : 'SUPABASE CLOUD POSTGRES'}`
    );
    console.log(
      '\x1b[35m%s\x1b[0m',
      `🔗 1:1 Matching Frontend API Hooks: http://localhost:${env.PORT}/api/v1`
    );
  });
}

export default app;
