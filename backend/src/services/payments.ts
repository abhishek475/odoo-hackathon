import { createHash } from 'node:crypto';
import type { PrismaClient, PaymentMethod } from '../generated/prisma/client.js';
import { Prisma } from '../generated/prisma/client.js';
import { AppError, assert, notFound } from '../lib/errors.js';
import { D, asDate, audit, dateOnly, moneyString } from '../lib/utils.js';

export interface PaymentInput { amount: string; method: PaymentMethod; paymentDate?: string; note?: string; }
export async function recordPayment(db: PrismaClient, invoiceId: string, actorId: string, key: string, input: PaymentInput, now: () => Date) {
  const requestHash = createHash('sha256').update(JSON.stringify({ invoiceId, amount: moneyString(D(input.amount)), method: input.method,
    paymentDate: input.paymentDate ?? null, note: input.note ?? null })).digest('hex');
  const replay = async () => {
    const existing = await db.payment.findUnique({ where: { idempotencyKey: key } });
    if (!existing) return null;
    assert(existing.requestHash === requestHash, 409, 'IDEMPOTENCY_CONFLICT', 'This Idempotency-Key was already used for another payment request');
    return { payment: existing, replayed: true };
  };
  const prior = await replay(); if (prior) return prior;
  try {
    return await db.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM bl_invoices WHERE id = ${invoiceId}::uuid FOR UPDATE`;
      const previous = await tx.payment.findUnique({ where: { idempotencyKey: key } });
      if (previous) {
        assert(previous.requestHash === requestHash, 409, 'IDEMPOTENCY_CONFLICT', 'This Idempotency-Key was already used for another payment request');
        return { payment: previous, replayed: true };
      }
      const invoice = await tx.invoice.findUnique({ where: { id: invoiceId } }); if (!invoice) throw notFound('Invoice');
      assert(invoice.status === 'CONFIRMED', 409, 'INVOICE_NOT_PAYABLE', 'Payments require a confirmed, unpaid invoice');
      const amount = D(input.amount), outstanding = D(invoice.total).sub(invoice.paidAmount.toString());
      assert(amount.gt(0) && amount.lte(outstanding), 400, 'INVALID_PAYMENT_AMOUNT', `Payment must be positive and no more than ${moneyString(outstanding)}`);
      const payment = await tx.payment.create({ data: { invoiceId, recordedById: actorId, amount: moneyString(amount), method: input.method,
        paymentDate: input.paymentDate ? asDate(input.paymentDate) : dateOnly(now()), note: input.note, idempotencyKey: key, requestHash } });
      const paidAmount = D(invoice.paidAmount).add(amount);
      await tx.invoice.update({ where: { id: invoiceId }, data: { paidAmount: moneyString(paidAmount), status: paidAmount.eq(invoice.total.toString()) ? 'PAID' : 'CONFIRMED' } });
      await audit(tx, actorId, 'payment.record', 'Payment', payment.id, { invoiceId });
      return { payment, replayed: false };
    });
  } catch (error) {
    // Same key on different invoices can race before either transaction sees the other's insert.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const existing = await replay(); if (existing) return existing;
    }
    throw error;
  }
}
