import React, { useState, useMemo } from 'react';
import { useAppState } from '../../context/AppStateContext';
import { Subscription, SubscriptionStatus } from '../../types/billing';
import { CurrencyFormatter } from '../../components/shared/CurrencyFormatter';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { StateMachineStepper } from '../../components/shared/StateMachineStepper';
import { formatDate } from '../../lib/utils';
import {
  Search,
  Filter,
  Eye,
  Calendar,
  Layers,
  FileText,
  User,
  History,
  X,
} from 'lucide-react';

export const SubscriptionsPage: React.FC = () => {
  const { subscriptions, transitionSubscription, currentRole } = useAppState();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null);

  const filtered = useMemo(() => {
    return subscriptions.filter(sub => {
      const matchSearch =
        sub.subscriptionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.planName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || sub.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [subscriptions, searchTerm, statusFilter]);

  // TODO: [BACKEND_HOOK] - PATCH /api/v1/subscriptions/:id/transition - Payload: { status: SubscriptionStatus, note?: string } - Returns: Promise<Subscription>
  const handleTransition = async (newStatus: SubscriptionStatus, note?: string) => {
    if (!selectedSub) return;
    await transitionSubscription(selectedSub.id, newStatus, note);
    // Refresh selected sub view
    const updated = subscriptions.find(s => s.id === selectedSub.id);
    if (updated) {
      setSelectedSub({ ...updated, status: newStatus });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight font-mono">
            SUBSCRIPTION LIFECYCLE OPS
          </h1>
          <p className="text-xs text-zinc-400 font-mono mt-1">
            Active recurring contracts, lifecycle transitions, and billing intervals
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-3 py-1.5 rounded-lg bg-[#18181b] border border-[#27272a] text-zinc-400">
            Total Ledger: <strong className="text-cyan-300">{subscriptions.length.toLocaleString()}</strong>
          </span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-[#121215] border border-[#27272a] rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search by customer, plan, or SUB#..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#18181b] border border-[#27272a] text-xs font-mono text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto p-1 bg-[#18181b] border border-[#27272a] rounded-lg text-xs font-mono">
          <Filter className="w-3.5 h-3.5 text-zinc-500 ml-1.5 mr-0.5" />
          {['ALL', 'Draft', 'Quotation', 'Confirmed', 'Active', 'Paused', 'Closed'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2 py-0.5 rounded text-[11px] whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-[#121215] border border-[#27272a] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#18181b] text-zinc-400 border-b border-[#27272a]">
              <tr>
                <th className="py-3 px-4">Identifier</th>
                <th className="py-3 px-4">Customer Account</th>
                <th className="py-3 px-4">Cadence &amp; Plan</th>
                <th className="py-3 px-4">State</th>
                <th className="py-3 px-4">Next Billing Date</th>
                <th className="py-3 px-4 text-right">Cycle Total</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272a] text-zinc-300">
              {filtered.slice(0, 50).map(sub => (
                <tr key={sub.id} className="hover:bg-[#18181b]/50 transition-colors">
                  <td className="py-3 px-4 font-semibold text-zinc-200 flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-zinc-500" />
                    {sub.subscriptionNumber}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-sans font-medium text-white">{sub.customerName}</div>
                    <div className="text-[10px] text-zinc-500">{sub.customerEmail}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div>{sub.planName}</div>
                    <span className="text-[10px] text-zinc-500">{sub.cadence}</span>
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={sub.status} />
                  </td>
                  <td className="py-3 px-4 text-zinc-400">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 text-zinc-500" />
                      {formatDate(sub.nextBillingDate)}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right text-zinc-100 font-bold">
                    <CurrencyFormatter amount={sub.totalAmount} />
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => setSelectedSub(sub)}
                      className="px-2.5 py-1 rounded bg-[#18181b] hover:bg-zinc-800 text-cyan-300 border border-zinc-700 text-xs flex items-center gap-1 mx-auto transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" /> Inspect
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-500">
                    No subscriptions matching the selected criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Subscription Detail Drawer / Modal */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121215] border border-[#27272a] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5">
            {/* Drawer Header */}
            <div className="flex items-start justify-between border-b border-[#27272a] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white font-mono">{selectedSub.subscriptionNumber}</h2>
                  <StatusBadge status={selectedSub.status} />
                </div>
                <p className="text-xs text-zinc-400 font-mono mt-0.5">
                  Plan: {selectedSub.planName} ({selectedSub.cadence})
                </p>
              </div>

              <button
                onClick={() => setSelectedSub(null)}
                className="text-zinc-500 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* State Machine Stepper Component */}
            <StateMachineStepper
              currentStatus={selectedSub.status}
              onTransition={handleTransition}
              allowMutations={currentRole !== 'Customer'}
            />

            {/* Customer & Parameters Grid */}
            <div className="grid grid-cols-2 gap-4 bg-[#18181b] p-4 rounded-xl border border-zinc-800 text-xs font-mono">
              <div>
                <span className="text-zinc-500 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-cyan-400" /> Customer Account
                </span>
                <p className="text-zinc-200 font-semibold font-sans mt-1">{selectedSub.customerName}</p>
                <p className="text-[11px] text-zinc-400">{selectedSub.customerEmail}</p>
              </div>
              <div>
                <span className="text-zinc-500 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-cyan-400" /> Next Billing Date
                </span>
                <p className="text-zinc-200 font-semibold mt-1">{formatDate(selectedSub.nextBillingDate)}</p>
                <p className="text-[10px] text-zinc-500">Started: {formatDate(selectedSub.startDate)}</p>
              </div>
            </div>

            {/* Configured Product Order Lines */}
            <div>
              <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" /> Subscription Order Lines
              </h3>
              <div className="border border-[#27272a] rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[#18181b] text-zinc-400 border-b border-[#27272a]">
                    <tr>
                      <th className="py-2 px-3">Product Item</th>
                      <th className="py-2 px-3 text-center">Qty</th>
                      <th className="py-2 px-3 text-right">Unit Price</th>
                      <th className="py-2 px-3 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#27272a] text-zinc-300">
                    {selectedSub.lines.map((line, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-3">
                          <div className="text-white font-medium">{line.productName}</div>
                          {line.variantName && <div className="text-[10px] text-zinc-500">{line.variantName}</div>}
                        </td>
                        <td className="py-2 px-3 text-center">{line.quantity}</td>
                        <td className="py-2 px-3 text-right">
                          <CurrencyFormatter amount={line.unitPrice} />
                        </td>
                        <td className="py-2 px-3 text-right text-cyan-300 font-bold">
                          <CurrencyFormatter amount={line.lineTotal} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-[#18181b] border-t border-[#27272a] text-zinc-200">
                    <tr>
                      <td colSpan={3} className="py-2.5 px-3 font-semibold text-right">
                        Recurring Cycle Total:
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-white text-sm">
                        <CurrencyFormatter amount={selectedSub.totalAmount} />
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Audit History Log */}
            <div>
              <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-zinc-500" /> State Transition Audit Trail
              </h3>
              <div className="space-y-2 max-h-36 overflow-y-auto">
                {selectedSub.history.map((ev, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded bg-[#18181b] border border-zinc-800 text-xs font-mono flex items-start justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-zinc-200">{ev.action}</span>
                        <span className="text-[10px] text-zinc-500">by {ev.performedBy}</span>
                      </div>
                      {ev.note && <p className="text-[11px] text-zinc-400 mt-0.5">{ev.note}</p>}
                    </div>
                    <span className="text-[10px] text-zinc-500 whitespace-nowrap ml-3">{ev.date}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Close Modal Button */}
            <div className="flex justify-end pt-3 border-t border-[#27272a]">
              <button
                onClick={() => setSelectedSub(null)}
                className="px-4 py-1.5 rounded bg-zinc-800 text-zinc-300 text-xs font-mono hover:bg-zinc-700"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
