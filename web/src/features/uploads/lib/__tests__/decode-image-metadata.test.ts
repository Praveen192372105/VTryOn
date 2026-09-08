import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { decodeImageMetadata } from "../decode-image-metadata"

describe("decodeImageMetadata", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("uses createImageBitmap when available and immediately closes the bitmap", async () => {
    const closeSpy = vi.fn()
    window.createImageBitmap = vi.fn().mockResolvedValue({
      width: 1024,
      height: 1536,
      close: closeSpy,
    })

    const file = new File(["dummy"], "model.jpg", { type: "image/jpeg" })
    const metadata = await decodeImageMetadata(file)

    expect(metadata.width).toBe(1024)
    expect(metadata.height).toBe(1536)
    expect(metadata.aspectRatio).toBeCloseTo(1024 / 1536)
    expect(closeSpy).toHaveBeenCalledTimes(1)
  })

  it("falls back to HTMLImageElement when createImageBitmap is not supported", async () => {
    // Delete createImageBitmap
    const originalCreateImageBitmap = window.createImageBitmap
    delete (window as unknown as { createImageBitmap?: unknown }).createImageBitmap

    const createObjectURLMock = vi.fn().mockReturnValue("blob:mock-url")
    const revokeObjectURLMock = vi.fn()
    window.URL.createObjectURL = createObjectURLMock
    window.URL.revokeObjectURL = revokeObjectURLMock

    // Mock Image constructor
    const originalImage = window.Image
    window.Image = class MockImage {
      naturalWidth = 800
      naturalHeight = 1200
      src = ""
      onload: (() => void) | null = null
      onerror: (() => void) | null = null

      constructor() {
        setTimeout(() => {
          if (this.onload) this.onload()
        }, 10)
      }
    } as unknown as typeof Image

    const file = new File(["dummy"], "model.png", { type: "image/png" })
    const metadata = await decodeImageMetadata(file)

    expect(metadata.width).toBe(800)
    expect(metadata.height).toBe(1200)
    expect(revokeObjectURLMock).toHaveBeenCalledWith("blob:mock-url")

    // Restore
    window.createImageBitmap = originalCreateImageBitmap
    window.Image = originalImage
  })
})
