'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { CustomerStageBadge } from '@/components/admin/CustomerStageBadge'
import { ProjectHealthIndicator } from '@/components/admin/ProjectHealthIndicator'
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
} from '@/components/admin/AdminUI'

// Icons
const CustomersIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
)

const UsersIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
)

const ChartIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
)

const WarningIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
)

const DollarIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
)

interface Customer {
  id: string
  customer_number?: string
  is_test?: boolean
  name: string
  email: string
  business_type?: string
  avatar_url?: string
  stage: string
  project_status: string
  next_action_required?: string
  next_action_due_date?: string
  assigned_admin?: {
    id: string
    full_name: string | null
    email: string
  }
  agreed_implementation_cost?: number
  created_at: string
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    atRisk: 0,
    revenue: 0,
  })
  const [loading, setLoading] = useState(true)
  const [stageFilter, setStageFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // Debounce search input
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [searchQuery])

  useEffect(() => {
    loadCustomers()
  }, [stageFilter, statusFilter, debouncedSearch])

  async function loadCustomers() {
    setLoading(true)

    try {
      // Build query params
      const params = new URLSearchParams()
      if (stageFilter !== 'all') {
        params.append('stage', stageFilter)
      }
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }
      if (debouncedSearch) {
        params.append('search', debouncedSearch)
      }

      // Fetch customers from API (uses admin client, allows editors)
      const response = await fetch(`/api/customers?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch customers')
      }

      const result = await response.json()
      const customersData = result.data || []

      // Calculate stats from all customers
      const activeCount = customersData.filter((c: Customer) =>
        ['project_active', 'implementation', 'delivered'].includes(c.stage)
      ).length

      const atRiskCount = customersData.filter((c: Customer) =>
        ['at_risk', 'delayed', 'blocked'].includes(c.project_status)
      ).length

      const totalRevenue = customersData
        .filter((c: Customer) => c.stage === 'closed_won')
        .reduce((sum: number, c: Customer) => sum + (Number(c.agreed_implementation_cost) || 0), 0)

      setCustomers(customersData)
      setStats({
        total: customersData.length,
        active: activeCount,
        atRisk: atRiskCount,
        revenue: totalRevenue,
      })
    } catch (error) {
      console.error('Error loading customers:', error)
      setCustomers([])
    } finally {
      setLoading(false)
    }
  }

  // Filter out archived (closed_lost) customers unless showArchived is true
  const displayedCustomers = showArchived
    ? customers
    : customers.filter(c => c.stage !== 'closed_lost')

  const statsArray = [
    { name: 'Total Customers', value: stats.total },
    { name: 'Active Projects', value: stats.active },
    { name: 'At Risk', value: stats.atRisk },
    { name: 'Revenue YTD', value: `$${stats.revenue.toLocaleString()}` },
  ]

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false
    return new Date(dueDate) < new Date()
  }

  const stageOptions = [
    { value: 'all', label: 'All Stages' },
    { value: 'consultation_requested', label: 'Consultation Requested' },
    { value: 'consultation_in_progress', label: 'Consultation In Progress' },
    { value: 'consultation_completed', label: 'Consultation Done' },
    { value: 'proposal_development', label: 'Proposal Development' },
    { value: 'proposal_sent', label: 'Proposal Sent' },
    { value: 'negotiation', label: 'Negotiation' },
    { value: 'project_active', label: 'Project Active' },
    { value: 'implementation', label: 'Implementation' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'signed_off', label: 'Signed Off' },
    { value: 'closed_won', label: 'Closed Won' },
    { value: 'closed_lost', label: 'Closed Lost' },
  ]

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'on_track', label: 'On Track' },
    { value: 'at_risk', label: 'At Risk' },
    { value: 'delayed', label: 'Delayed' },
    { value: 'blocked', label: 'Blocked' },
    { value: 'completed', label: 'Completed' },
  ]

  if (loading) {
    return <AdminPageSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <AdminPageHeader
        title="Customers"
        description="Manage customer relationships and track project progress"
        icon={<CustomersIcon />}
        actions={
          <AdminButton href="/admin/customers/new" icon={<PlusIcon />}>
            Add Customer
          </AdminButton>
        }
      />

      {/* Stats Grid */}
      <AdminStatsGrid columns={4}>
        <AdminStatCard
          label="Total Customers"
          value={stats.total}
          variant="default"
          icon={<UsersIcon />}
        />
        <AdminStatCard
          label="Active Projects"
          value={stats.active}
          variant="info"
          icon={<ChartIcon />}
        />
        <AdminStatCard
          label="At Risk"
          value={stats.atRisk}
          variant="warning"
          icon={<WarningIcon />}
        />
        <AdminStatCard
          label="Revenue YTD"
          value={`$${stats.revenue.toLocaleString()}`}
          variant="success"
          icon={<DollarIcon />}
        />
      </AdminStatsGrid>

      {/* Filters */}
      <AdminFilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by name, email, or customer ID..."
      >
        <AdminSelect
          value={stageFilter}
          onChange={setStageFilter}
          options={stageOptions}
        />
        <AdminSelect
          value={statusFilter}
          onChange={setStatusFilter}
          options={statusOptions}
        />
        <label className="flex items-center gap-2 text-sm text-ink-1 cursor-pointer ml-2">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            className="h-4 w-4 rounded border-stroke-1 accent-[#2be8c2] focus:ring-aqua/60"
          />
          Show Archived
        </label>
      </AdminFilterBar>

      {/* Customers Table */}
      <AdminTable>
        <AdminTableHead>
          <AdminTableHeader>Customer</AdminTableHeader>
          <AdminTableHeader>ID</AdminTableHeader>
          <AdminTableHeader>Stage</AdminTableHeader>
          <AdminTableHeader>Status</AdminTableHeader>
          <AdminTableHeader>Next Action</AdminTableHeader>
          <AdminTableHeader>Assigned To</AdminTableHeader>
          <AdminTableHeader className="text-right">Actions</AdminTableHeader>
        </AdminTableHead>
        <AdminTableBody>
          {displayedCustomers && displayedCustomers.length > 0 ? (
            displayedCustomers.map((customer) => (
              <AdminTableRow key={customer.id}>
                <AdminTableCell>
                  <div className="flex items-center">
                    {customer.avatar_url ? (
                      <img
                        src={customer.avatar_url}
                        alt={customer.name}
                        className="h-10 w-10 rounded-full mr-3 border-2 border-stroke-1 shadow-sm"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-surface-3 border border-stroke-1 flex items-center justify-center text-aqua font-semibold mr-3 shadow-sm">
                        {customer.name[0].toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-semibold text-ink-0">{customer.name}</div>
                      <div className="text-sm text-ink-2">{customer.email}</div>
                      {customer.business_type && (
                        <div className="text-xs text-ink-3">{customer.business_type}</div>
                      )}
                    </div>
                  </div>
                </AdminTableCell>
                <AdminTableCell className="whitespace-nowrap">
                  <span className="text-sm font-mono text-ink-1 bg-surface-3 px-2 py-0.5 rounded">
                    {customer.customer_number}
                  </span>
                </AdminTableCell>
                <AdminTableCell className="whitespace-nowrap">
                  <CustomerStageBadge stage={customer.stage} />
                </AdminTableCell>
                <AdminTableCell>
                  <ProjectHealthIndicator status={customer.project_status} />
                </AdminTableCell>
                <AdminTableCell>
                  {customer.next_action_required ? (
                    <div>
                      <div className="text-sm text-ink-0">
                        {customer.next_action_required}
                      </div>
                      {customer.next_action_due_date && (
                        <div
                          className={`text-sm flex items-center gap-1 ${
                            isOverdue(customer.next_action_due_date)
                              ? 'text-red-400 font-medium'
                              : 'text-ink-2'
                          }`}
                        >
                          {isOverdue(customer.next_action_due_date) && (
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          )}
                          Due: {new Date(customer.next_action_due_date).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-ink-3">None</span>
                  )}
                </AdminTableCell>
                <AdminTableCell className="whitespace-nowrap text-sm text-ink-2">
                  {customer.assigned_admin?.full_name || customer.assigned_admin?.email || (
                    <span className="text-ink-3 italic">Unassigned</span>
                  )}
                </AdminTableCell>
                <AdminTableCell className="whitespace-nowrap text-right">
                  <AdminButton
                    href={`/admin/customers/${customer.id}`}
                    variant="ghost"
                    size="sm"
                  >
                    View Details
                  </AdminButton>
                </AdminTableCell>
              </AdminTableRow>
            ))
          ) : (
            <tr>
              <td colSpan={7}>
                <AdminEmptyState
                  icon={<CustomersIcon />}
                  title="No customers yet"
                  description="Convert a consultation request to get started"
                  action={{
                    label: 'View Consultations',
                    href: '/admin/consultations',
                  }}
                />
              </td>
            </tr>
          )}
        </AdminTableBody>
      </AdminTable>
    </div>
  )
}
