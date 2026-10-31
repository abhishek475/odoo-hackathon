import { z } from 'zod';

// ==============================================================================
// DOMAIN MODELS & ENUMS (1:1 FRONTEND ALIGNMENT)
// ==============================================================================

export type UserRole = 'Admin' | 'Staff' | 'Customer';
export type SubscriptionStatus = 'Draft' | 'Quotation' | 'Confirmed' | 'Active' | 'Paused' | 'Closed';
export type InvoiceStatus = 'Draft' | 'Confirmed' | 'Paid' | 'Cancelled' | 'Overdue';
export type PlanCadence = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
export type PaymentMethod = 'CARD' | 'ACH' | 'WIRE' | 'CHECK';
export type PaymentStatus = 'SUCCESS' | 'PENDING' | 'FAILED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  companyName?: string;
  avatarUrl?: string;
  passwordHash?: string;
  createdAt?: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  priceModifier: number; // in Dollars (stored in cents in DB)
  sku: string;
}

export interface Product {
  id: string;
  name: string;
  type: 'SERVICE' | 'GOODS';
  salesPrice: number; // Dollars
  costPrice: number; // Dollars
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
  basePrice: number; // Dollars
  description: string;
}

export interface OrderLineItem {
  id: string;
  productId: string;
  productName: string;
  variantId?: string;
  variantName?: string;
  quantity: number;
  unitPrice: number; // Dollars
  discountPercent: number;
  lineTotal: number; // Dollars
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
  totalAmount: number; // Dollars
  notes?: string;
  history: LifecycleEvent[];
}

export interface PaymentRecord {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  amount: number; // Dollars
  paymentMethod: PaymentMethod;
  referenceNumber: string;
  paymentDate: string;
  status: PaymentStatus;
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
  subtotal: number; // Dollars
  discountAmount: number; // Dollars
  taxAmount: number; // Dollars
  totalAmount: number; // Dollars
  amountPaid: number; // Dollars
  amountDue: number; // Dollars
  paymentHistory: PaymentRecord[];
}

export interface DiscountRule {
  id: string;
  code: string;
  name: string;
  type: 'PERCENT' | 'FIXED';
  value: number; // % or Dollars
  minOrderAmount: number; // Dollars
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

// ==============================================================================
// FINANCIAL PRECISION MATH HELPERS (Zero Floating-Point Drift)
// ==============================================================================

export const toCents = (dollars: number): number => Math.round(Number(dollars) * 100);
export const toDollars = (cents: number): number => Number((Number(cents) / 100).toFixed(2));
export const roundCurrency = (amount: number): number => Number((Math.round(amount * 100) / 100).toFixed(2));

// ==============================================================================
// ZOD VALIDATION SCHEMAS
// ==============================================================================

export const LoginSchema = z.object({
  email: z.string().email('Valid email address is required'),
  password: z.string().min(1, 'Password is required'),
});

export const SignupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Valid corporate email is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least 1 uppercase letter')
    .regex(/[0-9]/, 'Must contain at least 1 numeric digit')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Must contain at least 1 special character'),
  role: z.enum(['Admin', 'Staff', 'Customer']).default('Staff'),
  companyName: z.string().optional(),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email('Valid email address is required'),
});

export const ProductCreateSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  type: z.enum(['SERVICE', 'GOODS']).default('SERVICE'),
  salesPrice: z.number().nonnegative('Sales price must be >= 0'),
  costPrice: z.number().nonnegative('Cost price must be >= 0').default(0),
  notes: z.string().optional().default(''),
  variants: z
    .array(
      z.object({
        name: z.string().min(1),
        priceModifier: z.number().default(0),
        sku: z.string().min(1),
      })
    )
    .default([]),
  active: z.boolean().default(true),
});

export const PlanCreateSchema = z.object({
  name: z.string().min(1, 'Plan name is required'),
  cadence: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']),
  minQuantity: z.number().int().min(1).default(1),
  validityDays: z.number().int().min(1).default(365),
  autoClose: z.boolean().default(false),
  pausePermission: z.boolean().default(true),
  basePrice: z.number().nonnegative('Base price must be >= 0'),
  description: z.string().optional().default(''),
});

export const TemplateCreateSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  planId: z.string().min(1, 'Plan ID is required'),
  planName: z.string().min(1),
  validityDays: z.number().int().default(30),
  notes: z.string().optional().default(''),
  lines: z
    .array(
      z.object({
        productId: z.string(),
        productName: z.string(),
        variantId: z.string().optional(),
        variantName: z.string().optional(),
        quantity: z.number().int().min(1),
        unitPrice: z.number().nonnegative(),
        discountPercent: z.number().min(0).max(100).default(0),
        lineTotal: z.number().nonnegative(),
      })
    )
    .default([]),
});

export const SubscriptionCreateSchema = z.object({
  customerId: z.string().optional(),
  customerName: z.string().min(1, 'Customer name is required'),
  customerEmail: z.string().email('Valid customer email is required'),
  planId: z.string().min(1, 'Plan ID is required'),
  planName: z.string().min(1),
  cadence: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']).default('MONTHLY'),
  status: z.enum(['Draft', 'Quotation', 'Confirmed', 'Active', 'Paused', 'Closed']).default('Draft'),
  startDate: z.string().optional(),
  nextBillingDate: z.string().optional(),
  autoClose: z.boolean().optional(),
  pauseAllowed: z.boolean().optional(),
  lines: z.array(z.any()).default([]),
  totalAmount: z.number().nonnegative().optional(),
  notes: z.string().optional(),
});

export const SubscriptionTransitionSchema = z.object({
  status: z.enum(['Draft', 'Quotation', 'Confirmed', 'Active', 'Paused', 'Closed']),
  performedBy: z.string().optional().default('System/Staff'),
  note: z.string().optional(),
});

export const BillingBatchRunSchema = z.object({
  billingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD'),
});

export const InvoiceStatusUpdateSchema = z.object({
  status: z.enum(['Draft', 'Confirmed', 'Paid', 'Cancelled', 'Overdue']),
});

export const DiscountCreateSchema = z.object({
  code: z.string().min(2, 'Code is required').toUpperCase(),
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['PERCENT', 'FIXED']),
  value: z.number().positive('Value must be > 0'),
  minOrderAmount: z.number().nonnegative().default(0),
  validUntil: z.string().min(1, 'Expiry date is required'),
  active: z.boolean().default(true),
});

export const PaymentLogSchema = z.object({
  invoiceId: z.string().min(1, 'Invoice ID is required'),
  amount: z.number().positive('Amount must be > 0'),
  paymentMethod: z.enum(['CARD', 'ACH', 'WIRE', 'CHECK']).default('CARD'),
  referenceNumber: z.string().min(1, 'Reference number is required'),
  notes: z.string().optional().default(''),
});
