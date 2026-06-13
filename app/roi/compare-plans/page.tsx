'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ThemeShell from '@/components/marketing/ThemeShell';
import DarkButton from '@/components/marketing/DarkButton';
import { PLAN_DEFINITIONS } from '@/lib/roi/plans';
import { PlanTier } from '@/lib/roi/types';

export default function ComparePlansPage() {
  const router = useRouter();

  const handleSelectPlan = (planId: PlanTier) => {
    router.push(`/roi?plan=${planId}`);
  };

  const planColorClasses = {
    green: {
      bg: 'bg-surface-2',
      border: 'border-stroke-1',
      borderSelected: 'border-stroke-accent',
      dot: 'bg-signal-success',
      text: 'text-ink-0',
      button: 'bg-aqua text-[#04110d] hover:bg-aqua-bright',
      buttonOutline: 'border-stroke-2 text-ink-1 hover:border-aqua hover:text-ink-0',
    },
    blue: {
      bg: 'bg-surface-2',
      border: 'border-stroke-1',
      borderSelected: 'border-stroke-accent',
      dot: 'bg-link',
      text: 'text-ink-0',
      button: 'bg-aqua text-[#04110d] hover:bg-aqua-bright',
      buttonOutline: 'border-stroke-2 text-ink-1 hover:border-aqua hover:text-ink-0',
    },
    purple: {
      bg: 'bg-surface-2',
      border: 'border-stroke-accent',
      borderSelected: 'border-stroke-accent',
      dot: 'bg-aqua',
      text: 'text-ink-0',
      button: 'bg-aqua text-[#04110d] hover:bg-aqua-bright',
      buttonOutline: 'border-aqua text-aqua hover:bg-white/[0.04]',
    },
  };

  const formatPrice = (min: number, max: number | null) => {
    if (max === null) {
      return `$${min.toLocaleString()}+`;
    }
    return `$${min.toLocaleString()} – $${max.toLocaleString()}`;
  };

  return (
    <ThemeShell>
      <div className="mx-auto max-w-6xl px-6 py-12 pt-24 md:pt-32">
        {/* Header */}
        <div className="mb-12 text-center">
          <Link
            href="/roi"
            className="mb-4 inline-flex items-center text-sm text-link hover:text-link-hover"
          >
            <svg className="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to ROI Calculator
          </Link>
          <h1 className="font-display text-display tracking-tight text-ink-0 md:text-display-xl">
            Compare Novique Plans
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-body-lg text-ink-2">
            Choose the plan that matches your automation needs. All plans include dedicated support and custom implementation.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="mb-12 grid gap-6 md:grid-cols-3">
          {PLAN_DEFINITIONS.map((plan) => {
            const colors = planColorClasses[plan.color as keyof typeof planColorClasses];

            return (
              <div
                key={plan.id}
                className={`
                  rounded-2xl border-2 p-6 transition-all
                  ${colors.bg} ${colors.border}
                `}
              >
                {/* Plan Header */}
                <div className="mb-3 flex items-center gap-2">
                  <span className={`h-4 w-4 rounded-full ${colors.dot}`} aria-hidden="true" />
                  <h2 className={`font-display text-dh2 ${colors.text}`}>{plan.name}</h2>
                </div>
                <p className="mb-4 text-sm italic text-ink-3">— {plan.tagline}</p>

                {/* Description */}
                <p className="mb-6 text-sm text-ink-1">{plan.description}</p>

                {/* Pricing */}
                <div className="mb-6 border-t border-stroke-1 pt-4">
                  <h3 className="nv-eyebrow mb-3">Applies when</h3>
                  <p className="mb-4 text-sm text-ink-1">
                    <span className="font-medium text-ink-0">Monthly value created:</span>{' '}
                    {plan.maxMonthlyValue
                      ? `$${plan.minMonthlyValue.toLocaleString()} – $${plan.maxMonthlyValue.toLocaleString()}`
                      : `$${plan.minMonthlyValue.toLocaleString()}+`}
                  </p>

                  <h3 className="nv-eyebrow mb-3">Typical pricing</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-ink-2">Monthly:</span>
                      <span className="font-mono font-semibold text-ink-0">
                        {formatPrice(plan.monthlyFeeRange.min, plan.monthlyFeeRange.max)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-ink-2">One-time setup:</span>
                      <span className="font-mono font-semibold text-ink-0">
                        {formatPrice(plan.setupFeeRange.min, plan.setupFeeRange.max)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Select Button */}
                <button
                  onClick={() => handleSelectPlan(plan.id)}
                  className={`w-full rounded-full border-2 px-4 py-3 font-semibold transition-colors ${colors.buttonOutline}`}
                >
                  Select Plan
                </button>
              </div>
            );
          })}
        </div>

        {/* Features Comparison Table */}
        <div className="nv-card overflow-hidden rounded-2xl">
          <div className="border-b border-stroke-1 px-6 py-4">
            <h2 className="font-display text-dh3 text-ink-0">What&apos;s Included</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-surface-3">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-ink-3">Feature</th>
                  {PLAN_DEFINITIONS.map((plan) => (
                    <th key={plan.id} className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-ink-3">
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stroke-1">
                <tr>
                  <td className="px-6 py-4 text-sm text-ink-1">Custom Workflow Development</td>
                  <td className="px-6 py-4 text-center text-sm text-ink-1">1-2 workflows</td>
                  <td className="px-6 py-4 text-center text-sm text-ink-1">3-5 workflows</td>
                  <td className="px-6 py-4 text-center text-sm text-ink-1">Unlimited</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-ink-1">Dedicated Support</td>
                  <td className="px-6 py-4 text-center">
                    <CheckIcon />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <CheckIcon />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <CheckIcon />
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-ink-1">Priority Response Time</td>
                  <td className="px-6 py-4 text-center text-sm text-ink-1">48 hours</td>
                  <td className="px-6 py-4 text-center text-sm text-ink-1">24 hours</td>
                  <td className="px-6 py-4 text-center text-sm text-ink-1">Same day</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-ink-1">Monthly Strategy Call</td>
                  <td className="px-6 py-4 text-center">
                    <MinusIcon />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <CheckIcon />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <CheckIcon />
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-ink-1">Custom Integrations</td>
                  <td className="px-6 py-4 text-center text-sm text-ink-1">Standard only</td>
                  <td className="px-6 py-4 text-center">
                    <CheckIcon />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <CheckIcon />
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-ink-1">Dedicated Success Manager</td>
                  <td className="px-6 py-4 text-center">
                    <MinusIcon />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <MinusIcon />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <CheckIcon />
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-ink-1">ROI Reporting Dashboard</td>
                  <td className="px-6 py-4 text-center">
                    <MinusIcon />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <CheckIcon />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <CheckIcon />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <p className="mb-4 text-ink-2">
            Not sure which plan is right for you? We&apos;ll help you figure it out.
          </p>
          <DarkButton href="/contact" size="lg">
            Get a Free Consultation
          </DarkButton>
        </div>
      </div>
    </ThemeShell>
  );
}

function CheckIcon() {
  return (
    <svg className="mx-auto h-5 w-5 text-signal-success" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function MinusIcon() {
  return (
    <svg className="mx-auto h-5 w-5 text-ink-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
    </svg>
  );
}
