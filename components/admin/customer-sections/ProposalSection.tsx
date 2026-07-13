'use client'

import { PhaseInteractionLog } from '@/components/admin/PhaseInteractionLog'
import { PhaseActionItems } from '@/components/admin/PhaseActionItems'
import type { Interaction, ActionItem, AdminUser } from '@/types/crm'

interface ProposalSectionProps {
  formData: any
  updateField: (field: any, value: any) => void
  interactions: Interaction[]
  actionItems: ActionItem[]
  customerId: string
  customerNumber?: string
  adminUsers: AdminUser[]
  onInteractionsChanged: () => void
  onActionItemsChanged: () => void
}

export function ProposalSection({
  formData,
  updateField,
  interactions,
  actionItems,
  customerId,
  customerNumber,
  adminUsers,
  onInteractionsChanged,
  onActionItemsChanged,
}: ProposalSectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-ink-1">Investigation Notes</label>
        <textarea
          rows={6}
          value={formData.investigation_notes || ''}
          onChange={(e) => updateField('investigation_notes', e.target.value)}
          placeholder="Notes from investigating possible improvements..."
          className="mt-1 block w-full rounded-md bg-surface-1 border-stroke-1 text-ink-0 placeholder-ink-3 shadow-sm focus:border-aqua/50 focus:ring-aqua/60"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-ink-1">Proposed Solutions</label>
        <textarea
          rows={6}
          value={formData.proposed_solutions?.join('\n') || ''}
          onChange={(e) => updateField('proposed_solutions', e.target.value.split('\n').filter((s: string) => s.trim()))}
          placeholder="Enter each solution on a new line..."
          className="mt-1 block w-full rounded-md bg-surface-1 border-stroke-1 text-ink-0 placeholder-ink-3 shadow-sm focus:border-aqua/50 focus:ring-aqua/60"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-ink-1">Proposal Presentation Date/Time</label>
          <input
            type="datetime-local"
            value={formData.proposal_presentation_datetime || ''}
            onChange={(e) => updateField('proposal_presentation_datetime', e.target.value)}
            className="mt-1 block w-full rounded-md bg-surface-1 border-stroke-1 text-ink-0 placeholder-ink-3 shadow-sm focus:border-aqua/50 focus:ring-aqua/60"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink-1">Proposal Location</label>
          <input
            type="text"
            value={formData.proposal_location || ''}
            onChange={(e) => updateField('proposal_location', e.target.value)}
            placeholder="Virtual, Office, Customer site..."
            className="mt-1 block w-full rounded-md bg-surface-1 border-stroke-1 text-ink-0 placeholder-ink-3 shadow-sm focus:border-aqua/50 focus:ring-aqua/60"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PhaseInteractionLog
          interactions={interactions}
          customerId={customerId}
          phase="proposal"
          customerNumber={customerNumber}
          onAdded={onInteractionsChanged}
        />
        <PhaseActionItems
          actionItems={actionItems}
          customerId={customerId}
          phase="proposal"
          customerNumber={customerNumber}
          adminUsers={adminUsers}
          onChanged={onActionItemsChanged}
        />
      </div>
    </div>
  )
}
