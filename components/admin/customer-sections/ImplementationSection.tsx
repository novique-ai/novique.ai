'use client'

import { PhaseInteractionLog } from '@/components/admin/PhaseInteractionLog'
import { PhaseActionItems } from '@/components/admin/PhaseActionItems'
import type { Interaction, ActionItem, AdminUser } from '@/types/crm'

interface ImplementationSectionProps {
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

export function ImplementationSection({
  formData,
  updateField,
  interactions,
  actionItems,
  customerId,
  customerNumber,
  adminUsers,
  onInteractionsChanged,
  onActionItemsChanged,
}: ImplementationSectionProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-ink-1">Implementation Date</label>
          <input
            type="date"
            value={formData.implementation_date || ''}
            onChange={(e) => updateField('implementation_date', e.target.value)}
            className="mt-1 block w-full rounded-md bg-surface-1 border-stroke-1 text-ink-0 placeholder-ink-3 shadow-sm focus:border-aqua/50 focus:ring-aqua/60"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink-1">Demonstration Date</label>
          <input
            type="date"
            value={formData.demonstration_date || ''}
            onChange={(e) => updateField('demonstration_date', e.target.value)}
            className="mt-1 block w-full rounded-md bg-surface-1 border-stroke-1 text-ink-0 placeholder-ink-3 shadow-sm focus:border-aqua/50 focus:ring-aqua/60"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PhaseInteractionLog
          interactions={interactions}
          customerId={customerId}
          phase="implementation"
          customerNumber={customerNumber}
          onAdded={onInteractionsChanged}
        />
        <PhaseActionItems
          actionItems={actionItems}
          customerId={customerId}
          phase="implementation"
          customerNumber={customerNumber}
          adminUsers={adminUsers}
          onChanged={onActionItemsChanged}
        />
      </div>
    </div>
  )
}
