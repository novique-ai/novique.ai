'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { createClient } from '@/lib/supabase/client'

interface SignupFormData {
  email: string
  password: string
  confirmPassword: string
  fullName: string
}

export default function SignupPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignupFormData>()

  const password = watch('password')

  const onSubmit = async (data: SignupFormData) => {
    try {
      setLoading(true)
      setError(null)

      const supabase = createClient()

      // Check if any users exist (to determine if this is the first user)
      const { data: existingProfiles, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1)

      if (checkError) {
        console.error('Error checking existing users:', checkError)
      }

      const isFirstUser = !existingProfiles || existingProfiles.length === 0

      // Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            // First user becomes admin, others default to editor
            role: isFirstUser ? 'admin' : 'editor',
          },
        },
      })

      if (authError) {
        throw authError
      }

      if (!authData.user) {
        throw new Error('Signup failed - no user returned')
      }

      // Show success message
      alert(
        isFirstUser
          ? 'Account created! You are the first admin. Please check your email to verify your account.'
          : 'Account created! Please check your email to verify your account.'
      )

      // Redirect to login
      router.push('/login')
    } catch (err) {
      console.error('Signup error:', err)
      setError(err instanceof Error ? err.message : 'Failed to create account')
    } finally {
      setLoading(false)
    }
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
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-ink-2">
            Hidden signup page - No navigation links
          </p>
          <div className="mt-4 text-left rounded-lg bg-yellow-500/10 ring-1 ring-inset ring-yellow-500/25 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-300">Important</h3>
                <div className="mt-2 text-sm text-yellow-300/80">
                  This page is for initial admin setup only. After creating the first admin
                  account, disable public signups in Supabase settings. Future users should be
                  invited via the admin panel.
                </div>
              </div>
            </div>
          </div>
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
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-ink-1 mb-1.5">
                Full Name
              </label>
              <input
                {...register('fullName', {
                  required: 'Full name is required',
                  minLength: {
                    value: 2,
                    message: 'Name must be at least 2 characters',
                  },
                })}
                id="fullName"
                type="text"
                autoComplete="name"
                className="block w-full px-3 py-2.5 rounded-lg bg-surface-1 border border-stroke-1 text-ink-0 placeholder-ink-3 focus:outline-none focus:ring-2 focus:ring-aqua/60 focus:border-transparent sm:text-sm"
                placeholder="John Doe"
              />
              {errors.fullName && (
                <p className="mt-1 text-sm text-red-300">{errors.fullName.message}</p>
              )}
            </div>

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
                placeholder="you@example.com"
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
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-ink-1 mb-1.5"
              >
                Confirm Password
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
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </div>

          <div className="text-center text-sm">
            <span className="text-ink-2">Already have an account? </span>
            <Link href="/login" className="font-medium text-aqua hover:text-aqua-bright transition-colors">
              Sign in
            </Link>
          </div>
          </form>
        </div>
      </div>
    </div>
  )
}
