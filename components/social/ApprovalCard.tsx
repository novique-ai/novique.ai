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
    <article className="bg-white shadow rounded-lg overflow-hidden">
      <div className="p-6 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <time
            dateTime={requestedAt}
            className="text-xs text-gray-500 whitespace-nowrap"
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

        <div className="border-t border-gray-200 pt-5">
          <label
            htmlFor={`approval-notes-${id}`}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Notes <span className="font-normal text-gray-500">(optional)</span>
          </label>
          <textarea
            id={`approval-notes-${id}`}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            maxLength={4000}
            rows={2}
            disabled={deciding}
            placeholder="Add context for this decision..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
          />
          <div className="mt-3 flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={() => onDecision(id, 'rejected', notes.trim() || undefined)}
              disabled={deciding}
              className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deciding ? 'Saving...' : 'Reject'}
            </button>
            <button
              type="button"
              onClick={() => onDecision(id, 'approved', notes.trim() || undefined)}
              disabled={deciding}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deciding ? 'Saving...' : 'Approve'}
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}
