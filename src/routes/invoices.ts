import { Router } from 'express';
import { z } from 'zod';
import type { Dependencies } from '../types.js';
import type { Prisma } from '../generated/prisma/client.js';
import { staff, ownership } from '../middleware.js';
import { assert, notFound } from '../lib/errors.js';
import { D, asDate, audit, dateInput, dateOnly, listResult, moneyString, pagination, paramId, positiveAmount, uuid } from '../lib/utils.js';
import { invoiceHtml } from '../services/invoice-html.js';
import { recordPayment } from '../services/payments.js';

export const paymentSchema = z.object({ amount: positiveAmount, method: z.enum(['BANK_TRANSFER', 'CARD', 'CASH', 'MANUAL']),
  paymentDate: dateInput.optional(), note: z.string().trim().max(2000).optional() }).strict();
export function invoiceRoutes(deps: Dependencies) {
  const router = Router();
  router.post('/subscriptions/:id/invoices', staff, async (req, res) => {
    const id = paramId(req), { periodStart } = z.object({ periodStart: dateInput }).strict().parse(req.body);
    res.json({ data: await deps.core.generateInvoice(id, periodStart, req.viewer) });
  });
  router.get('/invoices', async (req, res) => {
    const p = pagination(req), q = z.object({
      status: z.enum(['DRAFT', 'CONFIRMED', 'PAID', 'CANCELLED']).optional(), customerId: uuid.optional(), subscriptionId: uuid.optional(),
      overdue: z.enum(['true', 'false']).optional(), from: dateInput.optional(), to: dateInput.optional(), search: z.string().max(120).optional(),
    }).parse(req.query);
    assert(!q.from || !q.to || q.from <= q.to, 400, 'INVALID_DATES', 'from must be on or before to');
    const where: Prisma.InvoiceWhereInput = { ...(q.status ? { status: q.status } : {}),
      ...(q.customerId ? { customerId: q.customerId } : {}), ...ownership(req.viewer),
      ...(q.subscriptionId ? { subscriptionId: q.subscriptionId } : {}),
      ...(q.from || q.to ? { issueDate: { ...(q.from ? { gte: asDate(q.from) } : {}), ...(q.to ? { lte: asDate(q.to) } : {}) } } : {}),
      ...(q.search ? { number: { contains: q.search, mode: 'insensitive' } } : {}),
      ...(q.overdue === 'true' ? { status: 'CONFIRMED', dueDate: { lt: dateOnly(deps.now()) } } : {}),
    };
    const [items, total] = await Promise.all([deps.db.invoice.findMany({ where, skip: p.skip, take: p.take, orderBy: [{ issueDate: 'desc' }, { id: 'desc' }] }), deps.db.invoice.count({ where })]);
    const data = items.map(item => ({ ...item, outstanding: moneyString(D(item.total).sub(item.paidAmount.toString())) }));
    res.json(listResult(data, total, p.page, p.pageSize));
  });
  router.get('/invoices/:id', async (req, res) => {
    const data = await deps.db.invoice.findFirst({ where: { id: paramId(req), ...ownership(req.viewer) }, include: { lines: true, payments: { orderBy: { paymentDate: 'desc' } } } });
    if (!data) throw notFound('Invoice'); res.json({ data: { ...data, outstanding: moneyString(D(data.total).sub(data.paidAmount.toString())) } });
  });
  router.get('/invoices/:id/print', async (req, res) => {
    const data = await deps.db.invoice.findFirst({ where: { id: paramId(req), ...ownership(req.viewer) }, include: { lines: true } });
    if (!data) throw notFound('Invoice'); res.type('html').send(invoiceHtml(data));
  });
  for (const action of ['confirm', 'cancel'] as const) router.post(`/invoices/:id/${action}`, staff, async (req, res) => {
    z.object({}).strict().parse(req.body ?? {}); res.json({ data: await deps.core.invoiceAction(paramId(req), action, req.viewer) });
  });
  router.post('/invoices/:id/send', staff, async (req, res) => {
    z.object({}).strict().parse(req.body ?? {});
    const id = paramId(req), item = await deps.db.invoice.findUnique({ where: { id }, include: { lines: true } }); if (!item) throw notFound('Invoice');
    assert(['CONFIRMED', 'PAID'].includes(item.status), 409, 'INVOICE_NOT_SENDABLE', 'Confirm the invoice before sending it');
    await deps.mailer.send(item.customerEmail, `Brightloop invoice ${item.number}`, invoiceHtml(item));
    const data = await deps.db.$transaction(async tx => {
      const invoice = await tx.invoice.update({ where: { id }, data: { sentAt: deps.now() } });
      await audit(tx, req.viewer.id, 'invoice.send', 'Invoice', id); return invoice;
    }); res.json({ data });
  });
  router.post('/invoices/:id/payments', staff, async (req, res) => {
    const invoiceId = paramId(req), input = paymentSchema.parse(req.body);
    assert(!input.paymentDate || asDate(input.paymentDate) <= dateOnly(deps.now()), 400, 'FUTURE_PAYMENT', 'A recorded receipt cannot have a future payment date');
    const key = z.string().min(8).max(200).regex(/^[A-Za-z0-9._:-]+$/).parse(req.header('Idempotency-Key'));
    const result = await recordPayment(deps.db, invoiceId, req.viewer.id, key, input, deps.now);
    const invoice = await deps.db.invoice.findUniqueOrThrow({ where: { id: invoiceId } });
    res.status(result.replayed ? 200 : 201).json({ data: { ...result, invoice: { id: invoice.id, status: invoice.status, paidAmount: invoice.paidAmount, outstanding: moneyString(D(invoice.total).sub(invoice.paidAmount.toString())) } } });
  });
  router.get('/payments', staff, async (req, res) => {
    const p = pagination(req), q = z.object({ invoiceId: uuid.optional(), from: dateInput.optional(), to: dateInput.optional() }).parse(req.query);
    assert(!q.from || !q.to || q.from <= q.to, 400, 'INVALID_DATES', 'from must be on or before to');
    const where: Prisma.PaymentWhereInput = { ...(q.invoiceId ? { invoiceId: q.invoiceId } : {}),
      ...(q.from || q.to ? { paymentDate: { ...(q.from ? { gte: asDate(q.from) } : {}), ...(q.to ? { lte: asDate(q.to) } : {}) } } : {}) };
    const [data, total] = await Promise.all([deps.db.payment.findMany({ where, skip: p.skip, take: p.take, orderBy: [{ paymentDate: 'desc' }, { id: 'desc' }] }), deps.db.payment.count({ where })]);
    res.json(listResult(data, total, p.page, p.pageSize));
  });
  return router;
}
