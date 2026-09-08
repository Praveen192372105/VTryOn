import { useState, useEffect } from "react"
import { ImageFrame, type ImageFrameProps } from "./image-frame"
import { resolveMediaUrl } from "@/lib/utils/media-url"
import { fetchAuthenticatedBlob } from "@/lib/api"

export interface AuthenticatedImageProps extends ImageFrameProps {
  requireAuth?: boolean
}

/**
 * Image component that safely resolves media URLs and supports authenticated
 * blob fetching with guaranteed Object URL lifecycle cleanup to avoid token leaks
 * or unauthenticated media 401s.
 */
export function AuthenticatedImage({
  src,
  requireAuth = false,
  ...props
}: AuthenticatedImageProps) {
  const [resolvedSrc, setResolvedSrc] = useState<string | undefined>(() =>
    src && !requireAuth ? resolveMediaUrl(src) : undefined
  )
  const [authObjectUrl, setAuthObjectUrl] = useState<string | null>(null)
  const [authFailed, setAuthFailed] = useState(false)

  useEffect(() => {
    if (!src) {
      setResolvedSrc(undefined)
      setAuthFailed(false)
      return
    }

    const targetUrl = resolveMediaUrl(src)

    if (!requireAuth) {
      setResolvedSrc(targetUrl)
      setAuthFailed(false)
      return
    }

    // Authenticated blob loading lifecycle
    let isCancelled = false
    let currentObjectUrl: string | null = null
    setAuthFailed(false)

    fetchAuthenticatedBlob(targetUrl)
      .then((blob) => {
        if (!isCancelled && blob instanceof Blob) {
          currentObjectUrl = URL.createObjectURL(blob)
          setAuthObjectUrl(currentObjectUrl)
          setResolvedSrc(currentObjectUrl)
          setAuthFailed(false)
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setAuthFailed(true)
        }
      })

    return () => {
      isCancelled = true
      if (currentObjectUrl) {
        URL.revokeObjectURL(currentObjectUrl)
      }
    }
  }, [src, requireAuth])

  // Cleanup on final unmount if needed
  useEffect(() => {
    return () => {
      if (authObjectUrl) {
        URL.revokeObjectURL(authObjectUrl)
      }
    }
  }, [authObjectUrl])

  return (
    <ImageFrame
      src={resolvedSrc}
      isLoading={requireAuth && !resolvedSrc && !authFailed}
      hasError={authFailed}
      {...props}
    />
  )
}
