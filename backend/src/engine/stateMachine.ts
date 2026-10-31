import { SubscriptionStatus, InvoiceStatus } from '../types/models.js';

export class InvalidStateTransitionError extends Error {
  constructor(entity: string, current: string, target: string) {
    super(`Cannot transition ${entity} from state "${current}" to "${target}". Transition is forbidden by state machine rules.`);
    this.name = 'InvalidStateTransitionError';
  }
}

const SUBSCRIPTION_TRANSITIONS: Record<SubscriptionStatus, SubscriptionStatus[]> = {
  Draft: ['Quotation', 'Confirmed', 'Closed'],
  Quotation: ['Confirmed', 'Closed'],
  Confirmed: ['Active', 'Closed'],
  Active: ['Paused', 'Closed'],
  Paused: ['Active', 'Closed'],
  Closed: [], // Terminal
};

const INVOICE_TRANSITIONS: Record<InvoiceStatus, InvoiceStatus[]> = {
  Draft: ['Confirmed', 'Cancelled'],
  Confirmed: ['Paid', 'Overdue', 'Cancelled'],
  Overdue: ['Paid', 'Cancelled'],
  Paid: [], // Terminal
  Cancelled: [], // Terminal
};

export function canTransitionSubscription(current: SubscriptionStatus, next: SubscriptionStatus): boolean {
  if (current === next) return true;
  const allowed = SUBSCRIPTION_TRANSITIONS[current] || [];
  return allowed.includes(next);
}

export function assertValidSubscriptionTransition(current: SubscriptionStatus, next: SubscriptionStatus): void {
  if (!canTransitionSubscription(current, next)) {
    throw new InvalidStateTransitionError('Subscription', current, next);
  }
}

export function canTransitionInvoice(current: InvoiceStatus, next: InvoiceStatus): boolean {
  if (current === next) return true;
  const allowed = INVOICE_TRANSITIONS[current] || [];
  return allowed.includes(next);
}

export function assertValidInvoiceTransition(current: InvoiceStatus, next: InvoiceStatus): void {
  if (!canTransitionInvoice(current, next)) {
    throw new InvalidStateTransitionError('Invoice', current, next);
  }
}
