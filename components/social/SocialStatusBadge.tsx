'use client'

import type { SocialPostStatus } from '@/lib/social/types'

interface SocialStatusBadgeProps {
  status: SocialPostStatus
  size?: 'sm' | 'md'
  className?: string
}

const statusConfig: Record<
  SocialPostStatus,
  { label: string; className: string; icon?: string }
> = {
  draft: {
    label: 'Draft',
    className: 'bg-gray-100 text-gray-800',
    icon: undefined,
  },
  queued: {
    label: 'Queued',
    className: 'bg-yellow-100 text-yellow-800',
    icon: undefined,
  },
  scheduled: {
    label: 'Scheduled',
    className: 'bg-blue-100 text-blue-800',
    icon: undefined,
  },
  publishing: {
    label: 'Publishing',
    className: 'bg-purple-100 text-purple-800 animate-pulse',
    icon: undefined,
  },
  needs_review: {
    label: 'Needs review',
    className: 'bg-slate-100 text-slate-700',
    icon: undefined,
  },
  published: {
    label: 'Published',
    className: 'bg-green-100 text-green-800',
    icon: undefined,
  },
  failed: {
    label: 'Failed',
    className: 'bg-red-100 text-red-800',
    icon: undefined,
  },
}

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
}

export default function SocialStatusBadge({
  status,
  size = 'sm',
  className = '',
}: SocialStatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full ${config.className} ${sizeClasses[size]} ${className}`}
    >
      {config.label}
    </span>
  )
}
