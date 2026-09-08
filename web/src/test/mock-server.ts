import { apiClient } from "@/lib/api/client"
import {
  mockQueuedJob,
  mockProcessingJob,
  mockSucceededJob,
  mockFailedJob,
} from "./fixtures/try-on-fixtures"
import { mockOutfitListResponse, mockOutfitSilkShirt } from "./fixtures/outfit-fixtures"
import { mockPersonUploadListResponse, mockPersonUpload1 } from "./fixtures/upload-fixtures"
import type { TryOnJob, TryOnStatus } from "@/features/try-on/types"

/**
 * Request Interception Mock Server for Component, Integration, and E2E Tests.
 *
 * Section 21.1: Use MSW or equivalent request interception for component/integration tests.
 * Never make component tests depend on a locally running CatVTON model.
 */
export class MockServer {
  private originalAdapter: typeof apiClient.defaults.adapter
  private activeJob: TryOnJob = { ...mockQueuedJob }
  private failNextConfig?: { status: number; code?: string; message?: string }

  start() {
    this.originalAdapter = apiClient.defaults.adapter
    apiClient.defaults.adapter = (async (config: any): Promise<any> => {
      // Fail next request if configured
      if (this.failNextConfig) {
        const { status, code, message } = this.failNextConfig
        this.failNextConfig = undefined
        return Promise.reject({
          response: {
            status,
            data: {
              success: false,
              error: {
                code: code || "ERROR",
                message: message || "Mock server error",
              },
            },
            headers: {},
            config,
          },
        })
      }

      const url = config.url || ""
      const method = (config.method || "GET").toUpperCase()

      // 1. Auth routes
      if (url.includes("/auth/login") && method === "POST") {
        return {
          status: 200,
          data: {
            access_token: "mock-access-token",
            refresh_token: "mock-refresh-token",
            token_type: "bearer",
            user: { id: "user_1", email: "user@example.com", name: "Test User" },
          },
          headers: {},
          config,
          statusText: "OK",
        }
      }

      if (url.includes("/auth/register") && method === "POST") {
        return {
          status: 201,
          data: {
            access_token: "mock-access-token",
            refresh_token: "mock-refresh-token",
            token_type: "bearer",
            user: { id: "user_1", email: "user@example.com", name: "Test User" },
          },
          headers: {},
          config,
          statusText: "Created",
        }
      }

      if (url.includes("/auth/me") && method === "GET") {
        return {
          status: 200,
          data: {
            success: true,
            data: { id: "user_1", email: "user@example.com", name: "Test User" },
          },
          headers: {},
          config,
          statusText: "OK",
        }
      }

      // 2. Uploads routes
      if (url.includes("/uploads") && method === "GET") {
        return {
          status: 200,
          data: { success: true, data: mockPersonUploadListResponse },
          headers: {},
          config,
          statusText: "OK",
        }
      }

      if (url.includes("/uploads") && method === "POST") {
        return {
          status: 201,
          data: { success: true, data: mockPersonUpload1 },
          headers: {},
          config,
          statusText: "Created",
        }
      }

      // 3. Outfits routes
      if (url.includes("/outfits") && method === "GET") {
        return {
          status: 200,
          data: { success: true, data: mockOutfitListResponse },
          headers: {},
          config,
          statusText: "OK",
        }
      }

      // 4. Try-ons routes
      if (url.endsWith("/try-ons") && method === "POST") {
        return {
          status: 202,
          data: { success: true, data: this.activeJob },
          headers: {},
          config,
          statusText: "Accepted",
        }
      }

      if (url.includes("/try-ons/") && url.endsWith("/content") && method === "GET") {
        const blob = new Blob(["mock-image-binary"], { type: "image/jpeg" })
        return {
          status: 200,
          data: blob,
          headers: { "content-type": "image/jpeg" },
          config,
          statusText: "OK",
        }
      }

      if (url.includes("/try-ons/") && method === "GET") {
        return {
          status: 200,
          data: { success: true, data: this.activeJob },
          headers: {},
          config,
          statusText: "OK",
        }
      }

      // 5. Favorites routes
      if (url.includes("/favorites") && method === "GET") {
        return {
          status: 200,
          data: {
            success: true,
            data: {
              items: [{ outfit: mockOutfitSilkShirt, favorited_at: "2026-09-05T00:00:00Z" }],
              pagination: { page: 1, page_size: 20, total: 1, total_pages: 1 },
            },
          },
          headers: {},
          config,
          statusText: "OK",
        }
      }

      if (url.includes("/favorites/") && (method === "POST" || method === "DELETE")) {
        return {
          status: 204,
          data: null,
          headers: {},
          config,
          statusText: "No Content",
        }
      }

      // Fallback
      return {
        status: 200,
        data: { success: true, data: null },
        headers: {},
        config,
        statusText: "OK",
      }
    }) as any
  }

  setJobStatus(status: TryOnStatus, overrides?: Partial<TryOnJob>) {
    if (status === "queued") this.activeJob = { ...mockQueuedJob, ...overrides }
    else if (status === "processing") this.activeJob = { ...mockProcessingJob, ...overrides }
    else if (status === "succeeded") this.activeJob = { ...mockSucceededJob, ...overrides }
    else if (status === "failed") this.activeJob = { ...mockFailedJob, ...overrides }
  }

  failNext(status: number, code?: string, message?: string) {
    this.failNextConfig = { status, code, message }
  }

  reset() {
    this.activeJob = { ...mockQueuedJob }
    this.failNextConfig = undefined
  }

  stop() {
    if (this.originalAdapter) {
      apiClient.defaults.adapter = this.originalAdapter
    }
  }
}

export const mockServer = new MockServer()
