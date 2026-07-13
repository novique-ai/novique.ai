import { requireRole } from '@/lib/auth/session'
import { EditorNav } from '@/components/editor/EditorNav'

/**
 * Editor layout - requires editor or admin role
 *
 * This layout wraps all /editor/* routes and enforces that:
 * 1. User must be authenticated
 * 2. User must have 'editor' or 'admin' role
 * 3. User account must be active
 *
 * If any condition fails, user is redirected to /unauthorized or /login
 */
export default async function EditorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // This will redirect if not authenticated or not editor/admin
  const user = await requireRole(['admin', 'editor'])

  return (
    <div className="theme-dark min-h-screen bg-surface-0 font-sans text-ink-1 antialiased">
      {/* Editor Navigation */}
      <EditorNav user={user} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}
