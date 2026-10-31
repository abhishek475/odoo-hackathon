// Optional browser regression: install Playwright separately and expose it through NODE_PATH.
// Run a connected Vite server first; BRIGHTLOOP_TEST_URL defaults to http://127.0.0.1:5174.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');

async function run() {
  const base = process.env.BRIGHTLOOP_TEST_URL || 'http://127.0.0.1:5174';
  const browser = await chromium.launch({
    ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}),
    headless: true,
    args: ['--no-sandbox'],
  });
  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(10000);
    const errors = [], patches = [];
    page.on('pageerror', error => errors.push(error.message));
    let role = 'ADMIN', failTaxSave = true;
    const tax = { id: 'tax-one', name: 'VAT', rate: '10.000000', active: true };
    const discount = { id: 'discount-one', code: 'WELCOME', type: 'FIXED', value: '5.0000', validFrom: '2026-01-01T00:00:00Z', validTo: '2026-12-31T00:00:00Z', minSpend: '0.00', maxUses: 10, usageCount: 0, active: true };
    const variant = { id: 'variant-one', name: 'Standard', priceModifier: '5.0000', active: true };
    const product = { id: 'product-one', name: 'Service', type: 'SERVICE', salesPrice: '100.0000', costPrice: '20.0000', active: true, variants: [variant] };
    await page.route('**/api/**', async route => {
      const req = route.request(), path = new URL(req.url()).pathname.replace('/api', '');
      const headers = {
        'Access-Control-Allow-Origin': new URL(base).origin,
        'Access-Control-Allow-Headers': 'Authorization,Content-Type',
        'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS',
      };
      const json = (body, status = 200) => route.fulfill({ status, headers, contentType: 'application/json', body: JSON.stringify(body) });
      if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
      if (path === '/auth/login') {
        role = req.postDataJSON().email.startsWith('staff') ? 'STAFF' : 'ADMIN';
        return json({ data: { session: { access_token: 'test-access', refresh_token: 'test-refresh' } } });
      }
      if (path === '/auth/logout') return route.fulfill({ status: 204, headers });
      if (path === '/me') return json({ data: { id: 'viewer', name: 'Test user', email: 'test@example.com', role } });
      if (path === '/reports/summary') return json({ data: { scope: { note: 'Mocked server metrics' }, currency: 'INR' } });
      if (req.method() === 'PATCH') {
        const body = req.postDataJSON(); patches.push({ path, body });
        assert.equal(role, 'ADMIN');
        if (path === '/tax-rules/tax-one' && failTaxSave) {
          failTaxSave = false;
          return json({ error: { code: 'RETRY', message: 'Temporary tax save failure' } }, 503);
        }
        const target = path === '/tax-rules/tax-one' ? tax : path === '/discounts/discount-one' ? discount : path === '/variants/variant-one' ? variant : null;
        assert.ok(target, `Unexpected mutation: ${path}`);
        Object.assign(target, body);
        return json({ data: target });
      }
      if (path === '/products/product-one') return json({ data: product });
      const rows = { '/tax-rules': [tax], '/discounts': [discount], '/products': [product], '/customers': [] }[path];
      // The selected API has no GET tax-rules/:id or discounts/:id; edit the listed record.
      assert.ok(rows, `Unexpected request: ${req.method()} ${path}`);
      return json({ data: rows, pagination: { page: 1, pageSize: 20, total: rows.length, pages: 1 } });
    });
    async function login(email) {
      await page.getByLabel('Email', { exact: true }).fill(email);
      await page.getByLabel('Password', { exact: true }).fill('Password!9');
      await page.getByRole('button', { name: 'Continue', exact: true }).click();
      await page.getByRole('heading', { name: 'Finance overview', exact: true }).waitFor();
    }
    await page.goto(base);
    await login('admin@example.com');

    await page.getByRole('button', { name: 'Tax rules', exact: true }).click();
    await page.getByRole('button', { name: 'Edit VAT', exact: true }).click();
    const taxForm = page.locator('form').filter({ has: page.getByRole('heading', { name: 'Edit Tax rules', exact: true }) });
    await taxForm.getByLabel('Rate (%)', { exact: true }).fill('12.500000');
    await taxForm.getByLabel('Active', { exact: true }).uncheck();
    await taxForm.getByRole('button', { name: 'Save', exact: true }).click();
    await page.getByRole('alert').filter({ hasText: 'Temporary tax save failure' }).waitFor();
    assert.equal(tax.rate, '10.000000');
    await taxForm.getByRole('button', { name: 'Save', exact: true }).click();
    await page.getByRole('cell', { name: '12.500000', exact: true }).waitFor();
    assert.equal(tax.active, false);

    await page.getByRole('button', { name: 'Discounts', exact: true }).click();
    await page.getByRole('button', { name: 'Edit WELCOME', exact: true }).click();
    const discountForm = page.locator('form').filter({ has: page.getByRole('heading', { name: 'Edit Discounts', exact: true }) });
    await discountForm.getByLabel('Value', { exact: true }).fill('0.0000');
    await discountForm.getByLabel('Valid until', { exact: true }).fill('');
    await discountForm.getByLabel('Maximum uses', { exact: true }).fill('');
    await discountForm.getByLabel('Active', { exact: true }).uncheck();
    await discountForm.getByRole('button', { name: 'Save', exact: true }).click();
    await page.getByRole('cell', { name: '0.0000', exact: true }).waitFor();
    assert.equal(discount.validTo, null); assert.equal(discount.maxUses, null); assert.equal(discount.active, false);
    const discountPatch = patches.find(p => p.path === '/discounts/discount-one').body;
    assert.equal(discountPatch.value, '0.0000'); assert.equal(discountPatch.id, undefined); assert.equal(discountPatch.usageCount, undefined);

    await page.getByRole('button', { name: 'Products', exact: true }).click();
    await page.getByRole('button', { name: 'Open Service', exact: true }).click();
    await page.getByRole('button', { name: 'Edit variant Standard', exact: true }).click();
    const variantForm = page.locator('form').filter({ has: page.getByRole('heading', { name: 'Edit variant Standard', exact: true }) });
    await variantForm.getByLabel('Variant name', { exact: true }).fill('Archived variant');
    await variantForm.getByLabel('Price modifier (INR)', { exact: true }).fill('-2.5000');
    await variantForm.getByLabel('Active', { exact: true }).uncheck();
    await variantForm.getByRole('button', { name: 'Save', exact: true }).click();
    await page.getByRole('button', { name: 'Edit variant Archived variant', exact: true }).waitFor();
    assert.equal(variant.priceModifier, '-2.5000'); assert.equal(variant.active, false);

    await page.getByRole('button', { name: 'Sign out', exact: true }).click();
    await login('staff@example.com');
    for (const title of ['Tax rules', 'Discounts']) {
      await page.getByRole('button', { name: title, exact: true }).click();
      await page.getByRole('table').waitFor();
      assert.equal(await page.getByRole('button', { name: /^Edit / }).count(), 0);
      assert.equal(await page.getByRole('button', { name: 'Create', exact: true }).count(), 0);
    }
    await page.getByRole('button', { name: 'Products', exact: true }).click();
    await page.getByRole('button', { name: 'Open Service', exact: true }).click();
    await page.getByRole('heading', { name: 'Variants', exact: true }).waitFor();
    assert.equal(await page.getByRole('button', { name: /^Edit variant / }).count(), 0);
    assert.deepEqual(errors, []);
    console.log('PASS: tax edit/archive and failure retry; discount decimal/null/archival fields; negative variant modifier/edit/archive; staff has no mutation controls. API mocked; no live DB claims.');
  } finally { await browser.close(); }
}
run().catch(error => { console.error(error); process.exitCode = 1; });
