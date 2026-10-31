import React, { useState } from 'react';
import { useAppState } from '../../context/AppStateContext';
import { Invoice, InvoiceStatus } from '../../types/billing';
import { CurrencyFormatter } from '../../components/shared/CurrencyFormatter';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { formatDate } from '../../lib/utils';
import {
  Receipt,
  Play,
  Printer,
  Calendar,
  CheckCircle2,
  DollarSign,
  Search,
  Eye,
  X,
  CreditCard,
  FileCheck,
} from 'lucide-react';

export const BillingPage: React.FC = () => {
  const { invoices, subscriptions, runBillingBatch, updateInvoiceStatus, logPayment } = useAppState();

  const [targetBillingDate, setTargetBillingDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [batchResult, setBatchResult] = useState<{ generatedCount: number } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<'CARD' | 'ACH' | 'WIRE' | 'CHECK'>('CARD');
  const [payRef, setPayRef] = useState(`REF-${Date.now().toString(36).toUpperCase()}`);
  const [payNotes, setPayNotes] = useState('Payment collected via billing terminal');

  // Active subscriptions ready for billing
  const readyForBillingCount = subscriptions.filter(
    s => s.status === 'Active' && new Date(s.nextBillingDate) <= new Date(targetBillingDate)
  ).length;

  // Filter invoices
  const filteredInvoices = invoices.filter(inv => {
    const matchSearch =
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || inv.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // TODO: [BACKEND_HOOK] - POST /api/v1/billing/batch-run - Payload: { billingDate: string } - Returns: Promise<{ generatedCount: number, invoices: Invoice[] }>
  const handleExecuteBatch = async () => {
    const res = await runBillingBatch(targetBillingDate);
    setBatchResult({ generatedCount: res.generatedCount });
  };

  const handleOpenPaymentModal = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setPayAmount(inv.amountDue > 0 ? inv.amountDue : inv.totalAmount);
    setPayRef(`REF-${Date.now().toString(36).toUpperCase()}`);
    setShowPaymentModal(true);
  };

  // TODO: [BACKEND_HOOK] - POST /api/v1/payments - Payload: { invoiceId, amount, paymentMethod, referenceNumber } - Returns: Promise<PaymentRecord>
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    await logPayment({
      invoiceId: selectedInvoice.id,
      amount: Number(payAmount),
      paymentMethod: payMethod,
      referenceNumber: payRef,
      notes: payNotes,
    });

    setShowPaymentModal(false);
    // update current selected view
    const updated = invoices.find(i => i.id === selectedInvoice.id);
    if (updated) setSelectedInvoice(updated);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight font-mono">
            BILLING ENGINE &amp; INVOICES
          </h1>
          <p className="text-xs text-zinc-400 font-mono mt-1">
            Automated batch invoice generation, printable PDF statements, and payment reconciliation
          </p>
        </div>
      </div>

      {/* Batch Runner Card */}
      <div className="bg-[#121215] border border-[#27272a] rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-cyan-400" />
            <h2 className="text-xs font-mono uppercase tracking-wider text-white font-semibold">
              Recurring Billing Day Batch Execution
            </h2>
          </div>
          <span className="text-xs font-mono text-zinc-400">
            Eligible Subscriptions: <strong className="text-cyan-300">{readyForBillingCount}</strong>
          </span>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-4 bg-[#18181b] p-4 rounded-xl border border-zinc-800 text-xs font-mono">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <span className="text-zinc-400 whitespace-nowrap">Cut-off Target Date:</span>
            <input
              type="date"
              value={targetBillingDate}
              onChange={e => setTargetBillingDate(e.target.value)}
              className="p-1.5 bg-[#121215] border border-zinc-700 rounded text-zinc-200"
            />
          </div>

          <p className="text-[11px] text-zinc-500 flex-1">
            Generates confirmed invoices for all active subscriptions with due dates up to the selected target date, and advances subscription billing dates.
          </p>

          <button
            onClick={handleExecuteBatch}
            className="w-full md:w-auto px-4 py-2 bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/60 text-cyan-300 rounded-lg flex items-center justify-center gap-2 transition-colors font-semibold"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Execute Billing Day Batch Run
          </button>
        </div>

        {batchResult && (
          <div className="p-3 bg-emerald-950/40 border border-emerald-500/50 rounded-lg text-xs font-mono text-emerald-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>
                Batch run complete! Generated <strong>{batchResult.generatedCount}</strong> invoices.
              </span>
            </div>
            <button onClick={() => setBatchResult(null)} className="text-emerald-400 underline">
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* Invoices List Header & Filters */}
      <div className="bg-[#121215] border border-[#27272a] rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search invoice # or customer..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#18181b] border border-[#27272a] text-xs font-mono text-zinc-200 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto p-1 bg-[#18181b] border border-[#27272a] rounded-lg text-xs font-mono">
          {['ALL', 'Draft', 'Confirmed', 'Paid', 'Overdue', 'Cancelled'].map(st => (
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

      {/* Invoices Table */}
      <div className="bg-[#121215] border border-[#27272a] rounded-xl overflow-hidden">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-[#18181b] text-zinc-400 border-b border-[#27272a]">
            <tr>
              <th className="py-3 px-4">Invoice #</th>
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">Issue Date</th>
              <th className="py-3 px-4">Due Date</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Total</th>
              <th className="py-3 px-4 text-right">Balance Due</th>
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#27272a] text-zinc-300">
            {filteredInvoices.map(inv => (
              <tr key={inv.id} className="hover:bg-[#18181b]/50 transition-colors">
                <td className="py-3 px-4 font-semibold text-zinc-200 flex items-center gap-2">
                  <Receipt className="w-3.5 h-3.5 text-zinc-500" />
                  {inv.invoiceNumber}
                </td>
                <td className="py-3 px-4">
                  <div className="font-sans font-medium text-white">{inv.customerName}</div>
                  <div className="text-[10px] text-zinc-500">{inv.customerEmail}</div>
                </td>
                <td className="py-3 px-4 text-zinc-400">{formatDate(inv.issueDate)}</td>
                <td className="py-3 px-4 text-zinc-400">{formatDate(inv.dueDate)}</td>
                <td className="py-3 px-4">
                  <StatusBadge status={inv.status} />
                </td>
                <td className="py-3 px-4 text-right font-bold text-white">
                  <CurrencyFormatter amount={inv.totalAmount} />
                </td>
                <td className="py-3 px-4 text-right">
                  <span className={inv.amountDue > 0 ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                    <CurrencyFormatter amount={inv.amountDue} />
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      onClick={() => setSelectedInvoice(inv)}
                      className="px-2 py-1 rounded bg-[#18181b] hover:bg-zinc-800 text-cyan-300 border border-zinc-700 text-xs flex items-center gap-1 transition-colors"
                      title="Inspect and Print PDF"
                    >
                      <Eye className="w-3 h-3" /> View
                    </button>
                    {inv.status !== 'Paid' && inv.status !== 'Cancelled' && (
                      <button
                        onClick={() => handleOpenPaymentModal(inv)}
                        className="px-2 py-1 rounded bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800 text-xs flex items-center gap-1 transition-colors"
                        title="Log Payment for Invoice"
                      >
                        <DollarSign className="w-3 h-3" /> Pay
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Invoice Detail & Printable PDF View Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121215] border border-[#27272a] rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6">
            {/* Top Toolbar (No-print) */}
            <div className="flex items-center justify-between border-b border-[#27272a] pb-4 no-print">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-cyan-400" />
                <span className="font-mono text-sm text-zinc-300">Invoice Document &amp; PDF View</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="px-3 py-1.5 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-600 hover:bg-cyan-900 text-xs font-mono flex items-center gap-1.5 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print / Save as PDF
                </button>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="text-zinc-500 hover:text-white p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Invoice Container */}
            <div id="printable-invoice" className="bg-[#18181b] border border-zinc-800 rounded-xl p-8 space-y-6 font-mono text-xs">
              {/* Invoice Header */}
              <div className="flex items-start justify-between border-b border-zinc-800 pb-6">
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">BRIGHTLOOP SOFTWARE</h2>
                  <p className="text-[11px] text-zinc-400 mt-1">Subscription &amp; Recurring Billing Engine</p>
                  <p className="text-[10px] text-zinc-500">100 Pine Street, 18th Floor, San Francisco, CA 94111</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-cyan-300">{selectedInvoice.invoiceNumber}</div>
                  <div className="mt-1">
                    <StatusBadge status={selectedInvoice.status} />
                  </div>
                </div>
              </div>

              {/* Billed To & Dates */}
              <div className="grid grid-cols-2 gap-6 text-zinc-300">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-zinc-500">Billed To:</span>
                  <p className="text-sm font-bold text-white mt-1">{selectedInvoice.customerName}</p>
                  <p className="text-xs text-zinc-400">{selectedInvoice.customerEmail}</p>
                  <p className="text-[11px] text-zinc-500 mt-1">{selectedInvoice.customerAddress || 'Direct Account'}</p>
                </div>

                <div className="text-right space-y-1">
                  <div>
                    <span className="text-zinc-500 mr-2">Issue Date:</span>
                    <strong className="text-zinc-200">{formatDate(selectedInvoice.issueDate)}</strong>
                  </div>
                  <div>
                    <span className="text-zinc-500 mr-2">Due Date:</span>
                    <strong className="text-zinc-200">{formatDate(selectedInvoice.dueDate)}</strong>
                  </div>
                  {selectedInvoice.subscriptionId && (
                    <div>
                      <span className="text-zinc-500 mr-2">Subscription ID:</span>
                      <strong className="text-cyan-300">{selectedInvoice.subscriptionId}</strong>
                    </div>
                  )}
                </div>
              </div>

              {/* Line Items Table */}
              <table className="w-full text-left border-collapse border border-zinc-800">
                <thead className="bg-[#121215] text-zinc-400 border-b border-zinc-800">
                  <tr>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                    <th className="py-2.5 px-3 text-right">Unit Price</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800 text-zinc-200">
                  {selectedInvoice.lines.map((l, i) => (
                    <tr key={i}>
                      <td className="py-2.5 px-3">
                        <div className="font-medium text-white">{l.productName}</div>
                        {l.variantName && <div className="text-[10px] text-zinc-500">{l.variantName}</div>}
                      </td>
                      <td className="py-2.5 px-3 text-center">{l.quantity}</td>
                      <td className="py-2.5 px-3 text-right">
                        <CurrencyFormatter amount={l.unitPrice} />
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold">
                        <CurrencyFormatter amount={l.lineTotal} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals Breakdown */}
              <div className="flex justify-end">
                <div className="w-64 space-y-1.5 text-right">
                  <div className="flex justify-between text-zinc-400">
                    <span>Subtotal:</span>
                    <CurrencyFormatter amount={selectedInvoice.subtotal} />
                  </div>
                  {selectedInvoice.discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Discount:</span>
                      <span>-<CurrencyFormatter amount={selectedInvoice.discountAmount} /></span>
                    </div>
                  )}
                  <div className="flex justify-between text-zinc-400">
                    <span>Tax (10%):</span>
                    <CurrencyFormatter amount={selectedInvoice.taxAmount} />
                  </div>
                  <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-zinc-700">
                    <span>Total Amount:</span>
                    <span className="text-cyan-300">
                      <CurrencyFormatter amount={selectedInvoice.totalAmount} />
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-zinc-300">
                    <span>Amount Paid:</span>
                    <CurrencyFormatter amount={selectedInvoice.amountPaid} />
                  </div>
                  <div className="flex justify-between text-xs font-bold pt-1 border-t border-zinc-800">
                    <span>Balance Due:</span>
                    <span className={selectedInvoice.amountDue > 0 ? 'text-rose-400' : 'text-emerald-400'}>
                      <CurrencyFormatter amount={selectedInvoice.amountDue} />
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Receipt Trail */}
              {selectedInvoice.paymentHistory.length > 0 && (
                <div className="pt-4 border-t border-zinc-800">
                  <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">Settlement Records</p>
                  <div className="space-y-1">
                    {selectedInvoice.paymentHistory.map(p => (
                      <div key={p.id} className="flex justify-between text-[11px] text-zinc-400 bg-[#121215] p-2 rounded">
                        <span>{formatDate(p.paymentDate)} via {p.paymentMethod} ({p.referenceNumber})</span>
                        <strong className="text-emerald-400">+<CurrencyFormatter amount={p.amount} /></strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payment Entry Modal */}
      {showPaymentModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121215] border border-[#27272a] rounded-xl max-w-md w-full p-6 space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-cyan-400" />
                Record Payment — {selectedInvoice.invoiceNumber}
              </h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-zinc-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-3">
              <div>
                <label className="text-zinc-400">Customer</label>
                <p className="text-white font-sans font-semibold mt-1">{selectedInvoice.customerName}</p>
                <p className="text-zinc-500 text-[10px]">Outstanding Balance: <CurrencyFormatter amount={selectedInvoice.amountDue} /></p>
              </div>

              <div>
                <label className="text-zinc-400">Payment Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={payAmount}
                  onChange={e => setPayAmount(Number(e.target.value))}
                  className="w-full mt-1 p-2 bg-[#18181b] border border-[#27272a] rounded text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400">Method</label>
                  <select
                    value={payMethod}
                    onChange={e => setPayMethod(e.target.value as any)}
                    className="w-full mt-1 p-2 bg-[#18181b] border border-[#27272a] rounded text-zinc-200"
                  >
                    <option value="CARD">Credit Card</option>
                    <option value="ACH">ACH Transfer</option>
                    <option value="WIRE">Bank Wire</option>
                    <option value="CHECK">Check</option>
                  </select>
                </div>
                <div>
                  <label className="text-zinc-400">Reference #</label>
                  <input
                    type="text"
                    required
                    value={payRef}
                    onChange={e => setPayRef(e.target.value)}
                    className="w-full mt-1 p-2 bg-[#18181b] border border-[#27272a] rounded text-zinc-200"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-400">Reconciliation Notes</label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={e => setPayNotes(e.target.value)}
                  className="w-full mt-1 p-2 bg-[#18181b] border border-[#27272a] rounded text-zinc-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#27272a]">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-3 py-1.5 rounded bg-zinc-800 text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500 hover:bg-emerald-900"
                >
                  Confirm &amp; Log Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
