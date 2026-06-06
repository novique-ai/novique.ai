import type { AppBrand, AppLanding } from "@/lib/apps/registry";

/**
 * Static phone mockup rendering an app's in-app preview, themed per-app.
 * Rebuilt from the Glow Routine "App Store / Onboarding" Figma frame as JSX so
 * it scales crisply and carries no image weight. Purely presentational.
 */
export default function PhoneMockup({
  brand,
  preview,
  appName,
}: {
  brand: AppBrand;
  preview: AppLanding["preview"];
  appName: string;
}) {
  return (
    <div
      className="mx-auto w-full max-w-[300px] rounded-[44px] p-3 shadow-2xl"
      style={{ backgroundColor: brand.shell }}
      aria-hidden="true"
    >
      <div
        className="relative rounded-[34px] p-5"
        style={{ backgroundColor: brand.surface }}
      >
        {/* speaker */}
        <div className="mx-auto mb-5 h-1.5 w-20 rounded-full bg-black/70" />

        <p
          className="text-sm font-bold"
          style={{ color: brand.eyebrow }}
        >
          {appName}
        </p>
        <p className="mt-1 text-xl font-bold" style={{ color: brand.ink }}>
          {preview.title}
        </p>

        {/* routine card */}
        <div
          className="mt-5 rounded-2xl border bg-white p-4"
          style={{ borderColor: brand.cardBorder }}
        >
          <p className="text-xs font-bold" style={{ color: brand.body }}>
            Quick setup
          </p>

          {/* chips */}
          <div className="mt-3 flex gap-2">
            {preview.chips.map((chip, i) => {
              const active = i === 0;
              return (
                <span
                  key={chip}
                  className="rounded-full border-2 px-4 py-1 text-sm font-semibold"
                  style={
                    active
                      ? {
                          backgroundColor: brand.accent,
                          borderColor: brand.accent,
                          color: brand.accentInk,
                        }
                      : {
                          backgroundColor: brand.surface,
                          borderColor: brand.softBorder,
                          color: brand.muted,
                        }
                  }
                >
                  {chip}
                </span>
              );
            })}
          </div>

          {/* rows */}
          <div className="mt-3 space-y-2">
            {preview.rows.map((row) => (
              <div
                key={row.name}
                className="flex items-center gap-3 rounded-xl border bg-white p-3"
                style={{ borderColor: brand.cardBorder }}
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 text-sm font-bold text-white"
                  style={
                    row.checked
                      ? { backgroundColor: brand.sage, borderColor: brand.sage }
                      : {
                          backgroundColor: brand.surface,
                          borderColor: brand.softBorder,
                        }
                  }
                >
                  {row.checked ? "✓" : ""}
                </span>
                <span className="min-w-0">
                  <span
                    className="block text-sm font-semibold"
                    style={{ color: brand.ink }}
                  >
                    {row.name}
                  </span>
                  <span className="block text-xs" style={{ color: brand.muted }}>
                    {row.detail}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* privacy note */}
        <div
          className="mt-4 rounded-2xl border p-4"
          style={{
            backgroundColor: brand.softCard,
            borderColor: brand.softBorder,
          }}
        >
          <p className="text-sm font-bold" style={{ color: brand.body }}>
            {preview.privacyNote.title}
          </p>
          <p className="mt-1 text-xs" style={{ color: brand.muted }}>
            {preview.privacyNote.body}
          </p>
        </div>

        {/* cta */}
        <div
          className="mt-4 rounded-2xl py-3 text-center text-base font-bold"
          style={{ backgroundColor: brand.accent, color: brand.accentInk }}
        >
          {preview.cta}
        </div>
      </div>
    </div>
  );
}
