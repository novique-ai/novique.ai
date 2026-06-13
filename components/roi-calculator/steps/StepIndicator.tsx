'use client';

import { Step } from '@/hooks/useROICalculator';

interface StepIndicatorProps {
  currentStep: Step;
  onStepClick?: (step: Step) => void;
}

const steps = [
  { num: 1 as Step, label: 'Team Info' },
  { num: 2 as Step, label: 'Workflows' },
  { num: 3 as Step, label: 'Advanced' },
];

export default function StepIndicator({ currentStep, onStepClick }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center mb-8">
      {steps.map((step, index) => (
        <div key={step.num} className="flex items-center">
          <button
            onClick={() => onStepClick?.(step.num)}
            disabled={!onStepClick}
            className={`
              flex items-center justify-center w-10 h-10 rounded-full font-semibold text-sm transition-all
              ${currentStep === step.num
                ? 'bg-aqua text-[#04110d] shadow-glow'
                : currentStep > step.num
                  ? 'bg-surface-3 text-aqua border border-stroke-accent'
                  : 'bg-surface-3 text-ink-3 border border-stroke-1'
              }
              ${onStepClick ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}
            `}
          >
            {currentStep > step.num ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              step.num
            )}
          </button>
          <span className={`
            ml-2 text-sm font-medium hidden sm:block
            ${currentStep === step.num ? 'text-ink-0' : 'text-ink-3'}
          `}>
            {step.label}
          </span>
          {index < steps.length - 1 && (
            <div className={`
              w-12 sm:w-20 h-1 mx-2 sm:mx-4 rounded
              ${currentStep > step.num ? 'bg-aqua' : 'bg-stroke-1'}
            `} />
          )}
        </div>
      ))}
    </div>
  );
}
