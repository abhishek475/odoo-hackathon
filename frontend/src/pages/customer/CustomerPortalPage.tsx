import React, { useState } from 'react';
import { useAppState } from '../../context/AppStateContext';
import { Invoice } from '../../types/billing';
import { CurrencyFormatter } from '../../components/shared/CurrencyFormatter';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { formatDate } from '../../lib/utils';
import {
  Compass,
  Repeat,
  Receipt,
  Download,
  CreditCard,
  CheckCircle2,
  Calendar,
  Layers,
  Printer,
  X,
} from 'lucide-react';

export const CustomerPortalPage: React.FC = () => {
  const { currentUser, subscriptions, invoices, logPayment } = useAppState();

  // Scope to customer account (or default to NovaCloud)
  const customerSubs = subscriptions.filter(
    s => s.customerId === currentUser.id || s.customerEmail === currentUser.email || s.customerName.includes('NovaCloud')
  );

  const customerInvoices = invoices.filter(
    i => i.customerId === currentUser.id || i.customerEmail === currentUser.email || i.customerName.includes('NovaCloud')
  );

  const activeSub = customerSubs.find(s => s.status === 'Active') || customerSubs[0];

  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paySuccessMsg, setPaySuccessMsg] = useState('');

  // TODO: [BACKEND_HOOK] - POST /api/v1/portal/invoices/:id/pay - Payload: { invoiceId, paymentMethod: 'CARD' } - Returns: Promise<PaymentRecord>
  const handlePayNow = async (inv: Invoice) => {
    await logPayment({
      invoiceId: inv.id,
      amount: inv.amountDue,
      paymentMethod: 'CARD',
      referenceNumber: `CARD_PAY_${Date.now().toString(36).toUpperCase()}`,
      notes: 'Paid online via Customer Self-Service Portal',
    });

    setPaySuccessMsg(`Invoice ${inv.invoiceNumber} paid in full!`);
    setTimeout(() => setPaySuccessMsg(''), 4000);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight font-mono">
              CUSTOMER SELF-SERVICE PORTAL
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
              Customer Isolated Scope
            </span>
          </div>
          <p className="text-xs text-zinc-400 font-mono mt-1">
            Account: <strong className="text-white">{currentUser.companyName || 'NovaCloud Technologies LLC'}</strong> ({currentUser.email})
          </p>
        </div>
      </div>

      {paySuccessMsg && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-500/50 rounded-xl flex items-center gap-2 text-xs font-mono text-emerald-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {paySuccessMsg}
        </div>
      )}

      {/* Active Subscription Summary Card */}
      {activeSub ? (
        <div className="bg-[#121215] border border-[#27272a] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Repeat className="w-4 h-4 text-cyan-400" />
              <h2 className="text-xs font-mono uppercase tracking-wider text-white font-semibold">
                Active Subscription Plan
              </h2>
            </div>
            <StatusBadge status={activeSub.status} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-[#18181b] p-4 rounded-xl border border-zinc-800 text-xs font-mono">
            <div>
              <span className="text-zinc-500">Plan Cadence</span>
              <p className="text-white font-semibold text-sm mt-1">{activeSub.planName}</p>
              <p className="text-[10px] text-zinc-400">{activeSub.cadence}</p>
            </div>
            <div>
              <span className="text-zinc-500">Next Renewal Date</span>
              <p className="text-white font-semibold text-sm mt-1">{formatDate(activeSub.nextBillingDate)}</p>
              <p className="text-[10px] text-zinc-400">Auto-renewal enabled</p>
            </div>
            <div>
              <span className="text-zinc-500">Recurring Price</span>
              <p className="text-cyan-300 font-bold text-sm mt-1">
                <CurrencyFormatter amount={activeSub.totalAmount} />
              </p>
              <p className="text-[10px] text-zinc-400">Per cycle interval</p>
            </div>
            <div>
              <span className="text-zinc-500">Contract Reference</span>
              <p className="text-zinc-300 font-semibold text-sm mt-1">{activeSub.subscriptionNumber}</p>
              <p className="text-[10px] text-zinc-400">Started: {formatDate(activeSub.startDate)}</p>
            </div>
          </div>

          {/* Configured Lines */}
          <div className="space-y-1.5 pt-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">
              Provisioned Cluster Resources:
            </span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {activeSub.lines.map((l, i) => (
                <div key={i} className="p-2.5 rounded bg-[#18181b] border border-zinc-800 text-xs font-mono">
                  <div className="font-semibold text-white">{l.productName}</div>
                  <div className="text-[10px] text-zinc-500 mt-0.5">{l.variantName || 'Standard'} (Qty: {l.quantity})</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center bg-[#121215] border border-[#27272a] rounded-xl text-xs font-mono text-zinc-500">
          No active subscriptions assigned to this customer profile.
        </div>
      )}

      {/* Invoices & Statements Table */}
      <div className="bg-[#121215] border border-[#27272a] rounded-xl overflow-hidden font-mono text-xs">
        <div className="p-4 border-b border-[#27272a] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-cyan-400" />
            <h2 className="text-xs uppercase tracking-wider text-white font-semibold">
              Billing Statements &amp; Invoices
            </h2>
          </div>
          <span className="text-zinc-500">{customerInvoices.length} Invoices</span>
        </div>

        <table className="w-full text-left">
          <thead className="bg-[#18181b] text-zinc-400 border-b border-[#27272a]">
            <tr>
              <th className="py-3 px-4">Invoice #</th>
              <th className="py-3 px-4">Issue Date</th>
              <th className="py-3 px-4">Due Date</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Total Amount</th>
              <th className="py-3 px-4 text-right">Balance Due</th>
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#27272a] text-zinc-300">
            {customerInvoices.map(inv => (
              <tr key={inv.id} className="hover:bg-[#18181b]/50">
                <td className="py-3 px-4 font-semibold text-zinc-200">{inv.invoiceNumber}</td>
                <td className="py-3 px-4 text-zinc-400">{formatDate(inv.issueDate)}</td>
                <td className="py-3 px-4 text-zinc-400">{formatDate(inv.dueDate)}</td>
                <td className="py-3 px-4">
                  <StatusBadge status={inv.status} />
                </td>
                <td className="py-3 px-4 text-right font-bold text-white">
                  <CurrencyFormatter amount={inv.totalAmount} />
                </td>
                <td className="py-3 px-4 text-right font-bold">
                  <span className={inv.amountDue > 0 ? 'text-rose-400' : 'text-emerald-400'}>
                    <CurrencyFormatter amount={inv.amountDue} />
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => setSelectedInvoice(inv)}
                      className="px-2 py-1 rounded bg-[#18181b] hover:bg-zinc-800 text-cyan-300 border border-zinc-700 text-xs flex items-center gap-1"
                      title="View & Download PDF"
                    >
                      <Download className="w-3 h-3" /> PDF
                    </button>
                    {inv.amountDue > 0 && (
                      <button
                        onClick={() => handlePayNow(inv)}
                        className="px-2.5 py-1 rounded bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-700 text-xs flex items-center gap-1 font-semibold"
                      >
                        <CreditCard className="w-3 h-3" /> Pay Online
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {customerInvoices.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-zinc-500">
                  No invoices available for this account.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Printable PDF Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121215] border border-[#27272a] rounded-xl max-w-2xl w-full p-6 space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-[#27272a] pb-3 no-print">
              <h3 className="text-sm font-bold text-white">Statement — {selectedInvoice.invoiceNumber}</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1 rounded bg-cyan-950 text-cyan-300 border border-cyan-700 flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" /> Print / Save PDF
                </button>
                <button onClick={() => setSelectedInvoice(null)} className="text-zinc-500 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div id="printable-invoice" className="bg-[#18181b] p-6 rounded-lg space-y-4">
              <div className="flex justify-between border-b border-zinc-800 pb-4">
                <div>
                  <h4 className="font-bold text-white text-base">BRIGHTLOOP SOFTWARE</h4>
                  <p className="text-zinc-400 text-[10px]">Tax Invoice / Statement</p>
                </div>
                <div className="text-right">
                  <span className="text-cyan-300 font-bold">{selectedInvoice.invoiceNumber}</span>
                  <p className="text-zinc-400 text-[10px]">{formatDate(selectedInvoice.issueDate)}</p>
                </div>
              </div>

              <div className="flex justify-between text-[11px] text-zinc-300">
                <div>
                  <span className="text-zinc-500">Customer:</span>
                  <p className="font-semibold text-white">{selectedInvoice.customerName}</p>
                  <p className="text-zinc-400">{selectedInvoice.customerEmail}</p>
                </div>
                <div className="text-right">
                  <span className="text-zinc-500">Payment Status:</span>
                  <div className="mt-1">
                    <StatusBadge status={selectedInvoice.status} />
                  </div>
                </div>
              </div>

              <table className="w-full text-left border border-zinc-800">
                <thead className="bg-[#121215] text-zinc-400">
                  <tr>
                    <th className="p-2">Item</th>
                    <th className="p-2 text-center">Qty</th>
                    <th className="p-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800 text-zinc-200">
                  {selectedInvoice.lines.map((l, i) => (
                    <tr key={i}>
                      <td className="p-2">{l.productName}</td>
                      <td className="p-2 text-center">{l.quantity}</td>
                      <td className="p-2 text-right">
                        <CurrencyFormatter amount={l.lineTotal} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="text-right pt-2 space-y-1">
                <div className="text-zinc-400">
                  Total: <strong className="text-white"><CurrencyFormatter amount={selectedInvoice.totalAmount} /></strong>
                </div>
                <div className="text-zinc-400">
                  Paid: <strong className="text-emerald-400"><CurrencyFormatter amount={selectedInvoice.amountPaid} /></strong>
                </div>
                <div className="text-sm font-bold pt-1 border-t border-zinc-800">
                  Due: <span className={selectedInvoice.amountDue > 0 ? 'text-rose-400' : 'text-emerald-400'}><CurrencyFormatter amount={selectedInvoice.amountDue} /></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
