import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import ThemeShell from "@/components/marketing/ThemeShell";
import DarkButton from "@/components/marketing/DarkButton";
import { getPostBySlug } from "@/lib/blog";
import { enhanceContentImages } from "@/lib/editor/enhanceImages";
import { Metadata } from "next";

export const dynamic = 'force-dynamic'

// Removed generateStaticParams - pages render on-demand instead of at build time

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return {
      title: "Post Not Found",
    };
  }

  return {
    title: `${post.title} - Novique Blog`,
    description: post.summary,
  };
}

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <ThemeShell>
      <article>
        {/* Post header */}
        <header className="relative isolate overflow-hidden border-b border-stroke-1">
          {post.headerImage && (
            <div className="absolute inset-0" aria-hidden="true">
              <Image
                src={post.headerImage}
                alt=""
                fill
                className="object-contain object-center opacity-20"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-b from-surface-0/40 via-surface-0/70 to-surface-0" />
            </div>
          )}
          <div className="relative mx-auto max-w-reading px-6 pb-12 pt-24 md:pt-28">
            <Link
              href="/blog"
              className="mb-8 inline-flex items-center gap-2 text-sm text-link transition-colors hover:text-link-hover"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to Blog
            </Link>

            <h1 className="font-display text-display text-ink-0 text-balance">
              {post.title}
            </h1>

            <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-sm text-ink-2">
              <div className="flex items-center gap-2">
                <svg
                  className="h-4 w-4 text-ink-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <time dateTime={post.date}>
                  {new Date(post.date).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </time>
              </div>

              <span className="text-ink-3" aria-hidden="true">•</span>

              <div className="flex items-center gap-2">
                <svg
                  className="h-4 w-4 text-ink-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <span>{post.author}</span>
              </div>
            </div>

            {post.tags.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded border border-stroke-1 bg-surface-3 px-2.5 py-1 font-mono text-[0.65rem] uppercase tracking-[0.12em] text-ink-2"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </header>

        {/* Article body */}
        <div className="mx-auto max-w-reading px-6 py-12 md:py-16">
          <div
            className="prose prose-invert max-w-none prose-a:text-link prose-headings:font-display"
            dangerouslySetInnerHTML={{ __html: enhanceContentImages(post.content) }}
          />

          {/* CTA at bottom of article */}
          <div className="mt-12 border-t border-stroke-1 pt-10">
            <div className="nv-card rounded-2xl p-8 text-center">
              <h2 className="font-display text-dh2 text-ink-0">
                Ready to put AI to work in your business?
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-body-lg text-ink-2">
                Book a free consultation to discuss how Novique can help automate and optimize your business processes.
              </p>
              <div className="mt-7">
                <DarkButton href="/consultation" size="lg">
                  Book Free Consultation
                </DarkButton>
              </div>
            </div>
          </div>

          {/* Back to blog */}
          <div className="mt-10 text-center">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-sm text-link transition-colors hover:text-link-hover"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              View All Articles
            </Link>
          </div>
        </div>
      </article>
    </ThemeShell>
  );
}
