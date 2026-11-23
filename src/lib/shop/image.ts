/**
 * URL of a remote photo resized by Next's image optimizer (Vercel), for places that need a
 * plain <img> src (the copied 21st.dev components). Keeps large originals off the visitor's phone.
 */
export function optimizedSrc(src: string, width: 640 | 828 | 1080 | 1200 | 1920 = 1080, quality = 75): string {
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality}`;
}
