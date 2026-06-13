'use client';

import { useState } from 'react';
import { formatCurrency, formatPercent, formatHours, formatMonths } from '@/lib/roi/calculations';

type FormatType = 'currency' | 'percent' | 'hours' | 'months';

interface MetricCardProps {
  label: string;
  value: number;
  format: FormatType;
  variant?: 'default' | 'primary' | 'success' | 'highlight';
  size?: 'sm' | 'md' | 'lg';
  tooltip?: string;
}

const formatters: Record<FormatType, (value: number) => string> = {
  currency: formatCurrency,
  percent: formatPercent,
  hours: formatHours,
  months: formatMonths,
};

const variantStyles = {
  default: 'bg-surface-2 border-stroke-1',
  primary: 'bg-surface-3 border-stroke-1',
  success: 'bg-surface-3 border-stroke-2',
  highlight: 'bg-surface-3 border-stroke-accent shadow-glow',
};

const valueStyles = {
  default: 'text-ink-0',
  primary: 'text-ink-0',
  success: 'text-signal-success',
  highlight: 'text-aqua-bright',
};

const labelStyles = {
  default: 'text-ink-2',
  primary: 'text-ink-2',
  success: 'text-ink-2',
  highlight: 'text-ink-1',
};

const sizeStyles = {
  sm: { value: 'text-xl', label: 'text-xs' },
  md: { value: 'text-2xl', label: 'text-sm' },
  lg: { value: 'text-3xl md:text-4xl', label: 'text-sm' },
};

export default function MetricCard({
  label,
  value,
  format,
  variant = 'default',
  size = 'md',
  tooltip,
}: MetricCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const formattedValue = formatters[format](value);

  return (
    <div className={`rounded-lg border p-4 ${variantStyles[variant]}`}>
      <p className={`font-mono font-bold ${sizeStyles[size].value} ${valueStyles[variant]}`}>
        {formattedValue}
      </p>
      <div className={`${sizeStyles[size].label} ${labelStyles[variant]} mt-1 flex items-center gap-1`}>
        <span>{label}</span>
        {tooltip && (
          <div className="relative inline-block">
            <button
              type="button"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              onClick={() => setShowTooltip(!showTooltip)}
              className="text-xs opacity-60 hover:opacity-100 transition-opacity"
              aria-label="How this is calculated"
            >
              ⓘ
            </button>
            {showTooltip && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-surface-0 border border-stroke-2 text-ink-1 text-xs rounded-lg shadow-glow z-10">
                {tooltip}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-stroke-2" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
