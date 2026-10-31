import { Decimal } from 'decimal.js';
import { D, money, moneyString } from '../lib/utils.js';
import { assert } from '../lib/errors.js';

export interface PriceLine {
  productId: string | null; description: string; quantity: number; unitPrice: string;
  taxName: string | null; taxRate: string;
}
export interface PriceRule {
  id: string; code: string; type: 'FIXED' | 'PERCENTAGE'; value: string;
  minSpend: string; minQuantity: number; productId: string | null;
}
export function calculateInvoice(input: PriceLine[], rules: PriceRule[]) {
  const lines = input.map(line => ({ ...line, subtotal: money(D(line.unitPrice).mul(line.quantity)), discount: D(0) }));
  const redemptions: { discountId: string; amount: string }[] = [];
  // Stable, documented stacking order: code, then ID. Discounts apply before tax.
  for (const rule of [...rules].sort((a, b) => a.code.localeCompare(b.code) || a.id.localeCompare(b.id))) {
    const targets = lines.filter(line => !rule.productId || line.productId === rule.productId);
    const original = targets.reduce((sum, line) => sum.add(line.subtotal), D(0));
    const quantity = targets.reduce((sum, line) => sum + line.quantity, 0);
    if (original.lt(rule.minSpend) || quantity < rule.minQuantity) continue;
    let remainingBase = targets.reduce((sum, line) => sum.add(line.subtotal.sub(line.discount)), D(0));
    let desired = rule.type === 'PERCENTAGE' ? money(remainingBase.mul(rule.value).div(100)) : money(D(rule.value));
    desired = Decimal.min(desired, remainingBase);
    const totalDiscount = desired;
    for (let index = 0; index < targets.length; index++) {
      const line = targets[index]!;
      const base = line.subtotal.sub(line.discount);
      if (remainingBase.isZero()) break;
      const share = Decimal.min(base, index === targets.length - 1 ? desired : money(desired.mul(base).div(remainingBase)));
      line.discount = line.discount.add(share);
      desired = desired.sub(share);
      remainingBase = remainingBase.sub(base);
    }
    if (totalDiscount.gt(0)) redemptions.push({ discountId: rule.id, amount: moneyString(totalDiscount) });
  }
  const result = lines.map(line => {
    const taxable = line.subtotal.sub(line.discount);
    const tax = money(taxable.mul(line.taxRate).div(100));
    return { ...line, subtotal: moneyString(line.subtotal), discount: moneyString(line.discount),
      tax: moneyString(tax), total: moneyString(taxable.add(tax)) };
  });
  const sum = (field: 'subtotal' | 'discount' | 'tax' | 'total') => moneyString(result.reduce((acc, line) => acc.add(line[field]), D(0)));
  assert(D(sum('subtotal')).lte('999999999999.99') && D(sum('total')).lte('999999999999.99'), 400, 'AMOUNT_TOO_LARGE', 'Invoice exceeds the supported monetary range');
  return { lines: result, redemptions, subtotal: sum('subtotal'), discountTotal: sum('discount'), taxTotal: sum('tax'), total: sum('total') };
}
