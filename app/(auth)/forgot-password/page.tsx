'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { createClient } from '@/lib/supabase/client'

interface ForgotPasswordFormData {
  email: string
}

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>()

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setLoading(true)
      setError(null)
      setSuccess(false)

      const supabase = createClient()

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (resetError) {
        throw resetError
      }

      setSuccess(true)
    } catch (err) {
      console.error('Password reset error:', err)
      setError(err instanceof Error ? err.message : 'Failed to send reset email')
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
            Reset your password
          </h2>
          <p className="mt-2 text-center text-sm text-ink-2">
            Enter your email address and we&apos;ll send you a reset link
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
            </div>
          )}

          {success && (
            <div className="mb-6 rounded-lg bg-green-500/10 ring-1 ring-inset ring-green-500/25 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-300">Check your email</h3>
                  <div className="mt-2 text-sm text-green-300/80">
                    We&apos;ve sent a password reset link to your email address. Please check your
                    inbox and follow the instructions.
                  </div>
                </div>
              </div>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
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
              <button
                type="submit"
                disabled={loading || success}
                className="group relative w-full flex justify-center py-2.5 px-4 text-sm font-semibold rounded-full text-[#04110d] bg-aqua hover:bg-aqua-bright shadow-glow hover:shadow-glow-strong transition-all focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : success ? 'Email sent' : 'Send reset link'}
              </button>
            </div>

            <div className="text-center text-sm">
              <Link href="/login" className="font-medium text-aqua hover:text-aqua-bright transition-colors">
                Back to sign in
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
