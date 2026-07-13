import Link from 'next/link'

export default function UnauthorizedPage() {
  return (
    <div className="theme-dark min-h-screen flex items-center justify-center bg-surface-0 font-sans antialiased py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center">
        <div>
          <Link href="/" className="inline-flex items-baseline gap-0.5" aria-label="Novique home">
            <span className="font-display text-xl font-semibold tracking-tight text-ink-0">Novique</span>
            <span className="text-xl font-semibold leading-none text-aqua">.</span>
            <span className="font-display text-xl font-semibold tracking-tight text-ink-2">ai</span>
          </Link>
        </div>

        <div className="mt-8 rounded-2xl border border-stroke-0 bg-surface-2 p-6 sm:p-8 space-y-8">
          <div>
            <h1 className="text-6xl font-bold text-ink-0">403</h1>
            <h2 className="mt-6 font-display text-3xl font-semibold tracking-tight text-ink-0">Access Denied</h2>
            <p className="mt-2 text-sm text-ink-2">
              You don&apos;t have permission to access this page.
            </p>
          </div>

          <div className="space-y-4">
            <p className="text-ink-1">
              This page requires specific permissions that your account doesn&apos;t have.
            </p>
            <p className="text-sm text-ink-2">
              If you believe this is an error, please contact an administrator.
            </p>
          </div>

          <div className="space-x-4">
            <Link
              href="/"
              className="inline-block px-4 py-2 text-sm font-semibold rounded-full text-[#04110d] bg-aqua hover:bg-aqua-bright shadow-glow transition-all"
            >
              Go Home
            </Link>
            <Link
              href="/login"
              className="inline-block px-4 py-2 border border-stroke-1 text-sm font-medium rounded-full text-ink-1 bg-surface-1 hover:bg-surface-3/60 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
