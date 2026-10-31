import React, { useState } from 'react';
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
import { WorkspaceState } from './components/shared/WorkspaceState';
import { resolveNavigationTab } from './components/layout/navigation';
import { CustomerPortalPage } from './pages/customer/CustomerPortalPage';

const AppContent: React.FC = () => {
  // TODO: [BACKEND_HOOK] - Current session and workspace loading - Expected authenticated role and scoped collections; demo context only today.
  const { currentRole, isLoading, error, refreshAll } = useAppState();
  const [selectedTab, setActiveTab] = useState<NavigationTab>('dashboard');
  const activeTab = resolveNavigationTab(currentRole, selectedTab);

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      <a href="#workspace-content" className="skip-link">Skip to workspace content</a>
      <Navbar />

      <div className="flex flex-col md:flex-row flex-1 min-w-0">
        <Sidebar activeTab={activeTab} onSelectTab={setActiveTab} />

        <main id="workspace-content" tabIndex={-1} aria-label={`${currentRole} workspace`} aria-busy={isLoading} className="flex-1 min-w-0 overflow-x-auto p-4 sm:p-6 lg:p-8 bg-[#09090b]">
          <p className="text-xs text-zinc-400 mb-4">{currentRole === 'Admin' ? 'Admin Desk' : currentRole === 'Staff' ? 'Staff Workspace' : 'Customer Portal'} / {activeTab.replace(/-/g, ' ')}</p>
          {isLoading ? (
            <WorkspaceState title="Loading workspace" description="Loading local demo records…" />
          ) : error ? (
            <WorkspaceState error title="Workspace unavailable" description={error} onRetry={() => void refreshAll()} />
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
