import { apiClient } from "./client"
import { resolveMediaUrl } from "../utils/media-url"

/**
 * Streams private binary media content using authenticated transport.
 * Benefits from single-flight 401 refresh recovery, Authorization injection,
 * and Tracing Request ID headers without exposing tokens in URL query strings.
 */
export async function fetchAuthenticatedBlob(
  pathOrUrl: string,
  signal?: AbortSignal
): Promise<Blob> {
  const targetUrl = resolveMediaUrl(pathOrUrl)

  const response = await apiClient.get<Blob>(targetUrl, {
    responseType: "blob",
    signal,
  })

  if (!(response.data instanceof Blob)) {
    throw new Error("Expected binary Blob response from media endpoint.")
  }

  return response.data
}
