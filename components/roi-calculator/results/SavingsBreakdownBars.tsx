'use client';

import { formatCurrency } from '@/lib/roi/calculations';

interface SavingsBreakdownBarsProps {
  laborSavings: number;
  errorSavings: number;
  revenueUplift: number;
  qualityEnabled: boolean;
  revenueEnabled: boolean;
}

export default function SavingsBreakdownBars({
  laborSavings,
  errorSavings,
  revenueUplift,
  qualityEnabled,
  revenueEnabled,
}: SavingsBreakdownBarsProps) {
  const total = laborSavings + errorSavings + revenueUplift;
  if (total <= 0) return null;

  const bars = [
    {
      label: 'Labor Savings',
      value: laborSavings,
      color: 'bg-aqua',
      show: true,
    },
    {
      label: 'Error Savings',
      value: errorSavings,
      color: 'bg-signal-success',
      show: qualityEnabled && errorSavings > 0,
    },
    {
      label: 'Revenue Uplift',
      value: revenueUplift,
      color: 'bg-signal-warning',
      show: revenueEnabled && revenueUplift > 0,
    },
  ].filter(bar => bar.show);

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-ink-1">Monthly Benefit Breakdown</h4>
      {bars.map((bar) => {
        const percentage = (bar.value / total) * 100;
        return (
          <div key={bar.label}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-ink-2">{bar.label}</span>
              <span className="font-mono font-medium text-ink-0">{formatCurrency(bar.value)}</span>
            </div>
            <div className="h-3 bg-surface-3 rounded-full overflow-hidden">
              <div
                className={`h-full ${bar.color} rounded-full transition-all duration-500`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
