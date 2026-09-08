import type { DecodedImageMetadata } from "../types"

/**
 * Decodes an image File locally in the browser to extract natural pixel dimensions
 * and aspect ratio without copying heavy byte buffers into React state.
 *
 * Employs `createImageBitmap` with immediate resource closure to prevent memory leaks,
 * falling back to `HTMLImageElement` with guaranteed object URL revocation.
 */
export async function decodeImageMetadata(file: File): Promise<DecodedImageMetadata> {
  // Method 1: Modern high-performance createImageBitmap
  if (typeof window !== "undefined" && typeof window.createImageBitmap === "function") {
    try {
      const bitmap = await window.createImageBitmap(file)
      const width = bitmap.width
      const height = bitmap.height
      // Immediate cleanup of underlying GPU/RAM bitmap memory
      bitmap.close()

      if (width > 0 && height > 0) {
        return {
          width,
          height,
          aspectRatio: width / height,
          format: file.type || "image/jpeg",
        }
      }
    } catch {
      // Fall through to HTMLImageElement fallback
    }
  }

  // Method 2: Standard HTMLImageElement fallback
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Image decoding is only supported in browser environments."))
      return
    }

    const objectUrl = URL.createObjectURL(file)
    const img = new Image()

    img.onload = () => {
      const width = img.naturalWidth
      const height = img.naturalHeight
      URL.revokeObjectURL(objectUrl)

      if (!width || !height) {
        reject(new Error("We couldn't read this image. Choose another JPEG, PNG or WebP file."))
        return
      }

      resolve({
        width,
        height,
        aspectRatio: width / height,
        format: file.type || "image/jpeg",
      })
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error("We couldn't read this image. Choose another JPEG, PNG or WebP file."))
    }

    img.src = objectUrl
  })
}
