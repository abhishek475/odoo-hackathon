export interface Field {
  key: string; label: string; type?: 'text' | 'date' | 'number' | 'checkbox' | 'textarea' | 'lines';
  choices?: string[]; resource?: string; required?: boolean; min?: number; max?: number; initial?: string;
}
export interface Resource {
  key: string; title: string; columns: string[]; fields?: Field[]; adminWrite?: boolean; search?: boolean; statuses?: string[];
}
const name: Field = { key: 'name', label: 'Name', required: true };
const active: Field = { key: 'active', label: 'Active', type: 'checkbox' };
const validFrom: Field = { key: 'validFrom', label: 'Valid from', type: 'date', required: true };
const validTo: Field = { key: 'validTo', label: 'Valid until', type: 'date' };
const plan: Field = { key: 'planId', label: 'Plan', resource: 'plans', required: true };
const lines: Field = { key: 'lines', label: 'Product lines', type: 'lines', required: true };
export const resources: Resource[] = [
  { key: 'products', title: 'Products', columns: ['name', 'type', 'salesPrice', 'costPrice', 'active'], adminWrite: true, search: true,
    fields: [name, { key: 'type', label: 'Type', choices: ['SERVICE', 'GOODS'], required: true }, { key: 'salesPrice', label: 'Sales price (INR)', required: true }, { key: 'costPrice', label: 'Cost price (INR)', required: true }, { key: 'notes', label: 'Notes', type: 'textarea' }, active] },
  { key: 'plans', title: 'Billing plans', columns: ['name', 'price', 'cadence', 'validFrom', 'allowPause'], adminWrite: true,
    fields: [name, { key: 'price', label: 'Recurring base price (INR)', required: true }, { key: 'cadence', label: 'Cadence', choices: ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'], required: true }, validFrom, validTo, { key: 'minQuantity', label: 'Minimum quantity', type: 'number', min: 1, max: 100000, initial: '1' }, { key: 'autoClose', label: 'Automatically close at expiry', type: 'checkbox' }, { key: 'allowPause', label: 'Allow pause', type: 'checkbox' }, { key: 'allowEarlyClose', label: 'Allow customer early close', type: 'checkbox' }, { key: 'allowRenew', label: 'Allow renewal', type: 'checkbox' }, active] },
  { key: 'tax-rules', title: 'Tax rules', columns: ['name', 'rate', 'active'], adminWrite: true,
    fields: [name, { key: 'rate', label: 'Rate (%)', required: true }, active] },
  { key: 'discounts', title: 'Discounts', columns: ['code', 'type', 'value', 'usageCount', 'active'], adminWrite: true,
    fields: [{ key: 'code', label: 'Code', required: true }, { key: 'type', label: 'Type', choices: ['FIXED', 'PERCENTAGE'], required: true }, { key: 'value', label: 'Value', required: true }, validFrom, validTo, { key: 'minSpend', label: 'Minimum spend' }, { key: 'maxUses', label: 'Maximum uses', type: 'number', min: 1 }, active] },
  { key: 'quotation-templates', title: 'Quotation templates', columns: ['name', 'planId', 'validityDays'], fields: [name, plan, { key: 'validityDays', label: 'Quote validity in days', type: 'number', min: 1, max: 365, initial: '14', required: true }, { key: 'notes', label: 'Notes', type: 'textarea' }, lines] },
  { key: 'subscriptions', title: 'Subscriptions', columns: ['number', 'status', 'customer', 'cadence', 'startDate', 'nextBillingDate', 'expiryDate'], search: true,
    statuses: ['DRAFT', 'QUOTATION', 'CONFIRMED', 'ACTIVE', 'PAUSED', 'CLOSED'],
    fields: [{ key: 'customerId', label: 'Customer', resource: 'customers', required: true }, { key: 'templateId', label: 'Quotation template (optional)', resource: 'quotation-templates' }, { ...plan, required: false }, { key: 'startDate', label: 'Start date', type: 'date', required: true }, { key: 'expiryDate', label: 'Expiry date', type: 'date', required: true }, { key: 'paymentTermsDays', label: 'Payment terms in days', type: 'number', min: 0, max: 365, initial: '14' }, lines] },
  { key: 'invoices', title: 'Invoices', columns: ['number', 'customerName', 'status', 'dueDate', 'total', 'paidAmount', 'outstanding'], search: true, statuses: ['DRAFT', 'CONFIRMED', 'PAID', 'CANCELLED'] },
  { key: 'payments', title: 'Payment receipts', columns: ['invoiceId', 'amount', 'method', 'paymentDate', 'note'] },
  { key: 'customers', title: 'Customers', columns: ['name', 'email'] },
];
export function visibleResources(role: string) {
  return resources.filter(r => role !== 'CUSTOMER' || ['subscriptions', 'invoices', 'plans'].includes(r.key));
}
export function serializeFields(fields: Field[], values: FormData) {
  const result: Record<string, unknown> = {};
  for (const field of fields) {
    if (field.type === 'lines') continue;
    const value = values.get(field.key);
    if (field.type === 'checkbox') result[field.key] = value === 'on';
    else if (value !== null && value !== '') result[field.key] = field.type === 'number' ? Number(value) : String(value).trim();
  }
  return result;
}
