'use client'

import { useState, useEffect } from 'react'
import { ConvertConsultationModal } from '@/components/admin/ConvertConsultationModal'
import { ROIAssessmentModal } from '@/components/admin/ROIAssessmentModal'
import {
  AdminPageHeader,
  AdminStatCard,
  AdminStatsGrid,
  AdminFilterBar,
  AdminSelect,
  AdminTable,
  AdminTableHead,
  AdminTableHeader,
  AdminTableBody,
  AdminTableRow,
  AdminTableCell,
  AdminEmptyState,
  AdminButton,
  AdminPageSkeleton,
  AdminTabs,
} from '@/components/admin/AdminUI'

// Icons
const CalendarIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)

const ClockIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const TrendingIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
)

const CheckCircleIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const CalculatorIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
  </svg>
)

const UsersIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
  </svg>
)

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
)

interface Consultation {
  id: string
  name: string
  email: string
  phone?: string
  business_type?: string
  business_size?: string
  preferred_date?: string
  preferred_time?: string
  meeting_type?: string
  challenges?: string
  status: string
  created_at: string
  converted_to_customer_id?: string
}

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

export default function ConsultationsPage() {
  const [activeTab, setActiveTab] = useState('consultations')

  // Consultation state
  const [consultations, setConsultations] = useState<Consultation[]>([])
  const [consultationStats, setConsultationStats] = useState({
    total: 0,
    pending: 0,
    thisWeek: 0,
    converted: 0,
  })
  const [consultationStatusFilter, setConsultationStatusFilter] = useState('all')
  const [consultationSearch, setConsultationSearch] = useState('')
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null)

  // ROI Assessment state
  const [roiAssessments, setRoiAssessments] = useState<ROIAssessment[]>([])
  const [roiStats, setRoiStats] = useState({
    total: 0,
    notContacted: 0,
    thisWeek: 0,
    contacted: 0,
  })
  const [roiContactedFilter, setRoiContactedFilter] = useState('all')
  const [roiSearch, setRoiSearch] = useState('')
  const [selectedROI, setSelectedROI] = useState<ROIAssessment | null>(null)

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'consultation' | 'roi'; id: string; label: string } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadConsultations()
  }, [consultationStatusFilter, consultationSearch])

  useEffect(() => {
    loadROIAssessments()
  }, [roiContactedFilter, roiSearch])

  async function loadConsultations() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (consultationStatusFilter !== 'all') {
        params.append('status', consultationStatusFilter)
      }
      if (consultationSearch) {
        params.append('search', consultationSearch)
      }

      const response = await fetch(`/api/consultations?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch consultations')

      const result = await response.json()
      const consultationsData = result.data || []

      const oneWeekAgo = new Date()
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

      const thisWeekCount = consultationsData.filter(
        (c: Consultation) => new Date(c.created_at) >= oneWeekAgo
      ).length

      const pendingCount = consultationsData.filter((c: Consultation) => c.status === 'pending').length
      const convertedCount = consultationsData.filter((c: Consultation) => c.status === 'converted').length

      setConsultations(consultationsData)
      setConsultationStats({
        total: consultationsData.length,
        pending: pendingCount,
        thisWeek: thisWeekCount,
        converted: convertedCount,
      })
    } catch (error) {
      console.error('Error loading consultations:', error)
      setConsultations([])
    } finally {
      setLoading(false)
    }
  }

  async function loadROIAssessments() {
    try {
      const params = new URLSearchParams()
      if (roiContactedFilter !== 'all') {
        params.append('contacted', roiContactedFilter === 'contacted' ? 'true' : 'false')
      }
      if (roiSearch) {
        params.append('search', roiSearch)
      }

      const response = await fetch(`/api/roi-assessments?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch ROI assessments')

      const result = await response.json()
      const roiData = result.data || []

      const oneWeekAgo = new Date()
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

      const thisWeekCount = roiData.filter(
        (r: ROIAssessment) => new Date(r.created_at) >= oneWeekAgo
      ).length

      const notContactedCount = roiData.filter((r: ROIAssessment) => !r.contacted).length
      const contactedCount = roiData.filter((r: ROIAssessment) => r.contacted).length

      setRoiAssessments(roiData)
      setRoiStats({
        total: roiData.length,
        notContacted: notContactedCount,
        thisWeek: thisWeekCount,
        contacted: contactedCount,
      })
    } catch (error) {
      console.error('Error loading ROI assessments:', error)
      setRoiAssessments([])
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return

    setIsDeleting(true)
    try {
      const endpoint = deleteTarget.type === 'consultation'
        ? `/api/consultations/${deleteTarget.id}`
        : `/api/roi-assessments/${deleteTarget.id}`

      const response = await fetch(endpoint, { method: 'DELETE' })
      if (!response.ok) {
        throw new Error('Failed to delete')
      }

      // Reload the appropriate list
      if (deleteTarget.type === 'consultation') {
        loadConsultations()
      } else {
        loadROIAssessments()
      }
      setDeleteTarget(null)
    } catch (error) {
      console.error('Error deleting:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; dot: string }> = {
      pending: { bg: 'bg-amber-500/10 ring-1 ring-inset ring-amber-500/25', text: 'text-amber-300', dot: 'bg-amber-400' },
      contacted: { bg: 'bg-aqua/10 ring-1 ring-inset ring-aqua/25', text: 'text-aqua', dot: 'bg-aqua' },
      converted: { bg: 'bg-emerald-500/10 ring-1 ring-inset ring-emerald-500/25', text: 'text-emerald-300', dot: 'bg-emerald-400' },
      cancelled: { bg: 'bg-surface-3 ring-1 ring-inset ring-stroke-1', text: 'text-ink-1', dot: 'bg-ink-3' },
    }
    return badges[status] || { bg: 'bg-surface-3 ring-1 ring-inset ring-stroke-1', text: 'text-ink-1', dot: 'bg-ink-3' }
  }

  const consultationStatusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'contacted', label: 'Contacted' },
    { value: 'converted', label: 'Converted' },
    { value: 'cancelled', label: 'Cancelled' },
  ]

  const roiContactedOptions = [
    { value: 'all', label: 'All' },
    { value: 'not_contacted', label: 'Not Contacted' },
    { value: 'contacted', label: 'Contacted' },
  ]

  const tabs = [
    {
      id: 'consultations',
      label: 'Consultation Requests',
      icon: <CalendarIcon />,
      count: consultationStats.total,
    },
    {
      id: 'roi',
      label: 'ROI Assessments',
      icon: <CalculatorIcon />,
      count: roiStats.total,
    },
  ]

  if (loading) {
    return <AdminPageSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Convert Consultation Modal */}
      {selectedConsultation && (
        <ConvertConsultationModal
          consultation={selectedConsultation}
          isOpen={!!selectedConsultation}
          onClose={() => {
            setSelectedConsultation(null)
            loadConsultations()
          }}
        />
      )}

      {/* ROI Assessment Modal */}
      {selectedROI && (
        <ROIAssessmentModal
          assessment={selectedROI}
          isOpen={!!selectedROI}
          onClose={() => setSelectedROI(null)}
          onUpdate={loadROIAssessments}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-surface-2 border border-stroke-0 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-500/10 ring-1 ring-inset ring-red-500/25 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-ink-0">Delete {deleteTarget.type === 'consultation' ? 'Consultation Request' : 'ROI Assessment'}</h3>
                <p className="text-sm text-ink-2">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-ink-1 mb-6">
              Are you sure you want to delete the {deleteTarget.type === 'consultation' ? 'consultation request' : 'ROI assessment'} for <span className="font-medium">{deleteTarget.label}</span>?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="px-4 py-2 border border-stroke-1 rounded-md text-sm font-medium text-ink-1 bg-surface-1 hover:bg-surface-3/60 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <AdminPageHeader
        title="Leads & Consultations"
        description="Manage consultation requests and ROI calculator submissions"
        icon={<UsersIcon />}
      />

      {/* Tabs */}
      <AdminTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Consultation Requests Tab */}
      {activeTab === 'consultations' && (
        <>
          {/* Stats Grid */}
          <AdminStatsGrid columns={4}>
            <AdminStatCard
              label="Total Requests"
              value={consultationStats.total}
              variant="default"
              icon={<CalendarIcon />}
            />
            <AdminStatCard
              label="Pending"
              value={consultationStats.pending}
              variant="warning"
              icon={<ClockIcon />}
            />
            <AdminStatCard
              label="This Week"
              value={consultationStats.thisWeek}
              variant="info"
              icon={<TrendingIcon />}
            />
            <AdminStatCard
              label="Converted"
              value={consultationStats.converted}
              variant="success"
              icon={<CheckCircleIcon />}
            />
          </AdminStatsGrid>

          {/* Filters */}
          <AdminFilterBar
            searchValue={consultationSearch}
            onSearchChange={setConsultationSearch}
            searchPlaceholder="Search by name or email..."
          >
            <AdminSelect
              value={consultationStatusFilter}
              onChange={setConsultationStatusFilter}
              options={consultationStatusOptions}
            />
          </AdminFilterBar>

          {/* Consultations Table */}
          <AdminTable>
            <AdminTableHead>
              <AdminTableHeader>Contact</AdminTableHeader>
              <AdminTableHeader>Business</AdminTableHeader>
              <AdminTableHeader>Preferred Date</AdminTableHeader>
              <AdminTableHeader>Status</AdminTableHeader>
              <AdminTableHeader>Created</AdminTableHeader>
              <AdminTableHeader className="text-right">Actions</AdminTableHeader>
            </AdminTableHead>
            <AdminTableBody>
              {consultations && consultations.length > 0 ? (
                consultations.map((consultation) => {
                  const statusStyle = getStatusBadge(consultation.status)
                  return (
                    <AdminTableRow key={consultation.id}>
                      <AdminTableCell>
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-semibold mr-3 shadow-sm">
                            {consultation.name[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-ink-0">{consultation.name}</div>
                            <div className="text-sm text-ink-2">{consultation.email}</div>
                            {consultation.phone && (
                              <div className="text-xs text-ink-3">{consultation.phone}</div>
                            )}
                          </div>
                        </div>
                      </AdminTableCell>
                      <AdminTableCell>
                        <div className="text-sm text-ink-0">{consultation.business_type || '-'}</div>
                        {consultation.business_size && (
                          <div className="text-xs text-ink-2">{consultation.business_size}</div>
                        )}
                      </AdminTableCell>
                      <AdminTableCell className="whitespace-nowrap">
                        <div className="text-sm text-ink-0">
                          {consultation.preferred_date
                            ? new Date(consultation.preferred_date).toLocaleDateString()
                            : '-'}
                        </div>
                        {consultation.preferred_time && (
                          <div className="text-xs text-ink-2">{consultation.preferred_time}</div>
                        )}
                        {consultation.meeting_type && (
                          <div className="text-xs text-ink-3 capitalize">
                            {consultation.meeting_type}
                          </div>
                        )}
                      </AdminTableCell>
                      <AdminTableCell className="whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${statusStyle.bg} ${statusStyle.text}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`}></span>
                          {consultation.status.charAt(0).toUpperCase() + consultation.status.slice(1)}
                        </span>
                      </AdminTableCell>
                      <AdminTableCell className="whitespace-nowrap text-sm text-ink-2">
                        {new Date(consultation.created_at).toLocaleDateString()}
                      </AdminTableCell>
                      <AdminTableCell className="whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          {consultation.status === 'converted' ? (
                            <span className="inline-flex items-center gap-1 text-emerald-400 text-sm font-medium">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              Converted
                            </span>
                          ) : (
                            <AdminButton
                              onClick={() => setSelectedConsultation(consultation)}
                              variant="primary"
                              size="sm"
                            >
                              Convert
                            </AdminButton>
                          )}
                          <button
                            onClick={() => setDeleteTarget({ type: 'consultation', id: consultation.id, label: consultation.email })}
                            className="p-2 text-ink-3 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                            title="Delete consultation"
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </AdminTableCell>
                    </AdminTableRow>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={6}>
                    <AdminEmptyState
                      icon={<CalendarIcon />}
                      title="No consultation requests"
                      description="Consultation requests will appear here when submitted"
                    />
                  </td>
                </tr>
              )}
            </AdminTableBody>
          </AdminTable>
        </>
      )}

      {/* ROI Assessments Tab */}
      {activeTab === 'roi' && (
        <>
          {/* Stats Grid */}
          <AdminStatsGrid columns={4}>
            <AdminStatCard
              label="Total Submissions"
              value={roiStats.total}
              variant="default"
              icon={<CalculatorIcon />}
            />
            <AdminStatCard
              label="Not Contacted"
              value={roiStats.notContacted}
              variant="warning"
              icon={<ClockIcon />}
            />
            <AdminStatCard
              label="This Week"
              value={roiStats.thisWeek}
              variant="info"
              icon={<TrendingIcon />}
            />
            <AdminStatCard
              label="Contacted"
              value={roiStats.contacted}
              variant="success"
              icon={<CheckCircleIcon />}
            />
          </AdminStatsGrid>

          {/* Filters */}
          <AdminFilterBar
            searchValue={roiSearch}
            onSearchChange={setRoiSearch}
            searchPlaceholder="Search by email..."
          >
            <AdminSelect
              value={roiContactedFilter}
              onChange={setRoiContactedFilter}
              options={roiContactedOptions}
            />
          </AdminFilterBar>

          {/* ROI Assessments Table */}
          <AdminTable>
            <AdminTableHead>
              <AdminTableHeader>Email</AdminTableHeader>
              <AdminTableHeader>Net Benefit/Mo</AdminTableHeader>
              <AdminTableHeader>ROI</AdminTableHeader>
              <AdminTableHeader>Payback</AdminTableHeader>
              <AdminTableHeader>Status</AdminTableHeader>
              <AdminTableHeader>Submitted</AdminTableHeader>
              <AdminTableHeader className="text-right">Actions</AdminTableHeader>
            </AdminTableHead>
            <AdminTableBody>
              {roiAssessments && roiAssessments.length > 0 ? (
                roiAssessments.map((assessment) => {
                  const results = assessment.calculated_results || {}
                  return (
                    <AdminTableRow key={assessment.id}>
                      <AdminTableCell>
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white font-semibold mr-3 shadow-sm">
                            {assessment.email[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-ink-0">{assessment.email}</div>
                            {assessment.notes && (
                              <div className="text-xs text-ink-3 truncate max-w-[200px]">{assessment.notes}</div>
                            )}
                          </div>
                        </div>
                      </AdminTableCell>
                      <AdminTableCell>
                        <span className="text-sm font-semibold text-emerald-400">
                          ${results.netBenefitPerMonth?.toLocaleString() || 'N/A'}
                        </span>
                      </AdminTableCell>
                      <AdminTableCell>
                        <span className="text-sm font-semibold text-indigo-400">
                          {results.roiPercent?.toLocaleString() || 'N/A'}%
                        </span>
                      </AdminTableCell>
                      <AdminTableCell>
                        <span className="text-sm text-ink-0">
                          {results.paybackMonths?.toFixed(1) || 'N/A'} mo
                        </span>
                      </AdminTableCell>
                      <AdminTableCell className="whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          {assessment.converted ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-aqua/10 text-aqua ring-1 ring-inset ring-aqua/25">
                              <span className="w-1.5 h-1.5 rounded-full bg-aqua"></span>
                              Converted
                            </span>
                          ) : assessment.contacted ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-500/10 text-emerald-300 ring-1 ring-inset ring-emerald-500/25">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                              Contacted
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-amber-500/10 text-amber-300 ring-1 ring-inset ring-amber-500/25">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                              Not Contacted
                            </span>
                          )}
                        </div>
                      </AdminTableCell>
                      <AdminTableCell className="whitespace-nowrap text-sm text-ink-2">
                        {new Date(assessment.created_at).toLocaleDateString()}
                      </AdminTableCell>
                      <AdminTableCell className="whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <AdminButton
                            onClick={() => setSelectedROI(assessment)}
                            variant="secondary"
                            size="sm"
                          >
                            View Details
                          </AdminButton>
                          <button
                            onClick={() => setDeleteTarget({ type: 'roi', id: assessment.id, label: assessment.email })}
                            className="p-2 text-ink-3 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                            title="Delete ROI assessment"
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </AdminTableCell>
                    </AdminTableRow>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={7}>
                    <AdminEmptyState
                      icon={<CalculatorIcon />}
                      title="No ROI assessments"
                      description="ROI calculator submissions will appear here"
                    />
                  </td>
                </tr>
              )}
            </AdminTableBody>
          </AdminTable>
        </>
      )}
    </div>
  )
}
