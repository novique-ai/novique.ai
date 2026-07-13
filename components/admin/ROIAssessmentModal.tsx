'use client'

import { useState } from 'react'

interface ROIResults {
  hoursSavedPerMonth?: number
  laborSavingsPerMonth?: number
  errorSavingsPerMonth?: number
  revenueUpliftPerMonth?: number
  totalBenefitPerMonth?: number
  netBenefitPerMonth?: number
  roiPercent?: number
  paybackMonths?: number
}

interface ROIAssessment {
  id: string
  email: string
  calculated_results: ROIResults
  industry?: string
  employees_impacted?: number
  selected_workflows?: string[]
  created_at: string
  contacted: boolean
  contacted_at?: string
  notes?: string
  converted?: boolean
  converted_at?: string
  converted_to_customer_id?: string
}

// Workflow ID to name mapping
const WORKFLOW_NAMES: Record<string, string> = {
  lead_followup: 'Lead Capture + Follow-up',
  appointment_scheduling: 'Appointment Scheduling + Reminders',
  invoice_generation: 'Invoice/Quote Generation',
  customer_intake: 'Customer Intake Forms',
  status_updates: 'Status Updates + Reporting',
  task_routing: 'Internal Task Routing',
  support_triage: 'Support Triage',
}

// Industry value to label mapping
const INDUSTRY_LABELS: Record<string, string> = {
  home_services: 'Home Services',
  professional_services: 'Professional Services',
  healthcare: 'Healthcare',
  retail: 'Retail',
  real_estate: 'Real Estate',
  construction: 'Construction',
  manufacturing: 'Manufacturing',
  other: 'Other',
}

interface ROIAssessmentModalProps {
  assessment: ROIAssessment
  isOpen: boolean
  onClose: () => void
  onUpdate?: () => void
  onDelete?: (id: string) => void
}

export function ROIAssessmentModal({
  assessment,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
}: ROIAssessmentModalProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notes, setNotes] = useState(assessment.notes || '')
  const [contacted, setContacted] = useState(assessment.contacted)

  if (!isOpen) return null

  const results = assessment.calculated_results || {}

  const formatCurrency = (value?: number) => {
    if (typeof value !== 'number') return 'N/A'
    return '$' + value.toLocaleString()
  }

  const formatPercent = (value?: number) => {
    if (typeof value !== 'number') return 'N/A'
    return value.toLocaleString() + '%'
  }

  const formatHours = (value?: number) => {
    if (typeof value !== 'number') return 'N/A'
    return value.toFixed(1) + ' hrs'
  }

  const formatMonths = (value?: number) => {
    if (typeof value !== 'number') return 'N/A'
    return value.toFixed(1) + ' months'
  }

  const handleSave = async () => {
    setIsUpdating(true)
    setError(null)

    try {
      const response = await fetch('/api/roi-assessments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: assessment.id,
          contacted,
          notes,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update assessment')
      }

      onUpdate?.()
      onClose()
    } catch (err: any) {
      console.error('Update error:', err)
      setError(err.message)
      setIsUpdating(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    setError(null)

    try {
      const response = await fetch(`/api/roi-assessments/${assessment.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete assessment')
      }

      onDelete?.(assessment.id)
      onUpdate?.()
      onClose()
    } catch (err: any) {
      console.error('Delete error:', err)
      setError(err.message)
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-surface-2 border border-stroke-0 rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stroke-0 sticky top-0 bg-surface-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-ink-0">
              ROI Assessment Details
            </h2>
            <button
              onClick={onClose}
              className="text-ink-3 hover:text-ink-1"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="px-6 py-4 space-y-6">
          {/* Converted Banner */}
          {assessment.converted && (
            <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-lg p-4 flex items-center gap-3">
              <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="font-medium text-emerald-300">Converted to Customer</p>
                {assessment.converted_at && (
                  <p className="text-sm text-emerald-400">
                    {new Date(assessment.converted_at).toLocaleDateString()}
                  </p>
                )}
              </div>
              {assessment.converted_to_customer_id && (
                <a
                  href={`/admin/customers/${assessment.converted_to_customer_id}`}
                  className="ml-auto px-3 py-1.5 text-sm font-medium text-emerald-300 bg-emerald-500/10 ring-1 ring-inset ring-emerald-500/25 hover:bg-emerald-500/20 rounded-md"
                >
                  View Customer
                </a>
              )}
            </div>
          )}

          {/* Contact Info */}
          <div className="bg-surface-1 rounded-lg p-4">
            <h3 className="font-medium text-ink-0 mb-3">Lead Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-ink-2">Email:</span>
                <p className="font-medium text-ink-0">{assessment.email}</p>
              </div>
              <div>
                <span className="text-ink-2">Submitted:</span>
                <p className="font-medium text-ink-0">
                  {new Date(assessment.created_at).toLocaleString()}
                </p>
              </div>
              {assessment.industry && (
                <div>
                  <span className="text-ink-2">Industry:</span>
                  <p className="font-medium text-ink-0">
                    {INDUSTRY_LABELS[assessment.industry] || assessment.industry}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Selected Workflows */}
          {assessment.selected_workflows && assessment.selected_workflows.length > 0 && (
            <div className="bg-aqua/10 rounded-lg p-4">
              <h3 className="font-medium text-ink-0 mb-3">Selected Workflows</h3>
              <div className="flex flex-wrap gap-2">
                {assessment.selected_workflows.map((workflowId) => (
                  <span
                    key={workflowId}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-aqua/10 text-aqua ring-1 ring-inset ring-aqua/25"
                  >
                    {WORKFLOW_NAMES[workflowId] || workflowId}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Calculated Results */}
          <div>
            <h3 className="font-medium text-ink-0 mb-3">Calculated ROI Results</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-aqua/10 rounded-lg p-4">
                <p className="text-xs text-aqua font-medium uppercase">Hours Saved/Mo</p>
                <p className="text-xl font-bold text-aqua mt-1">
                  {formatHours(results.hoursSavedPerMonth)}
                </p>
              </div>
              <div className="bg-emerald-500/10 rounded-lg p-4">
                <p className="text-xs text-emerald-300 font-medium uppercase">Labor Savings/Mo</p>
                <p className="text-xl font-bold text-emerald-300 mt-1">
                  {formatCurrency(results.laborSavingsPerMonth)}
                </p>
              </div>
              <div className="bg-amber-500/10 rounded-lg p-4">
                <p className="text-xs text-amber-300 font-medium uppercase">Error Savings/Mo</p>
                <p className="text-xl font-bold text-amber-300 mt-1">
                  {formatCurrency(results.errorSavingsPerMonth)}
                </p>
              </div>
              <div className="bg-purple-500/10 rounded-lg p-4">
                <p className="text-xs text-purple-300 font-medium uppercase">Revenue Uplift/Mo</p>
                <p className="text-xl font-bold text-purple-300 mt-1">
                  {formatCurrency(results.revenueUpliftPerMonth)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div className="bg-surface-3 rounded-lg p-4">
                <p className="text-xs text-ink-1 font-medium uppercase">Total Benefit/Mo</p>
                <p className="text-xl font-bold text-ink-0 mt-1">
                  {formatCurrency(results.totalBenefitPerMonth)}
                </p>
              </div>
              <div className="bg-green-500/10 rounded-lg p-4">
                <p className="text-xs text-green-300 font-medium uppercase">Net Benefit/Mo</p>
                <p className="text-xl font-bold text-green-300 mt-1">
                  {formatCurrency(results.netBenefitPerMonth)}
                </p>
              </div>
              <div className="bg-indigo-500/10 rounded-lg p-4">
                <p className="text-xs text-indigo-300 font-medium uppercase">ROI</p>
                <p className="text-xl font-bold text-indigo-300 mt-1">
                  {formatPercent(results.roiPercent)}
                </p>
              </div>
              <div className="bg-rose-500/10 rounded-lg p-4">
                <p className="text-xs text-rose-300 font-medium uppercase">Payback Period</p>
                <p className="text-xl font-bold text-rose-300 mt-1">
                  {formatMonths(results.paybackMonths)}
                </p>
              </div>
            </div>
          </div>

          {/* Follow-up Section */}
          <div className="border-t border-stroke-0 pt-6">
            <h3 className="font-medium text-ink-0 mb-3">Follow-up</h3>

            <label className="flex items-center gap-3 mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={contacted}
                onChange={(e) => setContacted(e.target.checked)}
                className="w-5 h-5 rounded border-stroke-1 text-aqua accent-[#2be8c2] focus:ring-aqua/60"
              />
              <span className="text-sm text-ink-1">
                Mark as contacted
                {assessment.contacted_at && (
                  <span className="text-ink-2 ml-2">
                    (contacted on {new Date(assessment.contacted_at).toLocaleDateString()})
                  </span>
                )}
              </span>
            </label>

            <div>
              <label className="block text-sm font-medium text-ink-1 mb-2">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-surface-1 border border-stroke-1 text-ink-0 placeholder-ink-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-aqua/60 focus:border-aqua/50"
                placeholder="Add follow-up notes..."
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/25 rounded-md p-4">
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-surface-1 border-t border-stroke-0 flex justify-between sticky bottom-0">
          <div>
            {showDeleteConfirm ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-red-400 font-medium">Delete this assessment?</span>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-3 py-1.5 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Yes, delete'}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="px-3 py-1.5 border border-stroke-1 rounded-md text-sm font-medium text-ink-1 bg-surface-2 hover:bg-surface-3/60 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 border border-red-500/25 rounded-md text-sm font-medium text-red-300 bg-surface-2 hover:bg-red-500/10"
              >
                Delete
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isUpdating || isDeleting}
              className="px-4 py-2 border border-stroke-1 rounded-md text-sm font-medium text-ink-1 bg-surface-2 hover:bg-surface-3/60 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isUpdating || isDeleting}
              className="px-4 py-2 border border-transparent rounded-md text-sm font-semibold text-[#04110d] bg-aqua hover:bg-aqua-bright disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
