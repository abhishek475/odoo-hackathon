import { describe, expect, it } from 'vitest';
import { filterProducts, parsePrice, productPayload, ProductDraft } from './catalogModel';
import { apiAdapter } from '../../services/apiAdapter';

const draft = (): ProductDraft => ({ name: ' Test product ', type: 'GOODS', salesPrice: '12.34', costPrice: '0', notes: ' Note ', variants: [{ name: ' Small ', sku: ' SMALL ', priceModifier: '-1.25' }] });

describe('demo product catalog interactions', () => {
  it('validates decimal prices without calculating billing totals', () => {
    expect(parsePrice('0.01')).toBe(0.01);
    expect(parsePrice('-2.50', true)).toBe(-2.5);
    for (const value of ['', '-1', '1.234', 'NaN', 'Infinity', '1e3', '9007199254740992']) expect(() => parsePrice(value)).toThrow();
  });
  it('rejects blank names, incomplete variants and duplicate SKUs', () => {
    expect(() => productPayload({ ...draft(), name: ' ' })).toThrow('name');
    expect(() => productPayload({ ...draft(), variants: [{ name: '', sku: 'A', priceModifier: '0' }] })).toThrow('name and SKU');
    const value = draft();
    value.variants.push({ name: 'Other', sku: 'small', priceModifier: '0' });
    expect(() => productPayload(value)).toThrow('unique');
  });
  it('creates through the existing demo adapter, then finds products by variant SKU and filters', async () => {
    apiAdapter.resetToDefaults();
    const created = await apiAdapter.createProduct(productPayload(draft()));
    const products = await apiAdapter.getProducts();
    expect(created.name).toBe('Test product');
    expect(created.variants[0].priceModifier).toBe(-1.25);
    expect(filterProducts(products, ' small ', 'GOODS', 'active').map(p => p.id)).toContain(created.id);
    expect(filterProducts([created], 'SMALL', 'SERVICE', 'all')).toEqual([]);
    expect(filterProducts([created], '', 'all', 'inactive')).toEqual([]);
    expect(filterProducts([created], 'missing', 'all', 'all')).toEqual([]);
    apiAdapter.resetToDefaults();
  });
});
