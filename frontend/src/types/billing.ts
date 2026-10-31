export type UserRole = 'Admin' | 'Staff' | 'Customer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  companyName?: string;
  avatarUrl?: string;
}

export type SubscriptionStatus = 'Draft' | 'Quotation' | 'Confirmed' | 'Active' | 'Paused' | 'Closed';

export type InvoiceStatus = 'Draft' | 'Confirmed' | 'Paid' | 'Cancelled' | 'Overdue';

export type PlanCadence = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export interface ProductVariant {
  id: string;
  name: string;
  priceModifier: number; // e.g. +20 or -10
  sku: string;
}

export interface Product {
  id: string;
  name: string;
  type: 'SERVICE' | 'GOODS';
  salesPrice: number;
  costPrice: number;
  notes: string;
  variants: ProductVariant[];
  active: boolean;
  createdAt: string;
}

export interface BillingPlan {
  id: string;
  name: string;
  cadence: PlanCadence;
  minQuantity: number;
  validityDays: number;
  autoClose: boolean;
  pausePermission: boolean;
  basePrice: number;
  description: string;
}

export interface OrderLineItem {
  id: string;
  productId: string;
  productName: string;
  variantId?: string;
  variantName?: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  lineTotal: number;
}

export interface QuotationTemplate {
  id: string;
  name: string;
  planId: string;
  planName: string;
  validityDays: number;
  notes: string;
  lines: OrderLineItem[];
}

export interface LifecycleEvent {
  date: string;
  action: string;
  performedBy: string;
  note?: string;
}

export interface Subscription {
  id: string;
  subscriptionNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  planId: string;
  planName: string;
  cadence: PlanCadence;
  status: SubscriptionStatus;
  startDate: string;
  nextBillingDate: string;
  endDate?: string;
  autoClose: boolean;
  pauseAllowed: boolean;
  lines: OrderLineItem[];
  totalAmount: number; // Recurring amount per cycle
  notes?: string;
  history: LifecycleEvent[];
}

export interface PaymentRecord {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  amount: number;
  paymentMethod: 'CARD' | 'ACH' | 'WIRE' | 'CHECK';
  referenceNumber: string;
  paymentDate: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  notes?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  subscriptionId?: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerAddress?: string;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  lines: OrderLineItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number; // standard 10% or computed
  totalAmount: number;
  amountPaid: number;
  amountDue: number;
  paymentHistory: PaymentRecord[];
}

export interface DiscountRule {
  id: string;
  code: string;
  name: string;
  type: 'PERCENT' | 'FIXED';
  value: number; // e.g. 15 for 15% or 50 for $50
  minOrderAmount: number;
  validUntil: string;
  active: boolean;
  usageCount: number;
}

export interface FinanceMetrics {
  activeMrr: number;
  arr: number;
  overdueReceivables: number;
  collectedRevenue: number;
  activeSubscriptionsCount: number;
  revenueHistory: {
    month: string;
    mrr: number;
    arr: number;
    collected: number;
  }[];
}
