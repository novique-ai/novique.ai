import { getCurrentUser } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import LabForm from '@/components/labs/LabForm'

interface EditLabPageProps {
  params: Promise<{ slug: string }>
}

export default async function EditLabPage({ params }: EditLabPageProps) {
  const { slug } = await params
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  if (user.role !== 'admin' && user.role !== 'editor') {
    redirect('/editor')
  }

  // Use admin client to bypass RLS - we do our own auth check below
  const supabase = createAdminClient()

  // Fetch lab data
  const { data: lab, error } = await supabase
    .from('labs')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error || !lab) {
    notFound()
  }

  // Check ownership for non-admins
  if (user.role !== 'admin' && lab.author_id !== user.id) {
    redirect('/editor/labs')
  }

  const isAdmin = user.role === 'admin'

  // Transform database format to form format
  const initialData = {
    id: lab.id,
    slug: lab.slug,
    title: lab.title,
    overview: lab.overview || '',
    architecture: lab.architecture || '',
    setupDeployment: lab.setup_deployment || '',
    troubleshooting: lab.troubleshooting || '',
    businessUse: lab.business_use || '',
    workflowSvg: lab.workflow_svg || '',
    githubUrl: lab.github_url || '',
    metaDescription: lab.meta_description || '',
    tags: lab.tags || [],
    featured: lab.featured || false,
    status: lab.status || 'draft',
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-ink-0">Edit Lab</h1>
        <p className="mt-2 text-sm text-ink-1">
          Update lab content and settings
        </p>
      </div>

      {/* Form */}
      <div className="bg-surface-2 shadow rounded-lg p-6">
        <LabForm initialData={initialData} isAdmin={isAdmin} />
      </div>
    </div>
  )
}
