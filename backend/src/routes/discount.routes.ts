import { Router, Request, Response } from 'express';
import { dataStore } from '../repository/dataStore.js';
import { validateBody } from '../middleware/validate.js';
import { DiscountCreateSchema } from '../types/models.js';

const router = Router();

// GET /api/v1/discounts
router.get('/discounts', async (_req: Request, res: Response): Promise<void> => {
  try {
    const discounts = await dataStore.getDiscounts();
    res.json(discounts);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Failed to fetch discount rules' });
  }
});

// POST /api/v1/discounts
router.post('/discounts', validateBody(DiscountCreateSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const newDiscount = await dataStore.createDiscount(req.body);
    res.status(201).json(newDiscount);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Failed to create discount rule' });
  }
});

// PATCH /api/v1/discounts/:id/toggle
router.patch('/discounts/:id/toggle', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id;
    const toggled = await dataStore.toggleDiscount(id);
    res.json(toggled);
  } catch (err: any) {
    res.status(404).json({ success: false, error: err?.message || 'Discount toggle failed' });
  }
});

export default router;
