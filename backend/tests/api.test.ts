import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import type { Server } from 'node:http';
import { createApp } from '../src/app.js';
import type { Dependencies } from '../src/types.js';

// HTTP integration with injected auth/database boundaries; no live Supabase or database claims.
const users = {
  admin: { id: '00000000-0000-4000-8000-000000000001', email: 'admin@example.com', name: 'Admin', role: 'ADMIN', active: true },
  staff: { id: '00000000-0000-4000-8000-000000000002', email: 'staff@example.com', name: 'Staff', role: 'STAFF', active: true },
  customer: { id: '00000000-0000-4000-8000-000000000003', email: 'customer@example.com', name: 'Customer', role: 'CUSTOMER', active: true },
};
let invoiceQuery: { where: { customerId: string } };
const dependencies = {
  config: { FRONTEND_URL: 'http://localhost:5173', TRUST_PROXY_HOPS: 0 },
  now: () => new Date('2026-10-31T00:00:00Z'),
  db: {
    user: { findUnique: async ({ where }: { where: { id: string } }) => Object.values(users).find(u => u.id === where.id) },
    invoice: { findMany: async (args: typeof invoiceQuery) => { invoiceQuery = args; return []; }, count: async () => 0 },
  },
  auth: { verify: async (token: keyof typeof users) => { if (!users[token]) throw new Error('Unexpected test identity'); return users[token]; } },
  core: {}, mailer: {},
} as unknown as Dependencies;
let server: Server, base: string;
before(async () => {
  await new Promise<void>(resolve => { server = createApp(dependencies).listen(0, '127.0.0.1', resolve); });
  const address = server.address(); assert(address && typeof address !== 'string'); base = `http://127.0.0.1:${address.port}`;
});
after(async () => { await new Promise<void>((resolve, reject) => server.close(e => e ? reject(e) : resolve())); });
function request(path: string, role?: keyof typeof users, body?: unknown, headers?: Record<string, string>) {
  return fetch(`${base}${path}`, { method: body ? 'POST' : 'GET', headers: { ...(role ? { Authorization: `Bearer ${role}` } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}), ...headers }, ...(body ? { body: JSON.stringify(body) } : {}) });
}
test('health is available independently of auth', async () => { const r = await request('/health'); assert.equal(r.status, 200); assert.equal((await r.json()).data.status, 'ok'); });
test('protected API rejects an unauthenticated request', async () => { const r = await request('/products'); assert.equal(r.status, 404); const protectedRoute = await request('/api/products'); assert.equal(protectedRoute.status, 401); });
test('demo role headers do not grant access', async () => { assert.equal((await request('/api/products', undefined, undefined, { 'x-demo-role': 'Admin' })).status, 401); });
test('current role comes from the database viewer', async () => { const r = await request('/api/me', 'customer'); assert.equal(r.status, 200); assert.equal((await r.json()).data.role, 'CUSTOMER'); });
test('customer cannot read the staff catalog or finance metrics', async () => { assert.equal((await request('/api/products', 'customer')).status, 403); assert.equal((await request('/api/reports/summary', 'customer')).status, 403); });
test('staff cannot create products', async () => { assert.equal((await request('/api/products', 'staff', { name: 'No' })).status, 403); });
test('customer invoice queries override caller-supplied customer IDs', async () => {
  const r = await request(`/api/invoices?customerId=${users.admin.id}&page=1&pageSize=20`, 'customer');
  assert.equal(r.status, 200); assert.equal(invoiceQuery.where.customerId, users.customer.id); assert.equal((await r.json()).pagination.pageSize, 20);
});
test('strict product validation rejects UI and forged role fields', async () => {
  const r = await request('/api/products', 'admin', { name: 'Test', type: 'SERVICE', salesPrice: '10.00', costPrice: '0', role: 'ADMIN' }); assert.equal(r.status, 400);
});
test('receipt endpoint requires an idempotency key before recording a payment', async () => {
  const r = await request(`/api/invoices/${users.admin.id}/payments`, 'staff', { amount: '1.00', method: 'CARD' }); assert.equal(r.status, 400);
});
