'use client';

import { ROIState } from '@/lib/roi/types';
import CollapsibleSection from '../CollapsibleSection';

interface AdvancedOptionsStepProps {
  quality: ROIState['quality'];
  revenue: ROIState['revenue'];
  onUpdateQuality: (updates: Partial<ROIState['quality']>) => void;
  onUpdateRevenue: (updates: Partial<ROIState['revenue']>) => void;
}

export default function AdvancedOptionsStep({
  quality,
  revenue,
  onUpdateQuality,
  onUpdateRevenue,
}: AdvancedOptionsStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-dh2 text-ink-0 mb-2">Advanced Options</h2>
        <p className="text-ink-2">Enable additional factors to get a more complete picture.</p>
      </div>

      <CollapsibleSection
        title="Error Reduction"
        description="Factor in savings from reduced mistakes and rework"
        enabled={quality.enabled}
        onToggle={(enabled) => onUpdateQuality({ enabled })}
      >
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-ink-2 mb-1">
              Current Error Rate
            </label>
            <div className="relative">
              <input
                type="number"
                min={0}
                max={50}
                step={1}
                value={Math.round(quality.errorRate * 100)}
                onChange={(e) => onUpdateQuality({ errorRate: (parseFloat(e.target.value) || 0) / 100 })}
                className="w-full px-3 py-2 pr-8 text-sm rounded bg-surface-3 border border-stroke-1 text-ink-0 focus:border-aqua focus:outline-none"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 text-sm">%</span>
            </div>
            <p className="text-xs text-ink-3 mt-1">% of tasks with errors</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-2 mb-1">
              Cost Per Error
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3 text-sm">$</span>
              <input
                type="number"
                min={0}
                max={1000}
                value={quality.costPerError}
                onChange={(e) => onUpdateQuality({ costPerError: parseFloat(e.target.value) || 0 })}
                className="w-full pl-7 pr-3 py-2 text-sm rounded bg-surface-3 border border-stroke-1 text-ink-0 focus:border-aqua focus:outline-none"
              />
            </div>
            <p className="text-xs text-ink-3 mt-1">Time + materials to fix</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-2 mb-1">
              Error Reduction
            </label>
            <div className="relative">
              <input
                type="number"
                min={0}
                max={100}
                step={5}
                value={Math.round(quality.errorReduction * 100)}
                onChange={(e) => onUpdateQuality({ errorReduction: (parseFloat(e.target.value) || 0) / 100 })}
                className="w-full px-3 py-2 pr-8 text-sm rounded bg-surface-3 border border-stroke-1 text-ink-0 focus:border-aqua focus:outline-none"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 text-sm">%</span>
            </div>
            <p className="text-xs text-ink-3 mt-1">Expected reduction</p>
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title="Revenue Impact"
        description="Factor in revenue gains from faster response times"
        enabled={revenue.enabled}
        onToggle={(enabled) => onUpdateRevenue({ enabled })}
      >
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-ink-2 mb-1">
              Leads Per Month
            </label>
            <input
              type="number"
              min={0}
              max={10000}
              value={revenue.leadsPerMonth}
              onChange={(e) => onUpdateRevenue({ leadsPerMonth: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 text-sm rounded bg-surface-3 border border-stroke-1 text-ink-0 focus:border-aqua focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-2 mb-1">
              Current Conversion Rate
            </label>
            <div className="relative">
              <input
                type="number"
                min={0}
                max={100}
                step={1}
                value={Math.round(revenue.conversionRate * 100)}
                onChange={(e) => onUpdateRevenue({ conversionRate: (parseFloat(e.target.value) || 0) / 100 })}
                className="w-full px-3 py-2 pr-8 text-sm rounded bg-surface-3 border border-stroke-1 text-ink-0 focus:border-aqua focus:outline-none"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 text-sm">%</span>
            </div>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-ink-2 mb-1">
              Conversion Lift
            </label>
            <div className="relative">
              <input
                type="number"
                min={0}
                max={100}
                step={5}
                value={Math.round(revenue.conversionLiftRelative * 100)}
                onChange={(e) => onUpdateRevenue({ conversionLiftRelative: (parseFloat(e.target.value) || 0) / 100 })}
                className="w-full px-3 py-2 pr-8 text-sm rounded bg-surface-3 border border-stroke-1 text-ink-0 focus:border-aqua focus:outline-none"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 text-sm">%</span>
            </div>
            <p className="text-xs text-ink-3 mt-1">Relative improvement</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-2 mb-1">
              Avg Deal Value
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3 text-sm">$</span>
              <input
                type="number"
                min={0}
                max={100000}
                value={revenue.avgDealValue}
                onChange={(e) => onUpdateRevenue({ avgDealValue: parseFloat(e.target.value) || 0 })}
                className="w-full pl-7 pr-3 py-2 text-sm rounded bg-surface-3 border border-stroke-1 text-ink-0 focus:border-aqua focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-2 mb-1">
              Gross Margin
            </label>
            <div className="relative">
              <input
                type="number"
                min={0}
                max={100}
                step={5}
                value={Math.round(revenue.grossMargin * 100)}
                onChange={(e) => onUpdateRevenue({ grossMargin: (parseFloat(e.target.value) || 0) / 100 })}
                className="w-full px-3 py-2 pr-8 text-sm rounded bg-surface-3 border border-stroke-1 text-ink-0 focus:border-aqua focus:outline-none"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 text-sm">%</span>
            </div>
          </div>
        </div>
      </CollapsibleSection>
    </div>
  );
}
