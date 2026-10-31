import { Router } from 'express';
import { z } from 'zod';
import { Prisma } from '../generated/prisma/client.js';
import type { Dependencies } from '../types.js';
import { staff } from '../middleware.js';
import { assert } from '../lib/errors.js';
import { D, asDate, csvCell, dateInput, dateOnly, dayString, listResult, moneyString, pagination, uuid } from '../lib/utils.js';

const filters = z.object({ from: dateInput.optional(), to: dateInput.optional(), customerId: uuid.optional() });
export function reportRoutes(deps: Dependencies) {
  const router = Router(); router.use(staff);
  router.get('/summary', async (req, res) => {
    const q = filters.parse(req.query);
    assert(!q.from || !q.to || q.from <= q.to, 400, 'INVALID_DATES', 'from must be on or before to');
    const today = dateOnly(deps.now());
    const invoiceWhere = Prisma.sql`TRUE ${q.customerId ? Prisma.sql`AND i."customerId" = ${q.customerId}::uuid` : Prisma.empty}`;
    const range = Prisma.sql`${q.from ? Prisma.sql`AND i."issueDate" >= ${asDate(q.from)}::date` : Prisma.empty} ${q.to ? Prisma.sql`AND i."issueDate" <= ${asDate(q.to)}::date` : Prisma.empty}`;
    type Summary = { activeSubscriptions: bigint; invoicedAmount: Prisma.Decimal; collectedPayments: Prisma.Decimal; outstandingAmount: Prisma.Decimal; overdueAmount: Prisma.Decimal; overdueInvoiceCount: bigint; grossMrr: Prisma.Decimal };
    const rows = await deps.db.$queryRaw<Summary[]>(Prisma.sql`
      SELECT
        (SELECT COUNT(*) FROM bl_subscriptions s WHERE s.status = 'ACTIVE' ${q.customerId ? Prisma.sql`AND s."customerId" = ${q.customerId}::uuid` : Prisma.empty}) AS "activeSubscriptions",
        (SELECT COALESCE(SUM(i.total), 0) FROM bl_invoices i WHERE ${invoiceWhere} ${range} AND i.status IN ('CONFIRMED', 'PAID')) AS "invoicedAmount",
        (SELECT COALESCE(SUM(p.amount), 0) FROM bl_payments p JOIN bl_invoices i ON i.id = p."invoiceId" WHERE ${invoiceWhere}
          ${q.from ? Prisma.sql`AND p."paymentDate" >= ${asDate(q.from)}::date` : Prisma.empty}
          ${q.to ? Prisma.sql`AND p."paymentDate" <= ${asDate(q.to)}::date` : Prisma.empty}) AS "collectedPayments",
        (SELECT COALESCE(SUM(i.total - i."paidAmount"), 0) FROM bl_invoices i WHERE ${invoiceWhere} AND i.status = 'CONFIRMED') AS "outstandingAmount",
        (SELECT COALESCE(SUM(i.total - i."paidAmount"), 0) FROM bl_invoices i WHERE ${invoiceWhere} AND i.status = 'CONFIRMED' AND i."dueDate" < ${today}::date) AS "overdueAmount",
        (SELECT COUNT(*) FROM bl_invoices i WHERE ${invoiceWhere} AND i.status = 'CONFIRMED' AND i."dueDate" < ${today}::date) AS "overdueInvoiceCount",
        (SELECT COALESCE(SUM((s."planPrice" + COALESCE(l.amount, 0)) * CASE s.cadence
          WHEN 'DAILY' THEN 365.0/12 WHEN 'WEEKLY' THEN 52.0/12 WHEN 'MONTHLY' THEN 1 ELSE 1.0/12 END), 0)
          FROM bl_subscriptions s LEFT JOIN LATERAL (SELECT SUM(sl.quantity * sl."unitPrice") AS amount FROM bl_subscription_lines sl WHERE sl."subscriptionId" = s.id) l ON TRUE
          WHERE s.status = 'ACTIVE' ${q.customerId ? Prisma.sql`AND s."customerId" = ${q.customerId}::uuid` : Prisma.empty}) AS "grossMrr"
    `);
    const row = rows[0]!;
    res.json({ data: {
      activeSubscriptions: Number(row.activeSubscriptions), invoicedAmount: moneyString(D(row.invoicedAmount)),
      collectedPayments: moneyString(D(row.collectedPayments)), outstandingAmount: moneyString(D(row.outstandingAmount)),
      overdueAmount: moneyString(D(row.overdueAmount)), overdueInvoiceCount: Number(row.overdueInvoiceCount),
      grossMrr: moneyString(D(row.grossMrr)), grossArr: moneyString(D(row.grossMrr).mul(12)), currency: 'INR',
      scope: { asOf: dayString(today), from: q.from ?? null, to: q.to ?? null,
        note: 'Date filters apply to invoice issue dates and payment dates. Active/outstanding/overdue/MRR are current-state metrics. Gross MRR excludes tax and discounts; daily=365/12 and weekly=52/12.' },
    } });
  });
  router.get('/overdue', async (req, res) => {
    const p = pagination(req), q = z.object({ customerId: uuid.optional() }).parse(req.query);
    const where = { status: 'CONFIRMED' as const, dueDate: { lt: dateOnly(deps.now()) }, ...(q.customerId ? { customerId: q.customerId } : {}) };
    const [items, total] = await Promise.all([deps.db.invoice.findMany({ where, orderBy: [{ dueDate: 'asc' }, { id: 'asc' }], skip: p.skip, take: p.take }), deps.db.invoice.count({ where })]);
    res.json(listResult(items.map(item => ({ ...item, outstanding: moneyString(D(item.total).sub(item.paidAmount.toString())) })), total, p.page, p.pageSize));
  });
  router.get('/invoices.csv', async (req, res) => {
    const q = filters.parse(req.query); assert(!q.from || !q.to || q.from <= q.to, 400, 'INVALID_DATES', 'from must be on or before to');
    const where = { ...(q.customerId ? { customerId: q.customerId } : {}), ...(q.from || q.to ? { issueDate: {
      ...(q.from ? { gte: asDate(q.from) } : {}), ...(q.to ? { lte: asDate(q.to) } : {}),
    } } : {}) };
    res.type('text/csv').attachment('brightloop-invoices.csv');
    res.write(['number', 'customer', 'email', 'issueDate', 'dueDate', 'status', 'total', 'paid', 'outstanding'].map(csvCell).join(',') + '\r\n');
    let cursor: string | undefined;
    while (!res.destroyed) {
      const batch = await deps.db.invoice.findMany({ where, orderBy: { id: 'asc' }, take: 500, ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}) });
      if (!batch.length) break;
      for (const item of batch) {
        const line = [item.number, item.customerName, item.customerEmail, dayString(item.issueDate), dayString(item.dueDate), item.status,
          item.total, item.paidAmount, moneyString(D(item.total).sub(item.paidAmount.toString()))].map(csvCell).join(',') + '\r\n';
        if (!res.write(line)) await new Promise<void>(resolve => {
          const done = () => { res.off('drain', done); res.off('close', done); resolve(); };
          res.once('drain', done); res.once('close', done);
        });
        if (res.destroyed) break;
      }
      cursor = batch[batch.length - 1]!.id;
    }
    res.end();
  });
  return router;
}
