'use client'

import Link from 'next/link'
import { ReactNode } from 'react'

// ============================================
// Admin Page Header
// ============================================
interface AdminPageHeaderProps {
  title: string
  description?: string
  icon?: ReactNode
  actions?: ReactNode
}

export function AdminPageHeader({ title, description, icon, actions }: AdminPageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="flex items-start gap-4">
        {icon && (
          <div className="flex-shrink-0 w-12 h-12 rounded-xl border border-stroke-1 bg-surface-2 flex items-center justify-center text-aqua">
            {icon}
          </div>
        )}
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-ink-0">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-ink-2">{description}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  )
}

// ============================================
// Admin Stat Card
// ============================================
interface AdminStatCardProps {
  label: string
  value: string | number
  icon?: ReactNode
  trend?: {
    value: number
    label: string
    positive?: boolean
  }
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple'
  href?: string
}

const variantStyles = {
  default: {
    iconBg: 'bg-surface-3',
    iconColor: 'text-ink-2',
    valueColor: 'text-ink-0',
  },
  success: {
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-300',
    valueColor: 'text-emerald-300',
  },
  warning: {
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-300',
    valueColor: 'text-amber-300',
  },
  danger: {
    iconBg: 'bg-red-500/10',
    iconColor: 'text-red-300',
    valueColor: 'text-red-300',
  },
  info: {
    iconBg: 'bg-aqua/10',
    iconColor: 'text-aqua',
    valueColor: 'text-aqua',
  },
  purple: {
    iconBg: 'bg-violet-500/10',
    iconColor: 'text-violet-300',
    valueColor: 'text-violet-300',
  },
}

export function AdminStatCard({ label, value, icon, trend, variant = 'default', href }: AdminStatCardProps) {
  const styles = variantStyles[variant]

  const content = (
    <div className="bg-surface-2 rounded-xl border border-stroke-0 hover:border-stroke-1 transition-colors p-5">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <dt className="text-xs font-medium uppercase tracking-[0.08em] text-ink-2 truncate">{label}</dt>
          <dd className={`mt-2 text-3xl font-semibold tracking-tight ${styles.valueColor}`}>{value}</dd>
          {trend && (
            <div className="mt-2 flex items-center text-sm">
              <span className={trend.positive ? 'text-emerald-300' : 'text-red-300'}>
                {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
              <span className="ml-2 text-ink-2">{trend.label}</span>
            </div>
          )}
        </div>
        {icon && (
          <div className={`${styles.iconBg} ${styles.iconColor} p-3 rounded-lg`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  )

  if (href) {
    return <Link href={href} className="block">{content}</Link>
  }
  return content
}

// ============================================
// Admin Stats Grid
// ============================================
interface AdminStatsGridProps {
  children: ReactNode
  columns?: 2 | 3 | 4
}

export function AdminStatsGrid({ children, columns = 4 }: AdminStatsGridProps) {
  const colClasses = {
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-3',
    4: 'sm:grid-cols-2 lg:grid-cols-4',
  }

  return (
    <div className={`grid grid-cols-1 gap-4 ${colClasses[columns]}`}>
      {children}
    </div>
  )
}

// ============================================
// Admin Card (generic container)
// ============================================
interface AdminCardProps {
  title?: string
  description?: string
  children: ReactNode
  actions?: ReactNode
  noPadding?: boolean
}

export function AdminCard({ title, description, children, actions, noPadding }: AdminCardProps) {
  return (
    <div className="bg-surface-2 rounded-xl border border-stroke-0 overflow-hidden">
      {(title || actions) && (
        <div className="px-6 py-4 border-b border-stroke-0 flex items-center justify-between">
          <div>
            {title && <h3 className="text-lg font-semibold text-ink-0">{title}</h3>}
            {description && <p className="mt-1 text-sm text-ink-2">{description}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={noPadding ? '' : 'p-6'}>{children}</div>
    </div>
  )
}

// ============================================
// Admin Filter Bar
// ============================================
interface AdminFilterBarProps {
  children: ReactNode
  searchValue?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
}

export function AdminFilterBar({
  children,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...'
}: AdminFilterBarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 p-4 bg-surface-2 rounded-xl border border-stroke-0">
      {onSearchChange && (
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-ink-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="block w-full pl-10 pr-3 py-2 bg-surface-1 border border-stroke-1 rounded-lg text-sm text-ink-0 placeholder-ink-3 focus:outline-none focus:ring-2 focus:ring-aqua/60 focus:border-transparent"
          />
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {children}
      </div>
    </div>
  )
}

// ============================================
// Admin Select (styled dropdown)
// ============================================
interface AdminSelectProps {
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  className?: string
}

export function AdminSelect({ value, onChange, options, className = '' }: AdminSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`px-3 py-2 bg-surface-1 border border-stroke-1 rounded-lg text-sm text-ink-0 focus:outline-none focus:ring-2 focus:ring-aqua/60 focus:border-transparent ${className}`}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  )
}

// ============================================
// Admin Table Wrapper
// ============================================
interface AdminTableProps {
  children: ReactNode
}

export function AdminTable({ children }: AdminTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-stroke-0 bg-surface-2">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-stroke-0">
          {children}
        </table>
      </div>
    </div>
  )
}

export function AdminTableHead({ children }: { children: ReactNode }) {
  return (
    <thead className="bg-surface-1">
      <tr>{children}</tr>
    </thead>
  )
}

export function AdminTableHeader({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <th className={`px-6 py-4 text-left text-xs font-semibold text-ink-2 uppercase tracking-wider ${className}`}>
      {children}
    </th>
  )
}

export function AdminTableBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-stroke-0">{children}</tbody>
}

export function AdminTableRow({ children, onClick, className = '' }: { children: ReactNode; onClick?: () => void; className?: string }) {
  return (
    <tr
      className={`hover:bg-surface-3/60 transition-colors ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </tr>
  )
}

export function AdminTableCell({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <td className={`px-6 py-4 ${className}`}>{children}</td>
}

// ============================================
// Admin Empty State
// ============================================
interface AdminEmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
}

export function AdminEmptyState({ icon, title, description, action }: AdminEmptyStateProps) {
  return (
    <div className="text-center py-12 px-4">
      {icon && (
        <div className="mx-auto w-16 h-16 rounded-full bg-surface-3 flex items-center justify-center text-ink-3 mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-medium text-ink-0">{title}</h3>
      {description && <p className="mt-2 text-sm text-ink-2">{description}</p>}
      {action && (
        <div className="mt-6">
          {action.href ? (
            <Link
              href={action.href}
              className="inline-flex items-center px-4 py-2 text-sm font-semibold rounded-lg text-[#04110d] bg-aqua hover:bg-aqua-bright focus:outline-none focus:ring-2 focus:ring-aqua/60 transition-colors"
            >
              {action.label}
            </Link>
          ) : (
            <button
              onClick={action.onClick}
              className="inline-flex items-center px-4 py-2 text-sm font-semibold rounded-lg text-[#04110d] bg-aqua hover:bg-aqua-bright focus:outline-none focus:ring-2 focus:ring-aqua/60 transition-colors"
            >
              {action.label}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ============================================
// Admin Button
// ============================================
interface AdminButtonProps {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  href?: string
  onClick?: () => void
  disabled?: boolean
  icon?: ReactNode
  className?: string
}

const buttonVariants = {
  primary: 'bg-aqua text-[#04110d] hover:bg-aqua-bright font-semibold',
  secondary: 'bg-surface-2 text-ink-1 border border-stroke-1 hover:border-stroke-2 hover:text-ink-0',
  danger: 'bg-red-500/10 text-red-300 ring-1 ring-inset ring-red-500/30 hover:bg-red-500/20',
  ghost: 'text-ink-2 hover:text-ink-0 hover:bg-white/[0.04]',
}

const buttonSizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
}

export function AdminButton({
  children,
  variant = 'primary',
  size = 'md',
  href,
  onClick,
  disabled,
  icon,
  className = ''
}: AdminButtonProps) {
  const classes = `
    inline-flex items-center justify-center font-medium rounded-lg
    transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-aqua/60
    disabled:opacity-50 disabled:cursor-not-allowed
    ${buttonVariants[variant]} ${buttonSizes[size]} ${className}
  `

  const content = (
    <>
      {icon && <span className="mr-2 -ml-0.5">{icon}</span>}
      {children}
    </>
  )

  if (href) {
    return <Link href={href} className={classes}>{content}</Link>
  }

  return (
    <button onClick={onClick} disabled={disabled} className={classes}>
      {content}
    </button>
  )
}

// ============================================
// Admin Skeleton Loaders
// ============================================
export function AdminSkeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-surface-3 rounded ${className}`} />
}

export function AdminStatCardSkeleton() {
  return (
    <div className="bg-surface-2 rounded-xl border border-stroke-0 p-5">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <AdminSkeleton className="h-4 w-24 mb-3" />
          <AdminSkeleton className="h-9 w-20" />
        </div>
        <AdminSkeleton className="h-12 w-12 rounded-lg" />
      </div>
    </div>
  )
}

export function AdminTableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <tr>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-6 py-4">
          <AdminSkeleton className="h-5 w-full max-w-[200px]" />
        </td>
      ))}
    </tr>
  )
}

export function AdminPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-start gap-4">
        <AdminSkeleton className="w-12 h-12 rounded-xl" />
        <div>
          <AdminSkeleton className="h-8 w-48 mb-2" />
          <AdminSkeleton className="h-4 w-64" />
        </div>
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <AdminStatCardSkeleton key={i} />
        ))}
      </div>

      {/* Table skeleton */}
      <div className="bg-surface-2 rounded-xl border border-stroke-0 overflow-hidden">
        <div className="p-4 border-b border-stroke-0">
          <AdminSkeleton className="h-10 w-full max-w-md" />
        </div>
        <div className="divide-y divide-stroke-0">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="px-6 py-4 flex gap-4">
              <AdminSkeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <AdminSkeleton className="h-5 w-48" />
                <AdminSkeleton className="h-4 w-32" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ============================================
// Admin Tabs
// ============================================
interface AdminTab {
  id: string
  label: string
  icon?: ReactNode
  count?: number
}

interface AdminTabsProps {
  tabs: AdminTab[]
  activeTab: string
  onChange: (tabId: string) => void
}

export function AdminTabs({ tabs, activeTab, onChange }: AdminTabsProps) {
  return (
    <div className="border-b border-stroke-0">
      <nav className="-mb-px flex space-x-8" aria-label="Tabs">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`
                group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                ${isActive
                  ? 'border-aqua text-aqua'
                  : 'border-transparent text-ink-2 hover:text-ink-1 hover:border-stroke-2'
                }
              `}
            >
              {tab.icon && (
                <span className={`mr-2 ${isActive ? 'text-aqua' : 'text-ink-3 group-hover:text-ink-2'}`}>
                  {tab.icon}
                </span>
              )}
              {tab.label}
              {typeof tab.count === 'number' && (
                <span
                  className={`ml-2 py-0.5 px-2 rounded-full text-xs font-medium
                    ${isActive
                      ? 'bg-aqua/10 text-aqua'
                      : 'bg-surface-3 text-ink-2'
                    }
                  `}
                >
                  {tab.count}
                </span>
              )}
            </button>
          )
        })}
      </nav>
    </div>
  )
}
