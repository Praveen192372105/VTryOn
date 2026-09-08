import { apiClient, apiRequest } from "@/lib/api/client"
import { authEndpoints } from "./endpoints"
import type { ApiSuccess, User } from "@/lib/api/types"

export async function getCurrentUser(): Promise<User> {
  return apiRequest<User>(apiClient.get<ApiSuccess<User>>(authEndpoints.me))
}
