import React, { FormEvent, useEffect, useRef, useState } from 'react';
import { liveApi as api, type Viewer, type RecordData, type Page } from '../services/liveApi';
import { type Field, type Resource, visibleResources, serializeFields, variantFields } from './resources';

const inputClass = 'w-full rounded border border-zinc-700 bg-zinc-900 p-2 text-zinc-100';
const buttonClass = 'rounded border border-cyan-800 bg-cyan-950 px-3 py-2 text-sm text-cyan-100 hover:bg-cyan-900 disabled:opacity-40';
const today = () => new Date().toISOString().slice(0, 10);
const message = (error: unknown) => error instanceof Error ? error.message : 'The request failed. Please try again.';
const display = (value: unknown): string => {
  if (value == null) return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object') {
    if ('name' in value) return String(value.name);
    return JSON.stringify(value);
  }
  return String(value);
};
const label = (key: string) => key.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase());

function Notice({ error, text }: { error?: boolean; text: string }) {
  return <p role={error ? 'alert' : 'status'} className={`my-3 rounded border p-3 ${error ? 'border-red-800 text-red-200' : 'border-emerald-900 text-emerald-200'}`}>{text}</p>;
}

/** Each reference chooser pages on the server instead of loading an entire customer/catalog table. */
function ReferenceSelect({ resource, name, required, value, onChange }: { resource: string; name?: string; required?: boolean; value?: string; onChange?: (id: string, item?: RecordData) => void }) {
  const [items, setItems] = useState<RecordData[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(value ?? '');
  const [selectedItem, setSelectedItem] = useState<RecordData>();
  const [loading, setLoading] = useState(false);
  useEffect(() => { setSelected(value ?? ''); }, [value]);
  useEffect(() => {
    let active = true;
    setLoading(true);
    const query = new URLSearchParams({ page: String(page), pageSize: '20' });
    if (search && ['products', 'customers'].includes(resource)) query.set('search', search);
    api.request<Page<RecordData>>(`/${resource}?${query}`).then(result => {
      if (active) { setItems(result.data); setPages(result.pagination.pages); setError(''); }
    }).catch(e => { if (active) setError(message(e)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [resource, search, page]);
  return <span className="block space-y-1">
    {['products', 'customers'].includes(resource) && <input aria-label={`Search ${resource}`} className={inputClass} placeholder={`Search ${resource}`} value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />}
    <select aria-label={`Select ${resource}`} name={name} required={required} className={inputClass} value={selected} onChange={e => {
      const item = items.find(i => i.id === e.target.value); setSelected(e.target.value); setSelectedItem(item); onChange?.(e.target.value, item);
    }}>
      <option value="">Select…</option>
      {selected && !items.some(i => i.id === selected) && <option value={selected}>{selectedItem ? display(selectedItem.name ?? selectedItem.email) : selected}</option>}
      {items.map(i => <option key={i.id} value={i.id}>{display(i.name ?? i.code ?? i.email ?? i.number ?? i.id)}</option>)}
    </select>
    {error && <span role="alert" className="text-red-300">{error}</span>}
    {loading && <span role="status" className="text-xs text-zinc-400">Loading choices…</span>}
    {pages > 1 && <span className="flex items-center gap-2 text-xs">
      <button type="button" disabled={page === 1 || loading} onClick={() => setPage(p => p - 1)}>Previous choices</button>
      <span>{page}/{pages}</span><button type="button" disabled={page >= pages || loading} onClick={() => setPage(p => p + 1)}>More choices</button>
    </span>}
  </span>;
}

interface Line { productId: string; variantId?: string; taxRuleId?: string; quantity: number }
function LineEditor({ lines, onChange }: { lines: Line[]; onChange: (lines: Line[]) => void }) {
  return <fieldset className="space-y-3 border border-zinc-700 rounded p-3"><legend>Product lines</legend>
    {lines.map((line, index) => <LineRow key={index} line={line} index={index} update={patch => onChange(lines.map((l, i) => i === index ? { ...l, ...patch } : l))} remove={() => onChange(lines.filter((_, i) => i !== index))} />)}
    <button type="button" className={buttonClass} disabled={lines.length >= 100} onClick={() => onChange([...lines, { productId: '', quantity: 1 }])}>Add product line</button>
    <p className="text-sm text-zinc-400">Prices, taxes and discounts are calculated by the server when the invoice is generated.</p>
  </fieldset>;
}
function LineRow({ line, index, update, remove }: { line: Line; index: number; update: (patch: Partial<Line>) => void; remove: () => void }) {
  const [variants, setVariants] = useState<RecordData[]>([]);
  useEffect(() => {
    let active = true;
    setVariants([]);
    if (line.productId) api.get<RecordData>(`/products/${line.productId}`).then(p => { if (active) setVariants((p.variants as RecordData[]) ?? []); }).catch(() => {});
    return () => { active = false; };
  }, [line.productId]);
  return <div className="grid gap-2 border-b border-zinc-800 pb-3 sm:grid-cols-2">
    <div>Product {index + 1}<ReferenceSelect resource="products" required value={line.productId} onChange={id => update({ productId: id, variantId: undefined })} /></div>
    <label>Variant<select className={inputClass} value={line.variantId ?? ''} onChange={e => update({ variantId: e.target.value || undefined })}><option value="">No variant</option>{variants.filter(v => v.active !== false).map(v => <option key={v.id} value={v.id}>{display(v.name)} ({display(v.priceModifier)})</option>)}</select></label>
    <label>Quantity<input className={inputClass} type="number" min="1" max="100000" required value={line.quantity} onChange={e => update({ quantity: Number(e.target.value) })} /></label>
    <div>Tax rule<ReferenceSelect resource="tax-rules" value={line.taxRuleId ?? ''} onChange={id => update({ taxRuleId: id || undefined })} /></div>
    <button type="button" className="text-left text-sm text-red-300" onClick={remove}>Remove line {index + 1}</button>
  </div>;
}

function Editor({ title, fields, initial, save, cancel }: { title: string; fields: Field[]; initial?: RecordData; save: (body: Record<string, unknown>) => Promise<void>; cancel?: () => void }) {
  const [lines, setLines] = useState<Line[]>((initial?.lines as Line[]) ?? [{ productId: '', quantity: 1 }]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [templateId, setTemplateId] = useState('');
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setError(''); setBusy(true); setDone(false);
    const body = serializeFields(fields, new FormData(e.currentTarget), Boolean(initial));
    if (fields.some(f => f.type === 'lines') && !templateId) {
      if (!lines.length || lines.some(l => !l.productId || !Number.isInteger(l.quantity) || l.quantity < 1)) { setError('Add at least one product with a positive whole quantity.'); setBusy(false); return; }
      body.lines = lines.map(({ productId, variantId, taxRuleId, quantity }) => ({ productId, quantity, ...(variantId ? { variantId } : {}), ...(taxRuleId ? { taxRuleId } : {}) }));
    }
    try { await save(body); setDone(true); } catch (e) { setError(message(e)); } finally { setBusy(false); }
  };
  return <form onSubmit={submit} className="space-y-4 rounded-xl border border-zinc-700 bg-zinc-950 p-5">
    <h2 className="text-lg font-semibold">{title}</h2>
    {fields.map(f => {
      const value = initial?.[f.key];
      if (f.type === 'lines') return templateId ? <p key={f.key} className="text-zinc-400">The selected template supplies the product lines and plan. Leave the plan empty to use its configured plan.</p> : <LineEditor key={f.key} lines={lines} onChange={setLines} />;
      if (f.resource) return <div key={f.key}>{f.label}<ReferenceSelect resource={f.resource} name={f.key} required={f.required} value={typeof value === 'string' ? value : undefined} onChange={f.key === 'templateId' ? setTemplateId : undefined} /></div>;
      return <label key={f.key} className="block space-y-1"><span>{f.label}</span>
        {f.choices ? <select className={inputClass} name={f.key} required={f.required} defaultValue={String(value ?? f.choices[0])}>{f.choices.map(c => <option key={c}>{c}</option>)}</select>
          : f.type === 'textarea' ? <textarea className={inputClass} name={f.key} defaultValue={String(value ?? '')} maxLength={4000} />
          : f.type === 'checkbox' ? <input className="ml-3" name={f.key} type="checkbox" defaultChecked={value === undefined ? ['active', 'allowRenew', 'autoClose'].includes(f.key) : Boolean(value)} />
          : <input className={inputClass} name={f.key} type={f.type ?? 'text'} required={f.required} min={f.min} max={f.max} step={f.type === 'number' ? 1 : undefined} defaultValue={String(value ?? f.initial ?? (f.type === 'date' && f.required ? today() : '')).slice(0, f.type === 'date' ? 10 : undefined)} />}
      </label>;
    })}
    {error && <Notice error text={error} />}{done && <Notice text="Saved on the server." />}
    <div className="flex gap-3"><button className={buttonClass} disabled={busy || done}>{busy ? 'Saving…' : 'Save'}</button>{cancel && <button type="button" onClick={cancel}>Close</button>}</div>
  </form>;
}

function Auth({ onViewer }: { onViewer: (viewer: Viewer) => void }) {
  const recovery = location.pathname === '/reset-password';
  const [tab, setTab] = useState<'login' | 'signup' | 'forgot' | 'password'>(recovery ? 'password' : 'login');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!recovery) return;
    const hash = new URLSearchParams(location.hash.slice(1));
    const access_token = hash.get('access_token'), refresh_token = hash.get('refresh_token');
    if (access_token && refresh_token) { api.setSession({ access_token, refresh_token }); history.replaceState(null, '', '/reset-password'); }
    else if (hash.get('error_description')) { setError(hash.get('error_description')!); history.replaceState(null, '', '/reset-password'); }
  }, [recovery]);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setError(''); setInfo('');
    const f = new FormData(e.currentTarget), email = String(f.get('email') ?? ''), password = String(f.get('password') ?? '');
    try {
      if (tab === 'login') onViewer(await api.login(email, password));
      if (tab === 'signup') { await api.post('/auth/signup', { email, password, name: String(f.get('name')) }); setInfo('Registration submitted. Follow the email instructions if confirmation is required, then sign in.'); }
      if (tab === 'forgot') { await api.post('/auth/forgot-password', { email }); setInfo('If the account exists, password reset instructions will be sent.'); }
      if (tab === 'password') { if (!api.hasSession()) throw new Error('Open a fresh invitation or password recovery link from your email.'); await api.post('/auth/password', { password }); history.replaceState(null, '', '/'); onViewer(await api.me()); }
    } catch (e) { setError(message(e)); } finally { setBusy(false); }
  }
  return <main className="min-h-screen bg-zinc-950 text-zinc-100 p-6 flex items-center justify-center"><div className="w-full max-w-md space-y-5">
    <h1 className="text-3xl font-bold">Brightloop</h1><p className="text-zinc-400">Subscription & recurring billing</p>
    <div className="flex flex-wrap gap-3">{(['login', 'signup', 'forgot', ...(recovery ? ['password' as const] : [])] as const).map(t => <button key={t} className={tab === t ? 'text-cyan-300 underline' : 'text-zinc-400'} onClick={() => { setTab(t); setError(''); setInfo(''); }}>{({ login: 'Sign in', signup: 'Create customer account', forgot: 'Reset password', password: 'Set password' })[t]}</button>)}</div>
    <form onSubmit={submit} className="space-y-4">
      {tab === 'signup' && <label className="block">Name<input className={inputClass} name="name" required maxLength={120} autoComplete="name" /></label>}
      {tab !== 'password' && <label className="block">Email<input className={inputClass} type="email" name="email" required autoComplete="email" /></label>}
      {tab !== 'forgot' && <label className="block">Password<input className={inputClass} name="password" aria-label="Password" type="password" required minLength={tab === 'login' ? 1 : 9} maxLength={tab === 'login' ? 200 : 72} autoComplete={tab === 'login' ? 'current-password' : 'new-password'} />{tab !== 'login' && <span className="text-sm text-zinc-400">At least 9 characters, with uppercase, lowercase and a special character.</span>}</label>}
      <button className={buttonClass} disabled={busy}>{busy ? 'Please wait…' : 'Continue'}</button>
    </form>{error && <Notice error text={error} />}{info && <Notice text={info} />}
    <p className="text-sm text-zinc-500">Your workspace role is assigned by your administrator.</p>
  </div></main>;
}

function Finance() {
  const [summary, setSummary] = useState<Record<string, unknown>>();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState('');
  const [exporting, setExporting] = useState(false);
  const loadVersion = useRef(0);
  const load = async (nextQuery = '') => {
    const version = ++loadVersion.current; setBusy(true); setError(''); setQuery(nextQuery); setSummary(undefined);
    try { const result = await api.get<Record<string, unknown>>(`/reports/summary${nextQuery}`); if (version === loadVersion.current) setSummary(result); }
    catch (e) { if (version === loadVersion.current) setError(message(e)); }
    finally { if (version === loadVersion.current) setBusy(false); }
  };
  const exportCsv = async () => {
    setExporting(true); setError('');
    try {
      const blob = await api.invoiceCsv(query);
      const url = URL.createObjectURL(blob), anchor = document.createElement('a');
      anchor.href = url; anchor.download = 'brightloop-invoices.csv'; document.body.append(anchor); anchor.click(); anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) { setError(message(e)); } finally { setExporting(false); }
  };
  useEffect(() => { void load(); }, []);
  return <section className="space-y-5"><h1 className="text-2xl font-bold">Finance overview</h1>
    <form className="flex flex-wrap items-end gap-3" onSubmit={e => { e.preventDefault(); const f = new FormData(e.currentTarget); const q = new URLSearchParams(); for (const k of ['from', 'to', 'customerId']) if (f.get(k)) q.set(k, String(f.get(k))); void load(q.size ? `?${q}` : ''); }}>
      <label>From<input className={inputClass} name="from" type="date" /></label><label>To<input className={inputClass} name="to" type="date" /></label><div>Customer (optional)<ReferenceSelect resource="customers" name="customerId" /></div><button className={buttonClass} disabled={busy || exporting}>Update</button>
    </form>{error && <Notice error text={error} />}{busy && <p role="status">Loading server metrics…</p>}
    <button className={buttonClass} disabled={busy || exporting || !summary} onClick={() => void exportCsv()}>{exporting ? 'Downloading…' : 'Download invoice CSV'}</button>
    <p className="text-sm text-zinc-400">The CSV uses the filters applied with Update.</p>
    {summary && <><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{['grossMrr', 'grossArr', 'overdueAmount', 'collectedPayments', 'activeSubscriptions', 'outstandingAmount', 'invoicedAmount', 'overdueInvoiceCount'].map(k => <div key={k} className="rounded-xl border border-zinc-800 bg-zinc-900 p-5"><p className="text-sm text-zinc-400">{label(k)}</p><p className="mt-2 text-2xl font-semibold">{display(summary[k])} {k.endsWith('Count') || k === 'activeSubscriptions' ? '' : display(summary.currency)}</p></div>)}</div><p className="text-sm text-zinc-400">{display((summary.scope as Record<string, unknown>)?.note)}</p></>}
  </section>;
}

function Detail({ resource, id, viewer, changed, close }: { resource: Resource; id: string; viewer: Viewer; changed: () => void; close: () => void }) {
  const [item, setItem] = useState<RecordData>();
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);
  const [printHtml, setPrintHtml] = useState('');
  const [editing, setEditing] = useState(false);
  const [editingVariant, setEditingVariant] = useState<RecordData>();
  const frame = useRef<HTMLIFrameElement>(null);
  const paymentAttempt = useRef<{ signature: string; key: string }>();
  const load = async () => setItem(await api.get<RecordData>(`/${resource.key}/${id}`));
  useEffect(() => { void load().catch(e => setError(message(e))); }, [resource.key, id]);
  const act = async (action: string, body: unknown = {}) => {
    setBusy(true); setError(''); setInfo('');
    try { await api.post(`/${resource.key}/${id}/${action}`, body); await load(); changed(); setInfo('Saved on the server.'); }
    catch (e) { setError(message(e)); } finally { setBusy(false); }
  };
  const staff = viewer.role !== 'CUSTOMER';
  const status = String(item?.status ?? '');
  const plan = item?.plan as Record<string, unknown> | undefined;
  const transitions = resource.key !== 'subscriptions' ? [] : [
    ...(staff && status === 'DRAFT' ? ['quote'] : []), ...(staff && status === 'QUOTATION' ? ['confirm'] : []), ...(staff && status === 'CONFIRMED' ? ['activate'] : []),
    ...(status === 'ACTIVE' && plan?.allowPause ? ['pause'] : []), ...(status === 'PAUSED' ? ['resume'] : []),
    ...(['ACTIVE', 'PAUSED'].includes(status) && (staff || plan?.allowEarlyClose) ? ['close'] : []),
  ];
  return <section className="space-y-4 rounded-xl border border-zinc-700 p-5">
    <div className="flex justify-between gap-3"><h2 className="text-xl font-semibold">{display(item?.number ?? item?.name ?? id)}</h2><button onClick={close}>Close details</button></div>
    {error && <Notice error text={error} />}{info && <Notice text={info} />}
    {!item ? <p role="status">Loading details…</p> : <>
      <dl className="grid gap-3 sm:grid-cols-2">{Object.entries(item).filter(([, v]) => !v || typeof v !== 'object').map(([k, v]) => <div key={k}><dt className="text-sm text-zinc-400">{label(k)}</dt><dd className="break-words">{display(v)}</dd></div>)}</dl>
      {['lines', 'variants', 'payments'].map(k => Array.isArray(item[k]) && <div key={k}><h3 className="font-semibold">{label(k)}</h3><div className="space-y-2">{(item[k] as RecordData[]).map((row, i) => <dl key={row.id ?? i} className="flex flex-wrap gap-4 rounded border border-zinc-800 p-3">{Object.entries(row).filter(([key, v]) => !key.endsWith('Id') && key !== 'id' && (v == null || typeof v !== 'object')).map(([key, v]) => <div key={key}><dt className="text-xs text-zinc-500">{label(key)}</dt><dd>{display(v)}</dd></div>)}</dl>)}</div></div>)}
      <div className="flex flex-wrap gap-2">{transitions.map(a => <button key={a} className={buttonClass} disabled={busy} onClick={() => void act(a)}>{label(a)}</button>)}
        {resource.key === 'invoices' && <>
          {staff && status === 'DRAFT' && <button className={buttonClass} disabled={busy} onClick={() => void act('confirm')}>Confirm invoice</button>}
          {staff && ['DRAFT', 'CONFIRMED'].includes(status) && <button className={buttonClass} disabled={busy} onClick={() => void act('cancel')}>Cancel invoice</button>}
          {staff && ['CONFIRMED', 'PAID'].includes(status) && <button className={buttonClass} disabled={busy} onClick={() => void act('send')}>Email invoice</button>}
          <button className={buttonClass} onClick={() => { setError(''); void api.printInvoice(id).then(setPrintHtml).catch(e => setError(message(e))); }}>Prepare print / PDF</button>
        </>}
        {resource.fields && ((resource.adminWrite && viewer.role === 'ADMIN') || (staff && resource.key === 'quotation-templates') || (staff && resource.key === 'subscriptions' && ['DRAFT', 'QUOTATION'].includes(status))) && <button className={buttonClass} onClick={() => setEditing(v => !v)}>Edit</button>}
      </div>
      {editing && resource.fields && <Editor title={`Edit ${resource.title}`} fields={resource.key === 'subscriptions' ? resource.fields.filter(f => ['startDate', 'expiryDate', 'paymentTermsDays', 'lines'].includes(f.key)) : resource.fields} initial={item} cancel={() => setEditing(false)} save={async body => {
        if (resource.key === 'quotation-templates') await api.request(`/${resource.key}/${id}`, { method: 'PUT', body: JSON.stringify(body) });
        else await api.patch(`/${resource.key}/${id}`, body);
        await load(); changed(); setEditing(false);
      }} />}
      {resource.key === 'products' && viewer.role === 'ADMIN' && <>
        <div className="flex flex-wrap gap-2">{((item.variants as RecordData[]) ?? []).map(variant => <button key={variant.id} className={buttonClass} onClick={() => setEditingVariant(variant)}>Edit variant {display(variant.name)}</button>)}</div>
        {editingVariant && <Editor key={editingVariant.id} title={`Edit variant ${display(editingVariant.name)}`} fields={variantFields} initial={editingVariant} cancel={() => setEditingVariant(undefined)} save={async body => {
          await api.patch(`/variants/${encodeURIComponent(editingVariant.id)}`, body);
          await load(); changed(); setEditingVariant(undefined); setInfo('Variant saved on the server.');
        }} />}
        <Editor title="Add variant" fields={variantFields} save={async body => { await api.post(`/products/${id}/variants`, body); await load(); changed(); }} />
      </>}
      {resource.key === 'subscriptions' && <>
        <section className="space-y-2"><h3 className="font-semibold">Assigned discounts</h3>
          {Array.isArray(item.discounts) && item.discounts.length ? (item.discounts as { discountId: string; discount?: { code?: string } }[]).map(link => <div key={link.discountId} className="flex flex-wrap items-center gap-3 rounded border border-zinc-800 p-3">
            <span>{link.discount?.code ?? link.discountId}</span>
            {staff && <button className={buttonClass} disabled={busy} onClick={async () => {
              setBusy(true); setError(''); setInfo('');
              try { await api.removeSubscriptionDiscount(id, link.discountId); await load(); changed(); setInfo('Discount removed on the server.'); }
              catch (e) { setError(message(e)); } finally { setBusy(false); }
            }}>Remove discount {link.discount?.code ?? link.discountId}</button>}
          </div>) : <p className="text-zinc-400">No discounts assigned.</p>}
        </section>
        {staff && status === 'ACTIVE' && <Editor title="Generate invoice for the next due period" fields={[{ key: 'periodStart', label: 'Period start (must match next billing date)', type: 'date', required: true, initial: String(item.nextBillingDate).slice(0, 10) }]} save={async body => { await api.post(`/subscriptions/${id}/invoices`, body); await load(); changed(); }} />}
        {plan?.allowRenew && ['ACTIVE', 'CLOSED'].includes(status) ? <Editor title="Renew subscription" fields={[{ key: 'newExpiryDate', label: 'New expiry date', type: 'date', required: true }]} save={async body => { await api.post(`/subscriptions/${id}/renew`, body); await load(); changed(); }} /> : null}
        {staff && status !== 'CLOSED' && <Editor title="Apply a discount" fields={[{ key: 'discountId', label: 'Discount', resource: 'discounts', required: true }]} save={async body => { await api.post(`/subscriptions/${id}/discounts`, body); await load(); changed(); }} />}
      </>}
      {resource.key === 'invoices' && staff && status === 'CONFIRMED' && <Editor title="Record a received payment" fields={[{ key: 'amount', label: 'Amount received (INR)', required: true }, { key: 'method', label: 'Method', choices: ['BANK_TRANSFER', 'CARD', 'CASH', 'MANUAL'], required: true }, { key: 'paymentDate', label: 'Payment date', type: 'date', required: true }, { key: 'note', label: 'Reference / notes' }]} save={async body => {
        const signature = JSON.stringify(body);
        if (paymentAttempt.current?.signature !== signature) paymentAttempt.current = { signature, key: crypto.randomUUID() };
        await api.post(`/invoices/${id}/payments`, body, { 'Idempotency-Key': paymentAttempt.current.key });
        await load(); changed();
      }} />}
      {printHtml && <div className="space-y-3"><button className={buttonClass} onClick={() => frame.current?.contentWindow?.print()}>Print / Save as PDF</button><iframe ref={frame} title="Printable invoice" sandbox="allow-same-origin allow-modals" srcDoc={printHtml} className="h-[650px] w-full bg-white" /><button className={buttonClass} onClick={() => setPrintHtml('')}>Close preview</button></div>}
    </>}
  </section>;
}

function ResourcePage({ resource, viewer }: { resource: Resource; viewer: Viewer }) {
  const [result, setResult] = useState<Page<RecordData>>();
  const [page, setPage] = useState(1), [search, setSearch] = useState(''), [status, setStatus] = useState('');
  const [error, setError] = useState(''), [loading, setLoading] = useState(false), [revision, setRevision] = useState(0);
  const [creating, setCreating] = useState(false), [selected, setSelected] = useState<string>();
  const [editingRecord, setEditingRecord] = useState<RecordData>();
  const [info, setInfo] = useState('');
  useEffect(() => {
    let active = true; setLoading(true); setError(''); setResult(undefined);
    const q = new URLSearchParams({ page: String(page), pageSize: '20' }); if (search) q.set('search', search); if (status) q.set('status', status);
    api.request<Page<RecordData>>(`/${resource.key}?${q}`).then(r => { if (active) setResult(r); }).catch(e => { if (active) setError(message(e)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [resource.key, page, search, status, revision]);
  const canWrite = resource.fields && viewer.role !== 'CUSTOMER' && (!resource.adminWrite || viewer.role === 'ADMIN');
  const hasDetail = ['products', 'plans', 'quotation-templates', 'subscriptions', 'invoices'].includes(resource.key);
  const canEditRow = viewer.role === 'ADMIN' && ['tax-rules', 'discounts'].includes(resource.key);
  return <section className="space-y-5"><div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-bold">{resource.title}</h1><div className="flex gap-3"><button className={buttonClass} onClick={() => setRevision(v => v + 1)} disabled={loading}>Refresh</button>{canWrite && <button className={buttonClass} onClick={() => setCreating(v => !v)}>Create</button>}</div></div>
    <div className="flex flex-wrap gap-3">{resource.search && <label>Search<input className={inputClass} value={search} onChange={e => { setPage(1); setSearch(e.target.value); }} maxLength={120} /></label>}{resource.statuses && <label>Status<select className={inputClass} value={status} onChange={e => { setPage(1); setStatus(e.target.value); }}><option value="">All statuses</option>{resource.statuses.map(s => <option key={s}>{s}</option>)}</select></label>}</div>
    {creating && resource.fields && <Editor title={`Create ${resource.title}`} fields={resource.fields} cancel={() => setCreating(false)} save={async body => { await api.post(`/${resource.key}`, body); setCreating(false); setPage(1); setRevision(v => v + 1); }} />}
    {editingRecord && canEditRow && resource.fields && <Editor key={editingRecord.id} title={`Edit ${resource.title}`} fields={resource.fields} initial={editingRecord} cancel={() => setEditingRecord(undefined)} save={async body => {
      await api.patch(`/${resource.key}/${encodeURIComponent(editingRecord.id)}`, body);
      setEditingRecord(undefined); setRevision(v => v + 1); setInfo('Changes saved on the server.');
    }} />}
    {info && <Notice text={info} />}
    {error && <Notice error text={error} />}{loading && <p role="status">Loading records…</p>}
    {result && <><div className="overflow-x-auto rounded border border-zinc-800"><table className="w-full text-left text-sm"><caption className="p-3 text-left text-zinc-400">{result.pagination.total} records · Page {page} of {Math.max(1, result.pagination.pages)}{resource.key === 'invoices' ? ' · Amounts in INR' : ''}</caption><thead className="bg-zinc-900"><tr>{resource.columns.map(c => <th className="p-3" key={c}>{label(c)}</th>)}{hasDetail && <th className="p-3">Details</th>}{canEditRow && <th className="p-3">Actions</th>}</tr></thead><tbody>{result.data.map(row => <tr key={row.id} className="border-t border-zinc-800">{resource.columns.map(c => <td className="p-3" key={c}>{display(row[c])}</td>)}{hasDetail && <td className="p-3"><button className="text-cyan-300 underline" onClick={() => setSelected(row.id)}>Open {display(row.number ?? row.name)}</button></td>}{canEditRow && <td className="p-3"><button className="text-cyan-300 underline" onClick={() => { setEditingRecord(row); setInfo(''); }}>Edit {display(row.name ?? row.code)}</button></td>}</tr>)}</tbody></table>{result.data.length === 0 && <p className="p-5 text-zinc-400">No records match your filters.</p>}</div>
      <div className="flex gap-4"><button className={buttonClass} disabled={page <= 1 || loading} onClick={() => setPage(p => p - 1)}>Previous</button><button className={buttonClass} disabled={page >= result.pagination.pages || loading} onClick={() => setPage(p => p + 1)}>Next</button></div></>}
    {selected && <Detail key={`${resource.key}/${selected}`} resource={resource} id={selected} viewer={viewer} close={() => setSelected(undefined)} changed={() => setRevision(v => v + 1)} />}
  </section>;
}

export default function ConnectedApp() {
  const [viewer, setViewer] = useState<Viewer | null>(null);
  const [tab, setTab] = useState('subscriptions');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  if (!viewer) return <Auth onViewer={user => { setViewer(user); setTab(user.role === 'CUSTOMER' ? 'subscriptions' : 'finance'); }} />;
  const visible = visibleResources(viewer.role), resource = visible.find(r => r.key === tab);
  return <div className="min-h-screen bg-zinc-950 text-zinc-100">
    <a className="skip-link" href="#connected-content">Skip to workspace</a>
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 px-6 py-4"><div><strong className="tracking-wide">BRIGHTLOOP</strong><p className="text-sm text-zinc-400">{viewer.name} · {viewer.role}</p></div><button className={buttonClass} disabled={busy} onClick={async () => { setBusy(true); setError(''); try { await api.logout(); } catch (e) { setError(message(e)); } finally { setViewer(null); setBusy(false); } }}>Sign out</button></header>
    <div className="flex flex-col md:flex-row"><nav aria-label="Workspace" className="flex flex-wrap gap-2 border-b border-zinc-800 p-4 md:w-56 md:shrink-0 md:flex-col md:border-b-0 md:border-r">
      {[...(viewer.role !== 'CUSTOMER' ? [{ key: 'finance', title: 'Finance overview' }] : []), ...visible, ...(viewer.role === 'ADMIN' ? [{ key: 'staff', title: 'Invite staff' }] : [])].map(r => <button key={r.key} aria-current={tab === r.key ? 'page' : undefined} className={`rounded px-3 py-2 text-left ${tab === r.key ? 'bg-cyan-950 text-cyan-200' : 'text-zinc-400 hover:bg-zinc-900'}`} onClick={() => setTab(r.key)}>{r.title}</button>)}
    </nav><main id="connected-content" tabIndex={-1} className="min-w-0 flex-1 p-4 sm:p-8">{error && <Notice error text={error} />}
      {tab === 'finance' && viewer.role !== 'CUSTOMER' && <Finance />}
      {resource && <ResourcePage key={tab} resource={resource} viewer={viewer} />}
      {tab === 'staff' && viewer.role === 'ADMIN' && <Editor title="Invite staff" fields={[{ key: 'email', label: 'Email', required: true }, { key: 'name', label: 'Name', required: true }]} save={async body => { await api.post('/staff', body); }} />}
    </main></div>
  </div>;
}
