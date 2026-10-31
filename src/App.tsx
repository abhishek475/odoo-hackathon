import React, { useState, useEffect } from 'react';
import { AppStateProvider, useAppState } from './context/AppStateContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar, NavigationTab } from './components/layout/Sidebar';
import { ProtectedRouteGuard } from './components/layout/ProtectedRouteGuard';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { CatalogPage } from './pages/catalog/CatalogPage';
import { SubscriptionsPage } from './pages/subscriptions/SubscriptionsPage';
import { QuotationBuilderPage } from './pages/subscriptions/QuotationBuilderPage';
import { BillingPage } from './pages/billing/BillingPage';
import { DiscountsPage } from './pages/discounts/DiscountsPage';
import { PaymentsPage } from './pages/payments/PaymentsPage';
import { AuthStaffPage } from './pages/auth/AuthStaffPage';
import { CustomerPortalPage } from './pages/customer/CustomerPortalPage';

const AppContent: React.FC = () => {
  const { currentRole, isLoading } = useAppState();
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');

  // Sync tab with role selection
  useEffect(() => {
    if (currentRole === 'Customer') {
      setActiveTab('customer-portal');
    } else if (currentRole === 'Staff' && activeTab === 'dashboard') {
      setActiveTab('subscriptions');
    } else if (currentRole === 'Admin' && activeTab === 'customer-portal') {
      setActiveTab('dashboard');
    }
  }, [currentRole]);

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeTab={activeTab} onSelectTab={setActiveTab} />

        <main className="flex-1 overflow-y-auto p-6 lg:p-8 bg-[#09090b]">
          {isLoading ? (
            <div className="h-64 flex flex-col items-center justify-center space-y-3 font-mono text-xs text-zinc-500">
              <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              <span>Hydrating Brightloop Ledger &amp; Mock Engine...</span>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <ProtectedRouteGuard allowedRoles={['Admin']} fallbackMessage="Finance analytics is restricted to executive administrators.">
                  <DashboardPage />
                </ProtectedRouteGuard>
              )}
              {activeTab === 'catalog' && (
                <ProtectedRouteGuard allowedRoles={['Admin']} fallbackMessage="Catalog pricing and variant configuration is restricted to administrators.">
                  <CatalogPage />
                </ProtectedRouteGuard>
              )}
              {activeTab === 'subscriptions' && (
                <ProtectedRouteGuard allowedRoles={['Admin', 'Staff']} fallbackMessage="Subscription management is reserved for internal staff and administrators.">
                  <SubscriptionsPage />
                </ProtectedRouteGuard>
              )}
              {activeTab === 'quotations' && (
                <ProtectedRouteGuard allowedRoles={['Admin', 'Staff']} fallbackMessage="Commercial quote building is reserved for internal staff and administrators.">
                  <QuotationBuilderPage />
                </ProtectedRouteGuard>
              )}
              {activeTab === 'billing' && (
                <ProtectedRouteGuard allowedRoles={['Admin', 'Staff']} fallbackMessage="Batch billing execution is reserved for internal staff and administrators.">
                  <BillingPage />
                </ProtectedRouteGuard>
              )}
              {activeTab === 'discounts' && (
                <ProtectedRouteGuard allowedRoles={['Admin']} fallbackMessage="Promotional coupon rule creation is restricted to administrators.">
                  <DiscountsPage />
                </ProtectedRouteGuard>
              )}
              {activeTab === 'payments' && (
                <ProtectedRouteGuard allowedRoles={['Admin', 'Staff']} fallbackMessage="Cash settlement logging is reserved for internal staff and administrators.">
                  <PaymentsPage />
                </ProtectedRouteGuard>
              )}
              {activeTab === 'auth-staff' && (
                <ProtectedRouteGuard allowedRoles={['Admin']} fallbackMessage="Staff directory and RBAC access control is restricted to administrators.">
                  <AuthStaffPage />
                </ProtectedRouteGuard>
              )}
              {activeTab === 'customer-portal' && (
                <ProtectedRouteGuard allowedRoles={['Customer', 'Admin']}>
                  <CustomerPortalPage />
                </ProtectedRouteGuard>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AppStateProvider>
      <AppContent />
    </AppStateProvider>
  );
};

export default App;
