import Link from "next/link";
import Image from "next/image";
import ThemeShell from "@/components/marketing/ThemeShell";
import PageHero from "@/components/marketing/PageHero";
import DarkButton from "@/components/marketing/DarkButton";
import { getAllPosts } from "@/lib/blog";
import { Metadata } from "next";

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: "Blog - Novique AI Solutions",
  description: "Read our latest articles on AI, automation, and small business technology.",
};

export default async function BlogPage() {
  const allPosts = await getAllPosts();

  return (
    <ThemeShell>
      <PageHero
        eyebrow="Blog & insights"
        headline={
          <>
            Notes from the build,
            <br />
            <span className="text-ink-2">not the hype.</span>
          </>
        }
        subhead="Practical writing on AI, automation, and the unglamorous parts of putting software to work in a small business."
        intensity="soft"
      />

      {/* Posts grid */}
      <section className="mx-auto max-w-container px-6 py-16 md:py-24">
        {allPosts.length === 0 ? (
          <div className="nv-card mx-auto max-w-reading px-6 py-16 text-center">
            <p className="text-body-lg text-ink-2">No blog posts available yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {allPosts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group nv-card flex flex-col overflow-hidden transition-transform duration-300 hover:-translate-y-1"
              >
                {post.headerImage && (
                  <div className="relative h-48 w-full overflow-hidden border-b border-stroke-1 bg-surface-3">
                    <Image
                      src={post.headerImage}
                      alt={post.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                )}
                <div className="flex flex-1 flex-col p-6">
                  <div className="mb-3 flex items-center gap-2 font-mono text-xs text-ink-3">
                    <time dateTime={post.date}>
                      {new Date(post.date).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </time>
                    {post.featured && (
                      <span className="ml-1 rounded-full border border-stroke-accent px-2 py-0.5 text-[0.65rem] uppercase tracking-[0.14em] text-aqua">
                        Featured
                      </span>
                    )}
                  </div>
                  <h2 className="font-display text-dh3 text-ink-0 transition-colors group-hover:text-aqua-bright">
                    {post.title}
                  </h2>
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-2">{post.summary}</p>
                  {post.tags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2 border-t border-stroke-1 pt-4">
                      {post.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="rounded border border-stroke-1 bg-surface-3 px-2 py-1 font-mono text-[0.65rem] uppercase tracking-[0.12em] text-ink-2"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <span className="mt-auto pt-5 text-sm text-link group-hover:text-link-hover">Read post →</span>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-16 text-center">
          <DarkButton href="/consultation" size="lg">Book a free call</DarkButton>
        </div>
      </section>
    </ThemeShell>
  );
}
