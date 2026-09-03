import { useMutation } from "@tanstack/react-query"
import { useAuth } from "../use-auth"
import type { RegisterCredentials } from "../types"

export function useRegister() {
  const { register } = useAuth()

  return useMutation({
    mutationFn: (credentials: RegisterCredentials) => register(credentials),
    retry: false,
  })
}
