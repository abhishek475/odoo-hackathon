import { Router, Request, Response } from 'express';
import { dataStore } from '../repository/dataStore.js';
import { validateBody } from '../middleware/validate.js';
import { BillingBatchRunSchema, InvoiceStatusUpdateSchema } from '../types/models.js';

const router = Router();

// GET /api/v1/invoices
router.get('/invoices', async (req: Request, res: Response): Promise<void> => {
  try {
    const customerId = req.query.customerId as string | undefined;
    const invoices = await dataStore.getInvoices(customerId);
    res.json(invoices);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Failed to fetch invoices' });
  }
});

// POST /api/v1/billing/batch-run
router.post('/batch-run', validateBody(BillingBatchRunSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const { billingDate } = req.body;
    const result = await dataStore.runBillingBatch(billingDate);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Billing batch run failed' });
  }
});

// PATCH /api/v1/invoices/:id/status
router.patch('/invoices/:id/status', validateBody(InvoiceStatusUpdateSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id;
    const { status } = req.body;
    const updated = await dataStore.updateInvoiceStatus(id, status);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ success: false, error: err?.message || 'Invoice status update failed' });
  }
});

export default router;
