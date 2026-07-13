'use client'

import { Editor } from '@tiptap/react'

interface EditorToolbarProps {
  editor: Editor
  onImageUpload?: () => void
  onUnsplashClick?: () => void
}

export default function EditorToolbar({ editor, onImageUpload, onUnsplashClick }: EditorToolbarProps) {
  if (!editor) return null

  const ToolbarButton = ({
    onClick,
    active,
    disabled,
    children,
    title,
  }: {
    onClick: () => void
    active?: boolean
    disabled?: boolean
    children: React.ReactNode
    title: string
  }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        px-3 py-2 text-sm font-medium rounded transition-colors border
        ${
          active
            ? 'bg-aqua/10 text-aqua border-aqua/30'
            : 'bg-surface-2 border-stroke-1 text-ink-1 hover:bg-surface-3 hover:text-ink-0'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      {children}
    </button>
  )

  const ToolbarDivider = () => <div className="w-px h-6 bg-stroke-1 mx-1" />

  return (
    <div className="border-b border-stroke-0 bg-surface-1 p-2 flex flex-wrap gap-1 items-center">
      {/* Headings */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        active={editor.isActive('heading', { level: 1 })}
        title="Heading 1"
      >
        H1
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive('heading', { level: 2 })}
        title="Heading 2"
      >
        H2
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        active={editor.isActive('heading', { level: 3 })}
        title="Heading 3"
      >
        H3
      </ToolbarButton>

      <ToolbarDivider />

      {/* Text formatting */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive('bold')}
        title="Bold (Cmd/Ctrl + B)"
      >
        <strong>B</strong>
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive('italic')}
        title="Italic (Cmd/Ctrl + I)"
      >
        <em>I</em>
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        active={editor.isActive('strike')}
        title="Strikethrough"
      >
        <s>S</s>
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        active={editor.isActive('code')}
        title="Inline Code"
      >
        {'<>'}
      </ToolbarButton>

      <ToolbarDivider />

      {/* Lists */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive('bulletList')}
        title="Bullet List"
      >
        • List
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive('orderedList')}
        title="Numbered List"
      >
        1. List
      </ToolbarButton>

      <ToolbarDivider />

      {/* Link */}
      <ToolbarButton
        onClick={() => {
          const url = window.prompt('Enter URL:')
          if (url) {
            editor.chain().focus().setLink({ href: url }).run()
          }
        }}
        active={editor.isActive('link')}
        title="Insert Link"
      >
        🔗
      </ToolbarButton>
      {editor.isActive('link') && (
        <ToolbarButton
          onClick={() => editor.chain().focus().unsetLink().run()}
          title="Remove Link"
        >
          ✂️
        </ToolbarButton>
      )}

      <ToolbarDivider />

      {/* Code block */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        active={editor.isActive('codeBlock')}
        title="Code Block"
      >
        {'{ }'}
      </ToolbarButton>

      {/* Blockquote */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        active={editor.isActive('blockquote')}
        title="Quote"
      >
        &ldquo;&rdquo;
      </ToolbarButton>

      <ToolbarDivider />

      {/* Table */}
      <ToolbarButton
        onClick={() =>
          editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
        }
        title="Insert Table"
      >
        ⊞ Table
      </ToolbarButton>

      {/* Image */}
      {onImageUpload && (
        <>
          <ToolbarDivider />
          <ToolbarButton onClick={onImageUpload} title="Upload Image">
            🖼️ Upload
          </ToolbarButton>
          {onUnsplashClick && (
            <ToolbarButton onClick={onUnsplashClick} title="Search Unsplash Images">
              📷 Unsplash
            </ToolbarButton>
          )}
        </>
      )}

      <ToolbarDivider />

      {/* Horizontal rule */}
      <ToolbarButton
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title="Horizontal Line"
      >
        ―
      </ToolbarButton>

      <ToolbarDivider />

      {/* Undo/Redo */}
      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="Undo (Cmd/Ctrl + Z)"
      >
        ↶
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="Redo (Cmd/Ctrl + Shift + Z)"
      >
        ↷
      </ToolbarButton>
    </div>
  )
}
