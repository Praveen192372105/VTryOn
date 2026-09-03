const ACCESS_TOKEN_KEY = "vtryon_access_token"
const REFRESH_TOKEN_KEY = "vtryon_refresh_token"

class TokenStore {
  private accessToken: string | null = null
  private refreshToken: string | null = null

  constructor() {
    this.hydrate()
  }

  private hydrate() {
    try {
      this.accessToken = localStorage.getItem(ACCESS_TOKEN_KEY)
      this.refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
    } catch {
      // localStorage may be unavailable in private browsing or non-browser contexts
      this.accessToken = null
      this.refreshToken = null
    }
  }

  getAccessToken(): string | null {
    if (!this.accessToken) {
      try {
        this.accessToken = localStorage.getItem(ACCESS_TOKEN_KEY)
      } catch {
        this.accessToken = null
      }
    }
    return this.accessToken
  }

  getRefreshToken(): string | null {
    if (!this.refreshToken) {
      try {
        this.refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
      } catch {
        this.refreshToken = null
      }
    }
    return this.refreshToken
  }

  setTokens(accessToken: string, refreshToken: string): void {
    this.accessToken = accessToken
    this.refreshToken = refreshToken
    try {
      localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
    } catch (err) {
      console.warn("Failed to persist auth tokens to storage", err)
    }
  }

  clearTokens(): void {
    this.accessToken = null
    this.refreshToken = null
    try {
      localStorage.removeItem(ACCESS_TOKEN_KEY)
      localStorage.removeItem(REFRESH_TOKEN_KEY)
    } catch {
      // Ignore cleanup error
    }
  }

  hasValidSession(): boolean {
    return Boolean(this.getAccessToken() || this.getRefreshToken())
  }
}

export const tokenStore = new TokenStore()
