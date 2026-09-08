/**
 * Safe Object URL lifecycle management utility.
 * Guarantees that every `URL.createObjectURL` is paired with `URL.revokeObjectURL`
 * to prevent browser memory leaks.
 */

export class PreviewUrlManager {
  private activeUrl: string | null = null

  /**
   * Creates an object URL for the provided File, automatically revoking
   * any previously managed URL.
   */
  create(file: File): string {
    this.revoke()
    this.activeUrl = URL.createObjectURL(file)
    return this.activeUrl
  }

  /**
   * Revokes the currently tracked object URL if one exists.
   */
  revoke(): void {
    if (this.activeUrl) {
      URL.revokeObjectURL(this.activeUrl)
      this.activeUrl = null
    }
  }

  /**
   * Gets the active object URL if present.
   */
  get current(): string | null {
    return this.activeUrl
  }
}

/**
 * Pure helper to safely revoke an object URL string if valid.
 */
export function safeRevokeObjectUrl(url: string | null | undefined): void {
  if (url && url.startsWith("blob:")) {
    try {
      URL.revokeObjectURL(url)
    } catch {
      // Ignore revocation errors
    }
  }
}
