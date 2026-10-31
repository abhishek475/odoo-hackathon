import React, { useState } from 'react';
import { useAppState } from '../../context/AppStateContext';
import { OrderLineItem } from '../../types/billing';
import { CurrencyFormatter } from '../../components/shared/CurrencyFormatter';
import {
  FileSpreadsheet,
  Plus,
  Trash2,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Send,
} from 'lucide-react';

export const QuotationBuilderPage: React.FC = () => {
  const { products, plans, templates, createSubscription, createTemplate } = useAppState();

  const [customerName, setCustomerName] = useState('Apex Data Dynamics');
  const [customerEmail, setCustomerEmail] = useState('billing@apexdata.io');
  const [selectedPlanId, setSelectedPlanId] = useState(plans[0]?.id || '');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [validityDays, setValidityDays] = useState(30);
  const [notes, setNotes] = useState('Custom pricing agreement for enterprise cluster rollout.');

  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [templateSuccess, setTemplateSuccess] = useState('');

  const [lines, setLines] = useState<OrderLineItem[]>([
    {
      id: 'line-init-1',
      productId: products[0]?.id || '',
      productName: products[0]?.name || '',
      variantId: products[0]?.variants[0]?.id,
      variantName: products[0]?.variants[0]?.name,
      quantity: 1,
      unitPrice: products[0]?.salesPrice || 850,
      discountPercent: 0,
      lineTotal: products[0]?.salesPrice || 850,
    },
  ]);

  const [submittedSubNum, setSubmittedSubNum] = useState<string | null>(null);

  // Apply template
  const handleApplyTemplate = (tmplId: string) => {
    setSelectedTemplateId(tmplId);
    const tmpl = templates.find(t => t.id === tmplId);
    if (!tmpl) return;

    setSelectedPlanId(tmpl.planId);
    setValidityDays(tmpl.validityDays);
    setNotes(tmpl.notes);
    setLines([...tmpl.lines]);
  };

  // TODO: [BACKEND_HOOK] - POST /api/v1/templates - Payload: Omit<QuotationTemplate, 'id'> - Returns: Promise<QuotationTemplate>
  const handleSaveAsTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateName.trim()) return;

    const plan = plans.find(p => p.id === selectedPlanId) || plans[0];
    await createTemplate({
      name: newTemplateName.trim(),
      planId: plan.id,
      planName: plan.name,
      validityDays,
      notes,
      lines: [...lines],
    });

    setShowSaveTemplateModal(false);
    setNewTemplateName('');
    setTemplateSuccess(`Saved template "${newTemplateName}"!`);
    setTimeout(() => setTemplateSuccess(''), 4000);
  };

  const handleAddLine = () => {
    const prod = products[0];
    if (!prod) return;
    const newLine: OrderLineItem = {
      id: `line-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      productId: prod.id,
      productName: prod.name,
      variantId: prod.variants[0]?.id,
      variantName: prod.variants[0]?.name,
      quantity: 1,
      unitPrice: prod.salesPrice,
      discountPercent: 0,
      lineTotal: prod.salesPrice,
    };
    setLines([...lines, newLine]);
  };

  const handleProductSelect = (index: number, prodId: string) => {
    const prod = products.find(p => p.id === prodId);
    if (!prod) return;
    const updated = [...lines];
    updated[index].productId = prod.id;
    updated[index].productName = prod.name;
    updated[index].variantId = prod.variants[0]?.id;
    updated[index].variantName = prod.variants[0]?.name;
    const base = prod.salesPrice + (prod.variants[0]?.priceModifier || 0);
    updated[index].unitPrice = base;
    updated[index].lineTotal = Number((base * updated[index].quantity * (1 - updated[index].discountPercent / 100)).toFixed(2));
    setLines(updated);
  };

  const handleVariantSelect = (index: number, varId: string) => {
    const line = lines[index];
    const prod = products.find(p => p.id === line.productId);
    if (!prod) return;
    const variant = prod.variants.find(v => v.id === varId);
    const updated = [...lines];
    updated[index].variantId = varId;
    updated[index].variantName = variant?.name;
    const unitPrice = prod.salesPrice + (variant?.priceModifier || 0);
    updated[index].unitPrice = unitPrice;
    updated[index].lineTotal = Number((unitPrice * updated[index].quantity * (1 - updated[index].discountPercent / 100)).toFixed(2));
    setLines(updated);
  };

  const handleQuantityChange = (index: number, qty: number) => {
    const updated = [...lines];
    updated[index].quantity = Math.max(1, qty);
    updated[index].lineTotal = Number((updated[index].unitPrice * updated[index].quantity * (1 - updated[index].discountPercent / 100)).toFixed(2));
    setLines(updated);
  };

  const handleDiscountChange = (index: number, disc: number) => {
    const updated = [...lines];
    updated[index].discountPercent = Math.max(0, Math.min(100, disc));
    updated[index].lineTotal = Number((updated[index].unitPrice * updated[index].quantity * (1 - updated[index].discountPercent / 100)).toFixed(2));
    setLines(updated);
  };

  const handleRemoveLine = (index: number) => {
    if (lines.length <= 1) return;
    setLines(lines.filter((_, i) => i !== index));
  };

  // Calculations
  const subtotal = lines.reduce((acc, l) => acc + l.lineTotal, 0);
  const tax = Number((subtotal * 0.1).toFixed(2)); // 10% provisional VAT/Tax
  const grandTotal = Number((subtotal + tax).toFixed(2));

  // TODO: [BACKEND_HOOK] - POST /api/v1/quotations - Payload: { customerName, customerEmail, planId, lines, status: 'Draft' | 'Quotation' } - Returns: Promise<Subscription>
  const handleSubmit = async (targetStatus: 'Draft' | 'Quotation') => {
    const selectedPlan = plans.find(p => p.id === selectedPlanId) || plans[0];
    const created = await createSubscription({
      customerName,
      customerEmail,
      planId: selectedPlan.id,
      planName: selectedPlan.name,
      cadence: selectedPlan.cadence,
      status: targetStatus,
      lines: [...lines],
      totalAmount: grandTotal,
      notes,
    });

    setSubmittedSubNum(created.subscriptionNumber);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight font-mono">
            STAFF QUOTATION BUILDER
          </h1>
          <p className="text-xs text-zinc-400 font-mono mt-1">
            Build bespoke commercial quotes with dynamic product variants, discounts, and terms
          </p>
        </div>

        {/* Quick Template Picker & Save as Template */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-zinc-400 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Apply Template:
          </span>
          <select
            value={selectedTemplateId}
            onChange={e => handleApplyTemplate(e.target.value)}
            className="p-1.5 rounded-lg bg-[#18181b] border border-[#27272a] text-xs font-mono text-cyan-300 focus:outline-none"
          >
            <option value="">Custom Quotation (Blank)</option>
            {templates.map(t => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowSaveTemplateModal(true)}
            className="px-2.5 py-1.5 rounded-lg bg-[#18181b] hover:bg-zinc-800 text-zinc-300 border border-zinc-700 text-xs font-mono transition-colors"
            title="Save current line configuration as a reusable template"
          >
            + Save as Template
          </button>
        </div>
      </div>

      {templateSuccess && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-500/50 rounded-xl flex items-center gap-2 text-xs font-mono text-emerald-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {templateSuccess}
        </div>
      )}

      {submittedSubNum && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-500/50 rounded-xl flex items-center justify-between text-xs font-mono text-emerald-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>
              Successfully created and logged <strong>{submittedSubNum}</strong> in the subscription ledger!
            </span>
          </div>
          <button
            onClick={() => setSubmittedSubNum(null)}
            className="text-xs text-emerald-400 underline hover:text-emerald-300"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Customer & Plan Details */}
      <div className="bg-[#121215] border border-[#27272a] rounded-xl p-5 space-y-4">
        <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-300 font-semibold">
          1. Customer &amp; Billing Cadence Configuration
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          <div>
            <label className="text-zinc-400">Customer Organization Name</label>
            <input
              type="text"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              className="w-full mt-1.5 p-2 bg-[#18181b] border border-[#27272a] rounded text-white"
            />
          </div>

          <div>
            <label className="text-zinc-400">Billing Email</label>
            <input
              type="email"
              value={customerEmail}
              onChange={e => setCustomerEmail(e.target.value)}
              className="w-full mt-1.5 p-2 bg-[#18181b] border border-[#27272a] rounded text-white"
            />
          </div>

          <div>
            <label className="text-zinc-400">Recurring Cadence Plan</label>
            <select
              value={selectedPlanId}
              onChange={e => setSelectedPlanId(e.target.value)}
              className="w-full mt-1.5 p-2 bg-[#18181b] border border-[#27272a] rounded text-white"
            >
              {plans.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.cadence} — ${p.basePrice})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Products & Lines Configuration */}
      <div className="bg-[#121215] border border-[#27272a] rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-300 font-semibold">
            2. Product Lines &amp; Variant Pricing
          </h2>
          <button
            onClick={handleAddLine}
            className="px-2.5 py-1 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 text-xs font-mono flex items-center gap-1.5 hover:bg-cyan-900"
          >
            <Plus className="w-3.5 h-3.5" /> Add Line Item
          </button>
        </div>

        <div className="space-y-3">
          {lines.map((line, idx) => {
            const currentProd = products.find(p => p.id === line.productId);
            return (
              <div
                key={line.id}
                className="bg-[#18181b] border border-[#27272a] p-3 rounded-lg grid grid-cols-12 gap-3 items-center text-xs font-mono"
              >
                {/* Product Select */}
                <div className="col-span-12 md:col-span-4">
                  <label className="text-zinc-500 text-[10px]">Product</label>
                  <select
                    value={line.productId}
                    onChange={e => handleProductSelect(idx, e.target.value)}
                    className="w-full mt-1 p-1.5 bg-[#121215] border border-zinc-700 rounded text-zinc-200"
                  >
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} (${p.salesPrice})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Variant Select */}
                <div className="col-span-12 md:col-span-3">
                  <label className="text-zinc-500 text-[10px]">Tier Variant</label>
                  <select
                    value={line.variantId || ''}
                    onChange={e => handleVariantSelect(idx, e.target.value)}
                    className="w-full mt-1 p-1.5 bg-[#121215] border border-zinc-700 rounded text-zinc-200"
                  >
                    {currentProd?.variants.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.priceModifier >= 0 ? '+' : ''}${v.priceModifier})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quantity */}
                <div className="col-span-4 md:col-span-1">
                  <label className="text-zinc-500 text-[10px]">Qty</label>
                  <input
                    type="number"
                    min="1"
                    value={line.quantity}
                    onChange={e => handleQuantityChange(idx, Number(e.target.value))}
                    className="w-full mt-1 p-1.5 bg-[#121215] border border-zinc-700 rounded text-zinc-200 text-center"
                  />
                </div>

                {/* Discount % */}
                <div className="col-span-4 md:col-span-1">
                  <label className="text-zinc-500 text-[10px]">Disc %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={line.discountPercent}
                    onChange={e => handleDiscountChange(idx, Number(e.target.value))}
                    className="w-full mt-1 p-1.5 bg-[#121215] border border-zinc-700 rounded text-zinc-200 text-center"
                  />
                </div>

                {/* Line Total */}
                <div className="col-span-3 md:col-span-2 text-right">
                  <label className="text-zinc-500 text-[10px]">Line Total</label>
                  <div className="mt-1 font-bold text-cyan-300">
                    <CurrencyFormatter amount={line.lineTotal} />
                  </div>
                </div>

                {/* Remove button */}
                <div className="col-span-1 text-right">
                  <button
                    onClick={() => handleRemoveLine(idx)}
                    className="text-zinc-600 hover:text-rose-400 p-1"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary & Submission */}
      <div className="bg-[#121215] border border-[#27272a] rounded-xl p-5 flex flex-col md:flex-row justify-between gap-6">
        <div className="w-full md:w-1/2 space-y-3 text-xs font-mono">
          <div>
            <label className="text-zinc-400">Quotation Terms &amp; Notes</label>
            <textarea
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full mt-1 p-2 bg-[#18181b] border border-[#27272a] rounded text-zinc-200"
            />
          </div>
          <div className="text-[11px] text-zinc-500 italic">
            * All calculated values are verified against server-side models upon state confirmation.
          </div>
        </div>

        <div className="w-full md:w-80 bg-[#18181b] p-4 rounded-xl border border-zinc-800 space-y-2.5 text-xs font-mono">
          <div className="flex justify-between text-zinc-400">
            <span>Subtotal:</span>
            <CurrencyFormatter amount={subtotal} />
          </div>
          <div className="flex justify-between text-zinc-400">
            <span>Estimated Tax (10%):</span>
            <CurrencyFormatter amount={tax} />
          </div>
          <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-zinc-800">
            <span>Cycle Total:</span>
            <span className="text-cyan-300">
              <CurrencyFormatter amount={grandTotal} />
            </span>
          </div>

          <div className="pt-3 flex flex-col gap-2">
            <button
              onClick={() => handleSubmit('Quotation')}
              className="w-full py-2 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/60 text-cyan-300 font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              Submit as Quotation
            </button>
            <button
              onClick={() => handleSubmit('Draft')}
              className="w-full py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
            >
              Save as Draft
            </button>
          </div>
        </div>
      </div>

      {/* Save Template Modal */}
      {showSaveTemplateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121215] border border-[#27272a] rounded-xl max-w-md w-full p-6 space-y-4 font-mono text-xs">
            <h3 className="text-sm font-bold text-white">Save Current Lines as Template</h3>
            <form onSubmit={handleSaveAsTemplate} className="space-y-3">
              <div>
                <label className="text-zinc-400">Template Bundle Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fintech Compliant Infrastructure"
                  value={newTemplateName}
                  onChange={e => setNewTemplateName(e.target.value)}
                  className="w-full mt-1 p-2 bg-[#18181b] border border-[#27272a] rounded text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSaveTemplateModal(false)}
                  className="px-3 py-1.5 rounded bg-zinc-800 text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500 hover:bg-cyan-900"
                >
                  Save Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
