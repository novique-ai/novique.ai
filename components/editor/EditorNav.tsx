'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { UserProfile } from '@/lib/auth/session'

interface EditorNavProps {
  user: UserProfile
}

// Icons for navigation items
const navIcons: Record<string, React.ReactNode> = {
  '/editor/dashboard': (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  ),
  '/editor/blog': (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
    </svg>
  ),
  '/editor/blog/new': (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  '/editor/labs': (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
    </svg>
  ),
  '/editor/labs/new': (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
}

export function EditorNav({ user }: EditorNavProps) {
  const pathname = usePathname()

  const navLinks = [
    { href: '/editor/dashboard', label: 'Dashboard' },
    { href: '/editor/blog', label: 'My Posts' },
    { href: '/editor/blog/new', label: 'New Post' },
    { href: '/editor/labs', label: 'My Labs' },
    { href: '/editor/labs/new', label: 'New Lab' },
  ]

  // Show admin link if user is admin
  const isAdmin = user.role === 'admin'

  // Check if a nav link is active
  const isActive = (href: string) => {
    if (href === '/editor/dashboard') {
      return pathname === href || pathname === '/editor'
    }
    // For blog/labs main pages, don't match /new or /edit
    if (href === '/editor/blog') {
      return pathname === href || (pathname.startsWith('/editor/blog/') && !pathname.includes('/new') && pathname.includes('/edit'))
    }
    if (href === '/editor/labs') {
      return pathname === href || (pathname.startsWith('/editor/labs/') && !pathname.includes('/new') && pathname.includes('/edit'))
    }
    return pathname === href
  }

  return (
    <nav className="sticky top-0 z-40 border-b border-stroke-0 bg-surface-chrome/95 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Left side - Logo and Navigation */}
          <div className="flex items-center space-x-8">
            {/* Logo/Brand */}
            <Link href="/editor/dashboard" className="group inline-flex items-baseline gap-0.5" aria-label="Editor dashboard">
              <span className="font-display text-lg font-semibold tracking-tight text-ink-0">Novique</span>
              <span className="text-lg font-semibold leading-none text-aqua">.</span>
              <span className="font-display text-lg font-semibold tracking-tight text-ink-2">ai</span>
              <span className="ml-2 hidden rounded-full border border-stroke-accent bg-aqua/10 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-aqua sm:inline-block">
                Editor
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex md:items-center md:space-x-1">
              {navLinks.map((link) => {
                const active = isActive(link.href)
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      active
                        ? 'bg-aqua/10 text-aqua'
                        : 'text-ink-2 hover:text-ink-0 hover:bg-white/[0.04]'
                    }`}
                  >
                    {navIcons[link.href]}
                    {link.label}
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Right side - User info and links */}
          <div className="flex items-center space-x-4">
            {/* User Info */}
            <div className="hidden sm:flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full border border-stroke-accent bg-aqua/10 flex items-center justify-center text-aqua font-semibold text-sm">
                {(user.full_name || user.email || 'U')[0].toUpperCase()}
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-medium text-ink-0 whitespace-nowrap">
                  {user.full_name || user.email}
                </span>
                <span className="text-xs text-ink-3 capitalize">{user.role}</span>
              </div>
            </div>

            {/* Divider */}
            <div className="hidden sm:block h-6 w-px bg-stroke-1"></div>

            {/* Quick Links */}
            <div className="flex items-center space-x-2">
              {isAdmin && (
                <Link
                  href="/admin/dashboard"
                  className="flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 text-sm font-medium text-ink-2 hover:text-ink-0 hover:bg-white/[0.04] rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="hidden lg:inline">Admin</span>
                </Link>
              )}
              <Link
                href="/"
                className="flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 text-sm font-medium text-ink-2 hover:text-ink-0 hover:bg-white/[0.04] rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="hidden lg:inline">Back to Site</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile navigation */}
      <div className="md:hidden border-t border-stroke-0">
        <div className="px-2 pt-2 pb-3 space-y-1">
          {navLinks.map((link) => {
            const active = isActive(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-base font-medium transition-colors ${
                  active
                    ? 'bg-aqua/10 text-aqua'
                    : 'text-ink-2 hover:text-ink-0 hover:bg-white/[0.04]'
                }`}
              >
                {navIcons[link.href]}
                {link.label}
              </Link>
            )
          })}
          <div className="border-t border-stroke-0 my-2"></div>
          {isAdmin && (
            <Link
              href="/admin/dashboard"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-base font-medium text-aqua hover:bg-white/[0.04]"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Admin Panel
            </Link>
          )}
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-base font-medium text-ink-2 hover:text-ink-0 hover:bg-white/[0.04]"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Site
          </Link>
        </div>
      </div>
    </nav>
  )
}
