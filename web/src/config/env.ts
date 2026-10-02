import { z } from "zod"

function resolveApiBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_BASE_URL
  if (envUrl && typeof envUrl === "string" && envUrl.trim() !== "") {
    return envUrl.trim().replace(/\/+$/, "")
  }
  if (typeof window !== "undefined" && window.location?.hostname) {
    const protocol = window.location.protocol || "http:"
    const host = window.location.hostname
    return `${protocol}//${host}:8000`
  }
  return "http://127.0.0.1:8000"
}

const envSchema = z.object({
  apiBaseUrl: z.string().url(),
})

export const env = envSchema.parse({
  apiBaseUrl: resolveApiBaseUrl(),
})

