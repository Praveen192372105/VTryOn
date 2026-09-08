import { coordinateTokenRefresh } from "@/lib/api/refresh-coordinator"

export async function refreshToken(): Promise<string> {
  return coordinateTokenRefresh()
}
