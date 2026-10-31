import { Subscription, Invoice, toCents, toDollars, PlanCadence } from '../types/models.js';

export interface BillingBatchResult {
  generatedCount: number;
  invoices: Invoice[];
  updatedSubscriptions: Subscription[];
}

export class BillingRunner {
  static advanceBillingDate(currentDateStr: string, cadence: PlanCadence): string {
    const d = new Date(currentDateStr);
    if (isNaN(d.getTime())) {
      return new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
    }

    if (cadence === 'DAILY') {
      d.setDate(d.getDate() + 1);
    } else if (cadence === 'WEEKLY') {
      d.setDate(d.getDate() + 7);
    } else if (cadence === 'YEARLY') {
      d.setFullYear(d.getFullYear() + 1);
    } else {
      // Monthly default
      d.setDate(d.getDate() + 30);
    }

    return d.toISOString().split('T')[0];
  }

  static executeBatch(
    subscriptions: Subscription[],
    targetDateStr: string
  ): BillingBatchResult {
    const targetDate = new Date(targetDateStr);
    const generatedInvoices: Invoice[] = [];
    const updatedSubscriptions: Subscription[] = [];

    for (const sub of subscriptions) {
      if (sub.status !== 'Active') continue;

      const nextBillDate = new Date(sub.nextBillingDate);
      if (nextBillDate <= targetDate) {
        // Calculate financial totals in exact integer cents
        const subtotalCents = toCents(sub.totalAmount);
        const taxCents = Math.round(subtotalCents * 0.10); // Standard 10% VAT/Tax
        const totalCents = subtotalCents + taxCents;

        const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
        const issueDate = targetDateStr;
        const dueDate = new Date(targetDate.getTime() + 14 * 86400000).toISOString().split('T')[0];

        const invoice: Invoice = {
          id: `inv-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
          invoiceNumber,
          subscriptionId: sub.id,
          customerId: sub.customerId,
          customerName: sub.customerName,
          customerEmail: sub.customerEmail,
          customerAddress: 'Primary Corporate Billing Address',
          status: 'Confirmed',
          issueDate,
          dueDate,
          lines: [...sub.lines],
          subtotal: toDollars(subtotalCents),
          discountAmount: 0,
          taxAmount: toDollars(taxCents),
          totalAmount: toDollars(totalCents),
          amountPaid: 0,
          amountDue: toDollars(totalCents),
          paymentHistory: [],
        };

        generatedInvoices.push(invoice);

        // Advance next billing date
        const newNextDate = this.advanceBillingDate(sub.nextBillingDate, sub.cadence);
        const updatedSub: Subscription = {
          ...sub,
          nextBillingDate: newNextDate,
          history: [
            {
              date: issueDate,
              action: `Batch Invoiced (${invoiceNumber})`,
              performedBy: 'Billing Batch Runner',
              note: `Generated invoice for cycle; advanced next billing date to ${newNextDate}`,
            },
            ...sub.history,
          ],
        };

        updatedSubscriptions.push(updatedSub);
      }
    }

    return {
      generatedCount: generatedInvoices.length,
      invoices: generatedInvoices,
      updatedSubscriptions,
    };
  }
}
