import { Router, Request, Response } from 'express';
import { dataStore } from '../repository/dataStore.js';
import { validateBody } from '../middleware/validate.js';
import { ProductCreateSchema, PlanCreateSchema } from '../types/models.js';

const router = Router();

// GET /api/v1/products
router.get('/products', async (_req: Request, res: Response): Promise<void> => {
  try {
    const products = await dataStore.getProducts();
    res.json(products);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Failed to fetch products' });
  }
});

// POST /api/v1/products
router.post('/products', validateBody(ProductCreateSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const newProduct = await dataStore.createProduct(req.body);
    res.status(201).json(newProduct);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Failed to create product' });
  }
});

// GET /api/v1/plans
router.get('/plans', async (_req: Request, res: Response): Promise<void> => {
  try {
    const plans = await dataStore.getPlans();
    res.json(plans);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Failed to fetch billing plans' });
  }
});

// POST /api/v1/plans
router.post('/plans', validateBody(PlanCreateSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const newPlan = await dataStore.createPlan(req.body);
    res.status(201).json(newPlan);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Failed to create billing plan' });
  }
});

export default router;
