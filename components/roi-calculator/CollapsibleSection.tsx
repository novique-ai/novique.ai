'use client';

import { useState } from 'react';

interface CollapsibleSectionProps {
  title: string;
  description: string;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  children: React.ReactNode;
}

export default function CollapsibleSection({
  title,
  description,
  enabled,
  onToggle,
  children,
}: CollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(enabled);

  const handleToggle = () => {
    const newEnabled = !enabled;
    onToggle(newEnabled);
    if (newEnabled) {
      setIsExpanded(true);
    }
  };

  return (
    <div className={`
      border rounded-lg transition-all
      ${enabled ? 'border-stroke-accent bg-surface-3' : 'border-stroke-1 bg-surface-2'}
    `}>
      <div className="p-4">
        <div className="flex items-start gap-4">
          <label className="flex items-center cursor-pointer mt-1">
            <input
              type="checkbox"
              checked={enabled}
              onChange={handleToggle}
              className="w-5 h-5 rounded border-stroke-1 bg-surface-3 text-aqua focus:ring-aqua"
            />
          </label>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className={`font-semibold ${enabled ? 'text-ink-0' : 'text-ink-1'}`}>
                {title}
              </h3>
              {enabled && (
                <button
                  type="button"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-sm text-link hover:text-link-hover flex items-center gap-1"
                >
                  {isExpanded ? 'Collapse' : 'Expand'}
                  <svg
                    className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              )}
            </div>
            <p className="text-sm text-ink-2 mt-1">{description}</p>
          </div>
        </div>
      </div>

      {enabled && isExpanded && (
        <div className="px-4 pb-4 pt-2 border-t border-stroke-1 bg-surface-2 rounded-b-lg">
          {children}
        </div>
      )}
    </div>
  );
}
