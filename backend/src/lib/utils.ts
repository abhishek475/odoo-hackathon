import { Decimal } from 'decimal.js';
import { z } from 'zod';
import type { Request } from 'express';
import type { Prisma } from '../generated/prisma/client.js';

export const D = (value: { toString(): string } | string | number) => new Decimal(value.toString());
export const money = (value: Decimal) => value.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
export const moneyString = (value: Decimal) => money(value).toFixed(2);
export const uuid = z.string().uuid();
export const decimalInput = z.string().regex(/^\d{1,10}(\.\d{1,4})?$/, 'Use a non-negative decimal string with up to 4 decimal places');
export const amountInput = z.string().regex(/^\d{1,10}(\.\d{1,2})?$/, 'Use a decimal string with up to 2 decimal places');
export const positiveAmount = amountInput.refine(v => D(v).gt(0), 'Amount must be greater than zero');
export const rateInput = z.string().regex(/^\d{1,3}(\.\d{1,6})?$/).refine(v => D(v).lte(100), 'Rate must be between 0 and 100');
export const dateInput = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v => {
  const d = new Date(`${v}T00:00:00Z`); return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
}, 'Use a real calendar date in YYYY-MM-DD format');
export const asDate = (value: string) => new Date(`${value}T00:00:00.000Z`);
export const dateOnly = (date: Date) => asDate(date.toISOString().slice(0, 10));
export const addDays = (date: Date, days: number) => new Date(date.getTime() + days * 86400000);
export const dayString = (date: Date) => date.toISOString().slice(0, 10);
export const passwordInput = z.string().min(9).max(72)
  .regex(/[A-Z]/, 'Include an uppercase letter').regex(/[a-z]/, 'Include a lowercase letter')
  .regex(/[^A-Za-z0-9\s]/, 'Include a special character');
export const pageQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export function pagination(req: Request) {
  const { page, pageSize } = pageQuery.parse(req.query);
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}
export function listResult(data: unknown, total: number, page: number, pageSize: number) {
  return { data, pagination: { page, pageSize, total, pages: Math.ceil(total / pageSize) } };
}
export const paramId = (req: Request, name = 'id') => uuid.parse(req.params[name]);
export function nextCycle(anchor: Date, current: Date, cadence: string): Date {
  if (cadence === 'DAILY') return addDays(current, 1);
  if (cadence === 'WEEKLY') return addDays(current, 7);
  const year = cadence === 'YEARLY' ? current.getUTCFullYear() + 1 : current.getUTCFullYear();
  const month = cadence === 'YEARLY' ? anchor.getUTCMonth() : current.getUTCMonth() + 1;
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return new Date(Date.UTC(year, month, Math.min(anchor.getUTCDate(), lastDay)));
}
export async function audit(tx: Prisma.TransactionClient, actorId: string, action: string, entityType: string, entityId: string, details?: Prisma.InputJsonValue) {
  await tx.auditLog.create({ data: { actorId, action, entityType, entityId, ...(details === undefined ? {} : { details }) } });
}
export const escapeHtml = (value: string) => value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
export const csvCell = (value: unknown) => {
  let text = value == null ? '' : String(value);
  // Prevent spreadsheet formula execution when exported names/notes are opened in Excel.
  if (/^[\s]*[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
};
