'use client'

import { useState } from 'react'
import type { CrmPhase, ActionItem, AdminUser } from '@/types/crm'

interface PhaseActionItemsProps {
  actionItems: ActionItem[]
  customerId: string
  phase: CrmPhase
  customerNumber?: string
  adminUsers: AdminUser[]
  onChanged: () => void
}

export function PhaseActionItems({
  actionItems,
  customerId,
  phase,
  customerNumber,
  adminUsers,
  onChanged,
}: PhaseActionItemsProps) {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    due_date: '',
    assigned_to: '',
  })
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    due_date: '',
    assigned_to: '',
  })

  const handleAdd = async () => {
    if (!form.title.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`/api/customers/${customerId}/action-items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, phase }),
      })
      if (res.ok) {
        setForm({ title: '', description: '', due_date: '', assigned_to: '' })
        setShowForm(false)
        onChanged()
      }
    } catch (e) {
      console.error('Failed to add action item:', e)
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (item: ActionItem) => {
    setEditingId(item.id)
    setEditForm({
      title: item.title,
      description: item.description || '',
      due_date: item.due_date || '',
      assigned_to: item.assigned_label === 'Customer' ? 'customer' : (item.assigned_to || ''),
    })
  }

  const handleSaveEdit = async () => {
    if (!editingId || !editForm.title.trim()) return
    setSaving(true)
    try {
      const isCustomer = editForm.assigned_to === 'customer'
      const res = await fetch(
        `/api/customers/${customerId}/action-items/${editingId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: editForm.title,
            description: editForm.description,
            due_date: editForm.due_date,
            assigned_to: isCustomer ? '' : editForm.assigned_to,
            assigned_label: isCustomer ? 'Customer' : null,
          }),
        }
      )
      if (res.ok) {
        setEditingId(null)
        onChanged()
      }
    } catch (e) {
      console.error('Failed to update action item:', e)
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (item: ActionItem) => {
    const newStatus = item.status === 'open' ? 'completed' : 'open'
    try {
      const res = await fetch(
        `/api/customers/${customerId}/action-items/${item.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        }
      )
      if (res.ok) onChanged()
    } catch (e) {
      console.error('Failed to toggle action item:', e)
    }
  }

  const handleDelete = async (itemId: string) => {
    try {
      const res = await fetch(
        `/api/customers/${customerId}/action-items/${itemId}`,
        { method: 'DELETE' }
      )
      if (res.ok) onChanged()
    } catch (e) {
      console.error('Failed to delete action item:', e)
    }
  }

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false
    return new Date(dueDate) < new Date(new Date().toDateString())
  }

  const openItems = actionItems.filter((i) => i.status === 'open')
  const completedItems = actionItems.filter((i) => i.status === 'completed')

  const renderEditForm = () => (
    <div className="px-4 py-3 bg-aqua/10 border-b border-stroke-0 space-y-2">
      <div>
        <label className="block text-xs font-medium text-ink-1 mb-1">Title *</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="block w-full text-sm rounded-md bg-surface-1 border-stroke-1 text-ink-0 placeholder-ink-3 shadow-sm focus:border-aqua/50 focus:ring-aqua/60"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-ink-1 mb-1">Description</label>
        <textarea
          rows={2}
          value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="block w-full text-sm rounded-md bg-surface-1 border-stroke-1 text-ink-0 placeholder-ink-3 shadow-sm focus:border-aqua/50 focus:ring-aqua/60"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-ink-1 mb-1">Due Date</label>
          <input
            type="date"
            value={editForm.due_date}
            onChange={(e) => setEditForm({ ...editForm, due_date: e.target.value })}
            className="block w-full text-sm rounded-md bg-surface-1 border-stroke-1 text-ink-0 placeholder-ink-3 shadow-sm focus:border-aqua/50 focus:ring-aqua/60"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-ink-1 mb-1">Assigned To</label>
          <select
            value={editForm.assigned_to}
            onChange={(e) => setEditForm({ ...editForm, assigned_to: e.target.value })}
            className="block w-full text-sm rounded-md bg-surface-1 border-stroke-1 text-ink-0 placeholder-ink-3 shadow-sm focus:border-aqua/50 focus:ring-aqua/60"
          >
            <option value="">Unassigned</option>
            <option value="customer">Customer</option>
            {adminUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.full_name || u.email}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <button
          onClick={() => setEditingId(null)}
          className="px-3 py-1.5 text-xs font-medium text-ink-1 bg-surface-2 border border-stroke-1 hover:bg-surface-3/60 rounded-md"
        >
          Cancel
        </button>
        <button
          onClick={handleSaveEdit}
          disabled={saving || !editForm.title.trim()}
          className="px-3 py-1.5 text-xs font-semibold text-[#04110d] bg-aqua hover:bg-aqua-bright rounded-md disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  )

  return (
    <div className="border border-stroke-0 rounded-lg">
      <div className="flex items-center justify-between px-4 py-3 bg-surface-1 border-b border-stroke-0 rounded-t-lg">
        <h4 className="text-sm font-semibold text-ink-1">
          Action Items
          {customerNumber && <span className="ml-2 text-xs font-mono text-ink-3">#{customerNumber}</span>}
          {openItems.length > 0 && (
            <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-aqua/10 text-aqua ring-1 ring-inset ring-aqua/25">
              {openItems.length}
            </span>
          )}
        </h4>
        <button
          onClick={() => { setShowForm(!showForm); setEditingId(null) }}
          className="text-xs font-medium text-aqua hover:text-aqua-bright"
        >
          {showForm ? 'Cancel' : '+ Add Item'}
        </button>
      </div>

      {showForm && (
        <div className="p-4 border-b border-stroke-0 bg-aqua/10 space-y-3">
          <div>
            <label className="block text-xs font-medium text-ink-1 mb-1">Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Send updated proposal"
              className="block w-full text-sm rounded-md bg-surface-1 border-stroke-1 text-ink-0 placeholder-ink-3 shadow-sm focus:border-aqua/50 focus:ring-aqua/60"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-1 mb-1">Description</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="block w-full text-sm rounded-md bg-surface-1 border-stroke-1 text-ink-0 placeholder-ink-3 shadow-sm focus:border-aqua/50 focus:ring-aqua/60"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-ink-1 mb-1">Due Date</label>
              <input
                type="date"
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                className="block w-full text-sm rounded-md bg-surface-1 border-stroke-1 text-ink-0 placeholder-ink-3 shadow-sm focus:border-aqua/50 focus:ring-aqua/60"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-1 mb-1">Assigned To</label>
              <select
                value={form.assigned_to}
                onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}
                className="block w-full text-sm rounded-md bg-surface-1 border-stroke-1 text-ink-0 placeholder-ink-3 shadow-sm focus:border-aqua/50 focus:ring-aqua/60"
              >
                <option value="">Unassigned</option>
                <option value="customer">Customer</option>
                {adminUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name || u.email}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleAdd}
              disabled={saving || !form.title.trim()}
              className="px-3 py-1.5 text-xs font-semibold text-[#04110d] bg-aqua hover:bg-aqua-bright rounded-md disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Add Item'}
            </button>
          </div>
        </div>
      )}

      <div className="divide-y divide-stroke-0 max-h-72 overflow-y-auto">
        {actionItems.length === 0 ? (
          <p className="text-sm text-ink-3 text-center py-6">No action items yet</p>
        ) : (
          <>
            {openItems.map((item) =>
              editingId === item.id ? (
                <div key={item.id}>{renderEditForm()}</div>
              ) : (
                <div key={item.id} className="px-4 py-2.5 flex items-start gap-2 hover:bg-surface-3/60 group">
                  <input
                    type="checkbox"
                    checked={false}
                    onChange={() => handleToggle(item)}
                    className="mt-1 h-4 w-4 rounded border-stroke-1 text-aqua accent-[#2be8c2] focus:ring-aqua/60 cursor-pointer"
                  />
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => { startEdit(item); setShowForm(false) }}
                  >
                    <p className="text-sm text-ink-0">
                      {customerNumber && <span className="font-mono text-xs text-ink-3 mr-1.5">#{customerNumber}</span>}
                      {item.title}
                    </p>
                    {item.description && (
                      <p className="text-xs text-ink-2 mt-0.5 line-clamp-2">{item.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      {item.due_date && (
                        <span
                          className={`text-xs ${
                            isOverdue(item.due_date)
                              ? 'text-red-400 font-medium'
                              : 'text-ink-3'
                          }`}
                        >
                          Due {new Date(item.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                      {(item.assigned_to_profile?.full_name || item.assigned_label) && (
                        <span className="text-xs text-ink-3">
                          → {item.assigned_to_profile?.full_name || item.assigned_label}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                    <button
                      onClick={() => { startEdit(item); setShowForm(false) }}
                      className="text-ink-3 hover:text-aqua p-0.5"
                      title="Edit"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-ink-3 hover:text-red-400 p-0.5"
                      title="Delete"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              )
            )}
            {completedItems.map((item) => (
              <div key={item.id} className="px-4 py-2.5 flex items-start gap-2 hover:bg-surface-3/60 group opacity-60">
                <input
                  type="checkbox"
                  checked={true}
                  onChange={() => handleToggle(item)}
                  className="mt-1 h-4 w-4 rounded border-stroke-1 text-aqua accent-[#2be8c2] focus:ring-aqua/60 cursor-pointer"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-ink-2 line-through">
                    {customerNumber && <span className="font-mono text-xs text-ink-3 mr-1.5">#{customerNumber}</span>}
                    {item.title}
                  </p>
                  {item.completed_at && (
                    <p className="text-xs text-ink-3 mt-0.5">
                      Completed {new Date(item.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="opacity-0 group-hover:opacity-100 text-ink-3 hover:text-red-400 p-0.5"
                  title="Delete"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
