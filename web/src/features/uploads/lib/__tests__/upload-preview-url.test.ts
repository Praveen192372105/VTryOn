import { describe, it, expect, vi } from "vitest"
import { PreviewUrlManager, safeRevokeObjectUrl } from "../upload-preview-url"

describe("PreviewUrlManager", () => {
  it("creates object URL and automatically revokes previous URL upon new file creation", () => {
    let count = 0
    window.URL.createObjectURL = vi.fn().mockImplementation(() => `blob:mock-url-${++count}`)
    const revokeMock = vi.fn()
    window.URL.revokeObjectURL = revokeMock

    const manager = new PreviewUrlManager()

    const file1 = new File(["a"], "a.jpg", { type: "image/jpeg" })
    const url1 = manager.create(file1)
    expect(url1).toBe("blob:mock-url-1")
    expect(manager.current).toBe("blob:mock-url-1")
    expect(revokeMock).not.toHaveBeenCalled()

    const file2 = new File(["b"], "b.jpg", { type: "image/jpeg" })
    const url2 = manager.create(file2)
    expect(url2).toBe("blob:mock-url-2")
    expect(revokeMock).toHaveBeenCalledWith("blob:mock-url-1")

    manager.revoke()
    expect(revokeMock).toHaveBeenCalledWith("blob:mock-url-2")
    expect(manager.current).toBeNull()
  })

  it("safeRevokeObjectUrl only revokes blob: URLs", () => {
    const revokeMock = vi.fn()
    window.URL.revokeObjectURL = revokeMock

    safeRevokeObjectUrl("https://example.com/image.jpg")
    expect(revokeMock).not.toHaveBeenCalled()

    safeRevokeObjectUrl("blob:test-url")
    expect(revokeMock).toHaveBeenCalledWith("blob:test-url")
  })
})
