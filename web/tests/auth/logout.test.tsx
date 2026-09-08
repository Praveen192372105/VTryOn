import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act, waitFor } from "@testing-library/react"
import React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { AuthProvider, useAuth } from "../../src/features/auth"
import { tokenStore } from "../../src/lib/auth/token-store"
import * as authApi from "../../src/features/auth/api"

vi.mock("../../src/features/auth/api", () => ({
  getCurrentUser: vi.fn(),
  loginUser: vi.fn(),
  registerUser: vi.fn(),
  logoutUser: vi.fn(),
  refreshToken: vi.fn(),
}))

describe("Logout & Protected State Cleanup", () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.clearAllMocks()
    tokenStore.clearTokens()
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    })
  })

  const createWrapper = () => {
    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <AuthProvider>{children}</AuthProvider>
      </QueryClientProvider>
    )
  }

  it("calls server revocation, clears credentials, cancels queries, and purges query cache", async () => {
    tokenStore.setTokens("mock-access", "mock-refresh")
    vi.mocked(authApi.getCurrentUser).mockResolvedValueOnce({
      id: "usr_user_a",
      name: "User A",
      email: "user_a@example.com",
    })
    vi.mocked(authApi.logoutUser).mockResolvedValueOnce(undefined)

    const cancelQueriesSpy = vi.spyOn(queryClient, "cancelQueries")
    const clearSpy = vi.spyOn(queryClient, "clear")

    // Populate private query cache for User A
    queryClient.setQueryData(["try-ons", "history"], [{ id: "job_private_1" }])
    expect(queryClient.getQueryData(["try-ons", "history"])).toEqual([{ id: "job_private_1" }])

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() })

    // Wait for async bootstrap to authenticate
    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true)
    })

    // Execute logout
    await act(async () => {
      await result.current.logout()
    })

    expect(authApi.logoutUser).toHaveBeenCalledTimes(1)
    expect(tokenStore.hasValidSession()).toBe(false)
    expect(cancelQueriesSpy).toHaveBeenCalled()
    expect(clearSpy).toHaveBeenCalled()
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeNull()
    expect(result.current.authReason).toBe("signed-out")

    // Verify private cached data is completely erased
    expect(queryClient.getQueryData(["try-ons", "history"])).toBeUndefined()
  })

  it("still clears local session, cancels queries, and purges cache if server revocation fails", async () => {
    tokenStore.setTokens("mock-access", "mock-refresh")
    vi.mocked(authApi.getCurrentUser).mockResolvedValueOnce({
      id: "usr_user_a",
      name: "User A",
      email: "user_a@example.com",
    })
    vi.mocked(authApi.logoutUser).mockRejectedValueOnce(new Error("500 Server Revocation Failed"))

    const cancelQueriesSpy = vi.spyOn(queryClient, "cancelQueries")
    const clearSpy = vi.spyOn(queryClient, "clear")

    queryClient.setQueryData(["user-profile"], { name: "User A Sensitive Info" })

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true)
    })

    await act(async () => {
      await result.current.logout()
    })

    // Local state must be cleared despite server error
    expect(tokenStore.hasValidSession()).toBe(false)
    expect(cancelQueriesSpy).toHaveBeenCalled()
    expect(clearSpy).toHaveBeenCalled()
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeNull()
    expect(queryClient.getQueryData(["user-profile"])).toBeUndefined()
  })
})
