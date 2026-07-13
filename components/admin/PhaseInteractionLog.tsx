'use client'

import { useState } from 'react'
import type { CrmPhase, Interaction } from '@/types/crm'

interface PhaseInteractionLogProps {
  interactions: Interaction[]
  customerId: string
  phase: CrmPhase
  customerNumber?: string
  onAdded: () => void
}

export function PhaseInteractionLog({
  interactions,
  customerId,
  phase,
  customerNumber,
  onAdded,
}: PhaseInteractionLogProps) {
  const [showForm, setShowForm] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    interaction_type: 'meeting' as string,
    subject: '',
    notes: '',
    interaction_date: new Date().toISOString().slice(0, 16),
  })

  const handleSubmit = async () => {
    if (!form.subject.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`/api/customers/${customerId}/interactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          phase,
          interaction_date: form.interaction_date
            ? new Date(form.interaction_date).toISOString()
            : new Date().toISOString(),
        }),
      })
      if (res.ok) {
        setForm({
          interaction_type: 'meeting',
          subject: '',
          notes: '',
          interaction_date: new Date().toISOString().slice(0, 16),
        })
        setShowForm(false)
        onAdded()
      }
    } catch (e) {
      console.error('Failed to add interaction:', e)
    } finally {
      setSaving(false)
    }
  }

  const typeIcons: Record<string, string> = {
    meeting: '🗓️',
    call: '📞',
    email: '📧',
    note: '📝',
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  return (
    <div className="border border-stroke-0 rounded-lg">
      <div className="flex items-center justify-between px-4 py-3 bg-surface-1 border-b border-stroke-0 rounded-t-lg">
        <h4 className="text-sm font-semibold text-ink-1">
          Communication Log
          {customerNumber && <span className="ml-2 text-xs font-mono text-ink-3">#{customerNumber}</span>}
        </h4>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-xs font-medium text-aqua hover:text-aqua-bright"
        >
          {showForm ? 'Cancel' : '+ Add Entry'}
        </button>
      </div>

      {showForm && (
        <div className="p-4 border-b border-stroke-0 bg-aqua/10 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-ink-1 mb-1">Type</label>
              <select
                value={form.interaction_type}
                onChange={(e) => setForm({ ...form, interaction_type: e.target.value })}
                className="block w-full text-sm rounded-md bg-surface-1 border-stroke-1 text-ink-0 placeholder-ink-3 shadow-sm focus:border-aqua/50 focus:ring-aqua/60"
              >
                <option value="meeting">Meeting</option>
                <option value="call">Call</option>
                <option value="email">Email</option>
                <option value="note">Note</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-1 mb-1">Date/Time</label>
              <input
                type="datetime-local"
                value={form.interaction_date}
                onChange={(e) => setForm({ ...form, interaction_date: e.target.value })}
                className="block w-full text-sm rounded-md bg-surface-1 border-stroke-1 text-ink-0 placeholder-ink-3 shadow-sm focus:border-aqua/50 focus:ring-aqua/60"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-1 mb-1">Topic / Subject</label>
            <input
              type="text"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              placeholder="e.g. Discovery call with client"
              className="block w-full text-sm rounded-md bg-surface-1 border-stroke-1 text-ink-0 placeholder-ink-3 shadow-sm focus:border-aqua/50 focus:ring-aqua/60"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-1 mb-1">Summary / Notes</label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Key points discussed..."
              className="block w-full text-sm rounded-md bg-surface-1 border-stroke-1 text-ink-0 placeholder-ink-3 shadow-sm focus:border-aqua/50 focus:ring-aqua/60"
            />
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={saving || !form.subject.trim()}
              className="px-3 py-1.5 text-xs font-semibold text-[#04110d] bg-aqua hover:bg-aqua-bright rounded-md disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Entry'}
            </button>
          </div>
        </div>
      )}

      <div className="divide-y divide-stroke-0 max-h-80 overflow-y-auto">
        {interactions.length === 0 ? (
          <p className="text-sm text-ink-3 text-center py-6">No communication entries yet</p>
        ) : (
          <>
            {interactions.map((item) => {
              const isExpanded = expandedId === item.id
              return (
                <div
                  key={item.id}
                  className="px-4 py-3 hover:bg-surface-3/60 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-base mt-0.5">{typeIcons[item.interaction_type] || '•'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="text-sm font-medium text-ink-0 truncate">
                          {customerNumber && <span className="font-mono text-xs text-ink-3 mr-1.5">#{customerNumber}</span>}
                          {item.subject || 'No subject'}
                        </p>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-ink-3 whitespace-nowrap">
                            {formatDate(item.interaction_date)}
                          </span>
                          <svg
                            className={`w-3.5 h-3.5 text-ink-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                      {!isExpanded && item.notes && (
                        <p className="text-xs text-ink-1 mt-1 whitespace-pre-wrap line-clamp-2">
                          {item.notes}
                        </p>
                      )}
                      {isExpanded && (
                        <div className="mt-2 space-y-2">
                          <div className="flex items-center gap-3 text-xs text-ink-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-surface-3 font-medium capitalize">
                              {item.interaction_type}
                            </span>
                            {item.created_by_profile?.full_name && (
                              <span>by {item.created_by_profile.full_name}</span>
                            )}
                          </div>
                          {item.notes && (
                            <p className="text-sm text-ink-1 whitespace-pre-wrap bg-surface-2 border border-stroke-0 rounded-md p-3">
                              {item.notes}
                            </p>
                          )}
                        </div>
                      )}
                      {!isExpanded && item.created_by_profile?.full_name && (
                        <p className="text-xs text-ink-3 mt-1">
                          by {item.created_by_profile.full_name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}
