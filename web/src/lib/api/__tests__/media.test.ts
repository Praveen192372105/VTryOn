import { describe, it, expect, vi, beforeEach } from "vitest"
import { fetchAuthenticatedBlob } from "../media"
import { apiClient } from "../client"

vi.mock("../client", () => ({
  apiClient: {
    get: vi.fn(),
  },
}))

describe("fetchAuthenticatedBlob", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("requests media with responseType 'blob' and returns the Blob", async () => {
    const mockBlob = new Blob(["mock-image-data"], { type: "image/png" })
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: mockBlob,
      status: 200,
      statusText: "OK",
      headers: {},
      config: {} as any,
    })

    const result = await fetchAuthenticatedBlob("/uploads/person/test.png")

    expect(apiClient.get).toHaveBeenCalledWith(
      expect.stringContaining("test.png"),
      expect.objectContaining({
        responseType: "blob",
      })
    )
    expect(result).toBe(mockBlob)
    expect(result.type).toBe("image/png")
  })

  it("forwards AbortSignal to client request", async () => {
    const controller = new AbortController()
    const mockBlob = new Blob(["test"], { type: "image/jpeg" })
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: mockBlob,
      status: 200,
      statusText: "OK",
      headers: {},
      config: {} as any,
    })

    await fetchAuthenticatedBlob("sample.jpg", controller.signal)

    expect(apiClient.get).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        signal: controller.signal,
      })
    )
  })

  it("throws error if response data is not a Blob", async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: { not: "a blob" },
      status: 200,
      statusText: "OK",
      headers: {},
      config: {} as any,
    })

    await expect(fetchAuthenticatedBlob("corrupted.jpg")).rejects.toThrow(
      "Expected binary Blob response from media endpoint."
    )
  })
})
