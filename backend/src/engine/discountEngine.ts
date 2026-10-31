import { DiscountRule, toCents, toDollars } from '../types/models.js';

export interface DiscountEvaluationResult {
  isApplicable: boolean;
  reason?: string;
  discountAmountDollars: number;
}

export class DiscountEngine {
  /**
   * Evaluates if a discount code applies and calculates the exact amount with zero floating point drift
   */
  static evaluate(rule: DiscountRule, orderSubtotalDollars: number): DiscountEvaluationResult {
    if (!rule.active) {
      return { isApplicable: false, reason: 'Discount rule is inactive', discountAmountDollars: 0 };
    }

    const today = new Date().toISOString().split('T')[0];
    if (rule.validUntil && rule.validUntil < today) {
      return { isApplicable: false, reason: `Discount expired on ${rule.validUntil}`, discountAmountDollars: 0 };
    }

    const orderCents = toCents(orderSubtotalDollars);
    const minOrderCents = toCents(rule.minOrderAmount);

    if (orderCents < minOrderCents) {
      return {
        isApplicable: false,
        reason: `Order subtotal ($${orderSubtotalDollars}) is below required minimum spend ($${rule.minOrderAmount})`,
        discountAmountDollars: 0,
      };
    }

    let discountCents = 0;
    if (rule.type === 'PERCENT') {
      discountCents = Math.round((orderCents * rule.value) / 100);
    } else {
      discountCents = toCents(rule.value);
    }

    // Cap discount at total order amount
    discountCents = Math.min(orderCents, discountCents);

    return {
      isApplicable: true,
      discountAmountDollars: toDollars(discountCents),
    };
  }
}
