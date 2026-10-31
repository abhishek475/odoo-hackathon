import { useMemo, useState } from 'react';
import { useAppState } from '../../context/AppStateContext';
import { CurrencyFormatter } from '../../components/shared/CurrencyFormatter';
import { WorkspaceState } from '../../components/shared/WorkspaceState';
import { filterProducts, productPayload, ProductDraft } from './catalogModel';

const emptyDraft = (): ProductDraft => ({ name: '', type: 'SERVICE', salesPrice: '', costPrice: '', notes: '', variants: [] });
const inputClass = 'w-full rounded border border-zinc-700 bg-zinc-900 p-2';

export function ProductCatalog() {
  // TODO: [BACKEND_HOOK] - Confirm product list/detail/create contracts - Expected demo Product[] / Product; server currency and validation pending
  const { products, createProduct, isLoading, error, refreshAll } = useAppState();
  const [query, setQuery] = useState('');
  const [type, setType] = useState('all');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ProductDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState('');
  const [notice, setNotice] = useState('');
  const filtered = useMemo(() => filterProducts(products, query, type, status), [products, query, type, status]);
  const lastPage = Math.max(0, Math.ceil(filtered.length / 12) - 1);
  const currentPage = Math.min(page, lastPage);
  const selected = products.find(p => p.id === selectedId);
  const update = (patch: Partial<ProductDraft>) => setDraft(value => value && ({ ...value, ...patch }));
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft || saving) return;
    setFailure('');
    try {
      const payload = productPayload(draft);
      setSaving(true);
      await createProduct(payload);
      setDraft(null);
      setNotice('Product created in the local demo catalog.');
    } catch (cause) {
      setFailure(cause instanceof Error ? cause.message : 'Product could not be saved. Try again.');
    } finally { setSaving(false); }
  };
  return <section className="space-y-4" aria-label="Product catalog">
    <p className="text-sm text-amber-200">Local demo catalog · USD. Changes are not sent to a backend. Editing awaits a confirmed API contract.</p>
    <div className="flex flex-wrap gap-3 items-end">
      <label className="flex-1 min-w-48">Search products or variant SKUs<input className={inputClass} value={query} onChange={e => { setQuery(e.target.value); setPage(0); }} /></label>
      <label>Type<select className={inputClass} value={type} onChange={e => { setType(e.target.value); setPage(0); }}><option value="all">All types</option><option value="SERVICE">Service</option><option value="GOODS">Goods</option></select></label>
      <label>Status<select className={inputClass} value={status} onChange={e => { setStatus(e.target.value); setPage(0); }}><option value="all">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
      <button className="rounded bg-cyan-300 px-4 py-2 text-zinc-950" onClick={() => { setDraft(emptyDraft()); setFailure(''); setNotice(''); }}>New demo product</button>
    </div>
    {notice && <p role="status" className="text-emerald-300">{notice}</p>}
    {draft && <form onSubmit={save} className="space-y-4 rounded-xl border border-zinc-700 p-4" aria-label="Create demo product" aria-busy={saving}>
      <h2 className="font-bold">Create demo product</h2>
      <fieldset disabled={saving} className="space-y-3">
        <label className="block">Product name<input autoFocus required className={inputClass} value={draft.name} onChange={e => update({ name: e.target.value })} /></label>
        <label className="block">Product type<select className={inputClass} value={draft.type} onChange={e => update({ type: e.target.value as ProductDraft['type'] })}><option value="SERVICE">Service</option><option value="GOODS">Goods</option></select></label>
        <div className="grid gap-3 sm:grid-cols-2">{(['salesPrice', 'costPrice'] as const).map(field => <label key={field}>{field === 'salesPrice' ? 'Sales' : 'Cost'} price (USD)<input required inputMode="decimal" className={inputClass} value={draft[field]} onChange={e => update({ [field]: e.target.value })} /></label>)}</div>
        <label className="block">Notes<textarea className={inputClass} value={draft.notes} onChange={e => update({ notes: e.target.value })} /></label>
        <h3>Variants — signed USD modifiers</h3>
        {draft.variants.map((variant, index) => <fieldset key={index} className="grid gap-2 rounded border border-zinc-800 p-3 sm:grid-cols-3"><legend>Variant {index + 1}</legend>
          {(['name', 'sku', 'priceModifier'] as const).map(field => <label key={field}>{field === 'priceModifier' ? 'Price modifier (USD)' : field === 'sku' ? 'SKU' : 'Variant name'}<input required className={inputClass} value={variant[field]} onChange={e => update({ variants: draft.variants.map((v, i) => i === index ? { ...v, [field]: e.target.value } : v) })} /></label>)}
          <button type="button" onClick={() => update({ variants: draft.variants.filter((_, i) => i !== index) })}>Remove variant {index + 1}</button>
        </fieldset>)}
        <button type="button" onClick={() => update({ variants: [...draft.variants, { name: '', sku: '', priceModifier: '0' }] })}>Add variant</button>
      </fieldset>
      {failure && <p role="alert" className="text-rose-300">{failure}</p>}
      <div className="flex gap-4"><button disabled={saving} type="submit" className="rounded bg-cyan-300 px-4 py-2 text-zinc-950">{saving ? 'Saving…' : 'Save demo product'}</button><button disabled={saving} type="button" onClick={() => setDraft(null)}>Cancel</button></div>
    </form>}
    {isLoading ? <WorkspaceState title="Loading catalog" description="Loading demo products…" /> : error ? <WorkspaceState error title="Catalog unavailable" description={error} onRetry={() => void refreshAll()} /> : !filtered.length ? <WorkspaceState title="No products found" description={products.length ? 'Change the search or filters to find products.' : 'Create a demo product to get started.'} /> : <>
      <p role="status">{filtered.length} matching products</p>
      <div className="overflow-x-auto rounded border border-zinc-800"><table className="w-full text-left text-sm"><caption className="sr-only">Demo products and prices in USD</caption><thead><tr>{['Product', 'Type', 'Sales price', 'Cost price', 'Variants', 'Status', 'Details'].map(h => <th key={h} scope="col" className="p-3">{h}</th>)}</tr></thead><tbody>{filtered.slice(currentPage * 12, (currentPage + 1) * 12).map(p => <tr key={p.id} className="border-t border-zinc-800"><th scope="row" className="p-3">{p.name}</th><td className="p-3">{p.type}</td><td className="p-3"><CurrencyFormatter amount={p.salesPrice} /></td><td className="p-3"><CurrencyFormatter amount={p.costPrice} /></td><td className="p-3">{p.variants.length}</td><td className="p-3">{p.active ? 'Active' : 'Inactive'}</td><td className="p-3"><button aria-label={`View ${p.name}`} onClick={() => setSelectedId(p.id)}>View</button></td></tr>)}</tbody></table></div>
      <nav aria-label="Catalog pagination" className="flex gap-4"><button disabled={!currentPage} onClick={() => setPage(currentPage - 1)}>Previous</button><span>Page {currentPage + 1} of {lastPage + 1}</span><button disabled={currentPage >= lastPage} onClick={() => setPage(currentPage + 1)}>Next</button></nav>
    </>}
    {selected && <section aria-label="Product details" className="space-y-3 rounded-xl border border-cyan-800 p-4"><h2 className="font-bold">{selected.name}</h2><p>{selected.notes || 'No notes supplied.'}</p><p>Product ID: {selected.id} · {selected.active ? 'Active' : 'Inactive'}</p><h3>Variant price modifiers (USD)</h3>{!selected.variants.length && <p>No variants configured.</p>}{selected.variants.map(v => <p key={v.id}>{v.name} · SKU {v.sku} · {v.priceModifier >= 0 ? '+' : ''}<CurrencyFormatter amount={v.priceModifier} /></p>)}<button onClick={() => setSelectedId(null)}>Close details</button></section>}
  </section>;
}
