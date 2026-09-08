import { describe, it, expect, beforeEach } from "vitest"
import { tokenStore } from "../token-store"

describe("TokenStore", () => {
  beforeEach(() => {
    localStorage.clear()
    tokenStore.clearTokens()
  })

  it("initializes in empty state", () => {
    expect(tokenStore.getAccessToken()).toBeNull()
    expect(tokenStore.getRefreshToken()).toBeNull()
    expect(tokenStore.getSessionTokens()).toBeNull()
    expect(tokenStore.hasValidSession()).toBe(false)
  })

  it("stores and retrieves access and refresh tokens", () => {
    tokenStore.setTokens("mock-access-token", "mock-refresh-token")

    expect(tokenStore.getAccessToken()).toBe("mock-access-token")
    expect(tokenStore.getRefreshToken()).toBe("mock-refresh-token")
    expect(tokenStore.hasValidSession()).toBe(true)

    const session = tokenStore.getSessionTokens()
    expect(session).toEqual({
      accessToken: "mock-access-token",
      refreshToken: "mock-refresh-token",
    })
  })

  it("supports session-oriented API", () => {
    tokenStore.setSessionTokens({
      accessToken: "session-access-123",
      refreshToken: "session-refresh-456",
    })

    expect(tokenStore.getSessionTokens()).toEqual({
      accessToken: "session-access-123",
      refreshToken: "session-refresh-456",
    })

    tokenStore.clearSessionTokens()
    expect(tokenStore.getSessionTokens()).toBeNull()
    expect(tokenStore.hasValidSession()).toBe(false)
  })

  it("atomically updates rotated tokens", () => {
    tokenStore.setTokens("initial-access", "initial-refresh")
    expect(tokenStore.getRefreshToken()).toBe("initial-refresh")

    // Simulate refresh rotation
    tokenStore.setTokens("rotated-access", "rotated-refresh")
    expect(tokenStore.getAccessToken()).toBe("rotated-access")
    expect(tokenStore.getRefreshToken()).toBe("rotated-refresh")
  })

  it("clears tokens and removes keys from localStorage", () => {
    tokenStore.setTokens("access-to-clear", "refresh-to-clear")
    tokenStore.clearTokens()

    expect(tokenStore.getAccessToken()).toBeNull()
    expect(tokenStore.getRefreshToken()).toBeNull()
    expect(tokenStore.hasValidSession()).toBe(false)
    expect(localStorage.getItem("vtryon_access_token")).toBeNull()
    expect(localStorage.getItem("vtryon_refresh_token")).toBeNull()
  })

  it("handles corrupt, undefined, or empty persisted data gracefully", () => {
    localStorage.setItem("vtryon_access_token", "undefined")
    localStorage.setItem("vtryon_refresh_token", "   ")

    // Force re-hydration / read
    tokenStore.clearTokens()
    localStorage.setItem("vtryon_access_token", "[object Object]")
    localStorage.setItem("vtryon_refresh_token", "null")

    expect(tokenStore.getAccessToken()).toBeNull()
    expect(tokenStore.getRefreshToken()).toBeNull()
    expect(tokenStore.hasValidSession()).toBe(false)
  })
})
