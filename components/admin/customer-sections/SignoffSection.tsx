'use client'

import { PhaseInteractionLog } from '@/components/admin/PhaseInteractionLog'
import { PhaseActionItems } from '@/components/admin/PhaseActionItems'
import type { Interaction, ActionItem, AdminUser } from '@/types/crm'

interface SignoffSectionProps {
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

export function SignoffSection({
  formData,
  updateField,
  interactions,
  actionItems,
  customerId,
  customerNumber,
  adminUsers,
  onInteractionsChanged,
  onActionItemsChanged,
}: SignoffSectionProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-ink-1">Sign-off Date</label>
          <input
            type="date"
            value={formData.signoff_date || ''}
            onChange={(e) => updateField('signoff_date', e.target.value)}
            className="mt-1 block w-full rounded-md bg-surface-1 border-stroke-1 text-ink-0 placeholder-ink-3 shadow-sm focus:border-aqua/50 focus:ring-aqua/60"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink-1">Payment Status</label>
          <select
            value={formData.payment_status}
            onChange={(e) => updateField('payment_status', e.target.value)}
            className="mt-1 block w-full rounded-md bg-surface-1 border-stroke-1 text-ink-0 placeholder-ink-3 shadow-sm focus:border-aqua/50 focus:ring-aqua/60"
          >
            <option value="not_applicable">Not Applicable</option>
            <option value="pending">Pending</option>
            <option value="partial">Partial</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-ink-1">Sign-off Notes</label>
        <textarea
          rows={4}
          value={formData.signoff_notes || ''}
          onChange={(e) => updateField('signoff_notes', e.target.value)}
          className="mt-1 block w-full rounded-md bg-surface-1 border-stroke-1 text-ink-0 placeholder-ink-3 shadow-sm focus:border-aqua/50 focus:ring-aqua/60"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-ink-1">Payment Info</label>
        <textarea
          rows={3}
          value={formData.payment_info || ''}
          onChange={(e) => updateField('payment_info', e.target.value)}
          placeholder="Invoice number, payment method, etc..."
          className="mt-1 block w-full rounded-md bg-surface-1 border-stroke-1 text-ink-0 placeholder-ink-3 shadow-sm focus:border-aqua/50 focus:ring-aqua/60"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-ink-1">Payment Confirmed Date</label>
        <input
          type="date"
          value={formData.payment_confirmed_date || ''}
          onChange={(e) => updateField('payment_confirmed_date', e.target.value)}
          className="mt-1 block w-full rounded-md bg-surface-1 border-stroke-1 text-ink-0 placeholder-ink-3 shadow-sm focus:border-aqua/50 focus:ring-aqua/60"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PhaseInteractionLog
          interactions={interactions}
          customerId={customerId}
          phase="signoff"
          customerNumber={customerNumber}
          onAdded={onInteractionsChanged}
        />
        <PhaseActionItems
          actionItems={actionItems}
          customerId={customerId}
          phase="signoff"
          customerNumber={customerNumber}
          adminUsers={adminUsers}
          onChanged={onActionItemsChanged}
        />
      </div>
    </div>
  )
}
