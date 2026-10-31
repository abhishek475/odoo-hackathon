import type { UserRole } from '../../types/billing';
import type { NavigationTab } from './Sidebar';

// Presentation policy only. Backend authorization must enforce every request.
export function resolveNavigationTab(role: UserRole, tab: NavigationTab): NavigationTab {
  if (role === 'Customer') return 'customer-portal';
  if (role === 'Staff') {
    return ['subscriptions', 'quotations', 'billing', 'payments'].includes(tab) ? tab : 'subscriptions';
  }
  return tab === 'customer-portal' ? 'dashboard' : tab;
}
