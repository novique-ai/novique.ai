import { getCurrentUser } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import {
  AdminPageHeader,
  AdminStatCard,
  AdminStatsGrid,
  AdminCard,
  AdminButton,
  AdminEmptyState,
} from '@/components/admin/AdminUI'

// Icons
const DashboardIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
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

const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
)

const PostIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
  </svg>
)

export default async function EditorDashboard() {
  const user = await getCurrentUser()
  const supabase = await createClient()

  if (!user) {
    return null // Should never happen due to layout protection
  }

  // Get user's blog posts
  const { data: myPosts, count: myPostsCount } = await supabase
    .from('blog_posts')
    .select('*', { count: 'exact' })
    .eq('author_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const { count: publishedCount } = await supabase
    .from('blog_posts')
    .select('*', { count: 'exact', head: true })
    .eq('author_id', user.id)
    .eq('published', true)

  const { count: draftCount } = await supabase
    .from('blog_posts')
    .select('*', { count: 'exact', head: true })
    .eq('author_id', user.id)
    .eq('published', false)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <AdminPageHeader
        title="Editor Dashboard"
        description={`Welcome back, ${user.full_name || user.email}! Manage your blog posts and content.`}
        icon={<DashboardIcon />}
        actions={
          <AdminButton href="/editor/blog/new" icon={<PlusIcon />}>
            Create New Post
          </AdminButton>
        }
      />

      {/* Stats Grid */}
      <AdminStatsGrid columns={3}>
        <AdminStatCard
          label="Total Posts"
          value={myPostsCount || 0}
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
          variant="warning"
          icon={<PencilIcon />}
        />
      </AdminStatsGrid>

      {/* Recent Posts */}
      <AdminCard title="Recent Posts">
        {myPosts && myPosts.length > 0 ? (
          <div className="space-y-3">
            {myPosts.map((post) => (
              <div
                key={post.id}
                className="flex items-center justify-between p-4 bg-surface-1 rounded-xl border border-stroke-0 hover:border-stroke-2 transition-all duration-200"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-surface-3 border border-stroke-1 flex items-center justify-center text-aqua">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-ink-0">
                      {post.title}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-ink-2">
                      {post.published ? (
                        <span className="inline-flex items-center gap-1 text-emerald-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                          Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                          Draft
                        </span>
                      )}
                      <span className="text-ink-3">·</span>
                      <span>{new Date(post.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <Link
                  href={`/editor/blog/${post.slug}/edit`}
                  className="flex items-center gap-1 text-sm font-medium text-aqua hover:text-aqua-bright transition-colors"
                >
                  Edit
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <AdminEmptyState
            icon={<PostIcon />}
            title="No posts yet"
            description="You haven't created any posts yet. Get started by creating your first post."
            action={{
              label: 'Create First Post',
              href: '/editor/blog/new',
            }}
          />
        )}
      </AdminCard>
    </div>
  )
}
