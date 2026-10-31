import type { Product } from '../../types/billing';

export interface ProductDraft {
  name: string;
  type: Product['type'];
  salesPrice: string;
  costPrice: string;
  notes: string;
  variants: { name: string; sku: string; priceModifier: string }[];
}

// Demo USD input validation only; no billing arithmetic or confirmed server schema.
export function parsePrice(value: string, signed = false): number {
  const pattern = signed ? /^-?\d+(\.\d{1,2})?$/ : /^\d+(\.\d{1,2})?$/;
  if (!pattern.test(value.trim()) || !Number.isFinite(Number(value)) || Math.abs(Number(value)) > Number.MAX_SAFE_INTEGER / 100) {
    throw new Error('Enter a valid USD amount with at most two decimal places. Product prices must be nonnegative.');
  }
  return Number(value);
}

export function productPayload(draft: ProductDraft): Omit<Product, 'id' | 'createdAt'> {
  if (!draft.name.trim()) throw new Error('Product name is required.');
  const skus = new Set<string>();
  return {
    name: draft.name.trim(), type: draft.type, notes: draft.notes.trim(), active: true,
    salesPrice: parsePrice(draft.salesPrice), costPrice: parsePrice(draft.costPrice),
    variants: draft.variants.map((variant, index) => {
      if (!variant.name.trim() || !variant.sku.trim()) throw new Error('Each variant needs a name and SKU.');
      const sku = variant.sku.trim();
      if (skus.has(sku.toLowerCase())) throw new Error('Variant SKUs must be unique within this product.');
      skus.add(sku.toLowerCase());
      return { id: `variant-${index}`, name: variant.name.trim(), sku, priceModifier: parsePrice(variant.priceModifier, true) };
    }),
  };
}

export function filterProducts(products: Product[], query: string, type: string, status: string) {
  const term = query.trim().toLowerCase();
  return products.filter(p => (type === 'all' || p.type === type) &&
    (status === 'all' || p.active === (status === 'active')) &&
    [p.name, p.notes, p.id, ...p.variants.flatMap(v => [v.name, v.sku])].some(value => value.toLowerCase().includes(term)));
}
