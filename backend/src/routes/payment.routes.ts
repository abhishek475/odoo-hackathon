import { Router, Request, Response } from 'express';
import { dataStore } from '../repository/dataStore.js';
import { validateBody } from '../middleware/validate.js';
import { PaymentLogSchema } from '../types/models.js';

const router = Router();

// GET /api/v1/payments
router.get('/payments', async (_req: Request, res: Response): Promise<void> => {
  try {
    const payments = await dataStore.getPayments();
    res.json(payments);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Failed to fetch payments' });
  }
});

// POST /api/v1/payments
router.post('/payments', validateBody(PaymentLogSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const newPayment = await dataStore.logPayment(req.body);
    res.status(201).json(newPayment);
  } catch (err: any) {
    res.status(400).json({ success: false, error: err?.message || 'Payment logging failed' });
  }
});

export default router;
