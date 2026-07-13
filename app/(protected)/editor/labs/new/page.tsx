import { getCurrentUser } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import LabForm from '@/components/labs/LabForm'
import { AdminPageHeader, AdminCard } from '@/components/admin/AdminUI'

// Icons
const LabIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
  </svg>
)

export default async function NewLabPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  if (user.role !== 'admin' && user.role !== 'editor') {
    redirect('/editor')
  }

  const isAdmin = user.role === 'admin'

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-2 text-sm">
          <li>
            <Link href="/editor/dashboard" className="text-ink-2 hover:text-aqua transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </Link>
          </li>
          <li>
            <svg className="w-4 h-4 text-ink-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </li>
          <li>
            <Link href="/editor/labs" className="text-ink-2 hover:text-aqua transition-colors">
              My Labs
            </Link>
          </li>
          <li>
            <svg className="w-4 h-4 text-ink-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </li>
          <li>
            <span className="text-ink-0 font-medium">New Lab</span>
          </li>
        </ol>
      </nav>

      {/* Page Header */}
      <AdminPageHeader
        title="Create New Lab"
        description="Generate a lab from a GitHub repository or create one manually"
        icon={<LabIcon />}
      />

      {/* Form */}
      <AdminCard>
        <LabForm isAdmin={isAdmin} />
      </AdminCard>
    </div>
  )
}
