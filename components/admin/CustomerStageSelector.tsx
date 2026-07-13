'use client'

import { useState, useRef, useEffect } from 'react'

const STAGE_CONFIG: Record<string, { label: string; className: string; dotColor: string }> = {
  consultation_requested: {
    label: 'Consultation Requested',
    className: 'bg-aqua/10 text-aqua ring-1 ring-inset ring-aqua/25',
    dotColor: 'bg-blue-400',
  },
  consultation_in_progress: {
    label: 'Consultation In Progress',
    className: 'bg-aqua/20 text-aqua ring-1 ring-inset ring-aqua/25',
    dotColor: 'bg-blue-400',
  },
  consultation_completed: {
    label: 'Consultation Done',
    className: 'bg-indigo-500/10 text-indigo-300 ring-1 ring-inset ring-indigo-500/25',
    dotColor: 'bg-indigo-400',
  },
  proposal_development: {
    label: 'Developing Proposal',
    className: 'bg-purple-500/10 text-purple-300 ring-1 ring-inset ring-purple-500/25',
    dotColor: 'bg-purple-400',
  },
  proposal_sent: {
    label: 'Proposal Sent',
    className: 'bg-cyan-500/10 text-cyan-300 ring-1 ring-inset ring-cyan-500/25',
    dotColor: 'bg-cyan-400',
  },
  negotiation: {
    label: 'Negotiating',
    className: 'bg-yellow-500/10 text-yellow-300 ring-1 ring-inset ring-yellow-500/25',
    dotColor: 'bg-yellow-400',
  },
  project_active: {
    label: 'Project Active',
    className: 'bg-green-500/10 text-green-300 ring-1 ring-inset ring-green-500/25',
    dotColor: 'bg-green-400',
  },
  implementation: {
    label: 'Implementing',
    className: 'bg-teal-500/10 text-teal-300 ring-1 ring-inset ring-teal-500/25',
    dotColor: 'bg-teal-400',
  },
  delivered: {
    label: 'Delivered',
    className: 'bg-emerald-500/10 text-emerald-300 ring-1 ring-inset ring-emerald-500/25',
    dotColor: 'bg-emerald-400',
  },
  signed_off: {
    label: 'Signed Off',
    className: 'bg-lime-500/10 text-lime-300 ring-1 ring-inset ring-lime-500/25',
    dotColor: 'bg-lime-400',
  },
  closed_won: {
    label: 'Closed Won',
    className: 'bg-green-500/20 text-green-300 ring-1 ring-inset ring-green-500/25 font-semibold',
    dotColor: 'bg-green-400',
  },
  closed_lost: {
    label: 'Closed Lost',
    className: 'bg-surface-3 text-ink-2 ring-1 ring-inset ring-stroke-1',
    dotColor: 'bg-gray-400',
  },
}

const STAGE_ORDER = [
  'consultation_requested',
  'consultation_in_progress',
  'consultation_completed',
  'proposal_development',
  'proposal_sent',
  'negotiation',
  'project_active',
  'implementation',
  'delivered',
  'signed_off',
  'closed_won',
  'closed_lost',
]

interface CustomerStageSelectorProps {
  customerId: string
  currentStage: string
  onStageChanged: (newStage: string) => void
  disabled?: boolean
}

export function CustomerStageSelector({
  customerId,
  currentStage,
  onStageChanged,
  disabled,
}: CustomerStageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [pendingStage, setPendingStage] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const config = STAGE_CONFIG[currentStage] || {
    label: currentStage,
    className: 'bg-surface-3 text-ink-1',
    dotColor: 'bg-gray-400',
  }

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setPendingStage(null)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleConfirm = async () => {
    if (!pendingStage) return
    setIsUpdating(true)
    try {
      const res = await fetch(`/api/customers/${customerId}/stage`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: pendingStage }),
      })
      if (!res.ok) throw new Error('Failed to update stage')
      onStageChanged(pendingStage)
      setIsOpen(false)
      setPendingStage(null)
    } catch (error) {
      console.error('Stage update failed:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Badge button */}
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`px-3 py-1 inline-flex items-center gap-1.5 text-xs leading-5 font-semibold rounded-full ${config.className} ${
          disabled ? 'opacity-60 cursor-default' : 'cursor-pointer hover:ring-2 hover:ring-offset-1 hover:ring-offset-surface-0 hover:ring-stroke-1'
        }`}
        title={disabled ? undefined : 'Click to change stage'}
      >
        {config.label}
        {!disabled && (
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-surface-2 rounded-lg shadow-lg border border-stroke-0 z-50">
          {pendingStage ? (
            // Confirmation view
            <div className="p-3">
              <p className="text-sm text-ink-1 mb-3">
                Change to <span className="font-semibold">{STAGE_CONFIG[pendingStage]?.label}</span>?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleConfirm}
                  disabled={isUpdating}
                  className="flex-1 px-3 py-1.5 text-sm font-semibold text-[#04110d] bg-aqua rounded-md hover:bg-aqua-bright disabled:opacity-50"
                >
                  {isUpdating ? 'Updating...' : 'Confirm'}
                </button>
                <button
                  onClick={() => setPendingStage(null)}
                  disabled={isUpdating}
                  className="flex-1 px-3 py-1.5 text-sm font-medium text-ink-1 bg-surface-3 rounded-md hover:bg-surface-3/60 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            // Stage list
            <div className="py-1 max-h-80 overflow-y-auto">
              {STAGE_ORDER.map((stage) => {
                const sc = STAGE_CONFIG[stage]
                const isCurrent = stage === currentStage
                return (
                  <button
                    key={stage}
                    onClick={() => !isCurrent && setPendingStage(stage)}
                    className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 ${
                      isCurrent
                        ? 'bg-surface-1 text-ink-2 cursor-default'
                        : 'hover:bg-surface-3/60 text-ink-1'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${sc.dotColor}`} />
                    <span className="flex-1">{sc.label}</span>
                    {isCurrent && (
                      <svg className="w-4 h-4 text-aqua" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
