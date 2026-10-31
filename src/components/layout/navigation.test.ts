import { describe, expect, it } from 'vitest';
import { resolveNavigationTab } from './navigation';
import type { NavigationTab } from './Sidebar';

const tabs: NavigationTab[] = ['dashboard', 'catalog', 'subscriptions', 'quotations', 'billing', 'discounts', 'payments', 'auth-staff', 'customer-portal'];

describe('workspace navigation after role changes', () => {
  it('always returns customers to their portal', () => {
    for (const tab of tabs) expect(resolveNavigationTab('Customer', tab)).toBe('customer-portal');
  });
  it('moves staff away from every unavailable admin or customer page', () => {
    for (const tab of ['dashboard', 'catalog', 'discounts', 'auth-staff', 'customer-portal'] as NavigationTab[]) {
      expect(resolveNavigationTab('Staff', tab)).toBe('subscriptions');
    }
  });
  it('preserves valid staff pages and returns administrators from the portal', () => {
    for (const tab of ['subscriptions', 'quotations', 'billing', 'payments'] as NavigationTab[]) {
      expect(resolveNavigationTab('Staff', tab)).toBe(tab);
    }
    expect(resolveNavigationTab('Admin', 'customer-portal')).toBe('dashboard');
    expect(resolveNavigationTab('Admin', 'catalog')).toBe('catalog');
  });
});
