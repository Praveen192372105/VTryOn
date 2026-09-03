import { describe, it, expect, vi, beforeEach } from "vitest"
import axios from "axios"
import { coordinateTokenRefresh } from "../refresh-coordinator"
import { tokenStore } from "../../auth/token-store"

vi.mock("axios")

describe("Concurrent Token Refresh Coordinator", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    tokenStore.clearTokens()
  })

  it("coordinates multiple concurrent refresh calls into exactly one HTTP request", async () => {
    tokenStore.setTokens("old_access", "valid_refresh")

    let callCount = 0
    vi.mocked(axios.post).mockImplementation(async () => {
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

    // Fire two concurrent refresh requests simultaneously
    const [token1, token2] = await Promise.all([
      coordinateTokenRefresh(),
      coordinateTokenRefresh(),
    ])

    expect(callCount).toBe(1)
    expect(token1).toBe("new_access_token_abc")
    expect(token2).toBe("new_access_token_abc")
    expect(tokenStore.getAccessToken()).toBe("new_access_token_abc")
    expect(tokenStore.getRefreshToken()).toBe("new_refresh_token_xyz")
  })

  it("throws error and clears tokens when no refresh token is stored", async () => {
    tokenStore.clearTokens()

    await expect(coordinateTokenRefresh()).rejects.toThrow("No refresh token available")
    expect(tokenStore.getAccessToken()).toBeNull()
  })
})
