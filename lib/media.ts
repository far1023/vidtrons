/**
 * Normalizes external media URLs.
 * Converts Google Drive sharing and download URLs into direct embeddable CDN links
 * (https://lh3.googleusercontent.com/d/{id}) that bypass browser CORP
 * (Cross-Origin Resource Policy) same-site restrictions.
 */
export function normalizeMediaUrl(url: string): string {
  if (!url) return url

  const driveMatch = url.match(
    /(?:drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?.*?id=)|drive\.usercontent\.google\.com\/download\?.*?id=)([a-zA-Z0-9_-]+)/
  )

  if (driveMatch?.[1]) {
    return `https://lh3.googleusercontent.com/d/${driveMatch[1]}=s0`
  }

  return url
}
