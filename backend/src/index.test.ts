import { describe, it, expect } from 'vitest';
import { canTransitionSubscription, canTransitionInvoice } from './engine/stateMachine.js';
import { DiscountEngine } from './engine/discountEngine.js';
import { BillingRunner } from './engine/billingRunner.js';
import { dataStore } from './repository/dataStore.js';
import { toCents, toDollars, roundCurrency, DiscountRule, Subscription } from './types/models.js';

describe('Backend Financial Math & Precision', () => {
  it('converts between dollars and integer cents without floating point drift', () => {
    expect(toCents(19.99)).toBe(1999);
    expect(toCents(0.1 + 0.2)).toBe(30); // Classic JS 0.30000000000000004 avoided
    expect(toDollars(1999)).toBe(19.99);
    expect(roundCurrency(10.005)).toBe(10.01);
  });
});

describe('State Machine Engine', () => {
  it('strictly validates permissible subscription lifecycle paths', () => {
    expect(canTransitionSubscription('Draft', 'Quotation')).toBe(true);
    expect(canTransitionSubscription('Quotation', 'Confirmed')).toBe(true);
    expect(canTransitionSubscription('Confirmed', 'Active')).toBe(true);
    expect(canTransitionSubscription('Active', 'Paused')).toBe(true);
    expect(canTransitionSubscription('Paused', 'Active')).toBe(true);
    expect(canTransitionSubscription('Active', 'Closed')).toBe(true);

    // Forbidden paths
    expect(canTransitionSubscription('Draft', 'Active')).toBe(false);
    expect(canTransitionSubscription('Closed', 'Active')).toBe(false);
    expect(canTransitionSubscription('Quotation', 'Paused')).toBe(false);
  });

  it('strictly validates permissible invoice lifecycle paths', () => {
    expect(canTransitionInvoice('Draft', 'Confirmed')).toBe(true);
    expect(canTransitionInvoice('Confirmed', 'Paid')).toBe(true);
    expect(canTransitionInvoice('Confirmed', 'Overdue')).toBe(true);
    expect(canTransitionInvoice('Paid', 'Draft')).toBe(false);
    expect(canTransitionInvoice('Cancelled', 'Paid')).toBe(false);
  });
});

describe('Discount Rule Engine', () => {
  const sampleRule: DiscountRule = {
    id: 'disc-test',
    code: 'TEST20',
    name: '20% Promo',
    type: 'PERCENT',
    value: 20,
    minOrderAmount: 100,
    validUntil: '2099-12-31',
    active: true,
    usageCount: 0,
  };

  it('evaluates percent discounts with exact rounding', () => {
    const res = DiscountEngine.evaluate(sampleRule, 500);
    expect(res.isApplicable).toBe(true);
    expect(res.discountAmountDollars).toBe(100.0);
  });

  it('rejects orders below minimum spend threshold', () => {
    const res = DiscountEngine.evaluate(sampleRule, 50);
    expect(res.isApplicable).toBe(false);
    expect(res.reason).toContain('below required minimum spend');
  });

  it('rejects expired discounts', () => {
    const expiredRule = { ...sampleRule, validUntil: '2020-01-01' };
    const res = DiscountEngine.evaluate(expiredRule, 500);
    expect(res.isApplicable).toBe(false);
    expect(res.reason).toContain('expired');
  });
});

describe('Billing Batch Runner', () => {
  it('idempotently generates invoices for active subscriptions due', () => {
    const mockSubs: Subscription[] = [
      {
        id: 'sub-test-1',
        subscriptionNumber: 'SUB-TEST-1',
        customerId: 'cust-1',
        customerName: 'Test Org',
        customerEmail: 'test@org.io',
        planId: 'p1',
        planName: 'Monthly',
        cadence: 'MONTHLY',
        status: 'Active',
        startDate: '2026-01-01',
        nextBillingDate: '2026-10-31',
        autoClose: false,
        pauseAllowed: true,
        lines: [
          {
            id: 'l1',
            productId: 'prod-001',
            productName: 'Server Node',
            quantity: 1,
            unitPrice: 1000,
            discountPercent: 0,
            lineTotal: 1000,
          },
        ],
        totalAmount: 1000,
        history: [],
      },
    ];

    const batch = BillingRunner.executeBatch(mockSubs, '2026-10-31');
    expect(batch.generatedCount).toBe(1);
    expect(batch.invoices[0].subtotal).toBe(1000);
    expect(batch.invoices[0].taxAmount).toBe(100);
    expect(batch.invoices[0].totalAmount).toBe(1100);
    expect(batch.updatedSubscriptions[0].nextBillingDate).toBe('2026-11-30');
  });
});

describe('DataStore In-Memory Fallback Mode', () => {
  it('computes executive finance metrics in < 50ms', async () => {
    const t0 = performance.now();
    const metrics = await dataStore.getFinanceMetrics();
    const durationMs = performance.now() - t0;

    expect(metrics.activeMrr).toBeGreaterThan(0);
    expect(metrics.arr).toBe(metrics.activeMrr * 12);
    expect(durationMs).toBeLessThan(50);
  });

  it('performs payment logging and reconciles invoice balance to zero', async () => {
    const invoices = await dataStore.getInvoices();
    const unpaid = invoices.find(i => i.amountDue > 0) || invoices[0];
    const prevDue = unpaid.amountDue;

    const payment = await dataStore.logPayment({
      invoiceId: unpaid.id,
      amount: prevDue,
      paymentMethod: 'WIRE',
      referenceNumber: 'WIRE-TEST-8812',
      notes: 'Test settlement',
    });

    expect(payment.status).toBe('SUCCESS');
    expect(unpaid.amountDue).toBe(0);
    expect(unpaid.status).toBe('Paid');
  });
});
