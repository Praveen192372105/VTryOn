import type { User, AuthTokens } from "../api/types"

export interface SessionTokens {
  accessToken: string
  refreshToken: string
}

export interface SessionData {
  user: User
  tokens: AuthTokens
}

/**
 * Validates whether the given tokens object contains legitimate, non-empty token strings.
 */
export function isValidSessionTokens(tokens: unknown): tokens is SessionTokens {
  if (!tokens || typeof tokens !== "object") return false
  const candidate = tokens as Record<string, unknown>
  return (
    typeof candidate.accessToken === "string" &&
    candidate.accessToken.trim().length > 0 &&
    typeof candidate.refreshToken === "string" &&
    candidate.refreshToken.trim().length > 0
  )
}
