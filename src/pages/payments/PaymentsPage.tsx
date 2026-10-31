import React, { useState } from 'react';
import { useAppState } from '../../context/AppStateContext';
import { CurrencyFormatter } from '../../components/shared/CurrencyFormatter';
import { formatDate } from '../../lib/utils';
import { CreditCard, Plus, CheckCircle2, AlertTriangle, ArrowDownRight, X } from 'lucide-react';

export const PaymentsPage: React.FC = () => {
  const { payments, invoices, logPayment } = useAppState();

  const [showModal, setShowModal] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(invoices[0]?.id || '');
  const [amount, setAmount] = useState(1500);
  const [method, setMethod] = useState<'CARD' | 'ACH' | 'WIRE' | 'CHECK'>('ACH');
  const [refNum, setRefNum] = useState(`REF-${Date.now().toString(36).toUpperCase()}`);
  const [notes, setNotes] = useState('Direct bank transfer settlement');

  // Overdue and unpaid invoices
  const unpaidInvoices = invoices.filter(i => i.amountDue > 0);

  // TODO: [BACKEND_HOOK] - POST /api/v1/payments - Payload: { invoiceId, amount, paymentMethod, referenceNumber } - Returns: Promise<PaymentRecord>
  const handleLogPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceId) return;

    await logPayment({
      invoiceId: selectedInvoiceId,
      amount: Number(amount),
      paymentMethod: method,
      referenceNumber: refNum,
      notes,
    });

    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight font-mono">
            PAYMENT SETTLEMENT &amp; RECEIVABLES
          </h1>
          <p className="text-xs text-zinc-400 font-mono mt-1">
            Cash collection audit trail, multi-channel payment reconciliation, and receivable tracking
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-3 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300 text-xs font-mono flex items-center gap-1.5 transition-colors"
        >
          <Plus className="w-3.5 h-3.5 text-cyan-400" />
          Log Customer Payment
        </button>
      </div>

      {/* Outstanding Receivables Banner */}
      {unpaidInvoices.length > 0 && (
        <div className="bg-[#121215] border border-rose-900/40 rounded-xl p-4 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-rose-950 text-rose-400 border border-rose-800">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <p className="text-white font-semibold">
                {unpaidInvoices.length} Invoices with Outstanding Balances
              </p>
              <p className="text-zinc-400 text-[11px]">
                Total Overdue / Uncollected: <strong className="text-rose-400"><CurrencyFormatter amount={unpaidInvoices.reduce((acc, i) => acc + i.amountDue, 0)} /></strong>
              </p>
            </div>
          </div>
          <span className="text-[11px] text-zinc-500">Requires finance reconciliation</span>
        </div>
      )}

      {/* Payments Ledger Table */}
      <div className="bg-[#121215] border border-[#27272a] rounded-xl overflow-hidden">
        <div className="p-4 border-b border-[#27272a] flex items-center justify-between">
          <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-300 font-semibold">
            Cash Collection History
          </h2>
          <span className="text-xs font-mono text-zinc-500">{payments.length} Transaction Records</span>
        </div>

        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-[#18181b] text-zinc-400 border-b border-[#27272a]">
            <tr>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Invoice #</th>
              <th className="py-3 px-4">Customer Account</th>
              <th className="py-3 px-4">Channel / Method</th>
              <th className="py-3 px-4">Reference #</th>
              <th className="py-3 px-4 text-right">Settled Amount</th>
              <th className="py-3 px-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#27272a] text-zinc-300">
            {payments.map(p => (
              <tr key={p.id} className="hover:bg-[#18181b]/50 transition-colors">
                <td className="py-3 px-4 text-zinc-400">{formatDate(p.paymentDate)}</td>
                <td className="py-3 px-4 font-semibold text-zinc-200">{p.invoiceNumber}</td>
                <td className="py-3 px-4 font-sans font-medium text-white">{p.customerName}</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 text-[10px]">
                    {p.paymentMethod}
                  </span>
                </td>
                <td className="py-3 px-4 text-zinc-400">{p.referenceNumber}</td>
                <td className="py-3 px-4 text-right font-bold text-emerald-400">
                  +<CurrencyFormatter amount={p.amount} />
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                    {p.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Log Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121215] border border-[#27272a] rounded-xl max-w-md w-full p-6 space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-cyan-400" />
                Record Cash Settlement
              </h3>
              <button onClick={() => setShowModal(false)} className="text-zinc-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleLogPayment} className="space-y-3">
              <div>
                <label className="text-zinc-400">Select Invoice</label>
                <select
                  value={selectedInvoiceId}
                  onChange={e => {
                    setSelectedInvoiceId(e.target.value);
                    const inv = invoices.find(i => i.id === e.target.value);
                    if (inv) setAmount(inv.amountDue > 0 ? inv.amountDue : inv.totalAmount);
                  }}
                  className="w-full mt-1 p-2 bg-[#18181b] border border-[#27272a] rounded text-white"
                >
                  {invoices.map(inv => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoiceNumber} — {inv.customerName} (Due: ${inv.amountDue})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-zinc-400">Collected Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={amount}
                  onChange={e => setAmount(Number(e.target.value))}
                  className="w-full mt-1 p-2 bg-[#18181b] border border-[#27272a] rounded text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400">Payment Channel</label>
                  <select
                    value={method}
                    onChange={e => setMethod(e.target.value as any)}
                    className="w-full mt-1 p-2 bg-[#18181b] border border-[#27272a] rounded text-zinc-200"
                  >
                    <option value="CARD">Credit Card</option>
                    <option value="ACH">ACH Transfer</option>
                    <option value="WIRE">Bank Wire</option>
                    <option value="CHECK">Check</option>
                  </select>
                </div>
                <div>
                  <label className="text-zinc-400">Reference / Trace #</label>
                  <input
                    type="text"
                    required
                    value={refNum}
                    onChange={e => setRefNum(e.target.value)}
                    className="w-full mt-1 p-2 bg-[#18181b] border border-[#27272a] rounded text-zinc-200"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-400">Internal Audit Memo</label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full mt-1 p-2 bg-[#18181b] border border-[#27272a] rounded text-zinc-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#27272a]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 rounded bg-zinc-800 text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500 hover:bg-emerald-900"
                >
                  Confirm &amp; Reconcile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
