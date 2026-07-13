interface ProjectHealthIndicatorProps {
  status: string
  blockers?: string
  dueDate?: string
}

export function ProjectHealthIndicator({
  status,
  blockers,
  dueDate,
}: ProjectHealthIndicatorProps) {
  const statusConfig: Record<string, { label: string; icon: string; className: string }> = {
    on_track: {
      label: 'On Track',
      icon: '🟢',
      className: 'text-green-300 bg-green-500/10 border-green-500/25',
    },
    at_risk: {
      label: 'At Risk',
      icon: '🟡',
      className: 'text-yellow-300 bg-yellow-500/10 border-yellow-500/25',
    },
    delayed: {
      label: 'Delayed',
      icon: '🔴',
      className: 'text-red-300 bg-red-500/10 border-red-500/25',
    },
    blocked: {
      label: 'Blocked',
      icon: '🛑',
      className: 'text-red-300 bg-red-500/20 border-red-500/40',
    },
    completed: {
      label: 'Completed',
      icon: '✅',
      className: 'text-green-300 bg-green-500/20 border-green-500/40',
    },
  }

  const config = statusConfig[status] || statusConfig.on_track

  // Check if due date is approaching (within 7 days)
  const isDueSoon = dueDate && new Date(dueDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  return (
    <div className={`inline-flex flex-col gap-1 px-3 py-2 rounded-lg border ${config.className}`}>
      <div className="flex items-center gap-2">
        <span className="text-lg">{config.icon}</span>
        <span className="font-medium text-sm">{config.label}</span>
      </div>

      {blockers && (
        <div className="text-xs mt-1">
          <span className="font-semibold">Blockers:</span> {blockers}
        </div>
      )}

      {isDueSoon && dueDate && (
        <div className="text-xs mt-1 font-medium text-red-400">
          ⚠️ Due: {new Date(dueDate).toLocaleDateString()}
        </div>
      )}
    </div>
  )
}
