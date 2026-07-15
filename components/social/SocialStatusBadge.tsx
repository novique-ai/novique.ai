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
    className: 'bg-surface-3 text-ink-1 ring-1 ring-inset ring-stroke-1',
    icon: undefined,
  },
  queued: {
    label: 'Queued',
    className: 'bg-amber-500/10 text-amber-300 ring-1 ring-inset ring-amber-500/25',
    icon: undefined,
  },
  scheduled: {
    label: 'Scheduled',
    className: 'bg-aqua/10 text-aqua ring-1 ring-inset ring-aqua/25',
    icon: undefined,
  },
  publishing: {
    label: 'Publishing',
    className: 'bg-purple-500/10 text-purple-300 ring-1 ring-inset ring-purple-500/25 animate-pulse',
    icon: undefined,
  },
  needs_review: {
    label: 'Needs review',
    className: 'bg-amber-500/10 text-amber-300 ring-1 ring-inset ring-amber-500/25',
    icon: undefined,
  },
  published: {
    label: 'Published',
    className: 'bg-green-500/10 text-green-300 ring-1 ring-inset ring-green-500/25',
    icon: undefined,
  },
  failed: {
    label: 'Failed',
    className: 'bg-red-500/10 text-red-300 ring-1 ring-inset ring-red-500/25',
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
