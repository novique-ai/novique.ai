import { requireAdminOrEditor } from '@/lib/auth/session'
import { AdminNav } from '@/components/admin/AdminNav'

/**
 * Admin layout - requires admin or editor role
 *
 * This layout wraps all /admin/* routes and enforces that:
 * 1. User must be authenticated
 * 2. User must have 'admin' or 'editor' role
 * 3. User account must be active
 *
 * Editors have read-only access to customer data and full access to blog management.
 * If any condition fails, user is redirected to /unauthorized or /login
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // This will redirect if not authenticated or not admin/editor
  const user = await requireAdminOrEditor()

  return (
    <div className="theme-dark min-h-screen bg-surface-0 font-sans text-ink-1 antialiased">
      {/* Admin Navigation */}
      <AdminNav user={user} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}
