import { z } from "zod"

const envSchema = z.object({
  apiBaseUrl: z.string().url(),
})

export const env = envSchema.parse({
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000",
})
