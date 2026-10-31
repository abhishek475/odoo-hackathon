import { ProductCatalog } from './ProductCatalog';
import React, { useState } from 'react';
import { useAppState } from '../../context/AppStateContext';
import { BillingPlan, PlanCadence } from '../../types/billing';
import { CurrencyFormatter } from '../../components/shared/CurrencyFormatter';
import { Plus, Box, Layers, Check, X, Tag } from 'lucide-react';

export const CatalogPage: React.FC = () => {
  const { products, plans, createPlan } = useAppState();

  const [activeTab, setActiveTab] = useState<'products' | 'plans'>('products');
  const [showPlanModal, setShowPlanModal] = useState(false);

  // New plan form state
  const [planName, setPlanName] = useState('');
  const [planCadence, setPlanCadence] = useState<PlanCadence>('MONTHLY');
  const [planPrice, setPlanPrice] = useState(1200);
  const [planMinQty, setPlanMinQty] = useState(1);
  const [planValidity, setPlanValidity] = useState(365);
  const [planAutoClose, setPlanAutoClose] = useState(false);
  const [planPausePermission, setPlanPausePermission] = useState(true);
  const [planDesc, setPlanDesc] = useState('');

  // TODO: [BACKEND_HOOK] - POST /api/v1/plans - Payload: Omit<BillingPlan, 'id'> - Returns: Promise<BillingPlan>
  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planName.trim()) return;

    await createPlan({
      name: planName,
      cadence: planCadence,
      basePrice: Number(planPrice),
      minQuantity: Number(planMinQty),
      validityDays: Number(planValidity),
      autoClose: planAutoClose,
      pausePermission: planPausePermission,
      description: planDesc,
    });

    setShowPlanModal(false);
    setPlanName('');
    setPlanDesc('');
  };

  return (
    <div className="space-y-6">
      {/* Header & Sub-Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight font-mono">
            CATALOG &amp; PRICING ENGINE
          </h1>
          <p className="text-xs text-zinc-400 font-mono mt-1">
            Product models, multi-tier variants, and recurring cadence configurations
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'plans' && (
            <button
              onClick={() => setShowPlanModal(true)}
              className="px-3 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300 text-xs font-mono flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-cyan-400" />
              New Billing Plan
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#27272a] gap-6 text-xs font-mono">
        <button
          onClick={() => setActiveTab('products')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'products'
              ? 'border-cyan-400 text-cyan-300 font-semibold'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Box className="w-4 h-4" />
          Products &amp; Variants ({products.length})
        </button>
        <button
          onClick={() => setActiveTab('plans')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'plans'
              ? 'border-cyan-400 text-cyan-300 font-semibold'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          Billing Plans &amp; Cadences ({plans.length})
        </button>
      </div>

      {activeTab === 'products' && <ProductCatalog />}

      {/* Plans Tab */}
      {activeTab === 'plans' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map(plan => (
            <div
              key={plan.id}
              className="bg-[#121215] border border-[#27272a] rounded-xl p-5 hover:border-zinc-700 transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                    {plan.cadence}
                  </span>
                  <div className="text-base font-bold text-white">
                    <CurrencyFormatter amount={plan.basePrice} />
                  </div>
                </div>

                <h3 className="text-base font-semibold text-white mt-3">{plan.name}</h3>
                <p className="text-xs text-zinc-400 mt-2">{plan.description}</p>

                {/* Plan parameters */}
                <div className="mt-4 space-y-2 pt-3 border-t border-[#27272a] text-xs font-mono">
                  <div className="flex justify-between text-zinc-400">
                    <span>Minimum Quantity:</span>
                    <strong className="text-zinc-200">{plan.minQuantity}</strong>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Validity Window:</span>
                    <strong className="text-zinc-200">{plan.validityDays} days</strong>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Auto-Close on Expiry:</span>
                    <strong className={plan.autoClose ? 'text-amber-400' : 'text-zinc-400'}>
                      {plan.autoClose ? 'Enabled' : 'Disabled'}
                    </strong>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Customer Pause Allowed:</span>
                    <strong className={plan.pausePermission ? 'text-emerald-400' : 'text-rose-400'}>
                      {plan.pausePermission ? 'Permitted' : 'Locked'}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-[#27272a] text-[10px] font-mono text-zinc-500">
                Plan ID: {plan.id}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Plan Modal */}
      {showPlanModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121215] border border-[#27272a] rounded-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
              <h2 className="text-base font-bold text-white font-mono">Create Billing Plan</h2>
              <button onClick={() => setShowPlanModal(false)} className="text-zinc-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-3 text-xs font-mono">
              <div>
                <label className="text-zinc-400">Plan Name</label>
                <input
                  type="text"
                  required
                  value={planName}
                  onChange={e => setPlanName(e.target.value)}
                  placeholder="e.g. Enterprise Scale Plan"
                  className="w-full mt-1 p-2 bg-[#18181b] border border-[#27272a] rounded text-zinc-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400">Cadence</label>
                  <select
                    value={planCadence}
                    onChange={e => setPlanCadence(e.target.value as any)}
                    className="w-full mt-1 p-2 bg-[#18181b] border border-[#27272a] rounded text-zinc-200"
                  >
                    <option value="DAILY">DAILY</option>
                    <option value="WEEKLY">WEEKLY</option>
                    <option value="MONTHLY">MONTHLY</option>
                    <option value="YEARLY">YEARLY</option>
                  </select>
                </div>
                <div>
                  <label className="text-zinc-400">Base Price ($)</label>
                  <input
                    type="number"
                    value={planPrice}
                    onChange={e => setPlanPrice(Number(e.target.value))}
                    className="w-full mt-1 p-2 bg-[#18181b] border border-[#27272a] rounded text-zinc-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400">Min Quantity</label>
                  <input
                    type="number"
                    value={planMinQty}
                    onChange={e => setPlanMinQty(Number(e.target.value))}
                    className="w-full mt-1 p-2 bg-[#18181b] border border-[#27272a] rounded text-zinc-200"
                  />
                </div>
                <div>
                  <label className="text-zinc-400">Validity (Days)</label>
                  <input
                    type="number"
                    value={planValidity}
                    onChange={e => setPlanValidity(Number(e.target.value))}
                    className="w-full mt-1 p-2 bg-[#18181b] border border-[#27272a] rounded text-zinc-200"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={planAutoClose}
                    onChange={e => setPlanAutoClose(e.target.checked)}
                    className="rounded bg-[#18181b] border-zinc-700 text-cyan-400"
                  />
                  <span>Auto-Close Subscription upon Validity Expiry</span>
                </label>
                <label className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={planPausePermission}
                    onChange={e => setPlanPausePermission(e.target.checked)}
                    className="rounded bg-[#18181b] border-zinc-700 text-cyan-400"
                  />
                  <span>Allow Customer / Staff to Pause Lifecycle</span>
                </label>
              </div>

              <div>
                <label className="text-zinc-400">Description</label>
                <textarea
                  value={planDesc}
                  onChange={e => setPlanDesc(e.target.value)}
                  rows={2}
                  className="w-full mt-1 p-2 bg-[#18181b] border border-[#27272a] rounded text-zinc-200"
                  placeholder="Terms, overage rules, and billing schedule details..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#27272a]">
                <button
                  type="button"
                  onClick={() => setShowPlanModal(false)}
                  className="px-3 py-1.5 rounded bg-zinc-800 text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500 hover:bg-cyan-900"
                >
                  Save Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
