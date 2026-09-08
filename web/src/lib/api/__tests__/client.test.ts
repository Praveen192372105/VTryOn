import { describe, it, expect, vi, beforeEach } from "vitest"
import { apiClient, apiRequest } from "../client"
import { tokenStore } from "@/lib/auth/token-store"
import type { AxiosResponse } from "axios"

describe("apiClient and apiRequest", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    tokenStore.clearTokens()
  })

  it("unwraps ApiSuccess envelope data cleanly", async () => {
    const mockResponse: AxiosResponse = {
      data: {
        success: true,
        data: { id: "test_123", name: "Sample Item" },
      },
      status: 200,
      statusText: "OK",
      headers: {},
      config: {} as any,
    }

    const result = await apiRequest(Promise.resolve(mockResponse))
    expect(result).toEqual({ id: "test_123", name: "Sample Item" })
  })

  it("handles HTTP 204 No Content returning void/undefined without JSON parsing", async () => {
    const mock204Response: AxiosResponse = {
      data: "",
      status: 204,
      statusText: "No Content",
      headers: {},
      config: {} as any,
    }

    const result = await apiRequest(Promise.resolve(mock204Response))
    expect(result).toBeUndefined()
  })

  it("passes through raw payload if success envelope property is absent", async () => {
    const rawResponse: AxiosResponse = {
      data: { custom: "payload" },
      status: 200,
      statusText: "OK",
      headers: {},
      config: {} as any,
    }

    const result = await apiRequest(Promise.resolve(rawResponse))
    expect(result).toEqual({ custom: "payload" })
  })

  it("attaches Authorization header when tokenStore has an access token", async () => {
    tokenStore.setTokens("access_token_abc", "refresh_token_xyz")

    const testConfig = {
      headers: {} as any,
    }

    const interceptor = (apiClient.interceptors.request as any).handlers[0].fulfilled
    const transformedConfig = await interceptor(testConfig)

    expect(transformedConfig.headers.Authorization).toBe("Bearer access_token_abc")
    expect(transformedConfig.headers["X-Request-ID"]).toBeDefined()
  })

  it("omits Authorization header when no access token exists", async () => {
    const testConfig = {
      headers: {} as any,
    }

    const interceptor = (apiClient.interceptors.request as any).handlers[0].fulfilled
    const transformedConfig = await interceptor(testConfig)

    expect(transformedConfig.headers.Authorization).toBeUndefined()
    expect(transformedConfig.headers["X-Request-ID"]).toBeDefined()
  })

  it("omits Authorization header when skipAuth flag is enabled", async () => {
    tokenStore.setTokens("access_token_abc", "refresh_token_xyz")

    const testConfig = {
      headers: {} as any,
      skipAuth: true,
    }

    const interceptor = (apiClient.interceptors.request as any).handlers[0].fulfilled
    const transformedConfig = await interceptor(testConfig)

    expect(transformedConfig.headers.Authorization).toBeUndefined()
  })
})
