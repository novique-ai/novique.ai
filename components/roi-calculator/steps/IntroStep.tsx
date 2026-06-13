'use client';

import DarkButton from '@/components/marketing/DarkButton';

interface IntroStepProps {
  onStart: () => void;
}

export default function IntroStep({ onStart }: IntroStepProps) {
  return (
    <div className="max-w-2xl mx-auto text-center">
      {/* Progress indicator */}
      <div className="nv-eyebrow mb-6">
        Step 0 of 3 — Getting Started
      </div>

      {/* Headline */}
      <h2 className="font-display text-dh1 text-ink-0 mb-4">
        Get a clear picture of your automation ROI
      </h2>

      {/* Supporting copy */}
      <div className="text-ink-2 mb-8 space-y-4">
        <p>
          This short assessment estimates how much time and money your business could save by automating repetitive work with AI.
        </p>
        <p>
          You&apos;ll answer a few high-level questions about your team and workflows — no exact numbers required.
        </p>
      </div>

      {/* What we'll look at */}
      <div className="bg-surface-2 border border-stroke-1 rounded-xl p-6 mb-6 text-left">
        <h3 className="font-display text-dh3 text-ink-0 mb-4">What We&apos;ll Look At</h3>
        <ul className="space-y-3">
          <li className="flex items-start gap-3">
            <svg className="mt-0.5 h-5 w-5 shrink-0 text-aqua" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
            <span className="text-ink-1">Time currently spent on manual or repetitive tasks</span>
          </li>
          <li className="flex items-start gap-3">
            <svg className="mt-0.5 h-5 w-5 shrink-0 text-aqua" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="12" y1="2" x2="12" y2="22" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
            <span className="text-ink-1">Labor cost tied to that work</span>
          </li>
          <li className="flex items-start gap-3">
            <svg className="mt-0.5 h-5 w-5 shrink-0 text-aqua" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></svg>
            <span className="text-ink-1">Where automation could realistically improve efficiency or revenue</span>
          </li>
        </ul>
      </div>

      {/* What you'll get */}
      <div className="bg-surface-2 border border-stroke-1 rounded-xl p-6 mb-6 text-left">
        <h3 className="font-display text-dh3 text-ink-0 mb-4">What You&apos;ll Get</h3>
        <ul className="space-y-2 text-ink-1">
          <li className="flex items-start gap-2">
            <span className="text-aqua">✓</span>
            <span>A personalized ROI estimate based on your inputs</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-aqua">✓</span>
            <span>A breakdown of time savings, cost reduction, and opportunity impact</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-aqua">✓</span>
            <span>Clear assumptions you can review or challenge</span>
          </li>
        </ul>
      </div>

      {/* What this is not */}
      <div className="bg-surface-3 border border-stroke-2 rounded-xl p-6 mb-8 text-left">
        <h3 className="font-display text-dh3 text-ink-0 mb-2">What This Is Not</h3>
        <p className="text-ink-2">
          This is not a sales quote and not a commitment. It&apos;s a transparent estimate to help you decide if automation is worth exploring.
        </p>
      </div>

      {/* Primary button */}
      <DarkButton onClick={onStart} size="lg" className="mb-3">
        Start the ROI Assessment
      </DarkButton>

      {/* Secondary reassurance */}
      <p className="text-sm text-ink-3">
        No email required • Takes ~2 minutes
      </p>
    </div>
  );
}
