'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useCustomerEditor } from '@/hooks/useCustomerEditor'
import { useAutoSave } from '@/hooks/useAutoSave'
import { CustomerStageSelector } from '@/components/admin/CustomerStageSelector'
import { ProjectHealthIndicator } from '@/components/admin/ProjectHealthIndicator'
import { InteractionTimeline } from '@/components/admin/InteractionTimeline'
import { ConsultationSection } from '@/components/admin/customer-sections/ConsultationSection'
import { ProposalSection } from '@/components/admin/customer-sections/ProposalSection'
import { AgreementSection } from '@/components/admin/customer-sections/AgreementSection'
import { DeliverySection } from '@/components/admin/customer-sections/DeliverySection'
import { ImplementationSection } from '@/components/admin/customer-sections/ImplementationSection'
import { SignoffSection } from '@/components/admin/customer-sections/SignoffSection'
import Link from 'next/link'
import type { Interaction, ActionItem, AdminUser, CrmPhase } from '@/types/crm'

export default function CustomerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const customerId = params.id as string

  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [interactions, setInteractions] = useState<Interaction[]>([])
  const [actionItems, setActionItems] = useState<ActionItem[]>([])
  const [showAddInteraction, setShowAddInteraction] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([])
  const [newInteraction, setNewInteraction] = useState({
    interaction_type: 'note',
    subject: '',
    notes: '',
    interaction_date: '',
    phase: '' as string,
  })

  // ROI Assessment selection for new customers
  const [roiAssessments, setRoiAssessments] = useState<any[]>([])
  const [selectedRoiId, setSelectedRoiId] = useState<string>('')
  const [loadingRoi, setLoadingRoi] = useState(false)

  // Delete/Archive confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const { formData, updateField, errors, saveCustomer, addInteraction, isSaving } =
    useCustomerEditor({})

  // Load admin users
  useEffect(() => {
    async function loadAdminUsers() {
      try {
        const response = await fetch('/api/admin/users')
        if (response.ok) {
          const result = await response.json()
          const admins = (result.data || []).filter((u: any) => u.role === 'admin')
          setAdminUsers(admins)
        }
      } catch (error) {
        console.error('Failed to load admin users:', error)
      }
    }
    loadAdminUsers()
  }, [])

  // Load non-converted ROI assessments for new customer creation
  useEffect(() => {
    if (customerId !== 'new') return

    async function loadRoiAssessments() {
      setLoadingRoi(true)
      try {
        const response = await fetch('/api/roi-assessments?converted=false')
        if (response.ok) {
          const result = await response.json()
          setRoiAssessments(result.data || [])
        }
      } catch (error) {
        console.error('Failed to load ROI assessments:', error)
      } finally {
        setLoadingRoi(false)
      }
    }
    loadRoiAssessments()
  }, [customerId])

  // Handle ROI assessment selection
  const handleRoiSelect = (roiId: string) => {
    setSelectedRoiId(roiId)

    if (!roiId) {
      updateField('roi_assessment_id', undefined)
      updateField('roi_estimate', undefined)
      return
    }

    const assessment = roiAssessments.find((a) => a.id === roiId)
    if (!assessment) return

    const industryMap: Record<string, string> = {
      home_services: 'other',
      professional_services: 'professional',
      healthcare: 'healthcare',
      retail: 'retail',
      real_estate: 'professional',
      construction: 'manufacturing',
      manufacturing: 'manufacturing',
      other: 'other',
    }

    updateField('roi_assessment_id', assessment.id)
    updateField('email', assessment.email)
    updateField('roi_estimate', assessment.calculated_results)

    if (assessment.industry) {
      updateField('business_type', industryMap[assessment.industry] || 'other')
    }

    if (assessment.employees_impacted) {
      const emp = assessment.employees_impacted
      let businessSize = ''
      if (emp <= 5) businessSize = '1-5'
      else if (emp <= 20) businessSize = '6-20'
      else if (emp <= 50) businessSize = '21-50'
      else businessSize = '51+'
      updateField('business_size', businessSize)
    }

    if (assessment.selected_workflows?.length > 0) {
      const workflowNames: Record<string, string> = {
        lead_followup: 'Lead Capture + Follow-up',
        appointment_scheduling: 'Appointment Scheduling + Reminders',
        invoice_generation: 'Invoice/Quote Generation',
        customer_intake: 'Customer Intake Forms',
        status_updates: 'Status Updates + Reporting',
        task_routing: 'Internal Task Routing',
        support_triage: 'Support Triage',
      }
      const workflows = assessment.selected_workflows
        .map((w: string) => workflowNames[w] || w)
        .join(', ')
      updateField('initial_challenges', `Interested in automation for: ${workflows}`)
    }
  }

  // Refresh callbacks
  const refreshInteractions = useCallback(async () => {
    if (customerId === 'new') return
    try {
      const res = await fetch(`/api/customers/${customerId}/interactions`)
      const result = await res.json()
      setInteractions(result.data || [])
    } catch (e) {
      console.error('Failed to refresh interactions:', e)
    }
  }, [customerId])

  const refreshActionItems = useCallback(async () => {
    if (customerId === 'new') return
    try {
      const res = await fetch(`/api/customers/${customerId}/action-items`)
      const result = await res.json()
      setActionItems(result.data || [])
    } catch (e) {
      console.error('Failed to refresh action items:', e)
    }
  }, [customerId])

  // Load customer data
  useEffect(() => {
    async function loadCustomer() {
      if (customerId === 'new') {
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/customers/${customerId}`)
        if (!response.ok) throw new Error('Failed to load customer')

        const result = await response.json()
        const customer = result.data

        Object.keys(customer).forEach((key) => {
          if (key !== 'interactions') {
            updateField(key as any, customer[key])
          }
        })

        setInteractions(customer.interactions || [])
        setLoading(false)
      } catch (error) {
        console.error('Load error:', error)
        setLoading(false)
      }
    }

    loadCustomer()
  }, [customerId])

  // Load action items
  useEffect(() => {
    if (customerId === 'new') return
    refreshActionItems()
  }, [customerId, refreshActionItems])

  // Auto-save (disabled for new customers)
  const { lastSaved, error: autoSaveError } = useAutoSave({
    onSave: async () => {
      if (formData.name && formData.email) {
        await saveCustomer()
      }
    },
    interval: 30000,
    enabled: !!formData.name && customerId !== 'new',
  })

  useEffect(() => {
    if (autoSaveError) {
      setSaveError(`Auto-save failed: ${autoSaveError.message}`)
    }
  }, [autoSaveError])

  const handleAddInteraction = async () => {
    try {
      await addInteraction({
        ...newInteraction,
        phase: newInteraction.phase || undefined,
        interaction_date: newInteraction.interaction_date
          ? new Date(newInteraction.interaction_date).toISOString()
          : undefined,
      })
      await refreshInteractions()
      setShowAddInteraction(false)
      setNewInteraction({ interaction_type: 'note', subject: '', notes: '', interaction_date: '', phase: '' })
    } catch (error) {
      console.error('Failed to add interaction:', error)
    }
  }

  const handleArchive = async () => {
    if (!formData.id) return
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/customers/${formData.id}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to archive customer')
      router.push('/admin/customers')
    } catch (error) {
      console.error('Archive error:', error)
      setSaveError('Failed to archive customer')
      setIsDeleting(false)
      setShowArchiveConfirm(false)
    }
  }

  const handleDelete = async () => {
    if (!formData.id) return
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/customers/${formData.id}?permanent=true`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete customer')
      router.push('/admin/customers')
    } catch (error) {
      console.error('Delete error:', error)
      setSaveError('Failed to delete customer')
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  // Phase helpers
  const getPhaseInteractions = (phase: CrmPhase): Interaction[] =>
    interactions.filter((i) => i.phase === phase)

  const getPhaseActionItems = (phase: CrmPhase): ActionItem[] =>
    actionItems.filter((i) => i.phase === phase)

  const getPhaseOpenCount = (phase: CrmPhase): number =>
    actionItems.filter((i) => i.phase === phase && i.status === 'open').length

  const phases: CrmPhase[] = ['consultation', 'proposal', 'agreement', 'delivery', 'implementation', 'signoff']
  const totalOpenActions = phases.reduce((sum, p) => sum + getPhaseOpenCount(p), 0)

  const tabs = [
    { id: 'overview', name: 'Overview' },
    { id: 'consultation', name: 'Consultation', badge: getPhaseOpenCount('consultation') },
    { id: 'proposal', name: 'Proposal', badge: getPhaseOpenCount('proposal') },
    { id: 'agreement', name: 'Agreement', badge: getPhaseOpenCount('agreement') },
    { id: 'delivery', name: 'Delivery', badge: getPhaseOpenCount('delivery') },
    { id: 'implementation', name: 'Implementation', badge: getPhaseOpenCount('implementation') },
    { id: 'signoff', name: 'Sign-off', badge: getPhaseOpenCount('signoff') },
    { id: 'timeline', name: 'Timeline' },
  ]

  if (loading) {
    return <div className="text-center py-12">Loading customer...</div>
  }

  const sectionProps = (phase: CrmPhase) => ({
    formData,
    updateField,
    interactions: getPhaseInteractions(phase),
    actionItems: getPhaseActionItems(phase),
    customerId,
    customerNumber: formData.customer_number,
    adminUsers,
    onInteractionsChanged: refreshInteractions,
    onActionItemsChanged: refreshActionItems,
  })

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-4">
          <li>
            <Link href="/admin/customers" className="text-ink-3 hover:text-ink-2">
              Customers
            </Link>
          </li>
          <li>
            <div className="flex items-center">
              <svg
                className="flex-shrink-0 h-5 w-5 text-ink-3"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
              </svg>
              <span className="ml-4 text-sm font-medium text-ink-2">
                {formData.customer_number ? `#${formData.customer_number} — ` : ''}{formData.name || 'New Customer'}
              </span>
            </div>
          </li>
        </ol>
      </nav>

      {/* Error Message */}
      {saveError && (
        <div className="bg-red-500/10 border border-red-500/25 text-red-300 px-4 py-3 rounded-lg flex items-start gap-3">
          <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <div className="flex-1">
            <h3 className="font-semibold mb-1">Save Failed</h3>
            <p className="text-sm">{saveError}</p>
          </div>
          <button onClick={() => setSaveError(null)} className="text-red-400 hover:text-red-300">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      {/* Header */}
      <div className="bg-surface-2 shadow rounded-lg p-6">
        <div className="flex justify-between items-start">
          <div className="flex items-start gap-4">
            {formData.avatar_url ? (
              <img
                src={formData.avatar_url}
                alt={formData.name}
                className="h-16 w-16 rounded-full"
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-surface-3 border border-stroke-1 flex items-center justify-center text-aqua font-bold text-xl">
                {formData.name?.[0]?.toUpperCase() || '?'}
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold text-ink-0">
                {formData.name || 'New Customer'}
                {formData.customer_number && (
                  <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-surface-3 text-ink-1">
                    #{formData.customer_number}
                  </span>
                )}
              </h1>
              <p className="mt-1 text-sm text-ink-2">{formData.email || 'Enter customer details below'}</p>
              {formData.phone && <p className="text-sm text-ink-2">{formData.phone}</p>}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <CustomerStageSelector
              customerId={customerId}
              currentStage={formData.stage}
              onStageChanged={(newStage) => {
                updateField('stage', newStage)
                refreshInteractions()
              }}
              disabled={customerId === 'new'}
            />
            <ProjectHealthIndicator status={formData.project_status} />
            {totalOpenActions > 0 && (
              <span className="text-xs text-aqua font-medium">
                {totalOpenActions} open action{totalOpenActions !== 1 ? 's' : ''}
              </span>
            )}
            {lastSaved && (
              <p className="text-xs text-ink-2">
                Last saved: {new Date(lastSaved).toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-surface-2 shadow rounded-lg">
        <div className="border-b border-stroke-0">
          <nav className="-mb-px flex space-x-8 px-6 overflow-x-auto" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'border-aqua text-aqua'
                    : 'border-transparent text-ink-2 hover:text-ink-1 hover:border-stroke-1'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-1.5`}
              >
                {tab.name}
                {tab.badge ? (
                  <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-aqua/10 text-aqua ring-1 ring-inset ring-aqua/25">
                    {tab.badge}
                  </span>
                ) : null}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* ROI Assessment Selector - Only for new customers */}
              {customerId === 'new' && (
                <div className="bg-aqua/10 border border-aqua/30 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-aqua mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Import from ROI Assessment (Optional)
                  </h4>
                  <p className="text-xs text-aqua mb-3">
                    Select an ROI assessment to auto-populate customer details
                  </p>
                  <select
                    value={selectedRoiId}
                    onChange={(e) => handleRoiSelect(e.target.value)}
                    disabled={loadingRoi}
                    className="block w-full rounded-md bg-surface-1 border-aqua/30 text-ink-0 shadow-sm focus:border-aqua/50 focus:ring-aqua/60 text-sm"
                  >
                    <option value="">-- Manual Entry (no assessment) --</option>
                    {roiAssessments.map((assessment) => {
                      const results = assessment.calculated_results || {}
                      const benefit = results.totalBenefitPerMonth
                        ? `$${results.totalBenefitPerMonth.toLocaleString()}/mo`
                        : 'N/A'
                      return (
                        <option key={assessment.id} value={assessment.id}>
                          {assessment.email} - Est. {benefit} (
                          {new Date(assessment.created_at).toLocaleDateString()})
                        </option>
                      )
                    })}
                  </select>
                  {loadingRoi && <p className="text-xs text-aqua mt-1">Loading assessments...</p>}
                  {!loadingRoi && roiAssessments.length === 0 && (
                    <p className="text-xs text-aqua mt-1">No unconverted ROI assessments available</p>
                  )}
                  <label className="flex items-center gap-2 mt-3">
                    <input
                      type="checkbox"
                      checked={formData.is_test || false}
                      onChange={(e) => updateField('is_test', e.target.checked)}
                      className="h-4 w-4 rounded border-stroke-1 accent-[#2be8c2] focus:ring-aqua/60"
                    />
                    <span className="text-sm text-aqua">Test Customer</span>
                  </label>
                  <p className="text-xs text-aqua mt-1">
                    Test customers get IDs in the 0001-0999 range
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-ink-1">Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    className="mt-1 block w-full rounded-md bg-surface-1 border-stroke-1 text-ink-0 placeholder-ink-3 shadow-sm focus:border-aqua/50 focus:ring-aqua/60"
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-400">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-1">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    className="mt-1 block w-full rounded-md bg-surface-1 border-stroke-1 text-ink-0 placeholder-ink-3 shadow-sm focus:border-aqua/50 focus:ring-aqua/60"
                  />
                  {errors.email && <p className="mt-1 text-sm text-red-400">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-1">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone || ''}
                    onChange={(e) => updateField('phone', e.target.value)}
                    className="mt-1 block w-full rounded-md bg-surface-1 border-stroke-1 text-ink-0 placeholder-ink-3 shadow-sm focus:border-aqua/50 focus:ring-aqua/60"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-1">Business Type</label>
                  <select
                    value={formData.business_type || ''}
                    onChange={(e) => updateField('business_type', e.target.value)}
                    className="mt-1 block w-full rounded-md bg-surface-1 border-stroke-1 text-ink-0 placeholder-ink-3 shadow-sm focus:border-aqua/50 focus:ring-aqua/60"
                  >
                    <option value="">Select industry...</option>
                    <option value="retail">Retail</option>
                    <option value="restaurant">Restaurant/Food Service</option>
                    <option value="professional">Professional Services</option>
                    <option value="healthcare">Healthcare</option>
                    <option value="ecommerce">E-commerce</option>
                    <option value="manufacturing">Manufacturing</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-1">Business Size</label>
                  <select
                    value={formData.business_size || ''}
                    onChange={(e) => updateField('business_size', e.target.value)}
                    className="mt-1 block w-full rounded-md bg-surface-1 border-stroke-1 text-ink-0 placeholder-ink-3 shadow-sm focus:border-aqua/50 focus:ring-aqua/60"
                  >
                    <option value="">Select size...</option>
                    <option value="1-5">1-5 employees</option>
                    <option value="6-20">6-20 employees</option>
                    <option value="21-50">21-50 employees</option>
                    <option value="51+">51+ employees</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-1">Project Status</label>
                  <select
                    value={formData.project_status}
                    onChange={(e) => updateField('project_status', e.target.value)}
                    className="mt-1 block w-full rounded-md bg-surface-1 border-stroke-1 text-ink-0 placeholder-ink-3 shadow-sm focus:border-aqua/50 focus:ring-aqua/60"
                  >
                    <option value="on_track">On Track</option>
                    <option value="at_risk">At Risk</option>
                    <option value="delayed">Delayed</option>
                    <option value="blocked">Blocked</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-1">Assigned to</label>
                  <select
                    value={formData.assigned_admin_id || ''}
                    onChange={(e) => updateField('assigned_admin_id', e.target.value)}
                    className="mt-1 block w-full rounded-md bg-surface-1 border-stroke-1 text-ink-0 placeholder-ink-3 shadow-sm focus:border-aqua/50 focus:ring-aqua/60"
                  >
                    <option value="">Unassigned</option>
                    {adminUsers.map((admin) => (
                      <option key={admin.id} value={admin.id}>
                        {admin.full_name || admin.email}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* ROI Estimate Section */}
              {formData.roi_estimate && Object.keys(formData.roi_estimate).length > 0 && (
                <div className="bg-aqua/10 rounded-lg p-4 border border-aqua/30">
                  <h4 className="text-sm font-semibold text-aqua mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    ROI Estimate (from Assessment)
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {formData.roi_estimate.hoursSavedPerMonth !== undefined && (
                      <div className="bg-surface-2 rounded-md p-2 shadow-sm">
                        <p className="text-xs text-ink-2">Hours Saved/Mo</p>
                        <p className="text-lg font-bold text-aqua">
                          {formData.roi_estimate.hoursSavedPerMonth.toFixed(1)} hrs
                        </p>
                      </div>
                    )}
                    {formData.roi_estimate.totalBenefitPerMonth !== undefined && (
                      <div className="bg-surface-2 rounded-md p-2 shadow-sm">
                        <p className="text-xs text-ink-2">Total Benefit/Mo</p>
                        <p className="text-lg font-bold text-emerald-400">
                          ${formData.roi_estimate.totalBenefitPerMonth.toLocaleString()}
                        </p>
                      </div>
                    )}
                    {formData.roi_estimate.roiPercent !== undefined && (
                      <div className="bg-surface-2 rounded-md p-2 shadow-sm">
                        <p className="text-xs text-ink-2">Est. ROI</p>
                        <p className="text-lg font-bold text-indigo-400">
                          {formData.roi_estimate.roiPercent.toLocaleString()}%
                        </p>
                      </div>
                    )}
                    {formData.roi_estimate.paybackMonths !== undefined && (
                      <div className="bg-surface-2 rounded-md p-2 shadow-sm">
                        <p className="text-xs text-ink-2">Payback Period</p>
                        <p className="text-lg font-bold text-amber-400">
                          {formData.roi_estimate.paybackMonths.toFixed(1)} mo
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-ink-1">Initial Challenges</label>
                <textarea
                  rows={4}
                  value={formData.initial_challenges || ''}
                  onChange={(e) => updateField('initial_challenges', e.target.value)}
                  className="mt-1 block w-full rounded-md bg-surface-1 border-stroke-1 text-ink-0 placeholder-ink-3 shadow-sm focus:border-aqua/50 focus:ring-aqua/60"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-1">Current Blockers</label>
                <textarea
                  rows={3}
                  value={formData.current_blockers || ''}
                  onChange={(e) => updateField('current_blockers', e.target.value)}
                  className="mt-1 block w-full rounded-md bg-surface-1 border-stroke-1 text-ink-0 placeholder-ink-3 shadow-sm focus:border-aqua/50 focus:ring-aqua/60"
                />
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-ink-1">Next Action Required</label>
                  <input
                    type="text"
                    value={formData.next_action_required || ''}
                    onChange={(e) => updateField('next_action_required', e.target.value)}
                    className="mt-1 block w-full rounded-md bg-surface-1 border-stroke-1 text-ink-0 placeholder-ink-3 shadow-sm focus:border-aqua/50 focus:ring-aqua/60"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-1">Next Action Due Date</label>
                  <input
                    type="date"
                    value={formData.next_action_due_date || ''}
                    onChange={(e) => updateField('next_action_due_date', e.target.value)}
                    className="mt-1 block w-full rounded-md bg-surface-1 border-stroke-1 text-ink-0 placeholder-ink-3 shadow-sm focus:border-aqua/50 focus:ring-aqua/60"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Section Tabs */}
          {activeTab === 'consultation' && <ConsultationSection {...sectionProps('consultation')} />}
          {activeTab === 'proposal' && <ProposalSection {...sectionProps('proposal')} />}
          {activeTab === 'agreement' && <AgreementSection {...sectionProps('agreement')} />}
          {activeTab === 'delivery' && <DeliverySection {...sectionProps('delivery')} />}
          {activeTab === 'implementation' && <ImplementationSection {...sectionProps('implementation')} />}
          {activeTab === 'signoff' && <SignoffSection {...sectionProps('signoff')} />}

          {/* Timeline Tab */}
          {activeTab === 'timeline' && (
            <div>
              <InteractionTimeline
                interactions={interactions}
                onAddInteraction={() => setShowAddInteraction(true)}
              />

              {showAddInteraction && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
                  <div className="bg-surface-2 rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6">
                    <h3 className="text-lg font-medium text-ink-0 mb-4">Add Interaction</h3>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-ink-1">Type</label>
                          <select
                            value={newInteraction.interaction_type}
                            onChange={(e) =>
                              setNewInteraction({ ...newInteraction, interaction_type: e.target.value })
                            }
                            className="mt-1 block w-full rounded-md bg-surface-1 border-stroke-1 text-ink-0 placeholder-ink-3 shadow-sm focus:border-aqua/50 focus:ring-aqua/60"
                          >
                            <option value="note">Note</option>
                            <option value="meeting">Meeting</option>
                            <option value="email">Email</option>
                            <option value="call">Call</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-ink-1">Phase (optional)</label>
                          <select
                            value={newInteraction.phase}
                            onChange={(e) =>
                              setNewInteraction({ ...newInteraction, phase: e.target.value })
                            }
                            className="mt-1 block w-full rounded-md bg-surface-1 border-stroke-1 text-ink-0 placeholder-ink-3 shadow-sm focus:border-aqua/50 focus:ring-aqua/60"
                          >
                            <option value="">No specific phase</option>
                            <option value="consultation">Consultation</option>
                            <option value="proposal">Proposal</option>
                            <option value="agreement">Agreement</option>
                            <option value="delivery">Delivery</option>
                            <option value="implementation">Implementation</option>
                            <option value="signoff">Sign-off</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-ink-1">Date/Time</label>
                        <input
                          type="datetime-local"
                          value={newInteraction.interaction_date}
                          onChange={(e) =>
                            setNewInteraction({ ...newInteraction, interaction_date: e.target.value })
                          }
                          className="mt-1 block w-full rounded-md bg-surface-1 border-stroke-1 text-ink-0 placeholder-ink-3 shadow-sm focus:border-aqua/50 focus:ring-aqua/60"
                        />
                        <p className="mt-1 text-xs text-ink-2">Leave blank for current time</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-ink-1">Subject</label>
                        <input
                          type="text"
                          value={newInteraction.subject}
                          onChange={(e) =>
                            setNewInteraction({ ...newInteraction, subject: e.target.value })
                          }
                          className="mt-1 block w-full rounded-md bg-surface-1 border-stroke-1 text-ink-0 placeholder-ink-3 shadow-sm focus:border-aqua/50 focus:ring-aqua/60"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-ink-1">Notes</label>
                        <textarea
                          rows={4}
                          value={newInteraction.notes}
                          onChange={(e) =>
                            setNewInteraction({ ...newInteraction, notes: e.target.value })
                          }
                          className="mt-1 block w-full rounded-md bg-surface-1 border-stroke-1 text-ink-0 placeholder-ink-3 shadow-sm focus:border-aqua/50 focus:ring-aqua/60"
                        />
                      </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                      <button
                        onClick={() => setShowAddInteraction(false)}
                        className="px-4 py-2 border border-stroke-1 rounded-md text-sm font-medium text-ink-1 hover:bg-surface-3/60"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddInteraction}
                        className="px-4 py-2 border border-transparent rounded-md text-sm font-semibold text-[#04110d] bg-aqua hover:bg-aqua-bright"
                      >
                        Add Interaction
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex justify-between gap-3">
        {/* Delete/Archive - only for existing customers */}
        <div className="flex gap-2">
          {customerId !== 'new' && (
            <>
              {showArchiveConfirm ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-amber-400 font-medium">Archive this customer?</span>
                  <button
                    onClick={handleArchive}
                    disabled={isDeleting}
                    className="px-3 py-1.5 border border-transparent rounded-md text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50"
                  >
                    {isDeleting ? 'Archiving...' : 'Yes, archive'}
                  </button>
                  <button
                    onClick={() => setShowArchiveConfirm(false)}
                    disabled={isDeleting}
                    className="px-3 py-1.5 border border-stroke-1 rounded-md text-sm font-medium text-ink-1 bg-surface-2 hover:bg-surface-3/60 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              ) : showDeleteConfirm ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-red-400 font-medium">Permanently delete? This cannot be undone.</span>
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
                <>
                  <button
                    onClick={() => setShowArchiveConfirm(true)}
                    className="px-4 py-2 border border-amber-500/30 rounded-md text-sm font-medium text-amber-300 bg-surface-2 hover:bg-amber-500/10"
                  >
                    Archive
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-4 py-2 border border-red-500/30 rounded-md text-sm font-medium text-red-300 bg-surface-2 hover:bg-red-500/10"
                  >
                    Delete
                  </button>
                </>
              )}
            </>
          )}
        </div>

        {/* Save/Back buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => router.push('/admin/customers')}
            className="px-4 py-2 border border-stroke-1 rounded-md text-sm font-medium text-ink-1 hover:bg-surface-3/60"
          >
            Back to Customers
          </button>
          <button
            onClick={async () => {
              try {
                setSaveError(null)
                await saveCustomer()
                router.push('/admin/customers')
              } catch (error: any) {
                setSaveError(error.message || 'Failed to save customer')
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }
            }}
            disabled={isSaving}
            className="px-4 py-2 border border-transparent rounded-md text-sm font-semibold text-[#04110d] bg-aqua hover:bg-aqua-bright disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save & Close'}
          </button>
        </div>
      </div>
    </div>
  )
}
