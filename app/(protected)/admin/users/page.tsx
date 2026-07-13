'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface User {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'editor',
  })
  const [creating, setCreating] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-500/10 text-purple-300 ring-1 ring-inset ring-purple-500/25'
      case 'editor':
        return 'bg-aqua/10 text-aqua ring-1 ring-inset ring-aqua/25'
      case 'viewer':
        return 'bg-surface-3 text-ink-1 ring-1 ring-inset ring-stroke-1'
      default:
        return 'bg-surface-3 text-ink-1 ring-1 ring-inset ring-stroke-1'
    }
  }

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Full access'
      case 'editor':
        return 'Blog & stats'
      case 'viewer':
        return 'Read-only'
      default:
        return role
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers() {
    try {
      const response = await fetch('/api/admin/users')
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load users')
      }

      setUsers(result.data || [])
    } catch (error: any) {
      console.error('Error loading users:', error)
      setMessage({ type: 'error', text: error.message || 'Failed to load users' })
    } finally {
      setLoading(false)
    }
  }

  async function createUser() {
    if (!newUser.email || !newUser.password || !newUser.full_name) {
      setMessage({ type: 'error', text: 'Please fill in all fields' })
      return
    }

    setCreating(true)
    setMessage(null)

    try {
      const response = await fetch('/api/admin/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create user')
      }

      setMessage({ type: 'success', text: `User ${newUser.email} created successfully!` })
      setShowCreateModal(false)
      setNewUser({ email: '', password: '', full_name: '', role: 'editor' })
      loadUsers()
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setCreating(false)
    }
  }

  async function toggleUserStatus(userId: string, currentStatus: boolean) {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !currentStatus })
        .eq('id', userId)

      if (error) throw error

      setMessage({
        type: 'success',
        text: `User ${!currentStatus ? 'activated' : 'deactivated'} successfully`,
      })
      loadUsers()
    } catch (error) {
      console.error('Error updating user:', error)
      setMessage({ type: 'error', text: 'Failed to update user status' })
    }
  }

  async function updateUserRole(userId: string, newRole: string) {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId)

      if (error) throw error

      setMessage({ type: 'success', text: 'User role updated successfully' })
      loadUsers()
    } catch (error) {
      console.error('Error updating role:', error)
      setMessage({ type: 'error', text: 'Failed to update user role' })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-ink-1">Loading users...</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink-0">User Management</h1>
          <p className="mt-1 text-sm text-ink-2">
            Manage admin users and their access
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-semibold text-[#04110d] bg-aqua hover:bg-aqua-bright"
        >
          Create New User
        </button>
      </div>

      {message && (
        <div
          className={`mb-4 p-4 rounded-md ${
            message.type === 'success'
              ? 'bg-green-500/10 text-green-300 ring-1 ring-inset ring-green-500/25'
              : 'bg-red-500/10 text-red-300 ring-1 ring-inset ring-red-500/25'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="bg-surface-2 shadow overflow-hidden sm:rounded-lg">
        <table className="min-w-full divide-y divide-stroke-0">
          <thead className="bg-surface-1">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-ink-2 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-ink-2 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-ink-2 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-ink-2 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-ink-2 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-transparent divide-y divide-stroke-0">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.full_name || user.email}
                        className="h-10 w-10 rounded-full"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-surface-3 flex items-center justify-center text-ink-1 font-medium">
                        {(user.full_name || user.email)[0].toUpperCase()}
                      </div>
                    )}
                    <div className="ml-4">
                      <div className="text-sm font-medium text-ink-0">
                        {user.full_name || 'No name'}
                      </div>
                      <div className="text-sm text-ink-2">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col gap-1">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full w-fit ${getRoleBadgeColor(user.role)}`}>
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                    <span className="text-xs text-ink-2">{getRoleDescription(user.role)}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.is_active
                        ? 'bg-green-500/10 text-green-300 ring-1 ring-inset ring-green-500/25'
                        : 'bg-red-500/10 text-red-300 ring-1 ring-inset ring-red-500/25'
                    }`}
                  >
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-ink-2">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    <select
                      value={user.role}
                      onChange={(e) => updateUserRole(user.id, e.target.value)}
                      className="text-xs px-2 py-1.5 bg-surface-1 border border-stroke-1 text-ink-0 rounded-md"
                      title="Change role"
                    >
                      <option value="admin">Make Admin</option>
                      <option value="editor">Make Editor</option>
                      <option value="viewer">Make Viewer</option>
                    </select>
                    <button
                      onClick={() => toggleUserStatus(user.id, user.is_active)}
                      className="text-aqua hover:text-aqua-bright"
                    >
                      {user.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity" />

            <div className="inline-block align-bottom bg-surface-2 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <h3 className="text-lg leading-6 font-medium text-ink-0 mb-4">
                  Create New User
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-ink-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={newUser.full_name}
                      onChange={(e) =>
                        setNewUser({ ...newUser, full_name: e.target.value })
                      }
                      className="mt-1 block w-full rounded-md bg-surface-1 border-stroke-1 text-ink-0 placeholder-ink-3 shadow-sm focus:border-aqua/50 focus:ring-aqua/60"
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-ink-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={newUser.email}
                      onChange={(e) =>
                        setNewUser({ ...newUser, email: e.target.value })
                      }
                      className="mt-1 block w-full rounded-md bg-surface-1 border-stroke-1 text-ink-0 placeholder-ink-3 shadow-sm focus:border-aqua/50 focus:ring-aqua/60"
                      placeholder="john@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-ink-1">
                      Password
                    </label>
                    <input
                      type="password"
                      value={newUser.password}
                      onChange={(e) =>
                        setNewUser({ ...newUser, password: e.target.value })
                      }
                      className="mt-1 block w-full rounded-md bg-surface-1 border-stroke-1 text-ink-0 placeholder-ink-3 shadow-sm focus:border-aqua/50 focus:ring-aqua/60"
                      placeholder="Min 8 characters"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-ink-1 mb-3">
                      Role & Permissions
                    </label>
                    <div className="space-y-3">
                      <label className="relative flex cursor-pointer rounded-lg border border-stroke-1 bg-surface-1 p-4 shadow-sm focus:outline-none">
                        <input
                          type="radio"
                          name="role"
                          value="admin"
                          checked={newUser.role === 'admin'}
                          onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                          className="mt-0.5 h-4 w-4 shrink-0 accent-[#2be8c2] border-stroke-1 focus:ring-aqua/60"
                        />
                        <span className="ml-3 flex flex-col">
                          <span className="block text-sm font-medium text-ink-0">Admin</span>
                          <span className="block text-sm text-ink-2">
                            Full access to all features: customers, consultations, users, blog, and stats
                          </span>
                        </span>
                      </label>

                      <label className="relative flex cursor-pointer rounded-lg border border-stroke-1 bg-surface-1 p-4 shadow-sm focus:outline-none">
                        <input
                          type="radio"
                          name="role"
                          value="editor"
                          checked={newUser.role === 'editor'}
                          onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                          className="mt-0.5 h-4 w-4 shrink-0 accent-[#2be8c2] border-stroke-1 focus:ring-aqua/60"
                        />
                        <span className="ml-3 flex flex-col">
                          <span className="block text-sm font-medium text-ink-0">Editor</span>
                          <span className="block text-sm text-ink-2">
                            Can view stats/dashboard and manage blog posts. Cannot access customers or consultations.
                          </span>
                        </span>
                      </label>

                      <label className="relative flex cursor-pointer rounded-lg border border-stroke-1 bg-surface-1 p-4 shadow-sm focus:outline-none">
                        <input
                          type="radio"
                          name="role"
                          value="viewer"
                          checked={newUser.role === 'viewer'}
                          onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                          className="mt-0.5 h-4 w-4 shrink-0 accent-[#2be8c2] border-stroke-1 focus:ring-aqua/60"
                        />
                        <span className="ml-3 flex flex-col">
                          <span className="block text-sm font-medium text-ink-0">Viewer</span>
                          <span className="block text-sm text-ink-2">
                            Read-only access to blog posts. Cannot access any other features.
                          </span>
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                <button
                  type="button"
                  disabled={creating}
                  onClick={createUser}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-aqua text-base font-semibold text-[#04110d] hover:bg-aqua-bright focus:outline-none sm:col-start-2 sm:text-sm disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create User'}
                </button>
                <button
                  type="button"
                  disabled={creating}
                  onClick={() => {
                    setShowCreateModal(false)
                    setNewUser({ email: '', password: '', full_name: '', role: 'editor' })
                    setMessage(null)
                  }}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-stroke-1 shadow-sm px-4 py-2 bg-surface-2 text-base font-medium text-ink-1 hover:bg-surface-3/60 focus:outline-none sm:mt-0 sm:col-start-1 sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
