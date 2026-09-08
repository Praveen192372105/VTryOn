import { ROUTES } from "@/app/route-paths"

/**
 * Validates post-authentication redirect candidates to prevent open redirects.
 *
 * Requirements:
 * - Must be an internal path strictly under the protected `/app` hierarchy
 * - Rejects external URLs, protocol-relative URLs (//example.com), and path-traversal/escaped attempts
 * - Rejects dangerous URI schemes (javascript:, data:)
 * - Preserves safe query strings and hash anchors for legitimate internal routes
 */
export function getSafeRedirectTarget(
  candidate: string | null | undefined,
  fallback: string = ROUTES.app.studio
): string {
  if (!candidate || typeof candidate !== "string") {
    return fallback
  }

  const trimmed = candidate.trim()

  // Must begin with a single slash, not a double slash or backslash
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.startsWith("/\\") || trimmed.startsWith("\\")) {
    return fallback
  }

  // Reject candidates containing URI schemes or encoded slashes
  const lower = trimmed.toLowerCase()
  if (
    lower.includes("javascript:") ||
    lower.includes("data:") ||
    lower.includes("vbscript:") ||
    lower.includes("http:") ||
    lower.includes("https:") ||
    lower.includes("%2f%2f") ||
    lower.includes("%5c")
  ) {
    return fallback
  }

  // Parse path part before query/hash to check route namespace
  try {
    // Construct a dummy URL with a fixed origin to safely inspect path components
    const parsed = new URL(trimmed, "http://localhost")

    // The pathname must start with /app
    if (!parsed.pathname.startsWith("/app")) {
      return fallback
    }

    // Return the sanitized relative pathname + search + hash
    return `${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch {
    return fallback
  }
}
