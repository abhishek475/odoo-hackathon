import { Router } from 'express';
import { z } from 'zod';
import type { Dependencies } from '../types.js';
import { admin, staff } from '../middleware.js';
import { assert, notFound } from '../lib/errors.js';
import { D, asDate, audit, dateInput, decimalInput, listResult, pagination, paramId, rateInput, uuid } from '../lib/utils.js';

const name = z.string().trim().min(1).max(160);
const productSchema = z.object({ name, type: name, salesPrice: decimalInput, costPrice: decimalInput, notes: z.string().max(4000).nullable().optional(), active: z.boolean().optional() }).strict();
const variantSchema = z.object({ name, priceModifier: z.string().regex(/^-?\d{1,10}(\.\d{1,4})?$/), active: z.boolean().optional() }).strict();
const planSchema = z.object({ name, price: decimalInput, cadence: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']),
  minQuantity: z.number().int().min(1).max(100000).optional(), validFrom: dateInput, validTo: dateInput.nullable().optional(),
  autoClose: z.boolean().optional(), allowPause: z.boolean().optional(), allowEarlyClose: z.boolean().optional(),
  allowRenew: z.boolean().optional(), active: z.boolean().optional() }).strict();
const taxSchema = z.object({ name, rate: rateInput, active: z.boolean().optional() }).strict();
const discountSchema = z.object({ code: z.string().trim().min(1).max(50).regex(/^[A-Za-z0-9_-]+$/).transform(v => v.toUpperCase()),
  type: z.enum(['FIXED', 'PERCENTAGE']), value: decimalInput, minSpend: decimalInput.optional(),
  minQuantity: z.number().int().min(0).max(100000).optional(), validFrom: dateInput, validTo: dateInput.nullable().optional(),
  maxUses: z.number().int().min(1).nullable().optional(), productId: uuid.nullable().optional(), active: z.boolean().optional() }).strict();
export const lineSchema = z.object({ productId: uuid, variantId: uuid.nullable().optional(), taxRuleId: uuid.nullable().optional(), quantity: z.number().int().min(1).max(100000) }).strict();
const templateSchema = z.object({ name, planId: uuid, validityDays: z.number().int().min(1).max(365), notes: z.string().max(4000).nullable().optional(), lines: z.array(lineSchema).min(1).max(100) }).strict();
const noEmpty = (input: object) => assert(Object.keys(input).length, 400, 'EMPTY_UPDATE', 'Provide at least one field');
const dates = (start: Date, end: Date | null | undefined) => assert(!end || end >= start, 400, 'INVALID_DATES', 'validTo must be on or after validFrom');

export function catalogRoutes(deps: Dependencies) {
  const router = Router();
  router.get('/products', staff, async (req, res) => {
    const p = pagination(req);
    const q = z.object({ search: z.string().max(120).optional(), active: z.enum(['true', 'false']).optional() }).parse(req.query);
    const where = { ...(q.search ? { name: { contains: q.search, mode: 'insensitive' as const } } : {}), ...(q.active ? { active: q.active === 'true' } : {}) };
    const [data, total] = await Promise.all([deps.db.product.findMany({ where, include: { variants: true }, skip: p.skip, take: p.take, orderBy: { name: 'asc' } }), deps.db.product.count({ where })]);
    res.json(listResult(data, total, p.page, p.pageSize));
  });
  router.get('/products/:id', staff, async (req, res) => {
    const data = await deps.db.product.findUnique({ where: { id: paramId(req) }, include: { variants: true } });
    if (!data) throw notFound('Product'); res.json({ data });
  });
  router.post('/products', admin, async (req, res) => {
    const input = productSchema.parse(req.body);
    const data = await deps.db.$transaction(async tx => { const item = await tx.product.create({ data: input }); await audit(tx, req.viewer.id, 'product.create', 'Product', item.id); return item; });
    res.status(201).json({ data });
  });
  router.patch('/products/:id', admin, async (req, res) => {
    const id = paramId(req), input = productSchema.partial().parse(req.body); noEmpty(input);
    const data = await deps.db.$transaction(async tx => { const item = await tx.product.update({ where: { id }, data: input }); await audit(tx, req.viewer.id, 'product.update', 'Product', id); return item; });
    res.json({ data });
  });
  router.post('/products/:id/variants', admin, async (req, res) => {
    const productId = paramId(req), input = variantSchema.parse(req.body);
    const data = await deps.db.$transaction(async tx => {
      const product = await tx.product.findUnique({ where: { id: productId } }); if (!product) throw notFound('Product');
      assert(D(product.salesPrice).add(input.priceModifier).gte(0), 400, 'NEGATIVE_PRICE', 'The variant would make the sales price negative');
      const item = await tx.productVariant.create({ data: { ...input, productId } }); await audit(tx, req.viewer.id, 'variant.create', 'ProductVariant', item.id); return item;
    }); res.status(201).json({ data });
  });
  router.patch('/variants/:id', admin, async (req, res) => {
    const id = paramId(req), input = variantSchema.partial().parse(req.body); noEmpty(input);
    const data = await deps.db.$transaction(async tx => {
      const variant = await tx.productVariant.findUnique({ where: { id }, include: { product: true } }); if (!variant) throw notFound('Variant');
      assert(D(variant.product.salesPrice).add(input.priceModifier ?? variant.priceModifier.toString()).gte(0), 400, 'NEGATIVE_PRICE', 'The variant would make the price negative');
      const item = await tx.productVariant.update({ where: { id }, data: input }); await audit(tx, req.viewer.id, 'variant.update', 'ProductVariant', id); return item;
    }); res.json({ data });
  });
  router.get('/plans', async (req, res) => {
    const p = pagination(req), where = req.viewer.role === 'CUSTOMER' ? { active: true } : {};
    const [data, total] = await Promise.all([deps.db.plan.findMany({ where, skip: p.skip, take: p.take, orderBy: { name: 'asc' } }), deps.db.plan.count({ where })]);
    res.json(listResult(data, total, p.page, p.pageSize));
  });
  router.get('/plans/:id', async (req, res) => {
    const data = await deps.db.plan.findFirst({ where: { id: paramId(req), ...(req.viewer.role === 'CUSTOMER' ? { active: true } : {}) } });
    if (!data) throw notFound('Plan'); res.json({ data });
  });
  router.post('/plans', admin, async (req, res) => {
    const input = planSchema.parse(req.body), validFrom = asDate(input.validFrom), validTo = input.validTo ? asDate(input.validTo) : null; dates(validFrom, validTo);
    const data = await deps.db.$transaction(async tx => { const item = await tx.plan.create({ data: { ...input, validFrom, validTo } }); await audit(tx, req.viewer.id, 'plan.create', 'Plan', item.id); return item; });
    res.status(201).json({ data });
  });
  router.patch('/plans/:id', admin, async (req, res) => {
    const id = paramId(req), input = planSchema.partial().parse(req.body); noEmpty(input);
    const data = await deps.db.$transaction(async tx => {
      const old = await tx.plan.findUnique({ where: { id } }); if (!old) throw notFound('Plan');
      const validFrom = input.validFrom ? asDate(input.validFrom) : old.validFrom;
      const validTo = input.validTo === undefined ? old.validTo : input.validTo ? asDate(input.validTo) : null; dates(validFrom, validTo);
      const item = await tx.plan.update({ where: { id }, data: { ...input, validFrom, validTo } }); await audit(tx, req.viewer.id, 'plan.update', 'Plan', id); return item;
    }); res.json({ data });
  });
  router.get('/tax-rules', staff, async (req, res) => {
    const p = pagination(req); const [data, total] = await Promise.all([deps.db.taxRule.findMany({ skip: p.skip, take: p.take, orderBy: { name: 'asc' } }), deps.db.taxRule.count()]);
    res.json(listResult(data, total, p.page, p.pageSize));
  });
  router.post('/tax-rules', admin, async (req, res) => {
    const input = taxSchema.parse(req.body);
    const data = await deps.db.$transaction(async tx => { const item = await tx.taxRule.create({ data: input }); await audit(tx, req.viewer.id, 'tax.create', 'TaxRule', item.id); return item; }); res.status(201).json({ data });
  });
  router.patch('/tax-rules/:id', admin, async (req, res) => {
    const id = paramId(req), input = taxSchema.partial().parse(req.body); noEmpty(input);
    const data = await deps.db.$transaction(async tx => { const item = await tx.taxRule.update({ where: { id }, data: input }); await audit(tx, req.viewer.id, 'tax.update', 'TaxRule', id); return item; }); res.json({ data });
  });
  router.get('/discounts', staff, async (req, res) => {
    const p = pagination(req); const [data, total] = await Promise.all([deps.db.discountRule.findMany({ skip: p.skip, take: p.take, orderBy: { code: 'asc' } }), deps.db.discountRule.count()]);
    res.json(listResult(data, total, p.page, p.pageSize));
  });
  router.post('/discounts', admin, async (req, res) => {
    const input = discountSchema.parse(req.body), validFrom = asDate(input.validFrom), validTo = input.validTo ? asDate(input.validTo) : null; dates(validFrom, validTo);
    assert(input.type !== 'PERCENTAGE' || D(input.value).lte(100), 400, 'INVALID_DISCOUNT', 'Percentage discounts cannot exceed 100');
    const data = await deps.db.$transaction(async tx => { const item = await tx.discountRule.create({ data: { ...input, validFrom, validTo } }); await audit(tx, req.viewer.id, 'discount.create', 'DiscountRule', item.id); return item; }); res.status(201).json({ data });
  });
  router.patch('/discounts/:id', admin, async (req, res) => {
    const id = paramId(req), input = discountSchema.partial().parse(req.body); noEmpty(input);
    const data = await deps.db.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM bl_discount_rules WHERE id = ${id}::uuid FOR UPDATE`;
      const old = await tx.discountRule.findUnique({ where: { id } }); if (!old) throw notFound('Discount');
      const validFrom = input.validFrom ? asDate(input.validFrom) : old.validFrom;
      const validTo = input.validTo === undefined ? old.validTo : input.validTo ? asDate(input.validTo) : null; dates(validFrom, validTo);
      assert((input.type ?? old.type) !== 'PERCENTAGE' || D(input.value ?? old.value.toString()).lte(100), 400, 'INVALID_DISCOUNT', 'Percentage discounts cannot exceed 100');
      const maxUses = input.maxUses === undefined ? old.maxUses : input.maxUses;
      assert(maxUses === null || maxUses >= old.usageCount, 400, 'INVALID_LIMIT', 'maxUses cannot be below usageCount');
      const item = await tx.discountRule.update({ where: { id }, data: { ...input, validFrom, validTo } }); await audit(tx, req.viewer.id, 'discount.update', 'DiscountRule', id); return item;
    }); res.json({ data });
  });
  router.get('/quotation-templates', staff, async (req, res) => {
    const p = pagination(req); const [data, total] = await Promise.all([deps.db.quotationTemplate.findMany({ include: { lines: true }, skip: p.skip, take: p.take, orderBy: { name: 'asc' } }), deps.db.quotationTemplate.count()]);
    res.json(listResult(data, total, p.page, p.pageSize));
  });
  router.get('/quotation-templates/:id', staff, async (req, res) => {
    const data = await deps.db.quotationTemplate.findUnique({ where: { id: paramId(req) }, include: { lines: true } }); if (!data) throw notFound('Template'); res.json({ data });
  });
  router.post('/quotation-templates', staff, async (req, res) => {
    const { lines, ...input } = templateSchema.parse(req.body);
    const data = await deps.db.$transaction(async tx => {
      await validateLineReferences(tx, lines);
      const item = await tx.quotationTemplate.create({ data: { ...input, lines: { create: lines } }, include: { lines: true } });
      await audit(tx, req.viewer.id, 'template.create', 'QuotationTemplate', item.id); return item;
    }); res.status(201).json({ data });
  });
  router.put('/quotation-templates/:id', staff, async (req, res) => {
    const id = paramId(req), { lines, ...input } = templateSchema.parse(req.body);
    const data = await deps.db.$transaction(async tx => {
      await validateLineReferences(tx, lines);
      const item = await tx.quotationTemplate.update({ where: { id }, data: { ...input, lines: { deleteMany: {}, create: lines } }, include: { lines: true } });
      await audit(tx, req.viewer.id, 'template.update', 'QuotationTemplate', id); return item;
    }); res.json({ data });
  });
  return router;
}

import type { Prisma } from '../generated/prisma/client.js';
export async function validateLineReferences(tx: Prisma.TransactionClient, lines: z.infer<typeof lineSchema>[]) {
  for (const line of lines) {
    const product = await tx.product.findUnique({ where: { id: line.productId } });
    assert(product?.active, 400, 'INVALID_PRODUCT', 'Product is missing or inactive');
    const variant = line.variantId ? await tx.productVariant.findUnique({ where: { id: line.variantId } }) : null;
    assert(!line.variantId || (variant?.active && variant.productId === line.productId), 400, 'INVALID_VARIANT', 'Variant must belong to this product and be active');
    const tax = line.taxRuleId ? await tx.taxRule.findUnique({ where: { id: line.taxRuleId } }) : null;
    assert(!line.taxRuleId || tax?.active, 400, 'INVALID_TAX', 'Tax rule is missing or inactive');
  }
}
