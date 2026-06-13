'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ROIResults, Scenario, WorkflowSelection, ReadinessFlags, DerivedPricing, ResultsState } from '@/lib/roi/types';
import { getPlanById } from '@/lib/roi/plans';
import { ROISegment, SEGMENT_META } from '@/lib/roi/segments';
import MetricCard from './MetricCard';
import SavingsBreakdownBars from './SavingsBreakdownBars';

interface ROIResultsPanelProps {
  results: ROIResults;
  scenario: Scenario;
  onSetScenario: (scenario: Scenario) => void;
  qualityEnabled: boolean;
  revenueEnabled: boolean;
  industry: string;
  employeesImpacted: number;
  workflows: WorkflowSelection[];
  readiness: ReadinessFlags;
  derivedPricing: DerivedPricing | null;
  segment: ROISegment | null;
}

const scenarios: { value: Scenario; label: string }[] = [
  { value: 'conservative', label: 'Conservative' },
  { value: 'expected', label: 'Expected' },
  { value: 'aggressive', label: 'Aggressive' },
];

// Placeholder card for metrics not yet available
function PlaceholderMetricCard({ label, size = 'md' }: { label: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-5',
  };
  const valueClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-3xl',
  };

  return (
    <div className={`bg-surface-2 rounded-xl border border-stroke-1 ${sizeClasses[size]}`}>
      <p className="text-xs text-ink-3 mb-1">{label}</p>
      <p className={`font-mono font-bold text-ink-3 ${valueClasses[size]}`}>—</p>
    </div>
  );
}

// Placeholder for the recommended plan card
function PlaceholderPlanCard({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-stroke-1 bg-surface-2 p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="w-3 h-3 rounded-full bg-ink-3" aria-hidden="true" />
        <span className="text-sm font-bold text-ink-3">Recommended Plan</span>
      </div>
      <p className="text-sm text-ink-2">{message}</p>
    </div>
  );
}

// "Why this plan?" expandable section
function WhyThisPlan({ tierName, tagline }: { tierName: string; tagline: string }) {
  const [isOpen, setIsOpen] = useState(false);

  const explanations: Record<string, string> = {
    Starter: 'Based on your projected monthly value, the Starter plan offers the best fit for teams just beginning their automation journey. It includes focused workflow development and support for your most critical processes.',
    Growth: 'Your projected impact qualifies you for the Growth plan, which includes expanded workflow capacity, priority support, and strategic monthly calls to optimize your automation ROI.',
    Scale: 'With your significant projected value, the Scale plan provides unlimited workflow development, same-day support, a dedicated success manager, and full ROI reporting to maximize your automation investment.',
  };

  return (
    <details
      className="mt-3"
      open={isOpen}
      onToggle={(e) => setIsOpen((e.target as HTMLDetailsElement).open)}
    >
      <summary className="text-sm font-medium text-link hover:text-link-hover cursor-pointer list-none flex items-center gap-1">
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-90' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        Why this plan?
      </summary>
      <div className="mt-2 text-xs text-ink-2 leading-relaxed">
        <p className="mb-2">
          <strong className="text-ink-1">{tierName}</strong>: &quot;{tagline}&quot;
        </p>
        <p>{explanations[tierName] || 'This plan is recommended based on your projected monthly business value.'}</p>
      </div>
    </details>
  );
}

export default function ROIResultsPanel({
  results,
  scenario,
  onSetScenario,
  qualityEnabled,
  revenueEnabled,
  industry,
  employeesImpacted,
  workflows,
  readiness,
  derivedPricing,
  segment,
}: ROIResultsPanelProps) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    try {
      const selectedWorkflows = workflows
        .filter((w) => w.enabled)
        .map((w) => w.id);

      // Compute the actual displayed ROI values using derived pricing
      let submissionResults = { ...results };
      if (derivedPricing) {
        const netMonthlyGain = results.totalBenefitPerMonth - derivedPricing.monthlyFee;
        const isValueExceedsCost = netMonthlyGain > 0;
        submissionResults = {
          ...results,
          netBenefitPerMonth: Math.round(netMonthlyGain),
          roiPercent: isValueExceedsCost
            ? Math.round((netMonthlyGain / derivedPricing.monthlyFee) * 100)
            : 0,
          paybackMonths: isValueExceedsCost
            ? Math.round((derivedPricing.setupFee / netMonthlyGain) * 10) / 10
            : Infinity,
        };
      }

      const response = await fetch('/api/roi/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          results: submissionResults,
          industry,
          employeesImpacted,
          selectedWorkflows,
          derivedPricing,
        }),
      });
      if (response.ok) {
        setSubmitted(true);
      }
    } catch (error) {
      console.error('Failed to submit:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper text based on current state
  const getHelperText = (state: ResultsState): string => {
    switch (state) {
      case 'initial':
        return 'Enter your team size and hourly rate to see your projected impact.';
      case 'team':
        return 'Select at least one workflow to see your recommended plan and pricing.';
      case 'workflows':
        return '';
    }
  };

  const helperText = getHelperText(readiness.resultsState);

  // Render plan card based on state
  const renderPlanCard = () => {
    if (readiness.resultsState === 'initial') {
      return <PlaceholderPlanCard message="Complete the steps to see your recommended plan." />;
    }

    if (readiness.resultsState === 'team') {
      return <PlaceholderPlanCard message="Add workflows to determine the best-fit plan and pricing." />;
    }

    // resultsState === 'workflows'
    if (!derivedPricing) {
      return <PlaceholderPlanCard message="Calculating your recommended plan..." />;
    }

    const plan = getPlanById(derivedPricing.finalTier);

    const planColorClasses = {
      green: 'bg-surface-3 border-stroke-2',
      blue: 'bg-surface-3 border-stroke-2',
      purple: 'bg-surface-3 border-stroke-accent shadow-glow',
    };
    const planDotClasses = {
      green: 'bg-signal-success',
      blue: 'bg-link',
      purple: 'bg-aqua',
    };
    const planTextClasses = {
      green: 'text-ink-0',
      blue: 'text-ink-0',
      purple: 'text-ink-0',
    };

    // Calculate ROI metrics
    const netMonthlyGain = results.totalBenefitPerMonth - derivedPricing.monthlyFee;
    const isValueExceedsCost = netMonthlyGain > 0;
    const derivedRoiPercent = isValueExceedsCost
      ? Math.round((netMonthlyGain / derivedPricing.monthlyFee) * 100)
      : null;
    const derivedPaybackMonths = isValueExceedsCost
      ? Math.round((derivedPricing.setupFee / netMonthlyGain) * 10) / 10
      : null;

    return (
      <>
        {/* Plan Card */}
        <div className={`rounded-xl border p-4 ${planColorClasses[plan.color as keyof typeof planColorClasses]}`}>
          <div className="flex items-center gap-2 mb-2">
            <span className={`w-3 h-3 rounded-full ${planDotClasses[plan.color as keyof typeof planDotClasses]}`} aria-hidden="true" />
            <span className={`text-sm font-bold ${planTextClasses[plan.color as keyof typeof planTextClasses]}`}>
              Selected Plan: {plan.name}
            </span>
          </div>
          <p className="text-xs text-ink-3 italic mb-3">— {plan.tagline}</p>

          {/* Below recommended tier notice */}
          {derivedPricing.isBelowRecommended && derivedPricing.customerSelectedTier && (
            <div className="mb-3 p-2 bg-surface-2 border border-stroke-accent rounded-lg">
              <p className="text-xs text-ink-1">
                You selected {getPlanById(derivedPricing.customerSelectedTier).name}, but based on your projected impact,
                pricing shown reflects {plan.name}.
              </p>
            </div>
          )}

          {/* Estimated Monthly Program Cost */}
          <div className="mb-3">
            <p className="text-xs text-ink-3 mb-1">Estimated Monthly Program Cost</p>
            <div className="flex items-baseline gap-1">
              <span className="font-mono text-2xl font-bold text-ink-0">
                ${derivedPricing.monthlyFee.toLocaleString()}
              </span>
              <span className="text-sm text-ink-3">/month</span>
            </div>
          </div>

          {/* Estimated One-Time Implementation Cost */}
          <div className="mb-3">
            <p className="text-xs text-ink-3 mb-1">Estimated One-Time Implementation Cost</p>
            <p className="font-mono text-lg font-semibold text-ink-1">
              ${derivedPricing.setupFee.toLocaleString()}
            </p>
          </div>

          <div className="flex items-center justify-between">
            <Link
              href="/roi/compare-plans"
              className="text-sm font-medium text-link hover:text-link-hover underline underline-offset-2"
            >
              Compare Plans →
            </Link>
          </div>

          <WhyThisPlan tierName={plan.name} tagline={plan.tagline} />
        </div>

        {/* Warning if value doesn't exceed cost */}
        {!isValueExceedsCost && (
          <div className="p-3 bg-surface-3 border border-stroke-2 rounded-lg">
            <p className="text-sm text-signal-warning">
              Based on these inputs, the estimated value may not yet exceed program cost.
              Try enabling more workflows or adjusting your estimates.
            </p>
          </div>
        )}

        {/* ROI and Payback */}
        <div className="grid grid-cols-2 gap-3">
          {derivedRoiPercent !== null ? (
            <MetricCard
              label="ROI"
              value={derivedRoiPercent}
              format="percent"
              variant="success"
              size="md"
              tooltip="ROI = (Monthly Value - Monthly Cost) ÷ Monthly Cost × 100"
            />
          ) : (
            <div className="p-4 bg-surface-2 rounded-xl border border-stroke-1 text-center">
              <p className="text-xs text-ink-3 mb-1">ROI</p>
              <p className="text-xl font-bold text-ink-3">N/A</p>
            </div>
          )}
          {derivedPaybackMonths !== null ? (
            <MetricCard
              label="Payback"
              value={derivedPaybackMonths}
              format="months"
              variant="primary"
              size="md"
            />
          ) : (
            <div className="p-4 bg-surface-2 rounded-xl border border-stroke-1 text-center">
              <p className="text-xs text-ink-3 mb-1">Payback</p>
              <p className="text-xl font-bold text-ink-3">N/A</p>
            </div>
          )}
        </div>
      </>
    );
  };

  return (
    <div className="lg:sticky lg:top-24 space-y-6">
      <div className="nv-card p-6">
        <h3 className="font-display text-dh3 text-ink-0 mb-4">Your ROI Projection</h3>

        {/* Scenario Toggle */}
        <div className="flex rounded-lg bg-surface-3 p-1 mb-6">
          {scenarios.map((s) => (
            <button
              key={s.value}
              onClick={() => onSetScenario(s.value)}
              className={`
                flex-1 py-2 px-3 text-sm font-medium rounded-md transition-all
                ${scenario === s.value
                  ? 'bg-surface-1 text-ink-0 shadow'
                  : 'text-ink-2 hover:text-ink-0'
                }
              `}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Main Metrics */}
        <div className="space-y-4">
          {/* Monthly Business Value - always show placeholder or value */}
          {readiness.canShowRoi ? (
            <MetricCard
              label="Monthly Business Value"
              value={results.totalBenefitPerMonth}
              format="currency"
              variant="highlight"
              size="lg"
            />
          ) : (
            <PlaceholderMetricCard label="Monthly Business Value" size="lg" />
          )}

          {/* Segment Narrative - only show when segment is selected and ROI can be shown */}
          {segment && readiness.canShowRoi && (
            <div className="p-4 bg-surface-3 rounded-xl border border-stroke-accent">
              <p className="text-sm text-ink-1 leading-relaxed mb-3">
                {SEGMENT_META[segment].narrative}
              </p>
              <p className="text-sm font-medium text-aqua italic">
                {SEGMENT_META[segment].reframing}
              </p>
            </div>
          )}

          {/* Plan Card - rendered based on state */}
          {renderPlanCard()}

          {/* Hours Saved - show placeholder or value */}
          {readiness.canShowRoi ? (
            <MetricCard
              label="Hours Saved/Month"
              value={results.hoursSavedPerMonth}
              format="hours"
              variant="default"
              size="sm"
            />
          ) : (
            <PlaceholderMetricCard label="Hours Saved/Month" size="sm" />
          )}
        </div>

        {/* Helper text when not in workflows state */}
        {helperText && (
          <div className="mt-4 p-3 bg-surface-3 border border-stroke-1 rounded-lg">
            <p className="text-sm text-ink-2">{helperText}</p>
          </div>
        )}

        {/* Breakdown - only show when workflows state */}
        {readiness.resultsState === 'workflows' && (
          <div className="mt-6 pt-6 border-t border-stroke-1">
            <SavingsBreakdownBars
              laborSavings={results.laborSavingsPerMonth}
              errorSavings={results.errorSavingsPerMonth}
              revenueUplift={results.revenueUpliftPerMonth}
              qualityEnabled={qualityEnabled}
              revenueEnabled={revenueEnabled}
            />
          </div>
        )}

        {/* Disclaimer */}
        <p className="mt-4 text-xs text-ink-3 leading-relaxed">
          <strong className="text-ink-2">Estimates only.</strong> Novique pricing and results shown are projections based on the information you provide and common automation benchmarks. Actual costs/savings and results will vary based on the custom solution you select, and your processes, data quality, adoption, and execution.
        </p>
      </div>

      {/* CTA - only show when workflows state */}
      {readiness.resultsState === 'workflows' && (
        <div className="relative overflow-hidden rounded-2xl border border-stroke-accent bg-surface-2 p-6 shadow-glow">
          <h3 className="font-display text-dh3 text-ink-0 mb-2">Ready to see these savings?</h3>
          <p className="text-ink-2 text-sm mb-4">
            These estimates are based on common automation patterns. Your assessment will validate workflows, scope, and exact pricing.
          </p>

          {submitted ? (
            <div className="bg-surface-3 border border-stroke-1 rounded-lg p-4 text-center">
              <svg className="w-8 h-8 mx-auto mb-2 text-signal-success" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="font-medium text-ink-0">Thanks! We&apos;ll be in touch soon.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg bg-surface-3 border border-stroke-1 text-ink-0 placeholder:text-ink-3 focus:border-aqua focus:outline-none"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 bg-aqua text-[#04110d] font-semibold rounded-full hover:bg-aqua-bright shadow-glow hover:shadow-glow-strong transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Sending...' : 'Get Free Assessment'}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
