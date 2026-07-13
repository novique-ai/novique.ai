import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/session'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import BlogPostForm from '@/components/blog/BlogPostForm'

interface PageProps {
  params: Promise<{
    slug: string
  }>
}

export default async function EditEditorBlogPostPage({ params }: PageProps) {
  const { slug } = await params
  const user = await getCurrentUser()
  const supabase = await createClient()

  if (!user) {
    redirect('/login')
  }

  // Fetch post
  const { data: post, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error || !post) {
    notFound()
  }

  // Check if user owns this post
  if (post.author_id !== user.id) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-ink-0 mb-2">Access Denied</h2>
        <p className="text-ink-1">You can only edit your own posts.</p>
        <Link
          href="/editor/blog"
          className="mt-4 inline-block text-aqua hover:text-aqua-bright"
        >
          Back to My Posts
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-2 text-sm">
          <li>
            <Link href="/editor/dashboard" className="text-ink-2 hover:text-ink-1">
              Dashboard
            </Link>
          </li>
          <li>
            <span className="text-ink-3">/</span>
          </li>
          <li>
            <Link href="/editor/blog" className="text-ink-2 hover:text-ink-1">
              My Posts
            </Link>
          </li>
          <li>
            <span className="text-ink-3">/</span>
          </li>
          <li>
            <span className="text-ink-0">Edit: {post.title}</span>
          </li>
        </ol>
      </nav>

      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-ink-0">Edit Blog Post</h1>
        <p className="mt-2 text-sm text-ink-1">
          Update your blog post
        </p>
      </div>

      {/* Form */}
      <BlogPostForm
        initialData={{
          id: post.id,
          slug: post.slug,
          title: post.title,
          summary: post.summary,
          content: post.content,
          markdownContent: post.markdown_content,
          metaDescription: post.meta_description,
          tags: post.tags || [],
          headerImage: post.header_image,
          featured: post.featured,
          status: post.status,
          // Social metadata
          keyInsights: post.key_insights || [],
          coreTakeaway: post.core_takeaway || '',
        }}
        isAdmin={false}
      />
    </div>
  )
}
