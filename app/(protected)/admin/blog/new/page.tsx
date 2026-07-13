import { getCurrentUser } from '@/lib/auth/session'
import Link from 'next/link'
import BlogPostForm from '@/components/blog/BlogPostForm'

export default async function NewBlogPostPage() {
  const user = await getCurrentUser()

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-2 text-sm">
          <li>
            <Link href="/admin/dashboard" className="text-ink-2 hover:text-ink-1">
              Admin
            </Link>
          </li>
          <li>
            <span className="text-ink-3">/</span>
          </li>
          <li>
            <Link href="/admin/blog" className="text-ink-2 hover:text-ink-1">
              Blog
            </Link>
          </li>
          <li>
            <span className="text-ink-3">/</span>
          </li>
          <li>
            <span className="text-ink-0">New Post</span>
          </li>
        </ol>
      </nav>

      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-ink-0">Create New Blog Post</h1>
        <p className="mt-2 text-sm text-ink-1">
          Write and publish a new blog post
        </p>
      </div>

      {/* Form */}
      <BlogPostForm isAdmin={user?.role === 'admin'} />
    </div>
  )
}
