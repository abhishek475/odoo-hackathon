import { Router, Request, Response } from 'express';
import { dataStore } from '../repository/dataStore.js';
import { validateBody } from '../middleware/validate.js';
import {
  SubscriptionCreateSchema,
  SubscriptionTransitionSchema,
  TemplateCreateSchema,
} from '../types/models.js';

const router = Router();

// GET /api/v1/subscriptions
router.get('/subscriptions', async (req: Request, res: Response): Promise<void> => {
  try {
    const customerId = req.query.customerId as string | undefined;
    const subscriptions = await dataStore.getSubscriptions(customerId);
    res.json(subscriptions);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Failed to fetch subscriptions' });
  }
});

// POST /api/v1/subscriptions
router.post('/subscriptions', validateBody(SubscriptionCreateSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const newSub = await dataStore.createSubscription(req.body);
    res.status(201).json(newSub);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Failed to create subscription' });
  }
});

// PATCH /api/v1/subscriptions/:id/transition
router.patch('/subscriptions/:id/transition', validateBody(SubscriptionTransitionSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id;
    const { status, performedBy, note } = req.body;
    const updated = await dataStore.updateSubscriptionStatus(id, status, performedBy, note);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ success: false, error: err?.message || 'Subscription transition failed' });
  }
});

// GET /api/v1/templates
router.get('/templates', async (_req: Request, res: Response): Promise<void> => {
  try {
    const templates = await dataStore.getTemplates();
    res.json(templates);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Failed to fetch templates' });
  }
});

// POST /api/v1/templates
router.post('/templates', validateBody(TemplateCreateSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const newTemplate = await dataStore.createTemplate(req.body);
    res.status(201).json(newTemplate);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Failed to create template' });
  }
});

export default router;
