import { describe, expect, it, vi } from 'vitest';
import { ApiError, LiveApi } from './liveApi';

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
describe('Connected API contract', () => {
  it('signs in using credentials and loads the authoritative role with the returned token', async () => {
    const transport = vi.fn<typeof fetch>().mockResolvedValueOnce(json({ data: { session: { access_token: 'access', refresh_token: 'refresh' } } })).mockResolvedValueOnce(json({ data: { id: 'one', role: 'CUSTOMER' } }));
    const api = new LiveApi('/api', transport);
    expect((await api.login('user@example.com', 'secret')).role).toBe('CUSTOMER');
    expect(JSON.parse(String(transport.mock.calls[0][1]?.body))).toEqual({ email: 'user@example.com', password: 'secret' });
    expect(new Headers(transport.mock.calls[1][1]?.headers).get('Authorization')).toBe('Bearer access');
    expect(transport.mock.calls[1][0]).toBe('/api/me');
  });
  it('preserves pagination and exact decimal strings from the backend', async () => {
    const page = { data: [{ id: 'one', total: '9999999999.99' }], pagination: { page: 3, pages: 5, total: 100, pageSize: 20 } };
    const api = new LiveApi('/api', vi.fn<typeof fetch>().mockResolvedValue(json(page)));
    expect(await api.request('/invoices?page=3&pageSize=20')).toEqual(page);
  });
  it('does not substitute mock records when authorization or transport fails', async () => {
    const api = new LiveApi('/api', vi.fn<typeof fetch>().mockResolvedValue(json({ error: { code: 'FORBIDDEN', message: 'Staff required', requestId: 'request-one' } }, 403)));
    await expect(api.get('/products')).rejects.toMatchObject({ status: 403, code: 'FORBIDDEN', message: 'Staff required', requestId: 'request-one' });
    const offline = new LiveApi('/api', vi.fn<typeof fetch>().mockRejectedValue(new Error('offline')));
    await expect(offline.get('/invoices')).rejects.toMatchObject({ status: 0, code: 'NETWORK_ERROR' });
  });
  it('refreshes expired access once and retries with the new access token', async () => {
    const transport = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(json({ error: { message: 'Expired' } }, 401))
      .mockResolvedValueOnce(json({ data: { session: { access_token: 'new', refresh_token: 'next' } } }))
      .mockResolvedValueOnce(json({ data: { id: 'one' } }));
    const api = new LiveApi('/api', transport);
    api.setSession({ access_token: 'old', refresh_token: 'refresh' });
    expect(await api.get('/me')).toEqual({ id: 'one' });
    expect(transport.mock.calls[1][0]).toBe('/api/auth/refresh');
    expect(new Headers(transport.mock.calls[2][1]?.headers).get('Authorization')).toBe('Bearer new');
  });
  it('ends the session if refresh fails rather than retrying indefinitely', async () => {
    const transport = vi.fn<typeof fetch>().mockImplementation(async () => json({ error: { code: 'UNAUTHENTICATED', message: 'Sign in again' } }, 401));
    const api = new LiveApi('/api', transport); api.setSession({ access_token: 'old', refresh_token: 'refresh' });
    await expect(api.get('/me')).rejects.toBeInstanceOf(ApiError);
    expect(api.hasSession()).toBe(false); expect(transport).toHaveBeenCalledTimes(2);
  });
  it('keeps the receipt idempotency header and decimal body intact', async () => {
    const transport = vi.fn<typeof fetch>().mockResolvedValue(json({ data: { replayed: false } }));
    const api = new LiveApi('/api', transport); api.setSession({ access_token: 'access', refresh_token: 'refresh' });
    await api.post('/invoices/one/payments', { amount: '0.01', method: 'CARD' }, { 'Idempotency-Key': 'receipt-one' });
    expect(new Headers(transport.mock.calls[0][1]?.headers).get('Idempotency-Key')).toBe('receipt-one');
    expect(JSON.parse(String(transport.mock.calls[0][1]?.body)).amount).toBe('0.01');
  });
  it('clears the local session even when server logout is unavailable', async () => {
    const api = new LiveApi('/api', vi.fn<typeof fetch>().mockRejectedValue(new Error('offline')));
    api.setSession({ access_token: 'old', refresh_token: 'refresh' });
    await expect(api.logout()).rejects.toThrow(); expect(api.hasSession()).toBe(false);
  });
  it('removes only the selected assigned discount with bearer auth and accepts a 204', async () => {
    const transport = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 204 }));
    const api = new LiveApi('/api', transport); api.setSession({ access_token: 'access', refresh_token: 'refresh' });
    await api.removeSubscriptionDiscount('sub/one', 'discount/one');
    expect(transport.mock.calls[0][0]).toBe('/api/subscriptions/sub%2Fone/discounts/discount%2Fone');
    expect(transport.mock.calls[0][1]?.method).toBe('DELETE');
    expect(new Headers(transport.mock.calls[0][1]?.headers).get('Authorization')).toBe('Bearer access');
  });
  it('refreshes CSV access and preserves the binary response and selected filters', async () => {
    const transport = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(json({ error: { message: 'Expired' } }, 401))
      .mockResolvedValueOnce(json({ data: { session: { access_token: 'new', refresh_token: 'next' } } }))
      .mockResolvedValueOnce(new Response('number,total\r\nINV-1,100.00\r\n', { headers: { 'Content-Type': 'text/csv' } }));
    const api = new LiveApi('/api', transport); api.setSession({ access_token: 'old', refresh_token: 'refresh' });
    const blob = await api.invoiceCsv('?from=2026-10-01&customerId=customer-one');
    expect(await blob.text()).toBe('number,total\r\nINV-1,100.00\r\n');
    expect(blob.type).toBe('text/csv');
    expect(transport.mock.calls[2][0]).toBe('/api/reports/invoices.csv?from=2026-10-01&customerId=customer-one');
    expect(new Headers(transport.mock.calls[2][1]?.headers).get('Authorization')).toBe('Bearer new');
  });
  it('surfaces rejected CSV requests instead of downloading an error document', async () => {
    const api = new LiveApi('/api', vi.fn<typeof fetch>().mockResolvedValue(json({ error: { message: 'Staff required', code: 'FORBIDDEN' } }, 403)));
    await expect(api.invoiceCsv()).rejects.toMatchObject({ code: 'FORBIDDEN', status: 403 });
  });
});
