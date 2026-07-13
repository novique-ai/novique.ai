'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { createClient } from '@/lib/supabase/client'

interface LoginFormData {
  email: string
  password: string
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>()

  const onSubmit = async (data: LoginFormData) => {
    try {
      setLoading(true)
      setError(null)

      const supabase = createClient()

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (authError) {
        throw authError
      }

      if (!authData.user) {
        throw new Error('Login failed - no user returned')
      }

      // Check if account is disabled
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_active, role')
        .eq('id', authData.user.id)
        .single()

      if (profile && !profile.is_active) {
        await supabase.auth.signOut()
        throw new Error('Your account has been disabled. Please contact support.')
      }

      // Redirect based on role
      const redirectTo = searchParams.get('redirectTo')
      if (redirectTo) {
        router.push(redirectTo)
      } else if (profile?.role === 'admin') {
        router.push('/admin/dashboard')
      } else if (profile?.role === 'editor') {
        router.push('/editor/dashboard')
      } else {
        router.push('/')
      }

      router.refresh()
    } catch (err) {
      console.error('Login error:', err)
      setError(err instanceof Error ? err.message : 'Failed to log in')
    } finally {
      setLoading(false)
    }
  }

  // Show error from URL params (e.g., account_disabled)
  const urlError = searchParams.get('error')

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
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-ink-2">
            Access the Novique.ai dashboard
          </p>
        </div>

        <div className="mt-8 rounded-2xl border border-stroke-0 bg-surface-2 p-6 sm:p-8">
          {(error || urlError) && (
            <div className="mb-6 rounded-lg bg-red-500/10 ring-1 ring-inset ring-red-500/25 p-4">
              <h3 className="text-sm font-medium text-red-300">
                {error || (urlError === 'account_disabled' && 'Account Disabled') || 'Error'}
              </h3>
              <div className="mt-1 text-sm text-red-300/80">
                {error ||
                  (urlError === 'account_disabled' &&
                    'Your account has been disabled. Please contact support.') ||
                  'An error occurred during login.'}
              </div>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-ink-1 mb-1.5">
                Email address
              </label>
              <input
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
                  },
                })}
                id="email"
                type="email"
                autoComplete="email"
                className="block w-full px-3 py-2.5 rounded-lg bg-surface-1 border border-stroke-1 text-ink-0 placeholder-ink-3 focus:outline-none focus:ring-2 focus:ring-aqua/60 focus:border-transparent sm:text-sm"
                placeholder="you@company.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-300">{errors.email.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-ink-1 mb-1.5">
                Password
              </label>
              <input
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters',
                  },
                })}
                id="password"
                type="password"
                autoComplete="current-password"
                className="block w-full px-3 py-2.5 rounded-lg bg-surface-1 border border-stroke-1 text-ink-0 placeholder-ink-3 focus:outline-none focus:ring-2 focus:ring-aqua/60 focus:border-transparent sm:text-sm"
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-300">{errors.password.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm">
                <Link
                  href="/forgot-password"
                  className="font-medium text-aqua hover:text-aqua-bright transition-colors"
                >
                  Forgot your password?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2.5 px-4 text-sm font-semibold rounded-full text-[#04110d] bg-aqua hover:bg-aqua-bright shadow-glow hover:shadow-glow-strong transition-all focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LoginForm />
    </Suspense>
  )
}
