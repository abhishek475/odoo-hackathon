import { env } from '../config/env.js';
import { supabaseAdmin } from '../config/supabase.js';
import {
  User,
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
  toCents,
  toDollars,
  roundCurrency,
} from '../types/models.js';
import { assertValidSubscriptionTransition, assertValidInvoiceTransition } from '../engine/stateMachine.js';
import { BillingRunner } from '../engine/billingRunner.js';

// Initial Seed Data for local memory / fallback
const INITIAL_USERS: User[] = [
  {
    id: 'usr-admin-1',
    name: 'Alexandra Vance',
    email: 'alexandra.vance@brightloop.io',
    role: 'Admin',
    companyName: 'Brightloop Systems Inc.',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    passwordHash: '$2a$10$wT0o3s3.1.Zz1L/h1WqNteT8O0E7p5iT0e7F6e6X9A5e5B5C5D5E.',
  },
  {
    id: 'usr-staff-1',
    name: 'Marcus Brody',
    email: 'marcus.brody@brightloop.io',
    role: 'Staff',
    companyName: 'Brightloop Operations',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    passwordHash: '$2a$10$wT0o3s3.1.Zz1L/h1WqNteT8O0E7p5iT0e7F6e6X9A5e5B5C5D5E.',
  },
  {
    id: 'usr-customer-1',
    name: 'Elena Rostova',
    email: 'elena@novacloud.tech',
    role: 'Customer',
    companyName: 'NovaCloud Technologies LLC',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    passwordHash: '$2a$10$wT0o3s3.1.Zz1L/h1WqNteT8O0E7p5iT0e7F6e6X9A5e5B5C5D5E.',
  },
];

const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-001',
    name: 'Dedicated Kubernetes Cluster',
    type: 'SERVICE',
    salesPrice: 850.0,
    costPrice: 420.0,
    notes: 'Managed multi-region K8s control plane with autoscaling worker nodes.',
    active: true,
    createdAt: '2026-01-15T08:00:00Z',
    variants: [
      { id: 'var-001-1', name: '3-Node High Availability', priceModifier: 0, sku: 'K8S-3N-HA' },
      { id: 'var-001-2', name: '5-Node High Availability', priceModifier: 400.0, sku: 'K8S-5N-HA' },
      { id: 'var-001-3', name: 'Bare Metal GPU Enabled', priceModifier: 1200.0, sku: 'K8S-GPU-BM' },
    ],
  },
  {
    id: 'prod-002',
    name: 'Enterprise DB Storage & Replication',
    type: 'SERVICE',
    salesPrice: 320.0,
    costPrice: 110.0,
    notes: 'Distributed PostgreSQL engine with point-in-time recovery and zero-lag streaming replication.',
    active: true,
    createdAt: '2026-01-20T10:30:00Z',
    variants: [
      { id: 'var-002-1', name: '1TB NVMe Tier', priceModifier: 0, sku: 'DB-1TB-NVME' },
      { id: 'var-002-2', name: '5TB NVMe Tier', priceModifier: 450.0, sku: 'DB-5TB-NVME' },
    ],
  },
  {
    id: 'prod-003',
    name: 'AI Real-time Inference Gateway',
    type: 'SERVICE',
    salesPrice: 490.0,
    costPrice: 200.0,
    notes: 'Low-latency edge caching and model gateway with dynamic load shedding.',
    active: true,
    createdAt: '2026-02-01T14:15:00Z',
    variants: [
      { id: 'var-003-1', name: '10M Tokens/mo included', priceModifier: 0, sku: 'AI-GATEWAY-10M' },
      { id: 'var-003-2', name: '50M Tokens/mo included', priceModifier: 800.0, sku: 'AI-GATEWAY-50M' },
    ],
  },
  {
    id: 'prod-004',
    name: '24/7 Dedicated Support & SLA Shield',
    type: 'SERVICE',
    salesPrice: 600.0,
    costPrice: 150.0,
    notes: '15-minute response SLA with dedicated site reliability engineers on standby.',
    active: true,
    createdAt: '2026-02-10T09:00:00Z',
    variants: [
      { id: 'var-004-1', name: 'Silver Tier (1hr response)', priceModifier: -200.0, sku: 'SLA-SILVER' },
      { id: 'var-004-2', name: 'Platinum Tier (15min response)', priceModifier: 0, sku: 'SLA-PLATINUM' },
    ],
  },
  {
    id: 'prod-005',
    name: 'Odoo Enterprise Suite Connector',
    type: 'SERVICE',
    salesPrice: 560.0,
    costPrice: 180.0,
    notes: 'Certified Odoo connector supporting automated journal entries, GL syncing, and recurring invoice webhooks.',
    active: true,
    createdAt: '2026-02-15T10:00:00Z',
    variants: [
      { id: 'var-005-1', name: 'Standard Odoo Sync (+560 Modifier)', priceModifier: 560.0, sku: 'ODOO-SYNC-560' },
    ],
  },
];

const INITIAL_PLANS: BillingPlan[] = [
  {
    id: 'plan-daily',
    name: 'Daily Flex Tier',
    cadence: 'DAILY',
    minQuantity: 1,
    validityDays: 30,
    autoClose: false,
    pausePermission: true,
    basePrice: 45.0,
    description: 'On-demand daily metered cadence for rapid scale and bursting environments.',
  },
  {
    id: 'plan-monthly',
    name: 'Pro Monthly Cadence',
    cadence: 'MONTHLY',
    minQuantity: 1,
    validityDays: 365,
    autoClose: false,
    pausePermission: true,
    basePrice: 1250.0,
    description: 'Billed on the 1st of every month with standard overage reconciliation.',
  },
  {
    id: 'plan-yearly',
    name: 'Enterprise Annual Commitment',
    cadence: 'YEARLY',
    minQuantity: 1,
    validityDays: 730,
    autoClose: true,
    pausePermission: false,
    basePrice: 12500.0,
    description: 'Prepaid annual plan offering 20% discount on all core platform services.',
  },
];

const INITIAL_TEMPLATES: QuotationTemplate[] = [
  {
    id: 'tmpl-001',
    name: 'High-Growth Tech Startup Stack',
    planId: 'plan-monthly',
    planName: 'Pro Monthly Cadence',
    validityDays: 30,
    notes: 'Includes high-availability cluster, database tier, and standard support.',
    lines: [
      {
        id: 'tmpl-line-1',
        productId: 'prod-001',
        productName: 'Dedicated Kubernetes Cluster',
        variantId: 'var-001-1',
        variantName: '3-Node High Availability',
        quantity: 1,
        unitPrice: 850.0,
        discountPercent: 10,
        lineTotal: 765.0,
      },
      {
        id: 'tmpl-line-2',
        productId: 'prod-002',
        productName: 'Enterprise DB Storage & Replication',
        variantId: 'var-002-1',
        variantName: '1TB NVMe Tier',
        quantity: 1,
        unitPrice: 320.0,
        discountPercent: 0,
        lineTotal: 320.0,
      },
    ],
  },
];

const INITIAL_SUBSCRIPTIONS: Subscription[] = [
  {
    id: 'sub-1001',
    subscriptionNumber: 'SUB-2026-0014',
    customerId: 'usr-customer-1',
    customerName: 'NovaCloud Technologies LLC',
    customerEmail: 'elena@novacloud.tech',
    planId: 'plan-monthly',
    planName: 'Pro Monthly Cadence',
    cadence: 'MONTHLY',
    status: 'Active',
    startDate: '2026-01-01',
    nextBillingDate: '2026-11-01',
    autoClose: false,
    pauseAllowed: true,
    totalAmount: 2260.0,
    notes: 'Critical production cluster.',
    lines: [
      {
        id: 'line-101',
        productId: 'prod-001',
        productName: 'Dedicated Kubernetes Cluster',
        variantId: 'var-001-2',
        variantName: '5-Node High Availability',
        quantity: 1,
        unitPrice: 1250.0,
        discountPercent: 0,
        lineTotal: 1250.0,
      },
      {
        id: 'line-102',
        productId: 'prod-002',
        productName: 'Enterprise DB Storage & Replication',
        variantId: 'var-002-2',
        variantName: '5TB NVMe Tier',
        quantity: 1,
        unitPrice: 770.0,
        discountPercent: 0,
        lineTotal: 770.0,
      },
    ],
    history: [
      { date: '2026-01-01', action: 'Activated', performedBy: 'System Scheduler' },
    ],
  },
  {
    id: 'sub-1002',
    subscriptionNumber: 'SUB-2026-0028',
    customerId: 'cust-apex',
    customerName: 'Apex Data Dynamics',
    customerEmail: 'billing@apexdata.io',
    planId: 'plan-monthly',
    planName: 'Pro Monthly Cadence',
    cadence: 'MONTHLY',
    status: 'Paused',
    startDate: '2026-02-15',
    nextBillingDate: '2026-11-15',
    autoClose: false,
    pauseAllowed: true,
    totalAmount: 1480.0,
    notes: 'Paused for migration window.',
    lines: [
      {
        id: 'line-104',
        productId: 'prod-001',
        productName: 'Dedicated Kubernetes Cluster',
        variantId: 'var-001-1',
        variantName: '3-Node High Availability',
        quantity: 1,
        unitPrice: 850.0,
        discountPercent: 0,
        lineTotal: 850.0,
      },
    ],
    history: [
      { date: '2026-02-15', action: 'Activated', performedBy: 'Alexandra Vance' },
      { date: '2026-10-15', action: 'Paused', performedBy: 'Marcus Brody' },
    ],
  },
];

const INITIAL_INVOICES: Invoice[] = [
  {
    id: 'inv-8001',
    invoiceNumber: 'INV-2026-0891',
    subscriptionId: 'sub-1001',
    customerId: 'usr-customer-1',
    customerName: 'NovaCloud Technologies LLC',
    customerEmail: 'elena@novacloud.tech',
    customerAddress: '440 Mission St, Suite 1200, San Francisco, CA 94105',
    status: 'Paid',
    issueDate: '2026-10-01',
    dueDate: '2026-10-15',
    lines: [
      {
        id: 'inv-line-1',
        productId: 'prod-001',
        productName: 'Dedicated Kubernetes Cluster (5-Node HA)',
        quantity: 1,
        unitPrice: 1250.0,
        discountPercent: 0,
        lineTotal: 1250.0,
      },
    ],
    subtotal: 2020.0,
    discountAmount: 0.0,
    taxAmount: 202.0,
    totalAmount: 2222.0,
    amountPaid: 2222.0,
    amountDue: 0.0,
    paymentHistory: [
      {
        id: 'pay-001',
        invoiceId: 'inv-8001',
        invoiceNumber: 'INV-2026-0891',
        customerId: 'usr-customer-1',
        customerName: 'NovaCloud Technologies LLC',
        amount: 2222.0,
        paymentMethod: 'CARD',
        referenceNumber: 'STRIPE_CH_948194821',
        paymentDate: '2026-10-04T12:30:00Z',
        status: 'SUCCESS',
        notes: 'Auto-charged corporate card ending in 4242',
      },
    ],
  },
];

const INITIAL_DISCOUNTS: DiscountRule[] = [
  {
    id: 'disc-01',
    code: 'BRIGHTLOOP20',
    name: 'Q4 2026 Enterprise Growth Promo',
    type: 'PERCENT',
    value: 20,
    minOrderAmount: 2000.0,
    validUntil: '2026-12-31',
    active: true,
    usageCount: 42,
  },
  {
    id: 'disc-02',
    code: 'AIACCEL500',
    name: 'AI Inference Onboarding Credit',
    type: 'FIXED',
    value: 500.0,
    minOrderAmount: 1500.0,
    validUntil: '2026-11-30',
    active: true,
    usageCount: 19,
  },
];

const INITIAL_PAYMENTS: PaymentRecord[] = [
  {
    id: 'pay-001',
    invoiceId: 'inv-8001',
    invoiceNumber: 'INV-2026-0891',
    customerId: 'usr-customer-1',
    customerName: 'NovaCloud Technologies LLC',
    amount: 2222.0,
    paymentMethod: 'CARD',
    referenceNumber: 'STRIPE_CH_948194821',
    paymentDate: '2026-10-04T12:30:00Z',
    status: 'SUCCESS',
    notes: 'Settled through Stripe ACH integration.',
  },
];

// Database Row <-> TypeScript Model Mappers
function mapDbSubscriptionToModel(row: any): Subscription {
  return {
    id: row.id,
    subscriptionNumber: row.subscription_number,
    customerId: row.customer_id,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    planId: row.plan_id || '',
    planName: row.plan_name || '',
    cadence: row.cadence,
    status: row.status,
    startDate: row.start_date ? String(row.start_date).split('T')[0] : '',
    nextBillingDate: row.next_billing_date ? String(row.next_billing_date).split('T')[0] : '',
    endDate: row.end_date ? String(row.end_date).split('T')[0] : undefined,
    autoClose: Boolean(row.auto_close),
    pauseAllowed: Boolean(row.pause_allowed),
    lines: Array.isArray(row.lines) ? row.lines : [],
    totalAmount: typeof row.total_amount_cents === 'number' ? toDollars(row.total_amount_cents) : 0,
    notes: row.notes || '',
    history: Array.isArray(row.history) ? row.history : [],
  };
}

function subscriptionToDb(sub: Subscription) {
  return {
    id: sub.id,
    subscription_number: sub.subscriptionNumber,
    customer_id: sub.customerId,
    customer_name: sub.customerName,
    customer_email: sub.customerEmail,
    plan_id: sub.planId || null,
    plan_name: sub.planName,
    cadence: sub.cadence,
    status: sub.status,
    start_date: sub.startDate,
    next_billing_date: sub.nextBillingDate,
    end_date: sub.endDate || null,
    auto_close: sub.autoClose,
    pause_allowed: sub.pauseAllowed,
    lines: sub.lines || [],
    total_amount_cents: toCents(sub.totalAmount),
    notes: sub.notes || '',
    history: sub.history || [],
  };
}

function mapDbInvoiceToModel(row: any): Invoice {
  return {
    id: row.id,
    invoiceNumber: row.invoice_number,
    subscriptionId: row.subscription_id || undefined,
    customerId: row.customer_id,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    customerAddress: row.customer_address || '',
    status: row.status,
    issueDate: row.issue_date ? String(row.issue_date).split('T')[0] : '',
    dueDate: row.due_date ? String(row.due_date).split('T')[0] : '',
    lines: Array.isArray(row.lines) ? row.lines : [],
    subtotal: toDollars(row.subtotal_cents || 0),
    discountAmount: toDollars(row.discount_amount_cents || 0),
    taxAmount: toDollars(row.tax_amount_cents || 0),
    totalAmount: toDollars(row.total_amount_cents || 0),
    amountPaid: toDollars(row.amount_paid_cents || 0),
    amountDue: toDollars(row.amount_due_cents || 0),
    paymentHistory: Array.isArray(row.payment_history) ? row.payment_history : [],
  };
}

function invoiceToDb(inv: Invoice) {
  return {
    id: inv.id,
    invoice_number: inv.invoiceNumber,
    subscription_id: inv.subscriptionId || null,
    customer_id: inv.customerId,
    customer_name: inv.customerName,
    customer_email: inv.customerEmail,
    customer_address: inv.customerAddress || '',
    status: inv.status,
    issue_date: inv.issueDate,
    due_date: inv.dueDate,
    lines: inv.lines || [],
    subtotal_cents: toCents(inv.subtotal),
    discount_amount_cents: toCents(inv.discountAmount),
    tax_amount_cents: toCents(inv.taxAmount),
    total_amount_cents: toCents(inv.totalAmount),
    amount_paid_cents: toCents(inv.amountPaid),
    amount_due_cents: toCents(inv.amountDue),
    payment_history: inv.paymentHistory || [],
  };
}

function mapDbProductToModel(row: any, variants: any[] = []): Product {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    salesPrice: toDollars(row.sales_price_cents || 0),
    costPrice: toDollars(row.cost_price_cents || 0),
    notes: row.notes || '',
    active: Boolean(row.active),
    createdAt: row.created_at || new Date().toISOString(),
    variants: variants.map(v => ({
      id: v.id,
      name: v.name,
      priceModifier: toDollars(v.price_modifier_cents || 0),
      sku: v.sku,
    })),
  };
}

function mapDbPlanToModel(row: any): BillingPlan {
  return {
    id: row.id,
    name: row.name,
    cadence: row.cadence,
    minQuantity: row.min_quantity || 1,
    validityDays: row.validity_days || 365,
    autoClose: Boolean(row.auto_close),
    pausePermission: Boolean(row.pause_permission),
    basePrice: toDollars(row.base_price_cents || 0),
    description: row.description || '',
  };
}

function mapDbTemplateToModel(row: any): QuotationTemplate {
  return {
    id: row.id,
    name: row.name,
    planId: row.plan_id || '',
    planName: row.plan_name || '',
    validityDays: row.validity_days || 30,
    notes: row.notes || '',
    lines: Array.isArray(row.lines) ? row.lines : [],
  };
}

function mapDbDiscountToModel(row: any): DiscountRule {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    type: row.type,
    value: row.type === 'PERCENT' ? row.value_cents_or_pct : toDollars(row.value_cents_or_pct || 0),
    minOrderAmount: toDollars(row.min_order_amount_cents || 0),
    validUntil: row.valid_until ? String(row.valid_until).split('T')[0] : '',
    active: Boolean(row.active),
    usageCount: row.usage_count || 0,
  };
}

function mapDbPaymentToModel(row: any): PaymentRecord {
  return {
    id: row.id,
    invoiceId: row.invoice_id,
    invoiceNumber: row.invoice_number,
    customerId: row.customer_id,
    customerName: row.customer_name,
    amount: toDollars(row.amount_cents || 0),
    paymentMethod: row.payment_method,
    referenceNumber: row.reference_number,
    paymentDate: row.payment_date,
    status: row.status,
    notes: row.notes || undefined,
  };
}

function mapDbUserToModel(row: any): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    companyName: row.company_name || undefined,
    avatarUrl: row.avatar_url || undefined,
    passwordHash: row.password_hash || undefined,
    createdAt: row.created_at,
  };
}

class DataStore {
  private users: User[] = [...INITIAL_USERS];
  private products: Product[] = [...INITIAL_PRODUCTS];
  private plans: BillingPlan[] = [...INITIAL_PLANS];
  private templates: QuotationTemplate[] = [...INITIAL_TEMPLATES];
  private subscriptions: Subscription[] = [...INITIAL_SUBSCRIPTIONS];
  private invoices: Invoice[] = [...INITIAL_INVOICES];
  private discounts: DiscountRule[] = [...INITIAL_DISCOUNTS];
  private payments: PaymentRecord[] = [...INITIAL_PAYMENTS];

  private isDbConnected = false;

  constructor() {
    // Attempt background database hydration on construction
    this.init().catch(err => {
      console.warn('[DataStore Init Warning]', err?.message || err);
    });
  }

  // ==============================================================================
  // SUPABASE DATABASE HYDRATION & RECONCILIATION
  // ==============================================================================
  async init(): Promise<void> {
    if (!supabaseAdmin) return;
    try {
      const { data: dbUsers, error: userErr } = await supabaseAdmin.from('users').select('*');
      if (userErr) {
        console.warn(
          '\x1b[33m%s\x1b[0m',
          `[Supabase Notice] Tables currently require permissions: ${userErr.message}.`
        );
        console.warn(
          '\x1b[36m%s\x1b[0m',
          `[Supabase Notice] To grant full access, execute 'backend/supabase/migrations/002_grant_permissions.sql' in Supabase SQL Editor. Operating with in-memory caching in the interim.`
        );
        return;
      }

      this.isDbConnected = true;

      if (dbUsers && dbUsers.length > 0) {
        this.users = dbUsers.map(mapDbUserToModel);
      }

      const [{ data: dbProducts }, { data: dbVariants }] = await Promise.all([
        supabaseAdmin.from('products').select('*').order('created_at', { ascending: false }),
        supabaseAdmin.from('product_variants').select('*'),
      ]);
      if (dbProducts && dbProducts.length > 0) {
        this.products = dbProducts.map(p =>
          mapDbProductToModel(p, (dbVariants || []).filter(v => v.product_id === p.id))
        );
      }

      const { data: dbPlans } = await supabaseAdmin.from('billing_plans').select('*');
      if (dbPlans && dbPlans.length > 0) {
        this.plans = dbPlans.map(mapDbPlanToModel);
      }

      const { data: dbTemplates } = await supabaseAdmin.from('quotation_templates').select('*');
      if (dbTemplates && dbTemplates.length > 0) {
        this.templates = dbTemplates.map(mapDbTemplateToModel);
      }

      const { data: dbSubs } = await supabaseAdmin
        .from('subscriptions')
        .select('*')
        .order('created_at', { ascending: false });
      if (dbSubs && dbSubs.length > 0) {
        this.subscriptions = dbSubs.map(mapDbSubscriptionToModel);
      }

      const { data: dbInvs } = await supabaseAdmin
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });
      if (dbInvs && dbInvs.length > 0) {
        this.invoices = dbInvs.map(mapDbInvoiceToModel);
      }

      const { data: dbDiscs } = await supabaseAdmin.from('discount_rules').select('*');
      if (dbDiscs && dbDiscs.length > 0) {
        this.discounts = dbDiscs.map(mapDbDiscountToModel);
      }

      const { data: dbPays } = await supabaseAdmin
        .from('payments')
        .select('*')
        .order('payment_date', { ascending: false });
      if (dbPays && dbPays.length > 0) {
        this.payments = dbPays.map(mapDbPaymentToModel);
      }

      console.log(
        '\x1b[32m%s\x1b[0m',
        `✓ [Supabase Sync] Hydrated store from live PostgreSQL (${this.subscriptions.length} subscriptions, ${this.products.length} products, ${this.invoices.length} invoices).`
      );
    } catch (err: any) {
      console.warn('[Supabase Sync Hydration Warning]', err?.message || err);
    }
  }

  // ==============================================================================
  // USERS
  // ==============================================================================
  async getUsers(): Promise<User[]> {
    return [...this.users];
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const found = this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    return found || null;
  }

  async createUser(userData: Omit<User, 'id'>): Promise<User> {
    const newUser: User = {
      ...userData,
      id: `usr-${Date.now().toString(36)}`,
      createdAt: new Date().toISOString(),
    };

    if (supabaseAdmin) {
      try {
        const { error } = await supabaseAdmin.from('users').insert({
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          password_hash: newUser.passwordHash || '',
          role: newUser.role,
          company_name: newUser.companyName || '',
          avatar_url: newUser.avatarUrl || '',
          created_at: newUser.createdAt,
        });
        if (error) console.warn('[Supabase Sync User Insert Notice]', error.message);
      } catch (e: any) {
        console.warn('[Supabase Sync User Catch]', e.message);
      }
    }

    this.users.push(newUser);
    return newUser;
  }

  // ==============================================================================
  // PRODUCTS & VARIANTS
  // ==============================================================================
  async getProducts(): Promise<Product[]> {
    return [...this.products];
  }

  async createProduct(data: Omit<Product, 'id' | 'createdAt'>): Promise<Product> {
    const newProd: Product = {
      ...data,
      id: `prod-${Date.now().toString(36)}`,
      createdAt: new Date().toISOString(),
      variants: data.variants || [],
    };

    if (supabaseAdmin) {
      try {
        const { error: prodErr } = await supabaseAdmin.from('products').insert({
          id: newProd.id,
          name: newProd.name,
          type: newProd.type,
          sales_price_cents: toCents(newProd.salesPrice),
          cost_price_cents: toCents(newProd.costPrice),
          notes: newProd.notes || '',
          active: newProd.active,
          created_at: newProd.createdAt,
        });
        if (prodErr) console.warn('[Supabase Sync Product Insert Notice]', prodErr.message);

        if (newProd.variants && newProd.variants.length > 0) {
          const varRows = newProd.variants.map((v, idx) => ({
            id: v.id || `var-${newProd.id.replace('prod-', '')}-${idx + 1}`,
            product_id: newProd.id,
            name: v.name,
            price_modifier_cents: toCents(v.priceModifier),
            sku: v.sku,
          }));
          const { error: varErr } = await supabaseAdmin.from('product_variants').insert(varRows);
          if (varErr) console.warn('[Supabase Sync Variant Insert Notice]', varErr.message);
        }
      } catch (e: any) {
        console.warn('[Supabase Sync Product Catch]', e.message);
      }
    }

    this.products.unshift(newProd);
    return newProd;
  }

  // ==============================================================================
  // BILLING PLANS
  // ==============================================================================
  async getPlans(): Promise<BillingPlan[]> {
    return [...this.plans];
  }

  async createPlan(data: Omit<BillingPlan, 'id'>): Promise<BillingPlan> {
    const newPlan: BillingPlan = {
      ...data,
      id: `plan-${Date.now().toString(36)}`,
    };

    if (supabaseAdmin) {
      try {
        const { error } = await supabaseAdmin.from('billing_plans').insert({
          id: newPlan.id,
          name: newPlan.name,
          cadence: newPlan.cadence,
          min_quantity: newPlan.minQuantity,
          validity_days: newPlan.validityDays,
          auto_close: newPlan.autoClose,
          pause_permission: newPlan.pausePermission,
          base_price_cents: toCents(newPlan.basePrice),
          description: newPlan.description || '',
        });
        if (error) console.warn('[Supabase Sync Plan Insert Notice]', error.message);
      } catch (e: any) {
        console.warn('[Supabase Sync Plan Catch]', e.message);
      }
    }

    this.plans.push(newPlan);
    return newPlan;
  }

  // ==============================================================================
  // QUOTATION TEMPLATES
  // ==============================================================================
  async getTemplates(): Promise<QuotationTemplate[]> {
    return [...this.templates];
  }

  async createTemplate(data: Omit<QuotationTemplate, 'id'>): Promise<QuotationTemplate> {
    const newTemplate: QuotationTemplate = {
      ...data,
      id: `tmpl-${Date.now().toString(36)}`,
    };

    if (supabaseAdmin) {
      try {
        const { error } = await supabaseAdmin.from('quotation_templates').insert({
          id: newTemplate.id,
          name: newTemplate.name,
          plan_id: newTemplate.planId || null,
          plan_name: newTemplate.planName,
          validity_days: newTemplate.validityDays,
          notes: newTemplate.notes || '',
          lines: newTemplate.lines,
        });
        if (error) console.warn('[Supabase Sync Template Insert Notice]', error.message);
      } catch (e: any) {
        console.warn('[Supabase Sync Template Catch]', e.message);
      }
    }

    this.templates.unshift(newTemplate);
    return newTemplate;
  }

  // ==============================================================================
  // SUBSCRIPTIONS & LIFECYCLE
  // ==============================================================================
  async getSubscriptions(filterCustomerId?: string): Promise<Subscription[]> {
    if (filterCustomerId) {
      return this.subscriptions.filter(s => s.customerId === filterCustomerId);
    }
    return [...this.subscriptions];
  }

  async createSubscription(data: Partial<Subscription>): Promise<Subscription> {
    const subNumber =
      data.subscriptionNumber ||
      `SUB-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newSub: Subscription = {
      id: data.id || `sub-${Date.now().toString(36)}`,
      subscriptionNumber: subNumber,
      customerId: data.customerId || 'cust-direct',
      customerName: data.customerName || 'Direct Customer',
      customerEmail: data.customerEmail || 'billing@example.com',
      planId: data.planId || (this.plans[0]?.id ?? 'plan-monthly'),
      planName: data.planName || (this.plans[0]?.name ?? 'Pro Monthly Cadence'),
      cadence: data.cadence || 'MONTHLY',
      status: data.status || 'Draft',
      startDate: data.startDate || new Date().toISOString().split('T')[0],
      nextBillingDate:
        data.nextBillingDate ||
        new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      autoClose: data.autoClose ?? false,
      pauseAllowed: data.pauseAllowed ?? true,
      lines: data.lines || [],
      totalAmount: data.totalAmount || 0,
      notes: data.notes || '',
      history: [
        {
          date: new Date().toISOString().split('T')[0],
          action: 'Created Draft',
          performedBy: 'Internal Staff/API',
        },
      ],
    };

    if (supabaseAdmin) {
      try {
        const { error } = await supabaseAdmin.from('subscriptions').insert(subscriptionToDb(newSub));
        if (error) {
          console.warn('[Supabase Sync Subscription Insert Notice]', error.message);
        } else {
          console.log(`[Supabase Sync] Persisted subscription ${newSub.subscriptionNumber} to database.`);
        }
      } catch (e: any) {
        console.warn('[Supabase Sync Subscription Catch]', e.message);
      }
    }

    this.subscriptions.unshift(newSub);
    return newSub;
  }

  async updateSubscriptionStatus(
    id: string,
    newStatus: SubscriptionStatus,
    performedBy: string = 'System/API',
    note?: string
  ): Promise<Subscription> {
    const index = this.subscriptions.findIndex(s => s.id === id);
    if (index === -1) throw new Error(`Subscription with ID "${id}" was not found.`);

    const current = this.subscriptions[index];
    assertValidSubscriptionTransition(current.status, newStatus);

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

    if (supabaseAdmin) {
      try {
        const { error } = await supabaseAdmin
          .from('subscriptions')
          .update({
            status: newStatus,
            history: updated.history,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id);
        if (error) console.warn('[Supabase Sync Status Update Notice]', error.message);
      } catch (e: any) {
        console.warn('[Supabase Sync Status Catch]', e.message);
      }
    }

    this.subscriptions[index] = updated;
    return updated;
  }

  // ==============================================================================
  // INVOICES & BATCH BILLING DAY
  // ==============================================================================
  async getInvoices(filterCustomerId?: string): Promise<Invoice[]> {
    if (filterCustomerId) {
      return this.invoices.filter(i => i.customerId === filterCustomerId);
    }
    return [...this.invoices];
  }

  async createInvoice(invData: Invoice): Promise<Invoice> {
    if (supabaseAdmin) {
      try {
        const { error } = await supabaseAdmin.from('invoices').insert(invoiceToDb(invData));
        if (error) console.warn('[Supabase Sync Invoice Insert Notice]', error.message);
      } catch (e: any) {
        console.warn('[Supabase Sync Invoice Catch]', e.message);
      }
    }
    this.invoices.unshift(invData);
    return invData;
  }

  async updateInvoiceStatus(id: string, status: InvoiceStatus): Promise<Invoice> {
    const index = this.invoices.findIndex(i => i.id === id);
    if (index === -1) throw new Error(`Invoice with ID "${id}" was not found.`);

    const current = this.invoices[index];
    assertValidInvoiceTransition(current.status, status);

    current.status = status;

    if (supabaseAdmin) {
      try {
        const { error } = await supabaseAdmin
          .from('invoices')
          .update({
            status,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id);
        if (error) console.warn('[Supabase Sync Invoice Status Notice]', error.message);
      } catch (e: any) {
        console.warn('[Supabase Sync Invoice Status Catch]', e.message);
      }
    }

    return current;
  }

  async runBillingBatch(billingDate: string): Promise<{ generatedCount: number; invoices: Invoice[] }> {
    const result = BillingRunner.executeBatch(this.subscriptions, billingDate);

    if (result.invoices.length > 0) {
      this.invoices = [...result.invoices, ...this.invoices];

      // Update in-memory subscriptions
      for (const updatedSub of result.updatedSubscriptions) {
        const idx = this.subscriptions.findIndex(s => s.id === updatedSub.id);
        if (idx !== -1) {
          this.subscriptions[idx] = updatedSub;
        }
      }

      // Synchronize with database
      if (supabaseAdmin) {
        try {
          const invRows = result.invoices.map(invoiceToDb);
          const { error: invErr } = await supabaseAdmin.from('invoices').insert(invRows);
          if (invErr) console.warn('[Supabase Sync Batch Invoices Notice]', invErr.message);

          for (const sub of result.updatedSubscriptions) {
            await supabaseAdmin
              .from('subscriptions')
              .update({
                next_billing_date: sub.nextBillingDate,
                updated_at: new Date().toISOString(),
              })
              .eq('id', sub.id);
          }
        } catch (e: any) {
          console.warn('[Supabase Sync Batch Catch]', e.message);
        }
      }
    }

    return {
      generatedCount: result.generatedCount,
      invoices: result.invoices,
    };
  }

  // ==============================================================================
  // PAYMENTS & RECONCILIATION
  // ==============================================================================
  async getPayments(): Promise<PaymentRecord[]> {
    return [...this.payments];
  }

  async logPayment(data: {
    invoiceId: string;
    amount: number;
    paymentMethod: 'CARD' | 'ACH' | 'WIRE' | 'CHECK';
    referenceNumber: string;
    notes?: string;
  }): Promise<PaymentRecord> {
    const invIndex = this.invoices.findIndex(i => i.id === data.invoiceId);
    if (invIndex === -1) throw new Error(`Invoice with ID "${data.invoiceId}" was not found.`);

    const invoice = this.invoices[invIndex];
    const newPayment: PaymentRecord = {
      id: `pay-${Date.now().toString(36)}`,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      customerId: invoice.customerId,
      customerName: invoice.customerName,
      amount: roundCurrency(data.amount),
      paymentMethod: data.paymentMethod,
      referenceNumber: data.referenceNumber,
      paymentDate: new Date().toISOString(),
      status: 'SUCCESS',
      notes: data.notes || '',
    };

    // Exact financial reconciliation in integer cents
    const paidCents = toCents(invoice.amountPaid) + toCents(data.amount);
    const totalCents = toCents(invoice.totalAmount);
    const dueCents = Math.max(0, totalCents - paidCents);

    invoice.amountPaid = toDollars(paidCents);
    invoice.amountDue = toDollars(dueCents);
    if (dueCents === 0) {
      invoice.status = 'Paid';
    }

    invoice.paymentHistory.unshift(newPayment);
    this.payments.unshift(newPayment);

    if (supabaseAdmin) {
      try {
        const payDb = {
          id: newPayment.id,
          invoice_id: invoice.id,
          invoice_number: invoice.invoiceNumber,
          customer_id: invoice.customerId,
          customer_name: invoice.customerName,
          amount_cents: toCents(data.amount),
          payment_method: data.paymentMethod,
          reference_number: data.referenceNumber,
          payment_date: newPayment.paymentDate,
          status: newPayment.status,
          notes: newPayment.notes || '',
        };
        const { error: payErr } = await supabaseAdmin.from('payments').insert(payDb);
        if (payErr) console.warn('[Supabase Sync Payment Insert Notice]', payErr.message);

        const { error: invErr } = await supabaseAdmin
          .from('invoices')
          .update({
            amount_paid_cents: paidCents,
            amount_due_cents: dueCents,
            status: invoice.status,
            payment_history: invoice.paymentHistory,
            updated_at: new Date().toISOString(),
          })
          .eq('id', invoice.id);
        if (invErr) console.warn('[Supabase Sync Invoice Payment Reconcile Notice]', invErr.message);
      } catch (e: any) {
        console.warn('[Supabase Sync Payment Catch]', e.message);
      }
    }

    return newPayment;
  }

  // ==============================================================================
  // DISCOUNTS
  // ==============================================================================
  async getDiscounts(): Promise<DiscountRule[]> {
    return [...this.discounts];
  }

  async createDiscount(data: Omit<DiscountRule, 'id' | 'usageCount'>): Promise<DiscountRule> {
    const newRule: DiscountRule = {
      ...data,
      id: `disc-${Date.now().toString(36)}`,
      usageCount: 0,
    };

    if (supabaseAdmin) {
      try {
        const { error } = await supabaseAdmin.from('discount_rules').insert({
          id: newRule.id,
          code: newRule.code,
          name: newRule.name,
          type: newRule.type,
          value_cents_or_pct: newRule.type === 'PERCENT' ? newRule.value : toCents(newRule.value),
          min_order_amount_cents: toCents(newRule.minOrderAmount),
          valid_until: newRule.validUntil,
          active: newRule.active,
          usage_count: newRule.usageCount,
        });
        if (error) console.warn('[Supabase Sync Discount Insert Notice]', error.message);
      } catch (e: any) {
        console.warn('[Supabase Sync Discount Catch]', e.message);
      }
    }

    this.discounts.unshift(newRule);
    return newRule;
  }

  async toggleDiscount(id: string): Promise<DiscountRule> {
    const rule = this.discounts.find(d => d.id === id);
    if (!rule) throw new Error(`Discount rule "${id}" not found.`);
    rule.active = !rule.active;

    if (supabaseAdmin) {
      try {
        const { error } = await supabaseAdmin
          .from('discount_rules')
          .update({ active: rule.active })
          .eq('id', id);
        if (error) console.warn('[Supabase Sync Discount Toggle Notice]', error.message);
      } catch (e: any) {
        console.warn('[Supabase Sync Discount Toggle Catch]', e.message);
      }
    }

    return rule;
  }

  // ==============================================================================
  // FINANCE METRICS (<50ms execution SLA)
  // ==============================================================================
  async getFinanceMetrics(): Promise<FinanceMetrics> {
    // Attempt Supabase RPC first if connected
    if (supabaseAdmin && this.isDbConnected) {
      try {
        const { data: rpcMetrics, error } = await supabaseAdmin.rpc('get_finance_metrics');
        if (!error && rpcMetrics && typeof rpcMetrics.activeMrr === 'number') {
          return rpcMetrics as FinanceMetrics;
        }
      } catch {
        // Fall back to ultra-fast in-memory calculation below
      }
    }

    let activeMrrCents = 0;
    let activeSubsCount = 0;

    for (let i = 0; i < this.subscriptions.length; i++) {
      const sub = this.subscriptions[i];
      if (sub.status === 'Active') {
        activeSubsCount++;
        const totalCents = toCents(sub.totalAmount);
        if (sub.cadence === 'DAILY') {
          activeMrrCents += totalCents * 30;
        } else if (sub.cadence === 'WEEKLY') {
          activeMrrCents += Math.round(totalCents * 4.33);
        } else if (sub.cadence === 'YEARLY') {
          activeMrrCents += Math.round(totalCents / 12);
        } else {
          activeMrrCents += totalCents;
        }
      }
    }

    const arrCents = activeMrrCents * 12;

    let overdueCents = 0;
    let collectedCents = 0;

    for (let j = 0; j < this.invoices.length; j++) {
      const inv = this.invoices[j];
      collectedCents += toCents(inv.amountPaid);
      if (inv.status === 'Overdue' || (inv.status === 'Confirmed' && new Date(inv.dueDate) < new Date())) {
        overdueCents += toCents(inv.amountDue);
      }
    }

    const activeMrr = toDollars(activeMrrCents);
    const arr = toDollars(arrCents);
    const collectedRevenue = toDollars(collectedCents);
    const overdueReceivables = toDollars(overdueCents);

    return {
      activeMrr,
      arr,
      overdueReceivables,
      collectedRevenue,
      activeSubscriptionsCount: activeSubsCount,
      revenueHistory: [
        { month: 'Jun', mrr: Math.round(activeMrr * 0.72), arr: Math.round(arr * 0.72), collected: Math.round(collectedRevenue * 0.65) },
        { month: 'Jul', mrr: Math.round(activeMrr * 0.79), arr: Math.round(arr * 0.79), collected: Math.round(collectedRevenue * 0.75) },
        { month: 'Aug', mrr: Math.round(activeMrr * 0.86), arr: Math.round(arr * 0.86), collected: Math.round(collectedRevenue * 0.82) },
        { month: 'Sep', mrr: Math.round(activeMrr * 0.93), arr: Math.round(arr * 0.93), collected: Math.round(collectedRevenue * 0.91) },
        { month: 'Oct', mrr: Math.round(activeMrr), arr: Math.round(arr), collected: Math.round(collectedRevenue) },
      ],
    };
  }
}

export const dataStore = new DataStore();
