import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import ThemeShell from "@/components/marketing/ThemeShell";
import Logo from "@/components/Logo";
import { getFeaturedPosts } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Links | Novique.ai",
  description:
    "Quick links to Novique.ai resources - featured articles, social media, and more.",
};

// Social media links with icons
const socialLinks = [
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/company/novique-ai/",
    icon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
      </svg>
    ),
  },
  {
    name: "Instagram",
    href: "https://www.instagram.com/noviqueai/",
    icon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
  },
  {
    name: "X (Twitter)",
    href: "https://x.com/noviqueai",
    icon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
];

// Info/About links
const infoLinks = [
  {
    name: "About Novique.ai",
    href: "/about",
    description: "Learn about our mission and team",
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  {
    name: "Our Solutions",
    href: "/solutions",
    description: "AI services for small businesses",
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
        />
      </svg>
    ),
  },
  {
    name: "All Blog Posts",
    href: "/blog",
    description: "Browse all our articles",
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
        />
      </svg>
    ),
  },
];

export default async function LinksPage() {
  const featuredPosts = await getFeaturedPosts();

  return (
    <ThemeShell>
      <div className="mx-auto max-w-lg px-6 py-16 md:py-24">
        {/* Logo and Header */}
        <div className="mb-10 text-center">
          <Link href="/" className="mb-5 inline-block">
            <Logo className="mx-auto h-16 w-auto" />
          </Link>
          <p className="text-sm text-ink-2">
            AI Solutions for Small Business Success
          </p>
        </div>

        {/* Main CTA - Book Consultation */}
        <Link
          href="/consultation"
          className="group mb-10 block w-full rounded-2xl bg-aqua p-5 text-center text-[#04110d] shadow-glow transition-all duration-200 hover:bg-aqua-bright hover:shadow-glow-strong hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-center gap-3">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="text-lg font-semibold">Book a Free Consultation</span>
          </div>
          <p className="mt-1 text-sm text-[#04110d]/70">
            Let&apos;s discuss how AI can help your business
          </p>
        </Link>

        {/* Featured Articles Section */}
        <div className="mb-10">
          <div className="mb-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-stroke-1"></div>
            <h2 className="nv-eyebrow">Featured Articles</h2>
            <div className="h-px flex-1 bg-stroke-1"></div>
          </div>

          <div className="space-y-3">
            {featuredPosts.slice(0, 3).map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group flex items-center gap-4 rounded-xl border border-stroke-1 bg-surface-2 p-3 transition-all duration-200 hover:border-stroke-2 hover:-translate-y-0.5"
              >
                <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-surface-3">
                  {post.headerImage ? (
                    <Image
                      src={post.headerImage}
                      alt={post.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg
                        className="h-6 w-6 text-ink-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="line-clamp-2 text-sm font-semibold leading-tight text-ink-0">
                    {post.title}
                  </h3>
                  <p className="mt-1 font-mono text-xs text-ink-2">
                    {new Date(post.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <svg
                  className="h-5 w-5 flex-shrink-0 text-ink-3 transition-colors group-hover:text-aqua"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            ))}
          </div>
        </div>

        {/* Social Media Section */}
        <div className="mb-10">
          <div className="mb-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-stroke-1"></div>
            <h2 className="nv-eyebrow">Follow Us</h2>
            <div className="h-px flex-1 bg-stroke-1"></div>
          </div>

          <div className="flex justify-center gap-4">
            {socialLinks.map((social) => (
              <a
                key={social.name}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-14 w-14 items-center justify-center rounded-full border border-stroke-1 bg-surface-2 text-ink-1 transition-all duration-200 hover:border-aqua hover:text-aqua hover:-translate-y-0.5"
                aria-label={social.name}
              >
                {social.icon}
              </a>
            ))}
          </div>
        </div>

        {/* More Info Section */}
        <div className="mb-10">
          <div className="mb-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-stroke-1"></div>
            <h2 className="nv-eyebrow">Learn More</h2>
            <div className="h-px flex-1 bg-stroke-1"></div>
          </div>

          <div className="space-y-3">
            {infoLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="group flex items-center gap-4 rounded-xl border border-stroke-1 bg-surface-2 p-4 transition-all duration-200 hover:border-stroke-2 hover:-translate-y-0.5"
              >
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-surface-3 text-aqua">
                  {link.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-ink-0">{link.name}</h3>
                  <p className="text-sm text-ink-2">{link.description}</p>
                </div>
                <svg
                  className="h-5 w-5 flex-shrink-0 text-ink-3 transition-colors group-hover:text-aqua"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-stroke-1 pt-5 text-center">
          <Link
            href="/"
            className="text-sm font-medium text-link hover:text-link-hover"
          >
            Visit novique.ai
          </Link>
          <p className="mt-2 font-mono text-xs text-ink-3">
            &copy; {new Date().getFullYear()} Novique.ai
          </p>
        </div>
      </div>
    </ThemeShell>
  );
}
