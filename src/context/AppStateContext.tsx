import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  User,
  UserRole,
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
import { apiAdapter } from '../services/apiAdapter';
import { SEED_USERS } from '../mocks/seedData';

interface AppStateContextType {
  currentUser: User;
  currentRole: UserRole;
  switchRole: (role: UserRole) => void;
  products: Product[];
  plans: BillingPlan[];
  templates: QuotationTemplate[];
  subscriptions: Subscription[];
  invoices: Invoice[];
  discounts: DiscountRule[];
  payments: PaymentRecord[];
  metrics: FinanceMetrics | null;
  isLoading: boolean;
  benchmarkStats: { count: number; durationMs: number } | null;
  error: string | null;

  // Actions
  refreshAll: () => Promise<void>;
  createProduct: (data: Omit<Product, 'id' | 'createdAt'>) => Promise<Product>;
  createPlan: (data: Omit<BillingPlan, 'id'>) => Promise<BillingPlan>;
  createTemplate: (data: Omit<QuotationTemplate, 'id'>) => Promise<QuotationTemplate>;
  createSubscription: (data: Partial<Subscription>) => Promise<Subscription>;
  transitionSubscription: (id: string, status: SubscriptionStatus, note?: string) => Promise<void>;
  runBillingBatch: (billingDate: string) => Promise<{ generatedCount: number; invoices: Invoice[] }>;
  updateInvoiceStatus: (id: string, status: InvoiceStatus) => Promise<void>;
  logPayment: (data: {
    invoiceId: string;
    amount: number;
    paymentMethod: 'CARD' | 'ACH' | 'WIRE' | 'CHECK';
    referenceNumber: string;
    notes?: string;
  }) => Promise<PaymentRecord>;
  createDiscount: (data: Omit<DiscountRule, 'id' | 'usageCount'>) => Promise<DiscountRule>;
  toggleDiscount: (id: string) => Promise<void>;
  runStressTest: (count?: number) => Promise<void>;
  resetDefaults: () => Promise<void>;
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

export const AppStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentRole, setCurrentRole] = useState<UserRole>('Admin');
  const [currentUser, setCurrentUser] = useState<User>(SEED_USERS[0]);

  const [products, setProducts] = useState<Product[]>([]);
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [templates, setTemplates] = useState<QuotationTemplate[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [discounts, setDiscounts] = useState<DiscountRule[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [metrics, setMetrics] = useState<FinanceMetrics | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [benchmarkStats, setBenchmarkStats] = useState<{ count: number; durationMs: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const switchRole = useCallback((role: UserRole) => {
    setCurrentRole(role);
    const matched = SEED_USERS.find(u => u.role === role) || SEED_USERS[0];
    setCurrentUser(matched);
  }, []);

  const refreshAll = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [prods, plns, tmpls, subs, invs, discs, pays, mets] = await Promise.all([
        apiAdapter.getProducts(),
        apiAdapter.getPlans(),
        apiAdapter.getTemplates(),
        apiAdapter.getSubscriptions(),
        apiAdapter.getInvoices(),
        apiAdapter.getDiscounts(),
        apiAdapter.getPayments(),
        apiAdapter.getFinanceMetrics(),
      ]);

      setProducts(prods);
      setPlans(plns);
      setTemplates(tmpls);
      setSubscriptions(subs);
      setInvoices(invs);
      setDiscounts(discs);
      setPayments(pays);
      setMetrics(mets);
    } catch (err: any) {
      console.error('[AppStateProvider] refresh error', err);
      setError(err?.message || 'Failed to load system data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // TODO: [BACKEND_HOOK] - Confirm product creation contract - Expected product input and returned Product; local demo only
  const createProduct = async (data: Omit<Product, 'id' | 'createdAt'>) => {
    const p = await apiAdapter.createProduct(data);
    setProducts(existing => [p, ...existing]);
    return p;
  };

  const createPlan = async (data: Omit<BillingPlan, 'id'>) => {
    const pl = await apiAdapter.createPlan(data);
    await refreshAll();
    return pl;
  };

  const createTemplate = async (data: Omit<QuotationTemplate, 'id'>) => {
    const t = await apiAdapter.createTemplate(data);
    await refreshAll();
    return t;
  };

  const createSubscription = async (data: Partial<Subscription>) => {
    const sub = await apiAdapter.createSubscription(data);
    await refreshAll();
    return sub;
  };

  const transitionSubscription = async (id: string, status: SubscriptionStatus, note?: string) => {
    await apiAdapter.updateSubscriptionStatus(id, status, currentUser.name, note);
    await refreshAll();
  };

  const runBillingBatch = async (billingDate: string) => {
    const res = await apiAdapter.runBatchBillingDay(billingDate);
    await refreshAll();
    return res;
  };

  const updateInvoiceStatus = async (id: string, status: InvoiceStatus) => {
    await apiAdapter.updateInvoiceStatus(id, status);
    await refreshAll();
  };

  const logPayment = async (data: {
    invoiceId: string;
    amount: number;
    paymentMethod: 'CARD' | 'ACH' | 'WIRE' | 'CHECK';
    referenceNumber: string;
    notes?: string;
  }) => {
    const pay = await apiAdapter.logPayment(data);
    await refreshAll();
    return pay;
  };

  const createDiscount = async (data: Omit<DiscountRule, 'id' | 'usageCount'>) => {
    const disc = await apiAdapter.createDiscount(data);
    await refreshAll();
    return disc;
  };

  const toggleDiscount = async (id: string) => {
    await apiAdapter.toggleDiscount(id);
    await refreshAll();
  };

  const runStressTest = async (count = 2500) => {
    setIsLoading(true);
    const stats = await apiAdapter.seedStressData(count);
    setBenchmarkStats(stats);
    await refreshAll();
  };

  const resetDefaults = async () => {
    apiAdapter.resetToDefaults();
    setBenchmarkStats(null);
    await refreshAll();
  };

  return (
    <AppStateContext.Provider
      value={{
        currentUser,
        currentRole,
        switchRole,
        products,
        plans,
        templates,
        subscriptions,
        invoices,
        discounts,
        payments,
        metrics,
        isLoading,
        benchmarkStats,
        error,
        refreshAll,
        createProduct,
        createPlan,
        createTemplate,
        createSubscription,
        transitionSubscription,
        runBillingBatch,
        updateInvoiceStatus,
        logPayment,
        createDiscount,
        toggleDiscount,
        runStressTest,
        resetDefaults,
      }}
    >
      {children}
    </AppStateContext.Provider>
  );
};

export const useAppState = (): AppStateContextType => {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
};
