import { describe, expect, it } from 'vitest';
import { resources, serializeFields, visibleResources } from './resources';

describe('Connected forms', () => {
  it('limits customer navigation to customer-scoped resources', () => {
    expect(visibleResources('CUSTOMER').map(r => r.key)).toEqual(['plans', 'subscriptions', 'invoices']);
  });
  it('keeps monetary values as strings and sends booleans without UI-only fields', () => {
    const data = new FormData(); data.set('name', ' Product '); data.set('type', 'GOODS'); data.set('salesPrice', '0.0100'); data.set('costPrice', '0'); data.set('active', 'on'); data.set('role', 'ADMIN');
    expect(serializeFields(resources.find(r => r.key === 'products')!.fields!, data)).toEqual({ name: 'Product', type: 'GOODS', salesPrice: '0.0100', costPrice: '0', active: true });
  });
  it('preserves zero payment terms while omitting optional empty dates', () => {
    const data = new FormData(); data.set('paymentTermsDays', '0'); data.set('validTo', '');
    expect(serializeFields([{ key: 'paymentTermsDays', label: '', type: 'number' }, { key: 'validTo', label: '', type: 'date' }], data)).toEqual({ paymentTermsDays: 0 });
  });
});
