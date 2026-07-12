'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import type { UserProfile } from '@/lib/auth/session'

interface AdminNavProps {
  user: UserProfile
}

// Icons for nav items
const navIcons: Record<string, React.ReactNode> = {
  '/admin/dashboard': (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  ),
  '/admin/communications': (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  ),
  '/admin/consultations': (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  '/admin/customers': (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  '/admin/users': (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  '/admin/blog': (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
    </svg>
  ),
  '/admin/social': (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
    </svg>
  ),
  '/admin/social/approvals': (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
    </svg>
  ),
}

export function AdminNav({ user }: AdminNavProps) {
  const pathname = usePathname()
  const [pendingApprovals, setPendingApprovals] = useState(0)

  const loadPendingApprovals = useCallback(async () => {
    if (user.role !== 'admin') return

    try {
      const response = await fetch('/api/social/approvals')
      if (!response.ok) return
      const result = await response.json()
      setPendingApprovals(typeof result.total === 'number' ? result.total : 0)
    } catch {
      // Navigation remains usable if the count cannot be refreshed.
    }
  }, [user.role])

  useEffect(() => {
    loadPendingApprovals()

    const handleUpdate = (event: Event) => {
      const total = (event as CustomEvent<number>).detail
      if (typeof total === 'number') {
        setPendingApprovals(total)
      } else {
        loadPendingApprovals()
      }
    }

    window.addEventListener('social-approvals-updated', handleUpdate)
    return () => window.removeEventListener('social-approvals-updated', handleUpdate)
  }, [loadPendingApprovals])

  // Define all possible nav links with role requirements
  const allNavLinks = [
    { href: '/admin/dashboard', label: 'Dashboard', roles: ['admin', 'editor'] },
    { href: '/admin/communications', label: 'Communications', roles: ['admin', 'editor'] },
    { href: '/admin/consultations', label: 'Consultations', roles: ['admin', 'editor'] },
    { href: '/admin/customers', label: 'Customers', roles: ['admin', 'editor'] },
    { href: '/admin/users', label: 'Users', roles: ['admin'] },
    { href: '/admin/blog', label: 'Blog', roles: ['admin', 'editor'] },
    { href: '/admin/social', label: 'Social', roles: ['admin', 'editor'] },
    { href: '/admin/social/approvals', label: 'Approvals', roles: ['admin'] },
  ]

  // Filter nav links based on user role
  const navLinks = allNavLinks.filter((link) => link.roles.includes(user.role))

  // Check if current path matches link (including sub-paths)
  const isActive = (href: string) => {
    if (href === '/admin/dashboard') {
      return pathname === href || pathname === '/admin'
    }
    if (href === '/admin/social') {
      return (
        pathname.startsWith(href) &&
        !pathname.startsWith('/admin/social/approvals')
      )
    }
    return pathname.startsWith(href)
  }

  return (
    <nav className="bg-gradient-to-r from-slate-900 to-slate-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Left side - Logo and Navigation */}
          <div className="flex items-center space-x-8">
            {/* Logo */}
            <Link href="/admin/dashboard" className="flex items-center space-x-3 group">
              <div className="relative w-8 h-8 flex items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md group-hover:shadow-blue-500/25 transition-shadow">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="hidden sm:block">
                <span className="text-lg font-bold text-white">Novique</span>
                <span className="text-xs font-medium text-blue-400 ml-1">Admin</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex lg:items-center lg:space-x-1">
              {navLinks.map((link) => {
                const active = isActive(link.href)
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`
                      inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all duration-150
                      ${active
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                      }
                    `}
                  >
                    <span className={`mr-2 ${active ? 'text-white' : 'text-slate-400'}`}>
                      {navIcons[link.href]}
                    </span>
                    {link.label}
                    {link.href === '/admin/social/approvals' && pendingApprovals > 0 && (
                      <span className="ml-2 inline-flex min-w-5 h-5 items-center justify-center rounded-full bg-amber-400 px-1.5 text-xs font-semibold text-slate-900">
                        {pendingApprovals > 99 ? '99+' : pendingApprovals}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Right side - User info and actions */}
          <div className="flex items-center space-x-4">
            {/* User info */}
            <div className="hidden sm:flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm shadow-md">
                  {(user.full_name || user.email || 'U')[0].toUpperCase()}
                </div>
                <div className="text-sm">
                  <div className="font-medium text-white">{user.full_name || 'User'}</div>
                  <div className="text-xs text-slate-400 capitalize">{user.role}</div>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="hidden sm:block w-px h-8 bg-slate-700"></div>

            {/* Back to site */}
            <Link
              href="/"
              className="inline-flex items-center px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="hidden sm:inline">Back to Site</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile navigation */}
      <div className="lg:hidden border-t border-slate-700">
        <div className="px-2 pt-2 pb-3 space-y-1">
          {navLinks.map((link) => {
            const active = isActive(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`
                  flex items-center px-3 py-2 rounded-md text-base font-medium transition-colors
                  ${active
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                  }
                `}
              >
                <span className={`mr-3 ${active ? 'text-white' : 'text-slate-400'}`}>
                  {navIcons[link.href]}
                </span>
                {link.label}
                {link.href === '/admin/social/approvals' && pendingApprovals > 0 && (
                  <span className="ml-2 inline-flex min-w-5 h-5 items-center justify-center rounded-full bg-amber-400 px-1.5 text-xs font-semibold text-slate-900">
                    {pendingApprovals > 99 ? '99+' : pendingApprovals}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
