import React from 'react';
import { SubscriptionStatus, InvoiceStatus } from '../../types/billing';
import { cn } from '../../lib/utils';

interface StatusBadgeProps {
  status: SubscriptionStatus | InvoiceStatus | string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const getBadgeStyle = (s: string) => {
    switch (s) {
      case 'Draft':
        return 'bg-zinc-800 text-zinc-300 border-zinc-700';
      case 'Quotation':
        return 'bg-amber-950/60 text-amber-300 border-amber-800/80';
      case 'Confirmed':
        return 'bg-blue-950/60 text-blue-300 border-blue-800/80';
      case 'Active':
      case 'Paid':
        return 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80';
      case 'Paused':
        return 'bg-purple-950/60 text-purple-300 border-purple-800/80';
      case 'Closed':
      case 'Cancelled':
      case 'Overdue':
      case 'FAILED':
        return 'bg-rose-950/60 text-rose-300 border-rose-800/80';
      default:
        return 'bg-zinc-800 text-zinc-300 border-zinc-700';
    }
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border font-mono tracking-tight',
        getBadgeStyle(status),
        className
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-80" />
      {status}
    </span>
  );
};
