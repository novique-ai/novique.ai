import { createAdminClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/session'
import Link from 'next/link'
import {
  AdminPageHeader,
  AdminStatCard,
  AdminStatsGrid,
  AdminTable,
  AdminTableHead,
  AdminTableHeader,
  AdminTableBody,
  AdminTableRow,
  AdminTableCell,
  AdminEmptyState,
  AdminButton,
} from '@/components/admin/AdminUI'

// Icons
const LabsIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
  </svg>
)

const CubeIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
)

const CheckCircleIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const PencilIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
  </svg>
)

const ClockIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
)

export default async function EditorLabsPage() {
  const user = await getCurrentUser()
  // Use admin client to bypass RLS - we filter by author_id ourselves
  const supabase = createAdminClient()

  if (!user) return null

  // Get user's labs only
  const { data: labs } = await supabase
    .from('labs')
    .select('*')
    .eq('author_id', user.id)
    .order('created_at', { ascending: false })

  // Get lab count by status for this user
  const { count: draftCount } = await supabase
    .from('labs')
    .select('*', { count: 'exact', head: true })
    .eq('author_id', user.id)
    .eq('status', 'draft')

  const { count: publishedCount } = await supabase
    .from('labs')
    .select('*', { count: 'exact', head: true })
    .eq('author_id', user.id)
    .eq('status', 'published')

  const { count: pendingCount } = await supabase
    .from('labs')
    .select('*', { count: 'exact', head: true })
    .eq('author_id', user.id)
    .eq('status', 'pending_review')

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; dot: string }> = {
      published: { bg: 'bg-emerald-500/10 ring-1 ring-inset ring-emerald-500/25', text: 'text-emerald-300', dot: 'bg-emerald-400' },
      draft: { bg: 'bg-surface-3 ring-1 ring-inset ring-stroke-1', text: 'text-ink-1', dot: 'bg-gray-400' },
      pending_review: { bg: 'bg-amber-500/10 ring-1 ring-inset ring-amber-500/25', text: 'text-amber-300', dot: 'bg-amber-400' },
    }
    return badges[status] || { bg: 'bg-surface-3 ring-1 ring-inset ring-stroke-1', text: 'text-ink-1', dot: 'bg-gray-400' }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <AdminPageHeader
        title="My Labs"
        description="Create and manage infrastructure labs with animated workflow diagrams"
        icon={<LabsIcon />}
        actions={
          <AdminButton href="/editor/labs/new" icon={<PlusIcon />} variant="primary">
            New Lab
          </AdminButton>
        }
      />

      {/* Stats Grid */}
      <AdminStatsGrid columns={4}>
        <AdminStatCard
          label="Total Labs"
          value={labs?.length || 0}
          variant="purple"
          icon={<CubeIcon />}
        />
        <AdminStatCard
          label="Published"
          value={publishedCount || 0}
          variant="success"
          icon={<CheckCircleIcon />}
        />
        <AdminStatCard
          label="Drafts"
          value={draftCount || 0}
          variant="default"
          icon={<PencilIcon />}
        />
        <AdminStatCard
          label="Pending Review"
          value={pendingCount || 0}
          variant="warning"
          icon={<ClockIcon />}
        />
      </AdminStatsGrid>

      {/* Labs Table */}
      <AdminTable>
        <AdminTableHead>
          <AdminTableHeader>Title</AdminTableHeader>
          <AdminTableHeader>Status</AdminTableHeader>
          <AdminTableHeader>Source</AdminTableHeader>
          <AdminTableHeader>Created</AdminTableHeader>
          <AdminTableHeader className="text-right">Actions</AdminTableHeader>
        </AdminTableHead>
        <AdminTableBody>
          {labs && labs.length > 0 ? (
            labs.map((lab) => {
              const statusStyle = getStatusBadge(lab.status)
              return (
                <AdminTableRow key={lab.id}>
                  <AdminTableCell>
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-lg bg-surface-3 border border-stroke-1 flex items-center justify-center text-aqua mr-3">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-ink-0">{lab.title}</div>
                        <div className="text-sm text-ink-2">/labs/{lab.slug}</div>
                      </div>
                      {lab.featured && (
                        <span className="ml-2 inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-amber-500/10 text-amber-300 ring-1 ring-inset ring-amber-500/25 rounded-full">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          Featured
                        </span>
                      )}
                      {lab.ai_generated && (
                        <span className="ml-2 inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-purple-500/10 text-purple-300 ring-1 ring-inset ring-purple-500/25 rounded-full">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                          </svg>
                          AI
                        </span>
                      )}
                    </div>
                  </AdminTableCell>
                  <AdminTableCell className="whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${statusStyle.bg} ${statusStyle.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`}></span>
                      {lab.status.replace('_', ' ')}
                    </span>
                  </AdminTableCell>
                  <AdminTableCell className="whitespace-nowrap text-sm">
                    {lab.github_url ? (
                      <a
                        href={lab.github_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-aqua hover:text-aqua-bright transition-colors"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                        </svg>
                        <span className="truncate max-w-[150px]">{lab.github_url.replace('https://github.com/', '')}</span>
                      </a>
                    ) : (
                      <span className="text-ink-3 italic">Manual</span>
                    )}
                  </AdminTableCell>
                  <AdminTableCell className="whitespace-nowrap text-sm text-ink-2">
                    {new Date(lab.created_at).toLocaleDateString()}
                  </AdminTableCell>
                  <AdminTableCell className="whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <AdminButton
                        href={`/editor/labs/${lab.slug}/edit`}
                        variant="ghost"
                        size="sm"
                      >
                        Edit
                      </AdminButton>
                      {lab.status === 'published' && (
                        <Link
                          href={`/labs/${lab.slug}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-ink-1 hover:text-ink-0 transition-colors"
                        >
                          View
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </Link>
                      )}
                    </div>
                  </AdminTableCell>
                </AdminTableRow>
              )
            })
          ) : (
            <tr>
              <td colSpan={5}>
                <AdminEmptyState
                  icon={<LabsIcon />}
                  title="No labs yet"
                  description="You haven't created any labs yet. Get started by creating your first lab from a GitHub repository."
                  action={{
                    label: 'Create First Lab',
                    href: '/editor/labs/new',
                  }}
                />
              </td>
            </tr>
          )}
        </AdminTableBody>
      </AdminTable>
    </div>
  )
}
