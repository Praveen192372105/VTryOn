import type { SessionTokens } from "./session"

const ACCESS_TOKEN_KEY = "vtryon_access_token"
const REFRESH_TOKEN_KEY = "vtryon_refresh_token"

function sanitizeToken(value: unknown): string | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  if (!trimmed || trimmed === "undefined" || trimmed === "null" || trimmed === "[object Object]") {
    return null
  }
  return trimmed
}

class TokenStore {
  private accessToken: string | null = null
  private refreshToken: string | null = null

  constructor() {
    this.hydrate()
  }

  private hydrate(): void {
    try {
      this.accessToken = sanitizeToken(localStorage.getItem(ACCESS_TOKEN_KEY))
      this.refreshToken = sanitizeToken(localStorage.getItem(REFRESH_TOKEN_KEY))
    } catch {
      // localStorage may be restricted in private browsing or non-browser environments
      this.accessToken = null
      this.refreshToken = null
    }
  }

  /**
   * Returns current active session tokens if both access and refresh tokens are valid.
   */
  getSessionTokens(): SessionTokens | null {
    const access = this.getAccessToken()
    const refresh = this.getRefreshToken()
    if (access && refresh) {
      return { accessToken: access, refreshToken: refresh }
    }
    return null
  }

  /**
   * Atomically stores both access and refresh tokens.
   */
  setSessionTokens(tokens: SessionTokens): void {
    this.setTokens(tokens.accessToken, tokens.refreshToken)
  }

  /**
   * Atomically purges session tokens from memory and persistent storage.
   */
  clearSessionTokens(): void {
    this.clearTokens()
  }

  getAccessToken(): string | null {
    if (!this.accessToken) {
      try {
        this.accessToken = sanitizeToken(localStorage.getItem(ACCESS_TOKEN_KEY))
      } catch {
        this.accessToken = null
      }
    }
    return this.accessToken
  }

  getRefreshToken(): string | null {
    if (!this.refreshToken) {
      try {
        this.refreshToken = sanitizeToken(localStorage.getItem(REFRESH_TOKEN_KEY))
      } catch {
        this.refreshToken = null
      }
    }
    return this.refreshToken
  }

  setTokens(accessToken: string, refreshToken: string): void {
    const cleanAccess = sanitizeToken(accessToken)
    const cleanRefresh = sanitizeToken(refreshToken)

    this.accessToken = cleanAccess
    this.refreshToken = cleanRefresh

    try {
      if (cleanAccess) {
        localStorage.setItem(ACCESS_TOKEN_KEY, cleanAccess)
      } else {
        localStorage.removeItem(ACCESS_TOKEN_KEY)
      }

      if (cleanRefresh) {
        localStorage.setItem(REFRESH_TOKEN_KEY, cleanRefresh)
      } else {
        localStorage.removeItem(REFRESH_TOKEN_KEY)
      }
    } catch {
      // Storage unavailable or quota exceeded
    }
  }

  clearTokens(): void {
    this.accessToken = null
    this.refreshToken = null
    try {
      localStorage.removeItem(ACCESS_TOKEN_KEY)
      localStorage.removeItem(REFRESH_TOKEN_KEY)
    } catch {
      // Ignore storage cleanup error
    }
  }

  hasValidSession(): boolean {
    return Boolean(this.getAccessToken() || this.getRefreshToken())
  }
}

export const tokenStore = new TokenStore()
