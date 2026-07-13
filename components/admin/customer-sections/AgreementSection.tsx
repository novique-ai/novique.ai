'use client'

import { PhaseInteractionLog } from '@/components/admin/PhaseInteractionLog'
import { PhaseActionItems } from '@/components/admin/PhaseActionItems'
import type { Interaction, ActionItem, AdminUser } from '@/types/crm'

interface AgreementSectionProps {
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

export function AgreementSection({
  formData,
  updateField,
  interactions,
  actionItems,
  customerId,
  customerNumber,
  adminUsers,
  onInteractionsChanged,
  onActionItemsChanged,
}: AgreementSectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-ink-1">Accepted Solutions</label>
        <textarea
          rows={6}
          value={formData.accepted_solutions?.join('\n') || ''}
          onChange={(e) => updateField('accepted_solutions', e.target.value.split('\n').filter((s: string) => s.trim()))}
          placeholder="Enter each accepted solution on a new line..."
          className="mt-1 block w-full rounded-md bg-surface-1 border-stroke-1 text-ink-0 placeholder-ink-3 shadow-sm focus:border-aqua/50 focus:ring-aqua/60"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-ink-1">Implementation Cost</label>
          <input
            type="number"
            step="0.01"
            value={formData.agreed_implementation_cost || ''}
            onChange={(e) => updateField('agreed_implementation_cost', parseFloat(e.target.value))}
            placeholder="0.00"
            className="mt-1 block w-full rounded-md bg-surface-1 border-stroke-1 text-ink-0 placeholder-ink-3 shadow-sm focus:border-aqua/50 focus:ring-aqua/60"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink-1">Recurring Cost (Monthly)</label>
          <input
            type="number"
            step="0.01"
            value={formData.agreed_recurring_cost || ''}
            onChange={(e) => updateField('agreed_recurring_cost', parseFloat(e.target.value))}
            placeholder="0.00"
            className="mt-1 block w-full rounded-md bg-surface-1 border-stroke-1 text-ink-0 placeholder-ink-3 shadow-sm focus:border-aqua/50 focus:ring-aqua/60"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-ink-1">Delivery Requirements</label>
        <textarea
          rows={4}
          value={formData.delivery_requirements || ''}
          onChange={(e) => updateField('delivery_requirements', e.target.value)}
          placeholder="Specific requirements for delivery..."
          className="mt-1 block w-full rounded-md bg-surface-1 border-stroke-1 text-ink-0 placeholder-ink-3 shadow-sm focus:border-aqua/50 focus:ring-aqua/60"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PhaseInteractionLog
          interactions={interactions}
          customerId={customerId}
          phase="agreement"
          customerNumber={customerNumber}
          onAdded={onInteractionsChanged}
        />
        <PhaseActionItems
          actionItems={actionItems}
          customerId={customerId}
          phase="agreement"
          customerNumber={customerNumber}
          adminUsers={adminUsers}
          onChanged={onActionItemsChanged}
        />
      </div>
    </div>
  )
}
