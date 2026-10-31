import React from 'react';
import { useAppState } from '../../context/AppStateContext';
import {
  LayoutDashboard,
  Box,
  Repeat,
  FileSpreadsheet,
  Receipt,
  Tags,
  CreditCard,
  Users,
  Compass,
} from 'lucide-react';
import { cn } from '../../lib/utils';

export type NavigationTab =
  | 'dashboard'
  | 'catalog'
  | 'subscriptions'
  | 'quotations'
  | 'billing'
  | 'discounts'
  | 'payments'
  | 'auth-staff'
  | 'customer-portal';

interface SidebarProps {
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab }) => {
  const { currentRole, subscriptions, invoices, discounts } = useAppState();

  const overdueInvoicesCount = invoices.filter(
    i => i.status === 'Overdue' || (i.status === 'Confirmed' && new Date(i.dueDate) < new Date())
  ).length;

  const activeSubsCount = subscriptions.filter(s => s.status === 'Active').length;

  return (
    <aside className="w-64 border-r border-[#27272a] bg-[#09090b] flex flex-col justify-between py-4 select-none shrink-0">
      <div className="space-y-6">
        {/* Workspace Title & Current Role Context */}
        <div className="px-5">
          <p className="text-[10px] uppercase font-mono tracking-wider text-zinc-500">Workspace Context</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <h2 className="text-sm font-semibold text-zinc-100 font-mono">
              {currentRole === 'Admin' && 'ADMIN COMMAND DESK'}
              {currentRole === 'Staff' && 'STAFF WORKSPACE'}
              {currentRole === 'Customer' && 'CUSTOMER PORTAL'}
            </h2>
          </div>
        </div>

        {/* Navigation Sections */}
        <nav className="space-y-1 px-3">
          {/* Admin & Staff Sections */}
          {currentRole !== 'Customer' && (
            <>
              {currentRole === 'Admin' && (
                <button
                  onClick={() => onSelectTab('dashboard')}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium font-mono transition-colors',
                    activeTab === 'dashboard'
                      ? 'bg-[#18181b] text-cyan-300 border border-cyan-500/40'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#121215]'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <LayoutDashboard className="w-4 h-4 text-cyan-400" />
                    <span>Executive Analytics</span>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono">&lt;2s SLA</span>
                </button>
              )}

              <button
                onClick={() => onSelectTab('subscriptions')}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium font-mono transition-colors',
                  activeTab === 'subscriptions'
                    ? 'bg-[#18181b] text-cyan-300 border border-cyan-500/40'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#121215]'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Repeat className="w-4 h-4 text-zinc-400" />
                  <span>Subscriptions</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                  {activeSubsCount}
                </span>
              </button>

              <button
                onClick={() => onSelectTab('quotations')}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium font-mono transition-colors',
                  activeTab === 'quotations'
                    ? 'bg-[#18181b] text-cyan-300 border border-cyan-500/40'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#121215]'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <FileSpreadsheet className="w-4 h-4 text-zinc-400" />
                  <span>Quote Builder</span>
                </div>
              </button>

              <button
                onClick={() => onSelectTab('billing')}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium font-mono transition-colors',
                  activeTab === 'billing'
                    ? 'bg-[#18181b] text-cyan-300 border border-cyan-500/40'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#121215]'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Receipt className="w-4 h-4 text-zinc-400" />
                  <span>Billing Batch &amp; Invoices</span>
                </div>
                {overdueInvoicesCount > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                    {overdueInvoicesCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => onSelectTab('payments')}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium font-mono transition-colors',
                  activeTab === 'payments'
                    ? 'bg-[#18181b] text-cyan-300 border border-cyan-500/40'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#121215]'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <CreditCard className="w-4 h-4 text-zinc-400" />
                  <span>Payments &amp; Ledger</span>
                </div>
              </button>

              {currentRole === 'Admin' && (
                <>
                  <div className="pt-3 pb-1 px-3">
                    <p className="text-[10px] uppercase font-mono tracking-wider text-zinc-600">Admin Control</p>
                  </div>

                  <button
                    onClick={() => onSelectTab('catalog')}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium font-mono transition-colors',
                      activeTab === 'catalog'
                        ? 'bg-[#18181b] text-cyan-300 border border-cyan-500/40'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#121215]'
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <Box className="w-4 h-4 text-zinc-400" />
                      <span>Product &amp; Plan Catalog</span>
                    </div>
                  </button>

                  <button
                    onClick={() => onSelectTab('discounts')}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium font-mono transition-colors',
                      activeTab === 'discounts'
                        ? 'bg-[#18181b] text-cyan-300 border border-cyan-500/40'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#121215]'
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <Tags className="w-4 h-4 text-zinc-400" />
                      <span>Discount Rule Engine</span>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500">{discounts.length}</span>
                  </button>

                  <button
                    onClick={() => onSelectTab('auth-staff')}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium font-mono transition-colors',
                      activeTab === 'auth-staff'
                        ? 'bg-[#18181b] text-cyan-300 border border-cyan-500/40'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#121215]'
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <Users className="w-4 h-4 text-zinc-400" />
                      <span>Staff &amp; Access Controls</span>
                    </div>
                  </button>
                </>
              )}
            </>
          )}

          {/* Customer Portal Navigation */}
          {currentRole === 'Customer' && (
            <button
              onClick={() => onSelectTab('customer-portal')}
              className={cn(
                'w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium font-mono transition-colors',
                activeTab === 'customer-portal'
                  ? 'bg-[#18181b] text-cyan-300 border border-cyan-500/40'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#121215]'
              )}
            >
              <div className="flex items-center gap-2.5">
                <Compass className="w-4 h-4 text-cyan-400" />
                <span>Customer Self-Service</span>
              </div>
            </button>
          )}
        </nav>
      </div>

      {/* Footer System Info */}
      <div className="px-4 py-3 bg-[#121215] border-t border-[#27272a] rounded-xl mx-3">
        <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
          <span>Engine State:</span>
          <span className="text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Operational
          </span>
        </div>
        <p className="text-[10px] text-zinc-500 font-mono mt-1">Dual-Mode Mock Store Active</p>
      </div>
    </aside>
  );
};
