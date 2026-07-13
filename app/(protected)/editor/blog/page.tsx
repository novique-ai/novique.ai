import { createClient } from '@/lib/supabase/server'
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
const PostsIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
  </svg>
)

const DocumentIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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

export default async function EditorBlogPage() {
  const user = await getCurrentUser()
  const supabase = await createClient()

  if (!user) return null

  // Get user's blog posts only
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('author_id', user.id)
    .order('created_at', { ascending: false })

  // Get post count by status for this user
  const { count: draftCount } = await supabase
    .from('blog_posts')
    .select('*', { count: 'exact', head: true })
    .eq('author_id', user.id)
    .eq('status', 'draft')

  const { count: publishedCount } = await supabase
    .from('blog_posts')
    .select('*', { count: 'exact', head: true })
    .eq('author_id', user.id)
    .eq('status', 'published')

  const { count: pendingCount } = await supabase
    .from('blog_posts')
    .select('*', { count: 'exact', head: true })
    .eq('author_id', user.id)
    .eq('status', 'pending_review')

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; dot: string }> = {
      published: { bg: 'bg-emerald-500/10 ring-1 ring-inset ring-emerald-500/25', text: 'text-emerald-300', dot: 'bg-emerald-400' },
      draft: { bg: 'bg-surface-3 ring-1 ring-inset ring-stroke-1', text: 'text-ink-1', dot: 'bg-gray-400' },
      pending_review: { bg: 'bg-amber-500/10 ring-1 ring-inset ring-amber-500/25', text: 'text-amber-300', dot: 'bg-amber-400' },
      scheduled: { bg: 'bg-aqua/10 ring-1 ring-inset ring-aqua/25', text: 'text-aqua', dot: 'bg-aqua' },
    }
    return badges[status] || { bg: 'bg-surface-3 ring-1 ring-inset ring-stroke-1', text: 'text-ink-1', dot: 'bg-gray-400' }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <AdminPageHeader
        title="My Blog Posts"
        description="Create and manage your blog posts"
        icon={<PostsIcon />}
        actions={
          <AdminButton href="/editor/blog/new" icon={<PlusIcon />}>
            New Post
          </AdminButton>
        }
      />

      {/* Stats Grid */}
      <AdminStatsGrid columns={4}>
        <AdminStatCard
          label="Total Posts"
          value={posts?.length || 0}
          variant="default"
          icon={<DocumentIcon />}
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

      {/* Posts Table */}
      <AdminTable>
        <AdminTableHead>
          <AdminTableHeader>Title</AdminTableHeader>
          <AdminTableHeader>Status</AdminTableHeader>
          <AdminTableHeader>Created</AdminTableHeader>
          <AdminTableHeader className="text-right">Actions</AdminTableHeader>
        </AdminTableHead>
        <AdminTableBody>
          {posts && posts.length > 0 ? (
            posts.map((post) => {
              const statusStyle = getStatusBadge(post.status)
              return (
                <AdminTableRow key={post.id}>
                  <AdminTableCell>
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-lg bg-surface-3 border border-stroke-1 flex items-center justify-center text-aqua mr-3">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-ink-0">{post.title}</div>
                        <div className="text-sm text-ink-2">/blog/{post.slug}</div>
                      </div>
                      {post.featured && (
                        <span className="ml-2 inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-amber-500/10 text-amber-300 ring-1 ring-inset ring-amber-500/25 rounded-full">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          Featured
                        </span>
                      )}
                    </div>
                  </AdminTableCell>
                  <AdminTableCell className="whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${statusStyle.bg} ${statusStyle.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`}></span>
                      {post.status.replace('_', ' ')}
                    </span>
                  </AdminTableCell>
                  <AdminTableCell className="whitespace-nowrap text-sm text-ink-2">
                    {new Date(post.created_at).toLocaleDateString()}
                  </AdminTableCell>
                  <AdminTableCell className="whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <AdminButton
                        href={`/editor/blog/${post.slug}/edit`}
                        variant="ghost"
                        size="sm"
                      >
                        Edit
                      </AdminButton>
                      <Link
                        href={`/blog/${post.slug}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-ink-1 hover:text-ink-0 transition-colors"
                      >
                        View
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </Link>
                    </div>
                  </AdminTableCell>
                </AdminTableRow>
              )
            })
          ) : (
            <tr>
              <td colSpan={4}>
                <AdminEmptyState
                  icon={<PostsIcon />}
                  title="No blog posts yet"
                  description="You haven't created any blog posts yet. Get started by creating your first post."
                  action={{
                    label: 'Create First Post',
                    href: '/editor/blog/new',
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
