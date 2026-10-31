import React from 'react';
import { formatCurrency } from '../../lib/utils';
import { cn } from '../../lib/utils';

interface CurrencyFormatterProps {
  amount: number;
  currency?: string;
  className?: string;
  subtleDecimals?: boolean;
}

export const CurrencyFormatter: React.FC<CurrencyFormatterProps> = ({
  amount,
  currency = 'USD',
  className,
  subtleDecimals = false,
}) => {
  const formatted = formatCurrency(amount, currency);

  if (subtleDecimals) {
    const parts = formatted.split('.');
    return (
      <span className={cn('font-mono font-medium tracking-tight', className)}>
        {parts[0]}
        {parts[1] && <span className="text-zinc-500 text-[0.85em]">.{parts[1]}</span>}
      </span>
    );
  }

  return (
    <span className={cn('font-mono font-medium tracking-tight', className)}>
      {formatted}
    </span>
  );
};
