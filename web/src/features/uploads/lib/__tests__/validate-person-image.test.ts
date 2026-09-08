import { describe, it, expect } from "vitest"
import {
  validatePersonImagePreDecode,
  validatePersonImagePostDecode,
} from "../validate-person-image"
import { MAX_PERSON_UPLOAD_BYTES } from "../../constants"

describe("validatePersonImagePreDecode", () => {
  it("accepts valid JPEG file", () => {
    const file = new File(["dummy-content"], "portrait.jpg", { type: "image/jpeg" })
    const result = validatePersonImagePreDecode(file)
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it("accepts valid PNG file", () => {
    const file = new File(["dummy-content"], "portrait.png", { type: "image/png" })
    const result = validatePersonImagePreDecode(file)
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it("accepts valid WebP file", () => {
    const file = new File(["dummy-content"], "portrait.webp", { type: "image/webp" })
    const result = validatePersonImagePreDecode(file)
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it("rejects unsupported MIME type (e.g. GIF)", () => {
    const file = new File(["dummy-content"], "animation.gif", { type: "image/gif" })
    const result = validatePersonImagePreDecode(file)
    expect(result.isValid).toBe(false)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].code).toBe("unsupported-type")
  })

  it("rejects empty file (0 bytes)", () => {
    const file = new File([], "empty.jpg", { type: "image/jpeg" })
    const result = validatePersonImagePreDecode(file)
    expect(result.isValid).toBe(false)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].message).toContain("empty")
  })

  it("rejects file exceeding max size (12 MB)", () => {
    // Mock size property above 12 MB
    const file = new File(["a"], "huge.jpg", { type: "image/jpeg" })
    Object.defineProperty(file, "size", { value: MAX_PERSON_UPLOAD_BYTES + 1 })

    const result = validatePersonImagePreDecode(file)
    expect(result.isValid).toBe(false)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].code).toBe("too-large")
    expect(result.errors[0].message).toContain("12 MB")
  })
})

describe("validatePersonImagePostDecode", () => {
  it("accepts canonical portrait dimensions without warnings or errors", () => {
    const metadata = {
      width: 768,
      height: 1024,
      aspectRatio: 768 / 1024,
      format: "image/jpeg",
    }
    const result = validatePersonImagePostDecode(metadata)
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(result.warnings).toHaveLength(0)
  })

  it("rejects dimensions below minimum 256x256", () => {
    const metadata = {
      width: 200,
      height: 300,
      aspectRatio: 200 / 300,
      format: "image/jpeg",
    }
    const result = validatePersonImagePostDecode(metadata)
    expect(result.isValid).toBe(false)
    expect(result.errors[0].code).toBe("dimensions-too-small")
  })

  it("rejects dimensions above maximum 8192x8192", () => {
    const metadata = {
      width: 9000,
      height: 4000,
      aspectRatio: 9000 / 4000,
      format: "image/jpeg",
    }
    const result = validatePersonImagePostDecode(metadata)
    expect(result.isValid).toBe(false)
    expect(result.errors[0].code).toBe("dimensions-too-large")
  })

  it("rejects total pixel count exceeding 40 megapixels", () => {
    const metadata = {
      width: 7000,
      height: 6000, // 42,000,000 pixels
      aspectRatio: 7000 / 6000,
      format: "image/jpeg",
    }
    const result = validatePersonImagePostDecode(metadata)
    expect(result.isValid).toBe(false)
    expect(result.errors[0].code).toBe("pixel-limit-exceeded")
  })

  it("issues non-blocking warning for small images under 512px", () => {
    const metadata = {
      width: 400,
      height: 500,
      aspectRatio: 400 / 500,
      format: "image/jpeg",
    }
    const result = validatePersonImagePostDecode(metadata)
    expect(result.isValid).toBe(true) // Non-blocking
    expect(result.warnings).toHaveLength(1)
    expect(result.warnings[0].code).toBe("very-small")
  })

  it("issues non-blocking warning for wide landscape framing", () => {
    const metadata = {
      width: 1200,
      height: 800, // aspect ratio 1.5 > 1.2
      aspectRatio: 1200 / 800,
      format: "image/jpeg",
    }
    const result = validatePersonImagePostDecode(metadata)
    expect(result.isValid).toBe(true) // Non-blocking
    expect(result.warnings).toHaveLength(1)
    expect(result.warnings[0].code).toBe("wide-framing")
  })
})
