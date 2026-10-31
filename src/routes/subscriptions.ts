import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import type { Dependencies } from '../types.js';
import type { Prisma } from '../generated/prisma/client.js';
import type { SubscriptionAction } from '../services/core.js';
import { staff, ownership } from '../middleware.js';
import { assert, notFound } from '../lib/errors.js';
import { D, addDays, asDate, audit, dateInput, dateOnly, listResult, pagination, paramId, uuid } from '../lib/utils.js';
import { lineSchema, validateLineReferences } from './catalog.js';

const createSchema = z.object({
  customerId: uuid, planId: uuid.optional(), templateId: uuid.optional(),
  startDate: dateInput, expiryDate: dateInput,
  paymentTermsDays: z.number().int().min(0).max(365).default(14),
  lines: z.array(lineSchema).min(1).max(100).optional(),
}).strict().refine(input => input.planId || input.templateId, 'Provide planId or templateId');
const editSchema = z.object({ startDate: dateInput.optional(), expiryDate: dateInput.optional(),
  paymentTermsDays: z.number().int().min(0).max(365).optional(), lines: z.array(lineSchema).min(1).max(100).optional() }).strict();

async function snapshotLines(tx: Prisma.TransactionClient, input: z.infer<typeof lineSchema>[]) {
  await validateLineReferences(tx, input);
  return Promise.all(input.map(async line => {
    const product = (await tx.product.findUnique({ where: { id: line.productId } }))!;
    const variant = line.variantId ? await tx.productVariant.findUnique({ where: { id: line.variantId } }) : null;
    const tax = line.taxRuleId ? await tx.taxRule.findUnique({ where: { id: line.taxRuleId } }) : null;
    const unitPrice = D(product.salesPrice).add(variant?.priceModifier.toString() ?? '0');
    assert(unitPrice.gte(0) && unitPrice.lte('9999999999.9999'), 400, 'INVALID_PRICE', 'Configured product/variant price is outside the supported range');
    return { productId: line.productId, variantId: line.variantId ?? null, taxRuleId: line.taxRuleId ?? null,
      description: `${product.name}${variant ? ` - ${variant.name}` : ''}`, quantity: line.quantity, unitPrice: unitPrice.toFixed(4),
      taxName: tax?.name ?? null, taxRate: tax?.rate.toString() ?? '0' };
  }));
}
const customerSelect = { id: true, name: true, email: true };
export function subscriptionRoutes(deps: Dependencies) {
  const router = Router();
  router.get('/subscriptions', async (req, res) => {
    const p = pagination(req), q = z.object({
      status: z.enum(['DRAFT', 'QUOTATION', 'CONFIRMED', 'ACTIVE', 'PAUSED', 'CLOSED']).optional(),
      customerId: uuid.optional(), search: z.string().max(120).optional(),
    }).parse(req.query);
    const where: Prisma.SubscriptionWhereInput = { ...(q.status ? { status: q.status } : {}),
      ...(q.customerId ? { customerId: q.customerId } : {}), ...ownership(req.viewer),
      ...(q.search ? { number: { contains: q.search, mode: 'insensitive' } } : {}),
    };
    const [data, total] = await Promise.all([
      deps.db.subscription.findMany({ where, include: { customer: { select: customerSelect }, plan: { select: { id: true, name: true } } },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], skip: p.skip, take: p.take }),
      deps.db.subscription.count({ where }),
    ]); res.json(listResult(data, total, p.page, p.pageSize));
  });
  router.get('/subscriptions/:id', async (req, res) => {
    const data = await deps.db.subscription.findFirst({ where: { id: paramId(req), ...ownership(req.viewer) },
      include: { customer: { select: customerSelect }, plan: true, lines: true,
        discounts: { include: { discount: { select: { id: true, code: true, type: true, value: true, validFrom: true, validTo: true, productId: true } } } },
        invoices: { orderBy: { periodStart: 'desc' }, take: 100 } } });
    if (!data) throw notFound('Subscription'); res.json({ data });
  });
  router.post('/subscriptions', staff, async (req, res) => {
    const input = createSchema.parse(req.body);
    const data = await deps.db.$transaction(async tx => {
      const customer = await tx.user.findUnique({ where: { id: input.customerId } });
      assert(customer?.active && customer.role === 'CUSTOMER', 400, 'INVALID_CUSTOMER', 'Choose an active customer who has signed in at least once');
      const template = input.templateId ? await tx.quotationTemplate.findUnique({ where: { id: input.templateId }, include: { lines: true } }) : null;
      assert(!input.templateId || template, 400, 'INVALID_TEMPLATE', 'Quotation template not found');
      assert(!template || !input.planId || input.planId === template.planId, 400, 'PLAN_MISMATCH', 'The plan must match the quotation template');
      const planId = input.planId ?? template!.planId;
      const plan = await tx.plan.findUnique({ where: { id: planId } });
      assert(plan?.active, 400, 'INVALID_PLAN', 'Plan is missing or inactive');
      const startDate = asDate(input.startDate), expiryDate = asDate(input.expiryDate);
      assert(expiryDate >= startDate, 400, 'INVALID_DATES', 'expiryDate must be on or after startDate');
      assert(startDate >= plan.validFrom && (!plan.validTo || startDate <= plan.validTo), 400, 'PLAN_UNAVAILABLE', 'The plan is not available on the start date');
      const lines = input.lines ?? template?.lines;
      assert(lines?.length, 400, 'LINES_REQUIRED', 'Provide product lines or a template containing lines');
      assert(lines.reduce((sum, line) => sum + line.quantity, 0) >= plan.minQuantity, 400, 'MIN_QUANTITY', 'The plan minimum quantity is not met');
      const snapshots = await snapshotLines(tx, lines);
      const today = dateOnly(deps.now());
      const item = await tx.subscription.create({ data: {
        number: `SUB-${randomUUID().slice(0, 13).toUpperCase()}`, customerId: input.customerId, planId,
        startDate, expiryDate, nextBillingDate: startDate, billingAnchor: startDate,
        quoteValidUntil: addDays(today, template?.validityDays ?? 14), paymentTermsDays: input.paymentTermsDays,
        planPrice: plan.price, cadence: plan.cadence, lines: { create: snapshots },
      }, include: { lines: true } });
      await audit(tx, req.viewer.id, 'subscription.create', 'Subscription', item.id); return item;
    }, { timeout: 15000 }); res.status(201).json({ data });
  });
  router.patch('/subscriptions/:id', staff, async (req, res) => {
    const id = paramId(req), input = editSchema.parse(req.body);
    assert(Object.keys(input).length, 400, 'EMPTY_UPDATE', 'Provide at least one field');
    const data = await deps.db.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM bl_subscriptions WHERE id = ${id}::uuid FOR UPDATE`;
      const old = await tx.subscription.findUnique({ where: { id }, include: { plan: true } }); if (!old) throw notFound('Subscription');
      assert(['DRAFT', 'QUOTATION'].includes(old.status), 409, 'SUBSCRIPTION_LOCKED', 'Only draft/quotation subscriptions can be edited');
      const startDate = input.startDate ? asDate(input.startDate) : old.startDate;
      const expiryDate = input.expiryDate ? asDate(input.expiryDate) : old.expiryDate;
      assert(expiryDate >= startDate, 400, 'INVALID_DATES', 'expiryDate must be on or after startDate');
      assert(startDate >= old.plan.validFrom && (!old.plan.validTo || startDate <= old.plan.validTo), 400, 'PLAN_UNAVAILABLE', 'The plan is not available on the start date');
      if (input.lines) assert(input.lines.reduce((sum, line) => sum + line.quantity, 0) >= old.plan.minQuantity, 400, 'MIN_QUANTITY', 'The plan minimum quantity is not met');
      const snapshots = input.lines ? await snapshotLines(tx, input.lines) : undefined;
      const item = await tx.subscription.update({ where: { id }, data: {
        startDate, expiryDate, paymentTermsDays: input.paymentTermsDays, version: { increment: 1 },
        ...(input.startDate ? { nextBillingDate: startDate, billingAnchor: startDate } : {}),
        ...(snapshots ? { lines: { deleteMany: {}, create: snapshots } } : {}),
      }, include: { lines: true } });
      await audit(tx, req.viewer.id, 'subscription.update', 'Subscription', id); return item;
    }, { timeout: 15000 }); res.json({ data });
  });
  const actions: SubscriptionAction[] = ['quote', 'confirm', 'activate', 'pause', 'resume', 'close', 'renew'];
  for (const action of actions) router.post(`/subscriptions/:id/${action}`, async (req, res) => {
    const id = paramId(req);
    const input = (action === 'renew' ? z.object({ newExpiryDate: dateInput }).strict() : z.object({}).strict()).parse(req.body ?? {});
    res.json({ data: await deps.core.transition(id, action, req.viewer, 'newExpiryDate' in input ? input.newExpiryDate as string : undefined) });
  });
  router.post('/subscriptions/:id/discounts', staff, async (req, res) => {
    const id = paramId(req), { discountId } = z.object({ discountId: uuid }).strict().parse(req.body);
    const data = await deps.db.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM bl_subscriptions WHERE id = ${id}::uuid FOR UPDATE`;
      const sub = await tx.subscription.findUnique({ where: { id } }); if (!sub) throw notFound('Subscription');
      assert(sub.status !== 'CLOSED', 409, 'SUBSCRIPTION_CLOSED', 'Renew the subscription before changing discounts');
      const discount = await tx.discountRule.findUnique({ where: { id: discountId } }); assert(discount?.active, 400, 'INVALID_DISCOUNT', 'Discount is missing or inactive');
      const item = await tx.subscriptionDiscount.upsert({ where: { subscriptionId_discountId: { subscriptionId: id, discountId } }, create: { subscriptionId: id, discountId }, update: {} });
      await audit(tx, req.viewer.id, 'subscription.discount.attach', 'Subscription', id, { discountId }); return item;
    }); res.status(201).json({ data });
  });
  router.delete('/subscriptions/:id/discounts/:discountId', staff, async (req, res) => {
    const subscriptionId = paramId(req), discountId = paramId(req, 'discountId');
    await deps.db.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM bl_subscriptions WHERE id = ${subscriptionId}::uuid FOR UPDATE`;
      await tx.subscriptionDiscount.delete({ where: { subscriptionId_discountId: { subscriptionId, discountId } } });
      await audit(tx, req.viewer.id, 'subscription.discount.detach', 'Subscription', subscriptionId, { discountId });
    }); res.status(204).end();
  });
  return router;
}
