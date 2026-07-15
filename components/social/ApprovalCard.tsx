'use client'

import { useState, type ReactNode } from 'react'

interface ApprovalCardProps {
  id: string
  title: string
  requestedAt: string
  deciding: boolean
  onDecision: (
    id: string,
    decision: 'approved' | 'rejected',
    notes?: string
  ) => Promise<void>
  children?: ReactNode
}

export default function ApprovalCard({
  id,
  title,
  requestedAt,
  deciding,
  onDecision,
  children,
}: ApprovalCardProps) {
  const [notes, setNotes] = useState('')

  return (
    <article className="bg-surface-2 border border-stroke-0 shadow rounded-lg overflow-hidden">
      <div className="p-6 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h3 className="text-lg font-semibold text-ink-0">{title}</h3>
          <time
            dateTime={requestedAt}
            className="text-xs text-ink-3 whitespace-nowrap"
          >
            Requested{' '}
            {new Date(requestedAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </time>
        </div>

        {children}

        <div className="border-t border-stroke-0 pt-5">
          <label
            htmlFor={`approval-notes-${id}`}
            className="block text-sm font-medium text-ink-1 mb-1"
          >
            Notes <span className="font-normal text-ink-3">(optional)</span>
          </label>
          <textarea
            id={`approval-notes-${id}`}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            maxLength={4000}
            rows={2}
            disabled={deciding}
            placeholder="Add context for this decision..."
            className="w-full px-3 py-2 bg-surface-1 border border-stroke-1 text-ink-0 placeholder-ink-3 rounded-md text-sm focus:ring-2 focus:ring-aqua/60 focus:border-transparent disabled:bg-surface-3/40 disabled:text-ink-2"
          />
          <div className="mt-3 flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={() => onDecision(id, 'rejected', notes.trim() || undefined)}
              disabled={deciding}
              className="inline-flex items-center px-4 py-2 border border-red-500/25 text-sm font-medium rounded-md text-red-300 bg-red-500/10 hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deciding ? 'Saving...' : 'Reject'}
            </button>
            <button
              type="button"
              onClick={() => onDecision(id, 'approved', notes.trim() || undefined)}
              disabled={deciding}
              className="inline-flex items-center px-4 py-2 border border-emerald-500/25 text-sm font-medium rounded-md shadow-sm text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deciding ? 'Saving...' : 'Approve'}
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}
