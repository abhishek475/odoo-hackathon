import React, { useState } from 'react';
import { useAppState } from '../../context/AppStateContext';
import { DiscountRule } from '../../types/billing';
import { CurrencyFormatter } from '../../components/shared/CurrencyFormatter';
import { formatDate } from '../../lib/utils';
import { Tags, Plus, Check, X, ShieldAlert } from 'lucide-react';

export const DiscountsPage: React.FC = () => {
  const { discounts, createDiscount, toggleDiscount } = useAppState();

  const [showModal, setShowModal] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<'PERCENT' | 'FIXED'>('PERCENT');
  const [value, setValue] = useState(15);
  const [minOrder, setMinOrder] = useState(1000);
  const [validUntil, setValidUntil] = useState('2026-12-31');

  // TODO: [BACKEND_HOOK] - POST /api/v1/discounts - Payload: Omit<DiscountRule, 'id' | 'usageCount'> - Returns: Promise<DiscountRule>
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    await createDiscount({
      code: code.toUpperCase().trim(),
      name,
      type,
      value: Number(value),
      minOrderAmount: Number(minOrder),
      validUntil,
      active: true,
    });

    setShowModal(false);
    setCode('');
    setName('');
  };

  // TODO: [BACKEND_HOOK] - PATCH /api/v1/discounts/:id/toggle - Returns: Promise<DiscountRule>
  const handleToggle = async (id: string) => {
    await toggleDiscount(id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight font-mono">
            DISCOUNT RULE ENGINE
          </h1>
          <p className="text-xs text-zinc-400 font-mono mt-1">
            Commercial coupon codes, margin thresholds, and promotional incentives
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-3 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300 text-xs font-mono flex items-center gap-1.5 transition-colors"
        >
          <Plus className="w-3.5 h-3.5 text-cyan-400" />
          Create Discount Rule
        </button>
      </div>

      {/* Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {discounts.map(disc => (
          <div
            key={disc.id}
            className="bg-[#121215] border border-[#27272a] rounded-xl p-5 flex flex-col justify-between hover:border-zinc-700 transition-colors"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-[#18181b] text-cyan-300 border border-zinc-700">
                  {disc.code}
                </span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                    disc.active
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                      : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                  }`}
                >
                  {disc.active ? 'ACTIVE' : 'DISABLED'}
                </span>
              </div>

              <h3 className="text-sm font-semibold text-white mt-3 font-sans">{disc.name}</h3>

              <div className="mt-4 space-y-2 text-xs font-mono pt-3 border-t border-[#27272a]">
                <div className="flex justify-between text-zinc-400">
                  <span>Benefit:</span>
                  <strong className="text-white">
                    {disc.type === 'PERCENT' ? `${disc.value}% OFF` : `$${disc.value} FLAT`}
                  </strong>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Minimum Order:</span>
                  <strong className="text-zinc-200">
                    <CurrencyFormatter amount={disc.minOrderAmount} />
                  </strong>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Valid Until:</span>
                  <strong className="text-zinc-200">{formatDate(disc.validUntil)}</strong>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Times Redeemed:</span>
                  <strong className="text-cyan-400">{disc.usageCount}</strong>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-[#27272a] flex items-center justify-between">
              <span className="text-[10px] text-zinc-500 font-mono">ID: {disc.id}</span>
              <button
                onClick={() => handleToggle(disc.id)}
                className={`px-2.5 py-1 rounded text-[11px] font-mono border transition-colors ${
                  disc.active
                    ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700'
                    : 'bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border-emerald-800'
                }`}
              >
                {disc.active ? 'Disable Rule' : 'Enable Rule'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121215] border border-[#27272a] rounded-xl max-w-md w-full p-6 space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Tags className="w-4 h-4 text-cyan-400" />
                New Promotional Discount Rule
              </h3>
              <button onClick={() => setShowModal(false)} className="text-zinc-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="text-zinc-400">Coupon Promo Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AUTUMN25"
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  className="w-full mt-1 p-2 bg-[#18181b] border border-[#27272a] rounded text-white uppercase"
                />
              </div>

              <div>
                <label className="text-zinc-400">Campaign Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q4 Cloud Acceleration"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full mt-1 p-2 bg-[#18181b] border border-[#27272a] rounded text-white font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400">Benefit Type</label>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value as any)}
                    className="w-full mt-1 p-2 bg-[#18181b] border border-[#27272a] rounded text-zinc-200"
                  >
                    <option value="PERCENT">Percentage (%)</option>
                    <option value="FIXED">Fixed Amount ($)</option>
                  </select>
                </div>
                <div>
                  <label className="text-zinc-400">Value</label>
                  <input
                    type="number"
                    required
                    value={value}
                    onChange={e => setValue(Number(e.target.value))}
                    className="w-full mt-1 p-2 bg-[#18181b] border border-[#27272a] rounded text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400">Min Order ($)</label>
                  <input
                    type="number"
                    value={minOrder}
                    onChange={e => setMinOrder(Number(e.target.value))}
                    className="w-full mt-1 p-2 bg-[#18181b] border border-[#27272a] rounded text-white"
                  />
                </div>
                <div>
                  <label className="text-zinc-400">Valid Until</label>
                  <input
                    type="date"
                    value={validUntil}
                    onChange={e => setValidUntil(e.target.value)}
                    className="w-full mt-1 p-2 bg-[#18181b] border border-[#27272a] rounded text-white"
                  />
                </div>
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
                  className="px-4 py-1.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500 hover:bg-cyan-900"
                >
                  Save Discount Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
