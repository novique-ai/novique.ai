'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { CustomerStageBadge } from '@/components/admin/CustomerStageBadge'
import { ProjectHealthIndicator } from '@/components/admin/ProjectHealthIndicator'
import {
  AdminPageHeader,
  AdminStatCard,
  AdminStatsGrid,
  AdminCard,
  AdminPageSkeleton,
  AdminButton,
} from '@/components/admin/AdminUI'
import { ROIPricingSettings } from '@/lib/roi/types'
import { DEFAULT_PRICING_SETTINGS } from '@/lib/roi/plans'
import { getROIPricingSettings, saveROIPricingSettings, resetROIPricingSettings } from '@/lib/roi/settings'

// Icons
const DashboardIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
)

const DollarIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const ChartIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
)

const TrendingIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
)

const TargetIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
)

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ROI Pricing Settings
  const [roiSettings, setRoiSettings] = useState<ROIPricingSettings>(DEFAULT_PRICING_SETTINGS)
  const [roiSettingsSaved, setRoiSettingsSaved] = useState(false)

  useEffect(() => {
    loadStats()
    // Load ROI settings from localStorage
    setRoiSettings(getROIPricingSettings())
  }, [])

  async function loadStats() {
    try {
      const response = await fetch('/api/dashboard/stats')
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load dashboard stats')
      }

      setStats(result.data)
      setError(null)
      setLoading(false)
    } catch (error: any) {
      console.error('Failed to load stats:', error)
      setError(error.message || 'Failed to load dashboard data')
      setLoading(false)
    }
  }

  if (loading) {
    return <AdminPageSkeleton />
  }

  if (error) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title="Dashboard"
          description="Overview of your business metrics and customer activity"
          icon={<DashboardIcon />}
        />
        <AdminCard>
          <div className="flex items-start gap-4 p-4 bg-red-500/10 rounded-lg border border-red-500/25">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-red-300">Error Loading Dashboard</h3>
              <p className="mt-1 text-sm text-red-300">{error}</p>
              <AdminButton
                variant="ghost"
                size="sm"
                onClick={() => {
                  setError(null)
                  setLoading(true)
                  loadStats()
                }}
                className="mt-3 text-red-300 hover:text-red-200 hover:bg-red-500/10"
              >
                Try again
              </AdminButton>
            </div>
          </div>
        </AdminCard>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const getInteractionIcon = (type: string) => {
    const icons: Record<string, string> = {
      consultation_request: '📋',
      meeting: '🗓️',
      email: '📧',
      call: '📞',
      note: '📝',
      proposal_sent: '📄',
      contract_signed: '✍️',
      payment_received: '💰',
      stage_change: '🔄',
    }
    return icons[type] || '•'
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <AdminPageHeader
        title="Dashboard"
        description="Overview of your business metrics and customer activity"
        icon={<DashboardIcon />}
      />

      {/* Section 1: Revenue Metrics */}
      <AdminStatsGrid columns={4}>
        <AdminStatCard
          label="Total Revenue YTD"
          value={`$${stats?.revenue?.ytd?.toLocaleString() || 0}`}
          variant="success"
          icon={<DollarIcon />}
        />
        <AdminStatCard
          label="Pipeline Value"
          value={`$${stats?.revenue?.pipeline?.toLocaleString() || 0}`}
          variant="info"
          icon={<ChartIcon />}
        />
        <AdminStatCard
          label="Conversion Rate"
          value={`${stats?.revenue?.conversion?.toFixed(1) || 0}%`}
          variant="purple"
          icon={<TrendingIcon />}
        />
        <AdminStatCard
          label="Avg Deal Size"
          value={`$${stats?.revenue?.avg_deal?.toLocaleString() || 0}`}
          variant="info"
          icon={<TargetIcon />}
        />
      </AdminStatsGrid>

      {/* ROI Calculator Settings */}
      <AdminCard
        title="ROI Calculator Settings"
        description="Configure pricing calculations for the public ROI calculator"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Monthly Value Multiplier */}
          <div>
            <label htmlFor="monthlyMultiplier" className="block text-sm font-medium text-ink-1 mb-2">
              Monthly Value Multiplier
            </label>
            <div className="relative">
              <input
                type="number"
                id="monthlyMultiplier"
                value={Math.round(roiSettings.monthlyValueMultiplier * 100)}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0
                  setRoiSettings(prev => ({
                    ...prev,
                    monthlyValueMultiplier: value / 100
                  }))
                  setRoiSettingsSaved(false)
                }}
                min={1}
                max={100}
                step={1}
                className="w-full px-3 py-2 pr-8 bg-surface-1 border border-stroke-1 text-ink-0 placeholder-ink-3 rounded-lg focus:ring-2 focus:ring-aqua/60 focus:border-aqua/50"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-2">%</span>
            </div>
            <p className="mt-1 text-xs text-ink-2">
              Percentage of monthly business value used to calculate monthly fee (default: 15%)
            </p>
          </div>

          {/* One-Time Charge Multiplier */}
          <div>
            <label htmlFor="oneTimeMultiplier" className="block text-sm font-medium text-ink-1 mb-2">
              One-Time Charge Multiplier
            </label>
            <div className="relative">
              <input
                type="number"
                id="oneTimeMultiplier"
                value={roiSettings.oneTimeChargeMultiplier}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0
                  setRoiSettings(prev => ({
                    ...prev,
                    oneTimeChargeMultiplier: value
                  }))
                  setRoiSettingsSaved(false)
                }}
                min={1}
                max={10}
                step={0.5}
                className="w-full px-3 py-2 pr-8 bg-surface-1 border border-stroke-1 text-ink-0 placeholder-ink-3 rounded-lg focus:ring-2 focus:ring-aqua/60 focus:border-aqua/50"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-2">×</span>
            </div>
            <p className="mt-1 text-xs text-ink-2">
              Multiplier applied to monthly fee for one-time setup cost (default: 3×)
            </p>
          </div>
        </div>

        {/* Formula Preview */}
        <div className="mt-6 p-4 bg-surface-1 rounded-lg border border-stroke-0">
          <h4 className="text-sm font-semibold text-ink-1 mb-2">Current Formula</h4>
          <div className="text-sm text-ink-1 space-y-1">
            <p><span className="font-mono bg-surface-3 px-1 rounded">Monthly Fee</span> = Monthly Business Value × {Math.round(roiSettings.monthlyValueMultiplier * 100)}% (rounded to nearest $50, then clamped by tier)</p>
            <p><span className="font-mono bg-surface-3 px-1 rounded">One-Time Fee</span> = Monthly Fee × {roiSettings.oneTimeChargeMultiplier}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center gap-3">
          <AdminButton
            variant="primary"
            onClick={() => {
              saveROIPricingSettings(roiSettings)
              setRoiSettingsSaved(true)
              setTimeout(() => setRoiSettingsSaved(false), 3000)
            }}
          >
            Save Settings
          </AdminButton>
          <AdminButton
            variant="ghost"
            onClick={() => {
              resetROIPricingSettings()
              setRoiSettings(DEFAULT_PRICING_SETTINGS)
              setRoiSettingsSaved(false)
            }}
          >
            Reset to Defaults
          </AdminButton>
          {roiSettingsSaved && (
            <span className="text-sm text-green-400 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Settings saved!
            </span>
          )}
        </div>
      </AdminCard>

      {/* Section 2: Activity Tracking */}
      <AdminCard title="Upcoming Activities">
        {stats?.activity?.overdue_count > 0 && (
          <div className="mb-6 flex items-start gap-4 p-4 bg-red-500/10 rounded-xl border border-red-500/25">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-red-300">
                {stats.activity.overdue_count} Overdue Actions
              </h3>
              <ul className="mt-2 space-y-1">
                {stats.activity.overdue_tasks?.slice(0, 3).map((task: any) => (
                  <li key={task.id}>
                    <Link
                      href={`/admin/customers/${task.id}`}
                      className="text-sm text-red-300 hover:text-red-200 hover:underline"
                    >
                      {task.customer_number && <span className="font-mono">#{task.customer_number}</span>} {task.name}: {task.next_action_required}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold text-ink-1 mb-4">
              Upcoming Activities (Next 7 Days)
            </h3>
            {stats?.activity?.upcoming_activities?.length > 0 ? (
              <div className="space-y-3">
                {stats.activity.upcoming_activities.map((activity: any) => (
                  <Link
                    key={`${activity.id}-${activity.type}`}
                    href={`/admin/customers/${activity.id}`}
                    className="block p-4 bg-surface-1 rounded-xl border border-stroke-0 hover:border-aqua/30 hover:shadow-sm transition-all"
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-semibold text-ink-0">
                            {activity.customer_number && <span className="font-mono text-xs text-ink-3 mr-1.5">#{activity.customer_number}</span>}
                            {activity.name}
                          </p>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                            activity.type === 'presentation'
                              ? 'bg-purple-500/10 text-purple-300 ring-1 ring-inset ring-purple-500/25'
                              : 'bg-aqua/10 text-aqua ring-1 ring-inset ring-aqua/25'
                          }`}>
                            {activity.type === 'presentation' ? 'Presentation' : 'Action'}
                          </span>
                        </div>
                        <p className="text-sm text-ink-1">{activity.description}</p>
                        <p className="text-xs text-ink-2 mt-2">
                          {formatDateTime(activity.datetime)}
                        </p>
                      </div>
                      <CustomerStageBadge stage={activity.stage} />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-ink-2">
                <svg className="w-12 h-12 mx-auto mb-3 text-ink-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm">No upcoming activities</p>
              </div>
            )}
          </div>

          <div>
            <h3 className="text-sm font-semibold text-ink-1 mb-4">Recent Activity</h3>
            <div className="p-4 bg-aqua/10 rounded-xl border border-aqua/30">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-ink-1">New consultations (24h)</p>
                  <p className="text-2xl font-bold text-aqua mt-1">
                    {stats?.activity?.recent_consultations || 0}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-surface-3 border border-stroke-1 flex items-center justify-center">
                  <svg className="w-6 h-6 text-aqua" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AdminCard>

      {/* Section 3: Project Health */}
      <AdminCard title="Active Projects">
        <div className="mb-6">
          <AdminStatsGrid columns={4}>
            <div className="bg-surface-1 rounded-xl border border-stroke-0 p-4">
              <dt className="text-sm font-medium text-ink-2">Total Active</dt>
              <dd className="mt-1 text-2xl font-bold text-ink-0">
                {stats?.projects?.active?.length || 0}
              </dd>
            </div>
            <div className="bg-emerald-500/10 rounded-xl border border-emerald-500/25 p-4">
              <dt className="text-sm font-medium text-emerald-300">On Track</dt>
              <dd className="mt-1 text-2xl font-bold text-emerald-300">
                {stats?.projects?.on_track_count || 0}
              </dd>
            </div>
            <div className="bg-amber-500/10 rounded-xl border border-amber-500/25 p-4">
              <dt className="text-sm font-medium text-amber-300">At Risk</dt>
              <dd className="mt-1 text-2xl font-bold text-amber-300">
                {stats?.projects?.at_risk_count || 0}
              </dd>
            </div>
            <div className="bg-red-500/10 rounded-xl border border-red-500/25 p-4">
              <dt className="text-sm font-medium text-red-300">Delayed/Blocked</dt>
              <dd className="mt-1 text-2xl font-bold text-red-300">
                {(stats?.projects?.delayed_count || 0) + (stats?.projects?.blocked_count || 0)}
              </dd>
            </div>
          </AdminStatsGrid>
        </div>

        {stats?.projects?.active && stats.projects.active.length > 0 ? (
          <div className="space-y-3">
            {stats.projects.active.slice(0, 5).map((project: any) => (
              <Link
                key={project.id}
                href={`/admin/customers/${project.id}`}
                className="flex justify-between items-center p-4 bg-surface-1 rounded-xl border border-stroke-0 hover:border-aqua/30 hover:shadow-sm transition-all"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <p className="text-sm font-semibold text-ink-0">
                      {project.customer_number && <span className="font-mono text-xs text-ink-3 mr-1.5">#{project.customer_number}</span>}
                      {project.name}
                    </p>
                    <CustomerStageBadge stage={project.stage} />
                    <ProjectHealthIndicator status={project.project_status} />
                  </div>
                  {project.solution_due_date && (
                    <p className="mt-2 text-xs text-ink-2">
                      Due: {formatDate(project.solution_due_date)}
                    </p>
                  )}
                  {project.current_blockers && (
                    <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {project.current_blockers}
                    </p>
                  )}
                </div>
                <svg className="w-5 h-5 text-ink-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-ink-2">
            <svg className="w-12 h-12 mx-auto mb-3 text-ink-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-sm">No active projects</p>
          </div>
        )}
      </AdminCard>

      {/* Section 4: Recent Interactions */}
      <AdminCard title="Recent Communication (Last 7 Days)">
        {stats?.interactions && stats.interactions.length > 0 ? (
          <div className="space-y-3">
            {stats.interactions.map((interaction: any) => (
              <div
                key={interaction.id}
                className="flex items-start gap-4 p-4 bg-surface-1 rounded-xl border border-stroke-0 hover:border-stroke-2 transition-colors"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-surface-3 border border-stroke-0 flex items-center justify-center text-xl shadow-sm">
                  {getInteractionIcon(interaction.interaction_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink-0">
                        {interaction.subject || interaction.interaction_type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      </p>
                      {interaction.customer && (
                        <Link
                          href={`/admin/customers/${interaction.customer_id}`}
                          className="text-sm text-aqua hover:text-aqua-bright hover:underline"
                        >
                          {interaction.customer.customer_number && <span className="font-mono text-xs mr-1">#{interaction.customer.customer_number}</span>}
                          {interaction.customer.name}
                        </Link>
                      )}
                      {interaction.notes && (
                        <p className="mt-1 text-sm text-ink-2 line-clamp-2">
                          {interaction.notes}
                        </p>
                      )}
                    </div>
                    <time className="flex-shrink-0 text-xs text-ink-2 bg-surface-3 px-2 py-1 rounded-md">
                      {formatDate(interaction.interaction_date)}
                    </time>
                  </div>
                  {interaction.created_by_profile && (
                    <p className="mt-2 text-xs text-ink-3">
                      By: {interaction.created_by_profile.full_name}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-ink-2">
            <svg className="w-12 h-12 mx-auto mb-3 text-ink-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-sm">No recent interactions</p>
          </div>
        )}
      </AdminCard>
    </div>
  )
}
