import { describe, it, expect, beforeEach } from "vitest"
import { tokenStore } from "../token-store"

describe("TokenStore", () => {
  beforeEach(() => {
    tokenStore.clearTokens()
    localStorage.clear()
  })

  it("stores and retrieves access and refresh tokens", () => {
    expect(tokenStore.getAccessToken()).toBeNull()
    expect(tokenStore.getRefreshToken()).toBeNull()
    expect(tokenStore.hasValidSession()).toBe(false)

    tokenStore.setTokens("access_token_123", "refresh_token_456")

    expect(tokenStore.getAccessToken()).toBe("access_token_123")
    expect(tokenStore.getRefreshToken()).toBe("refresh_token_456")
    expect(tokenStore.hasValidSession()).toBe(true)
  })

  it("clears stored tokens cleanly", () => {
    tokenStore.setTokens("token_a", "token_b")
    expect(tokenStore.hasValidSession()).toBe(true)

    tokenStore.clearTokens()
    expect(tokenStore.getAccessToken()).toBeNull()
    expect(tokenStore.getRefreshToken()).toBeNull()
    expect(tokenStore.hasValidSession()).toBe(false)
  })
})
