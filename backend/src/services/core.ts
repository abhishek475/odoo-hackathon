/** Engineer 1 integration seam. Reuse this interface from the scheduler or inject your team's implementation. */
import { randomUUID } from 'node:crypto';
import type { PrismaClient } from '../generated/prisma/client.js';
import type { Viewer } from '../types.js';
import { assert, notFound } from '../lib/errors.js';
import { addDays, asDate, audit, dateOnly, nextCycle } from '../lib/utils.js';
import { calculateInvoice, type PriceLine } from './pricing.js';

export type SubscriptionAction = 'quote' | 'confirm' | 'activate' | 'pause' | 'resume' | 'close' | 'renew';
export interface CoreEngine {
  transition(id: string, action: SubscriptionAction, actor: Viewer, newExpiryDate?: string): Promise<unknown>;
  generateInvoice(id: string, periodStart: string, actor: Viewer): Promise<unknown>;
  invoiceAction(id: string, action: 'confirm' | 'cancel', actor: Viewer): Promise<unknown>;
}
export class ReferenceCoreEngine implements CoreEngine {
  constructor(private db: PrismaClient, private now: () => Date) {}
  async transition(id: string, action: SubscriptionAction, actor: Viewer, newExpiryDate?: string) {
    return this.db.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM bl_subscriptions WHERE id = ${id}::uuid FOR UPDATE`;
      const sub = await tx.subscription.findUnique({ where: { id }, include: { plan: true } });
      if (!sub || (actor.role === 'CUSTOMER' && sub.customerId !== actor.id)) throw notFound('Subscription');
      const today = dateOnly(this.now());
      const customerActions = ['pause', 'resume', 'close', 'renew'];
      assert(actor.role !== 'CUSTOMER' || customerActions.includes(action), 403, 'FORBIDDEN', 'Staff access required');
      const patch: Record<string, unknown> = { version: { increment: 1 } };
      const expectStatus = (...statuses: string[]) => assert(statuses.includes(sub.status), 409, 'INVALID_TRANSITION', `Cannot ${action} a ${sub.status} subscription`);
      switch (action) {
        case 'quote': expectStatus('DRAFT'); patch.status = 'QUOTATION'; break;
        case 'confirm':
          expectStatus('QUOTATION');
          assert(!sub.quoteValidUntil || sub.quoteValidUntil >= today, 409, 'QUOTE_EXPIRED', 'The quotation has expired');
          patch.status = 'CONFIRMED'; break;
        case 'activate':
          expectStatus('CONFIRMED');
          assert(sub.startDate <= today && sub.expiryDate >= today, 409, 'INVALID_DATES', 'Subscription must be within its start and expiry dates');
          patch.status = 'ACTIVE'; break;
        case 'pause':
          expectStatus('ACTIVE'); assert(sub.plan.allowPause, 409, 'PAUSE_DISABLED', 'This plan does not allow pausing');
          patch.status = 'PAUSED'; patch.pausedAt = today; break;
        case 'resume':
          expectStatus('PAUSED'); assert(sub.expiryDate >= today, 409, 'SUBSCRIPTION_EXPIRED', 'Renew the subscription first');
          // Explicit policy: restart the billing cadence today, skip unbilled paused periods; no proration or refunds.
          patch.status = 'ACTIVE'; patch.pausedAt = null;
          patch.nextBillingDate = sub.nextBillingDate > today ? sub.nextBillingDate : today;
          if (sub.nextBillingDate <= today) patch.billingAnchor = today;
          break;
        case 'close':
          expectStatus('DRAFT', 'QUOTATION', 'CONFIRMED', 'ACTIVE', 'PAUSED');
          assert(!['ACTIVE', 'PAUSED'].includes(sub.status) || sub.plan.allowEarlyClose || today > sub.expiryDate,
            409, 'EARLY_CLOSE_DISABLED', 'This plan does not allow closing early');
          patch.status = 'CLOSED'; patch.closedAt = today; break;
        case 'renew': {
          expectStatus('ACTIVE', 'PAUSED', 'CLOSED');
          assert(sub.plan.allowRenew, 409, 'RENEW_DISABLED', 'This plan does not allow renewal');
          assert(newExpiryDate, 400, 'EXPIRY_REQUIRED', 'Provide newExpiryDate');
          const expiry = asDate(newExpiryDate);
          assert(expiry > sub.expiryDate && expiry >= today, 400, 'INVALID_EXPIRY', 'The new expiry must extend the existing subscription and not be in the past');
          patch.expiryDate = expiry;
          if (sub.status === 'CLOSED') {
            patch.status = 'ACTIVE'; patch.closedAt = null;
            patch.nextBillingDate = sub.nextBillingDate > today ? sub.nextBillingDate : today;
            if (sub.nextBillingDate <= today) patch.billingAnchor = today;
          }
          break;
        }
      }
      const updated = await tx.subscription.update({ where: { id }, data: patch });
      await audit(tx, actor.id, `subscription.${action}`, 'Subscription', id, { previousStatus: sub.status });
      return updated;
    }, { timeout: 15000 });
  }
  async generateInvoice(id: string, expectedPeriod: string, actor: Viewer) {
    return this.db.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM bl_subscriptions WHERE id = ${id}::uuid FOR UPDATE`;
      const sub = await tx.subscription.findUnique({ where: { id }, include: { customer: true, lines: true, plan: true, discounts: true } });
      if (!sub) throw notFound('Subscription');
      assert(actor.role !== 'CUSTOMER', 403, 'FORBIDDEN', 'Staff access required');
      const periodStart = asDate(expectedPeriod);
      // Same explicit period is an idempotent replay, even after nextBillingDate advanced or the subscription closed.
      const previous = await tx.invoice.findFirst({ where: { subscriptionId: id, periodStart }, include: { lines: true } });
      if (previous) return previous;
      const today = dateOnly(this.now());
      assert(sub.status === 'ACTIVE', 409, 'NOT_ACTIVE', 'Only active subscriptions can be billed');
      assert(sub.nextBillingDate.getTime() === periodStart.getTime(), 409, 'WRONG_PERIOD', 'Use the subscription nextBillingDate as periodStart');
      assert(periodStart <= today && periodStart <= sub.expiryDate, 409, 'NOT_DUE', 'This billing period is not due');
      const next = nextCycle(sub.billingAnchor, periodStart, sub.cadence);
      const expiryEnd = addDays(sub.expiryDate, 1);
      const periodEnd = next < expiryEnd ? next : expiryEnd; // exclusive end
      const ids = sub.discounts.map(link => link.discountId).sort();
      // Deterministic locks prevent two subscriptions from consuming the last global discount use.
      for (const discountId of ids) await tx.$queryRaw`SELECT id FROM bl_discount_rules WHERE id = ${discountId}::uuid FOR UPDATE`;
      const rules = await tx.discountRule.findMany({ where: {
        id: { in: ids }, active: true, validFrom: { lte: periodStart },
        OR: [{ validTo: null }, { validTo: { gte: periodStart } }],
      } });
      const input: PriceLine[] = sub.lines.map(line => ({ productId: line.productId, description: line.description, quantity: line.quantity,
        unitPrice: line.unitPrice.toString(), taxName: line.taxName, taxRate: line.taxRate.toString() }));
      if (sub.planPrice.gt(0)) input.unshift({ productId: null, description: `${sub.plan.name} - recurring base fee`, quantity: 1,
        unitPrice: sub.planPrice.toString(), taxName: null, taxRate: '0' });
      const priced = calculateInvoice(input, rules.filter(rule => rule.maxUses === null || rule.usageCount < rule.maxUses).map(rule => ({
        id: rule.id, code: rule.code, type: rule.type, value: rule.value.toString(), minSpend: rule.minSpend.toString(),
        minQuantity: rule.minQuantity, productId: rule.productId,
      })));
      const invoice = await tx.invoice.create({ data: {
        number: `INV-${today.getUTCFullYear()}-${randomUUID().slice(0, 13).toUpperCase()}`,
        subscriptionId: id, customerId: sub.customerId, customerName: sub.customer.name, customerEmail: sub.customer.email,
        periodStart, periodEnd, issueDate: today, dueDate: addDays(today, sub.paymentTermsDays),
        subtotal: priced.subtotal, discountTotal: priced.discountTotal, taxTotal: priced.taxTotal, total: priced.total,
        lines: { create: priced.lines },
      }, include: { lines: true } });
      for (const redemption of priced.redemptions) {
        await tx.discountRule.update({ where: { id: redemption.discountId }, data: { usageCount: { increment: 1 } } });
        await tx.discountRedemption.create({ data: { ...redemption, invoiceId: invoice.id } });
      }
      await tx.subscription.update({ where: { id }, data: {
        nextBillingDate: next, version: { increment: 1 },
        ...(next > sub.expiryDate && sub.plan.autoClose ? { status: 'CLOSED', closedAt: today } : {}),
      } });
      await audit(tx, actor.id, 'invoice.generate', 'Invoice', invoice.id, { subscriptionId: id, periodStart: expectedPeriod });
      return invoice;
    }, { timeout: 15000 });
  }
  async invoiceAction(id: string, action: 'confirm' | 'cancel', actor: Viewer) {
    assert(actor.role !== 'CUSTOMER', 403, 'FORBIDDEN', 'Staff access required');
    return this.db.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM bl_invoices WHERE id = ${id}::uuid FOR UPDATE`;
      const invoice = await tx.invoice.findUnique({ where: { id } });
      if (!invoice) throw notFound('Invoice');
      if (action === 'confirm') {
        assert(invoice.status === 'DRAFT', 409, 'INVALID_TRANSITION', 'Only draft invoices can be confirmed');
      } else {
        assert(['DRAFT', 'CONFIRMED'].includes(invoice.status) && invoice.paidAmount.isZero(),
          409, 'INVALID_TRANSITION', 'Only unpaid draft/confirmed invoices can be cancelled');
      }
      const status = action === 'cancel' ? 'CANCELLED' : invoice.total.isZero() ? 'PAID' : 'CONFIRMED';
      const updated = await tx.invoice.update({ where: { id }, data: { status } });
      await audit(tx, actor.id, `invoice.${action}`, 'Invoice', id);
      return updated;
    });
  }
}
