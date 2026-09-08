import { env } from "@/config/env"

/**
 * Resolves a media URL (such as /media/people/...) against the configured
 * API base URL so relative paths load correctly across development and production.
 */
export function resolveMediaUrl(url?: string | null): string {
  if (!url) return ""

  // Absolute URLs, Blob URLs, or Data URIs remain untouched
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("blob:") ||
    url.startsWith("data:")
  ) {
    return url
  }

  const cleanPath = url.startsWith("/") ? url : `/${url}`
  const base = env.apiBaseUrl.replace(/\/+$/, "")
  return `${base}${cleanPath}`
}
