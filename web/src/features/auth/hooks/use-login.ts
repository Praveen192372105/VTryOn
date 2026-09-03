import { useMutation } from "@tanstack/react-query"
import { useAuth } from "../use-auth"
import type { LoginCredentials } from "../types"

export function useLogin() {
  const { login } = useAuth()

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => login(credentials),
    retry: false,
  })
}
