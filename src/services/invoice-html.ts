import type { Invoice, InvoiceLine } from '../generated/prisma/client.js';
import { D, dayString, escapeHtml as h, moneyString } from '../lib/utils.js';

export function invoiceHtml(invoice: Invoice & { lines: InvoiceLine[] }) {
  const rows = invoice.lines.map(line => `<tr><td>${h(line.description)}</td><td>${line.quantity}</td><td>${h(line.unitPrice.toString())}</td><td>${h(line.discount.toString())}</td><td>${h(line.tax.toString())}</td><td>${h(line.total.toString())}</td></tr>`).join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${h(invoice.number)}</title>
  <style>body{font:15px system-ui,sans-serif;color:#172033;max-width:900px;margin:40px auto;padding:24px}h1{margin-bottom:8px}table{width:100%;border-collapse:collapse;margin:28px 0}th,td{text-align:right;padding:12px 8px;border-bottom:1px solid #dbe1e9}th:first-child,td:first-child{text-align:left}.totals{text-align:right;line-height:1.9}.muted{color:#526174}@media print{body{margin:0;padding:16px}@page{size:A4;margin:16mm}}</style></head><body>
  <h1>Brightloop Software</h1><p class="muted">Invoice ${h(invoice.number)} · ${h(invoice.status)}</p>
  <p><strong>${h(invoice.customerName)}</strong><br>${h(invoice.customerEmail)}</p>
  <p>Issued: ${dayString(invoice.issueDate)} · Due: ${dayString(invoice.dueDate)}<br>Service period: ${dayString(invoice.periodStart)} to ${dayString(invoice.periodEnd)} (end exclusive)</p>
  <table><thead><tr><th>Description</th><th>Quantity</th><th>Unit price</th><th>Discount</th><th>Tax</th><th>Total</th></tr></thead><tbody>${rows}</tbody></table>
  <div class="totals">Subtotal: ${h(invoice.subtotal.toString())}<br>Discount: ${h(invoice.discountTotal.toString())}<br>Tax: ${h(invoice.taxTotal.toString())}<br><strong>Total: ${h(invoice.total.toString())}</strong><br>Paid: ${h(invoice.paidAmount.toString())}<br>Outstanding: ${moneyString(D(invoice.total).sub(invoice.paidAmount.toString()))}</div>
  <p class="muted">Amounts in INR. Use your browser's Print / Save as PDF action.</p></body></html>`;
}
