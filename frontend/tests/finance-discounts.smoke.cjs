// Requires a connected Vite server and separately available Playwright (see the report).
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const { readFile } = require('node:fs/promises');

async function run() {
  const base = process.env.BRIGHTLOOP_TEST_URL || 'http://127.0.0.1:5174';
  const browser = await chromium.launch({ ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}), headless: true, args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage({ acceptDownloads: true }); page.setDefaultTimeout(10000);
    const errors = [], summaryQueries = [], csvQueries = [], removals = [];
    page.on('pageerror', e => errors.push(e.message));
    let role = 'ADMIN', failCsv = true, failRemoval = true;
    const customer = { id: '00000000-0000-4000-8000-000000000001', name: 'Selected customer' };
    const link = { discountId: 'discount-one', discount: { id: 'discount-one', code: 'WELCOME' } };
    const subscription = { id: 'sub-one', number: 'SUB-001', status: 'ACTIVE', nextBillingDate: '2026-10-31', plan: { allowPause: false, allowRenew: false }, discounts: [link], lines: [] };
    await page.route('**/api/**', async route => {
      const req = route.request(), url = new URL(req.url()), path = url.pathname.replace('/api', '');
      const headers = { 'Access-Control-Allow-Origin': new URL(base).origin, 'Access-Control-Allow-Headers': 'Authorization,Content-Type', 'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS' };
      const json = (body, status = 200) => route.fulfill({ status, headers, contentType: 'application/json', body: JSON.stringify(body) });
      if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
      if (path === '/auth/login') { role = req.postDataJSON().email.startsWith('customer') ? 'CUSTOMER' : 'ADMIN'; if (role === 'CUSTOMER') subscription.discounts = [link]; return json({ data: { session: { access_token: 'access', refresh_token: 'refresh' } } }); }
      if (path === '/auth/logout') return route.fulfill({ status: 204, headers });
      if (path === '/me') return json({ data: { id: customer.id, name: 'Test viewer', email: 'test@example.com', role } });
      if (path === '/reports/summary') { summaryQueries.push(url.search); return json({ data: { grossMrr: '100.00', currency: 'INR', scope: { note: 'Server metrics' } } }); }
      if (path === '/reports/invoices.csv') {
        assert.equal(req.headers().authorization, 'Bearer access'); csvQueries.push(url.search);
        if (failCsv) { failCsv = false; return json({ error: { code: 'RETRY', message: 'CSV temporarily unavailable' } }, 503); }
        return route.fulfill({ status: 200, headers, contentType: 'text/csv', body: 'number,total\r\nINV-001,100.00\r\n' });
      }
      if (path === '/subscriptions/sub-one/discounts/discount-one') {
        assert.equal(req.method(), 'DELETE'); assert.equal(req.headers().authorization, 'Bearer access'); removals.push(path);
        if (failRemoval) { failRemoval = false; return json({ error: { code: 'RETRY', message: 'Discount removal temporarily unavailable' } }, 503); }
        subscription.discounts = []; return route.fulfill({ status: 204, headers });
      }
      if (path === '/subscriptions/sub-one') return json({ data: subscription });
      const rows = { '/customers': [customer], '/subscriptions': [subscription], '/discounts': [{ id: 'discount-one', code: 'WELCOME' }] }[path];
      assert.ok(rows, `Unexpected request ${req.method()} ${path}`);
      return json({ data: rows, pagination: { page: 1, pageSize: 20, total: rows.length, pages: 1 } });
    });
    async function login(email) {
      await page.getByLabel('Email', { exact: true }).fill(email); await page.getByLabel('Password', { exact: true }).fill('Password!9');
      await page.getByRole('button', { name: 'Continue', exact: true }).click();
    }
    await page.goto(base); await login('admin@example.com');
    await page.getByRole('heading', { name: 'Finance overview', exact: true }).waitFor();
    await page.getByRole('combobox', { name: 'Select customers', exact: true }).selectOption(customer.id);
    await page.getByLabel('From', { exact: true }).fill('2026-10-01'); await page.getByLabel('To', { exact: true }).fill('2026-10-31');
    await page.getByRole('button', { name: 'Update', exact: true }).click();
    await page.getByRole('button', { name: 'Download invoice CSV', exact: true }).waitFor();
    await page.getByLabel('From', { exact: true }).fill('2026-10-02'); // Not applied; export must retain the applied filter.
    await page.getByRole('button', { name: 'Download invoice CSV', exact: true }).click();
    await page.getByRole('alert').filter({ hasText: 'CSV temporarily unavailable' }).waitFor();
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download invoice CSV', exact: true }).click();
    const download = await downloadPromise;
    assert.equal(download.suggestedFilename(), 'brightloop-invoices.csv');
    const downloadPath = await download.path(); assert.equal(await readFile(downloadPath, 'utf8'), 'number,total\r\nINV-001,100.00\r\n');
    const applied = new URLSearchParams(csvQueries[1]);
    assert.equal(applied.get('customerId'), customer.id); assert.equal(applied.get('from'), '2026-10-01'); assert.equal(applied.get('to'), '2026-10-31');
    assert.equal(csvQueries[0], csvQueries[1]); assert.equal(summaryQueries.at(-1), csvQueries[1]);
    await page.getByRole('combobox', { name: 'Select customers', exact: true }).selectOption('');
    await page.getByLabel('From', { exact: true }).fill(''); await page.getByLabel('To', { exact: true }).fill('');
    await page.getByRole('button', { name: 'Update', exact: true }).click();
    await page.getByRole('button', { name: 'Download invoice CSV', exact: true }).click();
    assert.equal(summaryQueries.at(-1), '');

    await page.getByRole('button', { name: 'Subscriptions', exact: true }).click();
    await page.getByRole('button', { name: 'Open SUB-001', exact: true }).click();
    await page.getByRole('button', { name: 'Remove discount WELCOME', exact: true }).click();
    await page.getByRole('alert').filter({ hasText: 'Discount removal temporarily unavailable' }).waitFor();
    assert.equal(subscription.discounts.length, 1);
    await page.getByRole('button', { name: 'Remove discount WELCOME', exact: true }).click();
    await page.getByText('No discounts assigned.', { exact: true }).waitFor(); assert.equal(removals.length, 2);
    await page.getByRole('button', { name: 'Sign out', exact: true }).click(); await login('customer@example.com');
    await page.getByRole('button', { name: 'Open SUB-001', exact: true }).click();
    await page.getByRole('heading', { name: 'Assigned discounts', exact: true }).waitFor();
    assert.equal(await page.getByRole('button', { name: /^Remove discount / }).count(), 0);
    assert.equal(await page.getByRole('button', { name: 'Finance overview', exact: true }).count(), 0);
    assert.deepEqual(errors, []);
    console.log('PASS: finance customer/date filters, authenticated CSV error/retry/download with applied filters, filter reset, discount removal error/retry/server refresh, customer read-only controls. API mocked.');
  } finally { await browser.close(); }
}
run().catch(error => { console.error(error); process.exitCode = 1; });
