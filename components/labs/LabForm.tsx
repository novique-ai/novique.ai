'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import TipTapEditor from '@/components/blog/TipTapEditor'
import { useLabEditor, LabFormData } from '@/hooks/useLabEditor'
import AnimatedWorkflow from './AnimatedWorkflow'
import LabGenerationModal from './LabGenerationModal'

interface LabFormProps {
  initialData?: Partial<LabFormData>
  isAdmin?: boolean
}

export default function LabForm({ initialData, isAdmin = false }: LabFormProps) {
  const router = useRouter()
  const {
    formData,
    updateField,
    updateSection,
    errors,
    saveLab,
    deleteLab,
    isSaving,
  } = useLabEditor({
    initialData,
    autoGenerateSlug: !initialData?.id,
  })

  const [tagInput, setTagInput] = useState('')
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [showWorkflowEditor, setShowWorkflowEditor] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [workflowNodes, setWorkflowNodes] = useState<Array<{
    id: string
    label: string
    sublabel: string
    type: 'laptop' | 'server' | 'cloud' | 'storage' | 'network' | 'container' | 'database'
    provider?: string
  }>>([
    { id: '1', label: 'My Laptop', sublabel: 'Terraform + AWS CLI', type: 'laptop', provider: 'Local' },
    { id: '2', label: 'AMD Workstation', sublabel: 'Docker Host', type: 'container', provider: 'Docker' },
    { id: '3', label: 'AWS Account', sublabel: 'S3 Bucket', type: 'cloud', provider: 'AWS' },
  ])
  const [activeSection, setActiveSection] = useState<'overview' | 'architecture' | 'setupDeployment' | 'troubleshooting' | 'businessUse'>('overview')

  // Handle generation complete - redirect to edit page since lab is already saved
  const handleGenerationComplete = (data: {
    slug: string
    title: string
    overview: string
    architecture: string
    setupDeployment: string
    troubleshooting: string
    businessUse: string
    workflowSvg: string
    githubUrl: string
    tags: string[]
  }) => {
    setShowGenerateModal(false)
    // Lab is already saved to DB, redirect to edit page
    router.push(`/editor/labs/${data.slug}/edit`)
  }

  // Add tag
  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase()
    if (tag && !formData.tags.includes(tag)) {
      updateField('tags', [...formData.tags, tag])
      setTagInput('')
    }
  }

  // Remove tag
  const handleRemoveTag = (tagToRemove: string) => {
    updateField('tags', formData.tags.filter((tag) => tag !== tagToRemove))
  }

  // Handle workflow image upload
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploadingImage(true)
    try {
      const formDataUpload = new FormData()
      formDataUpload.append('file', file)
      if (formData.slug) {
        formDataUpload.append('labSlug', formData.slug)
      }

      const response = await fetch('/api/labs/upload-image', {
        method: 'POST',
        body: formDataUpload,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed')
      }

      updateField('workflowSvg', result.url)
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to upload image')
    } finally {
      setIsUploadingImage(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // Upload an inline image for the rich-text content sections (TipTap toolbar).
  // Mirrors the blog editor: posts to the labs image route and returns the URL the
  // editor inserts as an <img>. Without this prop the toolbar upload icon no-ops.
  const handleContentImageUpload = async (file: File): Promise<string> => {
    const uploadData = new FormData()
    uploadData.append('file', file)
    if (formData.slug) {
      uploadData.append('labSlug', formData.slug)
    }

    const response = await fetch('/api/labs/upload-image', {
      method: 'POST',
      body: uploadData,
    })

    const result = await response.json()
    if (!response.ok) {
      throw new Error(result.error || 'Upload failed')
    }

    return result.url
  }

  // Check if current workflow is an uploaded image (URL) vs generated SVG
  const isWorkflowImageUrl = formData.workflowSvg?.startsWith('http')

  // Save and publish
  const handlePublish = async () => {
    try {
      await saveLab(true)
      router.push('/editor/labs')
    } catch (error) {
      alert('Failed to publish lab')
    }
  }

  // Save as draft
  const handleSaveDraft = async () => {
    try {
      await saveLab(false)
      alert('Draft saved successfully')
    } catch (error) {
      alert('Failed to save draft')
    }
  }

  // Delete lab
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this lab?')) return
    try {
      await deleteLab()
    } catch (error) {
      alert('Failed to delete lab')
    }
  }

  const sections = [
    { key: 'overview' as const, label: 'Lab Overview', required: true },
    { key: 'architecture' as const, label: 'Architecture', required: false },
    { key: 'setupDeployment' as const, label: 'Setup and Deployment', required: false },
    { key: 'troubleshooting' as const, label: 'Troubleshooting Highlights', required: false },
    { key: 'businessUse' as const, label: 'Practical Business Use', required: false },
  ]

  return (
    <>
      <form className="space-y-6 max-w-5xl mx-auto" onSubmit={(e) => e.preventDefault()}>
        {/* Generate from GitHub button */}
        {!initialData?.id && (
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Generate from GitHub Repository</h3>
                <p className="text-sm text-gray-600 mt-1">
                  AI will read your repository and generate content automatically
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowGenerateModal(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Generate with AI
              </button>
            </div>
          </div>
        )}

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Title *
          </label>
          <input
            id="title"
            type="text"
            value={formData.title}
            onChange={(e) => updateField('title', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter lab title..."
          />
          {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
        </div>

        {/* Slug */}
        <div>
          <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-2">
            Slug *
          </label>
          <input
            id="slug"
            type="text"
            value={formData.slug}
            onChange={(e) => updateField('slug', e.target.value.toLowerCase())}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            placeholder="url-friendly-slug"
          />
          {errors.slug && <p className="mt-1 text-sm text-red-600">{errors.slug}</p>}
          <p className="mt-1 text-sm text-gray-500">URL: /labs/{formData.slug || 'your-slug-here'}</p>
        </div>

        {/* GitHub URL */}
        <div>
          <label htmlFor="githubUrl" className="block text-sm font-medium text-gray-700 mb-2">
            GitHub Repository URL
          </label>
          <input
            id="githubUrl"
            type="url"
            value={formData.githubUrl}
            onChange={(e) => updateField('githubUrl', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="https://github.com/owner/repo"
          />
        </div>

        {/* Workflow SVG Preview */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Workflow Diagram
          </label>
          <AnimatedWorkflow
            svg={formData.workflowSvg}
            height="250px"
            showControls={!isWorkflowImageUrl}
            className="border border-gray-200 rounded-lg"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {formData.githubUrl && (
              <button
                type="button"
                onClick={async () => {
                  try {
                    const response = await fetch('/api/labs/generate', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        githubUrl: formData.githubUrl,
                        regenerateSvgOnly: true,
                      }),
                    })
                    const result = await response.json()
                    if (result.svg) {
                      updateField('workflowSvg', result.svg)
                    }
                  } catch (error) {
                    alert('Failed to regenerate SVG')
                  }
                }}
                className="text-sm text-purple-600 hover:text-purple-700"
              >
                Regenerate from repo
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowWorkflowEditor(true)}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Edit workflow nodes
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingImage}
              className="text-sm text-green-600 hover:text-green-700 disabled:opacity-50"
            >
              {isUploadingImage ? 'Uploading...' : 'Upload image'}
            </button>
            {formData.workflowSvg && (
              <button
                type="button"
                onClick={() => updateField('workflowSvg', '')}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Clear
              </button>
            )}
          </div>
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>

        {/* Section Tabs */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Content Sections</label>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Tab buttons */}
            <div className="flex border-b border-gray-200 bg-gray-50 overflow-x-auto">
              {sections.map((section) => (
                <button
                  key={section.key}
                  type="button"
                  onClick={() => setActiveSection(section.key)}
                  className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                    activeSection === section.key
                      ? 'bg-white text-blue-600 border-b-2 border-blue-600 -mb-px'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {section.label}
                  {section.required && <span className="text-red-500 ml-1">*</span>}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="p-4">
              {sections.map((section) => (
                <div
                  key={section.key}
                  className={activeSection === section.key ? 'block' : 'hidden'}
                >
                  <TipTapEditor
                    content={formData[section.key]}
                    onChange={(html) => updateSection(section.key, html)}
                    onImageUpload={handleContentImageUpload}
                  />
                  {errors[section.key] && (
                    <p className="mt-1 text-sm text-red-600">{errors[section.key]}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Meta Description */}
        <div>
          <label htmlFor="metaDescription" className="block text-sm font-medium text-gray-700 mb-2">
            Meta Description (SEO){' '}
            <span className="text-gray-500 font-normal">
              ({formData.metaDescription?.length || 0}/160)
            </span>
          </label>
          <textarea
            id="metaDescription"
            value={formData.metaDescription || ''}
            onChange={(e) => updateField('metaDescription', e.target.value)}
            rows={2}
            maxLength={160}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="SEO meta description (optional)..."
          />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Add tag and press Enter..."
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:text-blue-900"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Featured & Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.featured}
                onChange={(e) => updateField('featured', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Featured Lab</span>
            </label>
          </div>

          {isAdmin && (
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => updateField('status', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="draft">Draft</option>
                <option value="pending_review">Pending Review</option>
                <option value="published">Published</option>
              </select>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-6 border-t border-gray-200">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isSaving}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Save Draft
            </button>
            <button
              type="button"
              onClick={handlePublish}
              disabled={isSaving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {formData.status === 'published' ? 'Update' : 'Publish'}
            </button>
          </div>

          {initialData?.id && isAdmin && (
            <button
              type="button"
              onClick={handleDelete}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Delete
            </button>
          )}
        </div>
      </form>

      {/* Generation Modal */}
      <LabGenerationModal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        onComplete={handleGenerationComplete}
      />

      {/* Workflow Editor Modal */}
      {showWorkflowEditor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Edit Workflow Nodes</h3>
              <p className="text-sm text-gray-600 mt-1">
                Define the components in your infrastructure diagram
              </p>
            </div>

            <div className="p-6 space-y-4">
              {workflowNodes.map((node, index) => (
                <div key={node.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Node {index + 1}</span>
                    {workflowNodes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setWorkflowNodes(nodes => nodes.filter(n => n.id !== node.id))}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Label</label>
                      <input
                        type="text"
                        value={node.label}
                        onChange={(e) => setWorkflowNodes(nodes =>
                          nodes.map(n => n.id === node.id ? { ...n, label: e.target.value } : n)
                        )}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        placeholder="My Laptop"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Sublabel</label>
                      <input
                        type="text"
                        value={node.sublabel}
                        onChange={(e) => setWorkflowNodes(nodes =>
                          nodes.map(n => n.id === node.id ? { ...n, sublabel: e.target.value } : n)
                        )}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        placeholder="Terraform + AWS CLI"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Type</label>
                      <select
                        value={node.type}
                        onChange={(e) => setWorkflowNodes(nodes =>
                          nodes.map(n => n.id === node.id ? { ...n, type: e.target.value as typeof node.type } : n)
                        )}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      >
                        <option value="laptop">Laptop</option>
                        <option value="server">Server</option>
                        <option value="cloud">Cloud</option>
                        <option value="storage">Storage</option>
                        <option value="network">Network</option>
                        <option value="container">Container</option>
                        <option value="database">Database</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Provider (optional)</label>
                      <input
                        type="text"
                        value={node.provider || ''}
                        onChange={(e) => setWorkflowNodes(nodes =>
                          nodes.map(n => n.id === node.id ? { ...n, provider: e.target.value } : n)
                        )}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        placeholder="AWS, Docker, Local"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() => setWorkflowNodes(nodes => [
                  ...nodes,
                  { id: Date.now().toString(), label: '', sublabel: '', type: 'server', provider: '' }
                ])}
                className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors"
              >
                + Add Node
              </button>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowWorkflowEditor(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    const response = await fetch('/api/labs/generate', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        customNodes: workflowNodes,
                        title: formData.title || 'Infrastructure Workflow',
                      }),
                    })
                    const result = await response.json()
                    if (result.svg) {
                      updateField('workflowSvg', result.svg)
                      setShowWorkflowEditor(false)
                    } else {
                      alert('Failed to generate diagram')
                    }
                  } catch (error) {
                    alert('Failed to generate diagram')
                  }
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Generate Diagram
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
