/**
 * Generate a bounded, safe, opaque client request ID.
 * Format: req_<random_hex_16>
 */
export function generateRequestId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `req_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`
  }
  const timestamp = Date.now().toString(36)
  const randomPart = Math.random().toString(36).substring(2, 10)
  return `req_${timestamp}${randomPart}`
}
