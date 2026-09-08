import { describe, it, expect, vi, beforeEach } from "vitest"
import { coordinateTokenRefresh, isRefreshInProgress } from "../refresh-coordinator"
import { bareClient } from "../bare-client"
import { tokenStore } from "@/lib/auth/token-store"

vi.mock("../bare-client", () => ({
  bareClient: {
    post: vi.fn(),
  },
}))

describe("Concurrent Token Refresh Coordinator", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    tokenStore.clearTokens()
  })

  it("coordinates 5 concurrent refresh calls into exactly 1 HTTP request", async () => {
    tokenStore.setTokens("old_access", "valid_refresh")

    let callCount = 0
    vi.mocked(bareClient.post).mockImplementation(async () => {
      callCount++
      // Simulate network latency
      await new Promise((resolve) => setTimeout(resolve, 50))
      return {
        data: {
          success: true,
          data: {
            access_token: "new_access_token_abc",
            refresh_token: "new_refresh_token_xyz",
            token_type: "bearer",
          },
        },
      } as any
    })

    expect(isRefreshInProgress()).toBe(false)

    // Fire 5 concurrent refresh requests simultaneously
    const callers = [
      coordinateTokenRefresh(),
      coordinateTokenRefresh(),
      coordinateTokenRefresh(),
      coordinateTokenRefresh(),
      coordinateTokenRefresh(),
    ]

    expect(isRefreshInProgress()).toBe(true)

    const results = await Promise.all(callers)

    expect(callCount).toBe(1)
    expect(results).toHaveLength(5)
    for (const token of results) {
      expect(token).toBe("new_access_token_abc")
    }

    // Token store atomically updated
    expect(tokenStore.getAccessToken()).toBe("new_access_token_abc")
    expect(tokenStore.getRefreshToken()).toBe("new_refresh_token_xyz")
    expect(isRefreshInProgress()).toBe(false)
  })

  it("throws error and clears tokens when no refresh token is stored", async () => {
    tokenStore.clearTokens()

    await expect(coordinateTokenRefresh()).rejects.toThrow("No refresh token available")
    expect(tokenStore.getAccessToken()).toBeNull()
    expect(isRefreshInProgress()).toBe(false)
  })

  it("clears tokens, resets coordinator, and fails all queued callers when refresh request fails on backend", async () => {
    tokenStore.setTokens("old_access", "expired_refresh")

    vi.mocked(bareClient.post).mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20))
      throw new Error("401 Refresh Token Expired")
    })

    const callers = [
      coordinateTokenRefresh(),
      coordinateTokenRefresh(),
      coordinateTokenRefresh(),
    ]

    await expect(Promise.all(callers)).rejects.toThrow("401 Refresh Token Expired")

    expect(tokenStore.getAccessToken()).toBeNull()
    expect(tokenStore.getRefreshToken()).toBeNull()
    expect(isRefreshInProgress()).toBe(false)
  })
})
