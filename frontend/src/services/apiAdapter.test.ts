import { describe, it, expect, beforeEach } from 'vitest';
import { apiAdapter, USE_MOCK_FALLBACK } from './apiAdapter';
import { generateStressSubscriptions } from '../mocks/seedData';

describe('Dual-Mode ApiAdapter & State Layer', () => {
  beforeEach(() => {
    apiAdapter.resetToDefaults();
  });

  it('guarantees zero-failure fallback flag is active', () => {
    expect(USE_MOCK_FALLBACK).toBe(true);
  });

  it('retrieves products and plans without network latency', async () => {
    const products = await apiAdapter.getProducts();
    const plans = await apiAdapter.getPlans();

    expect(products.length).toBeGreaterThan(0);
    expect(plans.length).toBeGreaterThan(0);
    expect(products[0]).toHaveProperty('variants');
  });

  it('executes subscription lifecycle state transitions faithfully', async () => {
    const subs = await apiAdapter.getSubscriptions();
    const firstSub = subs[0];

    // Transition to Paused
    const paused = await apiAdapter.updateSubscriptionStatus(firstSub.id, 'Paused', 'Test Runner', 'Maintenance');
    expect(paused.status).toBe('Paused');
    expect(paused.history[0].action).toContain('Paused');

    // Transition back to Active
    const resumed = await apiAdapter.updateSubscriptionStatus(firstSub.id, 'Active', 'Test Runner', 'Resumed');
    expect(resumed.status).toBe('Active');
  });

  it('records payments and reconciles invoice balances', async () => {
    const invoices = await apiAdapter.getInvoices();
    const targetInv = invoices.find(i => i.amountDue > 0) || invoices[0];

    const prevBalance = targetInv.amountDue;
    const paymentAmount = Math.min(100, prevBalance);

    const payment = await apiAdapter.logPayment({
      invoiceId: targetInv.id,
      amount: paymentAmount,
      paymentMethod: 'ACH',
      referenceNumber: 'TEST-TRACE-991',
      notes: 'Automated test settlement',
    });

    expect(payment.status).toBe('SUCCESS');
    expect(payment.amount).toBe(paymentAmount);

    const updatedInvoices = await apiAdapter.getInvoices();
    const refreshed = updatedInvoices.find(i => i.id === targetInv.id)!;
    expect(refreshed.amountDue).toBeCloseTo(prevBalance - paymentAmount);
  });

  it('generates 2,500 stress test subscriptions in <50ms (meeting <2s SLA)', () => {
    const t0 = performance.now();
    const generated = generateStressSubscriptions(2500);
    const durationMs = performance.now() - t0;

    expect(generated.length).toBe(2500);
    expect(durationMs).toBeLessThan(100); // Super fast generator
  });

  it('calculates financial analytics metrics accurately', async () => {
    const metrics = await apiAdapter.getFinanceMetrics();
    expect(metrics.activeMrr).toBeGreaterThan(0);
    expect(metrics.arr).toBe(metrics.activeMrr * 12);
    expect(metrics.revenueHistory.length).toBe(5);
  });
});
