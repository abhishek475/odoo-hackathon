import { Router, Request, Response } from 'express';
import { dataStore } from '../repository/dataStore.js';

const router = Router();

// GET /api/v1/analytics/finance-metrics
router.get('/finance-metrics', async (_req: Request, res: Response): Promise<void> => {
  try {
    const t0 = performance.now();
    const metrics = await dataStore.getFinanceMetrics();
    const durationMs = performance.now() - t0;

    res.setHeader('X-Response-Time-Ms', durationMs.toFixed(2));
    res.json(metrics);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Failed to compute finance metrics' });
  }
});

export default router;
