/**
 * Server-side enhancement for rich-text (TipTap) HTML rendered via
 * `dangerouslySetInnerHTML` on the public blog/lab article pages.
 *
 * The article column is intentionally narrow (~68ch / `max-w-reading`) for prose
 * readability, which leaves embedded diagrams cramped and with no way to view them
 * full-size. This wraps each content <img> in a link to the full-resolution
 * original (opens in a new tab) and tags the <img> for full-width block display
 * with a zoom cursor. Pure string transform — it does not touch stored content.
 */
export function enhanceContentImages(html: string): string {
  if (!html) return html

  return html.replace(/<img\b[^>]*>/gi, (tag) => {
    const src = tag.match(/\bsrc=["']([^"']+)["']/i)?.[1]
    if (!src) return tag

    // Blog uploads store -medium / -small variants; link the full-size original
    // (strip the size suffix). Other srcs (e.g. lab-images, external) are unchanged.
    const fullSize = src.replace(/-(?:medium|small)(\.[a-z0-9]+)((?:\?.*)?)$/i, '$1$2')

    const taggedImg = /\bclass=["']/i.test(tag)
      ? tag.replace(/\bclass=["']([^"']*)["']/i, 'class="$1 nv-content-img"')
      : tag.replace(/<img\b/i, '<img class="nv-content-img"')

    return `<a href="${fullSize}" target="_blank" rel="noopener noreferrer" class="nv-img-zoom" aria-label="Open full-size image">${taggedImg}</a>`
  })
}
