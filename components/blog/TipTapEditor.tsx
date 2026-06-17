'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import { editorExtensions, editorProps } from '@/lib/editor/tiptapConfig'
import { htmlToMarkdown } from '@/lib/editor/markdownConverter'
import { useEffect, useState } from 'react'
import EditorToolbar from './EditorToolbar'
import UnsplashImagePicker from './UnsplashImagePicker'

interface TipTapEditorProps {
  content: string
  onChange: (html: string, markdown: string) => void
  onImageUpload?: (file: File) => Promise<string>
  editable?: boolean
  placeholder?: string
}

export default function TipTapEditor({
  content,
  onChange,
  onImageUpload,
  editable = true,
  placeholder,
}: TipTapEditorProps) {
  const [showUnsplashPicker, setShowUnsplashPicker] = useState(false)
  const editor = useEditor({
    extensions: editorExtensions,
    content,
    editable,
    editorProps,
    immediatelyRender: false, // Fix SSR hydration mismatch
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      const markdown = htmlToMarkdown(html)
      onChange(html, markdown)
    },
  })

  // Update editor content when prop changes (e.g., loading saved draft)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  // Handle image uploads
  const handleImageUpload = async () => {
    if (!onImageUpload) return

    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/jpeg,image/png,image/webp,image/gif'

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      try {
        // Upload first, then insert the image at the cursor. (Previously this
        // inserted an "Uploading image..." placeholder and deleted a fixed
        // 23-char range afterwards — which threw a ProseMirror out-of-range
        // error when the cursor was near the start of the document, so the
        // upload succeeded but the UI reported failure.)
        const imageUrl = await onImageUpload(file)
        editor?.chain().focus().setImage({ src: imageUrl }).run()
      } catch (error) {
        console.error('Image upload failed:', error)
        alert('Failed to upload image. Please try again.')
      }
    }

    input.click()
  }

  // Handle Unsplash image insertion
  const handleUnsplashImageSelect = (imageUrl: string, altText: string) => {
    editor?.commands.setImage({ src: imageUrl, alt: altText })
  }

  if (!editor) {
    return <div className="animate-pulse bg-gray-100 h-64 rounded-lg" />
  }

  return (
    <>
      <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
        <EditorToolbar
          editor={editor}
          onImageUpload={handleImageUpload}
          onUnsplashClick={() => setShowUnsplashPicker(true)}
        />

        <EditorContent editor={editor} />

        {/* Character count */}
        <div className="border-t border-gray-200 px-4 py-2 bg-gray-50 text-sm text-gray-600 flex justify-between items-center">
          <div>
            {editor.storage.characterCount.characters()} characters
            {editor.storage.characterCount.words && (
              <span className="ml-4">{editor.storage.characterCount.words()} words</span>
            )}
          </div>
          {editor.storage.characterCount.characters() > 40000 && (
            <div className="text-orange-600 font-medium">
              Warning: Approaching character limit
            </div>
          )}
        </div>
      </div>

      {/* Unsplash Image Picker Modal */}
      <UnsplashImagePicker
        isOpen={showUnsplashPicker}
        onClose={() => setShowUnsplashPicker(false)}
        onSelectImage={handleUnsplashImageSelect}
      />
    </>
  )
}
