'use client'

import { PhaseInteractionLog } from '@/components/admin/PhaseInteractionLog'
import { PhaseActionItems } from '@/components/admin/PhaseActionItems'
import type { Interaction, ActionItem, AdminUser } from '@/types/crm'

interface DeliverySectionProps {
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

export function DeliverySection({
  formData,
  updateField,
  interactions,
  actionItems,
  customerId,
  customerNumber,
  adminUsers,
  onInteractionsChanged,
  onActionItemsChanged,
}: DeliverySectionProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-ink-1">Solution Due Date</label>
          <input
            type="date"
            value={formData.solution_due_date || ''}
            onChange={(e) => updateField('solution_due_date', e.target.value)}
            className="mt-1 block w-full rounded-md bg-surface-1 border-stroke-1 text-ink-0 placeholder-ink-3 shadow-sm focus:border-aqua/50 focus:ring-aqua/60"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink-1">GA Date (from customer)</label>
          <input
            type="date"
            value={formData.ga_date || ''}
            onChange={(e) => updateField('ga_date', e.target.value)}
            className="mt-1 block w-full rounded-md bg-surface-1 border-stroke-1 text-ink-0 placeholder-ink-3 shadow-sm focus:border-aqua/50 focus:ring-aqua/60"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-ink-1">GitHub Repo URL</label>
          <input
            type="url"
            value={formData.github_repo_url || ''}
            onChange={(e) => updateField('github_repo_url', e.target.value)}
            placeholder="https://github.com/..."
            className="mt-1 block w-full rounded-md bg-surface-1 border-stroke-1 text-ink-0 placeholder-ink-3 shadow-sm focus:border-aqua/50 focus:ring-aqua/60"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink-1">Wekan Board URL</label>
          <input
            type="url"
            value={formData.wekan_board_url || ''}
            onChange={(e) => updateField('wekan_board_url', e.target.value)}
            placeholder="http://localhost:8080/..."
            className="mt-1 block w-full rounded-md bg-surface-1 border-stroke-1 text-ink-0 placeholder-ink-3 shadow-sm focus:border-aqua/50 focus:ring-aqua/60"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PhaseInteractionLog
          interactions={interactions}
          customerId={customerId}
          phase="delivery"
          customerNumber={customerNumber}
          onAdded={onInteractionsChanged}
        />
        <PhaseActionItems
          actionItems={actionItems}
          customerId={customerId}
          phase="delivery"
          customerNumber={customerNumber}
          adminUsers={adminUsers}
          onChanged={onActionItemsChanged}
        />
      </div>
    </div>
  )
}
