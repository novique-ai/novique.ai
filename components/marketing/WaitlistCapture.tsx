"use client";

import { useState } from "react";

/**
 * LienSentry waitlist capture. NOTE: UI-only for this review build — it does not
 * yet POST anywhere. Wiring it to Resend/Supabase requires a server action or a
 * route OUTSIDE the do-not-touch app/api tree; left as a follow-up so the page
 * stays statically generated and respects the do-not-touch boundary.
 */
export default function WaitlistCapture({ product = "LienSentry" }: { product?: string }) {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <p className="text-sm text-aqua-bright">
        Thanks — you&apos;re on the list. We&apos;ll email you when {product} opens.
      </p>
    );
  }

  return (
    <form
      className="flex w-full max-w-sm flex-col gap-2 sm:flex-row"
      onSubmit={(e) => {
        e.preventDefault();
        if (email.trim()) setDone(true);
      }}
    >
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@company.com"
        aria-label={`Email for the ${product} waitlist`}
        className="min-w-0 flex-1 rounded-full border border-stroke-1 bg-surface-3 px-4 py-2 text-sm text-ink-0 placeholder:text-ink-3 focus:border-aqua"
      />
      <button
        type="submit"
        className="rounded-full bg-aqua px-4 py-2 text-sm font-semibold text-[#04110d] shadow-glow transition-all duration-200 hover:bg-aqua-bright hover:shadow-glow-strong"
      >
        Join waitlist
      </button>
    </form>
  );
}
