'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { createClient } from '@/lib/supabase/client'

interface ResetPasswordFormData {
  password: string
  confirmPassword: string
}

export default function ResetPasswordPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [validToken, setValidToken] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFormData>()

  const password = watch('password')

  useEffect(() => {
    // Check if we have a valid session (user clicked reset link)
    const checkSession = async () => {
      const supabase = createClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session) {
        setValidToken(true)
      } else {
        setError('Invalid or expired reset link. Please request a new one.')
      }
    }

    checkSession()
  }, [])

  const onSubmit = async (data: ResetPasswordFormData) => {
    try {
      setLoading(true)
      setError(null)

      const supabase = createClient()

      const { error: updateError } = await supabase.auth.updateUser({
        password: data.password,
      })

      if (updateError) {
        throw updateError
      }

      setSuccess(true)

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } catch (err) {
      console.error('Password update error:', err)
      setError(err instanceof Error ? err.message : 'Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  if (!validToken && !error) {
    return (
      <div className="theme-dark min-h-screen flex items-center justify-center bg-surface-0 font-sans antialiased">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-aqua mx-auto"></div>
          <p className="mt-4 text-ink-2">Verifying reset link...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="theme-dark min-h-screen flex items-center justify-center bg-surface-0 font-sans antialiased py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center">
          <Link href="/" className="inline-flex items-baseline gap-0.5" aria-label="Novique home">
            <span className="font-display text-xl font-semibold tracking-tight text-ink-0">Novique</span>
            <span className="text-xl font-semibold leading-none text-aqua">.</span>
            <span className="font-display text-xl font-semibold tracking-tight text-ink-2">ai</span>
          </Link>
          <h2 className="mt-6 text-center font-display text-2xl font-semibold tracking-tight text-ink-0">
            Set new password
          </h2>
          <p className="mt-2 text-center text-sm text-ink-2">
            Choose a strong password for your account
          </p>
        </div>

        <div className="mt-8 rounded-2xl border border-stroke-0 bg-surface-2 p-6 sm:p-8">
        {error && (
          <div className="mb-6 rounded-lg bg-red-500/10 ring-1 ring-inset ring-red-500/25 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-300">Error</h3>
                <div className="mt-2 text-sm text-red-300/80">{error}</div>
              </div>
            </div>
            <div className="mt-4">
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-aqua hover:text-aqua-bright transition-colors"
              >
                Request new reset link
              </Link>
            </div>
          </div>
        )}

        {success && (
          <div className="rounded-lg bg-green-500/10 ring-1 ring-inset ring-green-500/25 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-300">Success</h3>
                <div className="mt-2 text-sm text-green-300/80">
                  Your password has been updated successfully. Redirecting to login...
                </div>
              </div>
            </div>
          </div>
        )}

        {validToken && !success && (
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-ink-1 mb-1.5">
                  New Password
                </label>
                <input
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 8,
                      message: 'Password must be at least 8 characters',
                    },
                    pattern: {
                      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                      message: 'Password must contain uppercase, lowercase, and number',
                    },
                  })}
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  className="block w-full px-3 py-2.5 rounded-lg bg-surface-1 border border-stroke-1 text-ink-0 placeholder-ink-3 focus:outline-none focus:ring-2 focus:ring-aqua/60 focus:border-transparent sm:text-sm"
                  placeholder="••••••••"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-300">{errors.password.message}</p>
                )}
                <p className="mt-1 text-xs text-ink-2">
                  Must be at least 8 characters with uppercase, lowercase, and number
                </p>
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-ink-1 mb-1.5"
                >
                  Confirm New Password
                </label>
                <input
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: (value) => value === password || 'Passwords do not match',
                  })}
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  className="block w-full px-3 py-2.5 rounded-lg bg-surface-1 border border-stroke-1 text-ink-0 placeholder-ink-3 focus:outline-none focus:ring-2 focus:ring-aqua/60 focus:border-transparent sm:text-sm"
                  placeholder="••••••••"
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-300">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2.5 px-4 text-sm font-semibold rounded-full text-[#04110d] bg-aqua hover:bg-aqua-bright shadow-glow hover:shadow-glow-strong transition-all focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Updating password...' : 'Update password'}
              </button>
            </div>
          </form>
        )}
        </div>
      </div>
    </div>
  )
}
