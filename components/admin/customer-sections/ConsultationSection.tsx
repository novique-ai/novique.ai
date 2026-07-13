'use client'

import { PhaseInteractionLog } from '@/components/admin/PhaseInteractionLog'
import { PhaseActionItems } from '@/components/admin/PhaseActionItems'
import type { Interaction, ActionItem, AdminUser } from '@/types/crm'

interface ConsultationSectionProps {
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

export function ConsultationSection({
  formData,
  updateField,
  interactions,
  actionItems,
  customerId,
  customerNumber,
  adminUsers,
  onInteractionsChanged,
  onActionItemsChanged,
}: ConsultationSectionProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-ink-1">Consultation Date</label>
          <input
            type="date"
            value={formData.consultation_occurred_date || ''}
            onChange={(e) => updateField('consultation_occurred_date', e.target.value)}
            className="mt-1 block w-full rounded-md bg-surface-1 border-stroke-1 text-ink-0 placeholder-ink-3 shadow-sm focus:border-aqua/50 focus:ring-aqua/60"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-ink-1">Consultation Notes</label>
        <textarea
          rows={6}
          value={formData.consultation_notes || ''}
          onChange={(e) => updateField('consultation_notes', e.target.value)}
          placeholder="Notes from the discovery meeting..."
          className="mt-1 block w-full rounded-md bg-surface-1 border-stroke-1 text-ink-0 placeholder-ink-3 shadow-sm focus:border-aqua/50 focus:ring-aqua/60"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PhaseInteractionLog
          interactions={interactions}
          customerId={customerId}
          phase="consultation"
          customerNumber={customerNumber}
          onAdded={onInteractionsChanged}
        />
        <PhaseActionItems
          actionItems={actionItems}
          customerId={customerId}
          phase="consultation"
          customerNumber={customerNumber}
          adminUsers={adminUsers}
          onChanged={onActionItemsChanged}
        />
      </div>
    </div>
  )
}
