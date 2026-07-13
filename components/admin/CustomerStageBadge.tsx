interface CustomerStageBadgeProps {
  stage: string
}

export function CustomerStageBadge({ stage }: CustomerStageBadgeProps) {
  const stageConfig: Record<string, { label: string; className: string; tooltip: string }> = {
    consultation_requested: {
      label: 'Consultation Requested',
      className: 'bg-aqua/10 text-aqua ring-1 ring-inset ring-aqua/25',
      tooltip: 'Initial consultation request received',
    },
    consultation_in_progress: {
      label: 'Consultation In Progress',
      className: 'bg-aqua/20 text-aqua ring-1 ring-inset ring-aqua/25',
      tooltip: 'Consultation meetings ongoing',
    },
    consultation_completed: {
      label: 'Consultation Done',
      className: 'bg-indigo-500/10 text-indigo-300 ring-1 ring-inset ring-indigo-500/25',
      tooltip: 'Discovery meeting completed',
    },
    proposal_development: {
      label: 'Developing Proposal',
      className: 'bg-purple-500/10 text-purple-300 ring-1 ring-inset ring-purple-500/25',
      tooltip: 'Investigating solutions and preparing proposal',
    },
    proposal_sent: {
      label: 'Proposal Sent',
      className: 'bg-cyan-500/10 text-cyan-300 ring-1 ring-inset ring-cyan-500/25',
      tooltip: 'Proposal sent to customer for review',
    },
    negotiation: {
      label: 'Negotiating',
      className: 'bg-yellow-500/10 text-yellow-300 ring-1 ring-inset ring-yellow-500/25',
      tooltip: 'Customer reviewing and negotiating terms',
    },
    project_active: {
      label: 'Project Active',
      className: 'bg-green-500/10 text-green-300 ring-1 ring-inset ring-green-500/25',
      tooltip: 'Project work in progress',
    },
    implementation: {
      label: 'Implementing',
      className: 'bg-teal-500/10 text-teal-300 ring-1 ring-inset ring-teal-500/25',
      tooltip: 'Solution being implemented',
    },
    delivered: {
      label: 'Delivered',
      className: 'bg-emerald-500/10 text-emerald-300 ring-1 ring-inset ring-emerald-500/25',
      tooltip: 'Solution demonstrated and delivered',
    },
    signed_off: {
      label: 'Signed Off',
      className: 'bg-lime-500/10 text-lime-300 ring-1 ring-inset ring-lime-500/25',
      tooltip: 'Customer has signed off on completion',
    },
    closed_won: {
      label: 'Closed Won',
      className: 'bg-green-500/20 text-green-300 ring-1 ring-inset ring-green-500/25 font-semibold',
      tooltip: 'Project successfully completed and paid',
    },
    closed_lost: {
      label: 'Closed Lost',
      className: 'bg-surface-3 text-ink-2 ring-1 ring-inset ring-stroke-1',
      tooltip: 'Opportunity lost',
    },
  }

  const config = stageConfig[stage] || {
    label: stage,
    className: 'bg-surface-3 text-ink-1',
    tooltip: '',
  }

  return (
    <span
      className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${config.className}`}
      title={config.tooltip}
    >
      {config.label}
    </span>
  )
}
