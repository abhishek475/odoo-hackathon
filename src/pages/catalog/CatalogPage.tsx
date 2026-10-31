import React, { useState } from 'react';
import { useAppState } from '../../context/AppStateContext';
import { Product, BillingPlan, PlanCadence } from '../../types/billing';
import { CurrencyFormatter } from '../../components/shared/CurrencyFormatter';
import { Plus, Box, Layers, Check, X, Tag } from 'lucide-react';

export const CatalogPage: React.FC = () => {
  const { products, plans, createProduct, createPlan } = useAppState();

  const [activeTab, setActiveTab] = useState<'products' | 'plans'>('products');
  const [showProductModal, setShowProductModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);

  // New product form state
  const [prodName, setProdName] = useState('');
  const [prodType, setProdType] = useState<'SERVICE' | 'GOODS'>('SERVICE');
  const [prodSalesPrice, setProdSalesPrice] = useState(450);
  const [prodCostPrice, setProdCostPrice] = useState(150);
  const [prodNotes, setProdNotes] = useState('');
  const [variants, setVariants] = useState<Array<{ name: string; priceModifier: number; sku: string }>>([
    { name: 'Standard Edition', priceModifier: 0, sku: 'STD-01' },
  ]);

  // New plan form state
  const [planName, setPlanName] = useState('');
  const [planCadence, setPlanCadence] = useState<PlanCadence>('MONTHLY');
  const [planPrice, setPlanPrice] = useState(1200);
  const [planMinQty, setPlanMinQty] = useState(1);
  const [planValidity, setPlanValidity] = useState(365);
  const [planAutoClose, setPlanAutoClose] = useState(false);
  const [planPausePermission, setPlanPausePermission] = useState(true);
  const [planDesc, setPlanDesc] = useState('');

  const handleAddVariant = () => {
    setVariants([...variants, { name: '', priceModifier: 0, sku: `SKU-${Date.now().toString(36).toUpperCase()}` }]);
  };

  const handleVariantChange = (index: number, field: string, value: any) => {
    const updated = [...variants];
    (updated[index] as any)[field] = value;
    setVariants(updated);
  };

  // TODO: [BACKEND_HOOK] - POST /api/v1/products - Payload: Omit<Product, 'id' | 'createdAt'> - Returns: Promise<Product>
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim()) return;

    await createProduct({
      name: prodName,
      type: prodType,
      salesPrice: Number(prodSalesPrice),
      costPrice: Number(prodCostPrice),
      notes: prodNotes,
      active: true,
      variants: variants.map((v, i) => ({
        id: `var-${Date.now()}-${i}`,
        name: v.name || 'Default Tier',
        priceModifier: Number(v.priceModifier),
        sku: v.sku,
      })),
    });

    setShowProductModal(false);
    setProdName('');
    setProdNotes('');
  };

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
          {activeTab === 'products' ? (
            <button
              onClick={() => setShowProductModal(true)}
              className="px-3 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300 text-xs font-mono flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-cyan-400" />
              New Product &amp; Variants
            </button>
          ) : (
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

      {/* Products Tab */}
      {activeTab === 'products' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {products.map(prod => (
            <div
              key={prod.id}
              className="bg-[#121215] border border-[#27272a] rounded-xl p-5 hover:border-zinc-700 transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                      {prod.type}
                    </span>
                    <h3 className="text-base font-semibold text-white mt-2">{prod.name}</h3>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-bold text-cyan-300">
                      <CurrencyFormatter amount={prod.salesPrice} />
                    </div>
                    <span className="text-[10px] text-zinc-500 font-mono">Cost: <CurrencyFormatter amount={prod.costPrice} /></span>
                  </div>
                </div>

                <p className="text-xs text-zinc-400 mt-2 line-clamp-2">{prod.notes}</p>

                {/* Variants List */}
                <div className="mt-4 pt-4 border-t border-[#27272a]">
                  <p className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 mb-2 flex items-center gap-1.5">
                    <Tag className="w-3 h-3 text-cyan-400" /> Configured Variants ({prod.variants.length})
                  </p>
                  <div className="space-y-1.5">
                    {prod.variants.map(v => (
                      <div
                        key={v.id}
                        className="flex items-center justify-between bg-[#18181b] px-3 py-1.5 rounded text-xs font-mono border border-zinc-800"
                      >
                        <span className="text-zinc-300">{v.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] text-zinc-500">{v.sku}</span>
                          <span className={v.priceModifier >= 0 ? 'text-cyan-300' : 'text-rose-400'}>
                            {v.priceModifier >= 0 ? '+' : ''}
                            <CurrencyFormatter amount={v.priceModifier} />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#27272a] flex items-center justify-between text-[11px] font-mono text-zinc-500">
                <span>SKU ID: {prod.id}</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Active Catalog Item
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

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

      {/* Create Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121215] border border-[#27272a] rounded-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
              <h2 className="text-base font-bold text-white font-mono">Create Catalog Product</h2>
              <button onClick={() => setShowProductModal(false)} className="text-zinc-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3 text-xs font-mono">
              <div>
                <label className="text-zinc-400">Product Name</label>
                <input
                  type="text"
                  required
                  value={prodName}
                  onChange={e => setProdName(e.target.value)}
                  placeholder="e.g. Distributed Cassandra Cluster"
                  className="w-full mt-1 p-2 bg-[#18181b] border border-[#27272a] rounded text-zinc-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-zinc-400">Type</label>
                  <select
                    value={prodType}
                    onChange={e => setProdType(e.target.value as any)}
                    className="w-full mt-1 p-2 bg-[#18181b] border border-[#27272a] rounded text-zinc-200"
                  >
                    <option value="SERVICE">SERVICE</option>
                    <option value="GOODS">GOODS</option>
                  </select>
                </div>
                <div>
                  <label className="text-zinc-400">Sales Price ($)</label>
                  <input
                    type="number"
                    value={prodSalesPrice}
                    onChange={e => setProdSalesPrice(Number(e.target.value))}
                    className="w-full mt-1 p-2 bg-[#18181b] border border-[#27272a] rounded text-zinc-200"
                  />
                </div>
                <div>
                  <label className="text-zinc-400">Cost Price ($)</label>
                  <input
                    type="number"
                    value={prodCostPrice}
                    onChange={e => setProdCostPrice(Number(e.target.value))}
                    className="w-full mt-1 p-2 bg-[#18181b] border border-[#27272a] rounded text-zinc-200"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-400">Description &amp; Specifications</label>
                <textarea
                  value={prodNotes}
                  onChange={e => setProdNotes(e.target.value)}
                  rows={2}
                  className="w-full mt-1 p-2 bg-[#18181b] border border-[#27272a] rounded text-zinc-200"
                  placeholder="Technical description of service capability..."
                />
              </div>

              {/* Variants Section */}
              <div className="border-t border-[#27272a] pt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-zinc-300 font-semibold">Tier Variants</span>
                  <button
                    type="button"
                    onClick={handleAddVariant}
                    className="text-cyan-400 hover:text-cyan-300 text-[11px]"
                  >
                    + Add Variant
                  </button>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {variants.map((v, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-center">
                      <input
                        type="text"
                        placeholder="Variant name"
                        value={v.name}
                        onChange={e => handleVariantChange(i, 'name', e.target.value)}
                        className="col-span-6 p-1.5 bg-[#18181b] border border-[#27272a] rounded text-zinc-200"
                      />
                      <input
                        type="number"
                        placeholder="+$ modifier"
                        value={v.priceModifier}
                        onChange={e => handleVariantChange(i, 'priceModifier', Number(e.target.value))}
                        className="col-span-3 p-1.5 bg-[#18181b] border border-[#27272a] rounded text-zinc-200"
                      />
                      <input
                        type="text"
                        placeholder="SKU"
                        value={v.sku}
                        onChange={e => handleVariantChange(i, 'sku', e.target.value)}
                        className="col-span-3 p-1.5 bg-[#18181b] border border-[#27272a] rounded text-zinc-200"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#27272a]">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-3 py-1.5 rounded bg-zinc-800 text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500 hover:bg-cyan-900"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
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
