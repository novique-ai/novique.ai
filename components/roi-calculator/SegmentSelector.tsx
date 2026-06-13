'use client';

import { ROISegment, SEGMENT_META, ALL_SEGMENTS } from '@/lib/roi/segments';

interface SegmentSelectorProps {
  selectedSegment: ROISegment | null;
  onSelect: (segment: ROISegment) => void;
  isDirty: boolean;
  onApplyDefaults: () => void;
}

// Icon components for each segment
function FinancialIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
      />
    </svg>
  );
}

function HealthcareIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
      />
    </svg>
  );
}

function LogisticsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
      />
    </svg>
  );
}

function RealEstateIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
      />
    </svg>
  );
}

const SEGMENT_ICONS: Record<ROISegment, React.ComponentType<{ className?: string }>> = {
  financial: FinancialIcon,
  healthcare: HealthcareIcon,
  logistics: LogisticsIcon,
  realestate: RealEstateIcon,
};

export default function SegmentSelector({
  selectedSegment,
  onSelect,
  isDirty,
  onApplyDefaults,
}: SegmentSelectorProps) {
  return (
    <div className="mb-8">
      <div className="mb-4">
        <h3 className="font-display text-dh3 text-ink-0 mb-1">
          What best describes your business?
        </h3>
        <p className="text-sm text-ink-2">
          Select an industry to pre-fill with typical values, or skip to enter your own.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {ALL_SEGMENTS.map((segmentId) => {
          const meta = SEGMENT_META[segmentId];
          const Icon = SEGMENT_ICONS[segmentId];
          const isSelected = selectedSegment === segmentId;

          return (
            <button
              key={segmentId}
              type="button"
              onClick={() => onSelect(segmentId)}
              className={`
                relative p-4 rounded-xl border text-left transition-all
                ${
                  isSelected
                    ? 'border-stroke-accent bg-surface-3 shadow-glow'
                    : 'border-stroke-1 bg-surface-2 hover:border-stroke-2 hover:bg-surface-3'
                }
              `}
            >
              {/* Selected checkmark badge */}
              {isSelected ? (
                <span className="absolute -top-2 -right-2 flex items-center gap-1 px-2 py-0.5 font-mono text-[0.65rem] uppercase tracking-wider rounded-full bg-aqua text-[#04110d]">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Selected
                </span>
              ) : (
                <span className="absolute -top-2 -right-2 px-2 py-0.5 font-mono text-[0.65rem] uppercase tracking-wider rounded-full border border-stroke-1 bg-surface-3 text-ink-3">
                  Example
                </span>
              )}

              <Icon
                className={`w-6 h-6 mb-2 ${
                  isSelected ? 'text-aqua' : 'text-ink-3'
                }`}
              />

              <h4
                className={`font-medium text-sm leading-tight mb-1 ${
                  isSelected ? 'text-ink-0' : 'text-ink-1'
                }`}
              >
                {meta.label}
              </h4>

              <p className="text-xs text-ink-2 leading-tight">{meta.subtitle}</p>

              {/* Using example values micro-label when selected and not dirty */}
              {isSelected && !isDirty && (
                <p className="mt-2 text-xs text-aqua font-medium">
                  Using example values
                </p>
              )}
            </button>
          );
        })}
      </div>

      {/* Reassurance text */}
      <p className="mt-3 text-xs text-ink-3 text-center">
        You can edit all values — these are just starting points.
      </p>

      {/* Apply defaults button - show when segment selected and form is dirty */}
      {selectedSegment && isDirty && (
        <div className="mt-4 p-3 bg-surface-3 border border-stroke-accent rounded-lg flex items-center justify-between">
          <p className="text-sm text-ink-1">
            You&apos;ve made changes. Want to use the {SEGMENT_META[selectedSegment].label.toLowerCase()} example values?
          </p>
          <button
            type="button"
            onClick={onApplyDefaults}
            className="ml-4 px-3 py-1.5 text-sm font-medium text-aqua border border-stroke-accent hover:bg-white/[0.04] rounded-lg transition-colors whitespace-nowrap"
          >
            Apply example values
          </button>
        </div>
      )}
    </div>
  );
}
