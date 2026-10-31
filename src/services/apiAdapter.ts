import {
  Product,
  BillingPlan,
  QuotationTemplate,
  Subscription,
  SubscriptionStatus,
  Invoice,
  InvoiceStatus,
  DiscountRule,
  PaymentRecord,
  FinanceMetrics,
} from '../types/billing';
import {
  SEED_PRODUCTS,
  SEED_PLANS,
  SEED_TEMPLATES,
  SEED_SUBSCRIPTIONS,
  SEED_INVOICES,
  SEED_DISCOUNTS,
  SEED_PAYMENTS,
  generateStressSubscriptions,
} from '../mocks/seedData';

// Demo-only adapter: no backend requests are implemented. Endpoint TODOs below
// are unverified proposals, not confirmed contracts. See docs/frontend-integration.md.
export const USE_MOCK_FALLBACK = true;

const STORAGE_KEYS = {
  PRODUCTS: 'brightloop_products',
  PLANS: 'brightloop_plans',
  TEMPLATES: 'brightloop_templates',
  SUBSCRIPTIONS: 'brightloop_subscriptions',
  INVOICES: 'brightloop_invoices',
  DISCOUNTS: 'brightloop_discounts',
  PAYMENTS: 'brightloop_payments',
};

const isBrowser = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

function loadStorage<T>(key: string, defaultData: T): T {
  if (!isBrowser) return defaultData;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return defaultData;
    return JSON.parse(raw);
  } catch (e) {
    console.warn(`[ApiAdapter] Failed to parse localStorage key ${key}, falling back to defaults`, e);
    return defaultData;
  }
}

function saveStorage<T>(key: string, data: T): void {
  if (!isBrowser) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn(`[ApiAdapter] Failed to write localStorage key ${key}`, e);
  }
}

class ApiAdapter {
  private products: Product[];
  private plans: BillingPlan[];
  private templates: QuotationTemplate[];
  private subscriptions: Subscription[];
  private invoices: Invoice[];
  private discounts: DiscountRule[];
  private payments: PaymentRecord[];

  constructor() {
    this.products = loadStorage(STORAGE_KEYS.PRODUCTS, SEED_PRODUCTS);
    this.plans = loadStorage(STORAGE_KEYS.PLANS, SEED_PLANS);
    this.templates = loadStorage(STORAGE_KEYS.TEMPLATES, SEED_TEMPLATES);
    this.subscriptions = loadStorage(STORAGE_KEYS.SUBSCRIPTIONS, SEED_SUBSCRIPTIONS);
    this.invoices = loadStorage(STORAGE_KEYS.INVOICES, SEED_INVOICES);
    this.discounts = loadStorage(STORAGE_KEYS.DISCOUNTS, SEED_DISCOUNTS);
    this.payments = loadStorage(STORAGE_KEYS.PAYMENTS, SEED_PAYMENTS);
  }

  // -------------------------------------------------------------
  // PRODUCTS
  // -------------------------------------------------------------
  // TODO: [BACKEND_HOOK] - GET /api/v1/products - Returns: Promise<Product[]>
  async getProducts(): Promise<Product[]> {
    try {
      if (!USE_MOCK_FALLBACK) {
        // e.g. const res = await fetch('/api/v1/products'); return await res.json();
      }
      return [...this.products];
    } catch {
      return [...this.products];
    }
  }

  // TODO: [BACKEND_HOOK] - POST /api/v1/products - Payload: Omit<Product, 'id' | 'createdAt'> - Returns: Promise<Product>
  async createProduct(data: Omit<Product, 'id' | 'createdAt'>): Promise<Product> {
    try {
      const newProduct: Product = {
        ...data,
        id: `prod-${Date.now().toString(36)}`,
        createdAt: new Date().toISOString(),
      };
      this.products = [newProduct, ...this.products];
      saveStorage(STORAGE_KEYS.PRODUCTS, this.products);
      return newProduct;
    } catch {
      return this.products[0];
    }
  }

  // -------------------------------------------------------------
  // PLANS
  // -------------------------------------------------------------
  // TODO: [BACKEND_HOOK] - GET /api/v1/plans - Returns: Promise<BillingPlan[]>
  async getPlans(): Promise<BillingPlan[]> {
    return [...this.plans];
  }

  // TODO: [BACKEND_HOOK] - POST /api/v1/plans - Payload: Omit<BillingPlan, 'id'> - Returns: Promise<BillingPlan>
  async createPlan(data: Omit<BillingPlan, 'id'>): Promise<BillingPlan> {
    const newPlan: BillingPlan = {
      ...data,
      id: `plan-${Date.now().toString(36)}`,
    };
    this.plans = [...this.plans, newPlan];
    saveStorage(STORAGE_KEYS.PLANS, this.plans);
    return newPlan;
  }

  // -------------------------------------------------------------
  // QUOTATION TEMPLATES
  // -------------------------------------------------------------
  // TODO: [BACKEND_HOOK] - GET /api/v1/templates - Returns: Promise<QuotationTemplate[]>
  async getTemplates(): Promise<QuotationTemplate[]> {
    return [...this.templates];
  }

  // TODO: [BACKEND_HOOK] - POST /api/v1/templates - Payload: Omit<QuotationTemplate, 'id'> - Returns: Promise<QuotationTemplate>
  async createTemplate(data: Omit<QuotationTemplate, 'id'>): Promise<QuotationTemplate> {
    const newTemplate: QuotationTemplate = {
      ...data,
      id: `tmpl-${Date.now().toString(36)}`,
    };
    this.templates = [newTemplate, ...this.templates];
    saveStorage(STORAGE_KEYS.TEMPLATES, this.templates);
    return newTemplate;
  }

  // -------------------------------------------------------------
  // SUBSCRIPTIONS
  // -------------------------------------------------------------
  // TODO: [BACKEND_HOOK] - GET /api/v1/subscriptions - Query: { status?: string, customerId?: string } - Returns: Promise<Subscription[]>
  async getSubscriptions(filterCustomerId?: string): Promise<Subscription[]> {
    if (filterCustomerId) {
      return this.subscriptions.filter(s => s.customerId === filterCustomerId);
    }
    return [...this.subscriptions];
  }

  // TODO: [BACKEND_HOOK] - POST /api/v1/subscriptions - Payload: Partial<Subscription> - Returns: Promise<Subscription>
  async createSubscription(data: Partial<Subscription>): Promise<Subscription> {
    const subNumber = `SUB-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newSub: Subscription = {
      id: `sub-${Date.now().toString(36)}`,
      subscriptionNumber: subNumber,
      customerId: data.customerId || 'cust-direct',
      customerName: data.customerName || 'Direct Customer',
      customerEmail: data.customerEmail || 'billing@example.com',
      planId: data.planId || this.plans[0].id,
      planName: data.planName || this.plans[0].name,
      cadence: data.cadence || 'MONTHLY',
      status: (data.status as SubscriptionStatus) || 'Draft',
      startDate: data.startDate || new Date().toISOString().split('T')[0],
      nextBillingDate: data.nextBillingDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      autoClose: data.autoClose ?? false,
      pauseAllowed: data.pauseAllowed ?? true,
      lines: data.lines || [],
      totalAmount: data.totalAmount || 0,
      notes: data.notes || '',
      history: [
        {
          date: new Date().toISOString().split('T')[0],
          action: 'Created Draft',
          performedBy: 'Internal Staff',
          note: 'Initial creation via Quotation Builder',
        },
      ],
    };

    this.subscriptions = [newSub, ...this.subscriptions];
    saveStorage(STORAGE_KEYS.SUBSCRIPTIONS, this.subscriptions);
    return newSub;
  }

  // TODO: [BACKEND_HOOK] - PATCH /api/v1/subscriptions/:id/transition - Payload: { status: SubscriptionStatus, performedBy: string, note?: string } - Returns: Promise<Subscription>
  async updateSubscriptionStatus(
    id: string,
    newStatus: SubscriptionStatus,
    performedBy: string = 'Internal Staff',
    note?: string
  ): Promise<Subscription> {
    const index = this.subscriptions.findIndex(s => s.id === id);
    if (index === -1) {
      throw new Error(`Subscription ${id} not found`);
    }

    const current = this.subscriptions[index];
    const updated: Subscription = {
      ...current,
      status: newStatus,
      history: [
        {
          date: new Date().toISOString().split('T')[0],
          action: `Transitioned to ${newStatus}`,
          performedBy,
          note: note || `State changed from ${current.status} to ${newStatus}`,
        },
        ...current.history,
      ],
    };

    this.subscriptions[index] = updated;
    saveStorage(STORAGE_KEYS.SUBSCRIPTIONS, this.subscriptions);
    return updated;
  }

  // -------------------------------------------------------------
  // INVOICES & BILLING BATCH RUNNER
  // -------------------------------------------------------------
  // TODO: [BACKEND_HOOK] - GET /api/v1/invoices - Query: { customerId?: string } - Returns: Promise<Invoice[]>
  async getInvoices(filterCustomerId?: string): Promise<Invoice[]> {
    if (filterCustomerId) {
      return this.invoices.filter(inv => inv.customerId === filterCustomerId);
    }
    return [...this.invoices];
  }

  // TODO: [BACKEND_HOOK] - POST /api/v1/billing/batch-run - Payload: { billingDate: string } - Returns: Promise<{ generatedCount: number, invoices: Invoice[] }>
  async runBatchBillingDay(billingDate: string): Promise<{ generatedCount: number; invoices: Invoice[] }> {
    const targetDate = new Date(billingDate);
    const generated: Invoice[] = [];

    // Find active subscriptions that match billing criteria
    this.subscriptions
      .filter(sub => sub.status === 'Active')
      .forEach(sub => {
        const nextBill = new Date(sub.nextBillingDate);
        if (nextBill <= targetDate) {
          const invNum = `INV-BATCH-${Math.floor(1000 + Math.random() * 9000)}`;
          const subtotal = sub.totalAmount;
          const tax = Number((subtotal * 0.1).toFixed(2));
          const total = Number((subtotal + tax).toFixed(2));

          const inv: Invoice = {
            id: `inv-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`,
            invoiceNumber: invNum,
            subscriptionId: sub.id,
            customerId: sub.customerId,
            customerName: sub.customerName,
            customerEmail: sub.customerEmail,
            customerAddress: 'Primary Corporate Billing Address',
            status: 'Confirmed',
            issueDate: billingDate,
            dueDate: new Date(targetDate.getTime() + 14 * 86400000).toISOString().split('T')[0],
            lines: [...sub.lines],
            subtotal,
            discountAmount: 0,
            taxAmount: tax,
            totalAmount: total,
            amountPaid: 0,
            amountDue: total,
            paymentHistory: [],
          };
          generated.push(inv);

          // Advance next billing date by 1 month
          const updatedDate = new Date(nextBill.getTime() + 30 * 86400000).toISOString().split('T')[0];
          sub.nextBillingDate = updatedDate;
        }
      });

    if (generated.length > 0) {
      this.invoices = [...generated, ...this.invoices];
      saveStorage(STORAGE_KEYS.INVOICES, this.invoices);
      saveStorage(STORAGE_KEYS.SUBSCRIPTIONS, this.subscriptions);
    }

    return { generatedCount: generated.length, invoices: generated };
  }

  // TODO: [BACKEND_HOOK] - PATCH /api/v1/invoices/:id/status - Payload: { status: InvoiceStatus } - Returns: Promise<Invoice>
  async updateInvoiceStatus(id: string, status: InvoiceStatus): Promise<Invoice> {
    const index = this.invoices.findIndex(i => i.id === id);
    if (index === -1) throw new Error(`Invoice ${id} not found`);

    const inv = this.invoices[index];
    inv.status = status;
    saveStorage(STORAGE_KEYS.INVOICES, this.invoices);
    return inv;
  }

  // -------------------------------------------------------------
  // PAYMENTS
  // -------------------------------------------------------------
  // TODO: [BACKEND_HOOK] - GET /api/v1/payments - Returns: Promise<PaymentRecord[]>
  async getPayments(): Promise<PaymentRecord[]> {
    return [...this.payments];
  }

  // TODO: [BACKEND_HOOK] - POST /api/v1/payments - Payload: Omit<PaymentRecord, 'id' | 'paymentDate' | 'status'> - Returns: Promise<PaymentRecord>
  async logPayment(data: {
    invoiceId: string;
    amount: number;
    paymentMethod: 'CARD' | 'ACH' | 'WIRE' | 'CHECK';
    referenceNumber: string;
    notes?: string;
  }): Promise<PaymentRecord> {
    const invIndex = this.invoices.findIndex(i => i.id === data.invoiceId);
    if (invIndex === -1) throw new Error(`Invoice ${data.invoiceId} not found`);

    const invoice = this.invoices[invIndex];
    const newPayment: PaymentRecord = {
      id: `pay-${Date.now().toString(36)}`,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      customerId: invoice.customerId,
      customerName: invoice.customerName,
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      referenceNumber: data.referenceNumber,
      paymentDate: new Date().toISOString(),
      status: 'SUCCESS',
      notes: data.notes,
    };

    // Update invoice ledger
    invoice.amountPaid = Number((invoice.amountPaid + data.amount).toFixed(2));
    invoice.amountDue = Number(Math.max(0, invoice.totalAmount - invoice.amountPaid).toFixed(2));
    if (invoice.amountDue <= 0) {
      invoice.status = 'Paid';
    }
    invoice.paymentHistory = [newPayment, ...invoice.paymentHistory];

    this.payments = [newPayment, ...this.payments];
    saveStorage(STORAGE_KEYS.PAYMENTS, this.payments);
    saveStorage(STORAGE_KEYS.INVOICES, this.invoices);

    return newPayment;
  }

  // -------------------------------------------------------------
  // DISCOUNTS
  // -------------------------------------------------------------
  // TODO: [BACKEND_HOOK] - GET /api/v1/discounts - Returns: Promise<DiscountRule[]>
  async getDiscounts(): Promise<DiscountRule[]> {
    return [...this.discounts];
  }

  // TODO: [BACKEND_HOOK] - POST /api/v1/discounts - Payload: Omit<DiscountRule, 'id' | 'usageCount'> - Returns: Promise<DiscountRule>
  async createDiscount(data: Omit<DiscountRule, 'id' | 'usageCount'>): Promise<DiscountRule> {
    const newDiscount: DiscountRule = {
      ...data,
      id: `disc-${Date.now().toString(36)}`,
      usageCount: 0,
    };
    this.discounts = [newDiscount, ...this.discounts];
    saveStorage(STORAGE_KEYS.DISCOUNTS, this.discounts);
    return newDiscount;
  }

  // TODO: [BACKEND_HOOK] - PATCH /api/v1/discounts/:id/toggle - Returns: Promise<DiscountRule>
  async toggleDiscount(id: string): Promise<DiscountRule> {
    const index = this.discounts.findIndex(d => d.id === id);
    if (index === -1) throw new Error(`Discount ${id} not found`);
    this.discounts[index].active = !this.discounts[index].active;
    saveStorage(STORAGE_KEYS.DISCOUNTS, this.discounts);
    return this.discounts[index];
  }

  // -------------------------------------------------------------
  // DEMO FINANCE METRICS (local illustrative calculations; no timing guarantee)
  // -------------------------------------------------------------
  // TODO: [BACKEND_HOOK] - GET /api/v1/analytics/finance-metrics - Returns: Promise<FinanceMetrics>
  async getFinanceMetrics(): Promise<FinanceMetrics> {
    let activeMrr = 0;
    let activeCount = 0;

    for (let i = 0; i < this.subscriptions.length; i++) {
      const sub = this.subscriptions[i];
      if (sub.status === 'Active') {
        activeCount++;
        if (sub.cadence === 'DAILY') {
          activeMrr += sub.totalAmount * 30;
        } else if (sub.cadence === 'WEEKLY') {
          activeMrr += sub.totalAmount * 4.33;
        } else if (sub.cadence === 'YEARLY') {
          activeMrr += sub.totalAmount / 12;
        } else {
          activeMrr += sub.totalAmount;
        }
      }
    }

    const arr = activeMrr * 12;

    let overdueReceivables = 0;
    let collectedRevenue = 0;

    for (let j = 0; j < this.invoices.length; j++) {
      const inv = this.invoices[j];
      collectedRevenue += inv.amountPaid;
      if (inv.status === 'Overdue' || (inv.status === 'Confirmed' && new Date(inv.dueDate) < new Date())) {
        overdueReceivables += inv.amountDue;
      }
    }

    const history = [
      { month: 'Jun', mrr: Number((activeMrr * 0.72).toFixed(0)), arr: Number((arr * 0.72).toFixed(0)), collected: Number((collectedRevenue * 0.65).toFixed(0)) },
      { month: 'Jul', mrr: Number((activeMrr * 0.79).toFixed(0)), arr: Number((arr * 0.79).toFixed(0)), collected: Number((collectedRevenue * 0.75).toFixed(0)) },
      { month: 'Aug', mrr: Number((activeMrr * 0.86).toFixed(0)), arr: Number((arr * 0.86).toFixed(0)), collected: Number((collectedRevenue * 0.82).toFixed(0)) },
      { month: 'Sep', mrr: Number((activeMrr * 0.93).toFixed(0)), arr: Number((arr * 0.93).toFixed(0)), collected: Number((collectedRevenue * 0.91).toFixed(0)) },
      { month: 'Oct', mrr: Number(activeMrr.toFixed(0)), arr: Number(arr.toFixed(0)), collected: Number(collectedRevenue.toFixed(0)) },
    ];

    return {
      activeMrr: Number(activeMrr.toFixed(2)),
      arr: Number(arr.toFixed(2)),
      overdueReceivables: Number(overdueReceivables.toFixed(2)),
      collectedRevenue: Number(collectedRevenue.toFixed(2)),
      activeSubscriptionsCount: activeCount,
      revenueHistory: history,
    };
  }

  // -------------------------------------------------------------
  // STRESS TESTING & BENCHMARKING
  // -------------------------------------------------------------
  async seedStressData(count = 2500): Promise<{ count: number; durationMs: number }> {
    const t0 = performance.now();
    const generated = generateStressSubscriptions(count);
    this.subscriptions = [...generated, ...this.subscriptions];
    saveStorage(STORAGE_KEYS.SUBSCRIPTIONS, this.subscriptions);
    const durationMs = performance.now() - t0;
    return { count: this.subscriptions.length, durationMs };
  }

  resetToDefaults(): void {
    if (isBrowser) {
      window.localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
      window.localStorage.removeItem(STORAGE_KEYS.PLANS);
      window.localStorage.removeItem(STORAGE_KEYS.TEMPLATES);
      window.localStorage.removeItem(STORAGE_KEYS.SUBSCRIPTIONS);
      window.localStorage.removeItem(STORAGE_KEYS.INVOICES);
      window.localStorage.removeItem(STORAGE_KEYS.DISCOUNTS);
      window.localStorage.removeItem(STORAGE_KEYS.PAYMENTS);
    }

    this.products = [...SEED_PRODUCTS];
    this.plans = [...SEED_PLANS];
    this.templates = [...SEED_TEMPLATES];
    this.subscriptions = [...SEED_SUBSCRIPTIONS];
    this.invoices = [...SEED_INVOICES];
    this.discounts = [...SEED_DISCOUNTS];
    this.payments = [...SEED_PAYMENTS];
  }
}

export const apiAdapter = new ApiAdapter();
