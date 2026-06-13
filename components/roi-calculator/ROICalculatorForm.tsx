'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useROICalculator } from '@/hooks/useROICalculator';
import StepIndicator from './steps/StepIndicator';
import IntroStep from './steps/IntroStep';
import CompanyInfoStep from './steps/CompanyInfoStep';
import WorkflowsStep from './steps/WorkflowsStep';
import AdvancedOptionsStep from './steps/AdvancedOptionsStep';
import ROIResultsPanel from './results/ROIResultsPanel';
import SegmentSelector from './SegmentSelector';
import DarkButton from '@/components/marketing/DarkButton';
import { ROISegment } from '@/lib/roi/segments';

export default function ROICalculatorForm() {
  const calculator = useROICalculator();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const wizardRef = useRef<HTMLDivElement>(null);
  const hasAutoStarted = useRef(false);

  // Auto-start wizard ONLY on /roi page with ?start=1 (explicit intent from CTAs)
  // Sector pages (/roi/[segment]) should NOT auto-scroll - let users browse content first
  const isBaseROIPage = pathname === '/roi';
  const shouldAutoStart = searchParams.get('start') === '1';

  useEffect(() => {
    if (!isBaseROIPage || !shouldAutoStart) return;
    if (calculator.currentStep !== 0 || hasAutoStarted.current) return;

    hasAutoStarted.current = true;

    // Advance wizard and scroll, then remove start=1 to prevent re-triggers
    setTimeout(() => {
      calculator.nextStep();
      wizardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

      // Clean up URL - remove start=1 but keep other params like segment
      const params = new URLSearchParams(searchParams.toString());
      params.delete('start');
      const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
      router.replace(newUrl, { scroll: false });
    }, 100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBaseROIPage, shouldAutoStart]);

  // Scroll to wizard container when step changes (not to top of page)
  useEffect(() => {
    if (calculator.currentStep > 0 && wizardRef.current) {
      wizardRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [calculator.currentStep]);

  // Handle segment selection - update URL while preserving other params
  const handleSegmentSelect = useCallback(
    (segment: ROISegment) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('segment', segment);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });

      // Set segment in calculator state
      calculator.setSegment(segment);

      // Apply defaults only if form is pristine
      if (!calculator.isDirty) {
        calculator.applySegmentDefaults(segment);
      }
    },
    [searchParams, pathname, router, calculator]
  );

  // Handle apply defaults button click
  const handleApplyDefaults = useCallback(() => {
    if (calculator.segment) {
      calculator.applySegmentDefaults(calculator.segment, { force: true });
    }
  }, [calculator]);

  // Step 0: Intro/Getting Started - full width, no results panel
  if (calculator.currentStep === 0) {
    return (
      <div id="roi-assessment" ref={wizardRef} className="max-w-6xl mx-auto scroll-mt-24">
        <div className="nv-card p-6 md:p-8">
          <IntroStep onStart={calculator.nextStep} />
        </div>
      </div>
    );
  }

  return (
    <div id="roi-assessment" ref={wizardRef} className="max-w-6xl mx-auto scroll-mt-24">
      <div className="grid lg:grid-cols-5 gap-8">
        {/* Left: Form Steps (3 columns) */}
        <div className="lg:col-span-3">
          <StepIndicator
            currentStep={calculator.currentStep}
            onStepClick={calculator.goToStep}
          />

          <div className="nv-card p-6 md:p-8">
            {calculator.currentStep === 1 && (
              <>
                <SegmentSelector
                  selectedSegment={calculator.segment}
                  onSelect={handleSegmentSelect}
                  isDirty={calculator.isDirty}
                  onApplyDefaults={handleApplyDefaults}
                />
                <CompanyInfoStep
                  company={calculator.state.company}
                  costs={calculator.state.costs}
                  onUpdateCompany={calculator.updateCompany}
                  onUpdateCosts={calculator.updateCosts}
                  segment={calculator.segment}
                />
              </>
            )}

            {calculator.currentStep === 2 && (
              <WorkflowsStep
                workflows={calculator.state.workflows}
                onToggle={calculator.toggleWorkflow}
                onUpdateWorkflow={calculator.updateWorkflow}
              />
            )}

            {calculator.currentStep === 3 && (
              <AdvancedOptionsStep
                quality={calculator.state.quality}
                revenue={calculator.state.revenue}
                onUpdateQuality={calculator.updateQuality}
                onUpdateRevenue={calculator.updateRevenue}
              />
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8 pt-6 border-t border-stroke-1">
              <DarkButton variant="outline" onClick={calculator.prevStep}>
                Back
              </DarkButton>

              {calculator.currentStep < 3 ? (
                <DarkButton onClick={calculator.nextStep}>
                  Continue
                </DarkButton>
              ) : (
                <DarkButton variant="ghost" onClick={calculator.resetCalculator}>
                  Reset calculator
                </DarkButton>
              )}
            </div>
          </div>
        </div>

        {/* Right: Results Panel (2 columns) */}
        <div className="lg:col-span-2">
          <ROIResultsPanel
            results={calculator.results}
            scenario={calculator.state.scenario}
            onSetScenario={calculator.setScenario}
            qualityEnabled={calculator.state.quality.enabled}
            revenueEnabled={calculator.state.revenue.enabled}
            industry={calculator.state.company.industry}
            employeesImpacted={calculator.state.company.employeesImpacted}
            workflows={calculator.state.workflows}
            readiness={calculator.readiness}
            derivedPricing={calculator.derivedPricing}
            segment={calculator.segment}
          />
        </div>
      </div>
    </div>
  );
}
