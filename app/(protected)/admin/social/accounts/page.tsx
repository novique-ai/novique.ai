'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect, useCallback } from 'react'
import { PlatformBadge } from '@/components/social'
import type { SocialPlatform } from '@/lib/social/types'

interface SocialAccount {
  id: string
  platform: SocialPlatform
  account_name: string
  account_handle: string
  account_id: string
  profile_image_url: string | null
  status: 'active' | 'expired' | 'revoked' | 'pending'
  last_verified_at: string | null
  error_message: string | null
  token_expires_at: string | null
  token_status: 'valid' | 'expired' | 'unknown'
  created_at: string
}

const PLATFORMS: { id: SocialPlatform; name: string; description: string }[] = [
  {
    id: 'twitter',
    name: 'X (Twitter)',
    description: 'Post tweets and threads to your X account',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    description: 'Share professional content with your network',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    description: 'Share visual content (requires business account)',
  },
]

export default function AdminSocialAccountsPage() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [connecting, setConnecting] = useState<SocialPlatform | null>(null)
  const [verifying, setVerifying] = useState<string | null>(null)

  const loadAccounts = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/social/accounts')
      if (!response.ok) {
        throw new Error('Failed to fetch accounts')
      }

      const result = await response.json()
      setAccounts(result.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAccounts()

    // Check for OAuth callback status in URL
    const params = new URLSearchParams(window.location.search)
    const status = params.get('status')
    const platform = params.get('platform')

    if (status === 'success' && platform) {
      // Clear URL params
      window.history.replaceState({}, '', window.location.pathname)
    } else if (status === 'error') {
      const errorMsg = params.get('error') || 'Connection failed'
      setError(`Failed to connect ${platform}: ${errorMsg}`)
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [loadAccounts])

  const handleConnect = async (platform: SocialPlatform) => {
    setConnecting(platform)
    setError(null)

    try {
      const response = await fetch('/api/social/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to initiate connection')
      }

      const result = await response.json()

      // Redirect to OAuth authorization URL
      window.location.href = result.data.authorizationUrl
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect')
      setConnecting(null)
    }
  }

  const handleDisconnect = async (accountId: string, platform: SocialPlatform) => {
    if (!confirm(`Are you sure you want to disconnect your ${platform} account?`)) {
      return
    }

    try {
      const response = await fetch('/api/social/accounts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to disconnect')
      }

      loadAccounts()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect')
    }
  }

  const handleVerify = async (accountId: string) => {
    setVerifying(accountId)

    try {
      const response = await fetch(`/api/social/accounts/${accountId}/verify`, {
        method: 'POST',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Verification failed')
      }

      loadAccounts()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed')
    } finally {
      setVerifying(null)
    }
  }

  const getAccountForPlatform = (platform: SocialPlatform) => {
    return accounts.find((a) => a.platform === platform)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-300 ring-1 ring-inset ring-green-500/25'
      case 'expired':
        return 'bg-yellow-500/10 text-yellow-300 ring-1 ring-inset ring-yellow-500/25'
      case 'revoked':
        return 'bg-red-500/10 text-red-300 ring-1 ring-inset ring-red-500/25'
      case 'pending':
        return 'bg-aqua/10 text-aqua ring-1 ring-inset ring-aqua/25'
      default:
        return 'bg-surface-3 text-ink-1 ring-1 ring-inset ring-stroke-1'
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-ink-0">Social Accounts</h1>
          <p className="mt-2 text-sm text-ink-1">
            Connect your social media accounts to publish posts directly from the dashboard.
          </p>
        </div>
        <Link
          href="/admin/social"
          className="inline-flex items-center px-4 py-2 border border-stroke-1 text-sm font-medium rounded-md text-ink-1 bg-surface-2 hover:bg-surface-3/60"
        >
          <svg
            className="-ml-1 mr-2 h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Posts
        </Link>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/25 text-red-300 px-4 py-3 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Platform Cards */}
      {loading ? (
        <div className="text-center py-12 text-ink-2">Loading accounts...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLATFORMS.map((platform) => {
            const account = getAccountForPlatform(platform.id)
            const isConnecting = connecting === platform.id

            return (
              <div
                key={platform.id}
                className="bg-surface-2 shadow rounded-lg overflow-hidden"
              >
                {/* Platform Header */}
                <div className="p-6 border-b border-stroke-0">
                  <div className="flex items-center gap-3">
                    <PlatformBadge platform={platform.id} size="lg" />
                    <div>
                      <h3 className="text-lg font-semibold text-ink-0">
                        {platform.name}
                      </h3>
                      <p className="text-sm text-ink-2">{platform.description}</p>
                    </div>
                  </div>
                </div>

                {/* Account Info or Connect Button */}
                <div className="p-6">
                  {account ? (
                    <div className="space-y-4">
                      {/* Account Details */}
                      <div className="flex items-center gap-3">
                        {account.profile_image_url ? (
                          <Image
                            src={account.profile_image_url}
                            alt={account.account_name}
                            width={40}
                            height={40}
                            unoptimized
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-surface-3 flex items-center justify-center">
                            <span className="text-ink-2 text-lg font-bold">
                              {account.account_name?.charAt(0) || '?'}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-ink-0">
                            {account.account_name}
                          </p>
                          <p className="text-sm text-ink-2">
                            {account.account_handle}
                          </p>
                        </div>
                      </div>

                      {/* Status */}
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            account.status
                          )}`}
                        >
                          {account.status}
                        </span>
                        {account.token_status === 'expired' && (
                          <span className="text-xs text-yellow-300">
                            Token expired
                          </span>
                        )}
                      </div>

                      {/* Error Message */}
                      {account.error_message && (
                        <p className="text-sm text-red-400">
                          {account.error_message}
                        </p>
                      )}

                      {/* Last Verified */}
                      <p className="text-xs text-ink-2">
                        Last verified: {formatDate(account.last_verified_at)}
                      </p>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => handleVerify(account.id)}
                          disabled={verifying === account.id}
                          className="flex-1 px-3 py-2 text-sm font-medium text-ink-1 bg-surface-3 rounded-md hover:bg-surface-3/60 disabled:opacity-50"
                        >
                          {verifying === account.id ? 'Verifying...' : 'Verify'}
                        </button>
                        <button
                          onClick={() => handleDisconnect(account.id, platform.id)}
                          className="flex-1 px-3 py-2 text-sm font-medium text-red-300 bg-red-500/10 rounded-md hover:bg-red-500/20"
                        >
                          Disconnect
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-ink-2 mb-4">
                        No account connected
                      </p>
                      <button
                        onClick={() => handleConnect(platform.id)}
                        disabled={isConnecting}
                        className="w-full px-4 py-2 text-sm font-semibold text-[#04110d] bg-aqua rounded-md hover:bg-aqua-bright disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isConnecting ? (
                          <span className="flex items-center justify-center gap-2">
                            <svg
                              className="animate-spin h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </svg>
                            Connecting...
                          </span>
                        ) : (
                          `Connect ${platform.name}`
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}
